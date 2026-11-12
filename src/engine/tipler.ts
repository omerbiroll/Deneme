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
  | { tur: "oncelik"; id: string }
  | { tur: "tarihsel-akis" };

export interface Kosul {
  bayrakVar?: string[];
  bayrakYok?: string[];
  olayOldu?: string[];
  olayOlmadi?: string[];
  gostergeEnAz?: Record<string, number>;
  gostergeEnFazla?: Record<string, number>;
}

export type Etki =
  | { tur: "gosterge"; ad: string; delta: number }
  | { tur: "iliski"; kisi: string; alan: IliskiAlani; delta: number }
  | { tur: "bayrak"; ad: string }
  | { tur: "engelle"; olayId: string }
  | { tur: "ertele"; olayId: string; gun: number }
  /** Geçici kriz: artı havuzunu `ay` ay boyunca `delta` kadar değiştirir. */
  | { tur: "havuz"; delta: number; ay: number };

export interface Secenek {
  id: string;
  ad: string;
  aciklama?: string;
  /** Oyuncuya karar anında gösterilen kazanç ve bedel. İkilemli kartlarda zorunludur. */
  kazanc?: string;
  bedel?: string;
  /** Karardan hemen sonra gösterilen kısa tepki (simülasyon metni). */
  tepki?: string;
  /** Sonuç kartında "Kapı" olarak gösterilir: bu seçimle açılan ve kapanan imkânlar. */
  kapi?: { acildi?: string[]; kapandi?: string[] };
  etkiler: Etki[];
}

/** Karttaki bir kişinin görüşü. Kurgu diyalogdur; arayüzde her zaman "simülasyon" etiketi taşır. */
export interface Danisman {
  kisi: string;
  gorus: string;
  /** Bu kişinin önerdiği seçenek. Önerisini izlemek ya da izlememek aradaki güveni etkiler. */
  oneri: string;
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
  /**
   * Bu olayın gerçekleşmesi için fırsat sunan karar kartları. Olay gerçekleşmezse ve oyuncu
   * bu kartlarda "hiçbir şey yapma"yı seçmişse, o seçim kaçan fırsatın nedeni olarak kaydedilir.
   */
  firsatKartlari?: string[];
  /** Oyuncuya gösterilecek kısa ad (tarihsel karşılığı olmayan olaylar için). */
  ad?: string;
  /** Yankı: bu olay, şu kararın (kartId:seçenekId) gecikmiş sonucudur. */
  yanki?: string;
  /** Kart metni: durumun kısa anlatımı. */
  aciklama?: string;
  /** Varsa olay oyunu durdurur ve karar ister. "bekle" kimlikli seçenek zorunludur. */
  kart?: {
    secenekler: Secenek[];
    danismanlar?: Danisman[];
    /** İkilemli kartta hiçbir seçenek hem kazançsız hem bedelsiz olamaz; senaryo doğrulaması bunu denetler. */
    ikilem?: boolean;
    /** Zamanlı an: saniye. Süre dolunca "hiçbir şey yapma" seçilir. */
    sure?: number;
    /** Zamanlı anlarda kazanç ve bedel karardan sonra açılır. */
    gizliBedel?: boolean;
  };
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

/** Öncelik sistemi: oyuncu alanlara artı/eksi verir; sınırlı bir artı havuzu vardır. */
export interface OncelikAyari {
  /** Öncelik verilebilen alanlar (gösterge adları). */
  alanlar: string[];
  baslangicHavuz: number;
  havuzAralik: [number, number];
  seviyeAralik: [number, number];
  /** Her ay: seviye × çarpan kadar alan değişir. */
  aylikCarpan: number;
  /** Eşikler: yukarı geçince havuz +1, aşağı inince -1. Yukarı ve aşağı değer farklıdır (titreme olmasın). */
  esikler: { yukari: number; asagi: number }[];
}

export interface Senaryo {
  id: string;
  baslangic: Tarih;
  bitis: Tarih;
  /** Göstergelerin alabileceği değer aralığı; verilirse tüm değişimler buna sıkıştırılır. */
  gostergeSiniri?: [number, number];
  oncelik?: OncelikAyari;
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
  gostergeSiniri?: [number, number];
  oncelik: {
    /** Alan başına seviye (−2…+2). */
    seviyeler: Record<string, number>;
    /** Alan başına geçilmiş eşik sayısı. */
    esikSayisi: Record<string, number>;
    krizler: { bitis: Tarih; delta: number }[];
    /** Son işlenen ay başı. */
    sonTik: Tarih;
  };
  /** Yolda olan haberler (oyuncu henüz bilmiyor). */
  yoldakiHaberler: Bildirim[];
  /** Oyuncuya ulaşmış haberler. */
  oyuncuBilgisi: Bildirim[];
  bitti: boolean;
}
