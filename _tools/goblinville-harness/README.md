Goblinville test harness (no secrets here).
Setup: npm install puppeteer-core in a scratch dir; google-chrome at /usr/bin/google-chrome.
Put the game at ~/goblin-build/index.html, then: node gvprobe.js ev_load.js [shot.png]
Eval files are async function bodies run in the page (S, PROPS, FP, fpTap etc. are globals).
Deploy: fetch+reset origin/main, copy build to goblinville/index.html, commit as orrimgames, push over SSH with a repo-scoped deploy key (key lives only in a 0600 file, never in this repo).
