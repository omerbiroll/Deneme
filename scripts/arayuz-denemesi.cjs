// Arayüzü telefon ve PC boyutunda baştan sona oynatır, ekran görüntüsü alır ve konsol hatalarını bildirir.
// Kullanım: npm run build && npx vite preview --port 4173 &  sonra: node scripts/arayuz-denemesi.cjs <çıktı klasörü>
const { chromium, devices } = require('playwright');
const S = process.argv[2];
(async () => {
  const browser = await chromium.launch();
  const hatalar = [];
  async function tur(ad, ctxOpts) {
    const ctx = await browser.newContext(ctxOpts);
    const p = await ctx.newPage();
    p.on('console', m => m.type() === 'error' && hatalar.push(`${ad}: ${m.text()}`));
    p.on('pageerror', e => hatalar.push(`${ad}: ${e.message}`));
    await p.goto('http://localhost:4173/');
    await p.waitForSelector('.harita');
    await p.screenshot({ path: `${S}/shots/${ad}-1-acilis.png` });
    await p.getByRole('button', { name: 'Bir hafta ilerle' }).click();
    await p.waitForSelector('.secenek'); await p.waitForTimeout(400);
    await p.waitForTimeout(400); await p.screenshot({ path: `${S}/shots/${ad}-2-karar.png` });
    await p.getByRole('button', { name: /itirazını yaz/ }).click(); await p.screenshot({ path: `${S}/shots/${ad}-2b-tepki.png` });
    await p.getByRole('button', { name: 'Bir sonraki karara kadar bekle' }).click(); await p.waitForSelector('.danismanlar'); await p.waitForTimeout(400); await p.screenshot({ path: `${S}/shots/${ad}-2c-istanbul.png` });
    await p.getByRole('button', { name: /Padişaha ulaşmaya çalış/ }).click();
    for (let i = 0; i < 3; i++) await p.getByRole('button', { name: 'Bir hafta ilerle' }).click();
    await p.getByRole('button', { name: 'Yazışmalar' }).last().click();
    await p.getByRole('button', { name: "Rauf Bey'le görüş" }).click();
    await p.getByRole('button', { name: "Fethi Bey'le görüş" }).click(); await p.waitForTimeout(200);
    await p.screenshot({ path: `${S}/shots/${ad}-3-yazismalar.png` });
    await p.getByRole('button', { name: 'Harita' }).last().click();
    await p.getByRole('button', { name: 'Bir sonraki karara kadar bekle' }).click();
    await p.getByRole('button', { name: /Anadolu için hazırlan/ }).click(); await p.screenshot({ path: `${S}/shots/${ad}-4b-harita.png` });
    await p.getByRole('button', { name: 'Bir sonraki karara kadar bekle' }).click();
    const kart = await p.locator('.belge-baslik').first().textContent(); await p.waitForTimeout(400);
    await p.screenshot({ path: `${S}/shots/${ad}-4-harita-mart.png` });
    console.log(ad, 'kart:', kart);
    if (/Müfettişlik/.test(kart)) {
      await p.getByRole('button', { name: /Geniş yetki/ }).click();
      await p.getByRole('button', { name: 'Bir sonraki karara kadar bekle' }).click();
      await p.getByRole('button', { name: /Hemen yola çık/ }).click();
    }
    await p.getByRole('button', { name: 'Haberler' }).last().click();
    await p.screenshot({ path: `${S}/shots/${ad}-5-haberler.png` });
    await p.locator('.haber').first().click();
    await p.getByRole('button', { name: 'Bu neden oldu?' }).click(); await p.waitForTimeout(400);
    await p.screenshot({ path: `${S}/shots/${ad}-6-neden.png` });
    await p.getByRole('button', { name: 'Kapat' }).click();
    await p.getByRole('button', { name: 'Durum' }).last().click();
    await p.screenshot({ path: `${S}/shots/${ad}-7-durum.png`, fullPage: true });
    await p.getByRole('button', { name: 'Harita' }).last().click();
    await p.getByRole('button', { name: 'Bir sonraki karara kadar bekle' }).click();
    await p.waitForSelector('text=Gerçek tarihten sapmalar'); await p.waitForTimeout(500);
    await p.screenshot({ path: `${S}/shots/${ad}-8-son.png` });
    console.log(ad, 'kapanış:', await p.locator('.katman .belge-baslik').textContent());
    const tasma = await p.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    console.log(ad, 'yatay taşma:', tasma);
    // Yeniden yükleme: otomatik kayıt korunuyor mu
    await p.reload(); await p.waitForSelector('text=Gerçek tarihten sapmalar');
    console.log(ad, 'yeniden yüklemede kayıt korundu');
    await ctx.close();
  }
  await tur('mobil', { ...devices['iPhone 13'] });
  await tur('pc', { viewport: { width: 1366, height: 820 }, deviceScaleFactor: 1 });
  console.log('konsol hataları:', hatalar.length ? hatalar : 'yok');
  await browser.close();
})().catch(e => { console.error('HATA', e.message.split('\n').slice(0,6).join('\n')); process.exit(1); });
