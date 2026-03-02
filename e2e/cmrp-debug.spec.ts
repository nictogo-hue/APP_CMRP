import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const SCREENSHOTS_DIR = path.join(__dirname, '..', 'tmp-screenshots');
const BASE_URL = 'http://localhost:3000';

function ensureDir() {
  if (!fs.existsSync(SCREENSHOTS_DIR)) {
    fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
  }
}

test('CMRP Debug - Exam flow investigation', async ({ page }) => {
  ensureDir();
  test.setTimeout(120000);

  // Login
  console.log('\n=== PASO 1: LOGIN ===');
  await page.goto(`${BASE_URL}/login`);
  await page.waitForLoadState('networkidle');

  await page.locator('input[type="email"]').first().fill('test@cmrpmastery.app');
  await page.locator('input[type="password"]').first().fill('TestCMRP2026!');
  await page.locator('button[type="submit"]').first().click();

  await page.waitForURL((url) => !url.href.includes('/login'), { timeout: 15000 });
  await page.waitForLoadState('networkidle');
  console.log('After login URL:', page.url());

  // Check cookies
  const cookies = await page.context().cookies();
  console.log('Cookies after login:', cookies.map(c => `${c.name}=${c.value.substring(0, 30)}...`).join(', '));

  // Navigate to exam/new
  await page.goto(`${BASE_URL}/exam/new`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);
  console.log('exam/new URL:', page.url());

  // Check cookies again
  const cookies2 = await page.context().cookies();
  console.log('Cookies at exam/new:', cookies2.length, 'cookies');

  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'debug-01-exam-new.png'), fullPage: true });

  // Get the full page HTML structure
  const pageText = await page.locator('body').innerText();
  console.log('Page text:', pageText.substring(0, 600));

  // Find all buttons
  const allButtons = await page.locator('button').all();
  console.log('All buttons:');
  for (const btn of allButtons) {
    const txt = await btn.innerText().catch(() => '');
    const vis = await btn.isVisible().catch(() => false);
    const type = await btn.getAttribute('type').catch(() => '');
    console.log(`  [${type}] visible=${vis} text="${txt.substring(0, 60)}"`);
  }

  // Check if tour overlay is present
  const tourOverlay = await page.locator('[class*="z-[9999]"], .fixed.inset-0.z-').count();
  console.log('Tour overlay count:', tourOverlay);

  // Check if there's a specific tour button
  const tourBtns = await page.locator('[data-tour], [class*="tour"]').count();
  console.log('Tour-related elements:', tourBtns);

  // Take screenshot before clicking
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'debug-02-before-click.png'), fullPage: true });

  // Listen for navigation events
  page.on('request', (req) => {
    if (!req.url().includes('/_next/') && !req.url().includes('favicon') && !req.url().includes('.png') && !req.url().includes('.js')) {
      console.log('REQUEST:', req.method(), req.url().substring(0, 100));
    }
  });

  page.on('response', (res) => {
    if (!res.url().includes('/_next/') && !res.url().includes('favicon') && !res.url().includes('.png') && !res.url().includes('.js')) {
      console.log('RESPONSE:', res.status(), res.url().substring(0, 100));
    }
  });

  // Click "Iniciar Simulacro"
  const iniciarBtn = page.locator('button:has-text("Iniciar Simulacro")').first();
  const count = await iniciarBtn.count();
  console.log('Iniciar Simulacro button count:', count);

  if (count > 0) {
    console.log('Clicking Iniciar Simulacro...');
    await iniciarBtn.click();
    await page.waitForTimeout(8000);
    console.log('URL after click:', page.url());
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'debug-03-after-click.png'), fullPage: true });

    const afterText = await page.locator('body').innerText();
    console.log('After click page text:', afterText.substring(0, 600));
  } else {
    console.log('ERROR: Button not found');
  }
});
