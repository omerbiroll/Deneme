/**
 * Terim sözlüğü: oyuncu metinlerindeki zor sözcükler dokununca açıklanır.
 * Açıklamalar bilinen, genel tanımlardır; tarihsel iddia taşımaz.
 */
export const SOZLUK: Record<string, string> = {
  "Genelkurmay Başkanı": "Ordunun en üst komutanı.",
  "Kabine": "Başbakan ve bakanlardan oluşan, ülkeyi yöneten kurul.",
  "Muhalefet": "Hükümete karşı duran siyasi grup ya da parti.",
  "Mebus": "Meclis üyesi, yani milletvekili.",
  "Kredi": "Geri ödenmek üzere alınan para.",
  "Büyükelçi": "Bir devletin başka bir ülkedeki en üst temsilcisi.",
  "Tarafsız": "Savaşta hiçbir tarafın yanında yer almayan.",
  "Levazım": "Askerin yiyecek, giyecek ve araç gereç ihtiyacı.",
  "Bütçe": "Devletin bir yıllık gelir ve gider planı.",
  "Vali": "Bir ilin devlet tarafından atanan yöneticisi.",
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
