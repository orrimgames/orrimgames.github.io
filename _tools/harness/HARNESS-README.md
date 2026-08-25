Goblinville probe harness - rebuild kit (containers are disposable; GitHub is the archive)

Setup from a bare container:
  mkdir -p /tmp/gov21 && cd /tmp/gov21
  npm install puppeteer-core
  curl -sSL -o goblinville-harness.tar.gz 'https://raw.githubusercontent.com/orrimgames/orrimgames.github.io/main/_tools/goblinville-harness.tar.gz' && tar xzf goblinville-harness.tar.gz
  curl -sSL -o index-v110.html 'https://github.com/orrimgames/orrimgames.github.io/raw/v110/goblinville/index.html'   # swap the tag for any version; verify md5
  curl -sO 'https://orrimgames.github.io/goblinville/village-theme.mp3'
  curl -sO 'https://orrimgames.github.io/goblinville/vampire-theme.mp3'   # the game fetches both at runtime; without them every probe logs two phantom 404s
  for f in rig-ratkin.js rig-ironbeard.js rig-sporefolk.js rig-bonechoir.js; do curl -sO "https://orrimgames.github.io/goblinville/$f"; done   # foe battle rigs; without them battle probes log a phantom rig 404
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
  FILE=index-vNN.html node nudge.js m|d              # the bar teaches its own scrolling: one nudge per goal, never after the player scrolls
  FILE=index-vNN.html node stallchip.js m|d          # brood stall chip: null in tutorial, full at cap, hungry under 30 food, null when growing
  FILE=index-vNN.html node faithchip.js m|d          # faith chip: 4 chips fresh, 5 once a shrine stands or faith is held
  FILE=index-vNN.html node capchip.js m|d            # at-cap chip shows v/cap amber; a risen storehouse clears it
  FILE=index-vNN.html node mutechip.js m|d           # sound switch: tap toggles, survives a reload, toggles back
  FILE=index-vNN.html node battle.js m|d             # raid smoke, real taps: WORLD->SEND->dragonfire->rally->win->home->persist
  node req.js '<url>'                                # list failed network requests

Known-good baseline against unmodified v99 (md5 3e6692586528b33844864342517497a1), errs [] everywhere:
  chron.js   empty card 150px tall at both widths; 42 seeded entries scroll 1858->0 mobile, 1112->0 desktop; close/reopen/close-corner all correct
  desk.js    place 3 -> 4, war map and back, FP enter/walk/exit
  mobab.js   ghost show/ok/armed, place 3 -> 4
  chroncov.js on v101: 6 huts -> 6 identical lines, 0 milestone lines; on v102: 6 huts -> 1 line, badges and goals recorded, 0 duplicates after reload
  badgefast.js on v99: badge missed (never fires); on v100: fires within 2 frames at both viewports
  persist.js badges brood8+day10+larder300, goalDone 1 and the quarry goal all survive food 400->5, pop 8->4, and a reload
  goalcard.js on v104 at 390: goal forced to GOLD MINE, pill at 297,696, tap scrolls barScroll 0 -> 243, card on screen, pill gone; at 1920 all ten cards fit so jump is null and only the ring draws
  cards390.js at 390 (post-v109, 8 cards): 4 of 8 on screen, barScrollMax 398 - this is why an objective may point at a card the player cannot see
  faithchip.js on v107 at both widths: hidden fresh, flame chip with value the moment a risen shrine and faith exist, key flips without a res tick
  capchip.js  on v108 at both widths: food pinned at cap draws amber '400/400'; storehouse raises the cap and the chip goes plain
  mutechip.js on v110 at both widths: tap mutes (icon X), reload stays muted, tap restores
  battle.js   on v110 at both widths: deploy 10v9+2 towers, dragonfire 30->5 faith, rally consumed, win card, stash restores village, banner survives reload
  nudge.js   on v105 at 390: single ~26px arc ~1.3s after the goal arms, back to the exact resting scroll, nudged once per goal key, none after barLearned; null at 1920
  stallchip.js on v106 at both widths: null during tutorial, 'full - raise a hut' at cap, 'hungry - 30 food to breed' at 10 food, null when growing

Never use ?new=1 for persistence tests - it wipes the save. Re-goto the plain URL instead.
Head at the time of this kit: v110 (md5 c2436ec35b02f88e69f0a033557324b5).
