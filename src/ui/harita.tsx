import type { Durum } from "../engine/tipler";
import harita from "./harita-yol.json";

/**
 * Haritadaki işgal işaretleri. Güç adları tarihsel olay açıklamalarından alınmıştır.
 * İzmir için kaynak kronolojisi gücü adlandırmaz; Yunan kuvvetleri bilgisi akademik
 * kaynakların arama özetlerine dayanır.
 */
const ISGALLER: Record<string, { sehir: string; guc: Guc }> = {
  "musul-isgali": { sehir: "Musul", guc: "ingiliz" },
  "canakkale-isgali": { sehir: "Çanakkale", guc: "ingiliz" },
  "iskenderun-cikarma": { sehir: "İskenderun", guc: "ingiliz" },
  "kilis-isgali": { sehir: "Kilis", guc: "ingiliz" },
  "antakya-isgali": { sehir: "Antakya", guc: "fransiz" },
  "dortyol-isgali": { sehir: "Dörtyol", guc: "fransiz" },
  "adana-isgali": { sehir: "Adana", guc: "fransiz" },
  "pozanti-isgali": { sehir: "Pozantı", guc: "itilaf" },
  "maras-isgali": { sehir: "Maraş", guc: "ingiliz" },
  "urfa-isgali": { sehir: "Urfa", guc: "ingiliz" },
  "antalya-isgali": { sehir: "Antalya", guc: "italyan" },
  "kars-isgali": { sehir: "Kars", guc: "ingiliz" },
  "afyon-isgali": { sehir: "Afyonkarahisar", guc: "fransiz" },
  "konya-italyan": { sehir: "Konya", guc: "italyan" },
  "izmir-isgali": { sehir: "İzmir", guc: "yunan" },
  "itilaf-donanmasi-istanbul": { sehir: "İstanbul", guc: "itilaf" },
};

type Guc = "ingiliz" | "fransiz" | "italyan" | "yunan" | "itilaf";

export const GUCLER: Record<Guc, string> = {
  ingiliz: "İngiliz", fransiz: "Fransız", italyan: "İtalyan", yunan: "Yunan", itilaf: "İtilaf (ortak)",
};

const noktalar = harita.noktalar as unknown as Record<string, [number, number]>;
const ETIKETLI = ["İstanbul", "İzmir", "Ankara", "Samsun", "Erzurum", "Adana", "Sivas", "Konya", "Musul", "Antalya", "Kars"];

function oyuncununYeri(d: Durum): string {
  if ("samsun" in d.gerceklesen) return "Samsun";
  if ("istanbul-varis" in d.gerceklesen) return "İstanbul";
  return "Adana";
}

export function Harita({ durum, onSehir }: { durum: Durum; onSehir?: (olayId: string) => void }) {
  // Harita yalnızca oyuncuya ulaşmış haberleri gösterir; yoldaki haberler görünmez.
  const bilinen = durum.oyuncuBilgisi.filter((b) => b.durum === "gerceklesti" && ISGALLER[b.olayId]);
  const yer = oyuncununYeri(durum);
  const [ox, oy] = noktalar[yer]!;

  return (
    <svg className="harita" viewBox={`0 0 ${harita.genislik} ${harita.yukseklik}`} role="img" aria-label={`İşgal haritası. Bilinen işgal sayısı: ${bilinen.length}. Bulunduğun yer: ${yer}.`}>
      <defs>
        {(Object.keys(GUCLER) as Guc[]).map((g, i) => (
          <pattern key={g} id={`tarama-${g}`} width="7" height="7" patternUnits="userSpaceOnUse" patternTransform={`rotate(${35 + i * 28})`}>
            <rect width="7" height="7" className={`tarama-zemin guc-${g}`} />
            <line x1="0" y1="0" x2="0" y2="7" className={`tarama-cizgi guc-${g}`} />
          </pattern>
        ))}
      </defs>
      <rect width={harita.genislik} height={harita.yukseklik} className="deniz" />
      <path d={harita.yol} className="kara" />
      {bilinen.map((b) => {
        const { sehir, guc } = ISGALLER[b.olayId]!;
        const [x, y] = noktalar[sehir]!;
        return (
          <g key={b.olayId} className="isgal" onClick={() => onSehir?.(b.olayId)}>
            <circle cx={x} cy={y} r="24" style={{ fill: `url(#tarama-${guc})` }} className={`isgal-alan kenar-${guc}`} />
            <title>{`${sehir}: ${GUCLER[guc]} işgali`}</title>
          </g>
        );
      })}
      {ETIKETLI.map((ad) => {
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

export function HaritaLejandi({ durum }: { durum: Durum }) {
  const gorulen = new Set(
    durum.oyuncuBilgisi.filter((b) => b.durum === "gerceklesti" && ISGALLER[b.olayId]).map((b) => ISGALLER[b.olayId]!.guc),
  );
  if (!gorulen.size) return <p className="lejant-bos">Haritada henüz bildiğin bir işgal yok.</p>;
  return (
    <ul className="lejant">
      {(Object.keys(GUCLER) as Guc[]).filter((g) => gorulen.has(g)).map((g) => (
        <li key={g}><span className={`lejant-kutu guc-${g}`} />{GUCLER[g]}</li>
      ))}
      <li><span className="lejant-kutu lejant-oyuncu" />Bulunduğun yer</li>
    </ul>
  );
}
