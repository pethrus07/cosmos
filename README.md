# Cosmos

Papel de parede animado do Pedro, rodando no [Lively Wallpaper](https://github.com/rocksdanister/lively).
Espaço escuro e infinito (nebulosa no roxo da RYZE, estrelas vindo na direção da tela, estrela cadente
dourada) com uma moldura de capas de álbum que viram uma de cada vez. Numa das viradas aparece o
símbolo da RYZE.

## Música tocando

O Lively passa para a página a faixa que o Windows vê tocando (Spotify incluso). A capa do álbum vira
em destaque, com borda dourada, e o nome da faixa aparece no vão. Álbum que não estava na coleção entra
nela para sempre, em 1000×1000 quando o Deezer acha (fica guardado no navegador do Lively).

## Pôr mais álbuns na base

1. Acrescente em `albuns.json` (artista e nome do álbum como aparece no Deezer).
2. `node ferramentas/baixar-capas.mjs`. Só baixa o que falta e regrava `capas/capas.js`.
3. Recarregue o fundo no Lively, ou espere o próximo início do Windows.

## Onde está ligado

- A pasta entra na biblioteca do Lively por junção:
  `%LOCALAPPDATA%\Lively Wallpaper\Library\wallpapers\cosmos` → esta pasta. Mudou aqui, mudou lá.
- Aplicado nas duas telas (notebook e LG). Pausa em jogo/tela cheia, na bateria e na economia de energia.
- Papel de parede comum e tela de bloqueio: `quadros/notebook.png`, gerado por
  `node ferramentas/quadro-estatico.mjs` (usa o Playwright do Hermes).

Teste no navegador: `index.html#teste` (faixa da coleção) e `index.html#teste-novo` (faixa de fora).
