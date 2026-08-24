Goblinville probe harness - rebuild kit (containers are disposable; GitHub is the archive)

Setup from a bare container:
  mkdir -p /tmp/gov21 && cd /tmp/gov21
  npm install puppeteer-core
  curl -sSL -o goblinville-harness.tar.gz 'https://raw.githubusercontent.com/orrimgames/orrimgames.github.io/main/_tools/goblinville-harness.tar.gz' && tar xzf goblinville-harness.tar.gz
  curl -sSL -o index-v104.html 'https://github.com/orrimgames/orrimgames.github.io/raw/v104/goblinville/index.html'   # swap the tag for any version; verify md5
  curl -sO 'https://orrimgames.github.io/goblinville/village-theme.mp3'
  curl -sO 'https://orrimgames.github.io/goblinville/vampire-theme.mp3'   # the game fetches both at runtime; without them every probe logs two phantom 404s
  (setsid nohup python3 -m http.server 8945 >/tmp/srv.log 2>&1 &)

Run (one browser at a time; probes take 90-180s and a bash call caps at 120s, so launch detached and poll a done file):
  FILE=index-vNN.html node chron.js m|d              # chronicle open/scroll/close at both viewports
  FILE=index-vNN.html node desk.js 1920 1080 TAG     # mouse+keys: pan, zoom, right-drag rotate, card, ghost, place, war map, first person
  node mobab.js index-vNN.html                       # true mobile, real touch taps: card tap + double-tap place
  FILE=index-vNN.html node persist.js d|m            # earn reversible milestones, break the conditions, save, reload, see what survived
  FILE=index-vNN.html node badgefast.js d|m            # badge latency: food over 300 for exactly two frames, then spent - did the badge fire
  FILE=index-vNN.html node chroncov.js d|m           # chronicle content: repetition suppressed, milestones recorded, survives reload
  FILE=index-vNN.html node chrontrim.js d|m           # 200 ordinary days past both caps: do the founding and milestones survive
  FILE=index-vNN.html node pillw.js m|d               # measured pill widths: share pill, countdown ring, no fixed-width overflow
  FILE=index-vNN.html node cards390.js m|d           # which build cards are reachable on screen, and does any ring point off-screen
  FILE=index-vNN.html node goalcard.js m|d           # the goal's build card: ring on it, edge pill when it is off the bar, tap scrolls to it
  node req.js '<url>'                                # list failed network requests

Known-good baseline against unmodified v99 (md5 3e6692586528b33844864342517497a1), errs [] everywhere:
  chron.js   empty card 150px tall at both widths; 42 seeded entries scroll 1858->0 mobile, 1112->0 desktop; close/reopen/close-corner all correct
  desk.js    place 3 -> 4, war map and back, FP enter/walk/exit
  mobab.js   ghost show/ok/armed, place 3 -> 4
  chroncov.js on v101: 6 huts -> 6 identical lines, 0 milestone lines; on v102: 6 huts -> 1 line, badges and goals recorded, 0 duplicates after reload
  badgefast.js on v99: badge missed (never fires); on v100: fires within 2 frames at both viewports
  persist.js badges brood8+day10+larder300, goalDone 1 and the quarry goal all survive food 400->5, pop 8->4, and a reload
  goalcard.js on v104 at 390: goal forced to GOLD MINE, pill at 297,696, tap scrolls barScroll 0 -> 243, card on screen, pill gone; at 1920 all ten cards fit so jump is null and only the ring draws
  cards390.js at 390: 4 of 10 cards on screen, barScrollMax 590 - this is why an objective may point at a card the player cannot see

Never use ?new=1 for persistence tests - it wipes the save. Re-goto the plain URL instead.
Head at the time of this kit: v104 (md5 c18ccf68dd7d751dce3780886573240f), tagged v104.
