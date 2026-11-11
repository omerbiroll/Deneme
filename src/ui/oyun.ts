/** Oyun durumunu arayüze bağlar: motor çağrıları, otomatik kayıt, okunmamış haber sayacı. */
import { useCallback, useEffect, useMemo, useState } from "react";
import type { Durum, Tarih } from "../engine/tipler";
import { baslat, ilerle, kararVer, eylemYap, yapilabilirEylemler } from "../engine/motor";
import { gunEkle } from "../engine/yardimci";
import { donem1Senaryosu } from "../senaryo/donem1";
import { tarihselVeriyiYukle } from "../data/yukle";
import type { Veri } from "./metin";

const ANAHTAR = "ataturk-sim:otomatik-kayit:v1";

interface Kayit {
  durum: Durum;
  okunan: number;
}

function kayitOku(): Kayit | null {
  try {
    const ham = localStorage.getItem(ANAHTAR);
    if (!ham) return null;
    const k = JSON.parse(ham) as Kayit;
    return k?.durum?.senaryoId === "donem-1" ? k : null;
  } catch {
    return null;
  }
}

function yeniTohum(): number {
  return crypto.getRandomValues(new Uint32Array(1))[0]! | 0;
}

export function useOyun() {
  const senaryo = useMemo(() => donem1Senaryosu(), []);
  const veri = useMemo<Veri>(() => {
    const v = tarihselVeriyiYukle();
    return { olaylar: new Map(v.olaylar.map((o) => [o.id, o])), kaynaklar: new Map(v.kaynaklar.map((k) => [k.id, k])) };
  }, []);

  const [kayit, setKayit] = useState<Kayit>(() => kayitOku() ?? { durum: baslat(senaryo, yeniTohum()), okunan: 0 });
  const { durum, okunan } = kayit;

  useEffect(() => {
    try {
      localStorage.setItem(ANAHTAR, JSON.stringify(kayit));
    } catch {
      /* Kayıt alanı kapalıysa oyun kayıtsız sürer. */
    }
  }, [kayit]);

  const guncelle = useCallback((f: (d: Durum) => Durum) => setKayit((k) => ({ ...k, durum: f(k.durum) })), []);

  return {
    senaryo,
    veri,
    durum,
    okunmamis: Math.max(0, durum.oyuncuBilgisi.length - okunan),
    eylemler: yapilabilirEylemler(durum, senaryo),
    haftaIlerle: () => guncelle((d) => ilerle(d, senaryo, gunEkle(d.tarih, 7) as Tarih)),
    kararaKadarIlerle: () => guncelle((d) => ilerle(d, senaryo)),
    kararVer: (secenekId: string) => guncelle((d) => kararVer(d, senaryo, secenekId)),
    eylemYap: (eylemId: string) => guncelle((d) => eylemYap(d, senaryo, eylemId)),
    okunduIsaretle: () => setKayit((k) => ({ ...k, okunan: k.durum.oyuncuBilgisi.length })),
    yeniOyun: () => setKayit({ durum: baslat(senaryo, yeniTohum()), okunan: 0 }),
  };
}

export type Oyun = ReturnType<typeof useOyun>;
