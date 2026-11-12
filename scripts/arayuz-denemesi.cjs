// Arayüzü telefon ve PC boyutunda baştan sona oynatır, ekran görüntüsü alır, konsol hatalarını bildirir.
// Kullanım: npm run build && npx vite preview --port 4173 &   sonra: node scripts/arayuz-denemesi.cjs <çıktı klasörü>
const { chromium, devices } = require('playwright');
const fs = require('fs');
const S = process.argv[2] || '/tmp/arayuz';
fs.mkdirSync(`${S}/shots`, { recursive: true });
(async () => {
  const browser = await chromium.launch();
  const hatalar = [];
  async function tur(ad, ctxOpts, zamanAsimi) {
    const ctx = await browser.newContext(ctxOpts);
    const p = await ctx.newPage();
    p.on('console', m => m.type() === 'error' && hatalar.push(`${ad}: ${m.text()}`));
    p.on('pageerror', e => hatalar.push(`${ad}: ${e.message}`));
    await p.goto('http://localhost:4173/');
    await p.waitForSelector('.acilis');
    await p.screenshot({ path: `${S}/shots/${ad}-1-kapak.png` });
    await p.getByRole('button', { name: 'Devam', exact: true }).click();
    await p.screenshot({ path: `${S}/shots/${ad}-2-nasil.png` });
    await p.getByRole('button', { name: 'Başla' }).click();
    await p.waitForSelector('.secenek');
    await p.waitForTimeout(300);
    await p.screenshot({ path: `${S}/shots/${ad}-3-ilk-kart.png` });
    let kart = 0, sonucAlindi = false, zamanliAlindi = false, danismanAlindi = false;
    for (let adim = 0; adim < 60; adim++) {
      if (await p.locator('text=Bölümün sonu').count()) break;
      if (await p.locator('.secenek').count()) {
        const baslik = await p.locator('.katman .belge-baslik').first().textContent();
        if (await p.locator('.sure').count() && !zamanliAlindi) { await p.screenshot({ path: `${S}/shots/${ad}-4-zamanli.png` }); zamanliAlindi = true; }
        if (await p.locator('.danismanlar').count() && !danismanAlindi) { await p.waitForTimeout(200); await p.screenshot({ path: `${S}/shots/${ad}-5-danisman.png` }); danismanAlindi = true; }
        const secenekler = p.locator('.secenek');
        const n = await secenekler.count();
        await secenekler.nth(n > 1 ? 1 : 0).click(); // ilk seçenek "hiçbir şey yapma"; ikincisini seç
        kart++;
        await p.waitForSelector('[aria-label="Kararın sonucu"]');
        if (!sonucAlindi) { await p.waitForTimeout(200); await p.screenshot({ path: `${S}/shots/${ad}-6-sonuc.png` }); sonucAlindi = true; }
        console.log(ad, 'kart', kart, ':', baslik);
        await p.getByRole('button', { name: 'Devam', exact: true }).click();
        continue;
      }
      await p.getByRole('button', { name: 'Bir sonraki karara kadar bekle' }).click();
    }
    await p.waitForSelector('text=Bölümün sonu');
    await p.waitForTimeout(300);
    await p.screenshot({ path: `${S}/shots/${ad}-7-bolum-sonu.png` });
    const tasma = await p.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    console.log(ad, 'oynanan kart:', kart, '· yatay taşma:', tasma);
    // Yeniden yükleme: otomatik kayıt korunuyor mu
    await p.reload(); await p.waitForSelector('text=Bölümün sonu');
    console.log(ad, 'yeniden yüklemede kayıt korundu');
    await ctx.close();
  }
  async function sureTesti() {
    const ctx = await browser.newContext({ ...devices['iPhone 13'] });
    const p = await ctx.newPage();
    p.on('pageerror', e => hatalar.push(`sure: ${e.message}`));
    await p.goto('http://localhost:4173/'); await p.waitForSelector('.acilis');
    await p.evaluate(() => { localStorage.setItem('ataturk-sim:acilis:v2', '1'); });
    await p.reload(); await p.waitForSelector('.secenek');
    // Telgraf kartına kadar hızlı ilerle: ilk üç kartı seç
    for (let i = 0; i < 40 && !(await p.locator('.sure').count()); i++) {
      if (await p.locator('.secenek').count()) { await p.locator('.secenek').nth(1).click(); await p.waitForSelector('[aria-label="Kararın sonucu"]'); await p.getByRole('button', { name: 'Devam', exact: true }).click(); }
      else await p.getByRole('button', { name: 'Bir sonraki karara kadar bekle' }).click();
    }
    const ilkSure = await p.locator('.sure-sayi').textContent();
    await p.waitForSelector('[aria-label="Kararın sonucu"]', { timeout: 20000 });
    const sonuc = await p.locator('.katman .belge-baslik').first().textContent();
    console.log('süre testi: başlangıç', ilkSure, '→ süre dolunca seçilen:', sonuc);
    await ctx.close();
  }
  await tur('mobil', { ...devices['iPhone 13'] });
  await tur('pc', { viewport: { width: 1366, height: 820 }, deviceScaleFactor: 1 });
  await sureTesti();
  console.log('konsol hataları:', hatalar.length ? hatalar : 'yok');
  await browser.close();
})().catch(e => { console.error('HATA', e.message.split('\n').slice(0, 8).join('\n')); process.exit(1); });
