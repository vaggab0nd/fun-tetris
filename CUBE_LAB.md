# 🧊 Cube Lab

Web pages for Rubik's cube speedsolving, built on [cubing.js](https://js.cubing.net/cubing/)
(the open-source library the World Cube Association uses for its own scrambles).

| Page | For |
|---|---|
| ⏱ [`rubiks.html`](rubiks.html) **Timer & Notation** | Timing solves like at a competition, and learning to read cube notation |
| 📚 [`algorithms.html`](algorithms.html) **Alg Trainer** | Learning last-layer algorithms (2-Look, OLL, PLL) and practising recognition |
| 📡 [`smartcube.html`](smartcube.html) **Smart Cube** | Bluetooth smart cubes (or a keyboard cube): automatic timing, CFOP splits, case recognition, replays |
| 🤖 [`solver.html`](solver.html) **Solver** | Scan a real cube with the camera (or paint it in) and get a ~20 move solution to follow |
| 🏆 [`trophies.html`](trophies.html) **Trophies** | XP, levels, achievements, world ranking against real WCA results, look up any competitor |

The home page (`index.html`) has a big button for each one, and every page shares the same menu at the top.

## Running it

Same as Tetris: open the file in a browser, run `python3 -m http.server 8000` and go to
`http://localhost:8000/rubiks.html`, or turn on GitHub Pages.

The 3D cube, pictures, official scrambles and the solver load cubing.js from `cdn.cubing.net`, so you need
an internet connection. Offline, the timer still works with simpler random-move scrambles and the
Alg Trainer still lists every algorithm; the pages show a notice when this happens.

---

## ⏱ Timer & Notation (`rubiks.html`)

### Timer tab

- **Events:** 3x3, 2x2, 4x4, Pyraminx, Skewb. Each event keeps its own list of solves.
- **Scrambles:** random-state scrambles, the same kind used at WCA competitions, with a 2D or 3D
  picture of what the puzzle should look like after scrambling.
- **Starting and stopping:**
  - Hold **Space** (or hold a finger on the timer) until the time turns **green**, then let go to start.
  - Press any key (or tap anywhere) to stop.
  - Let go before it turns green and nothing happens, so you can't start by accident.
- **15-second inspection** (on by default), like the WCA rules:
  - Press once to start inspection. The countdown is shown in yellow.
  - Starting after 15 seconds adds **+2** automatically; after 17 seconds it's a **DNF**.
  - **Esc** cancels inspection.
- **Stats:** solve count, mean, best single, current **ao5** and **ao12**, and best ao5.
  - Averages work like at competitions: drop the best and worst time, average the rest.
  - More than one DNF makes the average a DNF.
- **Each solve** has **+2**, **DNF** and **✕** (delete) buttons. Hover over a solve to see its scramble.
- Solves are saved in the browser (`localStorage`), so they're per device and per browser.

### Notation tab

- **Try the moves:** 18 buttons (R, R', R2, L, U, D, F, B...) turn a 3D cube, with a guide
  to what each letter means. Drag the cube to look at the back.
- **Name that move!** The cube does one move and you pick which one it was. *Easy* uses R, U and F
  only; *Hard* uses every face. The best streak is saved.
- **Algorithm playground:** type any algorithm (or tap Sexy move, Sune, T-Perm, Checkerboard) and
  watch it play. Challenge: how many times do you repeat `R U R' U'` to get back to solved? (Answer: 6.)

---

## 📚 Alg Trainer (`algorithms.html`)

The last layer of the CFOP method, from beginner to full.

| Tab | What's in it |
|---|---|
| 🌱 **2-Look** | The beginner route: 16 algorithms in 4 steps (cross → top colour → corners → edges), with tips for recognising each case |
| 🟡 **OLL (57)** | Every OLL case, grouped by the shape on top (Dot, Cross, T, P, Fish, Knight move...) |
| 🔄 **PLL (21)** | Every PLL case, grouped as edges only, corners only, adjacent swap, G perms and diagonal swap |
| 🎯 **Drill** | Recognition practice |

### Cards

- Every case card shows a picture of the case, its algorithm and a status badge.
- **Tap the badge** to cycle: *Not started* → *Learning* → *Learned ✓*.
  - A case has one status everywhere; for example, T-Perm in 2-Look and in PLL is the same card.
  - Progress bars at the top count learned cases for 2-Look, OLL and PLL.
  - The OLL and PLL tabs can be filtered by status.
- **Tap the card** to watch the algorithm on a 3D cube and to get a setup sequence for a real cube
  (start solved, do the setup moves, and you're looking at that case).
- In the pictures the top colour is **white** (the library's default colours). The cases are
  identical with yellow on top.

### Drill

1. Pick what to practise: cases you're learning, learning + learned, the 2-Look set, all OLL or all PLL.
2. A random case appears, from a random angle. There's also a setup sequence if you want it on
   your real cube.
3. Work out which case it is, then **Show answer** to see the name and algorithm and watch it solve.
   Moves in brackets, like `(U')`, are just top-layer turns to line the case up.
4. Mark **I knew it** or **Not yet** to keep score.

### Where the algorithms come from

The algorithms are common speedcubing choices (mostly right-handed, no cube rotations). Each one was
checked with the cubing.js cube simulator, which confirmed that:

- it keeps the first two layers and centres solved;
- each **OLL** solves the case with that number (all 57 matched an independent algorithm set);
- each **PLL** solves the case with that name. For the one-way cycles (A, G and U perms), which the
  reference set named the other way round, we used other well-known algorithms for the same cases
  to confirm the standard names.

The 2-Look recognition tips (where to hold the line and L shapes, headlights on the left for T-Perm,
solved bar at the back for Ua/Ub) were checked the same way.

### Changing an algorithm

Everyone has favourite algorithms. To swap one, edit `OLL_ALGS` or `PLL_ALGS` in `js/cube-algs.js`
(shared by the Alg Trainer and the Smart Cube page). The picture and animation are generated from the algorithm, so they
update automatically. Just make sure it solves the same case, or it will end up on the wrong card.

---

## 📡 Smart Cube (`smartcube.html`)

### Connecting

| Button | Works with |
|---|---|
| **Connect GAN cube** | GAN cubes (GAN356 i Carry / i Carry 2 / i3, GAN12 ui, GAN14 ui...), MoYu AI 2023, Monster Go 3Ai. Uses the [gan-web-bluetooth](https://github.com/afedotov/gan-web-bluetooth) library. |
| **Connect other smart cube** | GoCube, Rubik's Connected, Giiker, older GAN cubes. Uses cubing.js's Bluetooth support. |
| **Keyboard cube** (always on) | No smart cube needed. Turn the cube with csTimer's keys (I/K = R/R', J/F = U/U', H/G = F/F', D/E = L/L', S/L = D/D', W/O = B/B', ; A = y y', T B = x x', P Q = z z') or tap the buttons. |

- **Browsers:** Bluetooth only works in **Chrome or Edge** on a computer or Android. iPhone and iPad
  browsers don't allow Bluetooth.
- **Syncing:** a GAN cube reports what it looks like when it connects, so the screen matches even if
  it's scrambled. Other cubes assume they're solved when they connect. If the screen and your cube ever
  disagree, solve the cube and press **My cube is solved now**.
- **Mac address prompt:** some browsers can't read a GAN cube's address automatically. The page then
  asks for it; it's shown in the GAN app.

### A solve

1. Follow the scramble. Moves turn green as you do them. A wrong move shows **"Oops! Undo with: ..."**.
   Already scrambled some other way? Press **I scrambled it myself**.
2. When it's scrambled, the timer starts on your first turn and stops by itself when the cube is solved.
3. The page watches the cube during the solve and marks each CFOP step as it happens:
   - **Cross:** the first face to get a finished cross (any colour; colour-neutral cubers welcome).
   - **F2L:** the first two layers under that cross are done.
   - **OLL:** the last layer is all one colour on top.
   - **PLL:** solved.
4. You get time, moves and **TPS** (turns per second) for the whole solve and for each step, plus which
   **OLL and PLL case** you had (e.g. "OLL 27 · Sune", "T-Perm"), or **OLL skip! / PLL skip!** 🎉
5. **Replay** animates the whole solve and lists the moves step by step, like the solve reconstructions
   speedcubers post online. Tap any solve in the history to replay it.

## 🤖 Solver (`solver.html`)

- **📷 Scan with camera:** the page tells you which face to show and which colour goes on top, six times.
  - Colours are read by comparing each sticker with the centre stickers, then averaging each colour's
    stickers and matching again. That copes with coloured or uneven lighting (in tests with harsh fake
    lighting, about 94% of cubes were read perfectly; you can tap to fix the rest).
  - Cameras only work on `https://` pages or `localhost`.
- **🎨 Paint by hand:** tap stickers on the net to set colours.
- **🎲 Random cube:** try it without a cube.
- **Checks:** before solving it checks the cube is possible. It spots wrong colour counts, impossible
  pieces, a twisted corner, a flipped edge or two swapped pieces, and explains each one in plain words.
- **Solving:** uses **min2phase** (Chen Shuang's version of Kociemba's two-phase algorithm, via cubing.js).
  It usually finds 17-21 moves in well under a second.
- **Follow along:** step through the moves one at a time (buttons or ← →), with each move described in
  words ("Turn the right face counter-clockwise").
- **How does it work?** explains God's Number, the two-phase algorithm and pruning for kids.

## 🏆 Trophies (`trophies.html`)

- **Level and XP:** earned by timed solves, Smart Cube solves, algorithms learned, and achievements.
  Titles go from *Cube Rookie* to *Cube Legend*.
- **34 achievements:** Common, Rare, Epic and Legendary (Sub-30 Club, PLL Wizard, OLL skip, Jackpot for
  a full last-layer skip, and more). A pop-up appears on any page the moment one unlocks.
- **World ranking:** his best single and ao5 for each event compared with every official WCA competitor,
  e.g. "World rank about #80,954 of 281,083, faster than 71.2%". There's also a calculator for any
  time in 13 events.
- **Look up a cuber** by WCA ID (live): competitions, medals, records and personal bests with world ranks.
- **World Top 10** (live) for any event.

### Where the world data comes from

The World Cube Association publishes every official result. An open-source project,
[wca-rest-api](https://github.com/robiningelbrecht/wca-rest-api), turns that export into
JSON files and updates them daily.

- **Live parts** (look-up, top 10) read those files directly.
- **Ranking table** (`js/wca-ranks.js`): built on 2026-09-24 from a sample of about 43,000 competitors
  plus every event's top 1,000. Checked against real ranks, it's typically within 0.1%. To refresh it,
  re-run the same sampling (the build script lives outside this repo; ask Claude to regenerate it).

## Saved data

Everything is stored in the browser's `localStorage`. Nothing is sent anywhere.

| Key | What |
|---|---|
| `cubeLabSolves` | Timer solves, per event |
| `cubeLabBestStreak` | Best "Name that move!" streak |
| `cubeLabAlgStatus` | Not started / Learning / Learned for each case |
| `cubeLabSmartSolves` | Smart Cube solves (times, splits, cases, moves for replays) |
| `cubeLabFlags` | Whether the Solver / camera scan has been used (for achievements) |
| `cubeLabAchievementsSeen`, `cubeLabLevelSeen` | Which achievements and level have already had a pop-up |

Clearing site data or using a different browser/device starts fresh.

## Code layout

| File | What it does |
|---|---|
| `js/cube-engine.js` | A 54-sticker 3x3 simulator: moves (incl. slices, wide moves, rotations), CFOP step checks, OLL/PLL recognition, sticker → piece conversion for the solver. Tested against cubing.js on 300 random scrambles. |
| `js/cube-algs.js` | The OLL and PLL algorithms and groups |
| `js/cube-scan.js` | Camera colour reading |
| `js/progress.js` | XP, levels, achievements, world-rank lookups, achievement pop-ups |
| `js/wca-ranks.js` | The world ranking table |
| `js/nav.js` | The shared top menu |
| `css/site.css` | Shared styles for the newer pages |

## Ideas for next time

- F2L trainer (the 41 cases for pairing corners and edges)
- Charts of timer progress over weeks
- Gyroscope: newer GAN cubes report how they're being held, so the 3D cube could tilt along with the real one
- Smart-cube algorithm trainer: the Alg Trainer checks that you did the algorithm right, and how fast
- Competition info: how rounds and cutoffs work, links to find a local competition
- Choose your own algorithm for each case, saved per device
