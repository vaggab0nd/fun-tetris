// The Skewb beginner method used by skewb.html, plus a coach that says what to do next.
// Pass in cubing.js's Skewb KPuzzle (from puzzles.skewb.kpuzzle()), so this file works in
// the browser and in Node.
//
// Moves use WCA notation, as in cubing.js (and so in the timer's scrambles). Each move turns
// the half of the Skewb around one corner, 120° clockwise when you look at that corner:
//   R = bottom-right-back corner, L = bottom-left-front, U = top-left-back, B = bottom-left-back.
//
// The method (with the white layer kept on top all the way through):
//   1. White layer: white centre + the 4 corners around it. Done by feel.
//   2. Bottom corners: they're already in the right places, they just need twisting.
//      Sledgehammer R' B R B', at most twice.
//   3. Centres: first the bottom centre (Bottom Swap), then the four side centres (Side Cycle).

export const ALGS = {
    sledge: { name: "Sledgehammer", alg: "R' B R B'" },
    bottom: { name: "Bottom Swap", alg: "R' B R B' L' U R U'" },
    sides: { name: "Side Cycle", alg: "R' L U L' U' B U B'" },
};

export const MOVES = ["R", "R'", "L", "L'", "U", "U'", "B", "B'"];
const TURNS = ["", "y", "y2", "y'"];

// cubing.js piece numbering. Corners: which faces each corner position touches, in the order
// of its 3 sticker slots. Slot 0 of every bottom corner is the bottom (D) face.
const CORNER_SLOTS = [
    ["U", "F", "L"], // 0 ULF
    ["U", "B", "R"], // 1 URB
    ["D", "F", "R"], // 2 DFR
    ["U", "R", "F"], // 3 UFR
    ["D", "L", "F"], // 4 DLF
    ["D", "R", "B"], // 5 DRB
    ["U", "L", "B"], // 6 UBL
    ["D", "B", "L"], // 7 DBL
];
const TOP = [0, 1, 3, 6];
const BOTTOM = [2, 4, 5, 7];
// Centres: position (and piece) i has the colour of face CENTRE_FACES[i].
const CENTRE_FACES = ["F", "R", "D", "U", "L", "B"];
const C = Object.fromEntries(CENTRE_FACES.map((f, i) => [f, i]));
const SIDES = ["F", "R", "B", "L"];
const FACE_WORDS = { F: "front", R: "right", B: "back", L: "left", U: "top", D: "bottom" };

export function createSkewbCoach(kpuzzle) {
    // ---------- A fast little model of the Skewb ----------
    // State: corner pieces + twists, and centre pieces (centre twist doesn't matter on a Skewb).
    const SOLVED = { cp: [0, 1, 2, 3, 4, 5, 6, 7], co: [0, 0, 0, 0, 0, 0, 0, 0], zp: [0, 1, 2, 3, 4, 5] };
    const cache = new Map();
    function trans(alg) {
        if (!cache.has(alg)) {
            const t = kpuzzle.algToTransformation(alg).transformationData;
            cache.set(alg, { cp: t.CORNERS.permutation, co: t.CORNERS.orientationDelta, zp: t.CENTERS.permutation });
        }
        return cache.get(alg);
    }
    const applyT = (s, t) => ({
        cp: t.cp.map((i) => s.cp[i]),
        co: t.cp.map((i, k) => (s.co[i] + t.co[k]) % 3),
        zp: t.zp.map((i) => s.zp[i]),
    });
    const apply = (s, alg) => (alg.trim() ? applyT(s, trans(alg)) : s);
    const fromAlg = (alg) => apply(SOLVED, alg);

    // ---------- Checks that work however the Skewb is turned in your hands ----------
    // Turning the whole Skewb (y) never changes whether it's solved, so try all four ways.
    const turned = (s) => TURNS.map((t) => apply(s, t));

    const whiteLayerDone = (s) => turned(s).some((q) =>
        q.zp[C.U] === C.U && TOP.every((i) => q.cp[i] === i && q.co[i] === 0));
    const cornersDone = (s) => whiteLayerDone(s) && BOTTOM.every((i) => s.co[i] === 0);
    // The colour that belongs on a side face, read from the (solved) bottom corner there.
    function faceColour(s, face) {
        const pos = BOTTOM.find((i) => CORNER_SLOTS[i].includes(face));
        const slot = CORNER_SLOTS[pos].indexOf(face);
        return CORNER_SLOTS[s.cp[pos]][slot];
    }
    const bottomCentreDone = (s) => cornersDone(s) && s.zp[C.D] === C.D;
    const matchingSides = (s) => SIDES.filter((f) => CENTRE_FACES[s.zp[C[f]]] === faceColour(s, f));
    const solved = (s) => bottomCentreDone(s) && matchingSides(s).length === 4;

    // Which way the bottom colour points on the bottom corner at a position.
    const bottomColourPoints = (s, pos) => CORNER_SLOTS[pos][s.co[pos]];
    const twistedCount = (s) => BOTTOM.filter((i) => s.co[i]).length;

    // Find the y turn that makes `test` true, or null.
    const findTurn = (s, test) => TURNS.find((t) => test(apply(s, t))) ?? null;

    // ---------- Step 1: shortest way to make the white layer ----------
    // Every position needs at most 7 moves (checked against all 3,149,280 positions).
    function whiteLayerSolution(s, maxDepth = 7) {
        const moveT = MOVES.map((m) => trans(m));
        const path = [];
        function search(state, depth, lastFamily) {
            if (depth === 0) return whiteLayerDone(state);
            for (let k = 0; k < MOVES.length; k++) {
                const family = MOVES[k][0];
                if (family === lastFamily) continue;
                path.push(MOVES[k]);
                if (search(applyT(state, moveT[k]), depth - 1, family)) return true;
                path.pop();
            }
            return false;
        }
        for (let depth = 0; depth <= maxDepth; depth++) {
            if (search(s, depth, null)) return path.join(" ");
        }
        return null;
    }

    // ---------- The coach ----------
    // Returns { step, title, text, turn, alg } where `turn` is a y turn to do first (or "")
    // and `alg` is what to do next (moves or one of ALGS).
    function hint(s) {
        if (solved(s)) {
            return { step: 4, title: "Solved! 🎉", text: "Every face is one colour. Scramble it and go again!", turn: "", alg: "" };
        }
        if (!whiteLayerDone(s)) {
            return {
                step: 1,
                title: "Step 1: the white layer",
                text: "Make the top a white square, with the side colours of the 4 top corners matching each other.",
                turn: "", alg: "", solveWhiteLayer: true,
            };
        }
        if (!cornersDone(s)) {
            if (twistedCount(s) === 4) {
                const turn = findTurn(s, (q) => bottomColourPoints(q, 2) === "R" && bottomColourPoints(q, 5) === "R");
                return {
                    step: 2, title: "Step 2: twist the bottom corners",
                    text: "All 4 bottom corners are twisted. Find the side with TWO yellow stickers on its bottom corners and turn the Skewb so that side is on the right, then do the Sledgehammer.",
                    turn, alg: ALGS.sledge.alg,
                };
            }
            const turn = findTurn(s, (q) => bottomColourPoints(q, 2) === "F");
            return {
                step: 2, title: "Step 2: twist the bottom corners",
                text: "Two bottom corners are twisted. Turn the Skewb so a twisted one is at the bottom front-right with its yellow sticker facing you, then do the Sledgehammer.",
                turn, alg: ALGS.sledge.alg,
            };
        }
        if (!bottomCentreDone(s)) {
            const turn = findTurn(s, (q) => q.zp[C.F] === C.D);
            return {
                step: 3, title: "Step 3a: the bottom centre",
                text: "Turn the Skewb so the yellow centre is at the front, then do the Bottom Swap.",
                turn, alg: ALGS.bottom.alg,
            };
        }
        const matching = matchingSides(s);
        if (matching.length === 1) {
            const turn = findTurn(s, (q) => matchingSides(q).includes("F"));
            return {
                step: 3, title: "Step 3b: the side centres",
                text: `One side centre is right (the ${FACE_WORDS[matching[0]]}). Turn the Skewb so it's at the front, then do the Side Cycle. If it's not solved yet, do it once more.`,
                turn, alg: ALGS.sides.alg,
            };
        }
        return {
            step: 3, title: "Step 3b: the side centres",
            text: "No side centre is right yet. Do the Side Cycle once from any side. Then one centre will be right.",
            turn: "", alg: ALGS.sides.alg,
        };
    }

    return {
        SOLVED, apply, fromAlg, hint, whiteLayerSolution,
        whiteLayerDone, cornersDone, bottomCentreDone, solved,
    };
}
