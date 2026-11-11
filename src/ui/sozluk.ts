/**
 * Terim sözlüğü: oyuncu metinlerindeki zor sözcükler dokununca açıklanır.
 * Açıklamalar bilinen, genel tanımlardır; tarihsel iddia taşımaz.
 */
export const SOZLUK: Record<string, string> = {
  "Mütareke": "Savaşı durduran ateşkes anlaşması. Mondros Mütarekesi, Osmanlı Devleti'nin Birinci Dünya Savaşı'nı bitirdi.",
  "Yıldırım Orduları Grubu": "Osmanlı ordusunun Suriye cephesindeki orduları bir araya getiren komutanlık.",
  "Harbiye Nezareti": "Savaş Bakanlığı.",
  "Sadrazam": "Padişahın altındaki hükümet başkanı, yani başbakan.",
  "İtilaf Devletleri": "Savaşı kazanan İngiltere, Fransa, İtalya ve müttefikleri.",
  "İtilaf": "Savaşı kazanan İngiltere, Fransa, İtalya ve müttefikleri.",
  "Meclis-i Mebusan": "Osmanlı'nın seçilmiş temsilcilerinden oluşan meclisi.",
  "Müfettişlik": "Bir bölgedeki orduyu ve yönetimi denetleyen komutanlık görevi.",
  "Takvim-i Vekâyi": "Osmanlı'nın resmî gazetesi.",
  "Kolordu": "Birkaç tümenden oluşan büyük asker birliği.",
  "Divan-ı Harp": "Askerî mahkeme.",
  "Başkomutanlık": "Orduların en üst komuta makamı.",
};

const ilkKucuk = (t: string) => t.charAt(0).toLocaleLowerCase("tr") + t.slice(1);
const ANAHTARLAR = Object.keys(SOZLUK).sort((a, b) => b.length - a.length);
const KALIP = new RegExp(
  `(?<![\\p{L}])(?:${ANAHTARLAR.flatMap((k) => [k, ilkKucuk(k)]).join("|")})[\\p{L}']*`,
  "gu",
);

export interface Parca {
  metin: string;
  /** Sözlük anahtarı; terim değilse yok. */
  terim?: string;
}

/** Metni terim ve düz parçalara böler. Parçalar birleştirilince özgün metin çıkar. */
export function bol(metin: string): Parca[] {
  const sonuc: Parca[] = [];
  let son = 0;
  for (const m of metin.matchAll(KALIP)) {
    const bas = m.index ?? 0;
    const anahtar = ANAHTARLAR.find((k) => m[0].startsWith(k) || m[0].startsWith(ilkKucuk(k)));
    if (!anahtar) continue;
    if (bas > son) sonuc.push({ metin: metin.slice(son, bas) });
    sonuc.push({ metin: m[0], terim: anahtar });
    son = bas + m[0].length;
  }
  if (son < metin.length) sonuc.push({ metin: metin.slice(son) });
  return sonuc;
}
