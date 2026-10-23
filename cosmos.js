// Cosmos: o papel de parede do Pedro no Lively Wallpaper.
// Espaço escuro e infinito (nebulosa no roxo da RYZE, estrelas vindo na direção da tela, estrela cadente
// dourada de vez em quando) com uma moldura de capas de álbum que viram uma de cada vez; numa das viradas
// pode aparecer o símbolo da RYZE.
// Música: o Lively chama livelyCurrentTrack (argumento --system-nowplaying) com a faixa que o Windows vê
// tocando (Spotify incluso). A capa do álbum vira em destaque dourado e entra na coleção para sempre
// (localStorage do Lively), em alta resolução quando o Deezer acha o álbum.
// Teste fora do Lively: index.html#teste (faixa da coleção) ou #teste-novo (faixa de fora).
(() => {
  "use strict";

  // ---------- utilidades
  const aleatorio = (a, b) => a + Math.random() * (b - a);
  const sortear = (lista) => lista[Math.floor(Math.random() * lista.length)];
  const simples = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
    .replace(/\s*[([].*?[)\]]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
  const chaveDe = (artista, album) => `${simples(artista)}|${simples(album)}`;
  const embaralhar = (lista) => {
    const l = [...lista];
    for (let i = l.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [l[i], l[j]] = [l[j], l[i]]; }
    return l;
  };

  // ---------- coleção: base (capas/capas.js) + as que chegaram pela música tocando
  const GUARDADAS = "cosmos.capas-aprendidas";
  const lerGuardadas = () => { try { return JSON.parse(localStorage.getItem(GUARDADAS)) || []; } catch { return []; } };
  const gravarGuardadas = (l) => { try { localStorage.setItem(GUARDADAS, JSON.stringify(l.slice(-400))); } catch { /* sem armazenamento: vale só nesta sessão */ } };

  const colecao = new Map();
  const juntar = (artista, album, src) => {
    const chave = chaveDe(artista, album);
    if (!colecao.has(chave)) colecao.set(chave, { chave, artista, album, src });
    return colecao.get(chave);
  };
  for (const c of window.CAPAS || []) juntar(c.artista, c.album, c.arquivo);
  for (const c of lerGuardadas()) juntar(c.artista, c.album, c.src);
  const RYZE = { chave: "ryze", ryze: true };

  // ---------- espaço
  const ceu = document.getElementById("estrelas");
  const ctx = ceu.getContext("2d");
  const nebulosa = document.getElementById("nebulosa");
  const distantes = document.getElementById("distantes");
  let W = 0, H = 0, escala = 1, estrelas = [], cadente = null, proximaCadente = 0, pausado = false;

  function pintarNebulosa(D) {
    const c = document.createElement("canvas");
    c.width = c.height = Math.ceil(D / 2); // nebulosa é desfocada: meia resolução basta
    const g = c.getContext("2d");
    const r = c.width / 2;
    g.filter = `blur(${Math.round(r * 0.04)}px)`;
    g.globalCompositeOperation = "screen";
    const nuvem = (x, y, raio, cor, alfa) => {
      const gr = g.createRadialGradient(x, y, 0, x, y, raio);
      gr.addColorStop(0, `rgba(${cor},${alfa})`);
      gr.addColorStop(1, `rgba(${cor},0)`);
      g.fillStyle = gr;
      g.fillRect(x - raio, y - raio, raio * 2, raio * 2);
    };
    // braço da nebulosa: nuvens roxas ao longo de uma espiral frouxa que passa perto do centro
    const roxos = ["106,40,201", "76,29,149", "139,92,246", "58,20,110"];
    for (let i = 0; i < 70; i++) {
      const t = aleatorio(0, 1);
      const ang = t * Math.PI * 2.4 + aleatorio(-0.35, 0.35);
      const dist = r * (0.12 + t * 0.75) * aleatorio(0.8, 1.15);
      nuvem(r + Math.cos(ang) * dist, r + Math.sin(ang) * dist * 0.62, r * aleatorio(0.08, 0.26), sortear(roxos), aleatorio(0.05, 0.13));
    }
    // poeira fria e um brilho dourado bem fraco no fundo do túnel
    for (let i = 0; i < 18; i++) nuvem(r + aleatorio(-r, r) * 0.8, r + aleatorio(-r, r) * 0.6, r * aleatorio(0.1, 0.3), "30,50,110", aleatorio(0.03, 0.07));
    nuvem(r, r, r * 0.22, "255,183,0", 0.05);
    nuvem(r, r, r * 0.07, "255,214,102", 0.06);
    return c.toDataURL("image/png");
  }

  function pintarDistantes(D) {
    const c = document.createElement("canvas");
    c.width = c.height = Math.ceil(D * escala);
    const g = c.getContext("2d");
    const n = Math.round((D * D) / 1400);
    for (let i = 0; i < n; i++) {
      const sorte = Math.random();
      const cor = sorte < 0.03 ? "255,200,80" : sorte < 0.07 ? "170,140,255" : "220,228,255";
      g.fillStyle = `rgba(${cor},${aleatorio(0.15, 0.85) * (Math.random() < 0.9 ? 0.6 : 1)})`;
      g.beginPath();
      g.arc(Math.random() * c.width, Math.random() * c.height, aleatorio(0.25, Math.random() < 0.97 ? 0.9 : 1.6) * escala, 0, Math.PI * 2);
      g.fill();
    }
    return c.toDataURL("image/png");
  }

  const novaEstrela = (z = aleatorio(0.15, 1)) => {
    const sorte = Math.random();
    return {
      x: aleatorio(-1, 1), y: aleatorio(-1, 1), z,
      cor: sorte < 0.06 ? "255,196,60" : sorte < 0.11 ? "167,139,250" : "225,232,255",
      brilho: aleatorio(0.55, 1),
    };
  };

  function prepararEspaco() {
    W = innerWidth; H = innerHeight;
    escala = Math.min(devicePixelRatio || 1, 1.5);
    ceu.width = Math.round(W * escala);
    ceu.height = Math.round(H * escala);
    const D = Math.ceil(Math.hypot(W, H)) + 40; // as camadas giram: precisam cobrir a diagonal
    for (const camada of [nebulosa, distantes]) { camada.style.width = `${D}px`; camada.style.height = `${D}px`; }
    nebulosa.style.backgroundImage = `url(${pintarNebulosa(D)})`;
    distantes.style.backgroundImage = `url(${pintarDistantes(D)})`;
    estrelas = Array.from({ length: Math.round((W * H) / 5200) }, () => novaEstrela());
    proximaCadente = performance.now() + aleatorio(6000, 15000);
  }

  // estrelas vindo devagar na direção da tela: z cai de 1 a ~0,05 em quase um minuto
  const VELOCIDADE = 0.017;
  function desenharCeu(agora, dt) {
    const w = ceu.width, h = ceu.height, cx = w / 2, cy = h / 2, f = Math.max(w, h) * 0.5;
    ctx.clearRect(0, 0, w, h);
    for (const e of estrelas) {
      e.z -= VELOCIDADE * dt;
      let sx = cx + (e.x / e.z) * f, sy = cy + (e.y / e.z) * f;
      if (e.z < 0.05 || sx < -20 || sx > w + 20 || sy < -20 || sy > h + 20) { Object.assign(e, novaEstrela(1)); continue; }
      const perto = 1 - e.z;
      const raio = (0.3 + perto * perto * 2.4) * escala;
      ctx.fillStyle = `rgba(${e.cor},${Math.min(1, perto * 1.5) * e.brilho})`;
      ctx.beginPath();
      ctx.arc(sx, sy, raio, 0, Math.PI * 2);
      ctx.fill();
    }
    // estrela cadente dourada
    if (!cadente && agora > proximaCadente) {
      const ang = aleatorio(0.35, 0.75) * (Math.random() < 0.5 ? 1 : -1) + (Math.random() < 0.5 ? 0 : Math.PI);
      cadente = { x: aleatorio(0.25, 0.75) * w, y: aleatorio(0.2, 0.5) * h, vx: Math.cos(ang), vy: Math.abs(Math.sin(ang)), vida: 0, dur: aleatorio(0.9, 1.5), compr: aleatorio(140, 260) * escala };
    }
    if (cadente) {
      cadente.vida += dt;
      const p = cadente.vida / cadente.dur;
      if (p >= 1) { cadente = null; proximaCadente = agora + aleatorio(18000, 45000); return; }
      const andou = p * cadente.compr * 3;
      const hx = cadente.x + cadente.vx * andou, hy = cadente.y + cadente.vy * andou;
      const tx = hx - cadente.vx * cadente.compr, ty = hy - cadente.vy * cadente.compr;
      const alfa = Math.sin(p * Math.PI);
      const gr = ctx.createLinearGradient(hx, hy, tx, ty);
      gr.addColorStop(0, `rgba(255,224,140,${alfa})`);
      gr.addColorStop(0.15, `rgba(255,183,0,${alfa * 0.6})`);
      gr.addColorStop(1, "rgba(255,183,0,0)");
      ctx.strokeStyle = gr;
      ctx.lineWidth = 1.6 * escala;
      ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(tx, ty); ctx.stroke();
    }
  }

  // 30 quadros por segundo bastam para movimento lento e gastam metade da GPU
  let ultimo = 0, laco = 0;
  function quadro(agora) {
    laco = requestAnimationFrame(quadro);
    if (agora - ultimo < 1000 / 30) return;
    const dt = Math.min(0.1, (agora - ultimo) / 1000 || 0);
    ultimo = agora;
    desenharCeu(agora, dt);
  }

  // ---------- moldura de capas
  const moldura = document.getElementById("moldura");
  const painelTocando = document.getElementById("tocando");
  let capas = []; // { el, frente, atras, verso, item, fixa, desde }

  function pintar(face, item) {
    face.classList.toggle("ryze", Boolean(item.ryze));
    face.style.backgroundImage = item.ryze ? "" : `url("${item.src}")`;
  }

  const carregar = (item) => new Promise((ok) => {
    if (item.ryze) return ok(true);
    const img = new Image();
    img.onload = () => ok(true);
    img.onerror = () => ok(false);
    img.src = item.src;
  });

  function montarMoldura() {
    const anteriores = capas.map((c) => c.item);
    moldura.textContent = "";
    capas = [];
    const m = Math.round(H * 0.014), g = Math.round(H * 0.011);
    const s = Math.floor((H - 2 * m - 3 * g) / 4);
    const cols = Math.max(4, Math.floor((W - 2 * m + g) / (s + g)));
    const x0 = Math.round((W - (cols * s + (cols - 1) * g)) / 2);
    const lugares = [];
    for (let c = 0; c < cols; c++) lugares.push([c, 0]);
    for (let r = 1; r <= 2; r++) lugares.push([cols - 1, r]);
    for (let c = cols - 1; c >= 0; c--) lugares.push([c, 3]);
    for (let r = 2; r >= 1; r--) lugares.push([0, r]);

    const inicio = [...anteriores.filter((i) => !i.ryze), ...embaralhar([...colecao.values()])];
    const usadas = new Set();
    for (const [c, r] of lugares) {
      const el = document.createElement("div");
      el.className = "capa";
      Object.assign(el.style, { left: `${x0 + c * (s + g)}px`, top: `${m + r * (s + g)}px`, width: `${s}px`, height: `${s}px` });
      el.innerHTML = '<div class="giro"><div class="face frente"></div><div class="face atras"></div></div>';
      const capa = { el, frente: el.querySelector(".frente"), atras: el.querySelector(".atras"), verso: false, item: null, fixa: false, desde: 0 };
      const item = inicio.find((i) => !usadas.has(i.chave)) || sortear(inicio);
      usadas.add(item.chave);
      capa.item = item;
      pintar(capa.frente, item);
      moldura.appendChild(el);
      capas.push(capa);
    }
    // o "tocando agora" fica no vão, logo acima da fileira de baixo (mesma conta das capas, de cima para baixo)
    painelTocando.style.top = `${m + 3 * (s + g) - Math.round(s * 0.16)}px`;
  }

  const visiveis = () => new Set(capas.map((c) => c.item.chave));

  async function virar(capa, item) {
    if (!(await carregar(item))) return false;
    pintar(capa.verso ? capa.frente : capa.atras, item);
    capa.verso = !capa.verso;
    capa.el.classList.toggle("verso", capa.verso);
    capa.item = item;
    capa.desde = performance.now();
    return true;
  }

  // uma capa vira a cada 3,5 a 6,5 s; a RYZE aparece em ~1 de cada 10 viradas, nunca duas ao mesmo tempo
  async function virarUma() {
    if (!pausado && capas.length) {
      const agora = performance.now();
      const livres = capas.filter((c) => !c.fixa && agora - c.desde > 15000);
      const capa = sortear(livres.length ? livres : capas.filter((c) => !c.fixa));
      if (capa) {
        const vis = visiveis();
        const querRyze = !vis.has("ryze") && Math.random() < 0.1;
        const fora = [...colecao.values()].filter((i) => !vis.has(i.chave));
        const item = querRyze ? RYZE : sortear(fora.length ? fora : [...colecao.values()]);
        if (item) await virar(capa, item);
      }
    }
    setTimeout(virarUma, aleatorio(3500, 6500));
  }

  // ---------- música tocando
  function jsonp(url, ms = 8000) {
    return new Promise((ok, falha) => {
      const nome = `cosmos_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      const s = document.createElement("script");
      const limpar = () => { delete window[nome]; s.remove(); clearTimeout(t); };
      const t = setTimeout(() => { limpar(); falha(new Error("tempo esgotado")); }, ms);
      window[nome] = (dado) => { limpar(); ok(dado); };
      s.onerror = () => { limpar(); falha(new Error("sem rede")); };
      s.src = `${url}${url.includes("?") ? "&" : "?"}output=jsonp&callback=${nome}`;
      document.head.appendChild(s);
    });
  }

  // capa do álbum da faixa: coleção > Deezer (1000×1000, guardada para sempre) > miniatura do Windows
  async function capaDaFaixa(faixa) {
    const artista = faixa.Artist || faixa.AlbumArtist || "";
    if (faixa.AlbumTitle && colecao.has(chaveDe(artista, faixa.AlbumTitle))) return colecao.get(chaveDe(artista, faixa.AlbumTitle));
    try {
      const principal = artista.split(/,|&| feat\.? /i)[0].trim();
      const q = `artist:"${principal}" track:"${faixa.Title}"`;
      const { data = [] } = await jsonp(`https://api.deezer.com/search?q=${encodeURIComponent(q)}&limit=5`);
      const achada = data.find((d) => d.album && d.album.cover_xl);
      if (achada) {
        const chave = chaveDe(principal, achada.album.title);
        if (colecao.has(chave)) return colecao.get(chave);
        const nova = juntar(principal, achada.album.title, achada.album.cover_xl);
        gravarGuardadas([...lerGuardadas(), { artista: nova.artista, album: nova.album, src: nova.src }]);
        return nova;
      }
    } catch { /* sem rede: cai na miniatura */ }
    if (faixa.Thumbnail) {
      const src = faixa.Thumbnail.startsWith("data:image/") ? faixa.Thumbnail : `data:image/png;base64,${faixa.Thumbnail}`;
      return { chave: chaveDe(artista, faixa.AlbumTitle || faixa.Title), artista, album: faixa.AlbumTitle || faixa.Title, src };
    }
    return null;
  }

  let faixaAtual = null;
  function soltarDestaque() {
    for (const c of capas) if (c.fixa) { c.fixa = false; c.el.classList.remove("tocando"); }
  }

  async function destacar(item) {
    soltarDestaque();
    let capa = capas.find((c) => c.item.chave === item.chave);
    if (!capa) {
      // de preferência uma capa da fileira de baixo, perto do "tocando agora"
      const baixo = capas.filter((c) => parseFloat(c.el.style.top) > H / 2);
      capa = sortear(baixo.length ? baixo : capas);
      if (!(await virar(capa, item))) return;
    }
    capa.fixa = true;
    capa.el.classList.add("tocando");
  }

  window.livelyCurrentTrack = async (dado) => {
    let faixa = null;
    try { faixa = JSON.parse(dado); } catch { faixa = null; }
    if (!faixa || !faixa.Title) {
      faixaAtual = null;
      painelTocando.classList.remove("visivel");
      soltarDestaque();
      return;
    }
    const id = `${simples(faixa.Artist)}|${simples(faixa.Title)}`;
    if (id === faixaAtual) return;
    faixaAtual = id;
    painelTocando.querySelector(".faixa").textContent = faixa.Artist ? `${faixa.Title}  ·  ${faixa.Artist}` : faixa.Title;
    painelTocando.classList.add("visivel");
    const item = await capaDaFaixa(faixa);
    if (item && faixaAtual === id) await destacar(item);
  };

  // o Lively avisa quando pausa (jogo, tela cheia, bateria): para tudo, inclusive as camadas que giram
  window.livelyWallpaperPlaybackChanged = (dado) => {
    try { pausado = Boolean(JSON.parse(dado).IsPaused); } catch { pausado = false; }
    document.body.classList.toggle("pausado", pausado);
    if (pausado) cancelAnimationFrame(laco);
    else { ultimo = performance.now(); laco = requestAnimationFrame(quadro); }
  };

  // ---------- início
  function montarTudo() { prepararEspaco(); montarMoldura(); }
  let redim = 0;
  addEventListener("resize", () => { clearTimeout(redim); redim = setTimeout(montarTudo, 300); });
  montarTudo();
  laco = requestAnimationFrame(quadro);
  setTimeout(virarUma, 2500);

  if (location.hash === "#teste") setTimeout(() => window.livelyCurrentTrack(JSON.stringify({ Title: "Scar Tissue", Artist: "Red Hot Chili Peppers", AlbumTitle: "Californication" })), 1500);
  if (location.hash === "#teste-novo") setTimeout(() => window.livelyCurrentTrack(JSON.stringify({ Title: "Tempo Perdido", Artist: "Legião Urbana", AlbumTitle: "Dois" })), 1500);
})();
