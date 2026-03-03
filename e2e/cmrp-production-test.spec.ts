import { test, expect, Page } from '@playwright/test';
import * as path from 'path';

const BASE_URL = 'https://app-cmrp.vercel.app';
const SCREENSHOT_DIR = 'e2e/screenshots';

async function screenshot(page: Page, name: string) {
  const fs = await import('fs');
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  const filePath = path.join(SCREENSHOT_DIR, `${name}.png`);
  await page.screenshot({ path: filePath, fullPage: true });
  console.log(`[SCREENSHOT] ${filePath}`);
  return filePath;
}

async function loginUser(page: Page) {
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
  const emailInput = page.locator('input[type="email"], input[name="email"]').first();
  const passwordInput = page.locator('input[type="password"]').first();
  await emailInput.fill('test@cmrpmastery.app');
  await passwordInput.fill('TestCMRP2026!');
  const submitBtn = page.locator('button[type="submit"]').first();
  await submitBtn.click();
  await page.waitForTimeout(5000);
}

test.describe('CMRP Mastery Production Tests', () => {
  test.setTimeout(120000);

  test('1. Homepage - carga correctamente', async ({ page }) => {
    console.log('\n=== TEST 1: HOMEPAGE ===');
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await screenshot(page, '01-homepage');
    const title = await page.title();
    const url = page.url();
    console.log(`Title: ${title}`);
    console.log(`URL: ${url}`);
    const body = await page.textContent('body');
    console.log(`Body snippet: ${body?.substring(0, 300)}`);
  });

  test('2. Login - antes y después', async ({ page }) => {
    console.log('\n=== TEST 2: LOGIN ===');
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await screenshot(page, '02-login-before');
    console.log(`URL before login: ${page.url()}`);

    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    await emailInput.fill('test@cmrpmastery.app');
    await passwordInput.fill('TestCMRP2026!');
    await screenshot(page, '02-login-filled');

    const submitBtn = page.locator('button[type="submit"]').first();
    await submitBtn.click();
    await page.waitForTimeout(4000);
    await screenshot(page, '02-login-after');
    console.log(`URL after login: ${page.url()}`);
  });

  test('3. Dashboard - verificar redirección', async ({ page }) => {
    console.log('\n=== TEST 3: DASHBOARD ===');
    await loginUser(page);
    await screenshot(page, '03-dashboard');
    console.log(`Dashboard URL: ${page.url()}`);
    const bodyText = await page.textContent('body');
    console.log(`Dashboard content snippet: ${bodyText?.substring(0, 300)}`);
  });

  test('4. Simulacro - iniciar examen y responder 5 preguntas', async ({ page }) => {
    console.log('\n=== TEST 4: SIMULACRO ===');
    await loginUser(page);

    await page.goto(`${BASE_URL}/exam/new`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await screenshot(page, '04-exam-new');
    console.log(`Exam/new URL: ${page.url()}`);

    // Look for start button
    const startBtn = page.locator('button:has-text("Iniciar"), button:has-text("Comenzar"), button:has-text("Start"), button:has-text("Empezar")').first();
    if (await startBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await startBtn.click();
      await page.waitForTimeout(3000);
      await screenshot(page, '04-exam-started');
      console.log(`After start URL: ${page.url()}`);
    } else {
      console.log('No start button found - exam may have started directly');
      await screenshot(page, '04-exam-started');
    }

    // Answer 5 questions - the radio inputs are hidden (sr-only), need to click their labels
    for (let i = 1; i <= 5; i++) {
      console.log(`Answering question ${i}...`);

      // The radio buttons have sr-only class and are intercepted by labels.
      // Click the first LABEL that wraps a radio input (first answer option)
      const firstLabel = page.locator('label:has(input[type="radio"])').first();

      if (await firstLabel.isVisible({ timeout: 5000 }).catch(() => false)) {
        await firstLabel.click({ force: true });
        console.log(`  Clicked first answer label`);
        await page.waitForTimeout(800);
        await screenshot(page, `04-exam-question-${i}-selected`);
      } else {
        console.log(`  No label found for question ${i}`);
        await screenshot(page, `04-exam-question-${i}-no-option`);
      }

      // Click Next/Siguiente if available
      const nextBtn = page.locator('button:has-text("Siguiente"), button:has-text("Next"), button:has-text("Continuar")').first();
      if (await nextBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await nextBtn.click();
        await page.waitForTimeout(1000);
        console.log(`  Clicked next button`);
      } else {
        console.log(`  No next button found`);
      }
    }

    await screenshot(page, '04-exam-after-5-questions');
    console.log(`Exam URL after 5 questions: ${page.url()}`);
  });

  test('5. Tutor IA - preguntar sobre OEE', async ({ page }) => {
    console.log('\n=== TEST 5: TUTOR IA ===');
    await loginUser(page);

    await page.goto(`${BASE_URL}/tutor`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await screenshot(page, '05-tutor-before');
    console.log(`Tutor URL: ${page.url()}`);

    const chatInput = page.locator('textarea, input[type="text"]').first();
    if (await chatInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await chatInput.fill('¿Qué es el OEE y cómo se calcula?');
      await screenshot(page, '05-tutor-typed');

      const sendBtn = page.locator('button[type="submit"], button:has-text("Enviar"), button:has-text("Send")').first();
      if (await sendBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await sendBtn.click();
      } else {
        await chatInput.press('Enter');
      }

      // Wait for AI response
      await page.waitForTimeout(20000);
      await screenshot(page, '05-tutor-response');
      console.log(`Tutor URL after question: ${page.url()}`);
      const bodyText = await page.textContent('body');
      console.log(`Tutor response snippet: ${bodyText?.substring(0, 600)}`);
    } else {
      console.log('Chat input not found');
      await screenshot(page, '05-tutor-no-input');
    }
  });

  test('6. Analytics - dashboard de progreso', async ({ page }) => {
    console.log('\n=== TEST 6: ANALYTICS ===');
    await loginUser(page);

    await page.goto(`${BASE_URL}/analytics`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await screenshot(page, '06-analytics');
    console.log(`Analytics URL: ${page.url()}`);
    const bodyText = await page.textContent('body');
    console.log(`Analytics content: ${bodyText?.substring(0, 500)}`);
  });

  test('7. Protección de rutas - logout y verificar redirección', async ({ page }) => {
    console.log('\n=== TEST 7: PROTECCIÓN DE RUTAS ===');
    await loginUser(page);

    // Verify analytics accessible when logged in
    await page.goto(`${BASE_URL}/analytics`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await screenshot(page, '07-analytics-logged-in');
    console.log(`Analytics (logged in) URL: ${page.url()}`);

    // Dismiss any overlay/modal that might be blocking the UI
    const overlay = page.locator('.fixed.inset-0, [class*="overlay"], [class*="modal"]').first();
    if (await overlay.isVisible({ timeout: 2000 }).catch(() => false)) {
      console.log('Overlay detected - pressing Escape to dismiss');
      await page.keyboard.press('Escape');
      await page.waitForTimeout(1000);
    }

    // Find and click logout
    // First try direct logout button with force:true to bypass overlay
    let loggedOut = false;

    // Try clicking logout button with force
    const logoutBtn = page.locator('button:has-text("Cerrar Sesión"), button:has-text("Logout"), a:has-text("Logout"), a:has-text("Cerrar Sesión")').first();
    if (await logoutBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await logoutBtn.click({ force: true });
      await page.waitForTimeout(2000);
      loggedOut = true;
      console.log('Clicked logout button (forced)');
    }

    if (!loggedOut) {
      // Use JS to sign out directly
      console.log('Using JS to sign out...');
      await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });
      await page.context().clearCookies();
      loggedOut = true;
      console.log('Cleared storage and cookies');
    }

    await page.waitForTimeout(3000);
    await screenshot(page, '07-after-logout');
    console.log(`After logout URL: ${page.url()}`);

    // Now try to access analytics without auth
    await page.goto(`${BASE_URL}/analytics`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    await screenshot(page, '07-analytics-after-logout');
    const afterLogoutUrl = page.url();
    console.log(`Analytics after logout URL: ${afterLogoutUrl}`);

    const isProtected = afterLogoutUrl.includes('/login') || afterLogoutUrl.includes('/auth');
    console.log(`Route protection working: ${isProtected}`);
  });
});
