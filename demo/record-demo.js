// Records a short demo video of the Quality Gate Manager: gates move from
// "not ready" through conditional go / no-go to an all-green release.
// Usage: node demo/record-demo.js [index.html] [output dir]
const { chromium } = require('playwright');
const fs = require('fs');
const os = require('os');
const path = require('path');

const src = process.argv[2] || path.join(__dirname, '..', 'index.html');
const outDir = process.argv[3] || path.join(__dirname, 'raw');
// Copy the tool with a small hook the script uses to change values and re-render.
const anchor = '  render();\n\n  if (window.claude';
const hook = '  window.__qg = { update: function (fn) { fn(state); saved = clone(state); render(); }, select: function (i) { ui.sel = i; render(); } };\n';
const pageFile = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'qg-')), 'demo.html');
fs.writeFileSync(pageFile, fs.readFileSync(src, 'utf8').replace(anchor, hook + anchor));
const W = 1280, H = 800;

(async () => {
  const browser = await chromium.launch();
  const t0 = Date.now();
  const context = await browser.newContext({
    viewport: { width: W, height: H }, colorScheme: 'dark',
    recordVideo: { dir: outDir, size: { width: W, height: H } },
  });
  const page = await context.newPage();
  await page.goto('file://' + path.resolve(pageFile));
  await page.waitForFunction(() => window.__qg);

  await page.addStyleTag({ content: `
    #cap { position: fixed; left: 50%; bottom: 28px; transform: translateX(-50%); z-index: 50;
      background: var(--ink); color: var(--bg); font: 600 21px/1.3 var(--f-body);
      padding: 14px 24px; border-radius: 10px; box-shadow: 0 10px 30px rgba(0,0,0,.45);
      max-width: 1100px; text-align: center; transition: opacity .25s; }
    #cap b { font-family: var(--f-data); font-weight: 500; margin-right: 10px; }
    .gate.flash .sig { animation: flash 1s ease-out; }
    @keyframes flash { 0% { transform: rotate(45deg) scale(1.6); box-shadow: 0 0 0 12px currentColor; }
      100% { transform: rotate(45deg) scale(1); box-shadow: 0 0 0 0 transparent; } }
  ` });
  await page.evaluate(() => { const d = document.createElement('div'); d.id = 'cap'; document.body.appendChild(d); });

  const wait = ms => page.waitForTimeout(ms);
  const caption = (label, text) => page.evaluate(([l, t]) => {
    const c = document.getElementById('cap');
    c.innerHTML = (l ? '<b>' + l + '</b>' : '') + t;
  }, [label, text]);
  // patches: { criterionId: value } — numbers set `actual`, booleans set `met`
  const set = (patches, gateIndex) => page.evaluate(([p, g]) => {
    window.__qg.update(s => s.levels.forEach(l => l.entry.concat(l.exit).forEach(c => {
      if (!(c.id in p)) return;
      if (c.kind === 'check') c.met = p[c.id]; else c.actual = p[c.id];
    })));
    if (g != null) document.querySelectorAll('.gate')[g].classList.add('flash');
  }, [patches, gateIndex]);
  const select = i => page.evaluate(i => window.__qg.select(i), i);

  // Start: every criterion pending
  await page.evaluate(() => window.__qg.update(s => {
    s.project = 'Payments Portal 3.2';
    s.levels.forEach(l => l.entry.concat(l.exit).forEach(c => { c.actual = null; c.met = null; }));
  }));
  await select(0);
  await caption('', 'Release 3.2 starts: every quality gate is not ready');
  const trimStart = (Date.now() - t0) / 1000;
  await wait(3000);

  // QG0
  await set({ L1e1: true, L1e2: true, L1e3: 0, L1e4: false }, 0);
  await caption('QG0', 'Stubs and drivers missing: conditional go');
  await wait(2600);
  await set({ L1e4: true }, 0);
  await caption('QG0', 'Test environment complete: go into component testing');
  await wait(2400);

  // QG1
  await set({ L1x1: 86, L1x2: 66, L1x3: 100, L1x4: 0, L1x5: true, L2e1: true, L2e2: true, L2e3: 100, L2e4: true }, 1);
  await caption('QG1', 'Branch coverage 66% is below 70%: conditional go');
  await wait(2600);
  await select(1);
  await set({ L1x2: 74 }, 1);
  await caption('QG1', 'Coverage raised to 74%: go');
  await wait(2400);

  // QG2
  await set({ L2x1: 97, L2x2: 92, L2x3: 0, L2x4: 3, L2x5: 61, L3e1: true, L3e2: true, L3e3: 100, L3e4: true }, 2);
  await caption('QG2', 'Regression automation 61% is below 70%: conditional go');
  await wait(2600);
  await select(2);
  await set({ L2x5: 72 }, 2);
  await caption('QG2', 'Automation at 72%: go into system testing');
  await wait(2400);

  // QG3: red, then fixed by typing the retest result into the table
  await set({ L3x1: 96, L3x2: 93, L3x3: 0, L3x4: 2, L3x5: 870, L3x6: 0, L3x7: true, L4e1: true, L4e2: true, L4e3: true }, 3);
  await caption('QG3', 'Test pass rate 93% is below the 95% must: no-go');
  await wait(3200);
  await page.evaluate(() => document.getElementById('L3x2-actual').scrollIntoView({ behavior: 'smooth', block: 'center' }));
  await caption('QG3', 'Defects fixed and retested...');
  await wait(1400);
  await page.fill('#L3x2-actual', '');
  await page.type('#L3x2-actual', '97', { delay: 220 });
  await page.press('#L3x2-actual', 'Enter');
  await page.evaluate(() => window.__qg.update(() => {}));
  await wait(1600);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
  await wait(700);
  await page.evaluate(() => document.querySelectorAll('.gate')[3].classList.add('flash'));
  await caption('QG3', 'Pass rate now 97%: go into system integration testing');
  await wait(2600);

  // QG4
  await select(3);
  await set({ L4x1: 100, L4x2: 0.8, L4x3: 0, L4x4: 99.95, L5e1: true, L5e2: true, L5e3: true }, 4);
  await caption('QG4', 'Interface error rate 0.8% is above 0.5%: conditional go');
  await wait(2600);
  await set({ L4x2: 0.3 }, 4);
  await caption('QG4', 'Error rate down to 0.3%: go into acceptance testing');
  await wait(2400);

  // QG5
  await select(4);
  await set({ L5x1: 100, L5x2: 0, L5x3: 1, L5x4: true, L5x5: false, L5x6: true }, 5);
  await caption('QG5', 'Rollback plan not ready yet: conditional go');
  await wait(2600);
  await set({ L5x5: true }, 5);
  await caption('', 'All six quality gates are green: ready for release ✓');
  await wait(4500);

  const video = page.video();
  await context.close();
  await browser.close();
  console.log(JSON.stringify({ video: await video.path(), trimStart }));
})();
