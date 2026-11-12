/**
 * Metin katmanı: motorun hesapladığı durumu oyuncuya anlatır.
 * Sonuç belirlemez; yalnızca kayıtlı olanı yazıya döker.
 */
import type { Bildirim, Durum, KararKaydi, Senaryo, Tarih } from "../engine/tipler";
import type { Olay, Kaynak } from "../data/sema";

const AYLAR = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];

export function tarihYaz(t: Tarih): string {
  const [y, a, g] = t.split("-").map(Number) as [number, number, number];
  return `${g} ${AYLAR[a - 1]} ${y}`;
}
export function kisaTarih(t: Tarih): string {
  const [, a, g] = t.split("-").map(Number) as [number, number, number];
  return `${g} ${AYLAR[a - 1]}`;
}

/** İçeriğin türü. Arayüz üçünü görsel olarak ayırır. */
export type Etiket = "gercek" | "karsilastirma" | "simulasyon";

export interface Haber {
  anahtar: string;
  olayId: string;
  tarih: Tarih;
  teslim: Tarih;
  baslik: string;
  metin: string;
  etiket: Etiket;
  onemli: boolean;
  /** Bu haber şu kararın (kartId:seçenekId) gecikmiş sonucu. */
  yanki?: string;
  kaynak?: Kaynak;
  kaynakNotu?: string;
  tartismaNotu?: string;
}

export interface Veri {
  olaylar: Map<string, Olay>;
  kaynaklar: Map<string, Kaynak>;
}

/** Eşik haberleri: bir alan yeni bir aşamaya geçince ya da geriye düşünce gelir. Tasarım metnidir (simülasyon). */
const ESIK_METNI: Record<string, { yukari: string; asagi: string }> = {
  ekonomi: { yukari: "Üretim ve ticaret haberleri olumlu; devlet aynı anda daha fazla işe girişebiliyor.", asagi: "Üretim ve ticarette gerileme var; devletin harcayabileceği para daraldı." },
  ordu: { yukari: "Birliklerin donanımı ve hazırlığı gözle görülür biçimde düzeldi.", asagi: "Birliklerin donanımında ve hazırlığında eksikler belirginleşti." },
  egitim: { yukari: "Okullar ve kültür kurumlarında yeni açılımlar konuşuluyor.", asagi: "Okullar ve kültür kurumları geri planda kaldı." },
  disPolitika: { yukari: "Başkentler Ankara'nın sözünü daha çok dinliyor.", asagi: "Başkentler Ankara'nın tutumunu ciddiye almaz oldu." },
  halk: { yukari: "Halkın devlete yakınlığı arttı; kasabalardan olumlu haberler geliyor.", asagi: "Köylerde ve kasabalarda devletten uzaklaşma hissediliyor." },
  kurumlar: { yukari: "Meclis ve hukuk düzeni oturdu; devlet sensiz de ayakta kalacak gibi görünüyor.", asagi: "Kurumların zayıfladığı konuşuluyor." },
};

function esikHaberi(b: Bildirim): Haber {
  const [, alan = "", , yon = "yukari"] = b.olayId.split(":");
  const baslik = ALANLAR.find((a) => a.ad === alan)?.baslik ?? alan;
  const yukari = yon === "yukari";
  return {
    anahtar: `${b.olayId}:gerceklesti`, olayId: b.olayId, tarih: b.olayTarihi, teslim: b.teslimTarihi, onemli: true, etiket: "simulasyon",
    baslik: `${baslik}: ${yukari ? "yeni bir aşamaya geçtin" : "geriye düştün"}`,
    metin: `${ESIK_METNI[alan]?.[yukari ? "yukari" : "asagi"] ?? ""} Artı hakkın ${yukari ? "1 arttı" : "1 azaldı"}.`,
  };
}

export function haberYaz(b: Bildirim, senaryo: Senaryo, veri: Veri): Haber | null {
  if (b.olayId.startsWith("esik:")) return esikHaberi(b);
  const tanim = senaryo.olaylar.find((o) => o.id === b.olayId);
  if (!tanim || b.durum === "gerceklesmedi") return null;
  const ortak = { anahtar: `${b.olayId}:${b.durum}`, olayId: b.olayId, tarih: b.olayTarihi, teslim: b.teslimTarihi, onemli: b.onem === "buyuk" };
  const tarihsel = tanim.tarihselOlayId ? veri.olaylar.get(tanim.tarihselOlayId) : undefined;
  if (tarihsel) {
    const atif = tarihsel.kaynaklar[0]!;
    return {
      ...ortak, etiket: "gercek", baslik: tarihsel.ad, metin: tarihsel.aciklama,
      kaynak: veri.kaynaklar.get(atif.kaynakId), kaynakNotu: atif.not, tartismaNotu: tarihsel.tartismaNotu,
    };
  }
  if (tanim.kart || !tanim.ad) return null;
  return { ...ortak, etiket: "simulasyon", baslik: tanim.ad, metin: tanim.aciklama ?? "", yanki: tanim.yanki };
}

/** Atatürk'süz gerçek tarihte olanlar: yalnızca o günün tarihi geçince açılır. */
export function karsilastirmaHaberleri(d: Durum, veri: Veri): Haber[] {
  return [...veri.olaylar.values()]
    .filter((o) => o.tur === "karsilastirma" && o.tarih <= d.tarih)
    .map((o) => {
      const atif = o.kaynaklar[0]!;
      return {
        anahtar: `kars:${o.id}`, olayId: o.id, tarih: o.tarih, teslim: o.tarih, baslik: o.ad, metin: o.aciklama,
        etiket: "karsilastirma" as const, onemli: true, kaynak: veri.kaynaklar.get(atif.kaynakId), kaynakNotu: atif.not,
      };
    });
}

export function haberler(d: Durum, senaryo: Senaryo, veri: Veri): Haber[] {
  const akis = d.oyuncuBilgisi.map((b) => haberYaz(b, senaryo, veri)).filter((h): h is Haber => h !== null);
  return [...akis, ...karsilastirmaHaberleri(d, veri)].sort((a, b) => b.teslim.localeCompare(a.teslim) || b.tarih.localeCompare(a.tarih));
}

export function kararAdi(k: KararKaydi, senaryo: Senaryo): { baslik: string; secim: string } {
  const olay = senaryo.olaylar.find((o) => o.id === k.kaynakId);
  const secenek = olay?.kart?.secenekler.find((s) => s.id === k.secenekId);
  return { baslik: olay?.ad ?? k.kaynakId, secim: secenek?.ad ?? k.secenekId };
}

export const ALANLAR: { ad: string; baslik: string; aciklama: string }[] = [
  { ad: "ekonomi", baslik: "Ekonomi", aciklama: "Üretim, ticaret ve devletin mali gücü." },
  { ad: "ordu", baslik: "Ordu", aciklama: "Birliklerin donanımı ve hazırlığı." },
  { ad: "egitim", baslik: "Eğitim ve kültür", aciklama: "Okullar, bilim ve kültür kurumları." },
  { ad: "disPolitika", baslik: "Dış politika", aciklama: "Diğer devletlerle ilişkiler ve güven." },
  { ad: "halk", baslik: "Halk ve köy", aciklama: "Halkın geçimi ve devlete yakınlığı." },
  { ad: "kurumlar", baslik: "Hukuk ve kurumlar", aciklama: "Meclis, hukuk ve devletin sensiz ayakta kalma gücü." },
];

export const KISILER: Record<string, string> = { bayar: "Celal Bayar", cakmak: "Fevzi Çakmak", inonu: "İsmet İnönü" };
const KISI_SAHIPLIK: Record<string, string> = { bayar: "Celal Bayar'ın", cakmak: "Fevzi Çakmak'ın", inonu: "İsmet İnönü'nün" };
const ILISKI_ALANI: Record<string, string> = { guven: "güveni", sadakat: "sadakati", yakinlik: "yakınlığı", siyasiUyum: "siyasi uyumu" };

export function alanCumlesi(ad: string, delta: number): string {
  const baslik = ALANLAR.find((a) => a.ad === ad)?.baslik ?? ad;
  const guclu = Math.abs(delta) >= 6 ? "belirgin biçimde " : "";
  return `${baslik} ${guclu}${delta > 0 ? "gelişti" : "geriledi"}`;
}
export function iliskiCumlesi(kisi: string, alan: string, delta: number): string {
  return `${KISI_SAHIPLIK[kisi] ?? kisi} sana ${ILISKI_ALANI[alan] ?? alan} ${delta > 0 ? "arttı" : "azaldı"}`;
}

export interface SemaDugumu {
  kartId: string;
  kartAd: string;
  tarih: Tarih;
  secenekler: { id: string; ad: string; secildi: boolean }[];
}

/** Bölüm sonu şeması: oynadığın kartlar ve her kartta seçtiğin ve seçmediğin yol. */
export function akisSemasi(d: Durum, senaryo: Senaryo) {
  const oynanan: SemaDugumu[] = senaryo.olaylar
    .filter((o) => o.kart && o.id in d.gerceklesen)
    .map((o) => ({
      kartId: o.id, kartAd: o.ad ?? o.id, tarih: d.gerceklesen[o.id]!.tarih,
      secenekler: o.kart!.secenekler.map((s) => ({ id: s.id, ad: s.ad, secildi: d.kararlar.some((k) => k.id === `${o.id}:${s.id}`) })),
    }));
  return {
    oynanan,
    gorulmeyenKart: senaryo.olaylar.filter((o) => o.kart && !(o.id in d.gerceklesen)).length,
    gorulmeyenSecenek: oynanan.reduce((t, n) => t + n.secenekler.filter((s) => !s.secildi).length, 0),
  };
}

/** Altı ayın özeti: motorun hesapladığı değişimlerden, anlatım olmadan. */
export function alanOzeti(d: Durum, senaryo: Senaryo): { artan?: string; azalan?: string } {
  const fark = ALANLAR.map((a) => ({ baslik: a.baslik, delta: (d.gostergeler[a.ad] ?? 0) - (senaryo.gostergeler[a.ad] ?? 0) }));
  const artan = [...fark].sort((x, y) => y.delta - x.delta)[0];
  const azalan = [...fark].sort((x, y) => x.delta - y.delta)[0];
  return {
    artan: artan && artan.delta > 0 ? `${artan.baslik} (+${artan.delta})` : undefined,
    azalan: azalan && azalan.delta < 0 ? `${azalan.baslik} (${azalan.delta})` : undefined,
  };
}
