import { useEffect, useState, type ReactNode } from "react";
import { useOyun, type Oyun } from "./oyun";
import { Harita, HaritaLejandi } from "./harita";
import {
  haberler, tarihYaz, kisaTarih, kararAdi, eylemMetni, GOSTERGELER, KISILER, ILISKI_ALANLARI, KAPANISLAR,
  type Haber, type Etiket,
} from "./metin";
import { olayiEtkileyenKararlar, kararinSonuclari } from "../engine/nedensellik";
import { donem1Kapanisi } from "../senaryo/donem1";
import type { IliskiAlani, KararKaydi } from "../engine/tipler";

type Sekme = "harita" | "haberler" | "yazismalar" | "durum" | "fazla";

const SEKMELER: { id: Sekme; ad: string; ikon: ReactNode }[] = [
  { id: "harita", ad: "Harita", ikon: <path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2Zm0 0v14m6-12v14" /> },
  { id: "haberler", ad: "Haberler", ikon: <path d="M4 5h13v14H6a2 2 0 0 1-2-2V5Zm13 4h3v8a2 2 0 0 1-2 2M8 9h5M8 13h5M8 16h3" /> },
  { id: "yazismalar", ad: "Yazışmalar", ikon: <path d="M3 6h18v12H3V6Zm0 1 9 6 9-6" /> },
  { id: "durum", ad: "Durum", ikon: <path d="M5 20V10m7 10V4m7 16v-7" /> },
  { id: "fazla", ad: "Daha Fazla", ikon: <path d="M5 12h.01M12 12h.01M19 12h.01" strokeWidth="3" /> },
];

const ETIKET_ADI: Record<Etiket, string> = {
  gercek: "Gerçek tarih",
  alternatif: "Alternatif tarih",
  simulasyon: "Simülasyon",
};

function Ikon({ children }: { children: ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  );
}

function EtiketRozeti({ etiket }: { etiket: Etiket }) {
  return <span className={`rozet rozet-${etiket}`}>{ETIKET_ADI[etiket]}</span>;
}

function Katman({ baslik, kapat, children, genis }: { baslik: string; kapat?: () => void; children: ReactNode; genis?: boolean }) {
  useEffect(() => {
    if (!kapat) return;
    const dinle = (e: KeyboardEvent) => e.key === "Escape" && kapat();
    window.addEventListener("keydown", dinle);
    return () => window.removeEventListener("keydown", dinle);
  }, [kapat]);
  return (
    <div className="katman" role="dialog" aria-modal="true" aria-label={baslik} onClick={kapat}>
      <div className={`katman-ic${genis ? " katman-genis" : ""}`} onClick={(e) => e.stopPropagation()}>
        {kapat && (
          <button className="katman-kapat" onClick={kapat} aria-label="Kapat">
            <Ikon><path d="M6 6l12 12M18 6 6 18" /></Ikon>
          </button>
        )}
        {children}
      </div>
    </div>
  );
}

function KararListesi({ oyun, idler, bos }: { oyun: Oyun; idler: string[]; bos?: string }) {
  if (!idler.length) return bos ? <p className="soluk">{bos}</p> : null;
  return (
    <ul className="karar-listesi">
      {idler.map((id) => {
        const k = oyun.durum.kararlar.find((x) => x.id === id);
        if (!k) return null;
        const ad = kararAdi(k, oyun.senaryo);
        return (
          <li key={id}>
            <time>{tarihYaz(k.tarih)}</time>
            <strong>{ad.baslik}</strong>
            <span>{ad.secim}</span>
          </li>
        );
      })}
    </ul>
  );
}

function NedenPaneli({ oyun, olayId }: { oyun: Oyun; olayId: string }) {
  const { dogrudan, dolayli } = olayiEtkileyenKararlar(oyun.durum, olayId);
  if (!dogrudan.length && !dolayli.length) {
    return <p className="neden-bos">Bu gelişmede senin kararlarının kayıtlı bir etkisi yok. Olaylar kendi akışında ilerledi.</p>;
  }
  return (
    <div className="neden">
      {dogrudan.length > 0 && (<><h4>Doğrudan etkileyen kararın</h4><KararListesi oyun={oyun} idler={dogrudan} /></>)}
      {dolayli.length > 0 && (<><h4>Başka gelişmeler üzerinden etkileyen kararın</h4><KararListesi oyun={oyun} idler={dolayli} /></>)}
    </div>
  );
}

function HaberDetayi({ oyun, haber, kapat }: { oyun: Oyun; haber: Haber; kapat: () => void }) {
  const [neden, setNeden] = useState(false);
  return (
    <Katman baslik={haber.baslik} kapat={kapat}>
      <EtiketRozeti etiket={haber.etiket} />
      <h2 className="belge-baslik">{haber.baslik}</h2>
      <p className="belge-kunye">{[haber.yer, tarihYaz(haber.tarih)].filter(Boolean).join(", ")}</p>
      <p className="belge-metin">{haber.metin}</p>
      {haber.teslim !== haber.tarih && <p className="soluk">Haber sana {tarihYaz(haber.teslim)} günü ulaştı.</p>}
      {haber.tartismaNotu && <p className="not"><strong>Kaynaklar ayrışıyor.</strong> {haber.tartismaNotu}</p>}
      {haber.hassasKonu && <p className="not"><strong>Tartışmalı konu.</strong> Kaynağın ifadesiyle, yorum eklenmeden aktarılmıştır.</p>}
      {haber.kaynak && (
        <p className="kaynak">
          Kaynak: <a href={haber.kaynak.url} target="_blank" rel="noreferrer">{haber.kaynak.baslik}</a>, {haber.kaynak.yayin}
        </p>
      )}
      {neden ? <NedenPaneli oyun={oyun} olayId={haber.olayId} /> : (
        <button className="dugme dugme-ikincil" onClick={() => setNeden(true)}>Bu neden oldu?</button>
      )}
    </Katman>
  );
}

function HaberSatiri({ haber, ac }: { haber: Haber; ac: () => void }) {
  return (
    <li>
      <button className={`haber haber-${haber.etiket}${haber.onemli ? " haber-onemli" : ""}`} onClick={ac}>
        <span className="haber-ust">
          <time>{kisaTarih(haber.tarih)}</time>
          {haber.etiket !== "gercek" && <EtiketRozeti etiket={haber.etiket} />}
        </span>
        <span className="haber-baslik">{haber.baslik}</span>
        {haber.onemli && <span className="haber-ozet">{haber.metin}</span>}
      </button>
    </li>
  );
}

function ZamanDenetimi({ oyun }: { oyun: Oyun }) {
  return (
    <div className="zaman">
      <button className="dugme dugme-ana" onClick={oyun.haftaIlerle}>Bir hafta ilerle</button>
      <button className="dugme dugme-ikincil" onClick={oyun.kararaKadarIlerle}>Bir sonraki karara kadar bekle</button>
    </div>
  );
}

function Gosterge({ baslik, deger, aciklama }: { baslik: string; deger: number; aciklama?: string }) {
  const d = Math.max(0, Math.min(100, deger));
  return (
    <div className="gosterge">
      <div className="gosterge-ust"><span>{baslik}</span><span className="gosterge-deger">{d}</span></div>
      <div className="gosterge-cubuk" role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={d} aria-label={baslik}>
        <span style={{ width: `${d}%` }} />
      </div>
      {aciklama && <p className="soluk">{aciklama}</p>}
    </div>
  );
}

function HaritaSekmesi({ oyun, liste, ac }: { oyun: Oyun; liste: Haber[]; ac: (h: Haber) => void }) {
  return (
    <div className="ana-izgara">
      <section className="harita-kutu" aria-label="Harita">
        <Harita durum={oyun.durum} onSehir={(id) => { const h = liste.find((x) => x.olayId === id); if (h) ac(h); }} />
        <HaritaLejandi durum={oyun.durum} />
        <ZamanDenetimi oyun={oyun} />
      </section>
      <section className="yan" aria-label="Son gelişmeler">
        <h2 className="bolum-baslik">Son gelişmeler</h2>
        {liste.length === 0 ? (
          <p className="soluk">Henüz sana ulaşan bir haber yok. Zamanı ilerlet; dünya senden bağımsız olarak hareket ediyor.</p>
        ) : (
          <ul className="haber-listesi">{liste.slice(0, 5).map((h) => <HaberSatiri key={h.anahtar} haber={h} ac={() => ac(h)} />)}</ul>
        )}
        <h2 className="bolum-baslik">Durumun</h2>
        <div className="gosterge-izgara">
          {GOSTERGELER.map((g) => <Gosterge key={g.ad} baslik={g.baslik} deger={oyun.durum.gostergeler[g.ad] ?? 0} />)}
        </div>
      </section>
    </div>
  );
}

function YazismalarSekmesi({ oyun, liste, ac }: { oyun: Oyun; liste: Haber[]; ac: (h: Haber) => void }) {
  const eylemKararlari = oyun.durum.kararlar.filter((k) => k.tur === "eylem");
  const kisisel = liste.filter((h) => h.kisisel);
  return (
    <div className="tek-sutun">
      <h2 className="bolum-baslik">Girişimde bulun</h2>
      {oyun.eylemler.length === 0 ? (
        <p className="soluk">Şu an yapabileceğin bir görüşme ya da yazışma yok. Bulunduğun yer ve zaman değiştikçe yeni imkânlar açılır.</p>
      ) : (
        <ul className="eylem-listesi">
          {oyun.eylemler.map((id) => {
            const e = oyun.senaryo.eylemler.find((x) => x.id === id)!;
            return <li key={id}><button className="dugme dugme-ikincil dugme-genis" onClick={() => oyun.eylemYap(id)}>{e.ad}</button></li>;
          })}
        </ul>
      )}
      <p className="soluk">Sonuç, o kişiyle ilişkine ve içinde bulunduğun koşullara bağlıdır. Her girişim bir kez yapılır.</p>

      <h2 className="bolum-baslik">Görüşmeler ve yazışmalar</h2>
      {eylemKararlari.length === 0 && kisisel.length === 0 && <p className="soluk">Henüz bir görüşmen ya da yazışman yok.</p>}
      <ul className="yazisma-listesi">
        {[...eylemKararlari].reverse().map((k: KararKaydi, i) => {
          const sira = eylemKararlari.length - 1 - i;
          return (
            <li key={k.id} className="yazisma">
              <div className="yazisma-ust"><time>{tarihYaz(k.tarih)}</time><span className="rozet rozet-simulasyon">Simülasyon: kurgu diyalog</span></div>
              <strong>{kararAdi(k, oyun.senaryo).baslik}</strong>
              <p>{eylemMetni(k, sira + oyun.durum.tohum)}</p>
            </li>
          );
        })}
        {kisisel.map((h) => <HaberSatiri key={h.anahtar} haber={h} ac={() => ac(h)} />)}
      </ul>
    </div>
  );
}

function DurumSekmesi({ oyun }: { oyun: Oyun }) {
  const d = oyun.durum;
  return (
    <div className="tek-sutun">
      <h2 className="bolum-baslik">Göstergeler</h2>
      <p className="soluk">Bu değerler simülasyonun kendi ölçüleridir; gerçek bir tarihsel ölçüme dayanmaz.</p>
      <div className="gosterge-izgara">
        {GOSTERGELER.map((g) => <Gosterge key={g.ad} baslik={g.baslik} deger={d.gostergeler[g.ad] ?? 0} aciklama={g.aciklama} />)}
      </div>
      <h2 className="bolum-baslik">İlişkiler</h2>
      <div className="iliski-izgara">
        {Object.entries(d.iliskiler).map(([kisi, il]) => (
          <div key={kisi} className="iliski">
            <h3>{KISILER[kisi] ?? kisi}</h3>
            {(Object.keys(ILISKI_ALANLARI) as IliskiAlani[]).map((a) => <Gosterge key={a} baslik={ILISKI_ALANLARI[a]!} deger={il[a]} />)}
          </div>
        ))}
      </div>
      <h2 className="bolum-baslik">Kararların</h2>
      <KararListesi oyun={oyun} idler={d.kararlar.map((k) => k.id)} bos="Henüz bir karar vermedin." />
    </div>
  );
}

function FazlaSekmesi({ oyun }: { oyun: Oyun }) {
  const [onay, setOnay] = useState(false);
  const [gorus, setGorus] = useState("");
  const [gonderildi, setGonderildi] = useState("");
  async function gorusPaylas() {
    const metin = `1918 oyunu için görüş (${tarihYaz(oyun.durum.tarih)}):\n${gorus}`;
    try {
      if (navigator.share) await navigator.share({ text: metin });
      else { await navigator.clipboard.writeText(metin); setGonderildi("Görüşün panoya kopyalandı; istediğin yere yapıştırıp gönderebilirsin."); }
    } catch { setGonderildi("Paylaşım açılamadı. Metni elle kopyalayabilirsin."); }
  }
  return (
    <div className="tek-sutun">
      <h2 className="bolum-baslik">Oyun</h2>
      <p>Oyun her adımda bu cihaza kendiliğinden kaydedilir.</p>
      {onay ? (
        <div className="onay">
          <p>Yeni oyun başlatırsan şimdiki oyunun silinir. Bu geri alınamaz.</p>
          <button className="dugme dugme-ana" onClick={() => { oyun.yeniOyun(); setOnay(false); }}>Şimdiki oyunu sil ve yeniden başla</button>
          <button className="dugme dugme-ikincil" onClick={() => setOnay(false)}>Vazgeç</button>
        </div>
      ) : <button className="dugme dugme-ikincil" onClick={() => setOnay(true)}>Yeni oyun başlat</button>}

      <h2 className="bolum-baslik">Görüş gönder</h2>
      <label className="alan">
        <span>Neyi beğendin, ne eksik, ne yanlış?</span>
        <textarea rows={4} value={gorus} onChange={(e) => setGorus(e.target.value)} />
      </label>
      <button className="dugme dugme-ikincil" disabled={!gorus.trim()} onClick={gorusPaylas}>Görüşü paylaş</button>
      {gonderildi && <p className="soluk">{gonderildi}</p>}

      <h2 className="bolum-baslik">Bu oyun hakkında</h2>
      <p>Bu bir tarih simülasyonudur. Mondros Mütarekesi'nden sonra Mustafa Kemal farklı kararlar alsaydı ne olurdu sorusunu dener.</p>
      <ul className="hakkinda">
        <li><EtiketRozeti etiket="gercek" /> Kaynağa dayanan gerçek olaylar. Her birinde kaynak gösterilir.</li>
        <li><EtiketRozeti etiket="alternatif" /> Bu oyunda gerçek tarihten sapan gelişmeler.</li>
        <li><EtiketRozeti etiket="simulasyon" /> Oyunun ürettiği içerik: kararlar, göstergeler ve kurgu diyaloglar. Tarihsel belge değildir.</li>
      </ul>
      <p>Görüşmelerde tarihsel kişilere söyletilen sözler kurgudur; hiçbir kaynağa dayanmaz.</p>
      <p>Bu oyun yapay zekâyla (Claude) birlikte geliştirilmiştir. Erken bir deneme sürümüdür; yalnızca 30 Ekim 1918 ile Mayıs 1919 arasını kapsar.</p>
    </div>
  );
}

function KararKarti({ oyun }: { oyun: Oyun }) {
  const olay = oyun.senaryo.olaylar.find((o) => o.id === oyun.durum.bekleyenKart);
  if (!olay?.kart) return null;
  return (
    <Katman baslik={olay.ad ?? "Karar"} genis>
      <p className="karar-kunye">{tarihYaz(oyun.durum.tarih)} <EtiketRozeti etiket="simulasyon" /></p>
      <h2 className="belge-baslik">{olay.ad}</h2>
      <p className="belge-metin">{olay.aciklama}</p>
      <ul className="secenekler">
        {olay.kart.secenekler.map((s) => (
          <li key={s.id}>
            <button className="secenek" onClick={() => oyun.kararVer(s.id)}>
              <strong>{s.ad}</strong>
              {s.aciklama && <span>{s.aciklama}</span>}
            </button>
          </li>
        ))}
      </ul>
    </Katman>
  );
}

function DonemSonu({ oyun, liste }: { oyun: Oyun; liste: Haber[] }) {
  const d = oyun.durum;
  const kapanis = KAPANISLAR[donem1Kapanisi(d)];
  const sapmalar = liste.filter((h) => h.etiket === "alternatif").reverse();
  const kartKararlari = d.kararlar.filter((k) => k.tur === "kart");
  return (
    <Katman baslik="Dönemin sonu" genis>
      <p className="karar-kunye">{tarihYaz(d.tarih)} <EtiketRozeti etiket="simulasyon" /></p>
      <h2 className="belge-baslik">{kapanis.baslik}</h2>
      <p className="belge-metin">{kapanis.metin}</p>

      <h3 className="bolum-baslik">Gerçek tarihten sapmalar</h3>
      {sapmalar.length === 0 ? (
        <p className="soluk">Bu oyunda kayıtlı bütün olaylar gerçek tarihteki gününde gerçekleşti.</p>
      ) : (
        <ul className="sapma-listesi">{sapmalar.map((h) => <li key={h.anahtar}><strong>{h.baslik}</strong><span>{h.metin}</span></li>)}</ul>
      )}

      <h3 className="bolum-baslik">Kararların ve sonuçları</h3>
      <ul className="sonuc-listesi">
        {kartKararlari.map((k) => {
          const ad = kararAdi(k, oyun.senaryo);
          const s = kararinSonuclari(d, k.id);
          const baslik = (id: string) => liste.find((h) => h.olayId === id)?.baslik.replace(/^Gerçekleşmedi: /, "");
          const oldu = s.gerceklesenOlaylar.map(baslik).filter(Boolean);
          const olmadi = s.gerceklesmeyenOlaylar.map(baslik).filter(Boolean);
          return (
            <li key={k.id}>
              <time>{tarihYaz(k.tarih)}</time>
              <strong>{ad.baslik}: {ad.secim}</strong>
              {oldu.length > 0 && <p>Bu kararın etkisiyle gerçekleşti: {oldu.join("; ")}.</p>}
              {olmadi.length > 0 && <p>Bu kararın etkisiyle gerçekleşmedi: {olmadi.join("; ")}.</p>}
              {!oldu.length && !olmadi.length && <p className="soluk">Kayıtlı bir olaya etkisi olmadı.</p>}
            </li>
          );
        })}
      </ul>
      <button className="dugme dugme-ana" onClick={oyun.yeniOyun}>Baştan oyna, farklı kararlar dene</button>
    </Katman>
  );
}

export function App() {
  const oyun = useOyun();
  const [sekme, setSekme] = useState<Sekme>("harita");
  const [acik, setAcik] = useState<Haber | null>(null);
  const [menu, setMenu] = useState(false);
  const liste = haberler(oyun.durum, oyun.senaryo, oyun.veri);
  const d = oyun.durum;

  useEffect(() => {
    if (sekme === "haberler") oyun.okunduIsaretle();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sekme, d.oyuncuBilgisi.length]);

  const git = (s: Sekme) => { setSekme(s); setMenu(false); window.scrollTo(0, 0); };

  return (
    <div className="uygulama">
      <header className="ust">
        <button className="ust-dugme menu-dugme" onClick={() => setMenu(true)} aria-label="Menüyü aç">
          <Ikon><path d="M4 7h16M4 12h16M4 17h16" /></Ikon>
        </button>
        <div className="ust-tarih">
          <span className="ust-gun">{tarihYaz(d.tarih)}</span>
          <span className="ust-yer">{"samsun" in d.gerceklesen ? "Samsun" : "istanbul-varis" in d.gerceklesen ? "İstanbul" : "Adana"}</span>
        </div>
        <button className="ust-dugme" onClick={() => git("haberler")} aria-label={`Bildirimler: ${oyun.okunmamis} yeni haber`}>
          <Ikon><path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15L6 16Zm4 4a2 2 0 0 0 4 0" /></Ikon>
          {oyun.okunmamis > 0 && <span className="sayac">{oyun.okunmamis}</span>}
        </button>
      </header>

      <nav className={`gezinti${menu ? " gezinti-acik" : ""}`} aria-label="Ana gezinti">
        {SEKMELER.map((s) => (
          <button key={s.id} className={`sekme${sekme === s.id ? " sekme-secili" : ""}`} aria-current={sekme === s.id ? "page" : undefined} onClick={() => git(s.id)}>
            <Ikon>{s.ikon}</Ikon>
            <span>{s.ad}</span>
          </button>
        ))}
      </nav>

      {menu && (
        <div className="cekmece-zemin" onClick={() => setMenu(false)}>
          <aside className="cekmece" onClick={(e) => e.stopPropagation()} aria-label="Yan menü">
            <p className="cekmece-baslik">Mondros'tan Sonra</p>
            {SEKMELER.map((s) => <button key={s.id} className="cekmece-satir" onClick={() => git(s.id)}>{s.ad}</button>)}
            <p className="soluk">Deneme sürümü. 30 Ekim 1918 – Mayıs 1919.</p>
          </aside>
        </div>
      )}

      <main className="icerik">
        {sekme === "harita" && <HaritaSekmesi oyun={oyun} liste={liste} ac={setAcik} />}
        {sekme === "haberler" && (
          <div className="tek-sutun">
            <h2 className="bolum-baslik">Haberler</h2>
            {liste.length === 0 ? <p className="soluk">Henüz sana ulaşan bir haber yok.</p> : (
              <ul className="haber-listesi">{liste.map((h) => <HaberSatiri key={h.anahtar} haber={h} ac={() => setAcik(h)} />)}</ul>
            )}
            <ZamanDenetimi oyun={oyun} />
          </div>
        )}
        {sekme === "yazismalar" && <YazismalarSekmesi oyun={oyun} liste={liste} ac={setAcik} />}
        {sekme === "durum" && <DurumSekmesi oyun={oyun} />}
        {sekme === "fazla" && <FazlaSekmesi oyun={oyun} />}
      </main>

      {acik && <HaberDetayi oyun={oyun} haber={acik} kapat={() => setAcik(null)} />}
      {d.bekleyenKart && <KararKarti oyun={oyun} />}
      {d.bitti && <DonemSonu oyun={oyun} liste={liste} />}
    </div>
  );
}
