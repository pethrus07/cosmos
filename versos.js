// Versos no Cosmos: trechos curtos de poesia e literatura, na pegada da melancolia, que se escrevem devagar
// no espaço livre, ficam um tempo e se apagam. Um ou dois de cada vez, nunca disputando com a música.
// Só trechos curtos e famosos; os autores com obra protegida entram com uma linha só.
(() => {
  "use strict";
  const camada = document.getElementById("versos");
  const aleatorio = (a, b) => a + Math.random() * (b - a);
  const sortear = (l) => l[Math.floor(Math.random() * l.length)];
  const pausado = () => document.body.classList.contains("pausado");
  let W = innerWidth, H = innerHeight;
  addEventListener("resize", () => { W = innerWidth; H = innerHeight; });

  // [texto (linhas separadas por \n), autor, obra]
  const VERSOS = [
    ["Não sou nada.\nNunca serei nada.\nNão posso querer ser nada.\nÀ parte isso, tenho em mim todos os sonhos do mundo.", "Álvaro de Campos", "Tabacaria"],
    ["O poeta é um fingidor.\nFinge tão completamente\nQue chega a fingir que é dor\nA dor que deveras sente.", "Fernando Pessoa", "Autopsicografia"],
    ["Tudo vale a pena\nSe a alma não é pequena.", "Fernando Pessoa", "Mar Português"],
    ["Porque eu sou do tamanho do que vejo\nE não do tamanho da minha altura.", "Alberto Caeiro", "O Guardador de Rebanhos"],
    ["Viver é ser outro.", "Bernardo Soares", "Livro do Desassossego"],
    ["Navegar é preciso;\nviver não é preciso.", "Fernando Pessoa", ""],
    ["A beleza salvará o mundo.", "Dostoiévski", "O Idiota"],
    ["A dor e o sofrimento são sempre inevitáveis\npara uma grande inteligência e um coração profundo.", "Dostoiévski", "Crime e Castigo"],
    ["Não tive filhos, não transmiti a nenhuma criatura\no legado da nossa miséria.", "Machado de Assis", "Memórias Póstumas de Brás Cubas"],
    ["A mão que afaga é a mesma que apedreja.", "Augusto dos Anjos", "Versos Íntimos"],
    ["Ser poeta é ser mais alto, é ser maior\nDo que os homens!", "Florbela Espanca", "Ser Poeta"],
    ["Amor é fogo que arde sem se ver;\nÉ ferida que dói, e não se sente.", "Camões", ""],
    ["Se eu morresse amanhã, viria ao menos\nFechar meus olhos minha triste irmã.", "Álvares de Azevedo", "Se Eu Morresse Amanhã"],
    ["Um livro deve ser o machado\npara o mar congelado dentro de nós.", "Kafka", "carta a Oskar Pollak"],
    ["É preciso estar sempre embriagado.", "Baudelaire", "Embriagai-vos"],
    ["Tenha paciência com tudo\no que não está resolvido no seu coração.", "Rilke", "Cartas a um Jovem Poeta"],
    ["Quando você olha muito tempo para um abismo,\no abismo olha para você.", "Nietzsche", "Além do Bem e do Mal"],
    ["Somos feitos de poeira de estrelas.", "Carl Sagan", "Cosmos"],
    ["No meio do caminho tinha uma pedra.", "Drummond", ""],
    ["Eu canto porque o instante existe\ne a minha vida está completa.", "Cecília Meireles", "Motivo"],
    ["Que não seja imortal, posto que é chama,\nMas que seja infinito enquanto dure.", "Vinicius de Moraes", "Soneto de Fidelidade"],
  ];
  const vivos = new Set();

  // espaço livre: fora do canto dos ícones e do meio, e sem encostar noutro verso
  const livre = (x, y, l, a) => !(x < 170 && y < H * 0.55)
    && ((x + l / 2 - W / 2) / (W * 0.24)) ** 2 + ((y + a / 2 - H / 2) / (H * 0.3)) ** 2 >= 1
    && x > W * 0.03 && y > H * 0.04 && x + l < W * 0.97 && y + a < H * 0.96
    && ![...vivos].some((o) => x < o._x + o._l + 60 && x + l + 60 > o._x && y < o._y + o._a + 40 && y + a + 40 > o._y);

  function novoVerso() {
    const usados = new Set([...vivos].map((v) => v.dataset.i));
    const i = sortear(VERSOS.map((_, k) => k).filter((k) => !usados.has(String(k))));
    const [texto, autor, obra] = VERSOS[i];
    const el = document.createElement("figure");
    el.className = "verso";
    el.dataset.i = i;
    el.style.fontSize = `${Math.round(H * aleatorio(0.018, 0.023))}px`;
    const linhas = texto.split("\n");
    // cada palavra entra sozinha, em sequência: o verso se escreve devagar
    let n = 0;
    el.innerHTML = `<blockquote>${linhas.map((l) => l.split(" ").map((p) => `<span style="--n:${n++}">${p}</span>`).join(" ")).join("<br>")}</blockquote>`
      + `<figcaption style="--n:${n + 2}">${autor}${obra ? ` · ${obra}` : ""}</figcaption>`;
    camada.appendChild(el);
    const l = el.offsetWidth, a = el.offsetHeight;
    let lugar = null;
    for (let k = 0; k < 80 && !lugar; k++) {
      const x = aleatorio(0, W - l), y = aleatorio(0, H - a);
      if (livre(x, y, l, a)) lugar = { x, y };
    }
    if (!lugar) { el.remove(); return; }
    Object.assign(el, { _x: lugar.x, _y: lugar.y, _l: l, _a: a });
    Object.assign(el.style, { left: `${lugar.x}px`, top: `${lugar.y}px` });
    vivos.add(el);
    requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add("escrito")));
    // fica tempo bastante para ler com calma (proporcional ao tamanho) e se apaga devagar
    setTimeout(() => {
      el.classList.add("apagando");
      setTimeout(() => { el.remove(); vivos.delete(el); }, 6000);
    }, 25000 + n * 1800);
  }

  function ciclo() {
    if (!pausado() && vivos.size < (W / H > 2 ? 2 : 1)) novoVerso();
    setTimeout(ciclo, aleatorio(20000, 45000));
  }
  setTimeout(ciclo, location.hash.includes("versos") ? 500 : aleatorio(8000, 20000));
})();
