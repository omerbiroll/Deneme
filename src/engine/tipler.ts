/**
 * Simülasyon motorunun tipleri.
 *
 * Bu katman tarihsel veriyi DEĞİŞTİRMEZ ve içermez; yalnızca tarihsel olay
 * kimliklerine atıf yapar. Senaryo tanımları oyun kuralıdır, tarih değildir.
 */

/** YYYY-AA-GG */
export type Tarih = string;

export interface Iliski {
  guven: number;
  sadakat: number;
  yakinlik: number;
  siyasiUyum: number;
}
export type IliskiAlani = keyof Iliski;

/** Bir sonucun dolaysız nedeni. */
export type Neden =
  | { tur: "karar"; id: string }
  | { tur: "olay"; id: string }
  | { tur: "tarihsel-akis" };

export interface Kosul {
  bayrakVar?: string[];
  bayrakYok?: string[];
  olayOldu?: string[];
  olayOlmadi?: string[];
  gostergeEnAz?: Record<string, number>;
}

export type Etki =
  | { tur: "gosterge"; ad: string; delta: number }
  | { tur: "iliski"; kisi: string; alan: IliskiAlani; delta: number }
  | { tur: "bayrak"; ad: string }
  | { tur: "engelle"; olayId: string }
  | { tur: "ertele"; olayId: string; gun: number };

export interface Secenek {
  id: string;
  ad: string;
  etkiler: Etki[];
}

export interface OlayTanimi {
  id: string;
  /** Gerçek tarihteki karşılığı (data/tarih/olaylar.json). Yoksa olay yalnızca simülasyona aittir. */
  tarihselOlayId?: string;
  /** Planlanan tarih; tarihsel olaylarda gerçek tarih. */
  tarih: Tarih;
  kosul?: Kosul;
  /** Koşul sağlanmazsa: bekle (sonTarih'e kadar yeniden denenir) ya da iptal. */
  kosulSaglanmazsa?: "bekle" | "iptal";
  sonTarih?: Tarih;
  etkiler: Etki[];
  onem: "buyuk" | "siradan";
  /** Haberin oyuncuya ulaşması için geçen gün sayısı. */
  haberGecikmesiGun: number;
  /** Varsa olay oyunu durdurur ve karar ister. "bekle" kimlikli seçenek zorunludur. */
  kart?: { secenekler: Secenek[] };
}

export interface EylemTanimi {
  id: string;
  ad: string;
  kosul?: Kosul;
  baslangic?: Tarih;
  bitis?: Tarih;
  /** Başarı olasılığı: taban + (ilişki değeri - 50) / 100, 0.05 ile 0.95 arasına sıkıştırılır. */
  basari?: { taban: number; kisi?: string; alan?: IliskiAlani };
  etkilerBasari: Etki[];
  etkilerBasarisiz: Etki[];
  /** Aynı eylem bir kez mi yapılabilir. */
  tekSefer: boolean;
}

export interface Senaryo {
  id: string;
  baslangic: Tarih;
  bitis: Tarih;
  gostergeler: Record<string, number>;
  iliskiler: Record<string, Iliski>;
  olaylar: OlayTanimi[];
  eylemler: EylemTanimi[];
}

export interface OlayKaydi {
  tarih: Tarih;
  nedenler: Neden[];
  /** Gerçek tarihten sapma: tarihsel karşılığı yok ya da farklı tarihte gerçekleşti. */
  alternatif: boolean;
}

export interface KararKaydi {
  id: string;
  tur: "kart" | "eylem";
  kaynakId: string;
  secenekId: string;
  tarih: Tarih;
  basarili?: boolean;
}

export interface EtkiKaydi {
  tarih: Tarih;
  hedef: string;
  delta: number;
  nedenler: Neden[];
}

export interface Bildirim {
  olayId: string;
  olayTarihi: Tarih;
  teslimTarihi: Tarih;
  onem: "buyuk" | "siradan";
  durum: "gerceklesti" | "gerceklesmedi";
  alternatif: boolean;
}

/** Simülasyonun gerçek durumu. Arayüz bunu doğrudan göstermez; `oyuncuBilgisi` gösterilir. */
export interface Durum {
  senaryoId: string;
  tarih: Tarih;
  tohum: number;
  rng: number;
  gostergeler: Record<string, number>;
  iliskiler: Record<string, Iliski>;
  bayraklar: Record<string, { tarih: Tarih; nedenler: Neden[] }>;
  gerceklesen: Record<string, OlayKaydi>;
  gerceklesmeyen: Record<string, { tarih: Tarih; nedenler: Neden[] }>;
  ertelemeler: Record<string, { gun: number; nedenler: Neden[] }>;
  kararlar: KararKaydi[];
  etkiler: EtkiKaydi[];
  bekleyenKart: string | null;
  /** Yolda olan haberler (oyuncu henüz bilmiyor). */
  yoldakiHaberler: Bildirim[];
  /** Oyuncuya ulaşmış haberler. */
  oyuncuBilgisi: Bildirim[];
  bitti: boolean;
}
