// Matemática no Cosmos: o que passa pela cabeça do Pedro (empresa, música, espaço, dados, algoritmos)
// rodando no vazio, sempre discreto.
//  · fórmulas que se escrevem e se apagam sozinhas, soltas no espaço livre
//  · um atrator caótico (Lorenz, Aizawa, Thomas, Halvorsen) desenhando a trajetória ao vivo, girando em 3D
//  · de tempos em tempos, o símbolo da RYZE traçado por série de Fourier (epiciclos) no centro
// Independente do cosmos.js: lê o tamanho da tela e respeita a pausa (body.pausado) por conta própria.
(() => {
  "use strict";
  const camada = document.getElementById("matematica");
  const aleatorio = (a, b) => a + Math.random() * (b - a);
  const sortear = (l) => l[Math.floor(Math.random() * l.length)];
  const pausado = () => document.body.classList.contains("pausado");
  let W = innerWidth, H = innerHeight;
  addEventListener("resize", () => { W = innerWidth; H = innerHeight; });

  // espaço livre: fora do canto dos ícones, fora do meio (que é da música e do que passa) e longe da borda
  const livre = (x, y, l, a) => !(x < 150 + 20 && y < H * 0.55)
    && ((x + l / 2 - W / 2) / (W * 0.23)) ** 2 + ((y + a / 2 - H / 2) / (H * 0.29)) ** 2 >= 1
    && x > W * 0.02 && y > H * 0.03 && x + l < W * 0.98 && y + a < H * 0.97;

  // ---------- fórmulas
  const FORMULAS = [
    "<i>e</i><sup><i>iπ</i></sup> + 1 = 0",
    "<i>f̂</i>(<i>ξ</i>) = ∫ <i>f</i>(<i>x</i>) <i>e</i><sup>−2π<i>ixξ</i></sup> <i>dx</i>",
    "∫<sub>−∞</sub><sup>∞</sup> <i>e</i><sup>−<i>x</i>²</sup> <i>dx</i> = √π",
    "<i>P</i>(<i>A</i> | <i>B</i>) = <i>P</i>(<i>B</i> | <i>A</i>) <i>P</i>(<i>A</i>) ⁄ <i>P</i>(<i>B</i>)",
    "ζ(<i>s</i>) = Σ<sub><i>n</i>≥1</sub> <i>n</i><sup>−<i>s</i></sup> = Π<sub><i>p</i></sub> (1 − <i>p</i><sup>−<i>s</i></sup>)<sup>−1</sup>",
    "<i>z</i><sub><i>n</i>+1</sub> = <i>z</i><sub><i>n</i></sub>² + <i>c</i>",
    "<i>iħ</i> ∂<sub><i>t</i></sub>ψ = <i>Ĥ</i>ψ",
    "∇ × <b>B</b> = μ₀<b>J</b> + μ₀ε₀ ∂<sub><i>t</i></sub><b>E</b>",
    "<i>G</i><sub>μν</sub> + Λ<i>g</i><sub>μν</sub> = 8π<i>G</i> <i>T</i><sub>μν</sub> ⁄ <i>c</i>⁴",
    "ρ(∂<sub><i>t</i></sub><b>u</b> + <b>u</b>·∇<b>u</b>) = −∇<i>p</i> + μ∇²<b>u</b>",
    "θ ← θ − η ∇<sub>θ</sub> <i>J</i>(θ)",
    "softmax(<i>QK</i><sup>⊤</sup> ⁄ √<i>d<sub>k</sub></i>) <i>V</i>",
    "<i>H</i>(<i>X</i>) = −Σ <i>p</i>(<i>x</i>) log₂ <i>p</i>(<i>x</i>)",
    "<i>T</i>(<i>n</i>) = 2<i>T</i>(<i>n</i>⁄2) + <i>O</i>(<i>n</i>) ⇒ <i>O</i>(<i>n</i> log <i>n</i>)",
    "<i>V</i>(<i>s</i>) = max<sub><i>a</i></sub> [<i>R</i> + γ Σ <i>P</i>(<i>s′</i>|<i>s</i>,<i>a</i>) <i>V</i>(<i>s′</i>)]",
    "<i>f<sub>n</sub></i> = 440 · 2<sup>(<i>n</i>−49)⁄12</sup> Hz",
    "∂²<sub><i>t</i></sub><i>u</i> = <i>c</i>² ∇²<i>u</i>",
    "φ = (1 + √5) ⁄ 2  ·  <i>F<sub>n</sub></i> = <i>F</i><sub><i>n</i>−1</sub> + <i>F</i><sub><i>n</i>−2</sub>",
    "<i>d</i>[<i>v</i>] ← min(<i>d</i>[<i>v</i>], <i>d</i>[<i>u</i>] + <i>w</i>(<i>u</i>,<i>v</i>))",
    "<i>ẋ</i> = σ(<i>y</i> − <i>x</i>) · <i>ẏ</i> = <i>x</i>(ρ − <i>z</i>) − <i>y</i> · <i>ż</i> = <i>xy</i> − β<i>z</i>",
    "<i>X̄<sub>n</sub></i> ~ 𝒩(μ, σ² ⁄ <i>n</i>)",
    "Σ<sub><i>n</i>≥1</sub> 1 ⁄ <i>n</i>² = π² ⁄ 6",
    "<i>n</i>! ≈ √(2π<i>n</i>) (<i>n</i> ⁄ <i>e</i>)<sup><i>n</i></sup>",
    "∮ <i>f</i>(<i>z</i>) ⁄ (<i>z</i> − <i>a</i>) <i>dz</i> = 2π<i>i</i> <i>f</i>(<i>a</i>)",
    "<i>ŷ</i> = σ(<i>W</i>ₗ ⋯ σ(<i>W</i>₁<i>x</i> + <i>b</i>₁) ⋯ + <i>b</i>ₗ)",
    "<i>X</i>[<i>k</i>] = Σ<sub><i>n</i></sub> <i>x</i>[<i>n</i>] <i>e</i><sup>−2π<i>ikn</i>⁄<i>N</i></sup>",
  ];
  const vivas = new Set();
  const maxFormulas = () => (W / H > 2 ? 4 : 3);

  function novaFormula() {
    const usadas = new Set([...vivas].map((f) => f.dataset.i));
    const opcoes = FORMULAS.map((_, i) => i).filter((i) => !usadas.has(String(i)));
    const i = sortear(opcoes);
    const el = document.createElement("div");
    el.className = `formula${Math.random() < 0.3 ? " dourada" : ""}`;
    el.dataset.i = i;
    el.innerHTML = FORMULAS[i];
    el.style.fontSize = `${Math.round(H * aleatorio(0.017, 0.026))}px`;
    camada.appendChild(el);
    const l = el.offsetWidth, a = el.offsetHeight;
    let lugar = null;
    for (let k = 0; k < 60 && !lugar; k++) {
      const x = aleatorio(0, W - l), y = aleatorio(0, H - a);
      if (!livre(x, y, l, a)) continue;
      if ([...vivas].some((o) => Math.abs(o._x - x) < (o.offsetWidth + l) / 2 + 40 && Math.abs(o._y - y) < a * 3)) continue;
      lugar = { x, y };
    }
    if (!lugar) { el.remove(); return; }
    el._x = lugar.x; el._y = lugar.y;
    Object.assign(el.style, { left: `${lugar.x}px`, top: `${lugar.y}px` });
    Object.assign(el, { _dx: aleatorio(-30, 30), _dy: aleatorio(-14, 14), _per: aleatorio(80, 140), _f0: aleatorio(0, 6.28) });
    vivas.add(el);
    // escreve da esquerda para a direita, fica um tempo e se apaga
    el.animate([{ clipPath: "inset(0 100% 0 0)", opacity: 0 }, { clipPath: "inset(0 0% 0 0)", opacity: 1 }], { duration: 3200, easing: "ease-out", fill: "forwards" });
    setTimeout(() => {
      const s = el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 4000, fill: "forwards" });
      s.onfinish = () => { el.remove(); vivas.delete(el); };
    }, aleatorio(30000, 60000));
  }

  function cicloFormulas() {
    if (!pausado() && vivas.size < maxFormulas()) novaFormula();
    setTimeout(cicloFormulas, aleatorio(7000, 14000));
  }

  // ---------- atratores caóticos
  const ATRATORES = [
    { nome: "Lorenz", passo: 0.006, escala: 1 / 55, centro: [0, 0, 25], ini: [0.1, 0, 0],
      f: ([x, y, z]) => [10 * (y - x), x * (28 - z) - y, x * y - (8 / 3) * z] },
    { nome: "Aizawa", passo: 0.012, escala: 1 / 3.2, centro: [0, 0, 0.6], ini: [0.1, 0, 0],
      f: ([x, y, z]) => [(z - 0.7) * x - 3.5 * y, 3.5 * x + (z - 0.7) * y, 0.6 + 0.95 * z - z ** 3 / 3 - (x * x + y * y) * (1 + 0.25 * z) + 0.1 * z * x ** 3] },
    { nome: "Thomas", passo: 0.06, escala: 1 / 9, centro: [0, 0, 0], ini: [0.1, 0, 0],
      f: ([x, y, z]) => [Math.sin(y) - 0.208186 * x, Math.sin(z) - 0.208186 * y, Math.sin(x) - 0.208186 * z] },
    { nome: "Halvorsen", passo: 0.004, escala: 1 / 24, centro: [-3, -3, -3], ini: [-1.48, -1.51, 2.04],
      f: ([x, y, z]) => [-1.89 * x - 4 * y - 4 * z - y * y, -1.89 * y - 4 * z - 4 * x - z * z, -1.89 * z - 4 * x - 4 * y - x * x] },
  ];
  let atrator = null;

  function novoAtrator() {
    if (atrator) { const velho = atrator; velho.cv.style.opacity = "0"; setTimeout(() => velho.cv.remove(), 9000); }
    const tipo = sortear(ATRATORES.filter((a) => a !== atrator?.tipo));
    const tam = Math.round(H * aleatorio(0.26, 0.36));
    let lugar = null;
    for (let k = 0; k < 80 && !lugar; k++) {
      const x = aleatorio(0, W - tam), y = aleatorio(0, H - tam);
      if (livre(x, y, tam, tam)) lugar = { x, y };
    }
    if (!lugar) { atrator = null; return; }
    const escala = 1; // redesenhado a cada quadro: resolução de CSS
    const cv = document.createElement("canvas");
    cv.className = "atrator";
    cv.width = cv.height = Math.round(tam * escala);
    Object.assign(cv.style, { left: `${lugar.x}px`, top: `${lugar.y}px`, width: `${tam}px`, height: `${tam}px` });
    camada.appendChild(cv);
    requestAnimationFrame(() => requestAnimationFrame(() => { cv.style.opacity = "1"; }));
    // descarta o começo (transiente) para o desenho já nascer na forma do atrator
    let p = tipo.ini.slice();
    for (let i = 0; i < 400; i++) p = rk4(tipo, p);
    atrator = { tipo, cv, ctx: cv.getContext("2d"), p, rastro: [], giro: aleatorio(0, 6.28), velGiro: aleatorio(0.06, 0.12) * (Math.random() < 0.5 ? -1 : 1), incl: aleatorio(0.25, 0.6) };
  }

  function rk4(tipo, p) {
    const h = tipo.passo, f = tipo.f;
    const soma = (a, b, k) => a.map((v, i) => v + b[i] * k);
    const k1 = f(p), k2 = f(soma(p, k1, h / 2)), k3 = f(soma(p, k2, h / 2)), k4 = f(soma(p, k3, h));
    return p.map((v, i) => v + (h / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]));
  }

  function desenharAtrator(dt) {
    const a = atrator;
    if (!a) return;
    const passos = 4 + Math.round((window.cosmosAudio?.volume || 0) * 16); // a música acelera o caos
    for (let i = 0; i < passos; i++) { a.p = rk4(a.tipo, a.p); a.rastro.push(a.p); }
    if (a.rastro.length > 2600) a.rastro.splice(0, a.rastro.length - 2600);
    a.giro += a.velGiro * dt;
    const { width: s } = a.cv, g = a.ctx, c = a.tipo.centro, e = a.tipo.escala * s * 0.5;
    const cg = Math.cos(a.giro), sg = Math.sin(a.giro), ci = Math.cos(a.incl), si = Math.sin(a.incl);
    g.clearRect(0, 0, s, s);
    g.lineWidth = Math.max(1, s / 420);
    g.lineJoin = "round";
    const n = a.rastro.length, bloco = 130;
    for (let ini = 0; ini < n - 1; ini += bloco) {
      const t = ini / n; // mais velho = mais apagado; do roxo ao dourado conforme fica recente
      g.strokeStyle = `rgba(${Math.round(139 + (255 - 139) * t)},${Math.round(92 + (183 - 92) * t)},${Math.round(246 - 246 * t)},${0.08 + 0.5 * t})`;
      g.beginPath();
      for (let i = ini; i < Math.min(n, ini + bloco + 1); i++) {
        const [x0, y0, z0] = a.rastro[i];
        const x = x0 - c[0], y = y0 - c[1], z = z0 - c[2];
        const xr = x * cg - y * sg, yr = x * sg + y * cg; // gira em torno do eixo vertical (z)
        const px = s / 2 + xr * e, py = s / 2 - (z * ci - yr * si) * e;
        i === ini ? g.moveTo(px, py) : g.lineTo(px, py);
      }
      g.stroke();
    }
    const [hx, hy, hz] = a.rastro[n - 1]; // a cabeça da trajetória brilha
    const x = hx - c[0], y = hy - c[1], z = hz - c[2];
    const xr = x * cg - y * sg, yr = x * sg + y * cg;
    g.fillStyle = "rgba(255,226,150,.95)";
    g.beginPath(); g.arc(s / 2 + xr * e, s / 2 - (z * ci - yr * si) * e, g.lineWidth * 1.8, 0, Math.PI * 2); g.fill();
  }

  // ---------- RYZE por série de Fourier
  const RYZE = "M308.484 282.06L244.072 357.593H211L231.18 392H350.77L400 520H244.159L171.652 352.605L177.931 342.661L225 254.736L211.896 226.997L191.439 180.558L159.957 267.483L127.315 354.301L112.868 394.729H139.992L194.254 520H0L200 0L308.484 282.06Z";
  function pontosDoCaminho(d, n) {
    const v = [];
    let x = 0, y = 0;
    for (const [, cmd, args] of d.matchAll(/([MLHVZ])([^MLHVZ]*)/gi)) {
      const nums = args.trim().split(/[\s,]+/).filter(Boolean).map(Number);
      if (/[ML]/i.test(cmd)) { [x, y] = nums; v.push([x, y]); }
      else if (/H/i.test(cmd)) { x = nums[0]; v.push([x, y]); }
      else if (/V/i.test(cmd)) { y = nums[0]; v.push([x, y]); }
    }
    const seg = v.slice(1).map((p, i) => Math.hypot(p[0] - v[i][0], p[1] - v[i][1]));
    const total = seg.reduce((a, b) => a + b, 0);
    const pts = [];
    for (let k = 0; k < n; k++) { // reamostra com passo constante ao longo do contorno
      let alvo = (k / n) * total, i = 0;
      while (i < seg.length - 1 && alvo > seg[i]) { alvo -= seg[i]; i++; }
      const t = seg[i] ? alvo / seg[i] : 0;
      pts.push([v[i][0] + (v[i + 1][0] - v[i][0]) * t - 200, v[i][1] + (v[i + 1][1] - v[i][1]) * t - 260]);
    }
    return pts;
  }
  function dft(pts) {
    const N = pts.length, out = [];
    for (let k = 0; k < N; k++) {
      let re = 0, im = 0;
      for (let n = 0; n < N; n++) {
        const ang = (2 * Math.PI * k * n) / N, [x, y] = pts[n];
        re += x * Math.cos(ang) + y * Math.sin(ang);
        im += y * Math.cos(ang) - x * Math.sin(ang);
      }
      const freq = k <= N / 2 ? k : k - N;
      out.push({ freq, amp: Math.hypot(re, im) / N, fase: Math.atan2(im, re) });
    }
    return out.sort((a, b) => b.amp - a.amp);
  }
  const TERMOS = dft(pontosDoCaminho(RYZE, 320)).slice(0, 90);
  let fourier = null;

  function iniciarFourier() {
    if (fourier || pausado() || document.querySelector(".carta.tocando")) return; // o centro está com a música
    const tam = Math.round(H * 0.46), escala = 1;
    const cv = document.createElement("canvas");
    cv.className = "fourier";
    cv.width = cv.height = Math.round(tam * escala);
    Object.assign(cv.style, { left: `${(W - tam) / 2}px`, top: `${(H - tam) / 2}px`, width: `${tam}px`, height: `${tam}px` });
    camada.appendChild(cv);
    requestAnimationFrame(() => requestAnimationFrame(() => { cv.style.opacity = "1"; }));
    fourier = { cv, ctx: cv.getContext("2d"), t: 0, dur: 26, rastro: [], fim: false };
  }

  function desenharFourier(dt) {
    const f = fourier;
    if (!f) return;
    const s = f.cv.width, g = f.ctx, e = (s * 0.8) / 520;
    if (f.t < 1) f.t = Math.min(1, f.t + (dt / f.dur) * (1 + (window.cosmosAudio?.volume || 0) * 1.5));
    else if (!f.fim) {
      f.fim = true;
      setTimeout(() => { f.cv.style.opacity = "0"; setTimeout(() => { f.cv.remove(); if (fourier === f) fourier = null; }, 6000); }, 7000);
    }
    const ang = f.t * Math.PI * 2;
    g.clearRect(0, 0, s, s);
    let x = s / 2, y = s / 2;
    g.lineWidth = Math.max(1, s / 700);
    for (const termo of TERMOS) { // a corrente de círculos girando
      const r = termo.amp * e;
      if (!f.fim && r > 0.6) {
        g.strokeStyle = "rgba(200,190,255,.13)";
        g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.stroke();
      }
      const nx = x + r * Math.cos(termo.freq * ang + termo.fase), ny = y + r * Math.sin(termo.freq * ang + termo.fase);
      if (!f.fim && r > 0.6) { g.strokeStyle = "rgba(230,225,255,.28)"; g.beginPath(); g.moveTo(x, y); g.lineTo(nx, ny); g.stroke(); }
      x = nx; y = ny;
    }
    if (!f.fim) f.rastro.push([x, y]);
    g.strokeStyle = "rgba(255,183,0,.9)";
    g.lineWidth = Math.max(1.5, s / 260);
    g.shadowColor = "rgba(255,183,0,.6)";
    g.shadowBlur = 12;
    g.beginPath();
    f.rastro.forEach(([px, py], i) => (i ? g.lineTo(px, py) : g.moveTo(px, py)));
    if (f.fim) g.closePath();
    g.stroke();
    g.shadowBlur = 0;
  }

  function cicloFourier() {
    iniciarFourier();
    setTimeout(cicloFourier, aleatorio(180000, 360000));
  }

  // ---------- laço (30 quadros por segundo, parado quando o Lively pausa)
  let ultimo = performance.now();
  function quadro(agora) {
    requestAnimationFrame(quadro);
    if (agora - ultimo < 1000 / 24) return;
    const dt = Math.min(0.1, (agora - ultimo) / 1000);
    ultimo = agora;
    if (pausado()) return;
    for (const f of vivas) { // fórmulas derivam devagar, ida e volta (no laço, não em animação CSS)
      const s = Math.sin((agora / 1000 / f._per) * Math.PI * 2 + f._f0);
      f.style.transform = `translate(${(f._dx * s).toFixed(1)}px, ${(f._dy * s).toFixed(1)}px)`;
    }
    desenharAtrator(dt);
    desenharFourier(dt);
  }
  requestAnimationFrame(quadro);
  setTimeout(cicloFormulas, 3000);
  setTimeout(novoAtrator, 2000);
  setInterval(() => { if (!pausado()) novoAtrator(); }, 4 * 60 * 1000);
  setTimeout(cicloFourier, location.hash === "#fourier" ? 1000 : aleatorio(60000, 120000));
})();
