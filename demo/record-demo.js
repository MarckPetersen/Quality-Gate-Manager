// Records one loop of the live demo page (demo/index.html) as a video.
// Usage: node demo/record-demo.js [output dir]
// Then: ffmpeg -ss 1 -i <dir>/*.webm -c:v libx264 -pix_fmt yuv420p demo/quality-gates-demo.mp4
const { chromium } = require('playwright');
const path = require('path');

const outDir = process.argv[2] || path.join(__dirname, 'raw');
const W = 1280, H = 800;

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: W, height: H }, colorScheme: 'dark',
    recordVideo: { dir: outDir, size: { width: W, height: H } },
  });
  const page = await context.newPage();
  await page.goto('file://' + path.join(__dirname, 'index.html'));
  await page.addStyleTag({ content: '#demo-bar { display: none !important; }' });
  await page.waitForFunction(() => /All six/.test(document.getElementById('cap').textContent), null, { timeout: 90000 });
  await page.waitForTimeout(4500);
  const video = page.video();
  await context.close();
  await browser.close();
  console.log(await video.path());
})();
