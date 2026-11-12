/**
 * Öncelik sistemi testleri: seviyeler, havuz, aylık etki, eşikler, kriz ve kapasite aşımı.
 * Senaryo yalnızca test içindir; tarihsel içerik taşımaz.
 */
import { describe, it, expect } from "vitest";
import type { Senaryo, Durum } from "../../src/engine/tipler";
import { baslat, ilerle, oncelikAyarla, havuz, seviyeToplam, kapasiteAsimi, senaryoyuDogrula } from "../../src/engine/motor";
import { sonrakiAyBasi, ayEkle } from "../../src/engine/yardimci";

const temel = (): Senaryo => ({
  id: "o",
  baslangic: "1900-01-01",
  bitis: "1900-08-01",
  gostergeSiniri: [0, 100],
  gostergeler: { a: 50, b: 50, c: 50 },
  iliskiler: {},
  olaylar: [{ id: "kriz", tarih: "1900-04-10", etkiler: [{ tur: "havuz", delta: -1, ay: 2 }], onem: "buyuk", haberGecikmesiGun: 0 }],
  eylemler: [],
  oncelik: {
    alanlar: ["a", "b", "c"],
    baslangicHavuz: 3,
    havuzAralik: [2, 6],
    seviyeAralik: [-2, 2],
    aylikCarpan: 2,
    esikler: [{ yukari: 55, asagi: 50 }, { yukari: 70, asagi: 65 }],
  },
});
const s = temel();
const ayarla = (d: Durum, alan: string, v: number) => oncelikAyarla(d, s, alan, v);
const esikHaberleri = (d: Durum) => Object.keys(d.gerceklesen).filter((id) => id.startsWith("esik:"));

describe("tarih yardımcıları", () => {
  it("sonraki ay başını ve ay eklemeyi doğru hesaplar", () => {
    expect(sonrakiAyBasi("1938-11-10")).toBe("1938-12-01");
    expect(sonrakiAyBasi("1938-12-31")).toBe("1939-01-01");
    expect(sonrakiAyBasi("1939-01-01")).toBe("1939-02-01");
    expect(ayEkle("1939-03-15", 3)).toBe("1939-06-15");
    expect(ayEkle("1939-01-31", 1)).toBe("1939-02-28");
    expect(ayEkle("1938-11-30", 3)).toBe("1939-02-28");
  });
});

describe("seviye ve havuz", () => {
  it("başlangıçta havuz 3, hiçbir artı kullanılmamış", () => {
    const d = baslat(s, 1);
    expect(havuz(d, s)).toBe(3);
    expect(seviyeToplam(d)).toBe(0);
  });

  it("havuzu aşan artıyı reddeder, azaltmak her zaman serbesttir", () => {
    let d = ayarla(ayarla(baslat(s, 1), "a", 2), "b", 1);
    expect(() => ayarla(d, "c", 1)).toThrow(/artı hakkın yetmiyor/);
    d = ayarla(d, "a", 0);
    expect(seviyeToplam(d)).toBe(1);
  });

  it("bir alana eksi vermek başka alana artı için yer açar", () => {
    let d = ayarla(ayarla(baslat(s, 1), "a", 2), "b", 1);
    d = ayarla(d, "b", -1);
    d = ayarla(d, "c", 2);
    expect(seviyeToplam(d)).toBe(3);
  });

  it("geçersiz alanı ve aralık dışı seviyeyi reddeder", () => {
    const d = baslat(s, 1);
    expect(() => ayarla(d, "x", 1)).toThrow();
    expect(() => ayarla(d, "a", 3)).toThrow();
    expect(() => ayarla(d, "a", 0.5)).toThrow();
  });

  it("girdi durumunu değiştirmez", () => {
    const d = baslat(s, 1);
    const kopya = structuredClone(d);
    ayarla(d, "a", 2);
    ilerle(ayarla(d, "a", 2), s, "1900-03-15");
    expect(d).toEqual(kopya);
  });
});

describe("aylık etki ve eşikler", () => {
  it("her ay başında seviye × çarpan kadar alan değişir", () => {
    const d = ilerle(ayarla(baslat(s, 1), "a", 2), s, "1900-02-02");
    expect(d.gostergeler.a).toBe(54);
    expect(d.gostergeler.b).toBe(50);
  });

  it("eksi seviye alanı geriletir", () => {
    const d = ilerle(ayarla(baslat(s, 1), "b", -2), s, "1900-02-02");
    expect(d.gostergeler.b).toBe(46);
  });

  it("yukarı eşiği geçince havuz +1 olur ve haber gelir", () => {
    let d = ilerle(ayarla(baslat(s, 1), "a", 2), s, "1900-03-02");
    expect(d.gostergeler.a).toBe(58);
    expect(havuz(d, s)).toBe(4);
    expect(d.oncelik.esikSayisi.a).toBe(1);
    expect(esikHaberleri(d)).toEqual(["esik:a:1:yukari:1900-03-01"]);
    expect(d.oyuncuBilgisi.some((h) => h.olayId === "esik:a:1:yukari:1900-03-01")).toBe(true);
    d = ilerle(d, s, "1900-06-02");
    expect(d.gostergeler.a).toBe(70);
    expect(d.oncelik.esikSayisi.a).toBe(2);
    expect(havuz(d, s)).toBe(4); // 3 + 2 eşik - 1 (kriz hâlâ sürüyor)
    d = ilerle(d, s, "1900-06-12");
    expect(havuz(d, s)).toBe(5); // kriz bitti
  });

  it("eşik titremez: aşağı eşik yukarı eşikten düşüktür", () => {
    let d = ilerle(ayarla(baslat(s, 1), "a", 2), s, "1900-03-02");
    expect(havuz(d, s)).toBe(4);
    d = ayarla(d, "a", -2);
    d = ilerle(d, s, "1900-04-02"); // 54: yukarı eşiğin altında ama aşağı eşiğin (50) üstünde
    expect(d.gostergeler.a).toBe(54);
    expect(havuz(d, s)).toBe(4); // eşik hâlâ elde: 3 + 1
    expect(d.oncelik.esikSayisi.a).toBe(1);
    d = ilerle(d, s, "1900-05-02"); // 50: aşağı eşik "50'nin altına inince"; 50 henüz kaybettirmez
    expect(d.gostergeler.a).toBe(50);
    expect(d.oncelik.esikSayisi.a).toBe(1);
    d = ilerle(d, s, "1900-06-02"); // 46: eşik kaybedilir
    expect(d.gostergeler.a).toBe(46);
    expect(d.oncelik.esikSayisi.a).toBe(0);
    expect(esikHaberleri(d).some((id) => id.includes(":asagi:"))).toBe(true);
  });

  it("değerler sınırın dışına çıkmaz", () => {
    const yuksek = { ...temel(), gostergeler: { a: 98, b: 2, c: 50 } };
    let d = baslat(yuksek, 1);
    d = oncelikAyarla(oncelikAyarla(d, yuksek, "a", 2), yuksek, "b", -2);
    d = ilerle(d, yuksek);
    expect(d.gostergeler.a).toBe(100);
    expect(d.gostergeler.b).toBe(0);
  });
});

describe("kriz ve kapasite aşımı", () => {
  it("kriz havuzu geçici daraltır, süre bitince geri açar", () => {
    let d = ilerle(baslat(s, 1), s, "1900-04-11");
    expect(havuz(d, s)).toBe(2);
    d = ilerle(d, s, "1900-06-11");
    expect(havuz(d, s)).toBe(3);
  });

  it("havuz daralınca ve artılar fazla kalınca zaman durur; vazgeçmeden ilerlemez", () => {
    let d = ilerle(ayarla(baslat(s, 1), "a", 2), s, "1900-03-02");
    d = ayarla(d, "c", 1); // havuz 4, kullanılan 3 → 1 boşluk; 3 + 1 = 4 kullanıldı
    d = ayarla(d, "b", 1);
    expect(seviyeToplam(d)).toBe(4);
    d = ilerle(d, s);
    expect(d.tarih).toBe("1900-04-10");
    expect(kapasiteAsimi(d, s)).toBe(true);
    expect(() => ilerle(d, s)).toThrow(/kapasite/);
    d = ayarla(d, "b", 0);
    expect(kapasiteAsimi(d, s)).toBe(false);
    d = ilerle(d, s);
    expect(d.bitti).toBe(true);
  });

  it("kapasite aşılmışken artış yapılamaz, azaltmak serbesttir", () => {
    let d = ilerle(ayarla(baslat(s, 1), "a", 2), s, "1900-03-02");
    d = ayarla(ayarla(d, "c", 1), "b", 1);
    d = ilerle(d, s);
    expect(() => ayarla(d, "c", 2)).toThrow();
    expect(() => ayarla(d, "c", 0)).not.toThrow();
  });
});

describe("belirlenimcilik ve doğrulama", () => {
  it("aynı seviyeler ve tohum aynı sonucu verir", () => {
    const yol = (t: number) => ilerle(ayarla(ayarla(baslat(s, t), "a", 2), "b", -1), s, "1900-07-15");
    expect(yol(5)).toEqual(yol(5));
  });

  it("öncelik yapılandırması hatalıysa senaryoyu reddeder", () => {
    const bozuk = { ...temel(), oncelik: { ...temel().oncelik!, esikler: [{ yukari: 55, asagi: 60 }] } };
    expect(() => senaryoyuDogrula(bozuk)).toThrow(/titreme/);
    const olmayan = { ...temel(), oncelik: { ...temel().oncelik!, alanlar: ["z"] } };
    expect(() => senaryoyuDogrula(olmayan)).toThrow(/göstergeler/);
  });
});
