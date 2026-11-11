# Oyun Tasarımı

Kararların kaynağı `docs/kararlar.md`. Bu belge o kararların tasarıma dökülmüş hâlidir.

## Temel döngü

1. Zaman, olay ve dönem odaklı akar; gün gün mikro yönetim yok.
2. Dünya kendi kendine ilerler: İstanbul Hükümeti, işgal güçleri ve karakterler kendi hedeflerine göre davranır.
3. Gelişmeler oyuncuya dönemin kanallarından ulaşır: gazete, telgraf, mektup, rapor, görüşme. Bilgi gecikebilir, eksik ya da taraflı olabilir.
4. Oyuncu istediği an proaktif eylem yapar: görüşme, toplantı, telgraf ya da mektup, ikna, destek arama, girişim başlatma, bir planı destekleme ya da engelleme.
5. Mustafa Kemal'i doğrudan ilgilendiren bir gelişmede oyun durur ve karar kartı çıkar. Her kartta "hiçbir şey yapma" vardır.
6. Karar ve eylemlerin etkisi önce küçük bir anlık tepkiyle, sonra gecikmeli olarak kanallara düşer.
7. Oyuncu herhangi bir içerikte "Bu neden oldu?" diye sorup kayıtlı neden zincirini açabilir.

## Arayüz

- Atatürk'ün şahsi telefonu hissi; modern, temiz, premium.
- Alt menü: Harita, Haberler, Yazışmalar, Durum, Daha Fazla.
- Sol yan menü, sağ üstte bildirimler, ana ekranda harita, tarih ve güncel gelişmeler.
- PC'de aynı içerik geniş ekrana göre yeniden düzenlenir (örneğin harita ile akış yan yana); küçültülmüş mobil değildir.
- Üç içerik türü görsel olarak ayrışır:
  - **Gerçek belge:** kaynağıyla.
  - **Simülasyon içeriği:** "simülasyon" etiketiyle (kurgu diyaloglar dahil).
  - **Gerçek tarih karşılaştırması:** olayın tarihi geçtikten sonra açılır.

## Metin sistemi (tekrarı önleme)

Kullanıcı şartı: metin tekrara düşmemeli, kısır döngü olmamalı.

- Metin tek parça yazılmaz; simülasyon durumuna göre parçalardan kurulur (kim, nerede, sonuç, kamuoyu).
- Her durum için birden fazla varyant; motor son kullanılanı tekrar seçmez.
- Kaynağa göre ses değişir: İstanbul basını, Anadolu basını, yabancı rapor aynı gelişmeyi farklı anlatır.
- Metin oyuncunun önceki kararlarına gönderme yapar.
- Sıradan gelişmeler tek satır geçer; uzun metin önemli anlara ayrılır.
- Varyant seçimi tohumlu rastgelelikle yapılır; belirlenimcilik bozulmaz.

## Prototip: 1. dönem (30 Ekim 1918 – 19 Mayıs 1919)

Hedef 15–20 dakika, 2–3 anlamlı karar, 4–6 durma anı.

### Olay omurgası

Tarihsel olaylar `data/tarih/olaylar.json` dosyasındadır (49 olay, kaynaklı). Doğrulama durumu ve kaynakların ayrıştığı noktalar için `docs/veri-durumu.md`.

### Senaryo (kullanıcı 11 Kasım 2026'da onayladı)

Kurallar `src/senaryo/donem1.ts` dosyasındadır. **Senaryo oyun kuralıdır, tarih değildir:** seçenekler, göstergeler, ilişki değerleri ve sonuçlar tasarımdır ve arayüzde simülasyon olarak sunulur.

Beş durma anı:

| Tarih | Kart | Seçenekler |
|---|---|---|
| 3 Kasım 1918 | İskenderun'a çıkarma bildirimi | hiçbir şey yapma / itirazını yaz, emre uy / karşı koymakta ısrar et |
| 13 Kasım 1918 | İstanbul'a varış | hiçbir şey yapma / saray yolu / basın ve meclis yolu / ordu içinde çevre |
| 5 Mart 1919 | Çözüm arayışı | hiçbir şey yapma / Anadolu için hazırlan / İstanbul'da görev ara |
| 30 Nisan 1919 | Müfettişlik teklifi | hiçbir şey yapma / olduğu gibi kabul / geniş yetki şartıyla kabul / reddet |
| 15 Mayıs 1919 | İzmir haberi | hiçbir şey yapma / hemen yola çık / ertele, İstanbul'daki tepkiye katıl |

- Müfettişlik teklifi herkese gelmez: yeterli bağ kurulmuş olmalı ve oyuncu gözetim altında olmamalıdır. Bu bir tasarım tercihidir; Mustafa Kemal'in atanmasında kendi girişimlerinin payı tarihçiler arasında tartışmalıdır.
- Mustafa Kemal'in kendi eylemi olan tarihsel olaylar (itiraz, padişahla görüşme, Minber, Erzurum mektubu, atama, ayrılış, Samsun) kendiliğinden gerçekleşmez; oyuncunun kararına bağlıdır.
- "Geniş yetki" seçeneği arama özetlerine dayanır; atamadaki yetkilerin kapsamı tam metinden henüz doğrulanmadı.

Proaktif eylemler: Fethi Bey, Rauf Bey ve Kâzım Karabekir Paşa'yla görüşme, Minber'e demeç, Ali Fuat Paşa'ya mektup. Her biri bir kez yapılır; başarı ilişkiye ve tohumlu rastgeleliğe bağlıdır.

Göstergeler (tasarım): ordu içindeki nüfuz, sarayın güveni, İtilaf'ın şüphesi, kamuoyunda tanınırlık.

Kapanışlar: geniş yetkiyle Samsun / sınırlı yetkiyle ya da gecikmeli Samsun / İstanbul'da kalış / gözetim. Hiçbiri oyunu bitirmez.

İlişkilerin başlangıç değerleri tasarımdır: hepsi nötr başlar, yalnızca Fethi Bey'in yakınlığı biraz yüksektir (Minber'i birlikte çıkarmaları kaynaklıdır, sayıya dökülmesi yorumdur). İsmet Bey kaynakla doğrulanınca eklenecek.

### Prototipte sade tutulanlar

- Ekonomi, ordu ve diplomasi birkaç göstergeyle.
- Sağlık modeli kurulur ama bu dönemde belirgin rol oynamaz.
- Ölüm sonrası 50 yıl simülasyonu prototipte yok.
- Bulut kayıt yok; cihazda kayıt, dallanma ve dışa-içe aktarma var.

## En kritik üç risk

1. **Kapsam:** Prototip eğlenceli çıkmadan sistem eklenmez.
2. **Tarihsel doğruluk:** Kritik kayıtlar kaynağıyla kullanıcıya gösterilir.
3. **Pasif oyunun sıkıcılığı:** Prototipin asıl sınavı, hiçbir şey yapmayan oyuncunun da ilgiyle izlemesidir.

## Kaynak yaklaşımı

- **Birincil:** Nutuk, Atatürk'ün Bütün Eserleri, meclis zabıtları, antlaşma metinleri, Genelkurmay ATASE yayınları, dönem gazeteleri.
- **Akademik:** Hakemli yayınlar ve alanın temel monografileri.
- Her kayıtta kaynak ve güvenilirlik düzeyi tutulur. Tartışmalı konular işaretlenir.
- Nutuk tek başına kesin kabul edilmez; olaylardan sonra yazılmış, taraflı bir anlatıdır ve mümkün olan yerde başka kaynakla karşılaştırılır.
