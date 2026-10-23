// Tira um quadro parado do Cosmos em cada resolução, para o papel de parede comum do Windows e a tela de
// bloqueio (o Lively tenta fazer isso sozinho e estoura o tempo). Usa o Playwright do Hermes com o Chrome
// instalado, porque o --screenshot do Chrome sozinho mede a tela com a barra do navegador e corta embaixo.
// Uso: node ferramentas/quadro-estatico.mjs   →  quadros/notebook.png e quadros/monitor.png
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(path.join(process.env.USERPROFILE, "Projetos", "hermes", "package.json"));
const { chromium } = require("playwright");

const telas = [
  { nome: "notebook", largura: 1728, altura: 1080, escala: 2 }, // 3456×2160
  { nome: "monitor", largura: 2560, altura: 1080, escala: 1 },
];
fs.mkdirSync(path.join(RAIZ, "quadros"), { recursive: true });
const nav = await chromium.launch({ channel: "chrome", headless: true });
try {
  for (const t of telas) {
    const pg = await nav.newPage({ viewport: { width: t.largura, height: t.altura }, deviceScaleFactor: t.escala });
    await pg.goto(pathToFileURL(path.join(RAIZ, "index.html")).href);
    await pg.waitForTimeout(4000); // fontes, capas e estrelas já em movimento
    const destino = path.join(RAIZ, "quadros", `${t.nome}.png`);
    await pg.screenshot({ path: destino });
    console.log(destino);
    await pg.close();
  }
} finally {
  await nav.close();
}
