// O dia do Pedro virando céu (dados/dia.js, gerado por ferramentas/dados-do-dia.mjs a cada 10 min):
//  · cada commit de hoje é uma estrela branco-azulada; ligadas na ordem do dia, formam uma constelação
//  · cada nota do Sinapse mexida hoje é uma estrela violeta, noutra constelação (nota nova brilha mais)
//  · Hermes: proposta enviada hoje = ponto dourado; respondida = estrela dourada com raios; aceita (de
//    sempre) = estrela dourada grande e permanente, e quando aparece pela primeira vez, uma supernova
// Sem texto e sem número: o dia aparece só como céu. O que é novo desde a última leitura nasce com um clarão.
// A posição de cada estrela sai do id (sempre a mesma), dentro da região da sua constelação.
(() => {
  "use strict";
  const cv = document.getElementById("constelacoes");
  const ctx = cv.getContext("2d");
  const pausado = () => document.body.classList.contains("pausado");
  let W = 0, H = 0, escala = 1;

  // número de 0 a 1 que sai sempre igual do mesmo texto
  const sorteioFixo = (texto, sal = 0) => {
    let h = 2166136261 ^ sal;
    for (const ch of String(texto)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); }
    return ((h >>> 0) % 100000) / 100000;
  };

  // regiões fixas por tela, longe dos ícones e do meio
  const REGIOES = {
    commits: { cx: 0.8, cy: 0.24, rx: 0.13, ry: 0.15 },
    notas: { cx: 0.22, cy: 0.8, rx: 0.12, ry: 0.13 },
    hermes: { cx: 0.8, cy: 0.8, rx: 0.1, ry: 0.12 },
  };
  function posicao(regiao, id) {
    const r = REGIOES[regiao], ang = sorteioFixo(id, 1) * Math.PI * 2, dist = Math.sqrt(sorteioFixo(id, 2));
    return [(r.cx + Math.cos(ang) * r.rx * dist) * W, (r.cy + Math.sin(ang) * r.ry * dist) * H];
  }

  let estrelas = []; // { x, y, cor, raio, raios, nasceu, grupo }
  let explosoes = []; // { x, y, inicio, dur, cor, tam }
  const VISTOS = "cosmos.dia-vistos";
  const lerVistos = (data) => { try { const v = JSON.parse(localStorage.getItem(VISTOS)); return v && v.data === data ? new Set(v.ids) : new Set(); } catch { return new Set(); } };
  const gravarVistos = (data, ids) => { try { localStorage.setItem(VISTOS, JSON.stringify({ data, ids: [...ids] })); } catch { /* sem armazenamento */ } };
  const ACEITAS = "cosmos.aceitas-vistas";
  const lerAceitas = () => { try { return new Set(JSON.parse(localStorage.getItem(ACEITAS)) || []); } catch { return new Set(); } };

  function montar() {
    W = innerWidth; H = innerHeight;
    escala = Math.min(devicePixelRatio || 1, 1.5);
    cv.width = Math.round(W * escala); cv.height = Math.round(H * escala);
    const dia = window.COSMOS_DIA;
    if (!dia) { estrelas = []; return; }
    const agora = performance.now();
    const vistos = lerVistos(dia.data), aceitasVistas = lerAceitas();
    const primeiraLeitura = vistos.size === 0;
    const nova = [];
    const por = (grupo, regiao, item, cor, raio, raios = false) => {
      const [x, y] = posicao(regiao, item.id);
      const chave = `${grupo}:${item.id}`;
      const ehNova = !vistos.has(chave);
      vistos.add(chave);
      // na primeira leitura do dia tudo já está lá; depois, só o que chegou nasce com clarão
      const antiga = estrelas.find((e) => e.chave === chave);
      nova.push({ chave, grupo, x, y, cor, raio, raios, nasceu: antiga ? antiga.nasceu : (ehNova && !primeiraLeitura ? agora : -1e9), fase: sorteioFixo(item.id, 3) * 6.28 });
      if (ehNova && !primeiraLeitura && !antiga) explosoes.push({ x, y, inicio: agora, dur: 2600, cor, tam: H * 0.05 });
    };
    for (const c of dia.commits) por("commits", "commits", c, "205,220,255", 1.6);
    for (const n of dia.notas) por("notas", "notas", n, n.nova ? "190,160,255" : "150,120,230", n.nova ? 1.9 : 1.2);
    for (const e of dia.hermes.enviadas) por("enviadas", "hermes", e, "255,200,90", 1.1);
    for (const r of dia.hermes.respondidas) por("respondidas", "hermes", r, "255,214,102", 2.2, true);
    for (const a of dia.hermes.aceitas) {
      por("aceitas", "hermes", a, "255,183,0", 3.2, true);
      if (!aceitasVistas.has(a.id)) { // supernova: uma vez por proposta aceita, para sempre
        const [x, y] = posicao("hermes", a.id);
        explosoes.push({ x, y, inicio: agora + 800, dur: 7000, cor: "255,183,0", tam: H * 0.35, supernova: true });
        aceitasVistas.add(a.id);
      }
    }
    try { localStorage.setItem(ACEITAS, JSON.stringify([...aceitasVistas])); } catch { /* sem armazenamento */ }
    gravarVistos(dia.data, vistos);
    estrelas = nova;
  }

  function linhas(grupo, cor) {
    const g = estrelas.filter((e) => e.grupo === grupo);
    if (g.length < 2) return;
    ctx.strokeStyle = `rgba(${cor},.16)`;
    ctx.lineWidth = 0.8 * escala;
    ctx.setLineDash([3 * escala, 5 * escala]);
    ctx.beginPath();
    g.forEach((e, i) => (i ? ctx.lineTo(e.x * escala, e.y * escala) : ctx.moveTo(e.x * escala, e.y * escala)));
    ctx.stroke();
    ctx.setLineDash([]);
  }

  function desenhar(agora) {
    ctx.clearRect(0, 0, cv.width, cv.height);
    const batida = window.cosmosAudio?.batida || 0;
    linhas("commits", "205,220,255");
    linhas("notas", "170,140,255");
    for (const e of estrelas) {
      const idade = (agora - e.nasceu) / 1000;
      const nascendo = Math.min(1, Math.max(0, idade / 2.5));
      const pisca = 0.75 + 0.25 * Math.sin(agora / 900 + e.fase);
      const r = e.raio * escala * (1 + batida * 0.4) * (0.4 + 0.6 * nascendo);
      const x = e.x * escala, y = e.y * escala;
      const halo = ctx.createRadialGradient(x, y, 0, x, y, r * 5);
      halo.addColorStop(0, `rgba(${e.cor},${0.5 * pisca * nascendo})`);
      halo.addColorStop(1, `rgba(${e.cor},0)`);
      ctx.fillStyle = halo;
      ctx.beginPath(); ctx.arc(x, y, r * 5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = `rgba(255,255,255,${0.9 * pisca * nascendo})`;
      ctx.beginPath(); ctx.arc(x, y, r * 0.8, 0, Math.PI * 2); ctx.fill();
      if (e.raios) {
        ctx.strokeStyle = `rgba(${e.cor},${0.55 * pisca * nascendo})`;
        ctx.lineWidth = 1 * escala;
        const c = r * 7;
        ctx.beginPath(); ctx.moveTo(x - c, y); ctx.lineTo(x + c, y); ctx.moveTo(x, y - c); ctx.lineTo(x, y + c); ctx.stroke();
      }
    }
    // clarões de nascimento e supernovas
    explosoes = explosoes.filter((x) => agora - x.inicio < x.dur);
    for (const ex of explosoes) {
      const p = (agora - ex.inicio) / ex.dur;
      if (p < 0) continue;
      const x = ex.x * escala, y = ex.y * escala, raio = ex.tam * escala * (ex.supernova ? Math.pow(p, 0.45) : p);
      const alfa = ex.supernova ? Math.pow(1 - p, 1.4) : 1 - p;
      const luz = ctx.createRadialGradient(x, y, 0, x, y, raio);
      luz.addColorStop(0, `rgba(255,250,235,${alfa * (ex.supernova ? 0.9 : 0.5)})`);
      luz.addColorStop(0.25, `rgba(${ex.cor},${alfa * 0.45})`);
      luz.addColorStop(1, `rgba(${ex.cor},0)`);
      ctx.fillStyle = luz;
      ctx.beginPath(); ctx.arc(x, y, raio, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = `rgba(${ex.cor},${alfa * 0.7})`; // a onda de choque
      ctx.lineWidth = (ex.supernova ? 2.5 : 1.2) * escala;
      ctx.beginPath(); ctx.arc(x, y, raio * 0.92, 0, Math.PI * 2); ctx.stroke();
    }
  }

  // relê o dia a cada 2 min (a tarefa regrava o arquivo a cada 10)
  function recarregar() {
    const s = document.createElement("script");
    s.src = `dados/dia.js?t=${Date.now()}`;
    s.onload = () => { s.remove(); montar(); };
    s.onerror = () => s.remove();
    document.head.appendChild(s);
  }

  let ultimo = 0;
  function quadro(agora) {
    requestAnimationFrame(quadro);
    if (pausado() || agora - ultimo < 1000 / 20) return; // 20 quadros por segundo: só piscar e clarão
    ultimo = agora;
    desenhar(agora);
  }
  addEventListener("resize", montar);
  montar();
  requestAnimationFrame(quadro);
  setInterval(recarregar, 2 * 60 * 1000);
  if (location.hash.includes("supernova")) setTimeout(() => {
    const [x, y] = posicao("hermes", "teste");
    explosoes.push({ x, y, inicio: performance.now(), dur: 7000, cor: "255,183,0", tam: H * 0.35, supernova: true });
  }, 1500);
})();
