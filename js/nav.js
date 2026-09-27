// Shared top menu for the Cube Lab pages. Put <nav class="site-nav" data-current="rubiks.html"></nav>
// in the page and import this file.
const LINKS = [
    ["index.html", "🏠 Home"],
    ["rubiks.html", "⏱ Timer"],
    ["algorithms.html", "📚 Alg Trainer"],
    ["smartcube.html", "📡 Smart Cube"],
    ["solver.html", "🤖 Solver"],
    ["trophies.html", "🏆 Trophies"],
    ["help.html", "❓ Help"],
    ["tetris.html", "🎮 Tetris"],
];

// Which part of the Help page explains each page.
const HELP_SECTIONS = {
    "rubiks.html": "timer",
    "algorithms.html": "algs",
    "smartcube.html": "smart",
    "solver.html": "solver",
    "trophies.html": "trophies",
};

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
    .page-help {
        display: block;
        width: 100%;
        text-align: right;
        font-weight: bold;
        color: #764ba2;
        margin-top: 2px;
    }
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

    // A "How does this page work?" link straight to this page's help.
    const section = HELP_SECTIONS[nav.dataset.current];
    if (section) {
        const help = document.createElement("a");
        help.className = "page-help";
        help.href = `help.html#${section}`;
        help.textContent = "❓ How does this page work?";
        nav.after(help);
    }
}
