Goblinville probe harness - rebuild kit (containers are disposable; GitHub is the archive)

Setup from a bare container:
  mkdir -p /tmp/gov21 && cd /tmp/gov21
  npm install puppeteer-core
  curl -sSL -o goblinville-harness.tar.gz 'https://raw.githubusercontent.com/orrimgames/orrimgames.github.io/main/_tools/goblinville-harness.tar.gz' && tar xzf goblinville-harness.tar.gz
  curl -sSL -o index-v110.html 'https://github.com/orrimgames/orrimgames.github.io/raw/v110/goblinville/index.html'   # swap the tag for any version; verify md5
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
  FILE=index-vNN.html node nudge.js m|d              # the bar teaches its own scrolling: one nudge per goal, never after the player scrolls
  FILE=index-vNN.html node stallchip.js m|d          # brood stall chip: null in tutorial, full at cap, hungry under 30 food, null when growing
  FILE=index-vNN.html node faithchip.js m|d          # faith chip: 4 chips fresh, 5 once a shrine stands or faith is held
  FILE=index-vNN.html node capchip.js m|d            # at-cap chip shows v/cap amber; a risen storehouse clears it
  FILE=index-vNN.html node mutechip.js m|d           # sound switch: tap toggles, survives a reload, toggles back
  FILE=index-vNN.html node battle.js m|d             # raid smoke, real taps: WORLD->SEND->dragonfire->rally->win->home->persist
  node req.js '<url>'                                # list failed network requests
  FILE=index-vNN.html node victory.js m|d            # ending smoke: force all banners, dawn fireworks, ENDURES card taps, persist, no replay
  FILE=index-vNN.html node storechip.js m|d          # 2+ stockpiles at cap surfaces the storehouse; tutorial-quiet; clears when it stops mattering
  FILE=index-vNN.html node stallbanner.js m|d        # raid-stall guard: frozen fight fires 'going nowhere' once at 45s; normal raids never; re-arms on hp change
  node pacing.js                                 # day-1 audit brain: tutorial through goals, sim-stepped 0.05s, chunked
  node pacing2.js                                # war-economy audit: raid through day 3, real updateBattle substeps, 60s battle stall dumps state, dismisses result screens
  node pacing3.js                                # minimum-viable-raiding: two barracks, raid at 10 troops with fire+rally
  node pacing4.js                                # tier-2 probe: raid at full 16-troop cap with fire+rally
  node pacing5.js                                # tier-4 probe: three barracks, raid at full 24-troop cap
  node pacing6.js                                # tier-4 vs ogre: 24 troops, ogre force-bound (probe cheat: skips the 3-dawn bowl timeline)
  FILE=index-vNN.html node vanto.js m|d             # contract route: real-tap signing, 3 dawn trades to the Main, lapse on a hungry dawn, persist
  node battlerate.js                             # N isolated raids, real updateBattle: resolve rate and seconds-to-resolution
  node battlestuck.js                            # one isolated 5v9, state dump over time (precursor to pacing2's watchdog)
  FILE=index-vNN.html node intro.js m|d              # cold open plays, taps advance beats, SKIP lands clean, save returns skip the story
  FILE=index-vNN.html node autofin.js m|d            # how long the cold open actually takes headless, and does it land clean

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
  victory.js  on v110 at both widths: checkVictory fires, phase 0->tap->1->tap->done, share offered, ceremonyDone survives reload, no replay
  nudge.js   on v105 at 390: single ~26px arc ~1.3s after the goal arms, back to the exact resting scroll, nudged once per goal key, none after barLearned; null at 1920
  stallchip.js on v106 at both widths: null during tutorial, 'full - raise a hut' at cap, 'hungry - 30 food to breed' at 10 food, null when growing
  storechip.js on v111 at both widths: quiet during tutorial, surfaces at 2+ capped stockpiles, clears after a storehouse rises
  stallbanner.js on v112 at both widths: normal 5v9 resolves with 0 fires; frozen fight (atk 0, towers off) fires once at 45s; hp change re-arms
  pacing2.js on v111: raid resolves as a 15-20s loss (5v9 tier 1); the result screen waits for leaveBattle() - a harness that never dismisses it false-stalls the run (the Aug 25 'stalemate' was exactly this; battles have no in-game deadlock)
  war ladder on v112 (pacing2-6, day 0-3 sims): 5 troops no support 0/67 vs t1; 10+fire+rally wins t1, 0/47 vs t2; 16+fire+rally sweeps t1-t3 day 1, 0/28 vs t4; 24+fire+rally 0/21 vs t4; 24+bound ogre wins ALL four tiers 4/4 - the rescue clause is the tier-4 key, and it never bonds organically (3 bowls, 3 dawns, food-starved)
  vanto.js on v112 at 390: real-tap sign works; 20f->12g per dawn for 3 dawns then the trade STOPS and the Main's x1.5 carry takes over; hungry dawn lapses the contract; state survives reload

  treaty.js  on v112 at 390: real-tap Cold Peace - 2 banners -> WORLD -> karrow -> ACCEPT pill, treaty=true, legion pair (70hp/8atk) joins the next battle, 4g/dawn tithe, an unpaid tithe breaks the treaty instantly, state survives reload
  school.js  on v112 at 390: real-tap Vellumspire - shrine -> WORLD -> vellum -> SEND pill, gob leaves 7->6, dawn letters days 4-5, day-6 scholarReturn ('Thump the Scholar', job scholar, purple tint, +5 faith); catches the v112 save-whitelist scholar drop (fixed v113)
  pacing7.js on v112: treaty + 16 troops + fire + rally vs bonechoir 0/30 - the legion pair does not crack tier 4; probe cheats labeled in-file (pre-signed treaty, dawn tithe top-up)
  pacing.js, treaty.js, school.js all take FILE=<file> env to target any build (default historical)

  boat.js    on v113 at 390: real-tap WALK->FP, SAIL from a boardable shore ('THE SEA IS A ROAD'), held-stick sailing (RAF), COME ASHORE parks S.boat, boat survives reload, re-board works. NOTE: the first tap after any reload is the designed welcome-back gate ('GOBLINVILLE REMEMBERS YOU') - probes must retry or pre-tap
  ogre.js    on v113 at 390: real-tap LEAVE AN OFFERING x3 days (10f+5g each, one/day, day>=2) -> bound on the dawn after bowl 3 (earliest day 5); same-day and starved denies are clean; ogre state survives reload
  ogrebat.js on v113 at 390 (pre-bound cheat, labeled in-file): rescue fires on the first battle tick (2 troops, foes>=3x), 16 foes rout and despawn, 3 foe towers smashed, 2 survivors raze the hall -> WIN in 45 sim-s; never refires (identical second raid wiped in 11 sim-s)

Stepper rule: battles tick updateBattle(dt), the village ticks updateWorld(dt). A battle-mode updateWorld loop freezes combat and starves RAF (og2 read a frozen battle because of this).
  story.js   on v113 at 390: fresh-boot title -> real taps through all 4 beats -> finishStory; SKIP pill; hands-off auto-advance; save+reload -> no replay (welcome-back gate)
  hush.js    on v113 at 390: quest X hush (tut->max, elderHush persists, post-hush taps no-op) and the elder-returns rewind (tut=max + quests unmet + no hush -> boot tap rewinds tut to first unmet). NOTE: S.toast is not the toast field name - toast copy unread in this probe
  prod.js    on v113 at 390: farm/lumber/quarry/mine placed for real, pop completes, job manager assigns (3/3/2/1 of 9), chop/mine/dig states fire, wood +128 / stone +36 / gold +10 in 120 sim-s, stumps carry regrow, state survives reload. Farm loop is day-scale - covered indirectly by the pacing ladder
  fpbat.js   on v113 found the v114 bug: touch taps on the rail-left rally pill were swallowed (startTouch claims x<W*0.45 as the walk stick; only lk touches can become fpTaps). On v114: rallyOK assertion green - mv-side non-drag taps route through fpTap. Desktop mouse does NOT share the mv/lk split (fpdesk.js)
  fpdesk.js  desktop companion: v113 rally click already worked, v114 identical - regression guard
  fpbat.js's downed leg: chief hp forced low + parked in the foe pack (labeled cheat) -> 'dragged you home' -> iso, battle rages on

Never use ?new=1 for persistence tests - it wipes the save. Re-goto the plain URL instead.
Head at the time of this kit: v114 (md5 1c8d08e2292510c688b99960d398fbe7).
