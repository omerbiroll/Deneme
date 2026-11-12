import { useEffect, useState, type ReactNode } from "react";
import { useOyun, type Oyun } from "./oyun";
import { Harita } from "./harita";
import { TerimliMetin } from "./terimli";
import {
  haberler, tarihYaz, kisaTarih, kararAdi, akisSemasi, alanOzeti, alanCumlesi, iliskiCumlesi,
  ALANLAR, KISILER, type Haber, type Etiket,
} from "./metin";
import { olayiEtkileyenKararlar } from "../engine/nedensellik";
import { sonucSatirlari } from "../engine/sonuc";
import { BEKLE } from "../engine/motor";

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
  karsilastirma: "Gerçek tarih (Atatürk'süz)",
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
        return <li key={id}><time>{tarihYaz(k.tarih)}</time><strong>{ad.baslik}</strong><span>{ad.secim}</span></li>;
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
  const yanki = haber.yanki ? oyun.durum.kararlar.find((k) => k.id === haber.yanki) : undefined;
  return (
    <Katman baslik={haber.baslik} kapat={kapat}>
      <EtiketRozeti etiket={haber.etiket} />
      {yanki && (
        <p className="yanki">Hatırlıyor musun? {tarihYaz(yanki.tarih)}, {kararAdi(yanki, oyun.senaryo).baslik}: <strong>{kararAdi(yanki, oyun.senaryo).secim}</strong></p>
      )}
      <h2 className="belge-baslik">{haber.baslik}</h2>
      <p className="belge-kunye">{tarihYaz(haber.tarih)}</p>
      <TerimliMetin sinif="belge-metin" metin={haber.metin} />
      {haber.teslim > haber.tarih && <p className="soluk">Haber sana {tarihYaz(haber.teslim)} günü ulaştı.</p>}
      {haber.tartismaNotu && <p className="not"><strong>Kaynaklar ayrışıyor.</strong> {haber.tartismaNotu}</p>}
      {haber.etiket !== "simulasyon" && haber.kaynakNotu && <p className="not"><strong>Kaynak notu.</strong> {haber.kaynakNotu}</p>}
      {haber.kaynak && (
        <p className="kaynak">Kaynak: <a href={haber.kaynak.url} target="_blank" rel="noreferrer">{haber.kaynak.baslik}</a>, {haber.kaynak.yayin}</p>
      )}
      {haber.etiket === "simulasyon" && (neden ? <NedenPaneli oyun={oyun} olayId={haber.olayId} /> : (
        <button className="dugme dugme-ikincil" onClick={() => setNeden(true)}>Bu neden oldu?</button>
      ))}
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
          {haber.yanki && <span className="rozet rozet-yanki">Yankı</span>}
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
      <div className="gosterge-cubuk" role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={d} aria-label={baslik}><span style={{ width: `${d}%` }} /></div>
      {aciklama && <p className="soluk">{aciklama}</p>}
    </div>
  );
}

function Alanlar({ oyun, aciklama }: { oyun: Oyun; aciklama?: boolean }) {
  return (
    <div className="gosterge-izgara">
      {ALANLAR.map((a) => <Gosterge key={a.ad} baslik={a.baslik} deger={oyun.durum.gostergeler[a.ad] ?? 0} aciklama={aciklama ? a.aciklama : undefined} />)}
    </div>
  );
}

/** Bölüm sonu şeması: seçtiğin ve seçmediğin yollar. */
function KararSemasi({ oyun }: { oyun: Oyun }) {
  const s = akisSemasi(oyun.durum, oyun.senaryo);
  if (!s.oynanan.length) return <p className="soluk">Henüz bir karar vermedin.</p>;
  return (
    <div className="sema">
      <ol>
        {s.oynanan.map((n) => (
          <li key={n.kartId}>
            <p className="sema-baslik"><time>{kisaTarih(n.tarih)}</time> {n.kartAd}</p>
            <ul>
              {n.secenekler.map((x) => (
                <li key={x.id} className={x.secildi ? "sema-secildi" : "sema-gorulmedi"}>
                  <span aria-hidden="true">{x.secildi ? "●" : "○"}</span> {x.ad}
                  <span className="sema-not">{x.secildi ? " (seçtiğin)" : " (seçmediğin)"}</span>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
      <p className="soluk">Seçmediğin {s.gorulmeyenSecenek} yol ve hiç görmediğin {s.gorulmeyenKart} sahne var.</p>
    </div>
  );
}

function Acilis({ bitir }: { bitir: () => void }) {
  const [adim, setAdim] = useState(0);
  return (
    <div className="acilis" role="dialog" aria-modal="true" aria-label="Oyuna giriş">
      {adim === 0 ? (
        <div className="acilis-ic">
          <p className="acilis-tarih">10 Kasım 1938</p>
          <p className="acilis-metin">Mustafa Kemal Atatürk bu gün İstanbul'da hayatını kaybetti. Gerçek tarih bu.</p>
          <p className="acilis-metin">Bu oyunda o sabah farklı: sağlıklı uyanıyorsun. Sonrasını sen belirliyorsun.</p>
          <p className="soluk acilis-not">Resmî kronolojiye göre Atatürk o sırada ağır hastaydı. Bu oyun, bu gerçeğin dışına bilerek çıkıyor.</p>
          <button className="dugme dugme-ana" onClick={() => setAdim(1)}>Devam</button>
        </div>
      ) : (
        <div className="acilis-ic">
          <h2 className="acilis-baslik">Nasıl oynanır</h2>
          <ul className="acilis-liste">
            <li>Karar kartı çıkınca oyun durur. <strong>"Hiçbir şey yapma"</strong> her zaman bir seçenektir.</li>
            <li>Bazı anlarda süre vardır. Süre dolunca "hiçbir şey yapma" seçilir. Bunu Daha Fazla'dan kapatabilirsin.</li>
            <li>Her kararın bir <strong>kazancı</strong> ve bir <strong>bedeli</strong> vardır. Sonuç kartında kapıların açılıp kapandığını görürsün.</li>
            <li>Bazı sonuçlar aylar sonra, bir <strong>yankı</strong> olarak geri döner.</li>
            <li>Her şeyi sorabilirsin: <strong>"Bu neden oldu?"</strong></li>
            <li>Kurgu diyaloglar ve simülasyon içeriği her zaman etiketlidir.</li>
          </ul>
          <button className="dugme dugme-ana" onClick={bitir}>Başla</button>
        </div>
      )}
    </div>
  );
}

function SonucKarti({ oyun, sonuc, kapat }: { oyun: Oyun; sonuc: { kararId: string; kartId: string; secenekId: string }; kapat: () => void }) {
  const olay = oyun.senaryo.olaylar.find((o) => o.id === sonuc.kartId);
  const secenek = olay?.kart?.secenekler.find((s) => s.id === sonuc.secenekId);
  const satirlar = sonucSatirlari(oyun.durum, sonuc.kararId).slice(0, 4);
  const kapi = secenek?.kapi;
  return (
    <Katman baslik="Kararın sonucu" kapat={kapat}>
      <span className="rozet rozet-simulasyon">Simülasyon</span>
      <h2 className="belge-baslik">{secenek?.ad}</h2>
      {secenek?.tepki && <p className="belge-metin">{secenek.tepki}</p>}
      <ul className="sonuc">
        {kapi?.acildi?.map((k) => <li key={`a${k}`}><strong>Kapı açıldı:</strong> {k}</li>)}
        {kapi?.kapandi?.map((k) => <li key={`k${k}`}><strong>Kapı kapandı:</strong> {k}</li>)}
        {satirlar.map((s, i) =>
          s.tur === "iliski"
            ? <li key={i}><strong>Kişi:</strong> {iliskiCumlesi(s.kisi, s.alan, s.delta)}</li>
            : <li key={i}><strong>Alan:</strong> {alanCumlesi(s.ad, s.delta)}</li>,
        )}
      </ul>
      <p className="soluk">Bunun devamını önümüzdeki haftalarda haberlerde göreceksin.</p>
      <button className="dugme dugme-ana" onClick={kapat}>Devam</button>
    </Katman>
  );
}

function KararKarti({ oyun, sonucAc }: { oyun: Oyun; sonucAc: (s: { kararId: string; kartId: string; secenekId: string }) => void }) {
  const olay = oyun.senaryo.olaylar.find((o) => o.id === oyun.durum.bekleyenKart);
  const sure = olay?.kart?.sure;
  const zamanli = !!sure && oyun.sureAcik;
  const [kalan, setKalan] = useState(sure ?? 0);
  const kartId = olay?.id ?? "";

  const sec = (secenekId: string) => { oyun.kararVer(secenekId); sonucAc({ kararId: `${kartId}:${secenekId}`, kartId, secenekId }); };

  useEffect(() => {
    if (!zamanli) return;
    setKalan(sure!);
    const t = setInterval(() => setKalan((k) => k - 1), 1000);
    return () => clearInterval(t);
  }, [kartId, zamanli, sure]);

  useEffect(() => {
    if (zamanli && kalan <= 0) sec(BEKLE);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kalan]);

  if (!olay?.kart) return null;
  const gizli = zamanli && olay.kart.gizliBedel;
  return (
    <Katman baslik={olay.ad ?? "Karar"} genis>
      <p className="karar-kunye">{tarihYaz(oyun.durum.tarih)} <EtiketRozeti etiket="simulasyon" /></p>
      {zamanli && (
        <div className="sure" role="timer" aria-label={`Kalan süre: ${Math.max(kalan, 0)} saniye`}>
          <div className="sure-cubuk"><span style={{ width: `${Math.max(0, (kalan / sure!) * 100)}%` }} /></div>
          <span className="sure-sayi">{Math.max(kalan, 0)} sn</span>
        </div>
      )}
      <h2 className="belge-baslik">{olay.ad}</h2>
      <TerimliMetin sinif="belge-metin" metin={olay.aciklama ?? ""} />
      {olay.kart.danismanlar && olay.kart.danismanlar.length > 0 && (
        <section className="danismanlar" aria-label="Çevrendekilerin görüşü">
          <h3 className="danisman-baslik">Çevrendekiler ne diyor?</h3>
          <span className="rozet rozet-simulasyon">Simülasyon: kurgu diyalog</span>
          <ul>
            {olay.kart.danismanlar.map((dn) => (
              <li key={dn.kisi}>
                <strong>{KISILER[dn.kisi] ?? dn.kisi}</strong>
                <p>«{dn.gorus}»</p>
                <span className="soluk">Önerisi: {olay.kart!.secenekler.find((x) => x.id === dn.oneri)?.ad}</span>
              </li>
            ))}
          </ul>
          <p className="soluk">Birinin önerisini izlemek ya da izlememek, aranızdaki güveni etkiler.</p>
        </section>
      )}
      <ul className="secenekler">
        {olay.kart.secenekler.map((s) => (
          <li key={s.id}>
            <button className="secenek" onClick={() => sec(s.id)}>
              <strong>{s.ad}</strong>
              {s.aciklama && <span>{s.aciklama}</span>}
              {!gizli && s.kazanc && <span className="kb"><b>Kazanç:</b> {s.kazanc}</span>}
              {!gizli && s.bedel && <span className="kb"><b>Bedel:</b> {s.bedel}</span>}
            </button>
          </li>
        ))}
      </ul>
      {gizli && <p className="soluk">Kazanç ve bedel, karardan sonra açılır.</p>}
    </Katman>
  );
}

function DonemSonu({ oyun, liste }: { oyun: Oyun; liste: Haber[] }) {
  const d = oyun.durum;
  const ozet = alanOzeti(d, oyun.senaryo);
  const karsilastirma = liste.filter((h) => h.etiket === "karsilastirma").reverse();
  return (
    <Katman baslik="Bölüm sonu" genis>
      <p className="karar-kunye">{tarihYaz(d.tarih)} <EtiketRozeti etiket="simulasyon" /></p>
      <h2 className="belge-baslik">Bölümün sonu</h2>
      <p className="belge-metin">10 Kasım 1938 ile 30 Haziran 1939 arasında aldığın kararlar, ülkenin yönünü değiştirdi.</p>
      <ul className="sonuc">
        {ozet.artan && <li><strong>En çok gelişen:</strong> {ozet.artan}</li>}
        {ozet.azalan && <li><strong>En çok gerileyen:</strong> {ozet.azalan}</li>}
      </ul>
      <h3 className="bolum-baslik">Kararlarının şeması</h3>
      <KararSemasi oyun={oyun} />
      <h3 className="bolum-baslik">Atatürk'süz gerçek tarihte</h3>
      <ul className="sapma-listesi">
        {karsilastirma.map((h) => <li key={h.anahtar}><strong>{tarihYaz(h.tarih)}: {h.baslik}</strong><span>{h.metin}</span></li>)}
      </ul>
      <button className="dugme dugme-ana" onClick={oyun.yeniOyun}>Baştan oyna, farklı kararlar dene</button>
    </Katman>
  );
}

function HaritaSekmesi({ oyun, liste, ac }: { oyun: Oyun; liste: Haber[]; ac: (h: Haber) => void }) {
  return (
    <div className="ana-izgara">
      <section className="harita-kutu" aria-label="Harita">
        <Harita durum={oyun.durum} />
        <ZamanDenetimi oyun={oyun} />
      </section>
      <section className="yan" aria-label="Son gelişmeler">
        <h2 className="bolum-baslik">Son gelişmeler</h2>
        {liste.length === 0 ? (
          <p className="soluk">Henüz sana ulaşan bir haber yok. Zamanı ilerlet; dünya senden bağımsız olarak hareket ediyor.</p>
        ) : (
          <ul className="haber-listesi">{liste.slice(0, 4).map((h) => <HaberSatiri key={h.anahtar} haber={h} ac={() => ac(h)} />)}</ul>
        )}
        <h2 className="bolum-baslik">Alanların</h2>
        <Alanlar oyun={oyun} />
      </section>
    </div>
  );
}

function YazismalarSekmesi({ oyun }: { oyun: Oyun }) {
  const gorusmeler = oyun.senaryo.olaylar.filter((o) => o.kart?.danismanlar && o.id in oyun.durum.gerceklesen);
  return (
    <div className="tek-sutun">
      <h2 className="bolum-baslik">Görüşmeler</h2>
      <p className="soluk">Karar kartlarında çevrendekilerin söyledikleri burada birikir. Hepsi kurgudur.</p>
      {gorusmeler.length === 0 && <p className="soluk">Henüz bir görüşmen yok.</p>}
      <ul className="yazisma-listesi">
        {gorusmeler.map((o) => {
          const secim = oyun.durum.kararlar.find((k) => k.kaynakId === o.id);
          return (
            <li key={o.id} className="yazisma">
              <div className="yazisma-ust"><time>{tarihYaz(oyun.durum.gerceklesen[o.id]!.tarih)}</time><span className="rozet rozet-simulasyon">Simülasyon: kurgu diyalog</span></div>
              <strong>{o.ad}</strong>
              {o.kart!.danismanlar!.map((dn) => (
                <p key={dn.kisi}><b>{KISILER[dn.kisi]}:</b> «{dn.gorus}»{secim && secim.secenekId === dn.oneri ? " (önerisini izledin)" : ""}</p>
              ))}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function DurumSekmesi({ oyun }: { oyun: Oyun }) {
  return (
    <div className="tek-sutun">
      <h2 className="bolum-baslik">Alanların</h2>
      <p className="soluk">Bu değerler simülasyonun kendi ölçüleridir; gerçek bir tarihsel ölçüme dayanmaz.</p>
      <Alanlar oyun={oyun} aciklama />
      <h2 className="bolum-baslik">Kararların şeması</h2>
      <KararSemasi oyun={oyun} />
    </div>
  );
}

function FazlaSekmesi({ oyun }: { oyun: Oyun }) {
  const [onay, setOnay] = useState(false);
  const [gorus, setGorus] = useState("");
  const [gonderildi, setGonderildi] = useState("");
  async function gorusPaylas() {
    const metin = `Oyun için görüş (${tarihYaz(oyun.durum.tarih)}):\n${gorus}`;
    try {
      if (navigator.share) await navigator.share({ text: metin });
      else { await navigator.clipboard.writeText(metin); setGonderildi("Görüşün panoya kopyalandı; istediğin yere yapıştırıp gönderebilirsin."); }
    } catch { setGonderildi("Paylaşım açılamadı. Metni elle kopyalayabilirsin."); }
  }
  return (
    <div className="tek-sutun">
      <h2 className="bolum-baslik">Oyun</h2>
      <p>Oyun her adımda bu cihaza kendiliğinden kaydedilir.</p>
      <label className="onay-kutusu">
        <input type="checkbox" id="sure-ayari" checked={oyun.sureAcik} onChange={(e) => oyun.sureDegistir(e.target.checked)} />
        <span>Zamanlı anlar açık (süre dolunca "hiçbir şey yapma" seçilir)</span>
      </label>
      {onay ? (
        <div className="onay">
          <p>Yeni oyun başlatırsan şimdiki oyunun silinir. Bu geri alınamaz.</p>
          <button className="dugme dugme-ana" onClick={() => { oyun.yeniOyun(); setOnay(false); }}>Şimdiki oyunu sil ve yeniden başla</button>
          <button className="dugme dugme-ikincil" onClick={() => setOnay(false)}>Vazgeç</button>
        </div>
      ) : <button className="dugme dugme-ikincil" onClick={() => setOnay(true)}>Yeni oyun başlat</button>}

      <h2 className="bolum-baslik">Görüş gönder</h2>
      <label className="alan" htmlFor="gorus-metni">
        <span>Neyi beğendin, ne eksik, ne yanlış?</span>
        <textarea id="gorus-metni" rows={4} value={gorus} onChange={(e) => setGorus(e.target.value)} />
      </label>
      <button className="dugme dugme-ikincil" disabled={!gorus.trim()} onClick={gorusPaylas}>Görüşü paylaş</button>
      {gonderildi && <p className="soluk">{gonderildi}</p>}

      <h2 className="bolum-baslik">Bu oyun hakkında</h2>
      <p>Bu bir alternatif tarih simülasyonudur: Atatürk 10 Kasım 1938'de ölmeseydi ne olurdu sorusunu dener.</p>
      <ul className="hakkinda">
        <li><EtiketRozeti etiket="gercek" /> Kaynağa dayanan gerçek olaylar. Kaynak gösterilir.</li>
        <li><EtiketRozeti etiket="karsilastirma" /> Atatürk'süz gerçek tarihte olanlar. Günü gelince açılır.</li>
        <li><EtiketRozeti etiket="simulasyon" /> Oyunun ürettiği içerik: kararlar, göstergeler ve kurgu diyaloglar. Tarihsel belge değildir.</li>
      </ul>
      <p>Kişilere söyletilen sözler kurgudur; hiçbir kaynağa dayanmaz.</p>
      <p>Bu oyun yapay zekâyla (Claude) birlikte geliştirilmiştir. Erken bir deneme sürümüdür; yalnızca 10 Kasım 1938 ile 30 Haziran 1939 arasını kapsar.</p>
    </div>
  );
}

export function App() {
  const oyun = useOyun();
  const [sekme, setSekme] = useState<Sekme>("harita");
  const [acik, setAcik] = useState<Haber | null>(null);
  const [menu, setMenu] = useState(false);
  const [sonuc, setSonuc] = useState<{ kararId: string; kartId: string; secenekId: string } | null>(null);
  const liste = haberler(oyun.durum, oyun.senaryo, oyun.veri);
  const d = oyun.durum;

  useEffect(() => {
    if (sekme === "haberler") oyun.okunduIsaretle();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sekme, d.oyuncuBilgisi.length]);

  const git = (s: Sekme) => { setSekme(s); setMenu(false); window.scrollTo(0, 0); };

  if (!oyun.acilisGoruldu) return <Acilis bitir={oyun.acilisBitti} />;

  return (
    <div className="uygulama">
      <header className="ust">
        <button className="ust-dugme menu-dugme" onClick={() => setMenu(true)} aria-label="Menüyü aç"><Ikon><path d="M4 7h16M4 12h16M4 17h16" /></Ikon></button>
        <div className="ust-tarih">
          <span className="ust-gun">{tarihYaz(d.tarih)}</span>
          <span className="ust-yer">İstanbul</span>
        </div>
        <button className="ust-dugme" onClick={() => git("haberler")} aria-label={`Bildirimler: ${oyun.okunmamis} yeni haber`}>
          <Ikon><path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15L6 16Zm4 4a2 2 0 0 0 4 0" /></Ikon>
          {oyun.okunmamis > 0 && <span className="sayac">{oyun.okunmamis}</span>}
        </button>
      </header>

      <nav className="gezinti" aria-label="Ana gezinti">
        {SEKMELER.map((s) => (
          <button key={s.id} className={`sekme${sekme === s.id ? " sekme-secili" : ""}`} aria-current={sekme === s.id ? "page" : undefined} onClick={() => git(s.id)}>
            <Ikon>{s.ikon}</Ikon><span>{s.ad}</span>
          </button>
        ))}
      </nav>

      {menu && (
        <div className="cekmece-zemin" onClick={() => setMenu(false)}>
          <aside className="cekmece" onClick={(e) => e.stopPropagation()} aria-label="Yan menü">
            <p className="cekmece-baslik">10 Kasım 1938</p>
            {SEKMELER.map((s) => <button key={s.id} className="cekmece-satir" onClick={() => git(s.id)}>{s.ad}</button>)}
            <p className="soluk">Deneme sürümü. 10 Kasım 1938 – 30 Haziran 1939.</p>
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
        {sekme === "yazismalar" && <YazismalarSekmesi oyun={oyun} />}
        {sekme === "durum" && <DurumSekmesi oyun={oyun} />}
        {sekme === "fazla" && <FazlaSekmesi oyun={oyun} />}
      </main>

      {acik && <HaberDetayi oyun={oyun} haber={acik} kapat={() => setAcik(null)} />}
      {sonuc && <SonucKarti oyun={oyun} sonuc={sonuc} kapat={() => setSonuc(null)} />}
      {d.bekleyenKart && !sonuc && <KararKarti oyun={oyun} sonucAc={setSonuc} />}
      {d.bitti && !d.bekleyenKart && !sonuc && <DonemSonu oyun={oyun} liste={liste} />}
    </div>
  );
}
