'use strict';

const { spawn } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { chromium, firefox, webkit } = require('@playwright/test');

const host = process.env.HOST ?? '127.0.0.1';
const port = process.env.PORT ?? '3100';
const baseUrl = process.env.UAT_BASE_URL ?? `http://${host}:${port}`;
const outputDirectoryPath = process.env.UAT_OUTPUT_DIR ?? path.join(__dirname);
const serviceEntryPath = path.resolve(__dirname, '..', 'build', 'service', 'index.js');
const viewport = { width: 1440, height: 900 };
const tolerance = 8;
const browsers = [
  ['chromium', chromium],
  ['firefox', firefox],
  ['webkit', webkit]
];
const responsiveViewports = [
  ['phone', { width: 390, height: 844 }],
  ['large-phone', { width: 430, height: 932 }],
  ['tablet', { width: 768, height: 1024 }],
  ['desktop', viewport]
];
const states = [
  {
    name: 'splash',
    readySelector: '.splash',
    setup: async (page) => {
      await page.goto(makeUatUrl('splash'), { waitUntil: 'domcontentloaded' });
      await page.locator('.splash').waitFor({ state: 'attached' });
      await page.waitForTimeout(100);
    }
  },
  {
    name: 'landing',
    readySelector: '.banner',
    setup: async (page) => {
      await page.goto(makeUatUrl('landing'), { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2600);
      await page.locator('.banner').waitFor({ state: 'visible' });
    }
  },
  {
    name: 'experience',
    triggerSelector: '#experience-cta',
    readySelector: '.section.experience'
  },
  {
    name: 'services',
    triggerSelector: '#services-cta',
    readySelector: '.section.services'
  },
  {
    name: 'about-me',
    triggerSelector: '#about-me-cta',
    readySelector: '.section.about-me'
  },
  {
    name: 'social-media',
    triggerSelector: '#social-media-cta',
    readySelector: '.section.social-media'
  },
  {
    name: 'contact',
    triggerSelector: '#work-with-me-cta',
    readySelector: '.section.contact'
  },
  {
    name: 'privacy-policy',
    triggerSelector: '#privacy-cta',
    readySelector: '.section.legal',
    expectedText: 'Privacy Policy'
  },
  {
    name: 'terms-of-service',
    triggerSelector: '#terms-cta',
    readySelector: '.section.legal',
    expectedText: 'Terms of Service'
  }
];

/**
 * Removes screenshots from a previous UAT run so each run produces a clean set.
 *
 * @returns {void}
 */
function cleanPreviousScreenshots() {
  fs.mkdirSync(outputDirectoryPath, { recursive: true });

  for (const entry of fs.readdirSync(outputDirectoryPath)) {
    if (/^uat-.*\.png$/.test(entry)) {
      fs.unlinkSync(path.join(outputDirectoryPath, entry));
    }
  }
}

/**
 * Sends repeated requests to confirm a strict token bucket eventually rejects traffic.
 *
 * @param {string} strictBaseUrl - Base URL for the strict rate-limit service instance.
 * @returns {Promise<void>} Resolves when the limiter behavior matches expectations.
 */
async function assertSecurityControls(strictBaseUrl) {
  const response = await fetch(strictBaseUrl);

  assert.equal(response.status, 200);
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
  assert.equal(response.headers.get('x-frame-options'), 'DENY');
  assert.equal(response.headers.get('referrer-policy'), 'no-referrer');
  assert.match(response.headers.get('content-security-policy') ?? '', /default-src 'self'/);
  assert.ok(Number.parseInt(response.headers.get('x-ratelimit-limit') ?? '0', 10) >= 1);

  const burstResponses = await Promise.all([
    fetch(strictBaseUrl),
    fetch(strictBaseUrl),
    fetch(strictBaseUrl),
    fetch(strictBaseUrl)
  ]);
  const throttledResponse = burstResponses.find((entry) => entry.status === 429);

  assert.ok(throttledResponse, 'Expected one strict token bucket request to be throttled.');
  assert.equal(throttledResponse.headers.get('x-ratelimit-remaining'), '0');
  assert.ok(Number.parseInt(throttledResponse.headers.get('retry-after') ?? '0', 10) >= 1);
}

/**
 * Waits for the loopback service to respond before launching browser checks.
 *
 * @returns {Promise<void>} Resolves when the service responds successfully.
 */
function waitForServer() {
  return new Promise((resolve, reject) => {
    const deadline = Date.now() + 10000;

    const poll = async () => {
      try {
        const response = await fetch(baseUrl);

        if (response.ok) {
          resolve();
          return;
        }
      } catch {
        // Keep polling until the service is ready or the deadline passes.
      }

      if (Date.now() > deadline) {
        reject(new Error(`Timed out waiting for ${baseUrl}`));
        return;
      }

      setTimeout(poll, 250);
    };

    poll();
  });
}

/**
 * Builds a cache-busting URL for a specific UAT state.
 *
 * @param {string} stateName - State name being opened.
 * @returns {string} Absolute URL for the UAT page load.
 */
function makeUatUrl(stateName) {
  const url = new URL(baseUrl);

  url.searchParams.set('uat', `${stateName}-${Date.now()}`);

  return url.toString();
}

/**
 * Compares layout metrics from a candidate browser against the reference browser.
 *
 * @param {Record<string, number>} reference - Reference metric map from Chromium.
 * @param {Record<string, number>} candidate - Candidate metric map from the current browser.
 * @param {string} browserName - Browser currently under test.
 * @param {string} stateName - UI state currently under test.
 * @returns {void}
 */
function compareMetric(reference, candidate, browserName, stateName) {
  for (const [key, referenceValue] of Object.entries(reference)) {
    const candidateValue = candidate[key];
    const delta = Math.abs(referenceValue - candidateValue);

    if (delta > tolerance) {
      throw new Error(
        `${browserName} ${stateName} layout drifted on ${key}: expected ${referenceValue}, got ${candidateValue}`
      );
    }
  }
}

/**
 * Opens one application state in the provided Playwright page.
 *
 * @param {import('@playwright/test').Page} page - Playwright page under test.
 * @param {{name: string, readySelector: string, triggerSelector?: string, expectedText?: string, setup?: Function}} state - State configuration to open.
 * @returns {Promise<void>} Resolves after the state is visible and settled.
 */
async function openState(page, state) {
  if (state.setup) {
    await state.setup(page);
    return;
  }

  await page.goto(makeUatUrl(state.name), { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2600);
  await page.locator(state.triggerSelector).evaluate((element) => {
    element.click();
  });
  await page.locator('.article.open').waitFor({ state: 'attached' });
  await page.locator(state.readySelector).waitFor({ state: 'attached' });
  await page.locator(state.readySelector).scrollIntoViewIfNeeded();
  await page.waitForTimeout(150);
  await page.waitForTimeout(900);

  if (state.expectedText) {
    await page.locator(state.readySelector).getByText(state.expectedText, { exact: true }).waitFor({ state: 'attached' });
  }
}

/**
 * Collects stable layout metrics for cross-browser comparison.
 *
 * @param {import('@playwright/test').Page} page - Playwright page under test.
 * @param {{readySelector: string}} state - State configuration being measured.
 * @returns {Promise<Record<string, number>>} Layout metrics for the active state.
 */
async function collectMetrics(page, state) {
  return page.evaluate((readySelector) => {
    const readRect = (selector) => {
      const element = document.querySelector(selector);

      if (!element) {
        throw new Error(`Missing element: ${selector}`);
      }

      const rect = element.getBoundingClientRect();

      return {
        height: Math.round(rect.height),
        left: Math.round(rect.left),
        top: Math.round(rect.top),
        width: Math.round(rect.width)
      };
    };

    const ready = readRect(readySelector);
    const navigation = readRect('.navigation');

    return {
      navigationHeight: navigation.height,
      navigationTop: navigation.top,
      readyHeight: ready.height,
      readyLeft: ready.left,
      readyTop: ready.top,
      readyWidth: ready.width
    };
  }, state.readySelector);
}

/**
 * Validates responsive constraints for an opened UI state.
 *
 * @param {import('@playwright/test').Page} page - Playwright page under test.
 * @param {{name: string, readySelector: string}} state - State configuration being checked.
 * @param {string} viewportName - Human-readable viewport label.
 * @returns {Promise<void>} Resolves when the responsive layout passes.
 */
async function assertResponsiveLayout(page, state, viewportName) {
  if (!['splash', 'landing'].includes(state.name)) {
    await page.locator(state.readySelector).scrollIntoViewIfNeeded();
    await page.waitForTimeout(150);
  }

  const metrics = await page.evaluate((readySelector) => {
    const readyElement = document.querySelector(readySelector);

    if (!readyElement) {
      throw new Error(`Missing element: ${readySelector}`);
    }

    const ready = readyElement.getBoundingClientRect();
    const article = document.querySelector('.article');
    const articleRect = article?.getBoundingClientRect();

    return {
      articleBottom: Math.round(articleRect?.bottom ?? 0),
      articleTop: Math.round(articleRect?.top ?? 0),
      documentWidth: Math.round(document.documentElement.scrollWidth),
      readyBottom: Math.round(ready.bottom),
      readyHeight: Math.round(ready.height),
      readyLeft: Math.round(ready.left),
      readyRight: Math.round(ready.right),
      readyTop: Math.round(ready.top),
      viewportHeight: Math.round(window.innerHeight),
      viewportWidth: Math.round(window.innerWidth)
    };
  }, state.readySelector);
  const horizontalOverflow = metrics.documentWidth - metrics.viewportWidth;

  if (horizontalOverflow > 2) {
    throw new Error(`${viewportName} ${state.name} has horizontal overflow: ${horizontalOverflow}px`);
  }

  if (state.name === 'splash') {
    return;
  }

  if (metrics.readyRight < 1 || metrics.readyLeft > metrics.viewportWidth - 1) {
    throw new Error(`${viewportName} ${state.name} rendered outside the viewport horizontally`);
  }

  // Article panels may be taller than the viewport on tablet/phone layouts.
  // What we care about is whether a meaningful slice of the panel remains visible.
  const visibleVerticalSlice =
    Math.min(metrics.readyBottom, metrics.viewportHeight) - Math.max(metrics.readyTop, 0);
  const minimumVisibleHeight = Math.min(24, Math.max(12, Math.round(metrics.readyHeight * 0.05)));

  if (visibleVerticalSlice < minimumVisibleHeight) {
    throw new Error(`${viewportName} ${state.name} rendered outside the viewport vertically`);
  }

  if (!['splash', 'landing'].includes(state.name) && metrics.articleBottom <= metrics.articleTop) {
    throw new Error(`${viewportName} ${state.name} article panel collapsed`);
  }
}

(async () => {
  cleanPreviousScreenshots();

  const service = spawn(process.execPath, [serviceEntryPath], {
    env: { ...process.env, HOST: host, PORT: port },
    stdio: 'inherit'
  });
  const strictPort = String(Number.parseInt(port, 10) + 1);
  const strictBaseUrl = `http://${host}:${strictPort}`;
  const strictService = spawn(process.execPath, [serviceEntryPath], {
    env: {
      ...process.env,
      HOST: host,
      PORT: strictPort,
      RATE_LIMIT_CAPACITY: '3',
      RATE_LIMIT_REFILL_RATE: '0.1'
    },
    stdio: 'inherit'
  });
  const referenceMetrics = new Map();

  try {
    await waitForServer();
    await new Promise((resolve, reject) => {
      const deadline = Date.now() + 10000;

      const poll = async () => {
        try {
          const response = await fetch(strictBaseUrl);

          if (response.ok) {
            resolve();
            return;
          }
        } catch {
          // Keep polling until the strict service is ready or the deadline passes.
        }

        if (Date.now() > deadline) {
          reject(new Error(`Timed out waiting for ${strictBaseUrl}`));
          return;
        }

        setTimeout(poll, 250);
      };

      poll();
    });
    await assertSecurityControls(strictBaseUrl);

    for (const [browserName, browserType] of browsers) {
      console.log(`Running UAT in ${browserName}...`);

      const browser = await browserType.launch({ timeout: 15000 });

      try {
        const page = await browser.newPage({ viewport });

        page.setDefaultTimeout(12000);

        for (const state of states) {
          console.log(`  Checking ${state.name}...`);
          await openState(page, state);

          const metrics = await collectMetrics(page, state);
          const reference = referenceMetrics.get(state.name);

          if (!reference) {
            referenceMetrics.set(state.name, metrics);
          } else {
            compareMetric(reference, metrics, browserName, state.name);
          }

          await page.screenshot({
            animations: 'disabled',
            fullPage: true,
            path: path.join(outputDirectoryPath, `uat-${browserName}-${state.name}.png`)
          });
        }
      } finally {
        await browser.close();
      }
    }

    console.log('Running responsive UAT in chromium...');

    const responsiveBrowser = await chromium.launch({ timeout: 15000 });

    try {
      const page = await responsiveBrowser.newPage();

      page.setDefaultTimeout(12000);

      for (const [viewportName, responsiveViewport] of responsiveViewports) {
        await page.setViewportSize(responsiveViewport);

        for (const state of states) {
          console.log(`  Checking ${viewportName} ${state.name}...`);
          await openState(page, state);
          await assertResponsiveLayout(page, state, viewportName);

          await page.screenshot({
            animations: 'disabled',
            fullPage: true,
            path: path.join(outputDirectoryPath, `uat-responsive-${viewportName}-${state.name}.png`)
          });
        }
      }
    } finally {
      await responsiveBrowser.close();
    }
  } finally {
    service.kill();
    strictService.kill();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
