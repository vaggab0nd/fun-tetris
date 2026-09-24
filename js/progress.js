// XP, levels, achievements and world-rank lookups, shared by every Cube Lab page.
// Everything is worked out from what the other pages already save in localStorage.
import { WCA_RANKS } from "./wca-ranks.js";
import { OLL_ALGS, PLL_ALGS } from "./cube-algs.js";

// ---------- Reading saved data ----------
function load(key, fallback) {
    try {
        const value = JSON.parse(localStorage.getItem(key));
        return value ?? fallback;
    } catch {
        return fallback;
    }
}

function save(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch {
        // Storage unavailable - nothing persists, but the page still works.
    }
}

export function setFlag(name) {
    const flags = load("cubeLabFlags", {});
    flags[name] = true;
    save("cubeLabFlags", flags);
}

// ---------- Times ----------
export function effectiveTime(solve) {
    if (solve.penalty === "DNF") return Infinity;
    return solve.ms + (solve.penalty === "+2" ? 2000 : 0);
}

// WCA-style trimmed average: drop the best and worst 5% (at least one each side).
export function averageOf(solves) {
    const times = solves.map(effectiveTime).sort((a, b) => a - b);
    const trim = Math.max(1, Math.ceil(times.length * 0.05));
    const middle = times.slice(trim, times.length - trim);
    if (middle.includes(Infinity)) return Infinity;
    return middle.reduce((sum, t) => sum + t, 0) / middle.length;
}

export function bestAverage(solves, n) {
    let best = Infinity;
    for (let i = n; i <= solves.length; i++) best = Math.min(best, averageOf(solves.slice(i - n, i)));
    return best;
}

export function formatTime(ms) {
    if (ms === null || ms === undefined || ms === Infinity || Number.isNaN(ms)) return "-";
    const totalCs = Math.round(ms / 10);
    const cs = String(totalCs % 100).padStart(2, "0");
    const totalSec = Math.floor(totalCs / 100);
    const min = Math.floor(totalSec / 60);
    return min > 0 ? `${min}:${String(totalSec % 60).padStart(2, "0")}.${cs}` : `${totalSec}.${cs}`;
}

// ---------- World rank ----------
// Estimated world rank for a time (ms) in an event, compared with official WCA results.
export function worldRank(eventId, type, ms) {
    const table = WCA_RANKS[eventId]?.[type];
    if (!table || !Number.isFinite(ms)) return null;
    const cs = ms / 10;
    const pts = table.pts;
    let rank;
    if (cs <= pts[0][0]) rank = 1;
    else if (cs >= pts[pts.length - 1][0]) rank = table.total;
    else {
        let i = 1;
        while (pts[i][0] < cs) i++;
        const [t0, r0] = pts[i - 1];
        const [t1, r1] = pts[i];
        rank = Math.round(r0 + ((r1 - r0) * (cs - t0)) / (t1 - t0));
    }
    const fasterThan = Math.max(0, Math.min(100, (1 - rank / table.total) * 100));
    return { rank, total: table.total, fasterThan, worldRecord: pts[0][0] * 10 };
}

// ---------- Gathering stats ----------
export function gatherStats() {
    const timer = load("cubeLabSolves", {});
    const smart = load("cubeLabSmartSolves", []);
    const status = load("cubeLabAlgStatus", {});
    const flags = load("cubeLabFlags", {});
    const bestStreak = Number(load("cubeLabBestStreak", 0)) || 0;

    const events = {};
    for (const [eventId, solves] of Object.entries(timer)) {
        if (!solves.length) continue;
        events[eventId] = {
            count: solves.length,
            bestSingle: Math.min(...solves.map(effectiveTime)),
            bestAo5: bestAverage(solves, 5),
            bestAo12: bestAverage(solves, 12),
        };
    }
    // Smart cube solves count as 3x3 solves too.
    if (smart.length) {
        const asTimer = smart.map((s) => ({ ms: s.ms, penalty: null }));
        const e = events["333"] || { count: 0, bestSingle: Infinity, bestAo5: Infinity, bestAo12: Infinity };
        events["333"] = {
            count: e.count + smart.length,
            bestSingle: Math.min(e.bestSingle, ...asTimer.map(effectiveTime)),
            bestAo5: Math.min(e.bestAo5, bestAverage(asTimer, 5)),
            bestAo12: Math.min(e.bestAo12, bestAverage(asTimer, 12)),
        };
    }

    const days = new Set();
    for (const solves of Object.values(timer)) for (const s of solves) if (s.date) days.add(new Date(s.date).toDateString());
    for (const s of smart) if (s.date) days.add(new Date(s.date).toDateString());

    const learned = (ids) => ids.filter((id) => status[id] === 2).length;
    const ollIds = Object.keys(OLL_ALGS).map((n) => "oll-" + n);
    const pllIds = Object.keys(PLL_ALGS).map((n) => "pll-" + n);
    const twoLookIds = ["eo-line", "eo-l", "eo-dot", ...[21, 22, 23, 24, 25, 26, 27].map((n) => "oll-" + n),
        ...["T", "Y", "Ua", "Ub", "H", "Z"].map((n) => "pll-" + n)];

    return {
        events,
        totalSolves: Object.values(events).reduce((sum, e) => sum + e.count, 0),
        eventCount: Object.keys(events).length,
        days: days.size,
        smart,
        learnedTotal: Object.values(status).filter((v) => v === 2).length,
        learningTotal: Object.values(status).filter((v) => v === 1).length,
        learnedOll: learned(ollIds),
        learnedPll: learned(pllIds),
        learnedTwoLook: learned(twoLookIds),
        bestStreak,
        flags,
    };
}

// ---------- Achievements ----------
const S = 1000;
const best333 = (st) => st.events["333"]?.bestSingle ?? Infinity;
const ao5333 = (st) => st.events["333"]?.bestAo5 ?? Infinity;
const smartAny = (st, fn) => st.smart.some(fn);

export const RARITY = {
    common: { label: "Common", xp: 25 },
    rare: { label: "Rare", xp: 75 },
    epic: { label: "Epic", xp: 200 },
    legendary: { label: "Legendary", xp: 500 },
};

export const ACHIEVEMENTS = [
    // Solving
    ["first-solve", "First Steps", "Time your first solve", "common", (st) => st.totalSolves >= 1],
    ["solves-10", "Warming Up", "10 timed solves", "common", (st) => st.totalSolves >= 10],
    ["solves-100", "Centurion", "100 timed solves", "rare", (st) => st.totalSolves >= 100],
    ["solves-1000", "Cube Addict", "1,000 timed solves", "epic", (st) => st.totalSolves >= 1000],
    ["days-5", "Daily Cuber", "Solve on 5 different days", "rare", (st) => st.days >= 5],
    ["days-30", "Dedicated", "Solve on 30 different days", "legendary", (st) => st.days >= 30],
    ["events-3", "Collector", "Solve 3 different puzzles", "rare", (st) => st.eventCount >= 3],
    ["events-5", "Puzzle Master", "Solve all 5 timer puzzles", "epic", (st) => st.eventCount >= 5],
    // 3x3 speed
    ["sub-60", "Sub-1 Minute", "3x3 single under 60 seconds", "common", (st) => best333(st) < 60 * S],
    ["sub-45", "Sub-45", "3x3 single under 45 seconds", "common", (st) => best333(st) < 45 * S],
    ["sub-30", "Sub-30 Club", "3x3 single under 30 seconds", "rare", (st) => best333(st) < 30 * S],
    ["sub-20", "Sub-20 Speedcuber", "3x3 single under 20 seconds", "epic", (st) => best333(st) < 20 * S],
    ["sub-15", "Sub-15 Shredder", "3x3 single under 15 seconds", "epic", (st) => best333(st) < 15 * S],
    ["sub-10", "Sub-10 Legend", "3x3 single under 10 seconds", "legendary", (st) => best333(st) < 10 * S],
    ["ao5-30", "Consistent", "3x3 average of 5 under 30 seconds", "rare", (st) => ao5333(st) < 30 * S],
    ["ao5-20", "Machine", "3x3 average of 5 under 20 seconds", "epic", (st) => ao5333(st) < 20 * S],
    // World
    ["world-50", "Top Half", "3x3 ao5 faster than half of all WCA competitors", "rare",
        (st) => (worldRank("333", "average", ao5333(st))?.fasterThan ?? 0) >= 50],
    ["world-75", "Top Quarter", "3x3 ao5 faster than 75% of WCA competitors", "epic",
        (st) => (worldRank("333", "average", ao5333(st))?.fasterThan ?? 0) >= 75],
    ["world-90", "Elite", "3x3 ao5 faster than 90% of WCA competitors", "legendary",
        (st) => (worldRank("333", "average", ao5333(st))?.fasterThan ?? 0) >= 90],
    // Algorithms
    ["alg-1", "Student", "Mark your first algorithm as learned", "common", (st) => st.learnedTotal >= 1],
    ["two-look", "2-Look Graduate", "Learn all 16 2-Look algorithms", "rare", (st) => st.learnedTwoLook >= 16],
    ["pll-all", "PLL Wizard", "Learn all 21 PLLs", "epic", (st) => st.learnedPll >= 21],
    ["oll-all", "OLL Overlord", "Learn all 57 OLLs", "legendary", (st) => st.learnedOll >= 57],
    ["streak-10", "Sharp Eyes", "Name That Move streak of 10", "common", (st) => st.bestStreak >= 10],
    ["streak-25", "Eagle Eyes", "Name That Move streak of 25", "rare", (st) => st.bestStreak >= 25],
    // Smart cube
    ["smart-1", "Connected", "Finish a solve on the Smart Cube page", "common", (st) => st.smart.length >= 1],
    ["oll-skip", "OLL Skip!", "Get an OLL skip in a Smart Cube solve", "rare", (st) => smartAny(st, (s) => s.ollSkip)],
    ["pll-skip", "PLL Skip!", "Get a PLL skip in a Smart Cube solve", "rare", (st) => smartAny(st, (s) => s.pllSkip)],
    ["ll-skip", "Jackpot", "Skip the whole last layer (OLL and PLL)", "legendary", (st) => smartAny(st, (s) => s.ollSkip && s.pllSkip)],
    ["tps-3", "Quick Fingers", "3+ turns per second over a whole solve", "rare", (st) => smartAny(st, (s) => s.tps >= 3)],
    ["tps-5", "Turbo", "5+ turns per second over a whole solve", "epic", (st) => smartAny(st, (s) => s.tps >= 5)],
    ["cross-6", "Efficient Cross", "Finish the cross in 6 moves or fewer", "rare", (st) => smartAny(st, (s) => s.crossMoves <= 6)],
    // Solver
    ["solver", "Computer Assist", "Solve a cube with the Solver", "common", (st) => st.flags.solverUsed],
    ["scanner", "Cube Scanner", "Scan a real cube with the camera", "rare", (st) => st.flags.cameraScan],
].map(([id, name, desc, rarity, test]) => ({ id, name, desc, rarity, test }));

// ---------- XP and levels ----------
const TITLES = [
    [1, "Cube Rookie"], [3, "Scrambler"], [5, "Cross Cadet"], [8, "F2L Fighter"], [12, "OLL Knight"],
    [16, "PLL Wizard"], [20, "Speedcuber"], [25, "Grandmaster"], [30, "Cube Legend"],
];

export function levelFor(xp) {
    const level = Math.floor(Math.sqrt(xp / 40)) + 1;
    const xpFor = (lvl) => 40 * (lvl - 1) ** 2;
    const title = TITLES.filter(([lvl]) => level >= lvl).pop()[1];
    return { level, title, from: xpFor(level), to: xpFor(level + 1) };
}

export function computeProfile() {
    const stats = gatherStats();
    const unlocked = ACHIEVEMENTS.filter((a) => {
        try {
            return a.test(stats);
        } catch {
            return false;
        }
    });
    const xp = stats.totalSolves * 5
        + stats.smart.length * 5
        + stats.learnedTotal * 20
        + stats.learningTotal * 5
        + unlocked.reduce((sum, a) => sum + RARITY[a.rarity].xp, 0);
    return { stats, unlocked, xp, ...levelFor(xp) };
}

// ---------- "Achievement unlocked!" pop-ups ----------
// Call after anything that could unlock an achievement. The first call on a device only records
// what's already unlocked, so old progress doesn't flood the screen.
export function checkAchievements() {
    const { unlocked, level } = computeProfile();
    const seen = load("cubeLabAchievementsSeen", null);
    const seenLevel = load("cubeLabLevelSeen", null);
    save("cubeLabAchievementsSeen", unlocked.map((a) => a.id));
    save("cubeLabLevelSeen", level);
    if (seen === null) return;
    const fresh = unlocked.filter((a) => !seen.includes(a.id));
    for (const a of fresh.slice(0, 4)) {
        toast(`🏆 Achievement unlocked: <b>${a.name}</b><br>${a.desc} · ${RARITY[a.rarity].label}`, a.rarity);
    }
    if (fresh.length > 4) toast(`🏆 …and <b>${fresh.length - 4} more</b>! See them on the Trophies page`, "rare");
    if (seenLevel !== null && level > seenLevel) toast(`⬆️ Level up! You're now <b>level ${level}</b>`, "epic");
}

const TOAST_CSS = `
.toast-box {
    position: fixed;
    right: 16px;
    bottom: 16px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    z-index: 1000;
    max-width: calc(100vw - 32px);
}

.toast {
    background: #1e1e2e;
    color: #fff;
    border-radius: 10px;
    padding: 12px 16px;
    box-shadow: 0 6px 30px rgba(0, 0, 0, 0.4);
    border-left: 6px solid #fab005;
    animation: toast-in 0.4s ease-out;
    font-family: 'Courier New', monospace;
}

.toast b { color: #ffd43b; }
.toast.rare { border-left-color: #4dabf7; }
.toast.epic { border-left-color: #cc5de8; }
.toast.legendary { border-left-color: #ff922b; }

@keyframes toast-in {
    from { transform: translateY(30px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
}
`;

function toast(html, rarity) {
    let box = document.querySelector(".toast-box");
    if (!box) {
        const style = document.createElement("style");
        style.textContent = TOAST_CSS;
        document.head.append(style);
        box = document.createElement("div");
        box.className = "toast-box";
        document.body.append(box);
    }
    const el = document.createElement("div");
    el.className = `toast ${rarity}`;
    el.innerHTML = html;
    box.append(el);
    setTimeout(() => el.remove(), 5000);
}
