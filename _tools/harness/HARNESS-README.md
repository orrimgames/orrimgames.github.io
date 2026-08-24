Goblinville probe harness - rebuild kit (container is disposable; GitHub is the archive)

Setup from a bare container:
  mkdir -p /tmp/gov21 && cd /tmp/gov21
  npm install puppeteer-core
  curl -sSL -o index-v99.html 'https://orrimgames.github.io/goblinville/'      # verify md5 against the live ladder
  curl -sO 'https://orrimgames.github.io/goblinville/village-theme.mp3'
  curl -sO 'https://orrimgames.github.io/goblinville/vampire-theme.mp3'        # both are fetched at runtime; without them probes log two 404s
  (setsid nohup python3 -m http.server 8945 >/tmp/srv.log 2>&1 &)
  tar xzf goblinville-harness.tar.gz

Run (one browser at a time; probes take 90-180s, a bash call caps at 120s, so launch detached and poll a done file):
  FILE=index-vNN.html node chron.js m|d     # chronicle open/scroll/close, both viewports
  FILE=index-vNN.html node desk.js 1920 1080 TAG   # mouse+keys: pan, zoom, rotate, card, ghost, place, war map, FP
  node mobab.js index-vNN.html              # true-mobile real touch taps: card tap + double-tap place
  node req.js '<url>'                       # list failed network requests

Never use ?new=1 for persistence tests - it wipes the save.
