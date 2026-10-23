// Cosmos: o papel de parede do Pedro no Lively Wallpaper.
// Espaço escuro e infinito (nebulosa no roxo da RYZE, estrelas vindo na direção da tela, estrela cadente
// dourada) com capas de álbum soltas: poucas, pequenas e espalhadas, cada uma com inclinação, balanço,
// entrada e saída próprias. O meio fica livre para o que passa: capas atravessando, capas vindo do fundo
// na direção da tela e o símbolo da RYZE girando como moeda.
// Coleção: capas/capas.js (mais ouvidos de sempre + recentes do Spotify, gerado por ferramentas/spotify.mjs;
// sem Spotify, a base de albuns.json), relida a cada 30 min. Música tocando: o Lively chama
// livelyCurrentTrack (--system-nowplaying); a capa aparece no centro com destaque dourado e entra na coleção.
// Teste fora do Lively: index.html#teste (faixa da coleção) ou #teste-novo (faixa de fora).
(() => {
  "use strict";

  // ---------- utilidades
  const aleatorio = (a, b) => a + Math.random() * (b - a);
  const sortear = (lista) => lista[Math.floor(Math.random() * lista.length)];
  const simples = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
    .replace(/\s*[([].*?[)\]]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
  const chaveDe = (artista, album) => `${simples(artista)}|${simples(album)}`;

  // ---------- coleção: capas/capas.js + as que chegaram pela música tocando
  const GUARDADAS = "cosmos.capas-aprendidas";
  const lerGuardadas = () => { try { return JSON.parse(localStorage.getItem(GUARDADAS)) || []; } catch { return []; } };
  const gravarGuardadas = (l) => { try { localStorage.setItem(GUARDADAS, JSON.stringify(l.slice(-400))); } catch { /* sem armazenamento: vale só nesta sessão */ } };

  let colecao = new Map();
  const juntar = (mapa, artista, album, src, forma = "capa") => {
    const chave = forma === "artista" ? `artista|${simples(artista)}` : chaveDe(artista, album);
    if (!mapa.has(chave)) mapa.set(chave, { chave, artista, album, src, forma });
    return mapa.get(chave);
  };
  // giram sempre os fixos que o Pedro escolheu (albuns.json, as 7 bandas) + os mais ouvidos e recentes
  // do Spotify + os que chegaram pela música tocando
  function montarColecao() {
    const nova = new Map();
    for (const c of [...(window.CAPAS || []), ...(window.CAPAS_SPOTIFY || [])]) juntar(nova, c.artista, c.album, c.arquivo, c.tipo);
    for (const c of lerGuardadas()) juntar(nova, c.artista, c.album, c.src);
    if (nova.size) colecao = nova;
  }
  // a tarefa do Spotify regrava capas/spotify.js de tempos em tempos: relê sem reiniciar o fundo
  function recarregarColecao() {
    const s = document.createElement("script");
    s.src = `capas/spotify.js?t=${Date.now()}`;
    s.onload = () => { montarColecao(); s.remove(); };
    s.onerror = () => s.remove();
    document.head.appendChild(s);
  }
  montarColecao();
  setInterval(recarregarColecao, 30 * 60 * 1000);

  // ---------- música no ar: o Lively manda o espectro do som (--audio) ~60 vezes por segundo
  // grave/médio/volume suavizados; "batida" vai a 1 num pico de grave e decai a cada quadro
  const audio = { grave: 0, medio: 0, volume: 0, batida: 0, mediaGrave: 0, ultimaBatida: 0, ultimo: 0 };
  window.cosmosAudio = audio;
  window.livelyAudioListener = (espectro) => {
    if (!espectro || !espectro.length) return;
    const media = (a, b) => { let t = 0; for (let i = a; i < b; i++) t += espectro[i] || 0; return t / (b - a); };
    const g = media(0, 6), m = media(6, 40), v = media(0, espectro.length), agora = performance.now();
    audio.grave += (g - audio.grave) * 0.35;
    audio.medio += (m - audio.medio) * 0.35;
    audio.volume += (v - audio.volume) * 0.25;
    audio.mediaGrave = audio.mediaGrave * 0.97 + g * 0.03;
    if (g > audio.mediaGrave * 1.45 && g > 0.15 && agora - audio.ultimaBatida > 250) { audio.batida = 1; audio.ultimaBatida = agora; }
    audio.ultimo = agora;
  };
  function amortecerAudio(agora) {
    audio.batida *= 0.88;
    if (agora - audio.ultimo > 1500) { audio.grave *= 0.9; audio.medio *= 0.9; audio.volume *= 0.9; } // silêncio: volta ao calmo
    document.body.style.setProperty("--batida", audio.batida.toFixed(3));
    pulso.style.opacity = Math.min(0.9, audio.grave * 0.9 + audio.batida * 0.25).toFixed(3);
    fundo.style.transform = `scale(${(1 + audio.grave * 0.025).toFixed(4)})`;
  }

  // ---------- hora do dia: cada fase prefere paletas, tinge o céu e muda o ritmo
  const FASES = {
    madrugada: { paletas: [3, 0, 1], densidade: 0.7, cena: [480000, 720000] },
    manha: { paletas: [1, 3, 0], densidade: 1, cena: [240000, 420000] },
    tarde: { paletas: [4, 2, 0], densidade: 1, cena: [240000, 420000] },
    noite: { paletas: [0, 2, 1], densidade: 1, cena: [240000, 420000] },
  };
  const nomeDaFase = (h = new Date().getHours()) => (h < 6 ? "madrugada" : h < 12 ? "manha" : h < 18 ? "tarde" : "noite");
  let fase = FASES[nomeDaFase()];
  const tom = document.getElementById("tom"), pulso = document.getElementById("pulso");
  function acompanharHora() {
    const nome = (location.hash.match(/fase-(\w+)/) || [])[1] || nomeDaFase();
    if (tom.dataset.fase !== nome) {
      const trocou = Boolean(tom.dataset.fase);
      tom.dataset.fase = nome;
      fase = FASES[nome] || FASES.noite;
      if (trocou && !pausado) montarCena(); // virou a fase: o céu já acompanha
    }
  }

  // ---------- espaço
  const ceu = document.getElementById("estrelas");
  const ctx = ceu.getContext("2d");
  let W = 0, H = 0, escala = 1, estrelas = [], cadente = null, proximaCadente = 0, cometa = null, proximoCometa = 0, pausado = false;

  // ruído de valor com fBm: dá textura de filamento e falha, em vez de mancha redonda
  function criarRuido(semente) {
    let s = (semente >>> 0) || 1;
    const rnd = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
    const p = new Uint8Array(512), v = new Float32Array(256);
    for (let i = 0; i < 256; i++) { p[i] = i; v[i] = rnd(); }
    for (let i = 255; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [p[i], p[j]] = [p[j], p[i]]; }
    for (let i = 0; i < 256; i++) p[i + 256] = p[i];
    const suave = (t) => t * t * (3 - 2 * t);
    const ruido = (x, y) => {
      const xi = Math.floor(x), yi = Math.floor(y), u = suave(x - xi), w = suave(y - yi);
      const a = v[p[(xi & 255) + p[yi & 255]]], b = v[p[((xi + 1) & 255) + p[yi & 255]]];
      const c = v[p[(xi & 255) + p[(yi + 1) & 255]]], d = v[p[((xi + 1) & 255) + p[(yi + 1) & 255]]];
      return a + (b - a) * u + (c - a) * w + (a - b - c + d) * u * w;
    };
    return (x, y, oitavas = 5) => {
      let t = 0, amp = 0.5, f = 1;
      for (let i = 0; i < oitavas; i++) { t += ruido(x * f, y * f) * amp; f *= 2.03; amp *= 0.5; }
      return t / (1 - 0.5 ** oitavas);
    };
  }

  // cada camada tem a sua paleta; o dourado entra só nos veios mais densos
  const PALETAS = [
    [[24, 22, 88], [106, 40, 201], [168, 44, 128], [58, 20, 120]], // roxo e magenta
    [[12, 40, 92], [20, 96, 118], [76, 29, 149], [139, 92, 246]], // azul-petróleo e violeta
    [[40, 12, 60], [120, 30, 90], [200, 70, 90], [90, 40, 160]], // vinho e rosa
    [[10, 24, 60], [30, 60, 140], [70, 120, 200], [110, 70, 210]], // azul profundo
    [[30, 18, 50], [70, 40, 48], [128, 84, 52], [80, 40, 140]], // poeira âmbar (contida: dourado forte vira fumaça)
  ];
  function pintarNebulosa(semente, paleta) {
    const S = 560;
    const c = document.createElement("canvas");
    c.width = c.height = S;
    const g = c.getContext("2d");
    const img = g.createImageData(S, S), px = img.data;
    const forma = criarRuido(semente), tom = criarRuido(semente + 7), vazio = criarRuido(semente + 13);
    const k = 3.2 / S, ox = (semente % 97) * 1.7, oy = (semente % 89) * 2.3;
    for (let y = 0; y < S; y++) {
      for (let x = 0; x < S; x++) {
        const dx = x / S - 0.5, dy = y / S - 0.5, r = Math.sqrt(dx * dx + dy * dy) * 2;
        if (r >= 1) continue; // a camada gira: fora do círculo nunca aparece inteira
        const nx = x * k + ox, ny = y * k + oy;
        const fil = 1 - Math.abs(forma(nx * 1.9 + 5, ny * 1.9 - 3, 4) * 2 - 1); // filamentos (ruído "em crista")
        let dens = Math.max(0, (forma(nx, ny) - 0.38) / 0.36) * (0.35 + 0.65 * fil * fil);
        dens *= Math.min(1, Math.max(0, (vazio(nx * 0.8 - 9, ny * 0.8 + 4, 3) - 0.32) / 0.25)); // falhas escuras
        dens *= 1 - r * r;
        if (dens <= 0.01) continue;
        const h = Math.min(0.999, Math.max(0, (tom(nx * 0.6, ny * 0.6, 3) - 0.25) / 0.5)) * (paleta.length - 1);
        const i0 = Math.floor(h), t = h - i0, c0 = paleta[i0], c1 = paleta[Math.min(paleta.length - 1, i0 + 1)];
        let R = c0[0] + (c1[0] - c0[0]) * t, G = c0[1] + (c1[1] - c0[1]) * t, B = c0[2] + (c1[2] - c0[2]) * t;
        const ouro = Math.max(0, (fil - 0.88) / 0.12) * Math.max(0, (dens - 0.55) / 0.45) * 0.5;
        R += (255 - R) * ouro; G += (183 - G) * ouro; B -= B * ouro;
        const o = (y * S + x) * 4;
        px[o] = R; px[o + 1] = G; px[o + 2] = B; px[o + 3] = Math.min(255, dens * 235);
      }
    }
    g.putImageData(img, 0, 0);
    const c2 = document.createElement("canvas"); // desfoque leve para não serrilhar ao ampliar
    c2.width = c2.height = S;
    const g2 = c2.getContext("2d");
    g2.filter = "blur(1.5px)";
    g2.drawImage(c, 0, 0);
    return c2.toDataURL("image/png");
  }

  // ---------- astros de fundo: galáxias espirais, um planeta e estrelas brilhantes com raios
  function pintarGalaxia(cor) {
    const S = 256, c = document.createElement("canvas");
    c.width = c.height = S;
    const g = c.getContext("2d");
    g.translate(S / 2, S / 2);
    g.globalCompositeOperation = "lighter";
    const bracos = Math.random() < 0.4 ? 3 : 2;
    for (let b = 0; b < bracos; b++) {
      for (let i = 0; i < 900; i++) {
        const t = Math.random() ** 0.8;
        const ang = t * Math.PI * 3.2 + (b * 2 * Math.PI) / bracos + aleatorio(-0.4, 0.4) * (1 - t * 0.5);
        const r = t * S * 0.46 + aleatorio(-5, 5);
        g.fillStyle = `rgba(${t < 0.22 ? "255,238,214" : cor},${(1 - t) * 0.45 + 0.06})`;
        g.beginPath();
        g.arc(Math.cos(ang) * r, Math.sin(ang) * r, aleatorio(0.4, 1.5), 0, Math.PI * 2);
        g.fill();
      }
    }
    const nucleo = g.createRadialGradient(0, 0, 0, 0, 0, S * 0.16);
    nucleo.addColorStop(0, "rgba(255,246,230,.9)");
    nucleo.addColorStop(0.4, `rgba(${cor},.35)`);
    nucleo.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = nucleo;
    g.fillRect(-S / 2, -S / 2, S, S);
    return c.toDataURL("image/png");
  }

  // planeta: gigante gasoso com faixas turbulentas (ruído), luz de esfera (Lambert) com terminador suave,
  // atmosfera na borda iluminada e anel com faixas e falhas. Cor e anel sorteados a cada início.
  const PLANETAS = [
    { nome: "violeta", tons: [[34, 16, 74], [106, 40, 201], [196, 170, 255]], atmos: [170, 140, 255] },
    { nome: "petroleo", tons: [[8, 34, 42], [36, 120, 136], [170, 230, 236]], atmos: [130, 220, 235] },
    { nome: "ambar", tons: [[58, 32, 8], [190, 128, 44], [255, 222, 160]], atmos: [255, 200, 120] },
  ];
  function pintarPlaneta(variante = sortear(PLANETAS), temAnel = Math.random() < 0.7) {
    const S = 520, R = S * 0.22, cx = S / 2, cy = S / 2;
    const c = document.createElement("canvas");
    c.width = c.height = S;
    const g = c.getContext("2d");
    const inclin = aleatorio(-0.4, 0.4), sen = Math.sin(inclin), cos = Math.cos(inclin);
    const ruido = criarRuido(Math.floor(Math.random() * 1e6));
    const luz = [aleatorio(0.25, 0.75) * (Math.random() < 0.5 ? -1 : 1), aleatorio(-0.6, 0.25), aleatorio(0.35, 0.75)], nl = Math.hypot(...luz);
    const L = luz.map((v) => v / nl);

    const anel = (frente) => {
      // anel = muitas elipses finas com opacidade vinda de ruído (faixas e falhas)
      g.save();
      g.translate(cx, cy);
      g.rotate(inclin);
      for (let i = 0; i < 70; i++) {
        const t = i / 69, rx = R * (1.45 + t * 0.95);
        const a = Math.max(0, ruido(t * 9, 3.3, 3) - 0.35) * 0.9 * (1 - Math.abs(t - 0.45) * 0.9);
        if (a < 0.02) continue;
        g.beginPath();
        g.ellipse(0, 0, rx, rx * 0.24, 0, frente ? 0 : Math.PI, frente ? Math.PI : Math.PI * 2);
        const [r, gg, b] = variante.tons[2];
        g.strokeStyle = `rgba(${Math.round((r + 255) / 2)},${Math.round((gg + 230) / 2)},${Math.round((b + 200) / 2)},${a * (frente ? 0.8 : 0.5)})`;
        g.lineWidth = R * 0.02;
        g.stroke();
      }
      g.restore();
    };

    if (temAnel) anel(false);
    // corpo, pixel a pixel
    const img = g.getImageData(0, 0, S, S), px = img.data;
    const [t0, t1, t2] = variante.tons;
    for (let y = Math.floor(cy - R); y <= cy + R; y++) {
      for (let x = Math.floor(cx - R); x <= cx + R; x++) {
        const dx = (x - cx) / R, dy = (y - cy) / R, d2 = dx * dx + dy * dy;
        if (d2 > 1) continue;
        const nz = Math.sqrt(1 - d2);
        const lat = dx * sen + dy * cos; // faixas paralelas ao equador inclinado
        const lon = dx * cos - dy * sen;
        const turb = ruido(lon * 2.2 + 11, lat * 6, 4) * 0.55;
        const v = (Math.sin((lat * 7.5 + turb * 3.2) * Math.PI) + 1) / 2 * 0.65 + ruido(lon * 5, lat * 14, 3) * 0.35;
        const cor = v < 0.5 ? t0.map((c0, k) => c0 + (t1[k] - c0) * (v / 0.5)) : t1.map((c1, k) => c1 + (t2[k] - c1) * ((v - 0.5) / 0.5));
        const lambert = Math.max(0, dx * L[0] + dy * L[1] + nz * L[2]);
        const brilho = 0.04 + 0.96 * Math.pow(lambert, 0.85) * (0.75 + 0.25 * nz); // escurece na borda
        const o = (y * S + x) * 4;
        const borda = Math.min(1, (1 - Math.sqrt(d2)) * R * 0.7); // antisserrilhado da borda
        const fundo = px[o + 3] / 255; // o anel de trás pode estar por baixo
        for (let k = 0; k < 3; k++) px[o + k] = cor[k] * brilho * borda + px[o + k] * (1 - borda) * fundo;
        px[o + 3] = Math.max(px[o + 3], 255 * borda);
      }
    }
    g.putImageData(img, 0, 0);
    // atmosfera: brilho fino só do lado iluminado
    const atm = g.createRadialGradient(cx, cy, R * 0.92, cx, cy, R * 1.12);
    const [ar, ag, ab] = variante.atmos;
    atm.addColorStop(0, `rgba(${ar},${ag},${ab},0)`);
    atm.addColorStop(0.35, `rgba(${ar},${ag},${ab},.35)`);
    atm.addColorStop(1, `rgba(${ar},${ag},${ab},0)`);
    g.save();
    g.globalCompositeOperation = "lighter";
    const lado = g.createLinearGradient(cx + L[0] * R, cy + L[1] * R, cx - L[0] * R, cy - L[1] * R);
    lado.addColorStop(0, "rgba(0,0,0,1)");
    lado.addColorStop(0.6, "rgba(0,0,0,0)");
    const mascara = document.createElement("canvas");
    mascara.width = mascara.height = S;
    const gm = mascara.getContext("2d");
    gm.fillStyle = atm;
    gm.fillRect(0, 0, S, S);
    gm.globalCompositeOperation = "destination-in";
    gm.fillStyle = lado;
    gm.fillRect(0, 0, S, S);
    g.drawImage(mascara, 0, 0);
    g.restore();
    if (temAnel) anel(true);
    return c.toDataURL("image/png");
  }
  if (location.hash === "#planetas") window.cosmosPlanetas = () => PLANETAS.flatMap((p) => [pintarPlaneta(p, true), pintarPlaneta(p, false)]);

  // ---------- cenas: cada uma é um céu completo (duas nebulosas, estrelas distantes, planeta, galáxias e
  // estrelas brilhantes). A cada 4 a 7 min uma cena nova aparece enquanto a anterior se desfaz (~45 s).
  const fundo = document.getElementById("fundo");
  let planeta = null, cenaAtual = null; // planeta = { x, y, r }: as capas não nascem em cima dele
  const livreNoFundo = (x, y, raio) => !(x - raio < 150 && y - raio < H * 0.55) // canto dos ícones
    && ((x - W / 2) / (W * 0.25)) ** 2 + ((y - H / 2) / (H * 0.3)) ** 2 >= 1; // meio livre

  function porAstro(container, classe, tam, x, y, estilo = {}) {
    const el = document.createElement("div");
    el.className = `astro ${classe}`;
    Object.assign(el.style, { left: `${x - tam / 2}px`, top: `${y - tam / 2}px`, width: `${tam}px`, height: `${tam}px` }, estilo);
    el.innerHTML = '<div class="corpo"></div>';
    container.appendChild(el);
    return el;
  }

  // estrela brilhante com raios: acende devagar, cintila no seu ritmo e um dia se apaga (renovarBrilhos)
  function novoBrilho(container, aceso = false) {
    for (let i = 0; i < 40; i++) {
      const tb = aleatorio(14, 30), x = aleatorio(tb, W - tb), y = aleatorio(tb, H - tb);
      if (!livreNoFundo(x, y, tb)) continue;
      const el = porAstro(container, "brilho-vida", tb, x, y);
      el.innerHTML = '<div class="brilho"><div class="corpo"></div></div>';
      const b = el.firstChild;
      b.style.setProperty("--t", `${tb}px`);
      b.style.setProperty("--cor", sortear(["#FFD666", "#FFB700", "#cfd8ff", "#ffffff", "#b9a4ff"]));
      b.style.setProperty("--dur", `${aleatorio(1.8, 4.5)}s`);
      if (aceso) el.classList.add("aceso");
      else requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add("aceso")));
      return el;
    }
    return null;
  }

  function montarAstros(container) {
    const ocupados = [];
    const lugar = (raio) => {
      for (let i = 0; i < 80; i++) {
        const x = aleatorio(raio, W - raio), y = aleatorio(raio, H - raio);
        if (!livreNoFundo(x, y, raio)) continue;
        if (ocupados.some((o) => Math.hypot(o.x - x, o.y - y) < o.r + raio + H * 0.05)) continue;
        ocupados.push({ x, y, r: raio });
        return { x, y };
      }
      return null;
    };
    let pl = null;
    // planeta: um por cena, de cor, anel e luz sorteados
    const tp = H * aleatorio(0.2, 0.28), lp = lugar(tp * 0.45);
    if (lp) {
      const el = porAstro(container, "planeta", tp, lp.x, lp.y, { opacity: aleatorio(0.75, 0.95) });
      pl = { x: lp.x, y: lp.y, r: tp * 0.48 };
      el.querySelector(".corpo").style.backgroundImage = `url(${pintarPlaneta()})`;
      el.style.setProperty("--dur", `${aleatorio(140, 220)}s`);
      el.style.setProperty("--dx", `${aleatorio(-40, 40)}px`);
      el.style.setProperty("--dy", `${aleatorio(-25, 25)}px`);
    }
    // galáxias distantes, deitadas em ângulos diferentes, girando devagar
    for (let i = 0; i < (W / H > 2 ? 3 : 2); i++) {
      const tg = H * aleatorio(0.08, 0.17), lg = lugar(tg * 0.5);
      if (!lg) continue;
      const el = porAstro(container, "galaxia", tg, lg.x, lg.y, { opacity: aleatorio(0.45, 0.75), transform: `rotate(${aleatorio(0, 180)}deg) scaleY(${aleatorio(0.35, 0.75)})` });
      el.querySelector(".corpo").style.backgroundImage = `url(${pintarGalaxia(sortear(["170,180,255", "200,150,255", "255,206,150"]))})`;
      el.querySelector(".corpo").style.setProperty("--giro", `${aleatorio(300, 600)}s`);
    }
    for (let i = 0; i < 7; i++) novoBrilho(container, true);
    return pl;
  }

  function montarCena(primeira = false) {
    const D = Math.ceil(Math.hypot(W, H)) + 40; // as camadas giram: precisam cobrir a diagonal
    const cena = document.createElement("div");
    cena.className = primeira ? "cena imediata" : "cena";
    const camada = (classe, url) => {
      const el = document.createElement("div");
      el.className = `camada ${classe}`;
      Object.assign(el.style, { width: `${D}px`, height: `${D}px`, backgroundImage: `url(${url})` });
      cena.appendChild(el);
    };
    const semente = Math.floor(Math.random() * 1e6);
    const preferidas = fase.paletas;
    const a = Math.random() < 0.6 ? preferidas[0] : sortear(preferidas);
    const b = sortear(preferidas.filter((i) => i !== a)); // duas paletas diferentes, as da fase do dia
    camada("nebulosa-a", pintarNebulosa(semente, PALETAS[a]));
    camada("nebulosa-b", pintarNebulosa(semente + 101, PALETAS[b]));
    camada("distantes", pintarDistantes(D));
    const astros = document.createElement("div");
    astros.className = "astros";
    cena.appendChild(astros);
    planeta = montarAstros(astros);
    fundo.appendChild(cena);
    const anterior = cenaAtual;
    cenaAtual = cena;
    requestAnimationFrame(() => requestAnimationFrame(() => cena.classList.add("visivel")));
    if (anterior) {
      anterior.classList.add("saindo");
      anterior.classList.remove("visivel");
      setTimeout(() => anterior.remove(), 60000);
    }
  }

  function trocarCena() {
    if (!pausado) montarCena();
    setTimeout(trocarCena, aleatorio(...fase.cena));
  }

  function renovarBrilhos() {
    if (!pausado && cenaAtual) {
      const container = cenaAtual.querySelector(".astros");
      const vivos = [...container.querySelectorAll(".brilho-vida.aceso")];
      if (vivos.length >= 5) { const v = sortear(vivos); v.classList.remove("aceso"); setTimeout(() => v.remove(), 8000); }
      novoBrilho(container);
    }
    setTimeout(renovarBrilhos, aleatorio(5000, 11000));
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
    estrelas = Array.from({ length: Math.round((W * H) / 5200) }, () => novaEstrela());
    proximaCadente = performance.now() + aleatorio(6000, 15000);
    proximoCometa = performance.now() + aleatorio(25000, 60000);
    fundo.textContent = "";
    cenaAtual = null;
    montarCena(true);
  }

  // estrelas vindo devagar na direção da tela: z cai de 1 a ~0,05 em quase um minuto
  const VELOCIDADE = 0.017;
  function desenharCeu(agora, dt) {
    const w = ceu.width, h = ceu.height, cx = w / 2, cy = h / 2, f = Math.max(w, h) * 0.5;
    ctx.clearRect(0, 0, w, h);
    for (const e of estrelas) {
      e.z -= VELOCIDADE * (1 + audio.volume * 3.5 + audio.batida * 1.5) * dt;
      const sx = cx + (e.x / e.z) * f, sy = cy + (e.y / e.z) * f;
      if (e.z < 0.05 || sx < -20 || sx > w + 20 || sy < -20 || sy > h + 20) { Object.assign(e, novaEstrela(1)); continue; }
      const perto = 1 - e.z;
      const raio = (0.3 + perto * perto * 2.4) * escala * (1 + audio.batida * 0.35);
      ctx.fillStyle = `rgba(${e.cor},${Math.min(1, perto * 1.5 * (1 + audio.grave * 0.8)) * e.brilho})`;
      ctx.beginPath();
      ctx.arc(sx, sy, raio, 0, Math.PI * 2);
      ctx.fill();
    }
    // cometa: raro e lento, cabeça branco-azulada e cauda longa apontando para trás
    if (!cometa && agora > proximoCometa) {
      const daEsquerda = Math.random() < 0.5, ang = aleatorio(0.08, 0.3);
      cometa = { x0: daEsquerda ? -0.1 * w : 1.1 * w, y0: aleatorio(0.1, 0.45) * h, ux: (daEsquerda ? 1 : -1) * Math.cos(ang), uy: Math.sin(ang),
        vida: 0, dur: aleatorio(16, 24), compr: aleatorio(260, 420) * escala };
    }
    if (cometa) {
      cometa.vida += dt;
      const p = cometa.vida / cometa.dur;
      if (p >= 1) { cometa = null; proximoCometa = agora + aleatorio(70000, 150000); }
      else {
        const andou = p * w * 1.3;
        const hx = cometa.x0 + cometa.ux * andou, hy = cometa.y0 + cometa.uy * andou;
        const tx = hx - cometa.ux * cometa.compr, ty = hy - cometa.uy * cometa.compr;
        const px = -cometa.uy, py = cometa.ux, larg = 5 * escala;
        const cauda = ctx.createLinearGradient(hx, hy, tx, ty);
        cauda.addColorStop(0, "rgba(220,235,255,.55)");
        cauda.addColorStop(0.3, "rgba(150,180,255,.18)");
        cauda.addColorStop(1, "rgba(120,90,220,0)");
        ctx.fillStyle = cauda;
        ctx.beginPath();
        ctx.moveTo(hx + px * larg, hy + py * larg);
        ctx.lineTo(tx + px * larg * 4, ty + py * larg * 4);
        ctx.lineTo(tx - px * larg * 4, ty - py * larg * 4);
        ctx.lineTo(hx - px * larg, hy - py * larg);
        ctx.closePath();
        ctx.fill();
        const cabeca = ctx.createRadialGradient(hx, hy, 0, hx, hy, 9 * escala);
        cabeca.addColorStop(0, "rgba(255,255,255,1)");
        cabeca.addColorStop(0.4, "rgba(190,215,255,.6)");
        cabeca.addColorStop(1, "rgba(150,180,255,0)");
        ctx.fillStyle = cabeca;
        ctx.beginPath(); ctx.arc(hx, hy, 9 * escala, 0, Math.PI * 2); ctx.fill();
      }
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

  // ---------- objetos soltos: capas e o símbolo da RYZE
  const espaco = document.getElementById("espaco");
  const painelTocando = document.getElementById("tocando");
  const objetos = new Set();
  const RYZE = { chave: "ryze", ryze: true };
  const PROPORCAO_RYZE = 520 / 400; // altura / largura do símbolo

  const ENTRADAS = [
    { nome: "profundidade", dur: 2800, quadros: (op) => [{ opacity: 0, transform: "scale(.2)", filter: "blur(10px)" }, { opacity: op, transform: "scale(1)", filter: "blur(0px)" }] },
    { nome: "giro-y", dur: 1900, quadros: (op) => [{ opacity: 0, transform: "rotateY(-110deg)" }, { opacity: op, transform: "rotateY(0deg)" }] },
    { nome: "giro-x", dur: 1900, quadros: (op) => [{ opacity: 0, transform: "rotateX(100deg)" }, { opacity: op, transform: "rotateX(0deg)" }] },
    { nome: "espiral", dur: 2400, quadros: (op) => [{ opacity: 0, transform: "rotate(-75deg) scale(.35)" }, { opacity: op, transform: "rotate(0deg) scale(1)" }] },
    { nome: "deriva", dur: 3200, quadros: (op) => { const a = aleatorio(0, Math.PI * 2); return [{ opacity: 0, transform: `translate(${Math.cos(a) * 70}px, ${Math.sin(a) * 70}px)` }, { opacity: op, transform: "translate(0, 0)" }]; } },
  ];
  const SAIDAS = [
    { dur: 3200, quadros: (op) => [{ opacity: op, transform: "scale(1)", filter: "blur(0px)" }, { opacity: 0, transform: "scale(.15)", filter: "blur(10px)" }] },
    { dur: 1800, quadros: (op) => [{ opacity: op, transform: "rotateY(0deg)" }, { opacity: 0, transform: "rotateY(110deg)" }] },
    { dur: 1800, quadros: (op) => [{ opacity: op, transform: "rotateX(0deg)" }, { opacity: 0, transform: "rotateX(-100deg)" }] },
    { dur: 2600, quadros: (op) => [{ opacity: op }, { opacity: 0 }] },
  ];
  // a RYZE tem filtro de brilho próprio: entra e sai sem desfoque
  const semDesfoque = (lista) => lista.filter((e) => !e.nome || e.nome !== "profundidade");

  function criar({ item, x, y, tam, z, tipo }) {
    const el = document.createElement("div");
    el.className = "objeto";
    const alto = item.ryze ? tam * PROPORCAO_RYZE : tam;
    el.style.width = `${tam}px`;
    el.style.height = `${alto}px`;
    el.style.zIndex = tipo === "destaque" ? 1000 : Math.round(z * 100);
    el.innerHTML = '<div class="balanco"><div class="carta"></div></div>';
    const carta = el.querySelector(".carta");
    if (item.ryze) carta.classList.add("ryze");
    else carta.style.backgroundImage = `url("${item.src}")`;
    if (item.forma === "artista") carta.classList.add("redonda");
    espaco.appendChild(el);
    const o = {
      el, balanco: el.querySelector(".balanco"), carta, item, tipo, x, y, z, tam, alto, esc: 1,
      vx: 0, vy: 0, desde: performance.now(), vida: aleatorio(28000, 55000), saindo: false,
      op: tipo === "destaque" ? 1 : 0.5 + 0.5 * z,
      inc: { rx: aleatorio(-14, 14), ry: aleatorio(-18, 18), rz: aleatorio(-9, 9) },
      bal: { amp: aleatorio(3, 9), freq: aleatorio(0.04, 0.11), fase: aleatorio(0, 6.3) },
      giro: item.ryze ? aleatorio(22, 38) * (Math.random() < 0.5 ? 1 : -1) : 0,
    };
    objetos.add(o);
    posicionar(o, performance.now());
    return o;
  }

  function entrar(o, entrada = sortear(o.item.ryze ? semDesfoque(ENTRADAS) : ENTRADAS)) {
    o.carta.animate(entrada.quadros(o.op), { duration: entrada.dur, easing: "cubic-bezier(.2,.7,.2,1)", fill: "forwards" });
  }

  function sair(o) {
    if (o.saindo) return;
    o.saindo = true;
    const s = sortear(o.item.ryze ? SAIDAS.slice(1) : SAIDAS);
    const a = o.carta.animate(s.quadros(o.op), { duration: s.dur, easing: "cubic-bezier(.5,0,.75,.4)", fill: "forwards" });
    a.onfinish = () => { o.el.remove(); objetos.delete(o); };
  }

  function posicionar(o, agora) {
    const t = (agora - o.desde) / 1000;
    o.el.style.transform = `translate3d(${o.x - o.tam / 2}px, ${o.y - o.alto / 2}px, 0) scale(${o.esc * (1 + audio.batida * 0.035)})`;
    const b = o.bal, onda = Math.sin(t * b.freq * 6.283 + b.fase) * b.amp;
    const ry = o.inc.ry + (o.giro ? t * o.giro : Math.cos(t * b.freq * 5.1 + b.fase) * b.amp);
    o.balanco.style.transform = `rotateX(${o.inc.rx + onda}deg) rotateY(${ry}deg) rotateZ(${o.inc.rz + onda * 0.3}deg)`;
  }

  // onde fica cada coisa: o canto de cima à esquerda é dos ícones, o meio é dos que passam e do destaque
  const naZonaDosIcones = (x, y, r) => x - r < 150 && y - r < H * 0.55;
  const noMeio = (x, y) => ((x - W / 2) / (W * 0.21)) ** 2 + ((y - H * 0.5) / (H * 0.27)) ** 2 < 1;
  function lugarLivre(tam) {
    const m = H * 0.04, folga = H * 0.08;
    for (let i = 0; i < 90; i++) {
      const x = aleatorio(m + tam / 2, W - m - tam / 2), y = aleatorio(m + tam / 2, H - m - tam / 2);
      if (naZonaDosIcones(x, y, tam / 2) || noMeio(x, y)) continue;
      if (planeta && Math.hypot(planeta.x - x, planeta.y - y) < planeta.r + tam / 2 + folga * 0.5) continue;
      let ok = true;
      for (const o of objetos) {
        if (o.tipo !== "fixo") continue;
        if (Math.hypot(o.x - x, o.y - y) < (o.tam * o.esc + tam) / 2 + folga) { ok = false; break; }
      }
      if (ok) return { x, y };
    }
    return null;
  }

  const visiveis = () => new Set([...objetos].filter((o) => !o.saindo).map((o) => o.item.chave));
  function proximaCapa() {
    const vis = visiveis();
    const fora = [...colecao.values()].filter((i) => !vis.has(i.chave));
    return sortear(fora.length ? fora : [...colecao.values()]);
  }

  // capas soltas: poucas (≈5 por altura de tela de largura) e de tamanhos variados pela profundidade
  const quantas = () => Math.max(4, Math.round(5.2 * (W / H) * fase.densidade));
  function semear() {
    if (!pausado) {
      const fixos = [...objetos].filter((o) => o.tipo === "fixo" && !o.saindo);
      if (fixos.length < quantas()) {
        const z = aleatorio(0.3, 1);
        const querRyze = !visiveis().has("ryze") && Math.random() < 0.08;
        const item = querRyze ? RYZE : proximaCapa();
        const tam = H * (querRyze ? 0.05 + 0.03 * z : 0.045 + 0.085 * z ** 1.5);
        const lugar = item && lugarLivre(tam * (querRyze ? PROPORCAO_RYZE : 1));
        if (lugar) {
          const o = criar({ item, x: lugar.x, y: lugar.y, tam, z, tipo: "fixo" });
          const ang = aleatorio(0, Math.PI * 2), v = 2 + 6 * z;
          o.vx = Math.cos(ang) * v; o.vy = Math.sin(ang) * v;
          entrar(o);
        }
      }
    }
    setTimeout(semear, aleatorio(1200, 3200));
  }

  // o que passa pelo meio: travessia de lado a lado, voo do fundo na direção da tela, e a RYZE girando
  function passar() {
    if (!pausado) {
      const passando = [...objetos].filter((o) => o.tipo === "passante").length;
      if (passando < 2) {
        const sorte = Math.random();
        if (sorte < 0.3 && !visiveis().has("ryze")) {
          const tam = H * aleatorio(0.07, 0.1), daEsquerda = Math.random() < 0.5;
          const o = criar({ item: RYZE, x: daEsquerda ? -tam : W + tam, y: H * aleatorio(0.32, 0.68), tam, z: 0.9, tipo: "passante" });
          o.vx = (daEsquerda ? 1 : -1) * (W + 2 * tam) / aleatorio(55, 80); o.vy = aleatorio(-4, 4);
          o.op = 1; o.carta.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 2500, fill: "forwards" });
        } else if (sorte < 0.65) {
          const item = proximaCapa();
          if (item) {
            const tam = H * aleatorio(0.08, 0.13), daEsquerda = Math.random() < 0.5;
            const o = criar({ item, x: daEsquerda ? -tam : W + tam, y: H * aleatorio(0.3, 0.7), tam, z: aleatorio(0.6, 0.95), tipo: "passante" });
            o.vx = (daEsquerda ? 1 : -1) * (W + 2 * tam) / aleatorio(60, 95); o.vy = aleatorio(-6, 6);
            o.inc.rz = aleatorio(-20, 20); o.giro = aleatorio(4, 9) * (Math.random() < 0.5 ? 1 : -1);
            o.carta.animate([{ opacity: 0 }, { opacity: o.op }], { duration: 2500, fill: "forwards" });
          }
        } else {
          // voo: nasce pequena perto do centro e vem na direção da tela, se afastando do meio
          const item = proximaCapa();
          if (item) {
            const tam = H * 0.14, ang = aleatorio(0, Math.PI * 2);
            const o = criar({ item, x: W / 2 + Math.cos(ang) * W * 0.03, y: H / 2 + Math.sin(ang) * H * 0.03, tam, z: 0.95, tipo: "passante" });
            o.voo = { ang, dur: aleatorio(22, 32) };
            o.esc = 0.05;
            o.carta.animate([{ opacity: 0 }, { opacity: 0.95, offset: 0.25 }, { opacity: 0.95, offset: 0.8 }, { opacity: 0 }], { duration: o.voo.dur * 1000, fill: "forwards" });
          }
        }
      }
    }
    setTimeout(passar, aleatorio(14000, 32000));
  }

  // as soltas derivam, mas não se encostam nem saem da tela: repulsão suave entre elas, desvio perto da
  // borda e do canto dos ícones, e velocidade de volta ao normal aos poucos
  function afastar(dt) {
    const fixos = [...objetos].filter((o) => o.tipo === "fixo");
    const folga = H * 0.06, borda = H * 0.03;
    for (let i = 0; i < fixos.length; i++) {
      const a = fixos[i];
      for (let j = i + 1; j < fixos.length; j++) {
        const b = fixos[j];
        const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1;
        const minimo = (a.tam + b.tam) / 2 + folga;
        if (d < minimo) {
          const f = ((minimo - d) / minimo) * 40 * dt;
          a.vx -= (dx / d) * f; a.vy -= (dy / d) * f;
          b.vx += (dx / d) * f; b.vy += (dy / d) * f;
        }
      }
      const r = Math.max(a.tam, a.alto) / 2;
      if (a.x - r < borda) a.vx += 30 * dt;
      if (a.x + r > W - borda) a.vx -= 30 * dt;
      if (a.y - r < borda) a.vy += 30 * dt;
      if (a.y + r > H - borda) a.vy -= 30 * dt;
      if (naZonaDosIcones(a.x, a.y, r)) { a.vx += 30 * dt; }
      const v = Math.hypot(a.vx, a.vy), alvo = 2 + 6 * a.z;
      if (v > alvo) { const k = 1 - Math.min(1, 0.5 * dt); a.vx *= k; a.vy *= k; }
    }
  }

  function moverObjetos(agora, dt) {
    afastar(dt);
    for (const o of objetos) {
      if (o.voo) {
        const p = (agora - o.desde) / 1000 / o.voo.dur;
        if (p >= 1) { o.el.remove(); objetos.delete(o); continue; }
        // perspectiva: o tamanho cresce como 1/distância, e o afastamento do centro acompanha
        const perto = 1 / (1 - 0.93 * p) - 1; // 0 → ~13
        o.esc = Math.min(1.6, 0.05 + perto * 0.12);
        o.x = W / 2 + Math.cos(o.voo.ang) * (W * 0.03 + perto * W * 0.05);
        o.y = H / 2 + Math.sin(o.voo.ang) * (H * 0.03 + perto * H * 0.05);
      } else {
        o.x += o.vx * dt; o.y += o.vy * dt;
      }
      if (o.tipo === "fixo" && !o.saindo && agora - o.desde > o.vida) sair(o);
      if (o.tipo === "passante" && !o.voo && (o.x < -o.tam * 2 || o.x > W + o.tam * 2)) { o.el.remove(); objetos.delete(o); continue; }
      posicionar(o, agora);
    }
  }

  // 30 quadros por segundo bastam para movimento lento e gastam metade da GPU
  let ultimo = 0, laco = 0;
  function quadro(agora) {
    laco = requestAnimationFrame(quadro);
    if (agora - ultimo < 1000 / 30) return;
    const dt = Math.min(0.1, (agora - ultimo) / 1000 || 0);
    ultimo = agora;
    amortecerAudio(agora);
    desenharCeu(agora, dt);
    moverObjetos(agora, dt);
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
        const nova = juntar(colecao, principal, achada.album.title, achada.album.cover_xl);
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

  // o destaque fica no centro, um pouco acima, com o nome da faixa logo abaixo
  let destaque = null, faixaAtual = null;
  function soltarDestaque() { if (destaque) { sair(destaque); destaque = null; } }
  function mostrarDestaque(item) {
    if (destaque && destaque.item.chave === item.chave) return;
    soltarDestaque();
    const tam = H * 0.2;
    destaque = criar({ item, x: W / 2, y: H * 0.45, tam, z: 1, tipo: "destaque" });
    destaque.inc = { rx: aleatorio(-6, 6), ry: aleatorio(-10, 10), rz: aleatorio(-3, 3) };
    destaque.bal.amp = 3;
    destaque.carta.classList.add("tocando");
    entrar(destaque, ENTRADAS[1]);
    painelTocando.style.top = `${H * 0.45 + tam / 2 + H * 0.04}px`;
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
    if (item && faixaAtual === id) mostrarDestaque(item);
  };

  // o Lively avisa quando pausa (jogo, tela cheia, bateria): para tudo, inclusive as camadas que giram
  window.livelyWallpaperPlaybackChanged = (dado) => {
    try { pausado = Boolean(JSON.parse(dado).IsPaused); } catch { pausado = false; }
    document.body.classList.toggle("pausado", pausado);
    for (const o of objetos) for (const a of o.carta.getAnimations()) pausado ? a.pause() : a.play();
    if (pausado) cancelAnimationFrame(laco);
    else { ultimo = performance.now(); laco = requestAnimationFrame(quadro); }
  };

  // ---------- início
  function montarTudo() {
    prepararEspaco();
    for (const o of objetos) o.el.remove();
    objetos.clear();
    if (destaque) { const item = destaque.item; destaque = null; mostrarDestaque(item); }
  }
  let redim = 0;
  addEventListener("resize", () => { clearTimeout(redim); redim = setTimeout(montarTudo, 300); });
  acompanharHora();
  montarTudo();
  laco = requestAnimationFrame(quadro);
  setInterval(acompanharHora, 60000);
  semear();
  setTimeout(passar, aleatorio(4000, 9000));
  setTimeout(trocarCena, aleatorio(240000, 420000));
  setTimeout(renovarBrilhos, 8000);

  if (location.hash === "#cenas") window.cosmosNovaCena = () => montarCena();
  if (location.hash === "#teste") setTimeout(() => window.livelyCurrentTrack(JSON.stringify({ Title: "Scar Tissue", Artist: "Red Hot Chili Peppers", AlbumTitle: "Californication" })), 1500);
  if (location.hash === "#teste-novo") setTimeout(() => window.livelyCurrentTrack(JSON.stringify({ Title: "Tempo Perdido", Artist: "Legião Urbana", AlbumTitle: "Dois" })), 1500);
})();
