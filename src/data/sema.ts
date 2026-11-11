/**
 * Tarihsel veri şeması.
 *
 * Bu katman yalnızca gerçek tarihi tutar. Simülasyon durumu, olay tetikleyicileri
 * ve oyun kuralları burada YER ALMAZ; onlar motor katmanındadır.
 */
import { z } from "zod";

const kimlik = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "kimlik küçük harf, rakam ve tire içermeli");
const tarih = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "tarih YYYY-AA-GG biçiminde olmalı");

export const KaynakSemasi = z.object({
  id: kimlik,
  baslik: z.string().min(3),
  yazar: z.string().optional(),
  yayin: z.string().min(2),
  /** birincil: belge, tutanak, antlaşma metni. akademik: hakemli yayın, üniversite. resmi: devlet kurumu yayını. */
  tur: z.enum(["birincil", "akademik", "resmi", "ansiklopedi"]),
  url: z.string().url(),
});

export const KaynakAtfiSemasi = z.object({
  kaynakId: kimlik,
  not: z.string().optional(),
});

/**
 * tam-metin: kaynağın kendisi okunarak doğrulandı.
 * arama-ozeti: yalnızca arama sonucundaki özetten alındı; kaynağın tam metni henüz okunmadı.
 */
export const DogrulamaSemasi = z.enum(["tam-metin", "arama-ozeti"]);

export const OlaySemasi = z
  .object({
    id: kimlik,
    tarih,
    /** gun: tarih kesin. ay: yalnızca ay biliniyor, gün yaklaşık. */
    tarihKesinligi: z.enum(["gun", "ay"]),
    ad: z.string().min(3),
    aciklama: z.string().min(10),
    yer: z.string().optional(),
    ilgiliKisiler: z.array(kimlik),
    kaynaklar: z.array(KaynakAtfiSemasi).min(1, "kaynaksız olay girilemez"),
    dogrulama: DogrulamaSemasi,
    tartismali: z.boolean(),
    tartismaNotu: z.string().optional(),
  })
  .refine((o) => !o.tartismali || !!o.tartismaNotu, {
    message: "tartışmalı olay için tartışma notu zorunlu",
  });

export const KarakterSemasi = z.object({
  id: kimlik,
  /** Dönemdeki adı (1934 Soyadı Kanunu öncesi). */
  ad: z.string().min(2),
  /** Sonradan aldığı soyadı; yalnızca tanıtım için. */
  soyadi: z.string().optional(),
  dogumYili: z.number().int().optional(),
  olumYili: z.number().int().optional(),
  /** 30 Ekim 1918 – 19 Mayıs 1919 arasındaki görev ve konumu. */
  donemdekiKonumu: z.string().min(5),
  kaynaklar: z.array(KaynakAtfiSemasi).min(1, "kaynaksız karakter girilemez"),
  dogrulama: DogrulamaSemasi,
});

export type Kaynak = z.infer<typeof KaynakSemasi>;
export type Olay = z.infer<typeof OlaySemasi>;
export type Karakter = z.infer<typeof KarakterSemasi>;
