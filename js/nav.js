// Shared top menu for the Cube Lab pages. Put <nav class="site-nav" data-current="rubiks.html"></nav>
// in the page and import this file.
const LINKS = [
    ["rubiks.html", "⏱ Timer"],
    ["algorithms.html", "📚 Alg Trainer"],
    ["smartcube.html", "📡 Smart Cube"],
    ["solver.html", "🤖 Solver"],
    ["trophies.html", "🏆 Trophies"],
    ["index.html", "🎮 Tetris"],
];

for (const nav of document.querySelectorAll("nav.site-nav")) {
    nav.innerHTML = "";
    for (const [href, label] of LINKS) {
        const a = document.createElement("a");
        a.href = href;
        a.textContent = label;
        if (href === nav.dataset.current) a.className = "current";
        nav.append(a);
    }
}
