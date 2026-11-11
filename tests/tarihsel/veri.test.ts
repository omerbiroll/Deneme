/**
 * Tarihsel doğruluk testleri. Yazılım testlerinden ayrı tutulur.
 * Buradaki testler verinin iç tutarlılığını ve kaynak kuralını denetler;
 * bir bilginin tarihsel olarak doğru olduğunu kanıtlamaz.
 */
import { describe, it, expect } from "vitest";
import { tarihselVeriyiYukle } from "../../src/data/yukle";
import { OlaySemasi } from "../../src/data/sema";

const { kaynaklar, olaylar, karakterler } = tarihselVeriyiYukle();
const kaynakIdleri = new Set(kaynaklar.map((k) => k.id));
const karakterIdleri = new Set(karakterler.map((k) => k.id));

describe("tarihsel veri", () => {
  it("şemaya uyar ve boş değildir", () => {
    expect(kaynaklar.length).toBeGreaterThan(0);
    expect(olaylar.length).toBeGreaterThan(0);
    expect(karakterler.length).toBeGreaterThan(0);
  });

  it("kimlikler benzersizdir", () => {
    for (const liste of [kaynaklar, olaylar, karakterler]) {
      const idler = liste.map((x) => x.id);
      expect(new Set(idler).size).toBe(idler.length);
    }
  });

  it("her olay ve karakter var olan bir kaynağa dayanır", () => {
    for (const kayit of [...olaylar, ...karakterler]) {
      for (const atif of kayit.kaynaklar) {
        expect(kaynakIdleri.has(atif.kaynakId), `${kayit.id} → ${atif.kaynakId}`).toBe(true);
      }
    }
  });

  it("olaylardaki kişiler karakter listesinde vardır", () => {
    for (const olay of olaylar) {
      for (const kisi of olay.ilgiliKisiler) {
        expect(karakterIdleri.has(kisi), `${olay.id} → ${kisi}`).toBe(true);
      }
    }
  });

  it("olaylar 1. dönemin tarih aralığındadır ve sıralıdır", () => {
    const tarihler = olaylar.map((o) => o.tarih);
    expect([...tarihler].sort()).toEqual(tarihler);
    for (const t of tarihler) {
      expect(t >= "1918-10-30" && t <= "1919-05-19", t).toBe(true);
    }
  });

  it("tarihler gerçek takvim günleridir", () => {
    for (const o of olaylar) {
      const d = new Date(`${o.tarih}T00:00:00Z`);
      expect(d.toISOString().slice(0, 10), o.id).toBe(o.tarih);
    }
  });

  it("tartışmalı olaylar tartışma notu taşır", () => {
    for (const o of olaylar.filter((x) => x.tartismali)) {
      expect(o.tartismaNotu?.length ?? 0, o.id).toBeGreaterThan(20);
    }
  });
});

describe("şema kuralları", () => {
  const gecerli = {
    id: "ornek", tarih: "1918-11-01", tarihKesinligi: "gun", ad: "Örnek olay",
    aciklama: "Yalnızca şema testinde kullanılan örnek kayıt.", ilgiliKisiler: [],
    kaynaklar: [{ kaynakId: "bir-kaynak" }], dogrulama: "tam-metin", tartismali: false,
  };

  it("kaynaksız olayı reddeder", () => {
    expect(OlaySemasi.safeParse({ ...gecerli, kaynaklar: [] }).success).toBe(false);
  });

  it("notsuz tartışmalı olayı reddeder", () => {
    expect(OlaySemasi.safeParse({ ...gecerli, tartismali: true }).success).toBe(false);
  });

  it("geçerli olayı kabul eder", () => {
    expect(OlaySemasi.safeParse(gecerli).success).toBe(true);
  });
});
