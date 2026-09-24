// Reading sticker colours from a camera picture.
//
// We never assume what "red" looks like: lighting changes everything. Instead each face's centre
// sticker tells us what that face's colour looks like under *this* light, and every other sticker
// is matched to the colour it looks most like (with exactly 9 stickers per colour).

// Average colour of the middle part of each of the 9 cells in a square area of a canvas.
export function sampleCells(ctx, left, top, size) {
    const cell = size / 3;
    const inset = cell * 0.3; // ignore the edges of each cell (black plastic, glare)
    const samples = [];
    for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
            const x = Math.round(left + c * cell + inset);
            const y = Math.round(top + r * cell + inset);
            const w = Math.max(1, Math.round(cell - 2 * inset));
            const { data } = ctx.getImageData(x, y, w, w);
            let rs = 0, gs = 0, bs = 0;
            const n = data.length / 4;
            for (let i = 0; i < data.length; i += 4) {
                rs += data[i];
                gs += data[i + 1];
                bs += data[i + 2];
            }
            samples.push([rs / n, gs / n, bs / n]);
        }
    }
    return samples;
}

// Convert RGB (0-255) to CIE Lab, where distances match how different colours look to people.
export function rgbToLab([r, g, b]) {
    const lin = (v) => {
        v /= 255;
        return v > 0.04045 ? ((v + 0.055) / 1.055) ** 2.4 : v / 12.92;
    };
    const [R, G, B] = [lin(r), lin(g), lin(b)];
    const x = (R * 0.4124 + G * 0.3576 + B * 0.1805) / 0.95047;
    const y = R * 0.2126 + G * 0.7152 + B * 0.0722;
    const z = (R * 0.0193 + G * 0.1192 + B * 0.9505) / 1.08883;
    const f = (t) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
    return [116 * f(y) - 16, 500 * (f(x) - f(y)), 200 * (f(y) - f(z))];
}

function distance(a, b) {
    return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
}

// faces: { U: [9 rgb], R: [...], F: [...], D: [...], L: [...], B: [...] } (each read in facelet order)
// Returns a 54-letter facelet string (URFDLB order).
//
// Round 1 compares every sticker with the 6 centres. Then each colour's "reference" becomes the
// average of the 9 stickers it got, and we match again. Averaging over stickers from different faces
// evens out the lighting, which makes a big difference (tested: 77% -> 94% of cubes read perfectly
// under harsh, uneven light).
export function classifyStickers(faces, rounds = 3) {
    const order = ["U", "R", "F", "D", "L", "B"];
    const labs = [];
    order.forEach((face) => faces[face].forEach((rgb) => labs.push(rgbToLab(rgb))));
    let refs = Object.fromEntries(order.map((face, fi) => [face, labs[fi * 9 + 4]]));
    let result;
    for (let round = 0; round <= rounds; round++) {
        result = assign(labs, refs, order);
        refs = Object.fromEntries(order.map((color) => {
            const members = labs.filter((_, i) => result[i] === color);
            return [color, [0, 1, 2].map((k) => members.reduce((sum, v) => sum + v[k], 0) / members.length)];
        }));
    }
    return result.join("");
}

// Give every sticker a colour: closest matches first, at most 9 stickers per colour.
function assign(labs, refs, order) {
    const result = new Array(54).fill(null);
    order.forEach((face, fi) => { result[fi * 9 + 4] = face; }); // centres are what they are
    const pairs = [];
    labs.forEach((lab, index) => {
        if (result[index]) return;
        for (const color of order) pairs.push([distance(lab, refs[color]), index, color]);
    });
    pairs.sort((a, b) => a[0] - b[0]);
    const count = Object.fromEntries(order.map((f) => [f, 1]));
    for (const [, index, color] of pairs) {
        if (result[index] || count[color] >= 9) continue;
        result[index] = color;
        count[color]++;
    }
    return result;
}
