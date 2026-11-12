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

const sonGun = (y: number, m: number) => new Date(Date.UTC(y, m, 0)).getUTCDate();

/** Verilen günden sonraki ilk ay başı (YYYY-AA-01). */
export function sonrakiAyBasi(tarih: Tarih): Tarih {
  const [y, m] = tarih.split("-").map(Number) as [number, number];
  return new Date(Date.UTC(y, m, 1)).toISOString().slice(0, 10);
}

/** Tarihe ay ekler; hedef ayın son gününü aşmaz. */
export function ayEkle(tarih: Tarih, ay: number): Tarih {
  const [y, m, g] = tarih.split("-").map(Number) as [number, number, number];
  const hedef = new Date(Date.UTC(y, m - 1 + ay, 1));
  const gun = Math.min(g, sonGun(hedef.getUTCFullYear(), hedef.getUTCMonth() + 1));
  return new Date(Date.UTC(hedef.getUTCFullYear(), hedef.getUTCMonth(), gun)).toISOString().slice(0, 10);
}
