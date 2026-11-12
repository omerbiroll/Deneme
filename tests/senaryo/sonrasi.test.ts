/**
 * Senaryo testleri: kartların tasarım kuralları ve seçimlerin gerçekten bir şeyi değiştirdiği.
 * Tarihsel doğruluk iddiası taşımaz; o testler tests/tarihsel altındadır.
 */
import { describe, it, expect } from "vitest";
import type { Durum } from "../../src/engine/tipler";
import { baslat, ilerle, kararVer, senaryoyuDogrula, BEKLE } from "../../src/engine/motor";
import { olayiEtkileyenKararlar } from "../../src/engine/nedensellik";
import { sonucSatirlari } from "../../src/engine/sonuc";
import { sonrasiSenaryosu } from "../../src/senaryo/sonrasi";
import { tarihselVeriyiYukle } from "../../src/data/yukle";

const senaryo = sonrasiSenaryosu();
const kartlar = senaryo.olaylar.filter((o) => o.kart);
const veri = tarihselVeriyiYukle();

function oyna(secimler: Record<string, string> = {}, tohum = 1): Durum {
  let d = ilerle(baslat(senaryo, tohum), senaryo);
  while (!d.bitti) {
    if (d.bekleyenKart) d = kararVer(d, senaryo, secimler[d.bekleyenKart] ?? BEKLE);
    d = ilerle(d, senaryo);
  }
  return d;
}

describe("senaryo yapısı", () => {
  it("motor kurallarına uyar", () => expect(() => senaryoyuDogrula(senaryo)).not.toThrow());

  it("gerçek dünya olayları senaryoda gerçek tarihinde vardır", () => {
    for (const o of veri.olaylar.filter((x) => x.tur === "dunya")) {
      const s = senaryo.olaylar.find((x) => x.tarihselOlayId === o.id);
      expect(s, o.id).toBeDefined();
      expect(s!.tarih).toBe(o.tarih);
    }
  });

  it("senaryodaki tarihsel atıflar veride vardır", () => {
    const idler = new Set(veri.olaylar.map((o) => o.id));
    for (const o of senaryo.olaylar) if (o.tarihselOlayId) expect(idler.has(o.tarihselOlayId), o.id).toBe(true);
  });

  it("her kartta 'hiçbir şey yapma' vardır ve kazanç, bedel, tepki yazılıdır", () => {
    expect(kartlar.length).toBeGreaterThanOrEqual(8);
    for (const k of kartlar) {
      const sec = k.kart!.secenekler;
      expect(sec.some((s) => s.id === BEKLE), k.id).toBe(true);
      for (const s of sec) {
        expect(s.tepki, `${k.id}:${s.id}`).toBeTruthy();
        if (s.id !== BEKLE) {
          expect(s.kazanc, `${k.id}:${s.id}`).toBeTruthy();
          expect(s.bedel, `${k.id}:${s.id}`).toBeTruthy();
        }
      }
    }
  });

  it("zamanlı anlar üç telgraf hamlesidir ve bedellerini gizler", () => {
    const zamanli = kartlar.filter((k) => k.kart!.sure);
    expect(zamanli.map((k) => k.id)).toEqual(["kart-telgraf-1", "kart-telgraf-2", "kart-telgraf-3"]);
    for (const k of zamanli) expect(k.kart!.gizliBedel).toBe(true);
  });

  it("danışmanlar farklı seçenekleri önerir", () => {
    for (const k of kartlar.filter((x) => x.kart!.danismanlar)) {
      const oneriler = k.kart!.danismanlar!.map((d) => d.oneri);
      expect(new Set(oneriler).size, k.id).toBe(oneriler.length);
    }
  });

  it("yankı sahneleri var olan bir karara bağlıdır", () => {
    const yankilar = senaryo.olaylar.filter((o) => o.yanki);
    expect(yankilar.length).toBeGreaterThanOrEqual(4);
  });
});

describe("seçimler gerçekten bir şeyi belirler (seçim yanılsaması dedektörü)", () => {
  /** Bir kartın seçeneklerinin her çifti, sonraki olay kümesini değiştirmeli. */
  const onKosul: Record<string, Record<string, string>> = { "kart-yanki-parca": { "kart-telgraf-3": "ingiltere" } };

  for (const k of kartlar) {
    it(`${k.id}: her seçeneğin yalnızca kendisine ait bir sonucu vardır`, () => {
      const kume = (secenekId: string) => {
        const d = oyna({ ...(onKosul[k.id] ?? {}), [k.id]: secenekId });
        return new Set(Object.keys(d.gerceklesen).filter((id) => id !== k.id));
      };
      const sec = k.kart!.secenekler.map((s) => s.id);
      const kumeler = sec.map(kume);
      sec.forEach((id, i) => {
        const digerleri = new Set(kumeler.filter((_, j) => j !== i).flatMap((x) => [...x]));
        const ozgun = [...kumeler[i]!].filter((e) => !digerleri.has(e));
        expect(ozgun.length, `${k.id}:${id} hiçbir şeyi tek başına değiştirmiyor`).toBeGreaterThan(0);
      });
    });
  }

  it("seçilen yol bayrak ve nedensellik kaydına işlenir", () => {
    const d = oyna({ "kart-iki-kapi": "ingiltere" });
    expect(d.gerceklesen["kart-iki-kapi:ingiltere:0"]).toBeDefined();
    expect(olayiEtkileyenKararlar(d, "kart-iki-kapi:ingiltere:1").dogrudan).toEqual(["kart-iki-kapi:ingiltere"]);
  });
});

describe("pasif oyun", () => {
  const d = oyna();

  it("sonuna kadar ilerler ve hiçbir karar verilmeden kayıtlı kalır", () => {
    expect(d.bitti).toBe(true);
    expect(d.tarih).toBe("1939-06-30");
    expect(d.kararlar.every((k) => k.secenekId === BEKLE)).toBe(true);
    expect(d.kararlar.length).toBeGreaterThanOrEqual(7);
  });

  it("dünya ilerler: gerçek dünya olayı gerçekleşir", () => {
    expect(d.gerceklesen.cekoslovakya).toBeDefined();
  });

  it("hiçbir şey yapmanın bedeli vardır: ihmal edilen alanlardan haberler gelir", () => {
    expect(d.gerceklesen.kis).toBeDefined();
    expect(d.gerceklesen["ordu-sikayeti"]).toBeDefined();
    expect(d.gostergeler.disPolitika).toBeLessThan(senaryo.gostergeler.disPolitika!);
  });

  it("ihmal edilen karardan sessiz bir yankı gelir", () => {
    expect(d.gerceklesen["yanki-bekle"]).toBeDefined();
  });
});

describe("koşullu olaylar", () => {
  it("halka yönelen oyuncuya kış haberi gelmez", () => {
    const d = oyna({ "kart-iki-davet": "gezi" });
    expect(d.gerceklesmeyen.kis).toBeDefined();
    expect(d.gerceklesen.kis).toBeUndefined();
  });

  it("yankı: Mart'ta İngiltere'yi seçen Haziran'da fabrika kartını görür", () => {
    const d = oyna({ "kart-telgraf-3": "ingiltere" });
    expect(d.gerceklesen["kart-yanki-parca"]).toBeDefined();
    expect(d.gerceklesen["yanki-berlin"]).toBeUndefined();
  });

  it("Berlin'i seçen farklı bir yankı görür", () => {
    const d = oyna({ "kart-telgraf-3": "berlin" });
    expect(d.gerceklesen["yanki-berlin"]).toBeDefined();
    expect(d.gerceklesen["kart-yanki-parca"]).toBeUndefined();
  });
});

describe("çevredekilerin görüşü ve sonuç kartı", () => {
  const kartta = () => ilerle(kararVer(ilerle(baslat(senaryo, 1), senaryo), senaryo, BEKLE), senaryo);

  it("önerisini izlediğin kişiye güven artar, izlemediğine azalır", () => {
    const d = kararVer(kartta(), senaryo, "almanya");
    expect(d.iliskiler.bayar!.guven).toBe(54);
    expect(d.iliskiler.cakmak!.guven).toBe(48);
  });

  it("sonuç kartı kararın doğrudan etkilerini listeler", () => {
    const d = kararVer(kartta(), senaryo, "ingiltere");
    const satirlar = sonucSatirlari(d, "kart-iki-kapi:ingiltere");
    expect(satirlar).toContainEqual({ tur: "alan", ad: "disPolitika", delta: 8 });
    expect(satirlar).toContainEqual({ tur: "alan", ad: "ekonomi", delta: -5 });
    expect(satirlar).toContainEqual({ tur: "iliski", kisi: "bayar", alan: "guven", delta: -2 });
  });
});

describe("dayanıklılık", () => {
  it("rastgele 300 yol: göstergeler makul kalır, oyun biter ve aynı yol aynı sonucu verir", () => {
    let t = 12345;
    const sans = () => ((t = (t * 1664525 + 1013904223) >>> 0) / 4294967296);
    for (let i = 0; i < 300; i++) {
      const secimler: Record<string, string> = {};
      for (const k of kartlar) {
        const sec = k.kart!.secenekler;
        secimler[k.id] = sec[Math.floor(sans() * sec.length)]!.id;
      }
      const d = oyna(secimler, i);
      expect(d.bitti).toBe(true);
      for (const [ad, v] of Object.entries(d.gostergeler)) expect(v >= 0 && v <= 100, `${ad}=${v}`).toBe(true);
      if (i < 5) expect(oyna(secimler, i)).toEqual(d);
    }
  });
});
