// Coleção do Cosmos a partir do Spotify do Pedro: álbuns das faixas mais ouvidas de sempre (long_term) e
// das tocadas recentemente. Grava capas/spotify/*.jpg e capas/spotify.js; o papel de parede usa essa
// coleção quando ela existe (e a base de albuns.json quando não).
//
//   node ferramentas/spotify.mjs entrar <client_id>   login uma vez (abre o navegador; PKCE, sem segredo)
//   node ferramentas/spotify.mjs atualizar            o que a tarefa agendada roda
//
// O token fica em %LOCALAPPDATA%\cosmos\spotify.json, fora do repositório. Só leitura: escopos
// user-top-read e user-read-recently-played. Exige Premium no dono do app (regra do Spotify desde 02/2026).
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import crypto from "node:crypto";
import { spawn } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIR_CAPAS = path.join(RAIZ, "capas", "spotify");
const ARQ_TOKEN = path.join(process.env.LOCALAPPDATA, "cosmos", "spotify.json");
const PORTA = 8888;
const VOLTA = `http://127.0.0.1:${PORTA}/callback`;
const ESCOPOS = "user-top-read user-read-recently-played";
const MAX_ALBUNS = 90;

const lerToken = () => { try { return JSON.parse(fs.readFileSync(ARQ_TOKEN, "utf8")); } catch { return null; } };
const gravarToken = (t) => { fs.mkdirSync(path.dirname(ARQ_TOKEN), { recursive: true }); fs.writeFileSync(ARQ_TOKEN, JSON.stringify(t, null, 1)); };
const b64url = (buf) => buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
// o fundo mostra capa com ~150 px: a imagem de ~300 px do Spotify basta (a de 640 só gastava memória)
const imagemMedia = (imgs) => [...imgs].sort((a, b) => Math.abs((a.width || 300) - 300) - Math.abs((b.width || 300) - 300))[0].url;
const log = (...a) => console.log(new Date().toISOString().slice(0, 19), ...a);

async function pedirToken(campos) {
  const r = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(campos),
    signal: AbortSignal.timeout(20000),
  });
  const j = await r.json();
  if (!r.ok) throw new Error(`token: ${j.error || r.status} ${j.error_description || ""}`);
  return j;
}

const abrirNoNavegador = (url) => spawn("rundll32", ["url.dll,FileProtocolHandler", url], { detached: true, stdio: "ignore" }).unref();

// `abrir` recebe o endereço de autorização (padrão: o navegador do Windows; o conectar-spotify.mjs usa a
// mesma janela em que o Pedro já entrou)
async function entrar(clientId, abrir = abrirNoNavegador) {
  if (!/^[0-9a-f]{32}$/i.test(clientId || "")) throw new Error("Client ID inválido: são 32 caracteres (0-9, a-f)");
  const verificador = b64url(crypto.randomBytes(48));
  const desafio = b64url(crypto.createHash("sha256").update(verificador).digest());
  const estado = b64url(crypto.randomBytes(12));
  const url = `https://accounts.spotify.com/authorize?${new URLSearchParams({
    client_id: clientId, response_type: "code", redirect_uri: VOLTA, scope: ESCOPOS,
    code_challenge_method: "S256", code_challenge: desafio, state: estado,
  })}`;
  const codigo = await new Promise((ok, falha) => {
    const servidor = http.createServer((req, res) => {
      const u = new URL(req.url, VOLTA);
      if (u.pathname !== "/callback") { res.writeHead(404).end(); return; }
      const erro = u.searchParams.get("error");
      const pronto = !erro && u.searchParams.get("state") === estado && u.searchParams.get("code");
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(`<body style="background:#05060A;color:#eee;font:16px system-ui;display:grid;place-items:center;height:100vh;margin:0">
        <p>${pronto ? "Spotify conectado ao Cosmos. Pode fechar esta aba." : `Não conectou: ${erro || "resposta inesperada"}.`}</p></body>`);
      servidor.close();
      pronto ? ok(pronto) : falha(new Error(`login recusado: ${erro || "estado não confere"}`));
    });
    servidor.listen(PORTA, "127.0.0.1", () => {
      log("abrindo a autorização do Spotify…");
      abrir(url);
    });
    setTimeout(() => { servidor.close(); falha(new Error("tempo esgotado esperando o login (5 min)")); }, 5 * 60 * 1000);
  });
  const t = await pedirToken({ grant_type: "authorization_code", code: codigo, redirect_uri: VOLTA, client_id: clientId, code_verifier: verificador });
  gravarToken({ client_id: clientId, refresh_token: t.refresh_token, conectado_em: new Date().toISOString() });
  log("conectado");
}

async function acesso() {
  const t = lerToken();
  if (!t?.refresh_token) throw new Error("Spotify não conectado: rode `node ferramentas/spotify.mjs entrar <client_id>`");
  const novo = await pedirToken({ grant_type: "refresh_token", refresh_token: t.refresh_token, client_id: t.client_id });
  if (novo.refresh_token && novo.refresh_token !== t.refresh_token) gravarToken({ ...t, refresh_token: novo.refresh_token });
  return novo.access_token;
}

async function api(token, caminho) {
  const r = await fetch(`https://api.spotify.com/v1${caminho}`, { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(20000) });
  if (!r.ok) throw new Error(`${caminho}: HTTP ${r.status} ${(await r.text()).slice(0, 200)}`);
  return r.json();
}

async function atualizar() {
  const token = await acesso();
  const recentes = (await api(token, "/me/player/recently-played?limit=50")).items.map((i) => i.track);
  const top = [];
  for (const offset of [0, 50]) top.push(...(await api(token, `/me/top/tracks?time_range=long_term&limit=50&offset=${offset}`)).items);
  const albuns = new Map();
  const somar = (faixas, origem) => {
    for (const f of faixas) {
      const a = f?.album;
      if (!a?.id || !a.images?.length || albuns.has(a.id)) continue;
      albuns.set(a.id, { id: a.id, artista: a.artists?.[0]?.name || "", album: a.name, imagem: imagemMedia(a.images), origem });
    }
  };
  // recentes primeiro (o que está na cabeça agora), depois os de sempre
  somar(recentes, "recente");
  somar(top, "mais-ouvido");
  const lista = [...albuns.values()].slice(0, MAX_ALBUNS);
  fs.mkdirSync(DIR_CAPAS, { recursive: true });
  let baixadas = 0;
  for (const a of lista) {
    const destino = path.join(DIR_CAPAS, `${a.id}.jpg`);
    if (!fs.existsSync(destino)) {
      const r = await fetch(a.imagem, { signal: AbortSignal.timeout(30000) });
      if (!r.ok) { log(`capa falhou: ${a.artista} — ${a.album} (HTTP ${r.status})`); continue; }
      fs.writeFileSync(destino, Buffer.from(await r.arrayBuffer()));
      baixadas++;
    }
    a.arquivo = `capas/spotify/${a.id}.jpg`;
  }
  // fotos dos artistas mais ouvidos de sempre: entram redondas, em número menor que as capas
  const artistas = (await api(token, "/me/top/artists?time_range=long_term&limit=20")).items.filter((a) => a.images?.length);
  for (const a of artistas) {
    const destino = path.join(DIR_CAPAS, `artista-${a.id}.jpg`);
    if (!fs.existsSync(destino)) {
      const r = await fetch(imagemMedia(a.images), { signal: AbortSignal.timeout(30000) });
      if (!r.ok) { log(`foto falhou: ${a.name} (HTTP ${r.status})`); continue; }
      fs.writeFileSync(destino, Buffer.from(await r.arrayBuffer()));
      baixadas++;
    }
    lista.push({ artista: a.name, album: "", arquivo: `capas/spotify/artista-${a.id}.jpg`, origem: "artista", tipo: "artista" });
  }
  const prontas = lista.filter((a) => a.arquivo).map(({ artista, album, arquivo, origem, tipo = "capa" }) => ({ artista, album, arquivo, origem, tipo }));
  // o papel de parede abre do disco (file://), onde fetch de JSON é bloqueado: vai como script
  fs.writeFileSync(path.join(RAIZ, "capas", "spotify.js"), `window.CAPAS_SPOTIFY = ${JSON.stringify(prontas)};\n`);
  const conta = (o) => prontas.filter((a) => a.origem === o).length;
  log(`${prontas.length - conta("artista")} álbuns (${conta("recente")} recentes, ${conta("mais-ouvido")} mais ouvidos) e ${conta("artista")} artistas; ${baixadas} imagens novas`);
}

export { entrar, atualizar };

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [comando, arg] = process.argv.slice(2);
  try {
    if (comando === "entrar") { await entrar(arg); await atualizar(); }
    else if (comando === "atualizar") await atualizar();
    else { console.log("uso: node ferramentas/spotify.mjs entrar <client_id> | atualizar"); process.exitCode = 2; }
  } catch (e) {
    log(`erro: ${e.message}`);
    process.exitCode = 1;
  }
}
