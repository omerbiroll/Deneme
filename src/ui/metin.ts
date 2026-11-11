/**
 * Metin katmanı: motorun hesapladığı durumu oyuncuya anlatır.
 * Sonuç belirlemez; yalnızca kayıtlı olanı yazıya döker.
 */
import type { Bildirim, Durum, KararKaydi, Senaryo, Tarih } from "../engine/tipler";
import type { Olay, Kaynak } from "../data/sema";
import type { Donem1Kapanisi } from "../senaryo/donem1";

const AYLAR = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];

export function tarihYaz(t: Tarih): string {
  const [y, a, g] = t.split("-").map(Number) as [number, number, number];
  return `${g} ${AYLAR[a - 1]} ${y}`;
}

export function kisaTarih(t: Tarih): string {
  const [, a, g] = t.split("-").map(Number) as [number, number, number];
  return `${g} ${AYLAR[a - 1]}`;
}

/** İçeriğin türü. Arayüz üçünü görsel olarak ayırır. */
export type Etiket = "gercek" | "alternatif" | "simulasyon";

export interface Haber {
  anahtar: string;
  olayId: string;
  tarih: Tarih;
  teslim: Tarih;
  baslik: string;
  metin: string;
  etiket: Etiket;
  onemli: boolean;
  kisisel: boolean;
  yer?: string;
  kaynak?: Kaynak;
  tartismaNotu?: string;
  hassasKonu: boolean;
}

export interface Veri {
  olaylar: Map<string, Olay>;
  kaynaklar: Map<string, Kaynak>;
}

/** Bir bildirimi habere çevirir. Gösterilmeyecekse null döner. */
export function haberYaz(b: Bildirim, senaryo: Senaryo, veri: Veri): Haber | null {
  const tanim = senaryo.olaylar.find((o) => o.id === b.olayId);
  if (!tanim) return null;
  const tarihsel = tanim.tarihselOlayId ? veri.olaylar.get(tanim.tarihselOlayId) : undefined;
  const ortak = { anahtar: `${b.olayId}:${b.durum}`, olayId: b.olayId, tarih: b.olayTarihi, teslim: b.teslimTarihi, onemli: b.onem === "buyuk" };

  if (!tarihsel) {
    // Simülasyona ait olay. Kartlar ayrıca gösterilir; gerçekleşmeyen iç olaylar haber olmaz.
    if (tanim.kart || b.durum === "gerceklesmedi" || !tanim.ad) return null;
    return { ...ortak, baslik: tanim.ad, metin: tanim.aciklama ?? "", etiket: "simulasyon", kisisel: true, hassasKonu: false };
  }

  const kaynak = veri.kaynaklar.get(tarihsel.kaynaklar[0]!.kaynakId);
  const kisisel = tarihsel.ilgiliKisiler.includes("mustafa-kemal");
  const ek = { yer: tarihsel.yer, kaynak, tartismaNotu: tarihsel.tartismaNotu, hassasKonu: !!tarihsel.hassasKonuNotu, kisisel };

  if (b.durum === "gerceklesmedi") {
    return {
      ...ortak, ...ek, etiket: "alternatif",
      baslik: `Gerçekleşmedi: ${tarihsel.ad}`,
      metin: `Gerçek tarihte ${tarihYaz(tarihsel.tarih)} günü: ${tarihsel.aciklama} Bu oyunda gerçekleşmedi.`,
    };
  }
  if (b.alternatif) {
    return {
      ...ortak, ...ek, etiket: "alternatif",
      baslik: tarihsel.ad,
      metin: `${tarihsel.aciklama} Gerçek tarihte ${tarihYaz(tarihsel.tarih)} günü olmuştu; bu oyunda ${tarihYaz(b.olayTarihi)} günü gerçekleşti.`,
    };
  }
  return { ...ortak, ...ek, etiket: "gercek", baslik: tarihsel.ad, metin: tarihsel.aciklama };
}

export function haberler(d: Durum, senaryo: Senaryo, veri: Veri): Haber[] {
  return d.oyuncuBilgisi
    .map((b) => haberYaz(b, senaryo, veri))
    .filter((h): h is Haber => h !== null)
    .reverse();
}

export function kararAdi(k: KararKaydi, senaryo: Senaryo): { baslik: string; secim: string } {
  if (k.tur === "kart") {
    const olay = senaryo.olaylar.find((o) => o.id === k.kaynakId);
    const secenek = olay?.kart?.secenekler.find((s) => s.id === k.secenekId);
    return { baslik: olay?.ad ?? k.kaynakId, secim: secenek?.ad ?? k.secenekId };
  }
  const eylem = senaryo.eylemler.find((e) => e.id === k.kaynakId);
  return { baslik: eylem?.ad ?? k.kaynakId, secim: k.basarili ? "Olumlu sonuçlandı" : "Sonuç vermedi" };
}

export const GOSTERGELER: { ad: string; baslik: string; aciklama: string }[] = [
  { ad: "nufuz", baslik: "Ordu içindeki nüfuz", aciklama: "Komutanların ve subayların sözüne verdiği ağırlık." },
  { ad: "sarayGuveni", baslik: "Sarayın güveni", aciklama: "Padişahın ve hükümetin sana duyduğu güven." },
  { ad: "itilafSuphesi", baslik: "İtilaf'ın şüphesi", aciklama: "İşgal kuvvetlerinin seni ne kadar yakından izlediği." },
  { ad: "taninirlik", baslik: "Kamuoyunda tanınırlık", aciklama: "Basında ve halk arasında adının ne kadar bilindiği." },
];

export const KISILER: Record<string, string> = {
  fethi: "Fethi Bey",
  rauf: "Rauf Bey",
  "ali-fuat": "Ali Fuat Paşa",
  "kazim-karabekir": "Kâzım Karabekir Paşa",
};

export const ILISKI_ALANLARI: Record<string, string> = {
  guven: "Güven", sadakat: "Sadakat", yakinlik: "Yakınlık", siyasiUyum: "Siyasi uyum",
};

/**
 * Görüşme ve yazışmaların sonuç metinleri. KURGUDUR: gerçek kişilere atfedilen bu sözler
 * hiçbir kaynağa dayanmaz ve arayüzde her zaman "kurgu diyalog" etiketiyle gösterilir.
 */
export const EYLEM_METINLERI: Record<string, { basarili: string[]; basarisiz: string[] }> = {
  "fethi-gorusme": {
    basarili: [
      "Fethi Bey seni dikkatle dinledi. «Gazete emrinizde, Paşam. Söyleyecek sözü olanın susacağı gün değil» dedi.",
      "Uzun bir konuşma oldu. Fethi Bey, «İstanbul'da sizin gibi düşünen az değil; yalnızca birbirlerinden habersizler» dedi.",
    ],
    basarisiz: [
      "Fethi Bey meşguldü, konuşma yarım kaldı. «Bir iki gün sonra daha etraflıca görüşelim» demekle yetindi.",
      "Fethi Bey temkinliydi. «Şimdilik acele etmeyelim, ortalık biraz durulsun» dedi.",
    ],
  },
  "rauf-gorusme": {
    basarili: [
      "Rauf Bey açık konuştu. «Mütarekeyi imzalarken umduğum bu değildi. Ne yapılacaksa birlikte düşünelim» dedi.",
      "Rauf Bey sözünü sakınmadı. «Bu gidişe seyirci kalmak bana da ağır geliyor» dedi.",
    ],
    basarisiz: [
      "Rauf Bey nazikti ama mesafeliydi. «Hükümete biraz zaman tanımak lazım» dedi.",
      "Görüşme kısa sürdü. Rauf Bey, «Henüz bir şey söylemek için erken» diyerek sözü kapattı.",
    ],
  },
  "karabekir-gorusme": {
    basarili: [
      "Kâzım Karabekir Paşa kararlıydı. «Çare İstanbul'da değil. Asker dağılmadan Anadolu'da bir şey yapılabilir» dedi.",
      "Karabekir Paşa haritanın başından kalkmadı. «Doğu'daki kıtalar hâlâ ayakta; iş onlara sahip çıkmakta» dedi.",
    ],
    basarisiz: [
      "Karabekir Paşa dinledi ama fikrini açmadı. «Her şeyin bir sırası var» demekle yetindi.",
      "Paşa'nın aklı başka yerdeydi. «Bunu sonra konuşalım» dedi.",
    ],
  },
  "minber-demec": {
    basarili: [
      "Demecin Minber'de yayımlandı. Ertesi gün birkaç gazete daha senden söz etti.",
      "Minber sözlerine geniş yer verdi. Adın artık yalnızca askerî çevrelerde anılmıyor.",
    ],
    basarisiz: [],
  },
  "anadolu-mektup": {
    basarili: [
      "Ali Fuat Paşa'nın cevabı gecikmedi: «Buradaki vaziyet sizin tahmin ettiğiniz gibidir. Haberleşmeyi keselim demem.»",
      "Cevap geldi. Ali Fuat Paşa, «Kıtalarım elimde. Mektuplarınızı bekleyeceğim» diye yazıyordu.",
    ],
    basarisiz: [
      "Mektuba cevap gelmedi. Ulaşıp ulaşmadığından emin değilsin; postanın denetlendiği söyleniyor.",
      "Haftalar geçti, cevap yok. Mektubun yolda başkalarının eline geçmiş olabileceğini düşünüyorsun.",
    ],
  },
};

/** Aynı metnin art arda gelmemesi için varyantı kararın sırasına göre seçer (belirlenimci). */
export function eylemMetni(k: KararKaydi, sira: number): string {
  const m = EYLEM_METINLERI[k.kaynakId];
  const liste = k.basarili ? m?.basarili : m?.basarisiz;
  if (!liste?.length) return "";
  // Tohum negatif olabilir; kalan her zaman sıfır ya da pozitif olmalı.
  return liste[((sira % liste.length) + liste.length) % liste.length]!;
}

export const KAPANISLAR: Record<Donem1Kapanisi, { baslik: string; metin: string }> = {
  "genis-yetkiyle-samsun": {
    baslik: "Geniş yetkiyle Samsun'da",
    metin:
      "19 Mayıs 1919'da Samsun'a vardın. Elinde bir görev, arkanda İstanbul'da kurduğun bağlar var. Bu oyunda izlediğin yol, gerçek tarihin yoluna çok yakın.",
  },
  "sinirli-ya-da-gecikmeli-samsun": {
    baslik: "Samsun'a çıktın, ama eksik",
    metin:
      "Anadolu'ya geçtin; ancak ya yetkin dar ya da yola geç çıktın. Önündeki aylar, gerçek tarihtekinden daha dar bir alanda başlıyor.",
  },
  "istanbulda-kalis": {
    baslik: "İstanbul'da kaldın",
    metin:
      "Mayıs 1919 sona ererken İstanbul'dasın. İzmir işgal edildi, Anadolu'da işgaller yayılıyor. Samsun'a başka biri gitti ya da kimse gitmedi; sen olanları pencereden izliyorsun.",
  },
  gozetim: {
    baslik: "Gözetim altındasın",
    metin:
      "Sert çıkışların işgal kuvvetlerinin dikkatini çekti. Adımların izleniyor, Anadolu'da bir görev almanın yolu kapandı. İstanbul'da hareket alanın daraldı.",
  },
};
