/**
 * Motor testleri. Buradaki senaryo yalnızca test içindir; tarihsel içerik taşımaz.
 */
import { describe, it, expect } from "vitest";
import type { Senaryo, Durum } from "../../src/engine/tipler";
import { baslat, ilerle, kararVer, eylemYap, yapilabilirEylemler, senaryoyuDogrula, BEKLE } from "../../src/engine/motor";
import { olayiEtkileyenKararlar, kararinSonuclari } from "../../src/engine/nedensellik";

const senaryo: Senaryo = {
  id: "test",
  baslangic: "1900-01-01",
  bitis: "1900-03-01",
  gostergeler: { nufuz: 50 },
  iliskiler: { dost: { guven: 50, sadakat: 50, yakinlik: 50, siyasiUyum: 50 } },
  olaylar: [
    { id: "acilis", tarihselOlayId: "t-acilis", tarih: "1900-01-05", etkiler: [{ tur: "gosterge", ad: "nufuz", delta: -5 }], onem: "siradan", haberGecikmesiGun: 3 },
    {
      id: "teklif", tarihselOlayId: "t-teklif", tarih: "1900-01-10", etkiler: [], onem: "buyuk", haberGecikmesiGun: 0,
      kart: {
        secenekler: [
          { id: BEKLE, ad: "Hiçbir şey yapma", etkiler: [] },
          { id: "kabul", ad: "Kabul et", etkiler: [{ tur: "bayrak", ad: "kabul-edildi" }, { tur: "gosterge", ad: "nufuz", delta: 10 }] },
          { id: "engelle", ad: "Engelle", etkiler: [{ tur: "engelle", olayId: "toplanti" }] },
          { id: "oyala", ad: "Oyala", etkiler: [{ tur: "ertele", olayId: "toplanti", gun: 7 }] },
        ],
      },
    },
    { id: "toplanti", tarihselOlayId: "t-toplanti", tarih: "1900-01-20", etkiler: [{ tur: "bayrak", ad: "toplandi" }], onem: "buyuk", haberGecikmesiGun: 2 },
    { id: "atama", tarih: "1900-01-25", kosul: { bayrakVar: ["kabul-edildi"] }, etkiler: [{ tur: "bayrak", ad: "atandi" }], onem: "buyuk", haberGecikmesiGun: 1 },
    { id: "yanki", tarih: "1900-02-01", kosul: { olayOldu: ["atama"] }, etkiler: [{ tur: "gosterge", ad: "nufuz", delta: 3 }], onem: "siradan", haberGecikmesiGun: 1 },
    { id: "gec-gelen", tarih: "1900-01-12", kosul: { bayrakVar: ["toplandi"] }, kosulSaglanmazsa: "bekle", sonTarih: "1900-02-10", etkiler: [], onem: "siradan", haberGecikmesiGun: 0 },
    { id: "dagilma", tarih: "1900-02-05", kosul: { olayOldu: ["toplanti"] }, etkiler: [], onem: "siradan", haberGecikmesiGun: 0 },
  ],
  eylemler: [
    {
      id: "gorusme", ad: "Dostla görüş", tekSefer: false, basari: { taban: 0.5, kisi: "dost", alan: "guven" },
      etkilerBasari: [{ tur: "iliski", kisi: "dost", alan: "guven", delta: 10 }],
      etkilerBasarisiz: [{ tur: "iliski", kisi: "dost", alan: "guven", delta: -5 }],
    },
    { id: "tek-atim", ad: "Bir kez yapılır", tekSefer: true, baslangic: "1900-01-08", bitis: "1900-01-15", etkilerBasari: [{ tur: "bayrak", ad: "yapildi" }], etkilerBasarisiz: [] },
  ],
};

/** Her kartta verilen seçeneği (yoksa "bekle") seçerek sonuna kadar oynar. */
function oyna(tohum: number, secimler: Record<string, string> = {}): Durum {
  let d = ilerle(baslat(senaryo, tohum), senaryo);
  while (!d.bitti) {
    if (d.bekleyenKart) d = kararVer(d, senaryo, secimler[d.bekleyenKart] ?? BEKLE);
    d = ilerle(d, senaryo);
  }
  return d;
}

describe("zaman ve olaylar", () => {
  it("tamamen pasif oyun sonuna kadar ilerler", () => {
    const d = oyna(1);
    expect(d.bitti).toBe(true);
    expect(d.tarih).toBe(senaryo.bitis);
    expect(d.kararlar).toEqual([{ id: "teklif:bekle", tur: "kart", kaynakId: "teklif", secenekId: BEKLE, tarih: "1900-01-10" }]);
  });

  it("pasif kalmanın sonucu olur: koşulu oyuncuya bağlı olay gerçekleşmez", () => {
    const d = oyna(1);
    expect("atama" in d.gerceklesen).toBe(false);
    expect("atama" in d.gerceklesmeyen).toBe(true);
    expect("yanki" in d.gerceklesmeyen).toBe(true);
    expect("toplanti" in d.gerceklesen).toBe(true);
  });

  it("olay koşulu sağlanınca tarihinde gerçekleşir", () => {
    const d = oyna(1, { teklif: "kabul" });
    expect(d.gerceklesen.atama?.tarih).toBe("1900-01-25");
    expect(d.gerceklesen.yanki?.tarih).toBe("1900-02-01");
  });

  it("koşulu geç sağlanan olay gecikmeli gerçekleşir; tarihsel karşılığı olmayan olay alternatif sayılır", () => {
    const d = oyna(1);
    expect(d.gerceklesen["gec-gelen"]?.tarih).toBe("1900-01-20");
    expect(d.gerceklesen["gec-gelen"]?.alternatif).toBe(true);
  });

  it("bekleyen olay son tarihte iptal olur", () => {
    const d = oyna(1, { teklif: "engelle" });
    expect(d.gerceklesmeyen["gec-gelen"]?.tarih).toBe("1900-02-10");
  });

  it("oyuncu bir olayı engelleyebilir ve buna bağlı olaylar da gerçekleşmez", () => {
    const d = oyna(1, { teklif: "engelle" });
    expect("toplanti" in d.gerceklesen).toBe(false);
    expect("dagilma" in d.gerceklesmeyen).toBe(true);
  });

  it("oyuncu bir olayı geciktirebilir; geciken tarihsel olay alternatif tarih olarak işaretlenir", () => {
    const d = oyna(1, { teklif: "oyala" });
    expect(d.gerceklesen.toplanti).toMatchObject({ tarih: "1900-01-27", alternatif: true });
    expect(oyna(1).gerceklesen.toplanti).toMatchObject({ tarih: "1900-01-20", alternatif: false });
  });

  it("hedef tarihe kadar ilerler ve orada durur", () => {
    const d = ilerle(baslat(senaryo, 1), senaryo, "1900-01-07");
    expect(d.tarih).toBe("1900-01-07");
    expect(d.bitti).toBe(false);
    expect(Object.keys(d.gerceklesen)).toEqual(["acilis"]);
  });
});

describe("karar kartları", () => {
  it("kart çıkınca oyun durur ve karar verilmeden ilerlemez", () => {
    const d = ilerle(baslat(senaryo, 1), senaryo);
    expect(d.bekleyenKart).toBe("teklif");
    expect(d.tarih).toBe("1900-01-10");
    expect(() => ilerle(d, senaryo)).toThrow();
  });

  it("geçersiz seçeneği ve kartsız kararı reddeder", () => {
    const d = ilerle(baslat(senaryo, 1), senaryo);
    expect(() => kararVer(d, senaryo, "yok")).toThrow();
    expect(() => kararVer(baslat(senaryo, 1), senaryo, BEKLE)).toThrow();
  });

  it("'hiçbir şey yapma' seçeneği olmayan kartı senaryo doğrulaması reddeder", () => {
    const bozuk: Senaryo = {
      ...senaryo,
      olaylar: [{ id: "x", tarih: "1900-01-02", etkiler: [], onem: "siradan", haberGecikmesiGun: 0, kart: { secenekler: [{ id: "evet", ad: "Evet", etkiler: [] }] } }],
    };
    expect(() => senaryoyuDogrula(bozuk)).toThrow(/hiçbir şey yapma/);
  });
});

describe("belirlenimcilik", () => {
  it("aynı tohum ve aynı kararlar aynı durumu üretir", () => {
    expect(oyna(42, { teklif: "kabul" })).toEqual(oyna(42, { teklif: "kabul" }));
  });

  it("farklı kararlar farklı durum üretir", () => {
    expect(oyna(42, { teklif: "kabul" })).not.toEqual(oyna(42));
  });

  it("girdi durumunu değiştirmez", () => {
    const d0 = baslat(senaryo, 7);
    const kopya = structuredClone(d0);
    const d1 = ilerle(d0, senaryo);
    kararVer(d1, senaryo, "kabul");
    eylemYap(d0, senaryo, "gorusme");
    expect(d0).toEqual(kopya);
  });

  it("eylem sonucu tohuma bağlıdır ve tekrarlanabilir", () => {
    const sonuc = (tohum: number) => eylemYap(baslat(senaryo, tohum), senaryo, "gorusme").kararlar[0]!.basarili;
    for (const t of [1, 2, 3, 4, 5]) expect(sonuc(t)).toBe(sonuc(t));
    const sonuclar = new Set(Array.from({ length: 40 }, (_, i) => sonuc(i)));
    expect(sonuclar.size).toBe(2);
  });
});

describe("eylemler ve ilişkiler", () => {
  it("ilişki başarı olasılığını etkiler", () => {
    const oran = (guven: number) => {
      let basari = 0;
      for (let t = 0; t < 400; t++) {
        const d = baslat(senaryo, t);
        d.iliskiler.dost!.guven = guven;
        if (eylemYap(d, senaryo, "gorusme").kararlar[0]!.basarili) basari++;
      }
      return basari / 400;
    };
    expect(oran(90)).toBeGreaterThan(oran(10) + 0.4);
  });

  it("ilişki değerleri 0-100 arasında kalır ve doğru yönde değişir", () => {
    let d = baslat(senaryo, 3);
    for (let i = 0; i < 30; i++) d = eylemYap(d, senaryo, "gorusme");
    const g = d.iliskiler.dost!.guven;
    expect(g).toBeGreaterThanOrEqual(0);
    expect(g).toBeLessThanOrEqual(100);
    const ilk = eylemYap(baslat(senaryo, 3), senaryo, "gorusme");
    expect(ilk.iliskiler.dost!.guven).toBe(ilk.kararlar[0]!.basarili ? 60 : 45);
  });

  it("eylem yalnızca kendi zaman aralığında ve tek seferlikse bir kez yapılabilir", () => {
    const d0 = baslat(senaryo, 1);
    expect(yapilabilirEylemler(d0, senaryo)).toEqual(["gorusme"]);
    expect(() => eylemYap(d0, senaryo, "tek-atim")).toThrow();
    const d1 = ilerle(d0, senaryo, "1900-01-09");
    expect(yapilabilirEylemler(d1, senaryo)).toContain("tek-atim");
    const d2 = eylemYap(d1, senaryo, "tek-atim");
    expect(yapilabilirEylemler(d2, senaryo)).not.toContain("tek-atim");
  });
});

describe("bilgi katmanı", () => {
  it("haber oyuncuya gecikmeyle ulaşır", () => {
    const d1 = ilerle(baslat(senaryo, 1), senaryo, "1900-01-07");
    expect(d1.gerceklesen.acilis).toBeDefined();
    expect(d1.oyuncuBilgisi).toEqual([]);
    expect(d1.yoldakiHaberler.map((h) => h.olayId)).toEqual(["acilis"]);
    const d2 = ilerle(d1, senaryo, "1900-01-08");
    expect(d2.oyuncuBilgisi.map((h) => h.olayId)).toEqual(["acilis"]);
    expect(d2.oyuncuBilgisi[0]).toMatchObject({ olayTarihi: "1900-01-05", teslimTarihi: "1900-01-08" });
  });

  it("oyun sonunda yolda haber kalmaz ve gerçekleşmeyen olay da haber olur", () => {
    const d = oyna(1);
    expect(d.yoldakiHaberler).toEqual([]);
    expect(d.oyuncuBilgisi.find((h) => h.olayId === "atama")).toMatchObject({ durum: "gerceklesmedi", alternatif: true });
  });
});

describe("nedensellik", () => {
  it("doğrudan ve dolaylı etkiyi ayırır", () => {
    const d = oyna(1, { teklif: "kabul" });
    expect(olayiEtkileyenKararlar(d, "atama")).toEqual({ dogrudan: ["teklif:kabul"], dolayli: [] });
    expect(olayiEtkileyenKararlar(d, "yanki")).toEqual({ dogrudan: [], dolayli: ["teklif:kabul"] });
  });

  it("oyuncunun etkilemediği olay tarihsel akışa bağlanır", () => {
    const d = oyna(1, { teklif: "kabul" });
    expect(d.gerceklesen.toplanti?.nedenler).toEqual([{ tur: "tarihsel-akis" }]);
    expect(olayiEtkileyenKararlar(d, "toplanti")).toEqual({ dogrudan: [], dolayli: [] });
  });

  it("engellenen olayın ve ona bağlı gerçekleşmeyen olayın nedeni karardır", () => {
    const d = oyna(1, { teklif: "engelle" });
    expect(olayiEtkileyenKararlar(d, "toplanti").dogrudan).toEqual(["teklif:engelle"]);
    expect(olayiEtkileyenKararlar(d, "dagilma").dogrudan).toEqual(["teklif:engelle"]);
  });

  it("geciken olayın nedeni geciktiren karardır", () => {
    const d = oyna(1, { teklif: "oyala" });
    expect(olayiEtkileyenKararlar(d, "toplanti").dogrudan).toEqual(["teklif:oyala"]);
  });

  it("bir kararın bütün sonuçları ileriye doğru izlenebilir", () => {
    const d = oyna(1, { teklif: "kabul" });
    const s = kararinSonuclari(d, "teklif:kabul");
    expect(s.gerceklesenOlaylar.sort()).toEqual(["atama", "yanki"]);
    expect(s.etkiler.map((e) => [e.hedef, e.delta])).toEqual([["gosterge:nufuz", 10], ["gosterge:nufuz", 3]]);
    expect(d.gostergeler.nufuz).toBe(50 - 5 + 10 + 3);
  });

  it("her gösterge ve ilişki değişikliği bir neden taşır", () => {
    let d = oyna(9, { teklif: "kabul" });
    d = eylemYap({ ...d, bitti: false }, senaryo, "gorusme");
    expect(d.etkiler.length).toBeGreaterThan(0);
    for (const e of d.etkiler) expect(e.nedenler.length).toBeGreaterThan(0);
  });
});
