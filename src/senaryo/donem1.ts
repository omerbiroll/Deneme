/**
 * 1. dönem senaryosu: Mondros ve İşgal (30 Ekim 1918 – Mayıs 1919).
 *
 * BU DOSYA OYUN KURALIDIR, TARİH DEĞİLDİR.
 * - Gerçek tarih `data/tarih/` altındadır; buradaki olaylar ona `tarihselOlayId` ile bağlanır.
 * - Karar seçenekleri, göstergeler, ilişki değerleri ve sonuçlar tasarımdır;
 *   arayüzde "simülasyon" olarak sunulur.
 */
import type { Senaryo, OlayTanimi, EylemTanimi, Durum, Iliski, Tarih } from "../engine/tipler";
import { BEKLE } from "../engine/motor";
import { tarihselVeriyiYukle } from "../data/yukle";

/**
 * Mustafa Kemal'in kendi eylemi olan tarihsel olaylar. Bunlar kendiliğinden gerçekleşmez;
 * oyuncunun kararına bağlıdır.
 */
const OYUNCUYA_BAGLI: Record<string, Partial<OlayTanimi>> = {
  "iskenderun-itiraz": { kosul: { bayrakVar: ["itiraz-edildi"] }, firsatKartlari: ["kart-iskenderun"] },
  "mondros-gorus-raporu": { kosul: { bayrakVar: ["itiraz-edildi"] }, firsatKartlari: ["kart-iskenderun"] },
  "vahdettin-gorusme": { kosul: { bayrakVar: ["istanbulda-etkin"] }, firsatKartlari: ["kart-istanbul"] },
  minber: { kosul: { bayrakVar: ["istanbulda-etkin"] }, firsatKartlari: ["kart-istanbul"] },
  "erzurum-mektubu": { kosul: { bayrakVar: ["anadolu-hazirligi"] }, firsatKartlari: ["kart-cozum"] },
  "mufettislik-atamasi": {
    kosul: { bayrakVar: ["mufettislik-kabul"], olayOldu: ["kart-mufettislik"] },
    firsatKartlari: ["kart-mufettislik"],
  },
  "atama-takvimi-vekayi": { kosul: { olayOldu: ["mufettislik-atamasi"] } },
  "istanbul-ayrilis": {
    kosul: { bayrakVar: ["yola-cikis"], olayOldu: ["mufettislik-atamasi"] },
    firsatKartlari: ["kart-izmir"],
  },
  samsun: { kosul: { olayOldu: ["istanbul-ayrilis"] } },
};

/**
 * Haberin oyuncuya ulaşma süresi (gün). Sadeleştirilmiş tasarım değeridir:
 * oyuncunun bulunduğu yerdeki olaylar aynı gün, uzaktakiler birkaç gün sonra duyulur.
 */
function haberGecikmesi(tarih: Tarih, yer?: string): number {
  const oyuncuAdanada = tarih < "1918-11-13";
  if (!yer) return 2;
  if (oyuncuAdanada) return ["Adana", "İskenderun"].includes(yer) ? 0 : 2;
  if (yer === "İstanbul") return 0;
  if (["Paris", "Musul", "Kars", "Erzurum"].includes(yer)) return 4;
  return 2;
}

const BUYUK = new Set([
  "mondros-imza", "itilaf-donanmasi-istanbul", "meclis-feshi", "damat-ferit-kabinesi",
  "izmir-isgali", "mufettislik-atamasi", "samsun", "adana-isgali", "antalya-isgali", "istanbul-ayrilis",
]);

function tarihselOlaylar(): OlayTanimi[] {
  return tarihselVeriyiYukle().olaylar.map((o) => ({
    id: o.id,
    tarihselOlayId: o.id,
    tarih: o.tarih,
    etkiler: [],
    onem: BUYUK.has(o.id) ? "buyuk" : "siradan",
    haberGecikmesiGun: haberGecikmesi(o.tarih, o.yer),
    ...OYUNCUYA_BAGLI[o.id],
  }));
}

/** Simülasyona ait olaylar: karar kartları ve kararların doğurduğu sonuçlar. */
const simulasyonOlaylari: OlayTanimi[] = [
  {
    id: "kart-iskenderun",
    ad: "İskenderun'a çıkarma",
    aciklama:
      "Mondros Mütarekesi'nin üzerinden dört gün geçti. Bir İngiliz ve bir Fransız subayı İskenderun'a geldi: limana asker çıkaracaklarını bildirdiler. Yıldırım Orduları Grubu'nun komutanı sensin. İstanbul'un bu konuda ne düşündüğünü bilmiyorsun; telgrafın cevabı günler sürebilir.",
    tarih: "1918-11-03",
    etkiler: [],
    onem: "buyuk",
    haberGecikmesiGun: 0,
    kart: {
      ikilem: true,
      secenekler: [
        {
          id: BEKLE,
          ad: "Hiçbir şey yapma",
          aciklama: "Subaylara cevap verme, ne olacağını bekle.",
          tepki: "Subaylar limandan ayrıldı. Sen hiçbir şey söylemedin.",
          etkiler: [],
        },
        {
          id: "itiraz",
          ad: "Karşı çıkma, ama itirazını yaz",
          aciklama: "Görüşünü yazılı olarak bildir, silaha başvurma.",
          kazanc: "Görüşün kayda geçer, subayların sözüne değer verir.",
          bedel: "İstanbul'daki hükümet bu çıkışı sevmeyebilir.",
          tepki: "Mektubun şifreyle yola çıktı. Cevabın ne zaman geleceğini bilmiyorsun.",
          etkiler: [
            { tur: "bayrak", ad: "itiraz-edildi" },
            { tur: "gosterge", ad: "nufuz", delta: 5 },
            { tur: "gosterge", ad: "sarayGuveni", delta: -3 },
          ],
        },
        {
          id: "diren",
          ad: "Karşı koyma emrini sürdür",
          aciklama: "İtirazını bildir, birliklere çıkarmaya karşı koymalarını söyle.",
          kazanc: "Subaylar arasında itibarın hızla yükselir.",
          bedel: "Hükümetin güveni sarsılır, İtilaf seni tehlikeli bulur.",
          tepki: "Birliklere emir gitti. Limanda gerginlik başladı.",
          etkiler: [
            { tur: "bayrak", ad: "itiraz-edildi" },
            { tur: "bayrak", ad: "sert-cikis" },
            { tur: "gosterge", ad: "nufuz", delta: 12 },
            { tur: "gosterge", ad: "sarayGuveni", delta: -12 },
            { tur: "gosterge", ad: "itilafSuphesi", delta: 25 },
          ],
        },
      ],
    },
  },
  {
    id: "kart-istanbul",
    ad: "İstanbul'a varış",
    aciklama:
      "İstanbul'a vardığın gün İtilaf gemileri Boğaz'da demirliydi. Yıldırım Orduları Grubu kaldırıldı; Harbiye Nezareti emrindesin ve elinde bir görev yok. Kimin yanında duracağını sen seçeceksin.",
    tarih: "1918-11-13",
    kosul: { olayOldu: ["istanbul-varis"] },
    kosulSaglanmazsa: "bekle",
    sonTarih: "1918-11-20",
    etkiler: [],
    onem: "buyuk",
    haberGecikmesiGun: 0,
    kart: {
      ikilem: true,
      danismanlar: [
        {
          kisi: "fethi",
          oneri: "basin",
          gorus: "Gazete bizim elimizde. İstanbul'da herkes konuşuyor ama kimse ne yapacağını bilmiyor. Sesini duyurursan arkandan gelenler olur.",
        },
        {
          kisi: "rauf",
          oneri: "saray",
          gorus: "Acele etme. Saray ve hükümet çevresiyle köprüleri yakarsan sonra kapıyı çalacak kimse kalmaz.",
        },
      ],
      secenekler: [
        {
          id: BEKLE,
          ad: "Hiçbir şey yapma",
          aciklama: "Şehri ve gelişmeleri izle, kimseyle görüşme.",
          tepki: "Bir gün boyunca şehri dolaştın, kimseyle konuşmadın.",
          etkiler: [],
        },
        {
          id: "saray",
          ad: "Padişaha ulaşmaya çalış",
          aciklama: "Saray çevresinde girişimde bulun.",
          kazanc: "Sarayın güvenini kazanabilirsin.",
          bedel: "Askerler arasında saray adamı diye anılırsın.",
          tepki: "Saraya bir not gönderdin. Cevap bekliyorsun.",
          etkiler: [
            { tur: "bayrak", ad: "istanbulda-etkin" },
            { tur: "gosterge", ad: "sarayGuveni", delta: 12 },
            { tur: "gosterge", ad: "nufuz", delta: -4 },
            { tur: "gosterge", ad: "baglanti", delta: 2 },
          ],
        },
        {
          id: "basin",
          ad: "Gazeteyle sesini duyur",
          aciklama: "Minber'de görüşlerini yaz.",
          kazanc: "Halk adını duyar, kamuoyunda tanınırsın.",
          bedel: "İtilaf seni gözetmeye başlar, saray tedirgin olur.",
          tepki: "Fethi Bey'e haber yolladın.",
          etkiler: [
            { tur: "bayrak", ad: "istanbulda-etkin" },
            { tur: "gosterge", ad: "taninirlik", delta: 12 },
            { tur: "gosterge", ad: "itilafSuphesi", delta: 8 },
            { tur: "gosterge", ad: "sarayGuveni", delta: -4 },
            { tur: "gosterge", ad: "baglanti", delta: 2 },
          ],
        },
        {
          id: "ordu",
          ad: "Subaylarla sessizce çevre kur",
          aciklama: "Güvendiğin komutanlarla bağ kur, ortaya çıkma.",
          kazanc: "Ordu içinde sözünün geçtiği bir çevre oluşur.",
          bedel: "Kamuoyunda ve sarayda adın duyulmaz.",
          tepki: "Birkaç subaya haber saldın. Sessizce dönüşlerini bekliyorsun.",
          etkiler: [
            { tur: "bayrak", ad: "istanbulda-etkin" },
            { tur: "gosterge", ad: "nufuz", delta: 10 },
            { tur: "gosterge", ad: "taninirlik", delta: -3 },
            { tur: "gosterge", ad: "baglanti", delta: 2 },
          ],
        },
      ],
    },
  },
  {
    id: "kart-cozum",
    ad: "Çözüm arayışı",
    aciklama:
      "Meclis feshedildi, işgaller yayılıyor. Yeni bir kabine kuruldu. Arkadaşlarından bazıları Anadolu'daki kolordulara atanıyor.",
    tarih: "1919-03-05",
    etkiler: [],
    onem: "buyuk",
    haberGecikmesiGun: 0,
    kart: {
      secenekler: [
        { id: BEKLE, ad: "Hiçbir şey yapma", aciklama: "Gelişmeleri izlemeyi sürdür.", etkiler: [] },
        {
          id: "anadolu",
          ad: "Anadolu için hazırlan",
          aciklama: "Anadolu'daki komutanlarla yazış, örgütlenmeyi düşün.",
          etkiler: [
            { tur: "bayrak", ad: "anadolu-hazirligi" },
            { tur: "gosterge", ad: "nufuz", delta: 8 },
            { tur: "gosterge", ad: "baglanti", delta: 1 },
            { tur: "iliski", kisi: "kazim-karabekir", alan: "siyasiUyum", delta: 8 },
          ],
        },
        {
          id: "hukumet",
          ad: "İstanbul'da görev ara",
          aciklama: "Çözümü hükümet içinde ara.",
          etkiler: [
            { tur: "bayrak", ad: "istanbulda-gorev-arayisi" },
            { tur: "gosterge", ad: "sarayGuveni", delta: 8 },
            { tur: "gosterge", ad: "baglanti", delta: 1 },
          ],
        },
      ],
    },
  },
  {
    id: "gozetim",
    ad: "Gözetim altına alınma",
    aciklama: "Sert çıkışların İtilaf temsilcilerinin dikkatini çekti; hareketlerin izleniyor.",
    tarih: "1919-04-20",
    kosul: { gostergeEnAz: { itilafSuphesi: 40 } },
    etkiler: [{ tur: "bayrak", ad: "gozetim" }],
    onem: "buyuk",
    haberGecikmesiGun: 0,
  },
  {
    id: "kart-mufettislik",
    ad: "Müfettişlik teklifi",
    aciklama: "Anadolu'da 9. Ordu Müfettişliği için adın geçiyor.",
    tarih: "1919-04-30",
    kosul: { gostergeEnAz: { baglanti: 2 }, bayrakYok: ["gozetim"] },
    firsatKartlari: ["kart-istanbul", "kart-cozum"],
    etkiler: [],
    onem: "buyuk",
    haberGecikmesiGun: 0,
    kart: {
      secenekler: [
        { id: BEKLE, ad: "Hiçbir şey yapma", aciklama: "Cevap verme; görev başkasına gider.", etkiler: [] },
        {
          id: "kabul",
          ad: "Olduğu gibi kabul et",
          etkiler: [{ tur: "bayrak", ad: "mufettislik-kabul" }],
        },
        {
          id: "genis-yetki",
          ad: "Geniş yetki şartıyla kabul et",
          aciklama: "Görev bölgesinde askerî ve mülki makamlara emir verebilme yetkisi iste.",
          etkiler: [
            { tur: "bayrak", ad: "mufettislik-kabul" },
            { tur: "bayrak", ad: "genis-yetki-talebi" },
          ],
        },
        {
          id: "reddet",
          ad: "Reddet, İstanbul'da kal",
          etkiler: [
            { tur: "bayrak", ad: "mufettislik-red" },
            { tur: "gosterge", ad: "sarayGuveni", delta: -5 },
          ],
        },
      ],
    },
  },
  {
    id: "genis-yetki-verildi",
    ad: "Geniş yetkinin verilmesi",
    tarih: "1919-04-30",
    kosul: { bayrakVar: ["genis-yetki-talebi"], gostergeEnAz: { sarayGuveni: 45 } },
    etkiler: [{ tur: "bayrak", ad: "genis-yetki" }, { tur: "gosterge", ad: "nufuz", delta: 10 }],
    onem: "siradan",
    haberGecikmesiGun: 0,
  },
  {
    id: "kart-izmir",
    ad: "İzmir haberi",
    aciklama: "İzmir işgal edildi. Müfettişlik görevin için yola çıkmak üzeresin.",
    tarih: "1919-05-15",
    kosul: { olayOldu: ["mufettislik-atamasi", "izmir-isgali"] },
    kosulSaglanmazsa: "bekle",
    sonTarih: "1919-05-20",
    etkiler: [],
    onem: "buyuk",
    haberGecikmesiGun: 0,
    kart: {
      secenekler: [
        { id: BEKLE, ad: "Hiçbir şey yapma", aciklama: "Yola çıkma, bekle.", etkiler: [] },
        { id: "yola-cik", ad: "Hemen yola çık", etkiler: [{ tur: "bayrak", ad: "yola-cikis" }] },
        {
          id: "ertele",
          ad: "Yolculuğu ertele, İstanbul'daki tepkiye katıl",
          etkiler: [
            { tur: "bayrak", ad: "yola-cikis" },
            { tur: "ertele", olayId: "istanbul-ayrilis", gun: 7 },
            { tur: "ertele", olayId: "samsun", gun: 7 },
            { tur: "gosterge", ad: "taninirlik", delta: 8 },
            { tur: "gosterge", ad: "itilafSuphesi", delta: 10 },
          ],
        },
      ],
    },
  },
];

const eylemler: EylemTanimi[] = [
  {
    id: "fethi-gorusme", ad: "Fethi Bey'le görüş", tekSefer: true,
    baslangic: "1918-11-13", bitis: "1919-03-01",
    basari: { taban: 0.7, kisi: "fethi", alan: "yakinlik" },
    etkilerBasari: [
      { tur: "iliski", kisi: "fethi", alan: "guven", delta: 8 },
      { tur: "gosterge", ad: "baglanti", delta: 1 },
      { tur: "gosterge", ad: "taninirlik", delta: 3 },
    ],
    etkilerBasarisiz: [{ tur: "iliski", kisi: "fethi", alan: "guven", delta: -3 }],
  },
  {
    id: "rauf-gorusme", ad: "Rauf Bey'le görüş", tekSefer: true,
    baslangic: "1918-11-13", bitis: "1919-05-15",
    basari: { taban: 0.6, kisi: "rauf", alan: "guven" },
    etkilerBasari: [
      { tur: "iliski", kisi: "rauf", alan: "guven", delta: 10 },
      { tur: "gosterge", ad: "baglanti", delta: 1 },
    ],
    etkilerBasarisiz: [{ tur: "iliski", kisi: "rauf", alan: "yakinlik", delta: -3 }],
  },
  {
    id: "karabekir-gorusme", ad: "Kâzım Karabekir Paşa'yla görüş", tekSefer: true,
    baslangic: "1918-11-20", bitis: "1919-04-10",
    basari: { taban: 0.55, kisi: "kazim-karabekir", alan: "guven" },
    etkilerBasari: [
      { tur: "iliski", kisi: "kazim-karabekir", alan: "guven", delta: 10 },
      { tur: "gosterge", ad: "nufuz", delta: 4 },
      { tur: "gosterge", ad: "baglanti", delta: 1 },
    ],
    etkilerBasarisiz: [{ tur: "iliski", kisi: "kazim-karabekir", alan: "siyasiUyum", delta: -4 }],
  },
  {
    id: "minber-demec", ad: "Minber'e demeç ver", tekSefer: true,
    baslangic: "1918-11-13", bitis: "1918-12-21",
    kosul: { bayrakVar: ["istanbulda-etkin"] },
    etkilerBasari: [
      { tur: "gosterge", ad: "taninirlik", delta: 8 },
      { tur: "gosterge", ad: "itilafSuphesi", delta: 5 },
    ],
    etkilerBasarisiz: [],
  },
  {
    id: "anadolu-mektup", ad: "Ali Fuat Paşa'ya mektup yaz", tekSefer: true,
    baslangic: "1919-03-01", bitis: "1919-05-15",
    basari: { taban: 0.65, kisi: "ali-fuat", alan: "guven" },
    etkilerBasari: [
      { tur: "iliski", kisi: "ali-fuat", alan: "guven", delta: 8 },
      { tur: "gosterge", ad: "nufuz", delta: 4 },
      { tur: "gosterge", ad: "baglanti", delta: 1 },
      { tur: "gosterge", ad: "itilafSuphesi", delta: 3 },
    ],
    etkilerBasarisiz: [{ tur: "gosterge", ad: "itilafSuphesi", delta: 6 }],
  },
];

/**
 * İlişkilerin başlangıç değerleri TASARIMDIR. Kaynaklarda sayısal karşılıkları yoktur.
 * Hepsi nötr (50) başlar; tek fark, Minber'i birlikte çıkardıkları kaynakla sabit olan
 * Fethi Bey'in yakınlığıdır ve bu da bir yorumdur.
 */
const notr = (): Iliski => ({ guven: 50, sadakat: 50, yakinlik: 50, siyasiUyum: 50 });

export function donem1Senaryosu(): Senaryo {
  // Aynı güne düşen olaylarda simülasyon olayları (kartlar) önce işlenir.
  const olaylar = [...simulasyonOlaylari, ...tarihselOlaylar()]
    .map((o, i) => ({ o, i }))
    .sort((a, b) => a.o.tarih.localeCompare(b.o.tarih) || a.i - b.i)
    .map((x) => x.o);
  return {
    id: "donem-1",
    baslangic: "1918-10-30",
    bitis: "1919-05-31",
    /** Dört gösterge ve iç sayaç (baglanti) tasarımdır; gerçek bir ölçüme dayanmaz. */
    gostergeler: { nufuz: 40, sarayGuveni: 50, itilafSuphesi: 10, taninirlik: 20, baglanti: 0 },
    iliskiler: {
      fethi: { ...notr(), yakinlik: 65 },
      rauf: notr(),
      "ali-fuat": notr(),
      "kazim-karabekir": notr(),
    },
    olaylar,
    eylemler,
  };
}

export type Donem1Kapanisi = "genis-yetkiyle-samsun" | "sinirli-ya-da-gecikmeli-samsun" | "istanbulda-kalis" | "gozetim";

/** Dönemin kapanışını motor durumundan belirler. Anlatım katmanı bu sonucu değiştiremez. */
export function donem1Kapanisi(d: Durum): Donem1Kapanisi {
  const samsun = d.gerceklesen.samsun;
  if (samsun) {
    return "genis-yetki" in d.bayraklar && !samsun.alternatif
      ? "genis-yetkiyle-samsun"
      : "sinirli-ya-da-gecikmeli-samsun";
  }
  return "gozetim" in d.bayraklar ? "gozetim" : "istanbulda-kalis";
}
