const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');

const app = express();
app.use(express.static('public'));
app.use(cors());

// Função genérica para extrair resultados da Steam com Puppeteer
async function extrairResultados(url, incluirNotas = false) {
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
  
    // Simular cabeçalhos de navegador real
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36');
  
    await page.goto(url, { waitUntil: 'networkidle2' }); // mais confiável para conteúdo dinâmico
  
    const resultados = await page.evaluate((incluirNotas) => {
      const elementos = document.querySelectorAll('.search_result_row');
      const dados = [];
  
      elementos.forEach(el => {
        const titulo = el.querySelector('.title')?.innerText.trim();
        const preco = el.querySelector('.discount_final_price')?.innerText.trim() ||
                      el.querySelector('.search_price')?.innerText.trim();
        const link = el.href;
        const appIdMatch = link.match(/app\/(\d+)/);
        const appId = appIdMatch ? appIdMatch[1] : null;
        const imagem = appId ? `https://cdn.cloudflare.steamstatic.com/steam/apps/${appId}/capsule_616x353.jpg` : null;
  
        const notaSteam = incluirNotas
          ? el.querySelector('.search_review_summary')?.getAttribute('data-tooltip-html') || null
          : null;
        const notaMetacritic = incluirNotas
          ? el.querySelector('.search_metascore span')?.innerText.trim() || null
          : null;
  
        if (titulo && preco && imagem) {
          dados.push({ titulo, preco, link, imagem, notaSteam, notaMetacritic });
        }
      });
  
      return dados;
    }, incluirNotas);
  
    await browser.close();
    return resultados;
  }
  

// Rota para ofertas
app.get('/api/ofertas', async (req, res) => {
  try {
    const url = 'https://store.steampowered.com/search/?specials=1&l=portuguese';
    const ofertas = await extrairResultados(url, true);
    res.json(ofertas);
  } catch (error) {
    console.error('Erro ao buscar ofertas:', error.message);
    res.status(500).json({ erro: 'Erro ao buscar ofertas' });
  }
});

// Rota para busca por jogos
app.get('/api/jogos', async (req, res) => {
    const termo = req.query.q || req.query.busca; // aceita q ou busca
  
    if (!termo) {
      return res.status(400).json({ erro: 'Parâmetro de busca "q" ou "busca" é obrigatório' });
    }
  
    try {
      const url = `https://store.steampowered.com/search/?term=${encodeURIComponent(termo)}&category1=998`;
      const jogos = await extrairResultados(url);
      res.json(jogos);
    } catch (error) {
      console.error('Erro ao buscar jogos:', error.message);
      res.status(500).json({ erro: 'Erro ao buscar jogos' });
    }
  });

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

