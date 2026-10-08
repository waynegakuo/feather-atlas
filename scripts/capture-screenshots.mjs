/**
 * Capture marketing screenshots (mobile + desktop).
 * Usage: node scripts/capture-screenshots.mjs [url]
 */
import { chromium, devices } from 'playwright';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';

const url = process.argv[2] ?? 'http://127.0.0.1:4200/';
const outDir = join(import.meta.dirname, '..', 'docs', 'screenshots');

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function ready(page) {
  await page.goto(url, { waitUntil: 'load', timeout: 90_000 });
  await page.waitForSelector('.stage', { timeout: 60_000 });
  await page.getByRole('tab', { name: /Kingfisher/i }).waitFor({ timeout: 30_000 });
  await page.waitForFunction(
    () => !document.querySelector('.stage__loader'),
    { timeout: 90_000 },
  ).catch(() => {});
  await wait(2500);
}

async function orbitStage(page) {
  const stage = page.locator('.stage');
  const box = await stage.boundingBox();
  if (!box) return;
  const cx = box.x + box.width * 0.55;
  const cy = box.y + box.height * 0.42;
  await page.mouse.move(cx, cy);
  await page.mouse.down();
  await page.mouse.move(cx + 70, cy - 25, { steps: 14 });
  await page.mouse.up();
  await wait(800);
}

async function captureMobile(browser) {
  const iphone = devices['iPhone 14 Pro'];
  const context = await browser.newContext({
    ...iphone,
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();
  await ready(page);
  await orbitStage(page);

  await page.screenshot({
    path: join(outDir, 'feather-atlas-mobile-kingfisher.png'),
    fullPage: false,
  });

  await page.getByRole('tab', { name: /Hoopoe/i }).click();
  await wait(2800);
  await orbitStage(page);
  await page.screenshot({
    path: join(outDir, 'feather-atlas-mobile-hoopoe.png'),
    fullPage: false,
  });

  await page.getByRole('button', { name: /Explorer guide/i }).click();
  await wait(600);
  await page.screenshot({
    path: join(outDir, 'feather-atlas-mobile-explorer-guide.png'),
    fullPage: false,
  });

  await context.close();
}

async function captureDesktop(browser) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();
  await ready(page);
  await orbitStage(page);

  await page.screenshot({
    path: join(outDir, 'feather-atlas-desktop-kingfisher.png'),
    fullPage: false,
  });

  await page.getByRole('tab', { name: /Hoopoe/i }).click();
  await wait(2800);
  await orbitStage(page);
  await page.screenshot({
    path: join(outDir, 'feather-atlas-desktop-hoopoe.png'),
    fullPage: false,
  });

  await page.getByRole('button', { name: /Focus view/i }).click();
  await wait(500);
  await page.screenshot({
    path: join(outDir, 'feather-atlas-desktop-focus-view.png'),
    fullPage: false,
  });

  await context.close();
}

await mkdir(outDir, { recursive: true });
const browser = await chromium.launch({ headless: true });
try {
  await captureMobile(browser);
  await captureDesktop(browser);
  console.log(`Screenshots saved to ${outDir}`);
} finally {
  await browser.close();
}
