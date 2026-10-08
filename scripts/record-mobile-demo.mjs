/**
 * Records a short mobile demo of Feather Atlas (webm → mp4 via ffmpeg if available).
 * Usage: node scripts/record-mobile-demo.mjs [url]
 */
import { chromium, devices } from 'playwright';
import { mkdir, rename, unlink } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import ffmpegPath from 'ffmpeg-static';

const url = process.argv[2] ?? 'https://feather-atlas.web.app/';
const outDir = join(import.meta.dirname, '..', 'docs');
const baseName = 'feather-atlas-mobile-demo';

await mkdir(outDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const iphone = devices['iPhone 14 Pro'];
const context = await browser.newContext({
  ...iphone,
  recordVideo: {
    dir: outDir,
    size: { width: 393, height: 852 },
  },
});
const page = await context.newPage();

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

try {
  await page.goto(url, { waitUntil: 'load', timeout: 90_000 });
  await page.waitForSelector('.stage', { timeout: 60_000 });
  await page.getByRole('tab', { name: /Kingfisher/i }).waitFor({ timeout: 30_000 });
  await wait(3500);

  const stage = page.locator('.stage');
  const box = await stage.boundingBox();
  if (box) {
    const cx = box.x + box.width * 0.55;
    const cy = box.y + box.height * 0.42;
    await page.mouse.move(cx, cy);
    await page.mouse.down();
    await page.mouse.move(cx + 90, cy - 30, { steps: 18 });
    await wait(400);
    await page.mouse.move(cx - 70, cy + 20, { steps: 14 });
    await page.mouse.up();
  }
  await wait(1200);

  await page.getByRole('tab', { name: /Hoopoe/i }).click();
  await wait(2800);

  if (box) {
    const cx = box.x + box.width * 0.5;
    const cy = box.y + box.height * 0.45;
    await page.mouse.wheel(0, -120);
    await wait(600);
    await page.mouse.wheel(0, 80);
    await wait(800);
    await page.mouse.move(cx, cy);
    await page.mouse.down();
    await page.mouse.move(cx + 60, cy, { steps: 12 });
    await page.mouse.up();
  }
  await wait(1500);

  await page.getByRole('button', { name: /Explorer guide/i }).click();
  await wait(2200);
  await page.getByRole('button', { name: /^Close$/ }).click();
  await wait(800);

  await page.getByRole('tab', { name: /Kingfisher/i }).click();
  await wait(2000);
} finally {
  const video = page.video();
  await page.close();
  const webmPath = video ? await video.path() : null;
  await context.close();
  await browser.close();

  if (!webmPath) {
    console.error('No video recorded.');
    process.exit(1);
  }

  const webmOut = join(outDir, `${baseName}.webm`);
  const mp4Out = join(outDir, `${baseName}.mp4`);
  await rename(webmPath, webmOut);

  const ffmpegBin = ffmpegPath ?? 'ffmpeg';
  const ff = spawnSync(
    ffmpegBin,
    [
      '-y',
      '-i',
      webmOut,
      '-c:v',
      'libx264',
      '-pix_fmt',
      'yuv420p',
      '-movflags',
      '+faststart',
      mp4Out,
    ],
    { stdio: 'inherit' },
  );

  if (ff.status === 0 && existsSync(mp4Out)) {
    await unlink(webmOut).catch(() => {});
    console.log(`Saved ${mp4Out}`);
  } else {
    console.log(`ffmpeg unavailable or failed; saved ${webmOut}`);
  }
}
