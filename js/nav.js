// Shared top menu for the Cube Lab pages. Put <nav class="site-nav" data-current="rubiks.html"></nav>
// in the page and import this file.
const LINKS = [
    ["index.html", "🏠 Home"],
    ["rubiks.html", "⏱ Timer"],
    ["algorithms.html", "📚 Alg Trainer"],
    ["smartcube.html", "📡 Smart Cube"],
    ["solver.html", "🤖 Solver"],
    ["trophies.html", "🏆 Trophies"],
    ["tetris.html", "🎮 Tetris"],
];

// Big, obvious menu buttons on their own row under the page title.
const style = document.createElement("style");
style.textContent = `
    .site-nav {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        width: 100%;
        padding: 8px;
        background: #eef0ff;
        border-radius: 10px;
    }
    .site-nav a {
        flex: 1 1 auto;
        text-align: center;
        color: #5a3d8a;
        background: #fff;
        font-weight: bold;
        text-decoration: none;
        padding: 9px 10px;
        border-radius: 8px;
        border: 2px solid #b8b2e6;
        font-size: 0.95em;
        white-space: nowrap;
    }
    .site-nav a:hover { border-color: #764ba2; background: #f8f0ff; }
    .site-nav a.current { background: #764ba2; border-color: #764ba2; color: #fff; }
`;
document.head.append(style);

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
