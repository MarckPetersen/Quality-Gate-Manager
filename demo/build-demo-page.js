// Builds demo/index.html (the live demo page) from the tool's index.html.
// Usage: node demo/build-demo-page.js
const fs = require('fs');
const path = require('path');

const SITE = 'https://marckpetersen.github.io/Quality-Gate-Manager/demo/';
let s = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

function replaceOnce(from, to, firstOnly) {
  const n = s.split(from).length - 1;
  if (n === 0 || (n > 1 && !firstOnly)) throw new Error('Expected exactly one match for: ' + from.slice(0, 60));
  s = s.replace(from, to);
}

// Hook the demo player uses to change values and re-render.
replaceOnce('  render();\n\n  if (window.claude',
  '  window.__qg = { update: function (fn) { fn(state); saved = clone(state); render(); }, select: function (i) { ui.sel = i; render(); } };\n  render();\n\n  if (window.claude');
// Keep the demo's browser storage apart from the real tool on the same site.
replaceOnce('var DRAFT_KEY = "qg-draft-v1", SEL_KEY = "qg-selected";', 'var DRAFT_KEY = "qg-demo-draft", SEL_KEY = "qg-demo-selected";');

replaceOnce('<title>ISTQB Quality Gates</title>', `<title>Quality Gate Manager – Live Demo</title>
<meta name="description" content="ISTQB quality gates turning from not ready to green: a live demo of the Quality Gate Manager.">
<meta property="og:type" content="website">
<meta property="og:title" content="Quality Gate Manager – Live Demo">
<meta property="og:description" content="Watch ISTQB quality gates move from not ready through conditional go and no-go to an all-green release.">
<meta property="og:url" content="${SITE}">
<meta property="og:image" content="${SITE}preview.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="627">
<meta name="twitter:card" content="summary_large_image">`, true); // the page's own title, not the copy in the save code

replaceOnce('</style>\n\n<div id="app">', `
#cap { position: fixed; left: 50%; bottom: calc(28px + env(safe-area-inset-bottom, 0px)); transform: translateX(-50%); z-index: 50;
  background: var(--ink); color: var(--bg); font: 600 21px/1.3 var(--f-body); padding: 14px 24px; border-radius: 10px;
  box-shadow: 0 10px 30px rgba(0,0,0,.45); width: max-content; max-width: 1100px; text-align: center; }
#cap b { font-family: var(--f-data); font-weight: 500; margin-right: 10px; }
#demo-bar { position: fixed; top: calc(12px + env(safe-area-inset-top, 0px)); right: 16px; z-index: 50; display: flex; gap: 8px; align-items: center;
  background: var(--surface); border: 1px solid var(--line); border-radius: 8px; padding: 6px 8px; font-size: 14px; }
#demo-bar .demo-tag { font-size: 11.5px; letter-spacing: .09em; text-transform: uppercase; font-weight: 700; color: var(--nogo); padding: 0 4px; }
#demo-bar button, #demo-bar a { border: 1px solid var(--line); background: var(--bg); color: var(--ink); border-radius: 6px; padding: 5px 10px; text-decoration: none; font-weight: 600; }
#demo-bar button:hover, #demo-bar a:hover { border-color: var(--accent); }
.gate.flash .sig { animation: flash 1s ease-out; }
@keyframes flash { 0% { transform: rotate(45deg) scale(1.6); box-shadow: 0 0 0 12px currentColor; }
  100% { transform: rotate(45deg) scale(1); box-shadow: 0 0 0 0 transparent; } }
.top .actions { visibility: hidden; }
#app { max-width: 1400px; }
</style>\n\n<div id="app">`);

replaceOnce('\n</body></html>', '\n<script src="player.js"></script>\n</body></html>');

fs.writeFileSync(path.join(__dirname, 'index.html'), s);
console.log('Wrote demo/index.html');
