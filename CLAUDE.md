# Atatürk Tarihsel Yaşam ve Alternatif Tarih Simülasyonu

Bu dosya her oturumda okunur. Buradaki kurallar bağlayıcıdır. Ayrıntı için:

- `docs/kararlar.md`: kullanıcının verdiği kararların kaydı (tek doğru kaynak)
- `docs/tasarim.md`: oyun tasarımı ve prototip kapsamı
- `docs/mimari.md`: teknik mimari
- `docs/veri-durumu.md`: tarihsel verinin doğrulama durumu, eksikler, bekleyen hassas konular

## Proje durumu

Mimari ve tasarım ilkeleri onaylandı (11 Kasım 2026). 1. dönemin ilk tarihsel verisi ve veri şeması hazır (`docs/veri-durumu.md`). Zaman, olay, karar ve nedensellik motoru hazır (`src/engine/`, test senaryosuyla). 1. dönem senaryosu hazır (`src/senaryo/donem1.ts`). Sıradaki iş: arayüz iskeleti (beş sekme, harita) ve metin katmanı.

## Değişmez kurallar

1. **Vizyonu kendi başına değiştirme.** `docs/kararlar.md` içindeki kararlar kullanıcıya sorulmadan değiştirilmez. Küçük ve uyumlu teknik iyileştirmeler serbest; büyük mimari ya da oynanış değişikliği önce önerilir, onay alınır.
2. **Tarihsel veri ile simülasyon durumu ayrı tutulur.** Aynı dosyada, aynı veri modelinde karışmaz.
3. **Kaynaksız tarihsel veri girilmez.** Her tarihsel kayıtta kaynak alanı zorunlu. Tartışmalı bilgi işaretlenir. Uydurma olay, belge, kişi eklenmez.
4. **Gerçek tarih, tarihçi yorumu, simülasyon sonucu ve spekülasyon arayüzde ayrı gösterilir.** Simülasyonun ürettiği belge ve diyalog her zaman "simülasyon" etiketi taşır.
5. **Yapay zekâ sonuç belirlemez.** Sonuçları, ilişkileri, olayları ve son tipini oyun kuralları belirler. Metin katmanı yalnızca hesaplanmış olanı anlatır.
6. **Nedensellik motor kaydına dayanır.** Her önemli karar ve her etkisi kayıtlıdır; anlatım metninden türetilmez.
7. **Belirlenimcilik.** Aynı başlangıç, aynı kararlar ve aynı tohum aynı sonucu verir.
8. **"Hiçbir şey yapma" her karar kartında bulunur.** Oyun karar vermeye zorlamaz.
9. **Oyuncu yalnızca dönemin koşullarında bilebileceğini bilir.** Simülasyonun gerçek durumu ile oyuncunun bildiği ayrı tutulur.
10. **Tüm oyuncu metinleri Türkçe.** Döneme yakın ama rahat okunur; aşırı Osmanlıca da aşırı modern de değil.
11. **Mobil öncelikli, tek kod tabanı.** Mobil, PC'nin küçültülmüşü değildir; ikisi de ayrı test edilir.
12. **Test edilmeden "bitti" denmez.** Tarihsel doğruluk testleri ile yazılım testleri ayrı tutulur.

## Kullanıcıyla çalışma

- Kullanıcı yalnızca önemli ürün kararlarını verir. Sorular tek tek sorulur; her soruda öneri ve en fazla 3–4 seçenek sunulur.
- Karara bağlanmış konu tekrar sorulmaz. Yeni karar `docs/kararlar.md` dosyasına işlenir.
- İletişim dili Türkçe, samimi ve kısa.
- Her aşama sonunda: ne tamamlandı, ne eksik, test sonucu, sıradaki adım, onay bekleyen kararlar.

## Geliştirme

- Çalışma dalı: `claude/ataturk-history-simulation-g882pk`
- Testler: `npm test`. Tip denetimi: `npm run typecheck`.
- Tarihsel veri yalnızca `data/tarih/` altında durur ve `src/data/sema.ts` şemasıyla doğrulanır.
- Kaynak sitelerine erişim "Deneme" ortamında açık; ayrıntı `docs/veri-durumu.md` içinde.
