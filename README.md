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
- **Música no ar:** com `--audio`, o Lively manda o espectro do som; as estrelas aceleram com o volume, o
  céu respira no grave, as capas e os brilhos pulsam na batida, o atrator e o Fourier correm mais rápido.
- **Hora do dia:** madrugada (azul profundo, mais vazio, céu troca a cada 8–12 min), manhã (frio e aberto),
  tarde (dourado), noite (roxo). Paletas preferidas e um tom por cima, trocado em 90 s.
- **O seu dia virando céu (`constelacoes.js`):** commits de hoje (branco-azulados), notas do Sinapse
  (violeta) e Hermes (enviada = ponto dourado, respondida = estrela com raios, aceita = estrela grande
  permanente e uma supernova na primeira vez). Sem texto e sem número. Coletor: `ferramentas/dados-do-dia.mjs`,
  tarefa `Cosmos-Dados` a cada 10 min.
- **Versos (`versos.js`):** trechos curtos de poesia e literatura (Pessoa e heterônimos, Dostoiévski,
  Machado, Augusto dos Anjos, Florbela, Camões, Kafka, Baudelaire, Rilke…) que se escrevem palavra por
  palavra, ficam e se apagam. Por cima das capas, porque são para ler.
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
`#planetas` (expõe `cosmosPlanetas()` com as variações de planeta). Ganchos combinam: `#versos,supernova,fase-tarde`.

## Roadmap

- **Modo leve na tela do notebook** (anotado em 23/10/2026; o Pedro não sente gargalo, então fica para
  quando precisar). Medido no XPS: o Cosmos usa ~48% da GPU Intel integrada, ~7% da CPU e ~1,5 GB, quase
  tudo vindo da tela do notebook (3456×2160); o Lively zera o consumo quando a tela está coberta por janela
  maximizada, em jogo/tela cheia e na bateria. A ideia: nessa tela, 15 quadros/s e menos capas, mantendo o
  LG igual (deve cair perto da metade). Alternativa: mandar o Lively para a NVIDIA (libera a Intel, mas
  acorda a placa dedicada e gasta mais energia, só na tomada).
