import { describe, it, expect } from "vitest";
import { bol, SOZLUK } from "../../src/ui/sozluk";
import { sonrasiSenaryosu } from "../../src/senaryo/sonrasi";

describe("terim sözlüğü", () => {
  it("parçalar birleşince özgün metin çıkar", () => {
    const m = "Genelkurmay Başkanı Çakmak, bütçe ve levazım konusunda kredi istedi.";
    expect(bol(m).map((p) => p.metin).join("")).toBe(m);
  });

  it("ekli ve küçük harfli biçimleri tanır", () => {
    expect(bol("Genelkurmay Başkanı Çakmak içeri girdi").find((p) => p.terim)?.terim).toBe("Genelkurmay Başkanı");
    expect(bol("yeni bir muhalefet partisine izin").find((p) => p.terim)?.terim).toBe("Muhalefet");
    expect(bol("tarafsızlık güvencesi").find((p) => p.terim)?.terim).toBe("Tarafsız");
    expect(bol("birliklerin levazımı gecikiyor").find((p) => p.terim)?.terim).toBe("Levazım");
  });

  it("sözcük ortasındaki eşleşmeyi terim saymaz", () => {
    expect(bol("Ankara'nın kabinet odası").some((p) => p.terim)).toBe(true);
    expect(bol("Nevali ve Ankaravali").some((p) => p.terim)).toBe(false);
  });

  it("senaryo metinlerindeki bulunan her terimin açıklaması vardır", () => {
    for (const o of sonrasiSenaryosu().olaylar) for (const p of bol(o.aciklama ?? "")) if (p.terim) expect(SOZLUK[p.terim]).toBeTruthy();
  });
});
