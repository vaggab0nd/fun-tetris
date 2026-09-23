# 🧊 Cube Lab

Two web pages for Rubik's cube speedsolving, built on [cubing.js](https://js.cubing.net/cubing/)
(the open-source library the World Cube Association uses for its own scrambles).

| Page | For |
|---|---|
| ⏱ [`rubiks.html`](rubiks.html) **Timer & Notation** | Timing solves like at a competition, and learning to read cube notation |
| 📚 [`algorithms.html`](algorithms.html) **Alg Trainer** | Learning last-layer algorithms (2-Look, OLL, PLL) and practising recognition |

Both pages share a top menu, so you can jump between them (and back to Tetris).

## Running it

Same as Tetris: open the file in a browser, run `python3 -m http.server 8000` and go to
`http://localhost:8000/rubiks.html`, or turn on GitHub Pages.

The 3D cube, pictures and official scrambles load cubing.js from `cdn.cubing.net`, so you need
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

Everyone has favourite algorithms. To swap one, edit `OLL_ALGS` or `PLL_ALGS` near the top of the
script in `algorithms.html`. The picture and animation are generated from the algorithm, so they
update automatically. Just make sure it solves the same case, or it will end up on the wrong card.

---

## Saved data

Everything is stored in the browser's `localStorage`. Nothing is sent anywhere.

| Key | What |
|---|---|
| `cubeLabSolves` | Timer solves, per event |
| `cubeLabBestStreak` | Best "Name that move!" streak |
| `cubeLabAlgStatus` | Not started / Learning / Learned for each case |

Clearing site data or using a different browser/device starts fresh.

## Ideas for next time

- F2L trainer (the 41 cases for pairing corners and edges)
- Solver demo: scramble and watch a short solution (and learn about God's Number: every position
  can be solved in 20 moves or fewer)
- Charts of timer progress over weeks
- Competition info: WCA events, how rounds and cutoffs work, links to find a local competition
- Choose your own algorithm for each case, saved per device
