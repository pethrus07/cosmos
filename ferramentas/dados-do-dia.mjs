// Dados do dia para o céu do Cosmos: commits de hoje (todos os repositórios em ~/Projetos, só os do Pedro),
// notas do Sinapse mexidas hoje e o andamento das propostas do Hermes. Grava dados/dia.js.
// Só ids, horários e contagens: nada disso aparece escrito no fundo, vira estrela.
// Uso: node ferramentas/dados-do-dia.mjs   (a tarefa Cosmos-Dados roda a cada 10 min)
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PROJETOS = path.join(process.env.USERPROFILE, "Projetos");
const VAULT = path.join(PROJETOS, "sinapse");
const HERMES = path.join(PROJETOS, "hermes", "dados", "propostas.jsonl");
// E-mails de autor que contam como "meus": um por linha em %LOCALAPPDATA%\cosmos\autores.txt (fora do
// repositório); sem o arquivo, vale o user.email do git.
const ARQ_AUTORES = path.join(process.env.LOCALAPPDATA || "", "cosmos", "autores.txt");
const AUTORES = (() => {
  try {
    const lista = fs.readFileSync(ARQ_AUTORES, "utf8").split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    if (lista.length) return lista;
  } catch {}
  try { return [execFileSync("git", ["config", "user.email"], { encoding: "utf8", windowsHide: true }).trim()].filter(Boolean); } catch { return []; }
})();

const meiaNoite = new Date();
meiaNoite.setHours(0, 0, 0, 0);
const hoje = (iso) => iso && Date.parse(iso) >= meiaNoite.getTime();
const curto = (s) => crypto.createHash("sha1").update(String(s)).digest("hex").slice(0, 12);

// commits de hoje: um por linha "hash|data"; o vault do Sinapse conta como nota, não como commit
const commits = [];
for (const nome of fs.readdirSync(PROJETOS)) {
  const dir = path.join(PROJETOS, nome);
  if (nome === "sinapse" || !fs.existsSync(path.join(dir, ".git"))) continue;
  try {
    const args = ["-C", dir, "log", "--all", `--since=${meiaNoite.toISOString()}`, "--format=%H|%cI", ...AUTORES.map((a) => `--author=${a}`)];
    const saida = execFileSync("git", args, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"], windowsHide: true, timeout: 15000 });
    for (const linha of saida.trim().split(/\r?\n/).filter(Boolean)) {
      const [hash, quando] = linha.split("|");
      commits.push({ id: hash.slice(0, 12), hora: quando, repo: curto(nome) });
    }
  } catch { /* repositório sem commits ou git falhou: segue */ }
}

// notas do Sinapse mexidas hoje (nova = criada hoje)
const notas = [];
const andar = (dir) => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith(".") || e.name === "node_modules") continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) andar(p);
    else if (e.name.endsWith(".md")) {
      const st = fs.statSync(p);
      if (st.mtimeMs >= meiaNoite.getTime()) notas.push({ id: curto(path.relative(VAULT, p)), hora: st.mtime.toISOString(), nova: st.birthtimeMs >= meiaNoite.getTime() });
    }
  }
};
if (fs.existsSync(VAULT)) andar(VAULT);

// Hermes: enviadas e respondidas hoje; aceitas de sempre (viram estrelas permanentes)
const hermes = { enviadas: [], respondidas: [], aceitas: [] };
if (fs.existsSync(HERMES)) {
  for (const linha of fs.readFileSync(HERMES, "utf8").trim().split(/\r?\n/).filter(Boolean)) {
    let p;
    try { p = JSON.parse(linha); } catch { continue; }
    const d = p.datas || {}, id = curto(p.id);
    if (hoje(d.enviada)) hermes.enviadas.push({ id, hora: d.enviada });
    if (hoje(d.respondida)) hermes.respondidas.push({ id, hora: d.respondida });
    if (d.aceita) hermes.aceitas.push({ id, hora: d.aceita });
  }
}

const porHora = (a, b) => Date.parse(a.hora) - Date.parse(b.hora);
const dia = {
  gerado: new Date().toISOString(),
  data: meiaNoite.toISOString().slice(0, 10),
  commits: commits.sort(porHora),
  notas: notas.sort(porHora),
  hermes: { enviadas: hermes.enviadas.sort(porHora), respondidas: hermes.respondidas.sort(porHora), aceitas: hermes.aceitas.sort(porHora) },
};
fs.mkdirSync(path.join(RAIZ, "dados"), { recursive: true });
// a página abre do disco (file://), onde fetch de JSON é bloqueado: vai como script
fs.writeFileSync(path.join(RAIZ, "dados", "dia.js"), `window.COSMOS_DIA = ${JSON.stringify(dia)};\n`);
console.log(`${dia.data}: ${dia.commits.length} commits, ${dia.notas.length} notas (${dia.notas.filter((n) => n.nova).length} novas), `
  + `Hermes ${dia.hermes.enviadas.length} enviadas / ${dia.hermes.respondidas.length} respondidas hoje, ${dia.hermes.aceitas.length} aceitas no total`);
