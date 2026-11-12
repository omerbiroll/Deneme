/**
 * Zaman, olay ve karar motoru.
 *
 * Bütün işlevler saftır: girdi durumunu değiştirmez, yeni durum döndürür.
 * Sistem saati ve tohumsuz rastgelelik kullanılmaz; aynı senaryo, tohum ve
 * kararlar her zaman aynı durumu üretir.
 */
import type {
  Durum, Senaryo, OlayTanimi, Kosul, Etki, Neden, Tarih, Bildirim,
} from "./tipler";
import { gunEkle, rastgele, sikistir, ayEkle, sonrakiAyBasi } from "./yardimci";

export const BEKLE = "bekle";
const AKIS: Neden = { tur: "tarihsel-akis" };

/** Senaryonun kurallara uyduğunu denetler; uymuyorsa hata fırlatır. */
export function senaryoyuDogrula(s: Senaryo): void {
  const idler = new Set<string>();
  for (const o of s.olaylar) {
    if (idler.has(o.id)) throw new Error(`yinelenen olay kimliği: ${o.id}`);
    idler.add(o.id);
    if (o.kart && !o.kart.secenekler.some((x) => x.id === BEKLE)) {
      throw new Error(`"${o.id}" kartında "hiçbir şey yapma" (${BEKLE}) seçeneği yok`);
    }
    if (o.kart?.ikilem) {
      for (const x of o.kart.secenekler.filter((y) => y.id !== BEKLE)) {
        if (!x.kazanc || !x.bedel) throw new Error(`"${o.id}" ikilem kartında "${x.id}" seçeneğinin kazancı ya da bedeli yazılmamış`);
        const deltalar = x.etkiler.flatMap((e) => (e.tur === "gosterge" || e.tur === "iliski" ? [e.delta] : []));
        if (!deltalar.some((d) => d > 0) || !deltalar.some((d) => d < 0)) {
          throw new Error(`"${o.id}" ikilem kartında "${x.id}" seçeneği hem kazandırıp hem kaybettirmiyor`);
        }
      }
    }
    if (o.kart?.sure !== undefined && !(o.kart.sure > 0)) throw new Error(`"${o.id}" kartının süresi pozitif olmalı`);
    if (o.yanki && !s.olaylar.some((x) => x.kart?.secenekler.some((sc) => `${x.id}:${sc.id}` === o.yanki))) {
      throw new Error(`"${o.id}" olayının yankı kararı "${o.yanki}" bulunamadı`);
    }
    for (const dn of o.kart?.danismanlar ?? []) {
      if (!(dn.kisi in s.iliskiler)) throw new Error(`"${o.id}" kartındaki danışman "${dn.kisi}" ilişki tablosunda yok`);
      if (!o.kart!.secenekler.some((x) => x.id === dn.oneri)) throw new Error(`"${o.id}" kartında "${dn.kisi}" var olmayan bir seçeneği öneriyor`);
    }
    if (o.kosulSaglanmazsa === "bekle" && !o.sonTarih) {
      throw new Error(`"${o.id}" bekleyebilir ama son tarihi yok`);
    }
  }
  if (s.oncelik) {
    const o = s.oncelik;
    for (const a of o.alanlar) if (!(a in s.gostergeler)) throw new Error(`öncelik alanı "${a}" göstergeler arasında yok`);
    if (o.baslangicHavuz < o.havuzAralik[0] || o.baslangicHavuz > o.havuzAralik[1]) throw new Error("başlangıç havuzu aralığın dışında");
    o.esikler.forEach((e, i) => {
      if (e.asagi >= e.yukari) throw new Error(`${i + 1}. eşikte aşağı değer yukarı değerden küçük olmalı (titremeyi önlemek için)`);
      if (i > 0 && e.yukari <= o.esikler[i - 1]!.yukari) throw new Error("eşikler artan sırada olmalı");
    });
  }
  const eylemIdleri = new Set<string>();
  for (const e of s.eylemler) {
    if (eylemIdleri.has(e.id)) throw new Error(`yinelenen eylem kimliği: ${e.id}`);
    eylemIdleri.add(e.id);
  }
}

export function baslat(senaryo: Senaryo, tohum: number): Durum {
  senaryoyuDogrula(senaryo);
  return {
    senaryoId: senaryo.id,
    tarih: senaryo.baslangic,
    tohum,
    rng: tohum | 0,
    gostergeler: { ...senaryo.gostergeler },
    iliskiler: structuredClone(senaryo.iliskiler),
    bayraklar: {},
    gerceklesen: {},
    gerceklesmeyen: {},
    ertelemeler: {},
    kararlar: [],
    etkiler: [],
    bekleyenKart: null,
    gostergeSiniri: senaryo.gostergeSiniri,
    oncelik: {
      seviyeler: Object.fromEntries((senaryo.oncelik?.alanlar ?? []).map((a) => [a, 0])),
      esikSayisi: {},
      krizler: [],
      sonTik: senaryo.baslangic,
    },
    yoldakiHaberler: [],
    oyuncuBilgisi: [],
    bitti: false,
  };
}

function kosulSaglandi(d: Durum, k?: Kosul): boolean {
  if (!k) return true;
  return (
    (k.bayrakVar ?? []).every((b) => b in d.bayraklar) &&
    (k.bayrakYok ?? []).every((b) => !(b in d.bayraklar)) &&
    (k.olayOldu ?? []).every((o) => o in d.gerceklesen) &&
    (k.olayOlmadi ?? []).every((o) => !(o in d.gerceklesen)) &&
    Object.entries(k.gostergeEnAz ?? {}).every(([ad, enAz]) => (d.gostergeler[ad] ?? 0) >= enAz) &&
    Object.entries(k.gostergeEnFazla ?? {}).every(([ad, enFazla]) => (d.gostergeler[ad] ?? 0) <= enFazla)
  );
}

function tekil(nedenler: Neden[]): Neden[] {
  const gorulen = new Set<string>();
  return nedenler.filter((n) => {
    const a = n.tur === "tarihsel-akis" ? n.tur : `${n.tur}:${n.id}`;
    if (gorulen.has(a)) return false;
    gorulen.add(a);
    return true;
  });
}

/** Bir olayın gerçekleşmesini (ya da gerçekleşmemesini) belirleyen dolaysız nedenler. */
function olayinNedenleri(d: Durum, o: OlayTanimi, gerceklesti: boolean): Neden[] {
  const k = o.kosul ?? {};
  const n: Neden[] = [];
  if (gerceklesti) {
    for (const b of k.bayrakVar ?? []) n.push(...(d.bayraklar[b]?.nedenler ?? []));
    for (const id of k.olayOldu ?? []) n.push({ tur: "olay", id });
    n.push(...(d.ertelemeler[o.id]?.nedenler ?? []));
  } else {
    // Gerçekleşmeyi engelleyen: var olmaması gereken bayraklar ve gerçekleşmiş olması istenmeyen olaylar.
    for (const b of k.bayrakYok ?? []) n.push(...(d.bayraklar[b]?.nedenler ?? []));
    for (const id of k.olayOlmadi ?? []) if (id in d.gerceklesen) n.push({ tur: "olay", id });
    // Beklenen ama gerçekleşmemiş olaylar: zincir o olay üzerinden sürer.
    for (const id of k.olayOldu ?? []) {
      if (id in d.gerceklesmeyen) n.push({ tur: "olay", id });
    }
    // Kaçan fırsat: oyuncu ilgili kartta hiçbir şey yapmamayı seçtiyse bu seçim nedendir.
    for (const kartId of o.firsatKartlari ?? []) {
      const kararId = `${kartId}:${BEKLE}`;
      if (d.kararlar.some((k) => k.id === kararId)) n.push({ tur: "karar", id: kararId });
    }
  }
  const sonuc = tekil(n.filter((x) => x.tur !== "tarihsel-akis"));
  return sonuc.length ? sonuc : [AKIS];
}

function etkileriUygula(d: Durum, etkiler: Etki[], nedenler: Neden[]): void {
  for (const e of etkiler) {
    switch (e.tur) {
      case "gosterge": {
        const yeni = (d.gostergeler[e.ad] ?? 0) + e.delta;
        d.gostergeler[e.ad] = d.gostergeSiniri ? sikistir(yeni, d.gostergeSiniri[0], d.gostergeSiniri[1]) : yeni;
        d.etkiler.push({ tarih: d.tarih, hedef: `gosterge:${e.ad}`, delta: e.delta, nedenler });
        break;
      }
      case "havuz":
        d.oncelik.krizler.push({ bitis: ayEkle(d.tarih, e.ay), delta: e.delta });
        d.etkiler.push({ tarih: d.tarih, hedef: "havuz", delta: e.delta, nedenler });
        break;
      case "iliski": {
        const il = d.iliskiler[e.kisi];
        if (!il) throw new Error(`bilinmeyen kişi: ${e.kisi}`);
        il[e.alan] = sikistir(il[e.alan] + e.delta, 0, 100);
        d.etkiler.push({ tarih: d.tarih, hedef: `iliski:${e.kisi}:${e.alan}`, delta: e.delta, nedenler });
        break;
      }
      case "bayrak":
        if (!(e.ad in d.bayraklar)) d.bayraklar[e.ad] = { tarih: d.tarih, nedenler };
        break;
      case "engelle":
        if (!(e.olayId in d.gerceklesen) && !(e.olayId in d.gerceklesmeyen)) {
          d.gerceklesmeyen[e.olayId] = { tarih: d.tarih, nedenler };
        }
        break;
      case "ertele": {
        const onceki = d.ertelemeler[e.olayId];
        d.ertelemeler[e.olayId] = {
          gun: (onceki?.gun ?? 0) + e.gun,
          nedenler: tekil([...(onceki?.nedenler ?? []), ...nedenler]),
        };
        break;
      }
    }
  }
}

const etkinTarih = (d: Durum, o: OlayTanimi): Tarih =>
  gunEkle(o.tarih, d.ertelemeler[o.id]?.gun ?? 0);

const sonTarih = (d: Durum, o: OlayTanimi): Tarih | undefined =>
  o.sonTarih ? gunEkle(o.sonTarih, d.ertelemeler[o.id]?.gun ?? 0) : undefined;

const acik = (d: Durum, o: OlayTanimi) => !(o.id in d.gerceklesen) && !(o.id in d.gerceklesmeyen);

function haberEkle(d: Durum, o: OlayTanimi, durum: Bildirim["durum"], alternatif: boolean): void {
  d.yoldakiHaberler.push({
    olayId: o.id,
    olayTarihi: d.tarih,
    teslimTarihi: gunEkle(d.tarih, o.haberGecikmesiGun),
    onem: o.onem,
    durum,
    alternatif,
  });
}

function haberleriTeslimEt(d: Durum): void {
  const gelen = d.yoldakiHaberler.filter((h) => h.teslimTarihi <= d.tarih);
  if (!gelen.length) return;
  d.yoldakiHaberler = d.yoldakiHaberler.filter((h) => h.teslimTarihi > d.tarih);
  gelen.sort((a, b) => a.teslimTarihi.localeCompare(b.teslimTarihi));
  d.oyuncuBilgisi.push(...gelen);
}

function gerceklestir(d: Durum, o: OlayTanimi): void {
  const nedenler = olayinNedenleri(d, o, true);
  const alternatif = !o.tarihselOlayId || d.tarih !== o.tarih;
  d.gerceklesen[o.id] = { tarih: d.tarih, nedenler, alternatif };
  etkileriUygula(d, o.etkiler, [{ tur: "olay", id: o.id }]);
  haberEkle(d, o, "gerceklesti", alternatif);
  if (o.kart) d.bekleyenKart = o.id;
}

function iptalEt(d: Durum, o: OlayTanimi): void {
  d.gerceklesmeyen[o.id] = { tarih: d.tarih, nedenler: olayinNedenleri(d, o, false) };
  // Gerçek tarihte olmuş bir olayın gerçekleşmemesi her zaman tarihten sapmadır.
  haberEkle(d, o, "gerceklesmedi", true);
}

/** Tarihi gelmiş ve koşulu sağlanan ilk olayı işler. İşlenen bir şey varsa true döner. */
function vadesiGeleniIsle(d: Durum, s: Senaryo): boolean {
  const adaylar = s.olaylar
    .filter((o) => acik(d, o) && etkinTarih(d, o) <= d.tarih)
    .sort((a, b) => etkinTarih(d, a).localeCompare(etkinTarih(d, b)));
  for (const o of adaylar) {
    if (kosulSaglandi(d, o.kosul)) {
      gerceklestir(d, o);
      return true;
    }
    const son = sonTarih(d, o);
    if (o.kosulSaglanmazsa !== "bekle" || (son !== undefined && d.tarih >= son)) {
      iptalEt(d, o);
      return true;
    }
  }
  return false;
}

/** Öncelik sisteminin anlık durumu (artı havuzu, kullanılan artı, kapasite aşımı). */
export function seviyeToplam(d: Durum): number {
  return Object.values(d.oncelik.seviyeler).reduce((t, v) => t + v, 0);
}

export function havuz(d: Durum, s: Senaryo): number {
  const o = s.oncelik;
  if (!o) return 0;
  const esik = Object.values(d.oncelik.esikSayisi).reduce((t, v) => t + v, 0);
  const kriz = d.oncelik.krizler.filter((k) => k.bitis > d.tarih).reduce((t, k) => t + k.delta, 0);
  return sikistir(o.baslangicHavuz + esik + kriz, o.havuzAralik[0], o.havuzAralik[1]);
}

/** Dağıtılmış artılar havuzu aşıyorsa oyuncu bir alandan vazgeçmeden zaman ilerlemez. */
export const kapasiteAsimi = (d: Durum, s: Senaryo): boolean => !!s.oncelik && seviyeToplam(d) > havuz(d, s);

/** Bir alanın öncelik seviyesini ayarlar. Artırmak yalnızca havuz yetiyorsa mümkündür. */
export function oncelikAyarla(durum: Durum, senaryo: Senaryo, alan: string, seviye: number): Durum {
  const o = senaryo.oncelik;
  if (!o || !o.alanlar.includes(alan)) throw new Error(`"${alan}" öncelik verilebilen bir alan değil`);
  if (!Number.isInteger(seviye) || seviye < o.seviyeAralik[0] || seviye > o.seviyeAralik[1]) throw new Error(`seviye ${o.seviyeAralik[0]} ile ${o.seviyeAralik[1]} arasında olmalı`);
  const d = structuredClone(durum);
  const onceki = d.oncelik.seviyeler[alan] ?? 0;
  d.oncelik.seviyeler[alan] = seviye;
  if (seviye > onceki && seviyeToplam(d) > havuz(d, senaryo)) throw new Error("artı hakkın yetmiyor; önce başka bir alana eksi ver ya da bir artıdan vazgeç");
  return d;
}

function sonrakiTik(d: Durum, s: Senaryo): Tarih | undefined {
  if (!s.oncelik) return undefined;
  const t = sonrakiAyBasi(d.oncelik.sonTik);
  return t <= s.bitis ? t : undefined;
}

function esikleriDegerlendir(d: Durum, s: Senaryo): void {
  const o = s.oncelik!;
  for (const alan of o.alanlar) {
    const v = d.gostergeler[alan] ?? 0;
    let k = d.oncelik.esikSayisi[alan] ?? 0;
    const kaydet = (yon: "yukari" | "asagi", numara: number) => {
      const id = `esik:${alan}:${numara}:${yon}:${d.tarih}`;
      d.gerceklesen[id] = { tarih: d.tarih, nedenler: [{ tur: "oncelik", id: alan }], alternatif: false };
      d.yoldakiHaberler.push({ olayId: id, olayTarihi: d.tarih, teslimTarihi: d.tarih, onem: "buyuk", durum: "gerceklesti", alternatif: false });
    };
    while (k < o.esikler.length && v >= o.esikler[k]!.yukari) { k++; kaydet("yukari", k); }
    while (k > 0 && v < o.esikler[k - 1]!.asagi) { kaydet("asagi", k); k--; }
    d.oncelik.esikSayisi[alan] = k;
  }
}

/** Ay başı: öncelikler alanları değiştirir, krizler biter, eşikler değerlendirilir. */
function tikIsle(d: Durum, s: Senaryo): boolean {
  const t = sonrakiTik(d, s);
  if (t === undefined || d.tarih < t) return false;
  d.oncelik.sonTik = t;
  const o = s.oncelik!;
  for (const alan of o.alanlar) {
    const seviye = d.oncelik.seviyeler[alan] ?? 0;
    if (seviye !== 0) etkileriUygula(d, [{ tur: "gosterge", ad: alan, delta: seviye * o.aylikCarpan }], [{ tur: "oncelik", id: alan }]);
  }
  d.oncelik.krizler = d.oncelik.krizler.filter((k) => k.bitis > d.tarih);
  esikleriDegerlendir(d, s);
  return true;
}

/** Zamanın ileri gidebileceği bir sonraki an: yaklaşan olay, bekleyen olayın son tarihi ya da yoldaki haber. */
function sonrakiAn(d: Durum, s: Senaryo): Tarih | undefined {
  const anlar: Tarih[] = [];
  for (const o of s.olaylar) {
    if (!acik(d, o)) continue;
    const t = etkinTarih(d, o);
    if (t > d.tarih) anlar.push(t);
    const son = sonTarih(d, o);
    if (son !== undefined && son > d.tarih) anlar.push(son);
  }
  for (const h of d.yoldakiHaberler) if (h.teslimTarihi > d.tarih) anlar.push(h.teslimTarihi);
  const tik = sonrakiTik(d, s);
  if (tik !== undefined && tik > d.tarih) anlar.push(tik);
  return anlar.sort()[0];
}

/**
 * Zamanı ilerletir. Bir karar kartı çıkana, hedef tarihe varılana ya da senaryo
 * bitene kadar sürer. Bekleyen kart varken çağrılamaz.
 */
export function ilerle(durum: Durum, senaryo: Senaryo, hedefTarih?: Tarih): Durum {
  if (durum.bekleyenKart) throw new Error("bekleyen karar kartı var; önce karar verilmeli");
  if (kapasiteAsimi(durum, senaryo)) throw new Error("kapasite aşıldı; önce bir alandan vazgeçilmeli");
  if (durum.bitti) return durum;
  const d = structuredClone(durum);
  const hedef = hedefTarih && hedefTarih < senaryo.bitis ? hedefTarih : senaryo.bitis;

  for (;;) {
    haberleriTeslimEt(d);
    if (vadesiGeleniIsle(d, senaryo)) {
      if (d.bekleyenKart || kapasiteAsimi(d, senaryo)) return d;
      continue;
    }
    if (tikIsle(d, senaryo)) {
      if (kapasiteAsimi(d, senaryo)) return d;
      continue;
    }
    const an = sonrakiAn(d, senaryo);
    if (an === undefined || an > hedef) {
      d.tarih = hedef;
      haberleriTeslimEt(d);
      if (hedef === senaryo.bitis) d.bitti = true;
      return d;
    }
    d.tarih = an;
  }
}

/** Bekleyen karar kartına cevap verir. */
export function kararVer(durum: Durum, senaryo: Senaryo, secenekId: string): Durum {
  const kartId = durum.bekleyenKart;
  if (!kartId) throw new Error("bekleyen karar kartı yok");
  const olay = senaryo.olaylar.find((o) => o.id === kartId);
  const secenek = olay?.kart?.secenekler.find((x) => x.id === secenekId);
  if (!secenek) throw new Error(`"${kartId}" kartında "${secenekId}" seçeneği yok`);
  const d = structuredClone(durum);
  const kararId = `${kartId}:${secenekId}`;
  d.kararlar.push({ id: kararId, tur: "kart", kaynakId: kartId, secenekId, tarih: d.tarih });
  etkileriUygula(d, secenek.etkiler, [{ tur: "karar", id: kararId }]);
  // Çevrendekiler kararı görür: önerisini izleyene güven artar, izlemeyene azalır.
  if (secenekId !== BEKLE) {
    const tepkiler: Etki[] = (olay?.kart?.danismanlar ?? []).map((dn) => ({
      tur: "iliski" as const, kisi: dn.kisi, alan: "guven" as const, delta: dn.oneri === secenekId ? 4 : -2,
    }));
    etkileriUygula(d, tepkiler, [{ tur: "karar", id: kararId }]);
  }
  d.bekleyenKart = null;
  return d;
}

/** Oyuncunun o an yapabileceği proaktif eylemler. */
export function yapilabilirEylemler(durum: Durum, senaryo: Senaryo): string[] {
  if (durum.bitti) return [];
  return senaryo.eylemler
    .filter(
      (e) =>
        (!e.baslangic || durum.tarih >= e.baslangic) &&
        (!e.bitis || durum.tarih <= e.bitis) &&
        kosulSaglandi(durum, e.kosul) &&
        !(e.tekSefer && durum.kararlar.some((k) => k.tur === "eylem" && k.kaynakId === e.id)),
    )
    .map((e) => e.id);
}

/** Proaktif eylem yapar. Sonuç ilişkilere ve tohumlu rastgeleliğe bağlıdır. */
export function eylemYap(durum: Durum, senaryo: Senaryo, eylemId: string): Durum {
  if (!yapilabilirEylemler(durum, senaryo).includes(eylemId)) {
    throw new Error(`"${eylemId}" eylemi şu an yapılamaz`);
  }
  const eylem = senaryo.eylemler.find((e) => e.id === eylemId)!;
  const d = structuredClone(durum);
  let basarili = true;
  if (eylem.basari) {
    const { taban, kisi, alan } = eylem.basari;
    const iliski = kisi && alan ? (d.iliskiler[kisi]?.[alan] ?? 50) : 50;
    const olasilik = sikistir(taban + (iliski - 50) / 100, 0.05, 0.95);
    const [zar, yeniRng] = rastgele(d.rng);
    d.rng = yeniRng;
    basarili = zar < olasilik;
  }
  const sira = d.kararlar.filter((k) => k.kaynakId === eylemId).length + 1;
  const kararId = `${eylemId}#${sira}`;
  d.kararlar.push({
    id: kararId, tur: "eylem", kaynakId: eylemId,
    secenekId: basarili ? "basarili" : "basarisiz", tarih: d.tarih, basarili,
  });
  etkileriUygula(d, basarili ? eylem.etkilerBasari : eylem.etkilerBasarisiz, [{ tur: "karar", id: kararId }]);
  return d;
}
