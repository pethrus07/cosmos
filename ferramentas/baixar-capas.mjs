// Baixa as capas da lista (albuns.json) em 1000×1000 pela API pública do Deezer (sem login)
// e grava capas/capas.json + capas/capas.js (o que o papel de parede lê). Rodar de novo só baixa o que falta.
// Uso: node ferramentas/baixar-capas.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIR = path.join(RAIZ, "capas");
const lista = JSON.parse(fs.readFileSync(path.join(RAIZ, "albuns.json"), "utf8"));

const simples = (s) => String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const arquivoDe = (artista, album) => `${simples(artista)}--${simples(album)}`.replace(/ /g, "-") + ".jpg";

const json = async (url) => {
  const r = await fetch(url, { signal: AbortSignal.timeout(20000) });
  return r.ok ? r.json() : { results: [] };
};

// discografia inteira do artista no Deezer (API pública, sem login; a da Apple bloqueia com 403 depois
// de umas 20 consultas). Busca por texto devolve single e remix no lugar do álbum, por isso a discografia.
const discografias = new Map();
async function discografia(artista) {
  if (discografias.has(artista)) return discografias.get(artista);
  const { data: artistas = [] } = await json(`https://api.deezer.com/search/artist?${new URLSearchParams({ q: artista, limit: "5" })}`);
  const a = artistas.find((x) => simples(x.name) === simples(artista)) || artistas[0];
  let albuns = [];
  if (a) {
    const { data = [] } = await json(`https://api.deezer.com/artist/${a.id}/albums?limit=300`);
    albuns = data.filter((x) => x.record_type !== "single").map((x) => ({ collectionName: x.title, releaseDate: x.release_date, capa: x.cover_xl }));
  }
  discografias.set(artista, albuns);
  return albuns;
}

// tira o que é edição, não nome: "(Deluxe Edition)", "[Remastered]", " - EP"
const nucleo = (s) => simples(String(s).replace(/\s*[([].*?[)\]]/g, "").replace(/\s+-\s+(ep|single)$/i, ""));
const lixo = /\b(single|remix|live|ao vivo|instrumental|karaoke|commentary|reanimation\))/i;

async function buscar(artista, album) {
  const alvo = nucleo(album);
  {
    const albuns = await discografia(artista);
    const nota = (x) => {
      const n = nucleo(x.collectionName);
      if (n === alvo) return 3;
      if (n.startsWith(alvo) || alvo.startsWith(n)) return 2;
      if (n.includes(alvo)) return 1;
      return 0;
    };
    const candidatos = albuns.filter((x) => nota(x) > 0 && (!lixo.test(x.collectionName) || lixo.test(album)));
    // nome exato > começa igual; empate: a edição original (nome mais curto), depois a mais antiga
    const melhor = candidatos.sort((a, b) => nota(b) - nota(a) || a.collectionName.length - b.collectionName.length
      || Date.parse(a.releaseDate) - Date.parse(b.releaseDate))[0];
    if (melhor) return melhor;
  }
  return null;
}

const saida = [];
for (const { artista, albuns } of lista) {
  for (const album of albuns) {
    const arq = arquivoDe(artista, album);
    const destino = path.join(DIR, arq);
    if (!fs.existsSync(destino)) {
      const achado = await buscar(artista, album);
      if (!achado) { console.log(`NÃO ACHEI  ${artista} — ${album}`); continue; }
      const r = await fetch(achado.capa, { signal: AbortSignal.timeout(30000) });
      if (!r.ok) { console.log(`FALHOU     ${artista} — ${album} (HTTP ${r.status})`); continue; }
      fs.writeFileSync(destino, Buffer.from(await r.arrayBuffer()));
      console.log(`baixei     ${artista} — ${album}  ←  "${achado.collectionName}"`);
      await new Promise((ok) => setTimeout(ok, 400));
    }
    saida.push({ artista, album, arquivo: `capas/${arq}` });
  }
}
fs.writeFileSync(path.join(DIR, "capas.json"), JSON.stringify(saida, null, 1));
// a página abre direto do disco (file://), onde fetch de JSON é bloqueado: vai também como script
fs.writeFileSync(path.join(DIR, "capas.js"), `window.CAPAS = ${JSON.stringify(saida)};\n`);
console.log(`\n${saida.length} capas em capas/capas.json e capas/capas.js`);
