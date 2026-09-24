// A small 3x3 cube simulator that tracks all 54 stickers.
//
// Used by the Smart Cube page (to follow a real cube and split a solve into CFOP steps)
// and the Solver page (to turn a scanned cube into something the solver understands).
//
// Stickers are stored in the standard "facelet" order used by most cube software:
// U1..U9, R1..R9, F1..F9, D1..D9, L1..L9, B1..B9, each face read left-to-right, top-to-bottom.
// A sticker's colour is the letter of the face it belongs to when solved (U, R, F, D, L or B).

export const FACES = ["U", "R", "F", "D", "L", "B"];

// Outward direction of each face. x = right, y = up, z = front.
const NORMALS = {
    U: [0, 1, 0], D: [0, -1, 0],
    R: [1, 0, 0], L: [-1, 0, 0],
    F: [0, 0, 1], B: [0, 0, -1],
};

// Where sticker (row r, column c) of each face sits in space, reading the face in the standard way.
const FRAMES = {
    U: (r, c) => [c - 1, 1, r - 1],
    R: (r, c) => [1, 1 - r, 1 - c],
    F: (r, c) => [c - 1, 1 - r, 1],
    D: (r, c) => [c - 1, -1, 1 - r],
    L: (r, c) => [-1, 1 - r, c - 1],
    B: (r, c) => [1 - c, 1 - r, -1],
};

const SLOTS = [];
for (const face of FACES) {
    for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
            SLOTS.push({ face, pos: FRAMES[face](r, c), normal: NORMALS[face] });
        }
    }
}

const key = (pos, normal) => pos.join(",") + "|" + normal.join(",");
const SLOT_INDEX = new Map(SLOTS.map((s, i) => [key(s.pos, s.normal), i]));

// Rotate a vector by +90 degrees (right-hand rule) around an axis (0 = x, 1 = y, 2 = z).
function rot90(v, axis) {
    const [x, y, z] = v;
    if (axis === 0) return [x, -z, y];
    if (axis === 1) return [z, y, -x];
    return [-y, x, z];
}

// Every move is: an axis, which layers along that axis turn, and how many +90 degree turns.
// A face turned "clockwise" (looking at that face) is -90 degrees around its outward direction.
const BASE_MOVES = {
    R: [0, [1], -1], L: [0, [-1], 1], M: [0, [0], 1], x: [0, [-1, 0, 1], -1],
    U: [1, [1], -1], D: [1, [-1], 1], E: [1, [0], 1], y: [1, [-1, 0, 1], -1],
    F: [2, [1], -1], B: [2, [-1], 1], S: [2, [0], -1], z: [2, [-1, 0, 1], -1],
    r: [0, [1, 0], -1], l: [0, [-1, 0], 1],
    u: [1, [1, 0], -1], d: [1, [-1, 0], 1],
    f: [2, [1, 0], -1], b: [2, [-1, 0], 1],
};

function buildPermutation(axis, layers, quarters) {
    // perm[i] = slot that the sticker in slot i moves to.
    const turns = ((quarters % 4) + 4) % 4;
    return SLOTS.map((slot, i) => {
        if (!layers.includes(slot.pos[axis])) return i;
        let pos = slot.pos;
        let normal = slot.normal;
        for (let t = 0; t < turns; t++) {
            pos = rot90(pos, axis);
            normal = rot90(normal, axis);
        }
        return SLOT_INDEX.get(key(pos, normal));
    });
}

const MOVE_PATTERN = /^([RLUDFBMESxyzrludfb])(w?)(\d*)('?)$/;
const permCache = new Map();

// Parse one move like "R", "U'", "F2", "Rw", "r2'", "x".
export function parseMove(token) {
    const m = MOVE_PATTERN.exec(token);
    if (!m) throw new Error(`Unknown move "${token}"`);
    let [, family, wide, amount, prime] = m;
    if (wide) {
        if (!"RLUDFB".includes(family)) throw new Error(`Unknown move "${token}"`);
        family = family.toLowerCase();
    }
    const count = amount === "" ? 1 : Number(amount);
    return { family, amount: prime ? -count : count };
}

function permutationFor(token) {
    if (!permCache.has(token)) {
        const { family, amount } = parseMove(token);
        const [axis, layers, quarters] = BASE_MOVES[family];
        permCache.set(token, buildPermutation(axis, layers, quarters * amount));
    }
    return permCache.get(token);
}

// Split an algorithm string into moves. Supports simple groups like "(R U R' U')2".
export function splitAlg(alg) {
    const tokens = [];
    const re = /\(([^()]*)\)(\d*)('?)|(\S+)/g;
    let m;
    while ((m = re.exec(alg.trim()))) {
        if (m[4] !== undefined) {
            tokens.push(m[4]);
        } else {
            let inner = splitAlg(m[1]);
            if (m[3]) inner = invertMoves(inner);
            const times = m[2] === "" ? 1 : Number(m[2]);
            for (let i = 0; i < times; i++) tokens.push(...inner);
        }
    }
    tokens.forEach(parseMove); // throws on anything we don't understand
    return tokens;
}

export function invertMove(token) {
    return token.endsWith("'") ? token.slice(0, -1) : token + "'";
}

export function invertMoves(tokens) {
    return tokens.slice().reverse().map(invertMove);
}

export function invertAlg(alg) {
    return invertMoves(splitAlg(alg)).map(tidyMove).join(" ");
}

// "R2'" -> "R2", "R3" -> "R'"
function tidyMove(token) {
    const { family, amount } = parseMove(token);
    const q = ((amount % 4) + 4) % 4;
    return q === 1 ? family : q === 2 ? family + "2" : q === 3 ? family + "'" : "";
}

// Join moves, merging neighbours on the same layer: "U U" -> "U2", "R R'" -> "".
export function simplifyMoves(tokens) {
    const out = [];
    for (const token of tokens) {
        const { family, amount } = parseMove(token);
        const last = out[out.length - 1];
        if (last && last.family === family) {
            last.amount += amount;
            if (((last.amount % 4) + 4) % 4 === 0) out.pop();
        } else {
            out.push({ family, amount });
        }
    }
    return out.map(({ family, amount }) => tidyMove(family + (amount < 0 ? -amount + "'" : amount))).filter(Boolean);
}

export const SOLVED = FACES.map((f) => f.repeat(9)).join("");

export class Cube {
    constructor(facelets = SOLVED) {
        this.stickers = facelets.split("");
    }

    clone() {
        return new Cube(this.toString());
    }

    toString() {
        return this.stickers.join("");
    }

    move(token) {
        const perm = permutationFor(token);
        const next = new Array(54);
        for (let i = 0; i < 54; i++) next[perm[i]] = this.stickers[i];
        this.stickers = next;
        return this;
    }

    apply(alg) {
        const tokens = Array.isArray(alg) ? alg : splitAlg(alg);
        for (const t of tokens) this.move(t);
        return this;
    }

    // Colour of the centre on the face pointing in direction `normal` (the centre defines the face).
    centerColor(normal) {
        return this.stickers[SLOT_INDEX.get(key(normal, normal))];
    }

    // A piece is solved when each of its stickers matches the centre on the same side.
    // This works however the whole cube is held.
    pieceSolved(pos) {
        for (let axis = 0; axis < 3; axis++) {
            if (pos[axis] === 0) continue;
            const normal = [0, 0, 0];
            normal[axis] = pos[axis];
            if (this.stickers[SLOT_INDEX.get(key(pos, normal))] !== this.centerColor(normal)) return false;
        }
        return true;
    }

    isSolved() {
        return PIECES.every((p) => this.pieceSolved(p));
    }

    // Is the cross done on the face that points in `normal`? (4 edges touching that face)
    crossSolved(normal) {
        return PIECES.filter((p) => dot(p, normal) === 1 && nonZero(p) === 2).every((p) => this.pieceSolved(p));
    }

    // First two layers: everything except the layer opposite `normal`.
    f2lSolved(normal) {
        return PIECES.filter((p) => dot(p, normal) >= 0).every((p) => this.pieceSolved(p));
    }

    // F2L done and the last layer (opposite `normal`) is all one colour on top.
    ollSolved(normal) {
        if (!this.f2lSolved(normal)) return false;
        const top = normal.map((v) => -v);
        const color = this.centerColor(top);
        return SLOTS.every((s, i) => s.normal.join() !== top.join() || this.stickers[i] === color);
    }

    // Which face has a finished cross (if any)? Returns the face letter of that direction.
    solvedCrossFace() {
        return FACES.find((f) => this.crossSolved(NORMALS[f])) || null;
    }
}

const PIECES = [];
for (const x of [-1, 0, 1]) {
    for (const y of [-1, 0, 1]) {
        for (const z of [-1, 0, 1]) {
            if (nonZero([x, y, z]) >= 2) PIECES.push([x, y, z]); // edges and corners
        }
    }
}

function dot(a, b) {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

function nonZero(v) {
    return v.filter((n) => n !== 0).length;
}

export function normalOf(face) {
    return NORMALS[face];
}

// Rotation that brings `face` to the bottom (D), so the last layer ends up on top.
const TO_BOTTOM = { D: "", U: "x2", F: "x'", B: "x", R: "z'", L: "z" };

export function rotationToBottom(face) {
    return TO_BOTTOM[face];
}

// Work out which OLL or PLL case a cube is in. `cube` must have F2L solved on D.
// Returns { name, auf } or null. `cases` is { name: alg }.
export function identifyLastLayer(cube, cases, kind) {
    const aufs = ["", "U", "U2", "U'"];
    for (const [name, alg] of Object.entries(cases)) {
        for (const pre of aufs) {
            const test = cube.clone().apply(pre ? `${pre} ${alg}` : alg);
            if (kind === "oll" ? test.ollSolved([0, -1, 0]) : aufs.some((post) => test.clone().apply(post).isSolved())) {
                return { name, auf: pre };
            }
        }
    }
    return null;
}

// Random-move scramble using face turns only (a fallback when the official scrambler can't load).
export function randomMoveScramble(length = 20) {
    const faces = ["R", "L", "U", "D", "F", "B"];
    const axisOf = { R: 0, L: 0, U: 1, D: 1, F: 2, B: 2 };
    const moves = [];
    let lastFace = null;
    let lastAxis = null;
    let axisCount = 0;
    while (moves.length < length) {
        const face = faces[Math.floor(Math.random() * 6)];
        if (face === lastFace) continue;
        const axis = axisOf[face];
        if (axis === lastAxis && axisCount >= 2) continue;
        axisCount = axis === lastAxis ? axisCount + 1 : 1;
        lastAxis = axis;
        lastFace = face;
        moves.push(face + ["", "'", "2"][Math.floor(Math.random() * 3)]);
    }
    return moves.join(" ");
}

// ---------- Converting stickers to pieces (for the solver) ----------
//
// The solver (cubing.js) describes a cube by where each piece is and how it's twisted.
// Piece order and facelet order follow cubing.js's 3x3 definition.

const CORNER_FACELETS = [
    // UFR, URB, UBL, ULF, DRF, DFL, DLB, DBR - each listed U/D sticker first, then going around.
    [8, 20, 9], [2, 11, 45], [0, 47, 36], [6, 38, 18],
    [29, 15, 26], [27, 24, 44], [33, 42, 53], [35, 51, 17],
];
const EDGE_FACELETS = [
    // UF, UR, UB, UL, DF, DR, DB, DL, FR, FL, BR, BL
    [7, 19], [5, 10], [1, 46], [3, 37],
    [28, 25], [32, 16], [34, 52], [30, 43],
    [23, 12], [21, 41], [48, 14], [50, 39],
];

const cornerName = (i) => CORNER_FACELETS[i].map((f) => SLOTS[f].face).join("");
const edgeName = (i) => EDGE_FACELETS[i].map((f) => SLOTS[f].face).join("");

// Returns { pieces, errors } where pieces is cubing.js pattern data, or errors explains
// what's wrong (a sticker painted wrong, a twisted corner, ...).
export function faceletsToPattern(facelets) {
    const errors = [];
    const counts = {};
    for (const ch of facelets) counts[ch] = (counts[ch] || 0) + 1;
    for (const f of FACES) {
        if (counts[f] !== 9) errors.push(`There should be 9 stickers of each colour (found ${counts[f] || 0} of one).`);
    }
    if (errors.length) return { errors: [errors[0]] };

    const cornerPieces = [];
    const cornerOri = [];
    for (let pos = 0; pos < 8; pos++) {
        const colors = CORNER_FACELETS[pos].map((f) => facelets[f]);
        let found = -1;
        let ori = 0;
        for (let piece = 0; piece < 8 && found < 0; piece++) {
            const want = cornerName(piece);
            for (let o = 0; o < 3; o++) {
                if ([0, 1, 2].every((k) => colors[(k + o) % 3] === want[k])) {
                    found = piece;
                    ori = o;
                }
            }
        }
        if (found < 0) return { errors: ["One of the corners has a colour combination that can't exist. Check your stickers."] };
        cornerPieces.push(found);
        cornerOri.push((3 - ori) % 3); // cubing.js counts twists the other way round
    }

    const edgePieces = [];
    const edgeOri = [];
    for (let pos = 0; pos < 12; pos++) {
        const colors = EDGE_FACELETS[pos].map((f) => facelets[f]);
        let found = -1;
        let ori = 0;
        for (let piece = 0; piece < 12 && found < 0; piece++) {
            const want = edgeName(piece);
            if (colors[0] === want[0] && colors[1] === want[1]) { found = piece; ori = 0; }
            else if (colors[0] === want[1] && colors[1] === want[0]) { found = piece; ori = 1; }
        }
        if (found < 0) return { errors: ["One of the edges has a colour combination that can't exist. Check your stickers."] };
        edgePieces.push(found);
        edgeOri.push(ori);
    }

    if (new Set(cornerPieces).size !== 8 || new Set(edgePieces).size !== 12) {
        return { errors: ["Some pieces appear twice. Check your stickers."] };
    }
    if (cornerOri.reduce((a, b) => a + b, 0) % 3 !== 0) {
        errors.push("One corner is twisted. On a real cube this happens if a corner was twisted by hand - twist it back!");
    }
    if (edgeOri.reduce((a, b) => a + b, 0) % 2 !== 0) {
        errors.push("One edge is flipped. On a real cube this happens if it was popped out and put back wrong.");
    }
    if (parity(cornerPieces) !== parity(edgePieces)) {
        errors.push("Two pieces are swapped. That can't happen by turning, only by taking the cube apart.");
    }
    if (errors.length) return { errors };

    return {
        pieces: {
            EDGES: { pieces: edgePieces, orientation: edgeOri },
            CORNERS: { pieces: cornerPieces, orientation: cornerOri },
            CENTERS: { pieces: [0, 1, 2, 3, 4, 5], orientation: [0, 0, 0, 0, 0, 0] },
        },
    };
}

function parity(perm) {
    let swaps = 0;
    const seen = new Array(perm.length).fill(false);
    for (let i = 0; i < perm.length; i++) {
        if (seen[i]) continue;
        let len = 0;
        for (let j = i; !seen[j]; j = perm[j]) {
            seen[j] = true;
            len++;
        }
        swaps += len - 1;
    }
    return swaps % 2;
}
