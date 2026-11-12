# Oyun Tasarımı

Kararların kaynağı `docs/kararlar.md`.

## Temel döngü

1. Oyun 10 Kasım 1938'de açılır; ilk kart hemen çıkar.
2. Zaman olaydan olaya akar (bir hafta ilerle ya da bir sonraki karara kadar bekle). Oyuncuyu doğrudan ilgilendiren bir gelişmede oyun durur ve karar kartı çıkar.
3. Kart: kısa durum anlatımı, (varsa) çevredekilerin görüşü, seçenekler. Her seçenekte kazanç ve bedel görünür; zamanlı anlarda gizlidir.
4. Karardan sonra **sonuç kartı** çıkar: tepki, açılan ve kapanan kapılar, değişen kişi ve alanlar.
5. Haftalar sonra haberler, aylar sonra yankı sahneleri gelir.
6. Her şey "Bu neden oldu?" ile sorgulanabilir.
7. Bölüm sonunda şema ve gerçek tarihle karşılaştırma açılır.

## İlk dilim: 10 Kasım 1938 – 30 Haziran 1939

Senaryo: `src/senaryo/sonrasi.ts` (oyun kuralı). Tarihsel zemin: `data/tarih/`.

| Tarih | Kart | Not |
|---|---|---|
| 10 Kasım 1938 | Sabah notları | Öğretici; Bayar ya da Çakmak |
| 21 Kasım 1938 | İki kapı | İngiltere mi, Almanya mı; Bayar ve Çakmak çelişir |
| 12 Aralık 1938 | Tek ses | Muhalefet; Bayar ve İnönü çelişir |
| 16 Ocak 1939 | İki davet | Anadolu gezisi mi, kabine mi |
| 17 Mart 1939 | Telgraflar (3 zamanlı hamle) | Çekoslovakya'nın işgalinin ardından |
| 12 Haziran 1939 | Yankı | Mart'taki cevabın sonucu |

Pasif sahneler: kış haberi (halk ihmal edilirse), Çakmak'ın levazım notu (ordu ihmal edilirse), Çekoslovakya'nın işgali (gerçek dünya olayı).

## Alanlar

Altı alan, 0–100. Başlangıç değerleri tasarımdır, ölçüme dayanmaz. Kartlar alanları değiştirir; bazı olaylar alanın düşük olmasına bağlıdır. Öncelik ve eşik sistemi henüz yok (bkz. kararlar).

## Yapılanlar

Motor, nedensellik, kayıt (otomatik, cihazda), açılış ekranları, kartlar, zamanlı anlar, sonuç kartı, yankı, şema, karşılaştırma, terim sözlüğü, beş sekmeli arayüz, telefon ve PC düzeni.

## Yapılmayanlar

- Öncelik ekranı, havuz ve eşikler.
- Dikkat ve etkinlikler (ilişki ve bilgi sahneleri).
- İşlevsel harita (şu an yalnızca şehirler ve yer işareti).
- Dallanan kayıt, karşılaştırma ekranı.
- Haber metinlerinin zenginleştirilmesi, kartlar arası kişilik tutarlılığı.
- İsmet İnönü için ayrı sahneler; Hatay ve diğer 1939 olayları.

## Ton

Atatürk saygı gören bir tarihî şahsiyettir. Oyun onu küçültmez; ikilemleri gerçek ve ciddidir. Hassas konular (hastalık, ölüm, tartışmalı yargılamalar) hüküm verilmeden, kaynağın ifadesiyle aktarılır.
