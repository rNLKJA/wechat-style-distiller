import { chromium } from '@playwright/test';
import { promises as fs } from 'fs';
import path from 'path';

const BASE_URL = process.env.BASE_URL || 'https://wechat-style-distiller-demo.vercel.app';
const showcaseDir = path.join(process.cwd(), '.showcase');
const docsShowcaseDir = path.join(process.cwd(), '..', 'docs', 'showcase');

// Ensure directories exist
await fs.mkdir(showcaseDir, { recursive: true });
await fs.mkdir(docsShowcaseDir, { recursive: true });

// Helper to add caption overlay
async function addCaption(page, text, step) {
  await page.evaluate(
    ({ text, step }) => {
      const existing = document.getElementById('showcase-caption');
      if (existing) existing.remove();

      const caption = document.createElement('div');
      caption.id = 'showcase-caption';
      caption.style.cssText = `
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        background: rgba(0, 0, 0, 0.85);
        color: white;
        padding: 16px 24px;
        font-family: system-ui, -apple-system, sans-serif;
        font-size: 16px;
        font-weight: 500;
        z-index: 999999;
        box-shadow: 0 -4px 16px rgba(0, 0, 0, 0.3);
      `;
      caption.innerHTML = `<span style="color: #07c160; font-weight: 600;">Step ${step}:</span> ${text}`;
      document.body.appendChild(caption);
    },
    { text, step }
  );
}

async function removeCaption(page) {
  await page.evaluate(() => {
    const caption = document.getElementById('showcase-caption');
    if (caption) caption.remove();
  });
}

async function captureScreenshot(page, name, width = 1440, height = 900) {
  await page.setViewportSize({ width, height });
  const filepath = path.join(docsShowcaseDir, name);
  await page.screenshot({ path: filepath, fullPage: false });
  console.log(`✓ Screenshot: ${name}`);
  return filepath;
}

console.log('Starting showcase capture...\n');

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const context = await browser.newContext({
  recordVideo: {
    dir: showcaseDir,
    size: { width: 1280, height: 800 },
  },
});

// === SCREENSHOTS ===
console.log('📸 Capturing screenshots...\n');

// Landing page - light mode
let page = await context.newPage();
await page.emulateMedia({ colorScheme: 'light' });
await page.goto(BASE_URL);
await page.waitForLoadState('networkidle');
await captureScreenshot(page, '01-landing-light.png');
await page.close();

// Landing page - dark mode
page = await context.newPage();
await page.emulateMedia({ colorScheme: 'dark' });
await page.goto(BASE_URL);
await page.waitForLoadState('networkidle');
await captureScreenshot(page, '01-landing-dark.png');
await page.close();

// Personas gallery
page = await context.newPage();
await page.emulateMedia({ colorScheme: 'light' });
await page.goto(`${BASE_URL}/personas`);
await page.waitForLoadState('networkidle');
await captureScreenshot(page, '02-personas-gallery.png');
await page.close();

// Persona detail
page = await context.newPage();
await page.emulateMedia({ colorScheme: 'light' });
await page.goto(`${BASE_URL}/personas`);
await page.waitForLoadState('networkidle');
const firstPersona = page.locator('a[href*="/personas/"]').first();
const personaHref = await firstPersona.getAttribute('href');
await page.goto(`${BASE_URL}${personaHref}`);
await page.waitForLoadState('networkidle');
await captureScreenshot(page, '03-persona-detail.png');
await page.close();

// Features page
page = await context.newPage();
await page.emulateMedia({ colorScheme: 'light' });
await page.goto(`${BASE_URL}/features`);
await page.waitForLoadState('networkidle');
await captureScreenshot(page, '04-features.png');
await page.close();

// Validation page
page = await context.newPage();
await page.emulateMedia({ colorScheme: 'light' });
await page.goto(`${BASE_URL}/validation`);
await page.waitForLoadState('networkidle');
await captureScreenshot(page, '05-validation.png');
await page.close();

// Privacy page
page = await context.newPage();
await page.emulateMedia({ colorScheme: 'light' });
await page.goto(`${BASE_URL}/privacy`);
await page.waitForLoadState('networkidle');
await captureScreenshot(page, '06-privacy.png');
await page.close();

// AI audit log
page = await context.newPage();
await page.emulateMedia({ colorScheme: 'light' });
await page.goto(`${BASE_URL}/ai-log`);
await page.waitForLoadState('networkidle');
await captureScreenshot(page, '07-ai-log.png');
await page.close();

// Mobile screenshots
page = await context.newPage();
await page.emulateMedia({ colorScheme: 'light' });
await page.goto(BASE_URL);
await page.waitForLoadState('networkidle');
await page.setViewportSize({ width: 390, height: 844 });
await page.screenshot({
  path: path.join(docsShowcaseDir, '08-mobile-landing.png'),
  deviceScaleFactor: 2,
});
console.log('✓ Screenshot: 08-mobile-landing.png');

await page.goto(`${BASE_URL}/personas`);
await page.waitForLoadState('networkidle');
await page.screenshot({
  path: path.join(docsShowcaseDir, '09-mobile-personas.png'),
  deviceScaleFactor: 2,
});
console.log('✓ Screenshot: 09-mobile-personas.png');
await page.close();

// === VIDEO WORKFLOWS ===
console.log('\n🎥 Recording video workflows...\n');

// Workflow 1: Explore Personas
console.log('Recording: Explore Personas...');
page = await context.newPage();
await page.setViewportSize({ width: 1280, height: 800 });

await addCaption(page, 'Welcome to WeChat Style Distiller', 1);
await page.goto(BASE_URL);
await page.waitForLoadState('networkidle');
await page.waitForTimeout(2500);

await addCaption(page, 'Navigate to the persona gallery', 2);
await page.waitForTimeout(1000);
await page.getByRole('link', { name: /Explore Personas/i }).click();
await page.waitForLoadState('networkidle');
await page.waitForTimeout(2000);

await addCaption(page, 'Browse synthetic personas with varied linguistic styles', 3);
await page.waitForTimeout(2000);

const personaCards = page.locator('a[href*="/personas/"]').filter({ hasText: /./ });
await addCaption(page, 'Open a persona to see detailed profile', 4);
await page.waitForTimeout(1000);
await personaCards.first().click();
await page.waitForLoadState('networkidle');
await page.waitForTimeout(2000);

await addCaption(page, 'View linguistic features and statistics', 5);
await page.evaluate(() => window.scrollTo({ top: 400, behavior: 'smooth' }));
await page.waitForTimeout(2000);

await addCaption(page, 'See the generated persona prompt for LLMs', 6);
await page.evaluate(() => window.scrollTo({ top: 800, behavior: 'smooth' }));
await page.waitForTimeout(2500);

await removeCaption(page);
await page.waitForTimeout(500);
await page.close();
console.log('✓ Video recorded: 01-explore-personas.webm');

// Workflow 2: Chat Like a Persona (BYOK showcase)
console.log('Recording: Chat Like a Persona...');
page = await context.newPage();
await page.setViewportSize({ width: 1280, height: 800 });

await addCaption(page, 'Navigate to persona tuner for interactive testing', 1);
await page.goto(`${BASE_URL}/persona-tuner`);
await page.waitForLoadState('networkidle');
await page.waitForTimeout(2500);

await addCaption(page, 'BYOK architecture - paste your own API key', 2);
await page.waitForTimeout(2500);

await addCaption(page, 'All AI interactions are client-side only', 3);
await page.waitForTimeout(2000);

await addCaption(page, 'Navigate to AI audit log for transparency', 4);
await page.waitForTimeout(1000);
await page.goto(`${BASE_URL}/ai-log`);
await page.waitForLoadState('networkidle');
await page.waitForTimeout(2000);

await addCaption(page, 'Every AI call is logged with full details', 5);
await page.evaluate(() => window.scrollTo({ top: 300, behavior: 'smooth' }));
await page.waitForTimeout(2500);

await removeCaption(page);
await page.waitForTimeout(500);
await page.close();
console.log('✓ Video recorded: 02-chat-persona.webm');

// Workflow 3: Privacy & Governance
console.log('Recording: Privacy & Governance...');
page = await context.newPage();
await page.setViewportSize({ width: 1280, height: 800 });

await addCaption(page, 'Navigate to privacy threat model', 1);
await page.goto(`${BASE_URL}/privacy`);
await page.waitForLoadState('networkidle');
await page.waitForTimeout(2500);

await addCaption(page, 'Review comprehensive threat analysis', 2);
await page.evaluate(() => window.scrollTo({ top: 400, behavior: 'smooth' }));
await page.waitForTimeout(2000);
await page.evaluate(() => window.scrollTo({ top: 800, behavior: 'smooth' }));
await page.waitForTimeout(2000);

await addCaption(page, 'Navigate to feature validation with confidence intervals', 3);
await page.waitForTimeout(1000);
await page.goto(`${BASE_URL}/validation`);
await page.waitForLoadState('networkidle');
await page.waitForTimeout(2000);

await addCaption(page, 'Statistical rigor: bootstrap CIs, inter-persona variance', 4);
await page.evaluate(() => window.scrollTo({ top: 400, behavior: 'smooth' }));
await page.waitForTimeout(2500);

await addCaption(page, 'Navigate to methodology and decision records', 5);
await page.waitForTimeout(1000);
await page.goto(`${BASE_URL}/methods`);
await page.waitForLoadState('networkidle');
await page.waitForTimeout(2000);

await addCaption(page, 'Full methodology, assumptions, and limitations', 6);
await page.evaluate(() => window.scrollTo({ top: 400, behavior: 'smooth' }));
await page.waitForTimeout(2000);

await addCaption(page, 'View architectural decision records', 7);
await page.waitForTimeout(1000);
await page.goto(`${BASE_URL}/decisions`);
await page.waitForLoadState('networkidle');
await page.waitForTimeout(2000);

await addCaption(page, 'Detailed rationale and outcomes for key decisions', 8);
await page.waitForTimeout(2000);

await removeCaption(page);
await page.waitForTimeout(500);
await page.close();
console.log('✓ Video recorded: 03-privacy-governance.webm');

await context.close();
await browser.close();

console.log('\n✅ Showcase capture complete!');
console.log(`\nScreenshots saved to: ${docsShowcaseDir}`);
console.log(`Videos saved to: ${showcaseDir}`);
console.log('\nNext: Process videos with ffmpeg (convert to MP4/GIF)');
