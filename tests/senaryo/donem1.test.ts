/**
 * 1. dönem senaryosunun testleri: senaryo kuralları doğru çalışıyor mu.
 * Tarihsel doğruluk iddiası taşımaz; o testler tests/tarihsel altındadır.
 */
import { describe, it, expect } from "vitest";
import type { Durum } from "../../src/engine/tipler";
import { baslat, ilerle, kararVer, eylemYap, yapilabilirEylemler, senaryoyuDogrula, BEKLE } from "../../src/engine/motor";
import { olayiEtkileyenKararlar, kararinSonuclari } from "../../src/engine/nedensellik";
import { donem1Senaryosu, donem1Kapanisi } from "../../src/senaryo/donem1";
import { tarihselVeriyiYukle } from "../../src/data/yukle";

const senaryo = donem1Senaryosu();
const tarihsel = tarihselVeriyiYukle().olaylar;

function oyna(secimler: Record<string, string> = {}, tohum = 1): Durum {
  let d = ilerle(baslat(senaryo, tohum), senaryo);
  while (!d.bitti) {
    if (d.bekleyenKart) d = kararVer(d, senaryo, secimler[d.bekleyenKart] ?? BEKLE);
    d = ilerle(d, senaryo);
  }
  return d;
}

const TARIHSEL_YOL = {
  "kart-iskenderun": "itiraz",
  "kart-istanbul": "saray",
  "kart-cozum": "anadolu",
  "kart-mufettislik": "genis-yetki",
  "kart-izmir": "yola-cik",
};

describe("senaryo yapısı", () => {
  it("motor kurallarına uyar", () => {
    expect(() => senaryoyuDogrula(senaryo)).not.toThrow();
  });

  it("tarihsel verideki her olay senaryoda vardır ve gerçek tarihini taşır", () => {
    for (const t of tarihsel) {
      const o = senaryo.olaylar.find((x) => x.tarihselOlayId === t.id);
      expect(o, t.id).toBeDefined();
      expect(o!.tarih, t.id).toBe(t.tarih);
    }
  });

  it("senaryodaki tarihsel atıflar veride vardır", () => {
    const idler = new Set(tarihsel.map((t) => t.id));
    for (const o of senaryo.olaylar) if (o.tarihselOlayId) expect(idler.has(o.tarihselOlayId), o.id).toBe(true);
  });

  it("eylemlerdeki ve etkilerdeki kişiler ilişki tablosunda vardır", () => {
    const kisiler = new Set(Object.keys(senaryo.iliskiler));
    const etkiler = [
      ...senaryo.olaylar.flatMap((o) => [...o.etkiler, ...(o.kart?.secenekler.flatMap((s) => s.etkiler) ?? [])]),
      ...senaryo.eylemler.flatMap((e) => [...e.etkilerBasari, ...e.etkilerBasarisiz]),
    ];
    for (const e of etkiler) if (e.tur === "iliski") expect(kisiler.has(e.kisi), e.kisi).toBe(true);
    for (const e of senaryo.eylemler) if (e.basari?.kisi) expect(kisiler.has(e.basari.kisi), e.id).toBe(true);
  });

  it("beş karar kartı vardır ve hepsinde 'hiçbir şey yapma' bulunur", () => {
    const kartlar = senaryo.olaylar.filter((o) => o.kart);
    expect(kartlar.map((k) => k.id)).toEqual(["kart-iskenderun", "kart-istanbul", "kart-cozum", "kart-mufettislik", "kart-izmir"]);
    for (const k of kartlar) expect(k.kart!.secenekler[0]!.id).toBe(BEKLE);
  });
});

describe("tarihe en yakın yol", () => {
  const d = oyna(TARIHSEL_YOL);

  it("bütün tarihsel olaylar gerçek tarihinde gerçekleşir, hiçbiri alternatif değildir", () => {
    for (const t of tarihsel) {
      expect(d.gerceklesen[t.id], t.id).toBeDefined();
      expect(d.gerceklesen[t.id]!.tarih, t.id).toBe(t.tarih);
      expect(d.gerceklesen[t.id]!.alternatif, t.id).toBe(false);
    }
  });

  it("geniş yetkiyle Samsun kapanışına varır", () => {
    expect(donem1Kapanisi(d)).toBe("genis-yetkiyle-samsun");
    expect(d.kararlar.filter((k) => k.tur === "kart")).toHaveLength(5);
  });

  it("Samsun'a varışın neden zinciri oyuncunun kararlarına uzanır", () => {
    const k = olayiEtkileyenKararlar(d, "samsun");
    expect(k.dogrudan).toEqual([]);
    expect(k.dolayli.sort()).toEqual(["kart-izmir:yola-cik", "kart-mufettislik:genis-yetki"]);
  });
});

describe("tamamen pasif oyun", () => {
  const d = oyna();

  it("sonuna kadar ilerler ve İstanbul'da kalışla kapanır", () => {
    expect(d.bitti).toBe(true);
    expect(donem1Kapanisi(d)).toBe("istanbulda-kalis");
  });

  it("dünya oyuncusuz da ilerler: işgaller ve hükümet değişiklikleri gerçekleşir", () => {
    for (const id of ["musul-isgali", "meclis-feshi", "damat-ferit-kabinesi", "izmir-isgali", "antalya-isgali"]) {
      expect(d.gerceklesen[id], id).toBeDefined();
    }
  });

  it("Mustafa Kemal'in kendi adımları gerçekleşmez; müfettişlik teklifi hiç gelmez", () => {
    for (const id of ["iskenderun-itiraz", "vahdettin-gorusme", "minber", "erzurum-mektubu", "kart-mufettislik", "mufettislik-atamasi", "samsun"]) {
      expect(d.gerceklesmeyen[id], id).toBeDefined();
    }
    expect(d.kararlar.map((k) => k.id)).toEqual(["kart-iskenderun:bekle", "kart-istanbul:bekle", "kart-cozum:bekle"]);
  });

  it("kaçan fırsatın nedeni olarak pasif kalınan kartlar kaydedilir", () => {
    expect(olayiEtkileyenKararlar(d, "kart-mufettislik").dogrudan.sort()).toEqual(["kart-cozum:bekle", "kart-istanbul:bekle"]);
    expect(olayiEtkileyenKararlar(d, "samsun").dolayli).toContain("kart-istanbul:bekle");
    expect(kararinSonuclari(d, "kart-istanbul:bekle").gerceklesmeyenOlaylar).toEqual(
      expect.arrayContaining(["vahdettin-gorusme", "minber", "kart-mufettislik", "mufettislik-atamasi", "samsun"]),
    );
  });

  it("gerçekleşmeyen tarihsel olaylar oyuncuya alternatif tarih olarak bildirilir", () => {
    const h = d.oyuncuBilgisi.find((x) => x.olayId === "samsun");
    expect(h).toMatchObject({ durum: "gerceklesmedi", alternatif: true });
  });
});

describe("diğer kapanışlar", () => {
  it("teklifi reddetmek İstanbul'da kalışla sonuçlanır", () => {
    const d = oyna({ ...TARIHSEL_YOL, "kart-mufettislik": "reddet" });
    expect(donem1Kapanisi(d)).toBe("istanbulda-kalis");
    expect(olayiEtkileyenKararlar(d, "kart-izmir").dolayli).toEqual([]);
  });

  it("yolculuğu ertelemek gecikmeli çıkışla sonuçlanır ve alternatif tarih olarak işaretlenir", () => {
    const d = oyna({ ...TARIHSEL_YOL, "kart-izmir": "ertele" });
    expect(d.gerceklesen["istanbul-ayrilis"]).toMatchObject({ tarih: "1919-05-23", alternatif: true });
    expect(d.gerceklesen.samsun).toMatchObject({ tarih: "1919-05-26", alternatif: true });
    expect(donem1Kapanisi(d)).toBe("sinirli-ya-da-gecikmeli-samsun");
  });

  it("şartsız kabul sınırlı yetkili çıkışla sonuçlanır", () => {
    const d = oyna({ ...TARIHSEL_YOL, "kart-mufettislik": "kabul" });
    expect(donem1Kapanisi(d)).toBe("sinirli-ya-da-gecikmeli-samsun");
  });

  it("sarayın güveni düşükse geniş yetki talebi karşılanmaz", () => {
    const d = oyna({ ...TARIHSEL_YOL, "kart-iskenderun": "diren", "kart-istanbul": "ordu" });
    expect(d.gerceklesmeyen["genis-yetki-verildi"]).toBeDefined();
    expect(donem1Kapanisi(d)).toBe("sinirli-ya-da-gecikmeli-samsun");
  });

  it("sert direniş ve basın yolu gözetimle sonuçlanır; teklif gelmez ve nedeni kayıtlıdır", () => {
    const d = oyna({ ...TARIHSEL_YOL, "kart-iskenderun": "diren", "kart-istanbul": "basin" });
    expect(donem1Kapanisi(d)).toBe("gozetim");
    expect(d.gerceklesmeyen["kart-mufettislik"]).toBeDefined();
    expect(olayiEtkileyenKararlar(d, "kart-mufettislik").dolayli).toEqual([]);
    expect(d.gerceklesmeyen["kart-mufettislik"]!.nedenler).toContainEqual({ tur: "olay", id: "gozetim" });
  });

  it("izmir kartında beklemek atanmış olsa bile yola çıkmamak demektir", () => {
    const d = oyna({ ...TARIHSEL_YOL, "kart-izmir": BEKLE });
    expect(d.gerceklesen["mufettislik-atamasi"]).toBeDefined();
    expect(d.gerceklesmeyen.samsun).toBeDefined();
    expect(olayiEtkileyenKararlar(d, "istanbul-ayrilis").dogrudan).toEqual(["kart-izmir:bekle"]);
  });
});

describe("proaktif eylemler", () => {
  it("kartlarda pasif kalan ama görüşmeler yapan oyuncuya teklif gelebilir", () => {
    let teklifGelen = 0;
    for (let tohum = 0; tohum < 30; tohum++) {
      let d = ilerle(baslat(senaryo, tohum), senaryo);
      d = ilerle(kararVer(d, senaryo, BEKLE), senaryo);
      d = kararVer(d, senaryo, BEKLE);
      d = ilerle(d, senaryo, "1918-12-01");
      for (const e of ["fethi-gorusme", "rauf-gorusme", "karabekir-gorusme"]) d = eylemYap(d, senaryo, e);
      d = ilerle(d, senaryo);
      while (!d.bitti) {
        if (d.bekleyenKart === "kart-mufettislik") teklifGelen++;
        if (d.bekleyenKart) d = kararVer(d, senaryo, BEKLE);
        d = ilerle(d, senaryo);
      }
    }
    expect(teklifGelen).toBeGreaterThan(5);
    expect(teklifGelen).toBeLessThan(30);
  });

  it("eylemler yalnızca kendi zamanında yapılabilir", () => {
    const d0 = baslat(senaryo, 1);
    expect(yapilabilirEylemler(d0, senaryo)).toEqual([]);
    let d = ilerle(d0, senaryo);
    d = ilerle(kararVer(d, senaryo, "itiraz"), senaryo);
    d = ilerle(kararVer(d, senaryo, "basin"), senaryo, "1918-11-25");
    expect(yapilabilirEylemler(d, senaryo).sort()).toEqual(["fethi-gorusme", "karabekir-gorusme", "minber-demec", "rauf-gorusme"]);
  });

  it("aynı tohum ve aynı kararlar aynı sonucu verir", () => {
    expect(oyna(TARIHSEL_YOL, 5)).toEqual(oyna(TARIHSEL_YOL, 5));
  });
});
