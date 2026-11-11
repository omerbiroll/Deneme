/**
 * Karar kartlarının tasarım kuralları: seçenekler açık bir "doğru cevap" olmamalı,
 * çevredekilerin görüşü ilişkilere yansımalı, zor terimler açıklanabilmeli.
 */
import { describe, it, expect } from "vitest";
import type { Senaryo } from "../../src/engine/tipler";
import { baslat, ilerle, kararVer, senaryoyuDogrula, BEKLE } from "../../src/engine/motor";
import { donem1Senaryosu } from "../../src/senaryo/donem1";
import { bol, SOZLUK } from "../../src/ui/sozluk";

const senaryo = donem1Senaryosu();
const kart = (id: string) => senaryo.olaylar.find((o) => o.id === id)!.kart!;

describe("ikilemli kartlar", () => {
  it("senaryo doğrulamasından geçer", () => {
    expect(() => senaryoyuDogrula(senaryo)).not.toThrow();
  });

  it("İskenderun ve İstanbul kartları ikilemlidir; her seçenekte kazanç, bedel ve tepki yazılıdır", () => {
    for (const id of ["kart-iskenderun", "kart-istanbul"]) {
      const k = kart(id);
      expect(k.ikilem, id).toBe(true);
      for (const s of k.secenekler) {
        expect(s.tepki, `${id}:${s.id}`).toBeTruthy();
        if (s.id !== BEKLE) {
          expect(s.kazanc, `${id}:${s.id}`).toBeTruthy();
          expect(s.bedel, `${id}:${s.id}`).toBeTruthy();
        }
      }
    }
  });

  it("bedeli ya da kazancı olmayan seçeneği doğrulama reddeder", () => {
    const bozuk: Senaryo = {
      ...senaryo,
      olaylar: [{
        id: "x", tarih: "1918-11-05", etkiler: [], onem: "siradan", haberGecikmesiGun: 0,
        kart: { ikilem: true, secenekler: [
          { id: BEKLE, ad: "Hiçbir şey yapma", etkiler: [] },
          { id: "iyi", ad: "Hep kazandırır", kazanc: "a", bedel: "b", etkiler: [{ tur: "gosterge", ad: "nufuz", delta: 5 }] },
        ] },
      }],
    };
    expect(() => senaryoyuDogrula(bozuk)).toThrow(/kaybettirmiyor/);
  });

  it("kartlarda hiçbir seçenek bir göstergeyi tek başına yükseltip bedelsiz bırakmaz", () => {
    for (const id of ["kart-iskenderun", "kart-istanbul"]) {
      for (const s of kart(id).secenekler.filter((x) => x.id !== BEKLE)) {
        const deltalar = s.etkiler.flatMap((e) => (e.tur === "gosterge" ? [e.delta] : []));
        expect(Math.max(...deltalar), `${id}:${s.id}`).toBeGreaterThan(0);
        expect(Math.min(...deltalar), `${id}:${s.id}`).toBeLessThan(0);
      }
    }
  });
});

describe("çevredekilerin görüşü", () => {
  const istanbulKartinda = () => {
    let d = ilerle(baslat(senaryo, 1), senaryo);
    d = ilerle(kararVer(d, senaryo, "itiraz"), senaryo);
    expect(d.bekleyenKart).toBe("kart-istanbul");
    return d;
  };

  it("danışmanlar farklı seçenekleri önerir", () => {
    const oneriler = kart("kart-istanbul").danismanlar!.map((x) => x.oneri);
    expect(new Set(oneriler).size).toBe(oneriler.length);
  });

  it("önerisini izlediğin kişiye güven artar, izlemediğine azalır", () => {
    const d = kararVer(istanbulKartinda(), senaryo, "saray");
    expect(d.iliskiler.rauf!.guven).toBe(54);
    expect(d.iliskiler.fethi!.guven).toBe(48);
  });

  it("hiçbir şey yapmak güveni değiştirmez", () => {
    const d = kararVer(istanbulKartinda(), senaryo, BEKLE);
    expect(d.iliskiler.rauf!.guven).toBe(50);
    expect(d.iliskiler.fethi!.guven).toBe(50);
  });

  it("güven değişiminin nedeni karar olarak kaydedilir", () => {
    const d = kararVer(istanbulKartinda(), senaryo, "basin");
    const e = d.etkiler.filter((x) => x.hedef === "iliski:fethi:guven");
    expect(e).toHaveLength(1);
    expect(e[0]!.nedenler).toEqual([{ tur: "karar", id: "kart-istanbul:basin" }]);
  });
});

describe("terim sözlüğü", () => {
  it("parçalar birleşince özgün metin çıkar", () => {
    const m = "Mondros Mütarekesi'nin ardından Yıldırım Orduları Grubu'nun komutanı Harbiye Nezareti emrine verildi.";
    expect(bol(m).map((p) => p.metin).join("")).toBe(m);
  });

  it("ekli ve küçük harfli biçimleri tanır", () => {
    expect(bol("Mondros Mütarekesi'nin ardından").find((p) => p.terim)?.terim).toBe("Mütareke");
    expect(bol("kolordu komutanı").find((p) => p.terim)?.terim).toBe("Kolordu");
    expect(bol("İtilaf Devletleri geldi").find((p) => p.terim)?.terim).toBe("İtilaf Devletleri");
  });

  it("Türkçe ek alan sözcükleri de terim sayılır, başka sözcükler sayılmaz", () => {
    expect(bol("Mütarekeci olmayan bir söz Kolorduevi").filter((p) => p.terim)).toHaveLength(2);
    expect(bol("Sadrazamlık").find((p) => p.terim)?.terim).toBe("Sadrazam");
    expect(bol("Antakya'nın işgali").some((p) => p.terim)).toBe(false);
  });

  it("senaryodaki ve haberlerdeki zor terimlerin hepsi sözlükte vardır", () => {
    const metinler = senaryo.olaylar.flatMap((o) => [o.aciklama ?? ""]);
    for (const m of metinler) for (const p of bol(m)) if (p.terim) expect(SOZLUK[p.terim]).toBeTruthy();
  });
});
