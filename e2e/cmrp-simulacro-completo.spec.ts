import { test } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const SCREENSHOTS_DIR = path.join(__dirname, '..', 'tmp-screenshots');
const BASE_URL = 'http://localhost:3000';

function ensureDir() {
  if (!fs.existsSync(SCREENSHOTS_DIR)) {
    fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
  }
}

test('CMRP Simulacro Completo - 110 preguntas + Analytics', async ({ page }) => {
  ensureDir();
  test.setTimeout(600000); // 10 minutos

  // =====================
  // PASO 1 - Login
  // =====================
  console.log('\n=== PASO 1: LOGIN ===');
  await page.goto(`${BASE_URL}/login`);
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '01-login-page.png'), fullPage: true });

  await page.locator('input[type="email"]').first().fill('test@cmrpmastery.app');
  await page.locator('input[type="password"]').first().fill('TestCMRP2026!');
  await page.locator('button[type="submit"]').first().click();

  await page.waitForURL((url) => !url.href.includes('/login'), { timeout: 15000 });
  await page.waitForLoadState('networkidle');

  const afterLoginUrl = page.url();
  console.log('URL after login:', afterLoginUrl);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '02-after-login.png'), fullPage: true });

  // =====================
  // PASO 2 - Página nuevo examen
  // =====================
  console.log('\n=== PASO 2: EXAM/NEW ===');
  await page.goto(`${BASE_URL}/exam/new`);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '03-exam-new.png'), fullPage: true });

  // =====================
  // PASO 3 - Iniciar examen
  // =====================
  console.log('\n=== PASO 3: INICIAR EXAMEN ===');

  await page.locator('button[type="submit"]:has-text("Iniciar Simulacro")').click();
  await page.waitForURL((url) => /\/exam\/[0-9a-f-]{36}/.test(url.href), { timeout: 30000 });
  await page.waitForTimeout(4000); // let exam fully load and React hydrate

  const examUrl = page.url();
  console.log('URL after starting exam:', examUrl);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '04-exam-started.png'), fullPage: true });

  const isOnExam = /\/exam\/[0-9a-f-]{36}/.test(examUrl);
  console.log('On exam session page?', isOnExam);
  if (!isOnExam) {
    console.log('ERROR: Not on exam page. URL:', examUrl);
    return;
  }

  // =====================
  // PASO 4 - Responder 110 preguntas
  // =====================
  console.log('\n=== PASO 4: RESPONDIENDO 110 PREGUNTAS ===');
  console.log('Strategy: Use sidebar navigation buttons + click first radio option');

  const TOTAL = 110;
  let successCount = 0;

  // Use a helper to click the first option using the radiogroup
  // and then navigate using "Siguiente →" for sequential flow
  // OR use the sidebar nav buttons (aria-label="Ir a pregunta N — unanswered")

  for (let qNum = 1; qNum <= TOTAL; qNum++) {
    // Navigate using sidebar button (only works if sidebar is rendered, which it is on desktop)
    // Sidebar button has aria-label pattern: "Ir a pregunta N — unanswered" or "Ir a pregunta N — answered"
    if (qNum > 1) {
      // Use sidebar navigation button
      // aria-label contains "Ir a pregunta {qNum}"
      const navBtn = page.locator(`button[aria-label*="Ir a pregunta ${qNum} —"]`).first();
      if (await navBtn.count() > 0) {
        await navBtn.click();
      } else {
        // Fallback: click Siguiente →
        const sigBtn = page.locator('button').filter({ hasText: /Siguiente →/ }).first();
        if (await sigBtn.count() > 0) {
          const isDisabled = await sigBtn.isDisabled().catch(() => false);
          if (!isDisabled) {
            await sigBtn.click();
          }
        }
      }
      // Very brief wait for UI to update
      await page.waitForTimeout(80);
    }

    // Click option A: first label in the radiogroup
    const radiogroup = page.locator('[role="radiogroup"]').first();
    if (await radiogroup.count() > 0) {
      const firstLabel = radiogroup.locator('label').first();
      await firstLabel.click({ force: true }).catch(() => {
        // ignore click errors
      });
      successCount++;
    } else {
      // Fallback: click first visible radio input
      const radios = page.locator('input[type="radio"]');
      if (await radios.count() > 0) {
        await radios.first().click({ force: true }).catch(() => {});
        successCount++;
      }
    }

    // Periodic logging and screenshots
    if (qNum % 25 === 0 || qNum === 1 || qNum === TOTAL) {
      console.log(`Progress: ${qNum}/${TOTAL}`);
      if (qNum === 1 || qNum === 50 || qNum === TOTAL) {
        await page.screenshot({
          path: path.join(SCREENSHOTS_DIR, `05-q${String(qNum).padStart(3, '0')}.png`),
          fullPage: false
        });
        console.log(`Screenshot at Q${qNum}`);
      }
    }
  }

  console.log(`\nAnswering complete. Successful clicks: ${successCount}/${TOTAL}`);
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '06-all-answered.png'), fullPage: true });
  console.log('Screenshot: 06-all-answered.png');

  // Read the current page answered count for verification
  const pageBodyText = await page.locator('body').innerText();
  const answeredMatch = pageBodyText.match(/(\d+)\s*\/\s*110\s*respondidas?/i);
  if (answeredMatch) {
    console.log(`Page shows: ${answeredMatch[0]}`);
  }

  // =====================
  // PASO 5 - Enviar examen
  // =====================
  console.log('\n=== PASO 5: ENVIAR EXAMEN ===');

  // Click "Entregar examen" button
  const entregarBtn = page.locator('button').filter({ hasText: /Entregar examen/ }).first();
  if (await entregarBtn.count() > 0) {
    console.log('Clicking "Entregar examen"...');
    await entregarBtn.click();
  } else {
    // Fallback: look for any entregar button
    const allBtns = await page.locator('button').all();
    let found = false;
    for (const btn of allBtns) {
      const txt = await btn.innerText().catch(() => '');
      const vis = await btn.isVisible().catch(() => false);
      if (vis && txt.includes('Entregar')) {
        await btn.click();
        found = true;
        console.log('Found Entregar via fallback:', txt.trim());
        break;
      }
    }
    if (!found) {
      console.log('ERROR: Entregar button not found');
      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'debug-no-entregar.png'), fullPage: true });
    }
  }

  // Wait for confirmation modal
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '07-confirm-modal.png'), fullPage: true });
  console.log('Screenshot: 07-confirm-modal.png');

  // Click "Sí, entregar" in the modal
  const confirmBtn = page.locator('button').filter({ hasText: /Sí, entregar/ }).first();
  if (await confirmBtn.count() > 0) {
    console.log('Clicking "Sí, entregar"...');
    await confirmBtn.click();
  } else {
    // Debug
    console.log('Sí, entregar button not found. Visible buttons:');
    const btns = await page.locator('button').all();
    for (const btn of btns) {
      const txt = await btn.innerText().catch(() => '');
      const vis = await btn.isVisible().catch(() => false);
      if (vis) console.log(' -', JSON.stringify(txt.trim()));
    }
  }

  // Wait for results page
  console.log('Waiting for results...');
  try {
    await page.waitForURL((url) => url.href.includes('/results'), { timeout: 25000 });
    console.log('Navigated to results!');
  } catch (_e) {
    console.log('Timeout - current URL:', page.url());
  }

  await page.waitForTimeout(3000);
  const resultsUrl = page.url();
  console.log('Results URL:', resultsUrl);

  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '08-results.png'), fullPage: true });
  console.log('Screenshot: 08-results.png');

  const resultsText = await page.locator('body').innerText();
  console.log('\n=== RESULTADOS ===');
  console.log(resultsText.substring(0, 2500));

  // =====================
  // PASO 6 - Analytics
  // =====================
  console.log('\n=== PASO 6: ANALYTICS ===');
  await page.goto(`${BASE_URL}/analytics`);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(3000);

  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '09-analytics.png'), fullPage: true });
  console.log('Screenshot: 09-analytics.png');

  const analyticsText = await page.locator('body').innerText();
  console.log('\n=== ANALYTICS PAGE ===');
  console.log(analyticsText.substring(0, 3000));

  // Scroll mid
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '10-analytics-mid.png'), fullPage: false });

  // Scroll bottom
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '11-analytics-bottom.png'), fullPage: false });

  console.log('\n=== SIMULACRO COMPLETADO ===');
  console.log('Screenshots saved to:', SCREENSHOTS_DIR);
});
