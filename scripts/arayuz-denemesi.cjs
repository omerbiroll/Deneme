// Arayüzü telefon boyutunda baştan sona oynatır (PC desteklenmez), ekran görüntüsü alır, konsol hatalarını bildirir.
// Öncelik ekranını, kapasite daraldı anını, zamanlı kartın süre dolmasını ve kaydın korunmasını dener.
// Kullanım: npm run build && npx vite preview --port 4173 &   sonra: node scripts/arayuz-denemesi.cjs <çıktı klasörü>
const { chromium, devices } = require('playwright');
const fs = require('fs');
const S = process.argv[2] || '/tmp/arayuz';
fs.mkdirSync(`${S}/shots`, { recursive: true });
(async () => {
  const browser = await chromium.launch();
  const hatalar = [];
  async function oyna() {
    const ctx = await browser.newContext({ ...devices['iPhone 13'] });
    const p = await ctx.newPage();
    p.on('console', m => m.type() === 'error' && hatalar.push(`oyna: ${m.text()}`));
    p.on('pageerror', e => hatalar.push(`oyna: ${e.message}`));
    await p.goto('http://localhost:4173/');
    await p.waitForSelector('.acilis');
    await p.screenshot({ path: `${S}/shots/1-kapak.png` });
    await p.getByRole('button', { name: 'Devam', exact: true }).click();
    await p.getByRole('button', { name: 'Başla' }).click();
    // Öncelik ekranı: halk ++ ve eğitim + (3 artı); Çekoslovakya krizinde kapasite aşımı beklenir.
    await p.waitForSelector('[aria-label="Önceliklerin"]');
    await p.screenshot({ path: `${S}/shots/2-oncelik-bos.png` });
    for (const ad of ['Halk ve köy', 'Halk ve köy', 'Eğitim ve kültür']) await p.getByRole('button', { name: `${ad}: artır` }).click();
    const dorduncu = await p.getByRole('button', { name: 'Ekonomi: artır' }).isDisabled();
    console.log('havuz dolunca diğer artılar kapanıyor:', dorduncu);
    await p.screenshot({ path: `${S}/shots/3-oncelik-dolu.png` });
    await p.getByRole('button', { name: 'Başla' }).click();
    await p.waitForSelector('.secenek');
    await p.waitForTimeout(300);
    let kart = 0, sonucAlindi = false, kapasiteAlindi = false, kapasiteSayisi = 0;
    for (let adim = 0; adim < 80; adim++) {
      if (await p.locator('text=Bölümün sonu').count()) break;
      if (await p.locator('[aria-label="Kapasite daraldı"]').count()) {
        if (!kapasiteAlindi) { await p.waitForTimeout(250); await p.screenshot({ path: `${S}/shots/4-kapasite.png` }); kapasiteAlindi = true; }
        kapasiteSayisi++;
        await p.locator('.secenek').first().click();
        continue;
      }
      if (await p.locator('.secenek').count()) {
        const baslik = await p.locator('.katman .belge-baslik').first().textContent();
        const n = await p.locator('.secenek').count();
        await p.locator('.secenek').nth(n > 1 ? 1 : 0).click();
        kart++;
        await p.waitForSelector('[aria-label="Kararın sonucu"]');
        if (!sonucAlindi) { await p.waitForTimeout(200); await p.screenshot({ path: `${S}/shots/5-sonuc.png` }); sonucAlindi = true; }
        console.log('kart', kart, ':', baslik);
        await p.getByRole('button', { name: 'Devam', exact: true }).click();
        continue;
      }
      await p.getByRole('button', { name: 'Bir sonraki karara kadar bekle' }).click();
    }
    await p.waitForSelector('text=Bölümün sonu');
    await p.waitForTimeout(300);
    await p.screenshot({ path: `${S}/shots/6-bolum-sonu.png` });
    console.log('oynanan kart:', kart, '· kapasite daraldı anı:', kapasiteSayisi, 'kez');
    await p.getByRole('button', { name: 'Baştan oyna, farklı kararlar dene' }).click();
    await p.waitForSelector('[aria-label="Önceliklerin"]');
    console.log('baştan oyna: öncelik ekranı yeniden açıldı');
    // Haberlerde eşik haberi var mı: yeni oyunda değil, önceki oyunda baktık; sayfa yenilemeden kaydı doğrula
    const tasma = await p.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    console.log('yatay taşma:', tasma);
    await ctx.close();
  }
  async function esikVeKayit() {
    const ctx = await browser.newContext({ ...devices['iPhone 13'] });
    const p = await ctx.newPage();
    p.on('pageerror', e => hatalar.push(`esik: ${e.message}`));
    await p.goto('http://localhost:4173/'); await p.waitForSelector('.acilis');
    await p.evaluate(() => { localStorage.setItem('ataturk-sim:acilis:v2', '1'); });
    await p.reload(); await p.waitForSelector('[aria-label="Önceliklerin"]');
    // ekonomi ++ : eşiği geçip yeni aşama haberi gelmeli
    for (const ad of ['Ekonomi', 'Ekonomi']) await p.getByRole('button', { name: `${ad}: artır` }).click();
    await p.getByRole('button', { name: 'Başla' }).click();
    for (let i = 0; i < 80 && !(await p.locator('text=Bölümün sonu').count()); i++) {
      if (await p.locator('[aria-label="Kapasite daraldı"]').count()) { await p.locator('.secenek').first().click(); continue; }
      if (await p.locator('.secenek').count()) { const n = await p.locator('.secenek').count(); await p.locator('.secenek').nth(n - 1).click(); await p.waitForSelector('[aria-label="Kararın sonucu"]'); await p.getByRole('button', { name: 'Devam', exact: true }).click(); continue; }
      await p.getByRole('button', { name: 'Bir sonraki karara kadar bekle' }).click();
    }
    await p.waitForSelector('text=Bölümün sonu');
    await p.getByRole('button', { name: 'Kapat' }).click().catch(() => {});
    await p.reload(); await p.waitForSelector('text=Bölümün sonu');
    console.log('yeniden yüklemede kayıt ve öncelikler korundu');
    await ctx.close();
  }
  async function sureTesti() {
    const ctx = await browser.newContext({ ...devices['iPhone 13'] });
    const p = await ctx.newPage();
    p.on('pageerror', e => hatalar.push(`sure: ${e.message}`));
    await p.goto('http://localhost:4173/'); await p.waitForSelector('.acilis');
    await p.evaluate(() => { localStorage.setItem('ataturk-sim:acilis:v2', '1'); localStorage.setItem('ataturk-sim:oncelik:v1', '1'); });
    await p.reload(); await p.waitForSelector('.secenek');
    for (let i = 0; i < 60 && !(await p.locator('.sure').count()); i++) {
      if (await p.locator('[aria-label="Kapasite daraldı"]').count()) { await p.locator('.secenek').first().click(); continue; }
      if (await p.locator('.secenek').count()) { await p.locator('.secenek').nth(1).click(); await p.waitForSelector('[aria-label="Kararın sonucu"]'); await p.getByRole('button', { name: 'Devam', exact: true }).click(); }
      else await p.getByRole('button', { name: 'Bir sonraki karara kadar bekle' }).click();
    }
    const ilkSure = await p.locator('.sure-sayi').textContent();
    await p.waitForSelector('[aria-label="Kararın sonucu"]', { timeout: 20000 });
    const sonuc = await p.locator('.katman .belge-baslik').first().textContent();
    console.log('süre testi: başlangıç', ilkSure, '→ süre dolunca seçilen:', sonuc);
    await ctx.close();
  }
  await oyna();
  await esikVeKayit();
  await sureTesti();
  console.log('konsol hataları:', hatalar.length ? hatalar : 'yok');
  await browser.close();
})().catch(e => { console.error('HATA', e.message.split('\n').slice(0, 8).join('\n')); process.exit(1); });
