/**
 * Bir kararın doğrudan sonuçlarını motor kaydından çıkarır (sonuç kartı için).
 * Metin üretmez; hangi kişi ve alanın hangi yönde değiştiğini söyler.
 */
import type { Durum } from "./tipler";

export type SonucSatiri =
  | { tur: "iliski"; kisi: string; alan: string; delta: number }
  | { tur: "alan"; ad: string; delta: number };

export function sonucSatirlari(d: Durum, kararId: string): SonucSatiri[] {
  const sonuc: SonucSatiri[] = [];
  for (const e of d.etkiler) {
    if (!e.nedenler.some((n) => n.tur === "karar" && n.id === kararId)) continue;
    const parcalar = e.hedef.split(":");
    if (parcalar[0] === "iliski") sonuc.push({ tur: "iliski", kisi: parcalar[1]!, alan: parcalar[2]!, delta: e.delta });
    else if (parcalar[0] === "gosterge") sonuc.push({ tur: "alan", ad: parcalar[1]!, delta: e.delta });
  }
  return sonuc;
}
