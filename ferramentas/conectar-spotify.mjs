// Conecta o Cosmos ao Spotify numa janela só: abre o painel de desenvolvedor, preenche o app "Cosmos"
// (nome, descrição, Redirect URI, Web API), pega o Client ID do endereço da página do app e faz o login
// PKCE na mesma janela. Duas coisas ficam com o Pedro: entrar na conta (a senha não passa por aqui) e
// marcar o aceite dos termos do Spotify antes do Save. Uma faixa no topo da página diz o que é com ele.
// Uso: node ferramentas/conectar-spotify.mjs
import path from "node:path";
import { createRequire } from "node:module";
import { entrar, atualizar } from "./spotify.mjs";

const require = createRequire(path.join(process.env.USERPROFILE, "Projetos", "hermes", "package.json"));
const { chromium } = require("playwright");
const PERFIL = path.join(process.env.LOCALAPPDATA, "cosmos", "perfil-spotify");
const VOLTA = "http://127.0.0.1:8888/callback";
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);

const ctx = await chromium.launchPersistentContext(PERFIL, { channel: "chrome", headless: false, viewport: null, args: ["--start-maximized"] });
const page = ctx.pages()[0] || (await ctx.newPage());

async function aviso(texto) {
  await page.evaluate((t) => {
    let el = document.getElementById("cosmos-aviso");
    if (!el) {
      el = document.createElement("div");
      el.id = "cosmos-aviso";
      Object.assign(el.style, { position: "fixed", top: "0", left: "0", right: "0", zIndex: 2147483647, padding: "14px 20px",
        background: "#0D0D0D", color: "#FFB700", font: "600 16px system-ui", textAlign: "center", borderBottom: "2px solid #FFB700" });
      document.body.appendChild(el);
    }
    el.textContent = t;
  }, texto).catch(() => {});
}

// espera uma condição olhando a página a cada segundo, repondo a faixa (cada navegação apaga)
async function esperar(condicao, texto, minutos = 15) {
  const fim = Date.now() + minutos * 60000;
  while (Date.now() < fim) {
    if (await condicao().catch(() => false)) return true;
    await aviso(texto);
    await page.waitForTimeout(1000);
  }
  throw new Error(`tempo esgotado: ${texto}`);
}

async function tentar(nome, fn) {
  try { await fn(); log(`ok: ${nome}`); return true; } catch (e) { log(`não consegui ${nome}: ${e.message.split("\n")[0]}`); return false; }
}

try {
  await page.goto("https://developer.spotify.com/dashboard/create");
  log("janela aberta; esperando o login");
  const campoNome = () => page.getByLabel(/app name/i).first();
  await esperar(async () => /developer\.spotify\.com\/dashboard\/create/.test(page.url()) && (await campoNome().isVisible()),
    "Cosmos: entre na sua conta do Spotify (e aceite os termos de desenvolvedor, se ele pedir). O resto eu preencho.");
  log("formulário de criação aberto");

  const faltou = [];
  if (!(await tentar("nome", () => campoNome().fill("Cosmos")))) faltou.push("App name: Cosmos");
  if (!(await tentar("descrição", () => page.getByLabel(/app description/i).first().fill("Papel de parede pessoal")))) faltou.push("App description");
  const redirect = await tentar("redirect", async () => {
    const campo = page.getByLabel(/redirect uri/i).first();
    await campo.fill(VOLTA);
    await page.getByRole("button", { name: /^add$/i }).first().click();
  });
  if (!redirect) faltou.push(`Redirect URI: ${VOLTA} (e clicar Add)`);
  if (!(await tentar("Web API", () => page.getByLabel(/^web api$/i).first().check()))) faltou.push("marcar Web API");
  log(faltou.length ? `faltou preencher: ${faltou.join(" · ")}` : "formulário preenchido");

  const pedido = faltou.length
    ? `Cosmos: complete ${faltou.join(" · ")}. Depois marque o aceite dos termos e clique Save.`
    : "Cosmos: preenchi tudo. Confira, marque o aceite dos termos do Spotify e clique Save.";
  await esperar(async () => /\/dashboard\/[0-9a-f]{32}/i.test(page.url()), pedido);
  const clientId = page.url().match(/\/dashboard\/([0-9a-f]{32})/i)[1];
  log(`app criado; Client ID ${clientId.slice(0, 6)}…`);

  // o login abre nesta mesma janela; a faixa some na navegação, então a página de autorização fala sozinha
  await entrar(clientId, (url) => { page.goto(url).then(() => aviso("Cosmos: clique em Concordar (Agree) para o Cosmos ler seus mais ouvidos e recentes.")).catch(() => {}); });
  await atualizar();
  await aviso("Cosmos conectado ao Spotify. Pode fechar esta janela.");
  await page.waitForTimeout(6000);
} catch (e) {
  log(`erro: ${e.message}`);
  await aviso(`Cosmos: deu erro (${e.message}). O Claude já está vendo.`);
  await page.waitForTimeout(8000);
  process.exitCode = 1;
} finally {
  await ctx.close().catch(() => {});
}
