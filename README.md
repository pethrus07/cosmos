# Cosmos

Papel de parede animado do Pedro, rodando no [Lively Wallpaper](https://github.com/rocksdanister/lively).
Espaço escuro e infinito (nebulosa no roxo da RYZE, estrelas vindo na direção da tela, estrela cadente
dourada). Capas de álbum soltas: poucas, pequenas e espalhadas, cada uma com inclinação, balanço, entrada
e saída próprias. O meio fica livre para o que passa: capas atravessando, capas vindo do fundo na direção
da tela e o símbolo da RYZE girando como moeda.

## De onde vêm as capas

- **Spotify (o normal):** álbuns das faixas mais ouvidas de sempre e das tocadas recentemente.
  `node ferramentas/spotify.mjs entrar <client_id>` uma vez; depois a tarefa agendada roda
  `node ferramentas/spotify.mjs atualizar`, que regrava `capas/spotify.js`. O fundo relê a cada 30 min.
  O token fica em `%LOCALAPPDATA%\cosmos\spotify.json`, fora daqui.
- **Base (sem Spotify):** `albuns.json` → `node ferramentas/baixar-capas.mjs` (Deezer, sem login).
- **Música tocando:** o Lively passa a faixa que o Windows vê tocando. A capa aparece no centro com
  borda dourada e o nome da faixa embaixo; álbum que não estava na coleção entra nela.

## Onde está ligado

- A pasta entra na biblioteca do Lively por junção:
  `%LOCALAPPDATA%\Lively Wallpaper\Library\wallpapers\cosmos` → esta pasta. Mudou aqui, recarregue o
  fundo no Lively.
- Aplicado nas duas telas (notebook e LG). Pausa em jogo/tela cheia, na bateria e na economia de energia.
- Papel de parede comum e tela de bloqueio: `quadros/notebook.png`, gerado por
  `node ferramentas/quadro-estatico.mjs` (usa o Playwright do Hermes).

Teste no navegador: `index.html#teste` (faixa da coleção) e `index.html#teste-novo` (faixa de fora).
