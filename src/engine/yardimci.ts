import type { Tarih } from "./tipler";

export function gunEkle(tarih: Tarih, gun: number): Tarih {
  const d = new Date(`${tarih}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + gun);
  return d.toISOString().slice(0, 10);
}

/** mulberry32: küçük, hızlı, belirlenimci üreteç. [0, 1) aralığında değer ve yeni durumu döndürür. */
export function rastgele(rng: number): [number, number] {
  const yeni = (rng + 0x6d2b79f5) | 0;
  let t = yeni;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return [((t ^ (t >>> 14)) >>> 0) / 4294967296, yeni];
}

export const sikistir = (x: number, alt: number, ust: number) => Math.min(ust, Math.max(alt, x));
