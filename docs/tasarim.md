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

### Aday olay omurgası

**Bu liste taslaktır.** Her madde veri katmanına girmeden önce kaynakla doğrulanacak; tarih ve ayrıntılar doğrulamadan sonra kesinleşir.

| Tarih | Olay |
|---|---|
| 30 Ekim 1918 | Mondros Mütarekesi |
| 31 Ekim 1918 | Mustafa Kemal, Yıldırım Orduları Grubu komutanlığını Adana'da devralır |
| Kasım 1918 başı | Ahmet İzzet Paşa kabinesinin istifası; Yıldırım Orduları Grubu'nun kaldırılması |
| 13 Kasım 1918 | İstanbul'a varış; İtilaf donanmasının Boğaz'a girişi |
| Kasım 1918 | Tevfik Paşa kabinesi ve güvenoyu süreci |
| Kasım 1918 – | Minber gazetesi; padişahla görüşmeler; Şişli'deki evde görüşmeler |
| 21 Aralık 1918 | Meclis-i Mebusan'ın feshi |
| 1918 sonu – 1919 başı | Güneyde ve başka bölgelerde işgaller |
| 4 Mart 1919 | Damat Ferit Paşa kabinesi |
| 30 Nisan 1919 | 9. Ordu Kıtaatı Müfettişliği'ne atanma |
| 15 Mayıs 1919 | İzmir'in işgali |
| 16 Mayıs 1919 | İstanbul'dan ayrılış |
| 19 Mayıs 1919 | Samsun |

### Aday durma anları

1. **Adana:** Mütareke hükümlerinin uygulanmasına ve İstanbul'a çağrıya karşı tutum.
2. **İstanbul'a varış:** Siyasete girme biçimi (kabine çevreleri, basın, saray, geri planda kalma).
3. **İstanbul ayları:** Bir yakın çevre kurma ve Anadolu için hazırlık mı, İstanbul'da çözüm arayışı mı.
4. **Görev teklifi:** Müfettişlik görevini ve yetki kapsamını kabul etme biçimi.
5. **Ayrılış öncesi:** İzmir'in işgali haberi karşısında tutum.

Pasif kalan oyuncu için de dönem bir sonla kapanır: görev başkasına gider ya da hiç verilmez, işgaller ilerler ve oyun bunu alternatif tarih olarak anlatır.

### Aday karakterler

Rauf (Orbay), Ali Fuat (Cebesoy), Kâzım Karabekir, İsmet (İnönü), Fethi (Okyar), Refet (Bele), Ahmet İzzet Paşa, Tevfik Paşa, Damat Ferit Paşa, Sultan Vahdettin. Liste doğrulama sırasında daralabilir ya da genişleyebilir.

Her karakter için ayrı izlenen boyutlar: sadakat, güven, kişisel yakınlık, siyasi uyum, rekabet ya da husumet, kişisel hedefler.

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
