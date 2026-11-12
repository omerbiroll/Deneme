# Atatürk 10 Kasım 1938'de Ölmeseydi: Alternatif Tarih Simülasyonu

Bu dosya her oturumda okunur. Buradaki kurallar bağlayıcıdır. Ayrıntı için:

- `docs/kararlar.md`: kullanıcının verdiği kararların kaydı (tek doğru kaynak)
- `docs/tasarim.md`: oyun tasarımı, yapılanlar ve yapılmayanlar
- `docs/mimari.md`: teknik mimari
- `docs/veri-durumu.md`: tarihsel verinin doğrulama durumu, eksikler

## Proje durumu

Önceki proje (1918, Mondros sonrası) kullanıcı tarafından iptal edildi; yeni oyun 11–12 Kasım 2026'da kâğıt üstünde tasarlanıp onaylandı. Motor, nedensellik ve kayıt altyapısı korundu; senaryo, veri, metin ve arayüz yeniden yazıldı.

İlk oynanabilir dilim hazır: 10 Kasım 1938 – 30 Haziran 1939, 8 karar kartı (3'ü zamanlı), pasif aylar, yankı sahneleri, sonuç kartı, bölüm sonu şeması, gerçek tarihle (Atatürk'süz) karşılaştırma ve **öncelik sistemi** (alanlara artı/eksi, havuz, eşikler, kriz, "kapasite daraldı" anı). Henüz yok: dikkat ve etkinlikler, işlevsel harita, dallanan kayıt.

## Değişmez kurallar

1. **Vizyonu kendi başına değiştirme.** `docs/kararlar.md` içindeki kararlar kullanıcıya sorulmadan değiştirilmez. Küçük teknik iyileştirmeler serbest; büyük oynanış ya da mimari değişikliği önce önerilir, onay alınır. Önemli sorular tek tek, öneriyle sorulur.
2. **Tarihsel veri ile simülasyon ayrı tutulur.** Gerçek zemin yalnızca `data/tarih/` altında durur ve `src/data/sema.ts` ile doğrulanır; oyun kuralları `src/senaryo/` altındadır.
3. **Kaynaksız tarihsel veri girilmez.** Her kayıtta kaynak zorunlu. Tam metinden okunmayan kayıt `dogrulama: "arama-ozeti"` ve kaynak notuyla işaretlenir. Tartışmalı bilgi işaretlenir. Hafızadan tarih yazılmaz; doğrulanamayan şey veriye girmez.
4. **Uydurma karakter yok.** Kartlarda yalnızca veride kaynaklı gerçek kişiler konuşur. Onlara söyletilen sözler kurgudur ve her zaman "Simülasyon: kurgu diyalog" etiketi taşır.
5. **Üç içerik türü arayüzde ayrı görünür:** gerçek tarih, gerçek tarih (Atatürk'süz) karşılaştırması, simülasyon. Karşılaştırma yalnızca o günün tarihi geçince açılır.
6. **Yapay zekâ sonuç belirlemez.** Sonuçları oyun kuralları belirler; metin katmanı yalnızca hesaplanmış olanı anlatır.
7. **Nedensellik motor kaydına dayanır.** Her etkinin nedeni kayıtlıdır; "Bu neden oldu?" bu kayıttan okur.
8. **Belirlenimcilik.** Aynı tohum ve aynı kararlar aynı sonucu verir.
9. **Karar kartı kuralları:** her kartta "Hiçbir şey yapma" bulunur. İkilemli kartta her seçeneğin kazancı ve bedeli yazılıdır ve hem kazandırıp hem kaybettirir (zamanlı anlarda kazanç ve bedel karardan sonra açılır). Her seçeneğin **yalnızca kendisine ait** bir sonucu olmalıdır; bunu `tests/senaryo/sonrasi.test.ts` içindeki "seçim yanılsaması dedektörü" denetler. Kart ekleyince dedektörün geçmesi şarttır.
10. **Sonuç gösterimi:** en fazla dört satır, düz Türkçe, sayısız. Türleri: Kapı, Kişi, Alan. Sonuçlar üç aşamada gelir: hemen (tepki), haftalar sonra (haber), aylar sonra (yankı).
11. **Hedef kitle genel okur.** Sade dil; zor terimler `src/ui/sozluk.ts` ile dokununca açıklanır. Dönemin atmosferi korunur, okunabilirlik öncelikli.
12. **Yalnızca telefon.** PC ve geniş ekran desteklenmez ve test edilmez; geniş ekranda telefon genişliğinde tek sütun görünür.
13. **Test edilmeden "bitti" denmez.** Tarihsel doğruluk testleri ile yazılım testleri ayrı tutulur. Yeni bir kural testi yazınca, kuralı bozup testin gerçekten patladığını bir kez doğrula.
14. **Hassas konular** (hastalık, ölüm, tartışmalı yargılamalar) kaynağın ifadesiyle, hüküm vermeden aktarılır. Atatürk'e dair yasal sınırlar için yayın öncesi uzman görüşü gerekir.
15. Detroit: Become Human'dan yalnızca mekanikler (dallanan sahneler, zamanlı anlar, şema) alınır; adı, karakterleri ve görünümü alınmaz.

## Kullanıcıyla çalışma

- İletişim dili Türkçe, samimi ve kısa. Kullanıcı yalnızca önemli kararları verir.
- Karara bağlanmış konu tekrar sorulmaz. Yeni karar `docs/kararlar.md` dosyasına işlenir.
- Her aşama sonunda: ne tamamlandı, ne eksik, test sonucu, sıradaki adım, onay bekleyen kararlar.
- Kullanıcı sıkıldığını söylerse nedenini dürüstçe teşhis et, tasarımı kâğıt üstünde dene, sonra kodla.

## Geliştirme

- Çalışma dalı: `claude/ataturk-history-simulation-g882pk` (silme isteği GitHub tarafından reddedildi; dal durur).
- Testler: `npm test`. Tip denetimi: `npm run typecheck`. Geliştirme: `npm run dev`. Derleme: `npm run build`.
- Arayüz denemesi (telefon boyutunda baştan sona oynatır; öncelik ekranı, kapasite daraldı anı, süre dolması, kayıt): `scripts/arayuz-denemesi.cjs`. Düğme ararken `exact: true` kullan; "Durum" gibi adlar haber başlıklarıyla karışır.
- Paylaşılabilir tek dosya önizleme: `npx vite build -c vite.tekdosya.config.ts && python3 -I scripts/onizleme-uret.py <çıktı.html>`.
- Harita kıyı çizgisi `npm run harita` ile üretilir (`land-50m`; `land-10m` kırpmada bozuluyor, kullanma).
- Kaynak sitelerine erişim "Deneme" ortamında açık; ktb.gov.tr bağlantısı zaman zaman kopar, tekrar dene. `www.ktb.gov.tr` yanıt vermez.
- Silme istekleri (dal, repo) ağ geçidinde reddedilebilir; kullanıcı GitHub'dan kendisi yapar.
