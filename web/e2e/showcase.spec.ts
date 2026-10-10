import { test, expect, type Page } from '@playwright/test';
import path from 'path';

const BASE_URL = process.env.BASE_URL || 'https://wechat-style-distiller-demo.vercel.app';

// Helper to add caption overlay to the page
async function addCaption(page: Page, text: string, step: number) {
  await page.evaluate(
    ({ text, step }) => {
      // Remove existing caption if any
      const existing = document.getElementById('showcase-caption');
      if (existing) {
        existing.remove();
      }

      // Create caption banner
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
        backdrop-filter: blur(8px);
      `;
      caption.innerHTML = `<span style="color: #07c160; font-weight: 600;">Step ${step}:</span> ${text}`;
      document.body.appendChild(caption);

      // Add cursor highlight
      const cursor = document.createElement('div');
      cursor.id = 'showcase-cursor';
      cursor.style.cssText = `
        position: fixed;
        width: 24px;
        height: 24px;
        border: 3px solid #07c160;
        border-radius: 50%;
        pointer-events: none;
        z-index: 999998;
        transition: all 0.1s ease;
        display: none;
      `;
      document.body.appendChild(cursor);

      // Track mouse for cursor highlight
      document.addEventListener('mousemove', (e) => {
        const cursor = document.getElementById('showcase-cursor');
        if (cursor) {
          cursor.style.display = 'block';
          cursor.style.left = `${e.clientX - 12}px`;
          cursor.style.top = `${e.clientY - 12}px`;
        }
      });
    },
    { text, step }
  );
}

// Helper to remove caption
async function removeCaption(page: Page) {
  await page.evaluate(() => {
    const caption = document.getElementById('showcase-caption');
    const cursor = document.getElementById('showcase-cursor');
    if (caption) caption.remove();
    if (cursor) cursor.remove();
  });
}

test.describe('Showcase Tour', () => {
  test('01 - Explore Personas', async ({ page, context }) => {
    const videoPath = path.join(__dirname, '../.showcase/01-explore-personas.webm');
    await context.tracing.start({ screenshots: true, snapshots: true });

    // Start recording
    const videoContext = await page.context().newPage();
    await videoContext.setViewportSize({ width: 1280, height: 800 });
    await videoContext.video()?.path();
    await videoContext.close();

    await page.setViewportSize({ width: 1280, height: 800 });

    // Step 1: Landing page
    await addCaption(page, 'Welcome to WeChat Style Distiller', 1);
    await page.goto(BASE_URL);
    await expect(page.locator('h1')).toContainText('WeChat Style Distiller');
    await page.waitForTimeout(2000);

    // Step 2: Navigate to personas
    await addCaption(page, 'Navigate to the persona gallery', 2);
    await page.waitForTimeout(1000);
    await page.getByRole('link', { name: 'Explore Personas' }).click();
    await expect(page).toHaveURL(/\/personas/);
    await page.waitForTimeout(2000);

    // Step 3: Browse personas
    await addCaption(page, 'Browse the synthetic persona collection', 3);
    await page.waitForTimeout(1000);
    const personaCards = page.locator('a[href*="/personas/"]').filter({ hasText: /Persona/ });
    const count = await personaCards.count();
    expect(count).toBeGreaterThanOrEqual(4);
    await page.waitForTimeout(2000);

    // Step 4: Open first persona
    await addCaption(page, 'Open a persona to see detailed profile', 4);
    await page.waitForTimeout(1000);
    await personaCards.first().click();
    await expect(page).toHaveURL(/\/personas\/[^/]+$/);
    await page.waitForTimeout(2000);

    // Step 5: View profile
    await addCaption(page, 'View linguistic features and statistics', 5);
    await page.waitForTimeout(1000);
    await page.evaluate(() => window.scrollTo(0, 400));
    await page.waitForTimeout(2000);

    // Step 6: View persona prompt
    await addCaption(page, 'See the generated persona prompt for LLMs', 6);
    await page.evaluate(() => window.scrollTo(0, 800));
    await page.waitForTimeout(2000);

    // Step 7: Go back to gallery
    await addCaption(page, 'Return to gallery to compare personas', 7);
    await page.waitForTimeout(1000);
    await page.goBack();
    await page.waitForTimeout(1500);

    // Step 8: Open another persona
    await addCaption(page, 'Compare with another persona', 8);
    await page.waitForTimeout(1000);
    await personaCards.nth(1).click();
    await page.waitForTimeout(2000);
    await page.evaluate(() => window.scrollTo(0, 400));
    await page.waitForTimeout(2000);

    await removeCaption(page);
    await page.waitForTimeout(500);

    await context.tracing.stop();
  });

  test('02 - Chat Like a Persona', async ({ page, context }) => {
    await context.tracing.start({ screenshots: true, snapshots: true });
    await page.setViewportSize({ width: 1280, height: 800 });

    // Step 1: Navigate to persona tuner
    await addCaption(page, 'Navigate to the persona tuner', 1);
    await page.goto(`${BASE_URL}/persona-tuner`);
    await page.waitForTimeout(2000);

    // Step 2: Show BYOK dialog
    await addCaption(page, 'BYOK (Bring Your Own Key) dialog - API key required', 2);
    await page.waitForTimeout(1000);
    const settingsButton = page.getByRole('button', { name: /settings|api/i }).first();
    if (await settingsButton.isVisible().catch(() => false)) {
      await settingsButton.click();
      await page.waitForTimeout(2000);
    }

    // Step 3: Explain no live demo
    await addCaption(page, 'Live demo requires your own API key (not shown)', 3);
    await page.waitForTimeout(2500);

    // Step 4: Show audit log page
    await addCaption(page, 'Navigate to AI audit log for transparency', 4);
    await page.waitForTimeout(1000);
    await page.goto(`${BASE_URL}/ai-log`);
    await page.waitForTimeout(2000);

    // Step 5: Show audit features
    await addCaption(page, 'All AI calls are logged with full transparency', 5);
    await page.waitForTimeout(1000);
    await page.evaluate(() => window.scrollTo(0, 300));
    await page.waitForTimeout(2000);

    await removeCaption(page);
    await page.waitForTimeout(500);

    await context.tracing.stop();
  });

  test('03 - Privacy and Governance', async ({ page, context }) => {
    await context.tracing.start({ screenshots: true, snapshots: true });
    await page.setViewportSize({ width: 1280, height: 800 });

    // Step 1: Navigate to privacy page
    await addCaption(page, 'Navigate to the privacy threat model', 1);
    await page.goto(`${BASE_URL}/privacy`);
    await page.waitForTimeout(2000);

    // Step 2: Review threat model
    await addCaption(page, 'Review comprehensive threat analysis', 2);
    await page.waitForTimeout(1000);
    await page.evaluate(() => window.scrollTo(0, 400));
    await page.waitForTimeout(2000);
    await page.evaluate(() => window.scrollTo(0, 800));
    await page.waitForTimeout(2000);

    // Step 3: Navigate to validation
    await addCaption(page, 'Navigate to feature validation results', 3);
    await page.waitForTimeout(1000);
    await page.goto(`${BASE_URL}/validation`);
    await page.waitForTimeout(2000);

    // Step 4: Review validation with CIs
    await addCaption(page, 'Statistical validation with confidence intervals', 4);
    await page.waitForTimeout(1000);
    await page.evaluate(() => window.scrollTo(0, 400));
    await page.waitForTimeout(2000);

    // Step 5: Navigate to methods
    await addCaption(page, 'Navigate to methodology and decision records', 5);
    await page.waitForTimeout(1000);
    await page.goto(`${BASE_URL}/methods`);
    await page.waitForTimeout(2000);

    // Step 6: Review methodology
    await addCaption(page, 'Review complete methodology and assumptions', 6);
    await page.waitForTimeout(1000);
    await page.evaluate(() => window.scrollTo(0, 400));
    await page.waitForTimeout(2000);

    // Step 7: Navigate to decision records
    await addCaption(page, 'View architectural decision records', 7);
    await page.waitForTimeout(1000);
    await page.goto(`${BASE_URL}/decisions`);
    await page.waitForTimeout(2000);

    // Step 8: Open a decision record
    await addCaption(page, 'Read detailed decision rationale and outcomes', 8);
    await page.waitForTimeout(1000);
    const firstDR = page.locator('a[href*="/decisions/"]').first();
    if (await firstDR.isVisible().catch(() => false)) {
      await firstDR.click();
      await page.waitForTimeout(2000);
      await page.evaluate(() => window.scrollTo(0, 400));
      await page.waitForTimeout(2000);
    }

    await removeCaption(page);
    await page.waitForTimeout(500);

    await context.tracing.stop();
  });
});
