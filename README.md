# Cosmos

Papel de parede animado do Pedro, rodando no [Lively Wallpaper](https://github.com/rocksdanister/lively).
O reflexo da cabeça dele: espaço e vazio, música, empresa, dados, matemática e algoritmos.

- **Céu em cenas:** cada cena tem duas nebulosas com textura de ruído (filamentos, falhas escuras, veios
  dourados), estrelas distantes, um planeta (cor, anel e luz sorteados), galáxias espirais e estrelas
  brilhantes que acendem e se apagam. A cada 4 a 7 min uma cena nova aparece enquanto a anterior se desfaz.
  Por cima: estrelas vindo na direção da tela, estrela cadente dourada e um cometa raro.
- **Música:** capas e fotos de artistas soltas, poucas e espalhadas, com entradas e giros variados; o meio
  fica para o que passa (capas atravessando, capas vindo do fundo, a RYZE girando como moeda) e para a
  música que está tocando, com borda dourada.
- **Matemática (`matematica.js`):** fórmulas que se escrevem e se apagam, um atrator caótico (Lorenz,
  Aizawa, Thomas, Halvorsen) desenhando a trajetória ao vivo, e o símbolo da RYZE traçado por série de
  Fourier no centro de tempos em tempos.

## De onde vêm as capas

Giram juntas, sem repetir:

- **Fixos:** os álbuns que o Pedro escolheu, em `albuns.json` → `node ferramentas/baixar-capas.mjs`
  (Deezer, sem login). Aparecem sempre, estejam ou não no Spotify.
- **Spotify:** álbuns das faixas mais ouvidas de sempre e das recentes, mais as fotos dos 20 artistas mais
  ouvidos. Conectar uma vez: `node ferramentas/conectar-spotify.mjs` (janela guiada; o Pedro entra na conta,
  aceita os termos e autoriza). A tarefa `Cosmos-Spotify` (`agendar/instalar-tarefa.ps1`) roda
  `node ferramentas/spotify.mjs atualizar` a cada 3 h; o fundo relê `capas/spotify.js` a cada 30 min.
  Token em `%LOCALAPPDATA%\cosmos\spotify.json`, fora daqui.
- **Música tocando:** o Lively passa a faixa que o Windows vê tocando; álbum novo entra na coleção.

## Onde está ligado

- A pasta entra na biblioteca do Lively por junção:
  `%LOCALAPPDATA%\Lively Wallpaper\Library\wallpapers\cosmos` → esta pasta. Mudou aqui, recarregue o
  fundo no Lively.
- Aplicado nas duas telas (notebook e LG). Pausa em jogo/tela cheia, na bateria e na economia de energia.
- Papel de parede comum e tela de bloqueio: `quadros/notebook.png`, gerado por
  `node ferramentas/quadro-estatico.mjs` (usa o Playwright do Hermes).

Testes no navegador: `index.html#teste` (faixa da coleção), `#teste-novo` (faixa de fora), `#cenas`
(expõe `cosmosNovaCena()` para forçar a troca de céu), `#fourier` (RYZE por Fourier logo de início),
`#planetas` (expõe `cosmosPlanetas()` com as variações de planeta).
