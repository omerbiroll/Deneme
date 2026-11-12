/** Oyun durumunu arayüze bağlar: motor çağrıları, otomatik kayıt, ayarlar. */
import { useCallback, useEffect, useMemo, useState } from "react";
import type { Durum, Tarih } from "../engine/tipler";
import { baslat, ilerle, kararVer } from "../engine/motor";
import { gunEkle } from "../engine/yardimci";
import { sonrasiSenaryosu } from "../senaryo/sonrasi";
import { tarihselVeriyiYukle } from "../data/yukle";
import type { Veri } from "./metin";

const KAYIT = "ataturk-sim:kayit:v2";
const ACILIS = "ataturk-sim:acilis:v2";
const SURE = "ataturk-sim:sure:v2";

function oku(anahtar: string): string | null {
  try { return localStorage.getItem(anahtar); } catch { return null; }
}
function yaz(anahtar: string, deger: string): void {
  try { localStorage.setItem(anahtar, deger); } catch { /* Kayıt alanı kapalıysa oyun kayıtsız sürer. */ }
}

interface Kayit { durum: Durum; okunan: number }

function kayitOku(): Kayit | null {
  try {
    const k = JSON.parse(oku(KAYIT) ?? "null") as Kayit | null;
    return k?.durum?.senaryoId === "sonrasi-1938" ? k : null;
  } catch { return null; }
}

const yeniTohum = () => crypto.getRandomValues(new Uint32Array(1))[0]! | 0;

export function useOyun() {
  const senaryo = useMemo(() => sonrasiSenaryosu(), []);
  const veri = useMemo<Veri>(() => {
    const v = tarihselVeriyiYukle();
    return { olaylar: new Map(v.olaylar.map((o) => [o.id, o])), kaynaklar: new Map(v.kaynaklar.map((k) => [k.id, k])) };
  }, []);

  /** Yeni oyun: başlangıç gününün olayları (ilk kart) hemen açılır. */
  const yeniDurum = useCallback(() => ilerle(baslat(senaryo, yeniTohum()), senaryo, senaryo.baslangic), [senaryo]);
  const [kayit, setKayit] = useState<Kayit>(() => kayitOku() ?? { durum: yeniDurum(), okunan: 0 });
  const [acilisGoruldu, setAcilisGoruldu] = useState(() => oku(ACILIS) === "1" || kayitOku() !== null);
  const [sureAcik, setSureAcik] = useState(() => oku(SURE) !== "kapali");
  const { durum, okunan } = kayit;

  useEffect(() => { yaz(KAYIT, JSON.stringify(kayit)); }, [kayit]);

  const guncelle = useCallback((f: (d: Durum) => Durum) => setKayit((k) => ({ ...k, durum: f(k.durum) })), []);

  return {
    senaryo, veri, durum, acilisGoruldu, sureAcik,
    okunmamis: Math.max(0, durum.oyuncuBilgisi.length - okunan),
    haftaIlerle: () => guncelle((d) => (d.bekleyenKart || d.bitti ? d : ilerle(d, senaryo, gunEkle(d.tarih, 7) as Tarih))),
    kararaKadarIlerle: () => guncelle((d) => (d.bekleyenKart || d.bitti ? d : ilerle(d, senaryo))),
    /** Karar verir; aynı gün sıradaki kart varsa hemen açar. */
    kararVer: (secenekId: string) => guncelle((d) => ilerle(kararVer(d, senaryo, secenekId), senaryo, d.tarih)),
    okunduIsaretle: () => setKayit((k) => ({ ...k, okunan: k.durum.oyuncuBilgisi.length })),
    yeniOyun: () => { setKayit({ durum: yeniDurum(), okunan: 0 }); },
    acilisBitti: () => { yaz(ACILIS, "1"); setAcilisGoruldu(true); },
    sureDegistir: (acik: boolean) => { yaz(SURE, acik ? "acik" : "kapali"); setSureAcik(acik); },
  };
}

export type Oyun = ReturnType<typeof useOyun>;
