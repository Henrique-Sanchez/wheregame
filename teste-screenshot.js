const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();

  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36');
  await page.goto('https://store.steampowered.com/search/?specials=1&l=portuguese', {
    waitUntil: 'networkidle2'
  });

  const ofertas = await page.evaluate(() => {
    const items = [];
    const elements = document.querySelectorAll('.search_result_row');

    elements.forEach(el => {
      const nome = el.querySelector('.title')?.innerText.trim();
      const desconto = el.querySelector('.search_discount span')?.innerText.trim();
      const precoOriginal = el.querySelector('.search_price strike')?.innerText.trim();
      const precoDesconto = el.querySelector('.search_price')?.innerText.replace(precoOriginal ?? '', '').trim();
      const link = el.getAttribute('href');

      items.push({
        nome,
        desconto,
        precoOriginal,
        precoDesconto,
        link
      });
    });

    return items;
  });

  console.log(ofertas);

  await browser.close();
})();
