import type { Durum } from "../engine/tipler";
import harita from "./harita-yol.json";

const noktalar = harita.noktalar as unknown as Record<string, [number, number]>;
const SEHIRLER = ["İstanbul", "Ankara", "İzmir", "Adana", "Samsun", "Erzurum"];

/** Sadeleştirilmiş harita: şehirler ve bulunduğun yer. İşlevsel katmanlar sonraki turda eklenecek. */
export function Harita({ durum }: { durum: Durum }) {
  const yer = "İstanbul";
  const [ox, oy] = noktalar[yer]!;
  return (
    <svg className="harita" viewBox={`0 0 ${harita.genislik} ${harita.yukseklik}`} role="img" aria-label={`Türkiye haritası. Bulunduğun yer: ${yer}. Tarih: ${durum.tarih}.`}>
      <rect width={harita.genislik} height={harita.yukseklik} className="deniz" />
      <path d={harita.yol} className="kara" />
      {SEHIRLER.map((ad) => {
        const [x, y] = noktalar[ad]!;
        return (
          <g key={ad}>
            <circle cx={x} cy={y} r="3.2" className="sehir-nokta" />
            <text x={x + 8} y={y + 5} className="sehir-ad">{ad}</text>
          </g>
        );
      })}
      <g className="oyuncu">
        <circle cx={ox} cy={oy} r="13" className="oyuncu-hale" />
        <circle cx={ox} cy={oy} r="6" className="oyuncu-nokta" />
      </g>
    </svg>
  );
}
