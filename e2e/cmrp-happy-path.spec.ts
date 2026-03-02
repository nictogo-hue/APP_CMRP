import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const SCREENSHOTS_DIR = path.join(__dirname, '..', 'tmp-screenshots');

function ensureDir() {
  if (!fs.existsSync(SCREENSHOTS_DIR)) {
    fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
  }
}

test('CMRP Happy Path - Complete Simulacro Flow', async ({ page }) => {
  ensureDir();

  // =====================
  // PASO 1 - Login
  // =====================
  console.log('\n=== PASO 1: LOGIN ===');
  await page.goto('http://localhost:3000/login');
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '01-login-page.png'), fullPage: true });
  console.log('Screenshot 01-login-page.png taken');

  // Fill credentials
  const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i], input[placeholder*="correo" i]').first();
  const passwordInput = page.locator('input[type="password"]').first();

  await emailInput.fill('test@cmrpmastery.app');
  await passwordInput.fill('TestCMRP2026!');

  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '02-login-filled.png'), fullPage: true });
  console.log('Screenshot 02-login-filled.png taken');

  // Click login button
  const loginBtn = page.locator('button[type="submit"], button:has-text("Iniciar"), button:has-text("Login"), button:has-text("Entrar")').first();
  await loginBtn.click();

  // Wait for navigation
  await page.waitForTimeout(3000);
  await page.waitForLoadState('networkidle');

  const afterLoginUrl = page.url();
  console.log('URL after login:', afterLoginUrl);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '03-after-login.png'), fullPage: true });
  console.log('Screenshot 03-after-login.png taken');

  const isOnDashboard = afterLoginUrl.includes('/dashboard') || afterLoginUrl.includes('/home') || afterLoginUrl === 'http://localhost:3000/' || (!afterLoginUrl.includes('/login'));
  console.log('Redirected away from login?', isOnDashboard);
  console.log('Current URL:', afterLoginUrl);

  // =====================
  // PASO 2 - Página de nuevo examen
  // =====================
  console.log('\n=== PASO 2: PÁGINA NUEVO EXAMEN ===');
  await page.goto('http://localhost:3000/exam/new');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '04-exam-new-page.png'), fullPage: true });
  console.log('Screenshot 04-exam-new-page.png taken');

  const pageTitle = await page.title();
  const bodyText = await page.locator('body').innerText();
  console.log('Page title:', pageTitle);

  const hasSimulacroTitle = bodyText.includes('Simulacro') || bodyText.includes('simulacro');
  const hasCMRP = bodyText.includes('CMRP');
  const hasReglas = bodyText.includes('regla') || bodyText.includes('Regla') || bodyText.includes('instrucción') || bodyText.includes('instrucciones');
  const hasPilares = bodyText.includes('pilar') || bodyText.includes('Pilar') || bodyText.includes('SMRP') || bodyText.includes('Asset');
  const hasIniciarBtn = bodyText.includes('Iniciar') || bodyText.includes('iniciar');

  console.log('Has "Simulacro" in content?', hasSimulacroTitle);
  console.log('Has "CMRP" in content?', hasCMRP);
  console.log('Has rules/instrucciones?', hasReglas);
  console.log('Has pilares/SMRP?', hasPilares);
  console.log('Has "Iniciar" button?', hasIniciarBtn);
  console.log('Full page text (first 1000 chars):', bodyText.substring(0, 1000));

  // =====================
  // PASO 3 - Iniciar el examen
  // =====================
  console.log('\n=== PASO 3: INICIAR EXAMEN ===');

  // Dismiss tour overlay if present (z-[9999] overlay intercepts clicks)
  const tourOverlay = page.locator('.fixed.inset-0[class*="z-"]').first();
  const tourOverlayCount = await tourOverlay.count();
  console.log('Tour overlay present?', tourOverlayCount > 0);

  // Try clicking "Saltar tour" or "Skip" button first
  const saltarBtn = page.locator('button:has-text("Saltar"), button:has-text("saltar"), button:has-text("Skip"), button:has-text("Cerrar tour")').first();
  const saltarCount = await saltarBtn.count();
  console.log('Saltar tour button found?', saltarCount > 0);
  if (saltarCount > 0) {
    await saltarBtn.click();
    await page.waitForTimeout(1000);
    console.log('Tour dismissed via Saltar button');
  } else {
    // Try pressing Escape to dismiss
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
    console.log('Tried Escape to dismiss overlay');
  }

  // Check if overlay is gone
  const overlayAfterDismiss = page.locator('[class*="z-[9999]"], .fixed.inset-0').first();
  await page.screenshot({ path: `${SCREENSHOTS_DIR}/04b-after-tour-dismiss.png`, fullPage: true });
  console.log('Screenshot 04b-after-tour-dismiss.png taken');

  const iniciarBtn = page.locator('button:has-text("Iniciar"), a:has-text("Iniciar"), button:has-text("Comenzar"), a:has-text("Comenzar")').first();
  const iniciarCount = await iniciarBtn.count();
  console.log('Iniciar button found?', iniciarCount > 0);

  if (iniciarCount > 0) {
    // Use force:true to click even if slightly obscured, or use JS click
    await iniciarBtn.click({ force: true });
    console.log('Clicked Iniciar button (force: true)');
    console.log('Clicked Iniciar button');
    await page.waitForTimeout(4000);
    await page.waitForLoadState('networkidle');

    const examUrl = page.url();
    console.log('URL after starting exam:', examUrl);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '05-exam-started.png'), fullPage: true });
    console.log('Screenshot 05-exam-started.png taken');

    const examBodyText = await page.locator('body').innerText();
    const hasPregunta = examBodyText.includes('pregunta') || examBodyText.includes('Pregunta') || examBodyText.includes('Question');
    const hasCronometro = examBodyText.includes(':') && (examBodyText.includes('min') || examBodyText.includes('seg') || /\d{1,2}:\d{2}/.test(examBodyText));
    const hasOpciones = examBodyText.includes('A)') || examBodyText.includes('B)') || examBodyText.includes('C)') || examBodyText.includes('D)') ||
                        examBodyText.includes('(A)') || examBodyText.includes('(B)');
    const hasProgressBar = await page.locator('[role="progressbar"], .progress, progress').count() > 0;

    console.log('Has pregunta?', hasPregunta);
    console.log('Has cronometro (time pattern)?', hasCronometro);
    console.log('Has opciones A/B/C/D?', hasOpciones);
    console.log('Has progress bar?', hasProgressBar);
    console.log('Exam body text (first 800 chars):', examBodyText.substring(0, 800));

    // =====================
    // PASO 4 - Seleccionar una opción
    // =====================
    console.log('\n=== PASO 4: SELECCIONAR OPCIÓN ===');

    // Try multiple selectors for answer options
    const optionSelectors = [
      'button:has-text("A")',
      'button:has-text("(A)")',
      'label:has-text("A")',
      '[data-option="A"]',
      '[data-answer="A"]',
      '.option:first-child',
      '.answer-option:first-child',
      'li:first-child button',
      'ul li:first-child',
      'input[type="radio"]:first-child',
    ];

    let optionClicked = false;
    for (const selector of optionSelectors) {
      const el = page.locator(selector).first();
      const count = await el.count();
      if (count > 0) {
        try {
          await el.click();
          optionClicked = true;
          console.log('Clicked option with selector:', selector);
          break;
        } catch (e) {
          console.log('Could not click selector:', selector, '-', (e as Error).message.substring(0, 50));
        }
      }
    }

    if (!optionClicked) {
      // Try to find buttons with single letters or labeled with A/B/C/D
      const allButtons = await page.locator('button').all();
      console.log('Total buttons on page:', allButtons.length);
      for (const btn of allButtons.slice(0, 10)) {
        const text = await btn.innerText().catch(() => '');
        console.log('Button text:', JSON.stringify(text.substring(0, 50)));
      }

      // Try clicking the first radio or option element
      const radioInputs = page.locator('input[type="radio"]');
      const radioCount = await radioInputs.count();
      console.log('Radio inputs found:', radioCount);
      if (radioCount > 0) {
        await radioInputs.first().click();
        optionClicked = true;
        console.log('Clicked first radio input');
      }
    }

    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '06-option-selected.png'), fullPage: true });
    console.log('Screenshot 06-option-selected.png taken');

    const finalUrl = page.url();
    console.log('Final URL (should be /exam/[uuid]):', finalUrl);
    const isExamUUID = /\/exam\/[0-9a-f-]{36}/.test(finalUrl);
    console.log('URL matches /exam/[uuid] pattern?', isExamUUID);

  } else {
    console.log('ERROR: Iniciar button not found on exam/new page');
    const examNewText = await page.locator('body').innerText();
    console.log('Page content:', examNewText.substring(0, 500));
  }

  console.log('\n=== VALIDATION COMPLETE ===');
  console.log('Screenshots saved to:', SCREENSHOTS_DIR);
});
