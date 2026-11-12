# Teknik Mimari (11 Kasım 2026'da onaylandı; yeni oyun için de geçerli)

Not: Oyunun konusu değişti (bkz. `docs/kararlar.md`); mimari aynı kaldı. Senaryo `src/senaryo/sonrasi.ts`, veri `data/tarih/`, sonuç sorguları `src/engine/sonuc.ts` ve `nedensellik.ts` içindedir.

## Teknoloji

| Alan | Öneri | Gerekçe |
|---|---|---|
| Dil | TypeScript | Tek dil; motor ve arayüz aynı tipleri paylaşır |
| Arayüz | React + Vite | Yaygın, hızlı, mobil tarayıcıda hafif |
| Motor | Saf TypeScript paketi | Arayüzden bağımsız, tarayıcısız test edilir |
| Veri | Şemayla doğrulanan JSON dosyaları | Tarihsel veri koddan ve simülasyon durumundan ayrı |
| Harita | Özel çizilmiş SVG | Dönem estetiği, küçük boyut, mobil performans |
| Kayıt | Tarayıcıda IndexedDB | Sunucusuz; sonradan buluta taşınabilir arayüz |
| Test | Vitest (motor), Playwright (arayüz) | Mobil ve PC boyutlarında ayrı ayrı |
| Yayın | Statik barındırma | Prototipte sunucu ve maliyet yok |

## Katmanlar

Bağımlılık yönü yukarıdan aşağıya tektir; alt katman üsttekini bilmez.

1. **Arayüz:** yalnızca oyuncunun bildiği durumu gösterir, kural içermez.
2. **Anlatım:** hesaplanmış olayı metne çevirir (prototipte varyantlı şablon; sonra yapay zekâ takılabilir). Sonuç belirleyemez.
3. **Kayıt:** otomatik kayıt, karar öncesi anlık görüntü, zaman çizelgesi dalları.
4. **Motor:**
   - Zaman ve olay motoru
   - Karar ve eylem sistemi
   - Karakter ve ilişki motoru
   - Bilgi katmanı (gerçek durum ile oyuncunun bildiği ayrı)
   - Nedensellik kaydı
5. **Tarihsel veri:** salt okunur; olaylar, karakterler, kaynaklar.

## Temel ilkeler

- **Belirlenimcilik:** Motor saf işlevdir: (durum, eylem, tohum) → (yeni durum, olay kayıtları). Sistem saati ve tohumsuz rastgelelik kullanılmaz.
- **Kayıt = başlangıç + tohum + karar listesi.** Durum yeniden oynatılarak üretilebilir; dallanma, karşılaştırma ve hata tekrarı buradan gelir.
- **Nedensellik çizgesi:** Her durum değişikliği, onu doğuran karar ya da olaya bağ taşır (doğrudan ya da dolaylı). Panel bu çizgeyi okur.
- **İki durum:** `gerçekDurum` yalnızca motorda yaşar; arayüz `oyuncuBilgisi` görür.
- **Olay tanımı:** ön koşullar, tetikleyiciler, ilgili karakterler, olası sonuçlar, oyuncu müdahaleleri, diğer sistemlere etkiler. Olay koşulları sağlanmazsa gecikir, değişir ya da hiç gerçekleşmez.
- **Mod ayrıntısı:** Dört mod aynı sistemleri kullanır; yalnızca hesaplama ve sunum ayrıntısı değişir.

## Klasör taslağı

```
data/        tarihsel veri (olaylar, karakterler, kaynaklar) ve şemalar
src/engine/  simülasyon motoru (arayüzden bağımsız)
src/narrative/ anlatım ve metin varyantları
src/save/    kayıt ve zaman çizelgeleri
src/ui/      arayüz
tests/       motor testleri, tarihsel doğruluk testleri, arayüz testleri (ayrı klasörlerde)
```

## Testler

- Olayların doğru koşulda tetiklenmesi, gecikmesi ve gerçekleşmemesi
- Tamamen pasif oyunun sonuna kadar ilerlemesi
- Aynı tohum ve kararların aynı sonucu vermesi
- İlişki değişimleri
- Her durum değişikliğinin nedensellik kaydı taşıması
- Kayıt, yükleme ve dalların birbirine karışmaması
- Mobil ve PC'de kritik arayüz akışları
- Tarihsel doğruluk testleri ayrı: her kayıtta kaynak var mı, tarihler tutarlı mı

## Geliştirme sırası

1. Veri şeması ve 1. dönemin doğrulanmış tarihsel verisi
2. Zaman, olay ve karar motoru (arayüzsüz, testlerle)
3. Karakter ve ilişki sistemi
4. Nedensellik kaydı ve bilgi katmanı
5. Arayüz iskeleti: beş sekme, harita
6. Metin varyantları ve geri bildirim kanalları
7. Kayıt ve dallanma
8. Mobil ve PC testleri, denge, cila
