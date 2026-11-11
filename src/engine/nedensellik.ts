/**
 * Nedensellik sorguları. Yalnızca motorun kaydettiği ilişkileri okur;
 * anlatım metninden hiçbir şey türetmez.
 */
import type { Durum, Neden } from "./tipler";

export interface ZincirHalkasi {
  neden: Neden;
  /** 1: doğrudan neden. 2 ve üzeri: başka olaylar üzerinden dolaylı neden. */
  derinlik: number;
}

function dolaysizNedenler(d: Durum, olayId: string): Neden[] {
  return d.gerceklesen[olayId]?.nedenler ?? d.gerceklesmeyen[olayId]?.nedenler ?? [];
}

function zinciriAc(d: Durum, baslangic: Neden[]): ZincirHalkasi[] {
  const sonuc = new Map<string, ZincirHalkasi>();
  const kuyruk: ZincirHalkasi[] = baslangic.map((neden) => ({ neden, derinlik: 1 }));
  while (kuyruk.length) {
    const h = kuyruk.shift()!;
    const anahtar = h.neden.tur === "tarihsel-akis" ? h.neden.tur : `${h.neden.tur}:${h.neden.id}`;
    if (sonuc.has(anahtar)) continue;
    sonuc.set(anahtar, h);
    if (h.neden.tur === "olay") {
      for (const n of dolaysizNedenler(d, h.neden.id)) kuyruk.push({ neden: n, derinlik: h.derinlik + 1 });
    }
  }
  return [...sonuc.values()];
}

/** Bir olayın (gerçekleşmiş ya da gerçekleşmemiş) neden zinciri. */
export function olayinZinciri(d: Durum, olayId: string): ZincirHalkasi[] {
  return zinciriAc(d, dolaysizNedenler(d, olayId));
}

/** Bir olayı etkileyen kararlar; doğrudan ve dolaylı olarak ayrılmış. */
export function olayiEtkileyenKararlar(d: Durum, olayId: string) {
  const kararlar = olayinZinciri(d, olayId).filter((h) => h.neden.tur === "karar");
  const kimlik = (h: ZincirHalkasi) => (h.neden.tur === "karar" ? h.neden.id : "");
  return {
    dogrudan: kararlar.filter((h) => h.derinlik === 1).map(kimlik),
    dolayli: kararlar.filter((h) => h.derinlik > 1).map(kimlik),
  };
}

/** Bir kararın etkilediği her şey: olaylar, gerçekleşmeyen olaylar ve gösterge değişimleri. */
export function kararinSonuclari(d: Durum, kararId: string) {
  const iceriyor = (nedenler: Neden[]) =>
    zinciriAc(d, nedenler).some((h) => h.neden.tur === "karar" && h.neden.id === kararId);
  return {
    gerceklesenOlaylar: Object.keys(d.gerceklesen).filter((id) => iceriyor(d.gerceklesen[id]!.nedenler)),
    gerceklesmeyenOlaylar: Object.keys(d.gerceklesmeyen).filter((id) => iceriyor(d.gerceklesmeyen[id]!.nedenler)),
    etkiler: d.etkiler.filter((e) => iceriyor(e.nedenler)),
  };
}
