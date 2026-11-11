// Haritanın kara parçası yolunu üretir (Natural Earth verisi, world-atlas paketi).
// Çıktı: src/ui/harita-yol.json. Siyasi sınır çizilmez; yalnızca kıyı ve kara.
import { readFileSync, writeFileSync } from "node:fs";
import { feature } from "topojson-client";
import { geoMercator, geoPath } from "d3-geo";

const topo = JSON.parse(readFileSync("node_modules/world-atlas/land-50m.json", "utf8"));
const kara = feature(topo, topo.objects.land);
const GENISLIK = 1000, YUKSEKLIK = 520;
// Köşe noktaları: küresel çokgenin sarım yönü sorununa düşmemek için çokgen yerine nokta kümesi kullanılır.
const kutu = { type: "MultiPoint", coordinates: [[24.5, 34.6], [45.5, 34.6], [45.5, 43.2], [24.5, 43.2]] };
const projeksiyon = geoMercator().fitExtent([[0, 0], [GENISLIK, YUKSEKLIK]], kutu).clipExtent([[-5, -5], [GENISLIK + 5, YUKSEKLIK + 5]]).precision(0.3);
// Yol yarım piksele yuvarlanır ve art arda yinelenen noktalar atılır; dosya küçük kalır.
const ham = geoPath(projeksiyon)(kara);
const yol = ham
  .split(/(?=M)/)
  .map((parca) => {
    const noktalar = parca.replace(/Z$/, "").slice(1).split("L").map((n) => n.split(",").map((v) => Math.round(Number(v) * 2) / 2).join(","));
    const tekil = noktalar.filter((n, i) => i === 0 || n !== noktalar[i - 1]);
    // Birkaç pikselden küçük adacıklar ve göller atılır; yalnızca iki pikselden uzak noktalar tutulur.
    const sayi = tekil.map((n) => n.split(",").map(Number));
    const xs = sayi.map((n) => n[0]), ys = sayi.map((n) => n[1]);
    if (Math.max(...xs) - Math.min(...xs) < 3 && Math.max(...ys) - Math.min(...ys) < 3) return "";
    const seyrek = [];
    for (const n of sayi) {
      const son = seyrek[seyrek.length - 1];
      if (!son || Math.abs(n[0] - son[0]) + Math.abs(n[1] - son[1]) >= 1) seyrek.push(n);
    }
    return seyrek.length > 2 ? `M${seyrek.map((n) => n.join(",")).join("L")}Z` : "";
  })
  .join("");
const sehirler = {
  "İstanbul": [28.98, 41.01], "Adana": [35.32, 37.0], "İskenderun": [36.17, 36.59], "Musul": [43.13, 36.34],
  "Çanakkale": [26.41, 40.15], "Antakya": [36.16, 36.2], "Kilis": [37.12, 36.72], "Dörtyol": [36.22, 36.85],
  "Pozantı": [34.87, 37.43], "Maraş": [36.93, 37.58], "Urfa": [38.79, 37.16], "Antalya": [30.71, 36.89],
  "Kars": [43.1, 40.6], "Afyonkarahisar": [30.54, 38.76], "Konya": [32.48, 37.87], "İzmir": [27.14, 38.42],
  "Samsun": [36.33, 41.29], "Erzurum": [41.27, 39.9], "Sivas": [37.02, 39.75], "Ankara": [32.86, 39.93],
};
const noktalar = Object.fromEntries(Object.entries(sehirler).map(([ad, k]) => [ad, projeksiyon(k).map((v) => Math.round(v * 10) / 10)]));
writeFileSync("src/ui/harita-yol.json", JSON.stringify({ genislik: GENISLIK, yukseklik: YUKSEKLIK, yol, noktalar }));
console.log("yol uzunluğu", yol.length, "nokta", Object.keys(noktalar).length);
