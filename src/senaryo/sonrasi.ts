/**
 * Senaryo: Atatürk 10 Kasım 1938'de ölmeseydi (10 Kasım 1938 – 30 Haziran 1939).
 *
 * BU DOSYA OYUN KURALIDIR, TARİH DEĞİLDİR.
 * - Gerçek zemin `data/tarih/` altındadır; buradaki olaylar ona `tarihselOlayId` ile bağlanır.
 * - Karar seçenekleri, göstergeler, sonrasında gelen haberler ve yankı sahneleri tasarımdır;
 *   arayüzde "simülasyon" olarak sunulur. Kişilere söyletilen sözler kurgudur.
 * - Varsayım: dünya olaylarının (ör. Çekoslovakya'nın işgali) Atatürk'ün yaşamasından
 *   bağımsız aktığı kabul edilir.
 */
import type { Senaryo, OlayTanimi, Etki, Kosul, Danisman, Tarih, Iliski } from "../engine/tipler";
import { BEKLE } from "../engine/motor";
import { gunEkle } from "../engine/yardimci";
import { tarihselVeriyiYukle } from "../data/yukle";

interface SonrasiYaz { gun: number; ad: string; metin: string; etki?: Etki[] }
interface SecenekYaz {
  id: string;
  ad: string;
  aciklama?: string;
  kazanc?: string;
  bedel?: string;
  tepki: string;
  /** Alan değişimleri (gösterge deltaları). */
  alan?: Record<string, number>;
  kapi?: { acildi?: string[]; kapandi?: string[] };
  sonrasi?: SonrasiYaz[];
}
interface KartYaz {
  id: string;
  ad: string;
  aciklama: string;
  tarih: Tarih;
  kosul?: Kosul;
  sure?: number;
  danismanlar?: Danisman[];
  yanki?: string;
  secenekler: SecenekYaz[];
}

const gosterge = (alan: Record<string, number> = {}): Etki[] =>
  Object.entries(alan).map(([ad, delta]) => ({ tur: "gosterge", ad, delta }));

/** Bir kartı ve seçeneklerinin sonrasında gelen haberleri olay listesine çevirir. */
function kartYaz(k: KartYaz): OlayTanimi[] {
  const kart: OlayTanimi = {
    id: k.id,
    ad: k.ad,
    aciklama: k.aciklama,
    tarih: k.tarih,
    kosul: k.kosul,
    yanki: k.yanki,
    etkiler: [],
    onem: "buyuk",
    haberGecikmesiGun: 0,
    kart: {
      ikilem: true,
      sure: k.sure,
      gizliBedel: k.sure !== undefined,
      danismanlar: k.danismanlar,
      secenekler: k.secenekler.map((s) => ({
        id: s.id, ad: s.ad, aciklama: s.aciklama, kazanc: s.kazanc, bedel: s.bedel, tepki: s.tepki, kapi: s.kapi,
        etkiler: [{ tur: "bayrak", ad: `${k.id}:${s.id}` }, ...gosterge(s.alan)],
      })),
    },
  };
  const sonrasi: OlayTanimi[] = k.secenekler.flatMap((s) =>
    (s.sonrasi ?? []).map((x, i) => ({
      id: `${k.id}:${s.id}:${i}`,
      ad: x.ad,
      aciklama: x.metin,
      tarih: gunEkle(k.tarih, x.gun),
      kosul: { bayrakVar: [`${k.id}:${s.id}`] },
      etkiler: x.etki ?? [],
      onem: "siradan" as const,
      haberGecikmesiGun: 2,
    })),
  );
  return [kart, ...sonrasi];
}

const bekle = (tepki: string, sonrasi: SonrasiYaz, aciklama = "Hiçbir şey yapma."): SecenekYaz => ({
  id: BEKLE, ad: "Hiçbir şey yapma", aciklama, tepki, sonrasi: [sonrasi],
});

const kartlar: OlayTanimi[] = [
  ...kartYaz({
    id: "kart-acilis",
    ad: "Sabah notları",
    aciklama:
      "İstanbul, Dolmabahçe. Masanda iki not var: biri Başbakan Celal Bayar'dan, biri Genelkurmay Başkanı Fevzi Çakmak'tan. İkisi de seninle konuşmak istiyor.",
    tarih: "1938-11-10",
    secenekler: [
      {
        id: "bayar", ad: "Bayar'ı kabul et", aciklama: "Önce ekonomiyi dinle.",
        kazanc: "Ekonomi gündeminin başına geçer.", bedel: "Çakmak bekler.",
        tepki: "Bayar masaya bir dosya bıraktı. Çakmak'ın notu cevapsız kaldı.",
        alan: { ekonomi: 3, ordu: -2 },
        kapi: { acildi: ["Ekonomi gündemine ilk elden hâkim olma"], kapandi: ["Çakmak'la o gün görüşme"] },
        sonrasi: [{ gun: 8, ad: "Bayar'dan ekonomi notu", metin: "Bayar bütçe açığına dair bir not gönderdi. Notta iki ayrı çıkış yolu öneriliyor." }],
      },
      {
        id: "cakmak", ad: "Çakmak'ı kabul et", aciklama: "Önce orduyu dinle.",
        kazanc: "Orduyla ilgili ilk elden bilgi.", bedel: "Bayar bekler.",
        tepki: "Çakmak ordunun durumunu kısaca anlattı. Bayar'ın notu cevapsız kaldı.",
        alan: { ordu: 3, ekonomi: -2 },
        kapi: { acildi: ["Ordunun durumuna dair ilk elden bilgi"], kapandi: ["Bayar'la o gün görüşme"] },
        sonrasi: [{ gun: 8, ad: "Çakmak'tan hazırlık raporu", metin: "Çakmak, birliklerin durumuna dair kısa bir rapor gönderdi. Silah ve yedek parça ihtiyacı özellikle vurgulanıyor." }],
      },
      {
        id: "ikisi", ad: "İkisini birlikte kabul et", aciklama: "Aynı masada dinle.",
        kazanc: "İkisi de her şeyi duyar.", bedel: "Kimse açık konuşmaz.",
        tepki: "İkisi de seni sessizce dinledi, ama aralarında bir gerginlik hissettin.",
        alan: { ekonomi: 2, ordu: 2, kurumlar: -3 },
        kapi: { acildi: ["İkisini aynı masada görme"], kapandi: ["Açık ve ayrı konuşma"] },
        sonrasi: [{ gun: 8, ad: "Ortak toplantı yankı buldu", metin: "Üçünüzün aynı masada oturduğu haberi bakanlıklarda konuşuluyor. Kimin sözünün daha ağır bastığı merak ediliyor." }],
      },
      bekle("Sarayın bahçesinde dolaştın. Notlar masada kaldı.", {
        gun: 8, ad: "Cevapsız kalan notlar", metin: "Bayar'la Çakmak ayrı ayrı bekleyip gitti. Notlar iki gün sonra yeniden geldi.",
        etki: [{ tur: "gosterge", ad: "ekonomi", delta: -1 }, { tur: "gosterge", ad: "ordu", delta: -1 }],
      }, "Notları masada bırak, yürüyüşe çık."),
    ],
  }),
  ...kartYaz({
    id: "kart-iki-kapi",
    ad: "İki kapı",
    aciklama:
      "Avrupa'da savaş kokusu var. İngiltere sana yakınlaşmayı öneriyor, Almanya ise ticaretin en önemli ortaklarından biri. Londra'nın bu işte ne kadar ciddi olduğunu bilmiyorsun.",
    tarih: "1938-11-21",
    danismanlar: [
      { kisi: "bayar", oneri: "almanya", gorus: "Almanya'yla ticareti kesersek çiftçi ve fabrika zor durumda kalır." },
      { kisi: "cakmak", oneri: "oyala", gorus: "Orduyu donatmak için silah gerekiyor. Kimden alacağımız önemli; kapıları kapatmayalım." },
    ],
    secenekler: [
      {
        id: "ingiltere", ad: "İngiltere'ye yaklaş",
        kazanc: "Kredi ve güvenlik güvencesi.", bedel: "Almanya ile ticaret ve ilişki soğur.",
        tepki: "İngiliz büyükelçisine olumlu bir cevap verdin. Berlin'e bir şey söylemedin.",
        alan: { disPolitika: 8, ordu: 4, ekonomi: -5 },
        kapi: { acildi: ["İngiltere ile kredi görüşmeleri"], kapandi: ["Almanya ile ek ticaret anlaşması"] },
        sonrasi: [
          { gun: 14, ad: "Kredi görüşmeleri hakkında çelişen haberler", metin: "Bir gazete İngiltere ile kredi görüşmelerinin onaylandığını yazıyor, bir diğeri görüşmelerin takıldığını. Hangisinin doğru olduğunu bilmiyorsun." },
          { gun: 28, ad: "Bayar'dan telgraf: görüşmeler ilerliyor", metin: "Bayar'ın telgrafına göre kredi görüşmeleri ilerliyor; takıldığını yazan haber yanlışmış." },
        ],
      },
      {
        id: "almanya", ad: "Almanya ile ticareti sürdür",
        kazanc: "Ekonomi rahat nefes alır.", bedel: "İngiltere ve Fransa güvenmez.",
        tepki: "Berlin'e ticaretin süreceğini bildirdin. Londra'ya cevap vermedin.",
        alan: { ekonomi: 6, disPolitika: -5 },
        kapi: { acildi: ["Almanya ile yeni ticaret görüşmesi"], kapandi: ["İngiliz kredisi"] },
        sonrasi: [
          { gun: 14, ad: "Berlin ticaret görüşmelerinde esnek", metin: "Berlin ticaret görüşmelerinde esnek davranıyor. Londra'dan ise ses çıkmıyor." },
          { gun: 28, ad: "Londra'nın sessizliği sürüyor", metin: "Bir İngiliz gazetesi Türkiye'nin Almanya'ya yakınlaştığını yazdı. Londra resmî bir açıklama yapmadı." },
        ],
      },
      {
        id: "oyala", ad: "İkisini de oyala",
        kazanc: "Savaş çıkana kadar vakit kazanırsın.", bedel: "İki taraf da seni güvenilmez bulabilir.",
        tepki: "İkisine de \"inceleyeceğiz\" dedin. Kimse memnun değil ama kimse küsmedi.",
        alan: { ekonomi: 2, disPolitika: -3 },
        kapi: { acildi: ["İki tarafla da görüşme imkânı"], kapandi: ["Güvenilir arabulucu görünmek"] },
        sonrasi: [{ gun: 14, ad: "İki başkent de sabırsız", metin: "Hem Londra hem Berlin, cevabını netleştirmeni bekliyor. İkisi de sabırsızlanıyor." }],
      },
      bekle("Telgraflar masada bekledi. Kimseye cevap vermedin.", {
        gun: 14, ad: "Büyükelçiler cevap bekliyor", metin: "Telgraflar cevapsız kaldı. Londra ve Berlin büyükelçileri Ankara'nın tutumunu başka kaynaklardan öğrenmeye çalışıyor.",
        etki: [{ tur: "gosterge", ad: "disPolitika", delta: -3 }],
      }),
    ],
  }),
  ...kartYaz({
    id: "kart-tek-ses",
    ad: "Tek ses",
    aciklama:
      "Parti ve meclis tek ses. Yeni bir muhalefet partisine izin verirsen ülke açılır ama kontrol zorlaşır. Parti içinde kaç kişinin arkanda olduğunu bilmiyorsun.",
    tarih: "1938-12-12",
    danismanlar: [
      { kisi: "bayar", oneri: "kontrollu", gorus: "Kontrollü bir muhalefet yönetimi güçlendirir." },
      { kisi: "inonu", oneri: "parti", gorus: "Önce kurumlar oturmalı. Erken açılırsak iş elimizden çıkar." },
    ],
    secenekler: [
      {
        id: "kontrollu", ad: "Kontrollü muhalefete izin ver",
        kazanc: "Halk sesini duyar, sistem sağlamlaşır.", bedel: "Parti içinde huzursuzluk, kontrol zorlaşır.",
        tepki: "Karar henüz kimseye duyurulmadı, ama ilk haber sızdı bile.",
        alan: { kurumlar: 9, halk: 4, ordu: -3 },
        kapi: { acildi: ["Meclis'te açık tartışma"], kapandi: ["Tek ses düzeni"] },
        sonrasi: [{ gun: 28, ad: "Meclis'te ilk açık karşı çıkış", metin: "Meclis'te iki mebus ilk kez hükümetin bütçesine açıkça karşı çıktı. Gazeteler bunu günlerce tartıştı." }],
      },
      {
        id: "parti", ad: "Partiyi içeriden yenile",
        kazanc: "Kimse sarsılmaz.", bedel: "Dışarıdan gelen baskı birikir.",
        tepki: "Parti içinde yeni isimler konuşulmaya başladı.",
        alan: { kurumlar: 4, halk: -3 },
        kapi: { acildi: ["Parti içi yenilenme"], kapandi: ["Hızlı bir açılım"] },
        sonrasi: [{ gun: 28, ad: "Partide yeni isimler", metin: "Parti içinde yeni isimler öne çıktı. Dışarıda ise yenilenmenin ne anlama geldiği tartışılıyor." }],
      },
      {
        id: "bagimsiz", ad: "Meclis içinde bağımsız grup kur",
        kazanc: "Orta yol.", bedel: "İki taraf da memnun olmaz.",
        tepki: "Bağımsız grup fikri ilk kez yüksek sesle söylendi.",
        alan: { kurumlar: 5, ordu: -2 },
        kapi: { acildi: ["Bağımsız bir grupla çalışma"], kapandi: ["Net bir taraf tutma"] },
        sonrasi: [{ gun: 28, ad: "Bağımsız grup tartışması", metin: "Bağımsız grup henüz kurulmadan tartışma çıktı: kimin gruba gireceği ve neyi savunacağı belli değil." }],
      },
      bekle("Meclis tek sesle çalışmayı sürdürdü.", {
        gun: 28, ad: "Koridorlarda huzursuzluk", metin: "Meclis tek sesle çalışmayı sürdürdü, ama koridorlarda bir huzursuzluk konuşuluyor.",
        etki: [{ tur: "gosterge", ad: "kurumlar", delta: -2 }],
      }),
    ],
  }),
  ...kartYaz({
    id: "kart-iki-davet",
    ad: "İki davet",
    aciklama:
      "Anadolu'ya uzun bir gezi planlıyorsun. Aynı hafta Ankara'da önemli bir kabine toplantısı var. İkisine birden yetişemezsin.",
    tarih: "1939-01-16",
    secenekler: [
      {
        id: "gezi", ad: "Geziye çık",
        kazanc: "Halkla bağın güçlenir.", bedel: "Ankara'da kararları başkaları alır.",
        tepki: "Valiye haber gitti. Bir şehir seni hazırlıkla bekliyor.",
        alan: { halk: 8, egitim: 3, kurumlar: -3, ekonomi: -2 },
        kapi: { acildi: ["Halkla yüz yüze görüşme"], kapandi: ["Bu haftaki kabine kararı"] },
        sonrasi: [{ gun: 21, ad: "Gezide halk seni karşıladı", metin: "Gittiğin şehirde halk seni sokaklarda karşıladı, bir okulun açılışına katıldın. Ankara'da ise kabine, sen yokken bir karar aldı." }],
      },
      {
        id: "ankara", ad: "Ankara'da kal",
        kazanc: "Hükümete yön verirsin.", bedel: "Halkla temas azalır, gezi iptal olur.",
        tepki: "Gezi programı iptal edildi. Kabine toplantısına hazırlanıyorsun.",
        alan: { ekonomi: 4, kurumlar: 3, halk: -3 },
        kapi: { acildi: ["Kabinede söz sahibi olma"], kapandi: ["Anadolu gezisi"] },
        sonrasi: [{ gun: 21, ad: "Kabine hızlı karar verdi", metin: "Kabine toplantısında bütçe gündemi sen yön verince hızla sonuçlandı. Gezinin iptal edildiği duyuldu ve Anadolu'da hayal kırıklığı yarattı." }],
      },
      {
        id: "kisa", ad: "Kabineyi bırakıp kısa bir geziye çık",
        kazanc: "İkisinden de biraz.", bedel: "İkisi de yarım kalır.",
        tepki: "Gezi programı kısaltıldı. Kabine toplantısı ertelendi.",
        alan: { halk: 4, kurumlar: -1, ekonomi: -1 },
        kapi: { acildi: ["İki şehirde kısa temas"], kapandi: ["Uzun gezi"] },
        sonrasi: [{ gun: 21, ad: "Kısa gezi, ertelenen toplantı", metin: "Kısa gezi iki şehri kapsadı. Kabine kararları ise bir sonraki toplantıya ertelendi." }],
      },
      bekle("Kimseye cevap vermedin. İki program da askıda kaldı.", {
        gun: 21, ad: "Gezi de toplantı da askıda", metin: "Gezi de toplantı da askıda kaldı. Gazeteler programın neden iptal edildiğini soruyor.",
        etki: [{ tur: "gosterge", ad: "halk", delta: -2 }, { tur: "gosterge", ad: "kurumlar", delta: -1 }],
      }),
    ],
  }),
  // Pasif ay: oyuncu bir şey yapmasa da dünya ilerler.
  {
    id: "kis", ad: "Kış", tarih: "1939-02-14",
    aciklama: "Kış sert geçiyor. Bazı köylerde yollar karla kapandı, yardım isteniyor.",
    kosul: { gostergeEnFazla: { halk: 40 } },
    etkiler: [{ tur: "gosterge", ad: "halk", delta: -2 }], onem: "siradan", haberGecikmesiGun: 3,
  },
  {
    id: "ordu-sikayeti", ad: "Çakmak'tan kısa bir not", tarih: "1939-02-20",
    aciklama: "Çakmak'tan kısa bir not geldi: bazı birliklerin levazımı gecikiyor.",
    kosul: { gostergeEnFazla: { ordu: 48 } },
    etkiler: [{ tur: "gosterge", ad: "ordu", delta: -2 }], onem: "siradan", haberGecikmesiGun: 1,
  },
  // Telgraflar: üç zamanlı hamle.
  ...kartYaz({
    id: "kart-telgraf-1",
    ad: "Masadaki iki telgraf",
    aciklama:
      "Gece. Masada iki telgraf var: biri Londra'dan, biri Berlin'den. Çekoslovakya'nın işgalinin üzerinden iki gün geçti. Önce hangisini açarsın?",
    tarih: "1939-03-17", sure: 15,
    secenekler: [
      { id: "londra", ad: "Londra'yı aç", aciklama: "İlk önce İngiltere'nin ne dediğine bak.", kazanc: "İngiltere'nin niyetini ilk elden okursun.", bedel: "Berlin beklemiş olur.", tepki: "Londra'nın telgrafı sana doğrudan soruyordu: Ankara'nın tutumu nedir?", alan: { disPolitika: 2, ekonomi: -1 },
        sonrasi: [{ gun: 7, ad: "Berlin'in telgrafını Bayar özetledi", metin: "Berlin'in telgrafını Bayar açıp özetledi. Özet, Berlin'in ticareti tehdit etmediğini söylüyor." }] },
      { id: "berlin", ad: "Berlin'i aç", aciklama: "İlk önce Almanya'nın ne dediğine bak.", kazanc: "Ticaret güvencesini erken öğrenirsin.", bedel: "Londra beklemiş olur.", tepki: "Berlin'in telgrafı ticaretin sürmesini istiyor ve cevap bekliyor.", alan: { ekonomi: 2, disPolitika: -1 },
        sonrasi: [{ gun: 7, ad: "Londra'nın telgrafını Bayar özetledi", metin: "Londra'nın telgrafını Bayar açıp özetledi. Özet, Londra'nın cevabı bekleyemeyeceğini söylüyor." }] },
      { id: "bayar", ad: "Bayar'ı çağır", aciklama: "Telgrafları birlikte aç.", kazanc: "Hükümetin görüşünü hemen alırsın.", bedel: "Cevap gecikir, Bayar'ın yorumu seni etkiler.", tepki: "Bayar odaya girdi ve iki telgrafı kendi yorumuyla özetledi.", alan: { kurumlar: 2, disPolitika: -1 },
        sonrasi: [{ gun: 7, ad: "Bayar'ın yorumu bakanlıklara ulaştı", metin: "Bayar'ın iki telgraf hakkındaki yorumu bakanlıklara ulaştı. Herkes aynı özeti konuşuyor." }] },
      bekle("Telgrafları açmadın. Bayar odaya girdi ve ikisini de kendisi açtı.", {
        gun: 7, ad: "Telgrafları Bayar özetledi", metin: "Telgrafların ilk özetini Bayar yaptı ve konuya kendi yorumunu kattı.", etki: [{ tur: "gosterge", ad: "kurumlar", delta: -1 }],
      }),
    ],
  }),
  ...kartYaz({
    id: "kart-telgraf-2",
    ad: "Çakmak'ın sorusu",
    aciklama: "Genelkurmay Başkanı Çakmak içeri girdi: «Orduyu sorarlarsa ne diyeyim?» (kurgu diyalog)",
    tarih: "1939-03-17", sure: 20,
    kosul: { olayOldu: ["kart-telgraf-1"] },
    secenekler: [
      { id: "acik", ad: "Açık söyle: hazır değiliz", aciklama: "Dürüst ol.", kazanc: "Ordu sana güvenir.", bedel: "Dışarıda zayıf görünürsün.", tepki: "Çakmak başını salladı. «Anladım.»", alan: { ordu: 3, disPolitika: -2 },
        sonrasi: [{ gun: 10, ad: "Ordunun durumu dışarıya sızdı", metin: "Ordunun hazırlık durumu hakkındaki bilgi yabancı başkentlerde konuşuluyor." }] },
      { id: "blof", ad: "Hazırız de", aciklama: "Güçlü görün.", kazanc: "Dışarıda güçlü görünürsün.", bedel: "Ordu içinde gerçeğe aykırı bulunur.", tepki: "Çakmak bir an durdu, sonra «Peki» dedi.", alan: { disPolitika: 3, ordu: -3 },
        sonrasi: [{ gun: 10, ad: "Yabancı gözlemciler duruma bakacak", metin: "Yabancı gözlemciler birliklerin durumuna bakmak istediklerini bildirdi." }] },
      { id: "zaman", ad: "Sen bakacaksın, sonra söylersin", aciklama: "Zaman kazan.", kazanc: "Gerçek durumu öğrenme fırsatı.", bedel: "Cevap gecikir, dışarıda bir boşluk kalır.", tepki: "Çakmak «Emredersiniz» dedi ve odadan çıktı.", alan: { ordu: 1, disPolitika: -1 },
        sonrasi: [{ gun: 10, ad: "Çakmak durumu inceliyor", metin: "Çakmak birliklerin durumunu yerinde inceleyeceğini bildirdi." }] },
      bekle("Çakmak soruyu tekrarlamadı. Kendi cevabını verdi.", {
        gun: 10, ad: "Çakmak kendi cevabını verdi", metin: "Çakmak soruya kendi cevabını verdi; senin ne düşündüğünü bilmeden konuştu.", etki: [{ tur: "gosterge", ad: "ordu", delta: -2 }],
      }),
    ],
  }),
  ...kartYaz({
    id: "kart-telgraf-3",
    ad: "Cevap",
    aciklama: "Cevabı sen yazıyorsun. İkisi de yazılı bir tutum istiyor.",
    tarih: "1939-03-17", sure: 30,
    kosul: { olayOldu: ["kart-telgraf-2"] },
    secenekler: [
      { id: "ingiltere", ad: "İngiltere'ye açık yakınlaşma", aciklama: "Londra'ya açık bir cevap ver.", kazanc: "Londra ile ortak tutum.", bedel: "Berlin'le ticaret zora girer.", tepki: "Cevap Londra'ya yola çıktı. Berlin henüz bilmiyor.", alan: { disPolitika: 7, ordu: 3, ekonomi: -4 },
        kapi: { acildi: ["Londra'yla ortak tutum"], kapandi: ["Berlin'le tarafsızlık güvencesi"] },
        sonrasi: [{ gun: 14, ad: "Berlin tepki gösterdi", metin: "Berlin, Ankara'nın İngiltere'ye yakınlaştığını fark etti ve ticaret görüşmelerini yavaşlattı." }] },
      { id: "berlin", ad: "Berlin'e tarafsızlık güvencesi", aciklama: "Berlin'e tarafsız kalacağını yaz.", kazanc: "Ticaret ve güvence.", bedel: "Londra güvenmez.", tepki: "Berlin'e güvence yazıldı. Londra'ya henüz bir şey söylenmedi.", alan: { ekonomi: 5, disPolitika: -4 },
        kapi: { acildi: ["Berlin'le ticaret güvencesi"], kapandi: ["Londra'yla yakınlaşma"] },
        sonrasi: [{ gun: 14, ad: "Londra sessiz", metin: "Londra, Ankara'nın Berlin'e verdiği güvenceyi öğrendi ve kredi görüşmelerini askıya aldı." }] },
      { id: "ayni", ad: "İkisine aynı cevap", aciklama: "Aynı metni ikisine gönder.", kazanc: "İki kapı da aralık kalır.", bedel: "İki taraf da şüphelenir.", tepki: "Aynı metin iki başkente de yola çıktı.", alan: { disPolitika: 3, ekonomi: 1, ordu: -2 },
        kapi: { acildi: ["İki kapı da aralık"], kapandi: ["Net bir taraf"] },
        sonrasi: [{ gun: 14, ad: "İki başkent de açık cevap istiyor", metin: "İki başkent de aynı cevabı aldığını fark etti ve ikisi de daha açık bir tutum istiyor." }] },
      bekle("Süre doldu. Cevabı hükümet yazıp gönderdi.", {
        gun: 14, ad: "Hükümetin cevabı", metin: "Cevabı hükümet yazdı; tutumunu duymayan iki taraf da kendi tahminini yapıyor.", etki: [{ tur: "gosterge", ad: "disPolitika", delta: -3 }],
      }),
    ],
  }),
  // Yankı: Mart'taki cevabın Haziran'daki sonucu.
  ...kartYaz({
    id: "kart-yanki-parca",
    ad: "Fabrikada durma",
    aciklama:
      "Bayar'dan bir not: İngiliz kredisi geldi ama Almanya'dan beklenen makine parçaları durdu. Bir fabrikada üretim yarıda.",
    tarih: "1939-06-12",
    kosul: { bayrakVar: ["kart-telgraf-3:ingiltere"] },
    yanki: "kart-telgraf-3:ingiltere",
    secenekler: [
      { id: "ingiliz-parca", ad: "Parçayı İngiltere'den almaya çalış", kazanc: "Londra ile ortak tutum pekişir.", bedel: "Parça pahalıya gelir.", tepki: "Londra'ya bir talep yazıldı. Fabrika beklemeye devam ediyor.", alan: { disPolitika: 3, ekonomi: -2 },
        kapi: { acildi: ["İngiliz sanayi malzemesi"], kapandi: ["Almanya'dan hızlı tedarik"] },
        sonrasi: [{ gun: 12, ad: "İngiliz parçası yolda", metin: "İngiltere'den gelecek parça için sipariş verildi. Teslim tarihi belirsiz." }] },
      { id: "alman-gorus", ad: "Almanya'yla ayrı bir görüşme aç", kazanc: "Parçalar hızla gelebilir.", bedel: "Londra bunu hoş karşılamaz.", tepki: "Berlin'e bir görüşme talebi yollandı.", alan: { ekonomi: 3, disPolitika: -3 },
        kapi: { acildi: ["Almanya'yla yeniden temas"], kapandi: ["Londra'yla tam uyum"] },
        sonrasi: [{ gun: 12, ad: "Berlin görüşmeye açık", metin: "Berlin görüşmeye açık olduğunu bildirdi. Londra bu haberi sert karşıladı." }] },
      bekle("Not cevapsız kaldı. Fabrika beklemeye devam etti.", {
        gun: 12, ad: "Fabrikada üretim durdu", metin: "Fabrikada üretim hâlâ yarıda. İşçilerin bir kısmı izne çıkarıldı.", etki: [{ tur: "gosterge", ad: "ekonomi", delta: -3 }],
      }),
    ],
  }),
  {
    id: "yanki-berlin", ad: "Londra kredisi rafa kalktı", tarih: "1939-06-12", yanki: "kart-telgraf-3:berlin",
    aciklama: "Mart'ta Berlin'e tarafsızlık güvencesi vermiştin. Londra'nın kredi görüşmeleri sessizce rafa kalktı; ticaret ise sürüyor.",
    kosul: { bayrakVar: ["kart-telgraf-3:berlin"] }, etkiler: [{ tur: "gosterge", ad: "ekonomi", delta: 2 }, { tur: "gosterge", ad: "disPolitika", delta: -2 }], onem: "buyuk", haberGecikmesiGun: 1,
  },
  {
    id: "yanki-ayni", ad: "İki başkent de yeniden yazdı", tarih: "1939-06-12", yanki: "kart-telgraf-3:ayni",
    aciklama: "Mart'ta ikisine aynı cevabı vermiştin. Haziran'da ikisi de seni açıkça tarafa çekmek için yeniden yazdı.",
    kosul: { bayrakVar: ["kart-telgraf-3:ayni"] }, etkiler: [{ tur: "gosterge", ad: "disPolitika", delta: -1 }], onem: "buyuk", haberGecikmesiGun: 1,
  },
  {
    id: "yanki-bekle", ad: "Cevabı başkaları yazmıştı", tarih: "1939-06-12", yanki: "kart-telgraf-3:bekle",
    aciklama: "Mart'ta süre dolmuş, cevabı hükümet yazmıştı. Haziran'da bu cevabın sonuçlarıyla karşılaşıyorsun.",
    kosul: { bayrakVar: ["kart-telgraf-3:bekle"] }, etkiler: [{ tur: "gosterge", ad: "disPolitika", delta: -2 }], onem: "buyuk", haberGecikmesiGun: 1,
  },
];

const notr = (): Iliski => ({ guven: 50, sadakat: 50, yakinlik: 50, siyasiUyum: 50 });

export function sonrasiSenaryosu(): Senaryo {
  const dunya: OlayTanimi[] = tarihselVeriyiYukle().olaylar
    .filter((o) => o.tur === "dunya")
    .map((o) => ({
      id: o.id, tarihselOlayId: o.id, tarih: o.tarih, onem: "buyuk" as const, haberGecikmesiGun: 2,
      // Avrupa'daki işgal olağanüstü bir durum yaratır: devletin aynı anda üstlenebileceği iş üç ay daralır.
      etkiler: o.id === "cekoslovakya" ? [{ tur: "havuz" as const, delta: -1, ay: 3 }] : [],
    }));
  const olaylar = [...kartlar, ...dunya]
    .map((o, i) => ({ o, i }))
    .sort((a, b) => a.o.tarih.localeCompare(b.o.tarih) || a.i - b.i)
    .map((x) => x.o);
  return {
    id: "sonrasi-1938",
    baslangic: "1938-11-10",
    bitis: "1939-06-30",
    gostergeSiniri: [0, 100],
    /** Öncelik sistemi (tasarım parametreleri; denge oynayınca ayarlanır). */
    oncelik: {
      alanlar: ["ekonomi", "ordu", "egitim", "disPolitika", "halk", "kurumlar"],
      baslangicHavuz: 3,
      havuzAralik: [2, 6],
      seviyeAralik: [-2, 2],
      aylikCarpan: 2,
      esikler: [{ yukari: 55, asagi: 50 }, { yukari: 70, asagi: 65 }, { yukari: 85, asagi: 80 }],
    },
    /** Altı alan (0-100). Başlangıç değerleri tasarımdır; tarihsel bir ölçüme dayanmaz. */
    gostergeler: { ekonomi: 44, ordu: 48, egitim: 40, disPolitika: 46, halk: 38, kurumlar: 36 },
    iliskiler: { bayar: notr(), cakmak: notr(), inonu: notr() },
    olaylar,
    eylemler: [],
  };
}
