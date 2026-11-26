/**
 * Team 02 - PrestaShop black-box defect reproduction.
 *
 * Runs six independent checks (BB-01 ... BB-06) against a running application
 * instance and writes screenshots to ../assets plus a transcript to ./repro.log.
 *
 * Usage (Playwright must be installed somewhere; point PLAYWRIGHT_HOME at that
 * project folder, e.g. the folder that owns a node_modules directory):
 *
 *   $env:BASE_URL = 'http://127.0.0.1:3000'
 *   $env:PLAYWRIGHT_HOME = 'd:/481/11.25/pw/'
 *   node repro-team-02.mjs
 *
 * The script only drives the user interface; it never calls application APIs
 * directly, so every observation is black-box.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const here = path.dirname(fileURLToPath(import.meta.url));
const ASSETS = path.resolve(here, '..', 'assets');
const LOG = path.join(here, 'repro.log');
const BASE = (process.env.BASE_URL || 'http://127.0.0.1:3000').replace(/\/$/, '');
const PW_HOME = process.env.PLAYWRIGHT_HOME || 'd:/481/11.25/pw/';
const requireFromProject = createRequire(path.join(PW_HOME, 'package.json'));
const { chromium, expect } = requireFromProject('@playwright/test');

fs.mkdirSync(ASSETS, { recursive: true });
fs.appendFileSync(LOG, '\n########## run ' + new Date().toISOString() + ' base=' + BASE + ' ##########\n');
const log = (...parts) => {
  const line = parts.map((part) => (typeof part === 'string' ? part : JSON.stringify(part))).join(' ');
  console.log(line);
  fs.appendFileSync(LOG, line + '\n');
};
const flat = async (locator) => (await locator.innerText()).replace(/\s*\n\s*/g, ' | ').trim();
const action = (scope, name) => scope.getByRole('button', { name, exact: true }).or(scope.getByRole('link', { name, exact: true }));
const region = (scope, name) => scope.getByRole('region', { name, exact: true });
const nav = (page) => page.getByRole('navigation', { name: 'Global navigation' });
const successDialog = (page) => page.getByRole('dialog', { name: 'Product successfully added to your shopping cart', exact: true });

const browser = await chromium.launch();
const openPage = async () => {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1200 } });
  const page = await context.newPage();
  page.setDefaultTimeout(20000);
  return page;
};

async function login(page, email) {
  await page.goto(BASE + '/');
  await nav(page).getByRole('button', { name: 'Sign in', exact: true }).click();
  await page.getByLabel('Email', { exact: true }).fill(email);
  await page.getByLabel('Password', { exact: true }).fill('ShopPass123!');
  await page.getByRole('button', { name: /^sign in$/i }).click();
  await expect(action(nav(page), 'My account')).toBeVisible();
}

async function ensureHome(page) {
  await action(nav(page), 'My account').click();
  await action(region(page, 'Account overview'), 'Addresses').click();
  const home = page.getByRole('article', { name: 'Home', exact: true });
  const exists = await home.first().waitFor({ state: 'visible', timeout: 5000 }).then(() => true).catch(() => false);
  if (exists) {
    log('address Home already exists');
    return;
  }
  await action(page, 'Create new address').click();
  const values = { Alias: 'Home', 'First name': 'Store', 'Last name': 'User', Address: '1 Commerce Road', 'Postal code': '200000', City: 'Shanghai', Phone: '13800000020' };
  for (const [name, value] of Object.entries(values)) await page.getByLabel(name, { exact: true }).fill(value);
  await page.getByRole('combobox', { name: 'Country', exact: true }).selectOption({ label: 'China' });
  await action(page, 'Save').click();
  await expect(page.getByRole('article', { name: 'Home', exact: true })).toBeVisible();
  log('created address Home');
}

async function reachShipping(page, productId, productName) {
  await page.goto(BASE + '/product/' + productId);
  await expect(page.getByRole('heading', { name: productName, exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Add to cart', exact: true }).click();
  await expect(successDialog(page)).toBeVisible();
  await action(successDialog(page), 'Proceed to checkout').click();
  const cartSummary = await flat(region(page, 'Cart summary'));
  if (/\/cart/.test(page.url())) await action(page, 'Proceed to checkout').click();
  const addresses = region(page, 'Addresses');
  if (!(await addresses.getByRole('radio', { name: 'Home', exact: true }).isVisible().catch(() => false))) {
    await action(region(page, 'Personal Information'), 'Continue').click();
  }
  await addresses.getByRole('radio', { name: 'Home', exact: true }).check();
  await action(addresses, 'Continue').click();
  const shipping = region(page, 'Shipping Method');
  await expect(shipping).toBeVisible();
  return { shipping, cartSummary };
}

async function placeOrder(page, productId, productName) {
  const { shipping, cartSummary } = await reachShipping(page, productId, productName);
  await shipping.getByRole('radio', { name: 'Delivery', exact: true }).check();
  await action(shipping, 'Continue').click();
  const payment = region(page, 'Payment');
  await expect(payment).toBeVisible();
  await payment.getByRole('radio', { name: 'Bank wire', exact: true }).check();
  await payment.getByRole('checkbox', { name: 'Terms and conditions', exact: true }).check();
  await action(payment, 'Place order').click();
  const reference = region(page, 'Order reference');
  await expect(reference).toBeVisible();
  return { reference: (await reference.innerText()).trim(), cartSummary };
}

async function orderHistory(page) {
  await action(nav(page), 'My account').click();
  await action(region(page, 'Account overview'), 'Order history and details').click();
  const history = region(page, 'Order history');
  await expect(history).toBeVisible();
  return history;
}

const checks = {};

checks['BB-01'] = async () => {
  const page = await openPage();
  try {
    await page.goto(BASE + '/product/1');
    await expect(page.getByRole('heading', { name: 'Hummingbird detail t-shirt', exact: true })).toBeVisible();
    const cartLink = page.getByRole('link', { name: 'Cart', exact: true });

    await page.getByRole('combobox', { name: 'Size', exact: true }).selectOption({ label: 'M' });
    await page.getByRole('radio', { name: 'White', exact: true }).check();
    await page.getByLabel('Quantity', { exact: true }).fill('2');
    await page.getByRole('button', { name: 'Add to cart', exact: true }).click();
    await expect(successDialog(page)).toBeVisible();
    log('[BB-01] after adding 2 units: ' + (await flat(cartLink)));
    await page.screenshot({ path: path.join(ASSETS, 'bb01-add-two-units.png') });

    await action(successDialog(page), 'Continue shopping').click();
    await expect(successDialog(page)).toHaveCount(0);

    await page.getByLabel('Quantity', { exact: true }).fill('1');
    await page.getByRole('button', { name: 'Add to cart', exact: true }).click();
    await expect(successDialog(page)).toBeVisible();
    log('[BB-01] after adding 1 more unit of the same variant: ' + (await flat(cartLink)));
    await page.screenshot({ path: path.join(ASSETS, 'bb01-add-one-more-unit.png') });

    await action(successDialog(page), 'Proceed to checkout').click();
    const row = page.getByRole('row', { name: 'Hummingbird detail t-shirt', exact: true });
    await expect(row).toBeVisible();
    log('[BB-01] cart row=' + (await flat(row)));
    log('[BB-01] cart summary=' + (await flat(region(page, 'Cart summary'))));
    log('[BB-01] quantity spinbutton=' + (await page.getByRole('spinbutton', { name: 'Quantity' }).first().inputValue()));
    log('[BB-01] EXPECTED: 3 units, items subtotal $72.00, total $77.00');
    await page.screenshot({ path: path.join(ASSETS, 'bb01-cart-after-two-adds.png'), fullPage: true });
  } finally {
    await page.context().close();
  }
};

checks['BB-02'] = async () => {
  const page = await openPage();
  try {
    await page.goto(BASE + '/');
    const language = () => page.getByRole('combobox', { name: 'Language', exact: true });
    log('[BB-02] navigation before=' + (await flat(nav(page))));
    log('[BB-02] html lang before=' + JSON.stringify(await page.evaluate(() => document.documentElement.lang)));
    await language().selectOption({ label: 'Français' });
    await page.waitForTimeout(1200);
    log('[BB-02] combobox value=' + (await language().inputValue()));
    log('[BB-02] navigation after=' + (await flat(nav(page))));
    log('[BB-02] html lang after=' + JSON.stringify(await page.evaluate(() => document.documentElement.lang)));
    await page.screenshot({ path: path.join(ASSETS, 'bb02-language-francais.png') });
    await page.goto(BASE + '/cart');
    await page.waitForTimeout(600);
    log('[BB-02] combobox value after navigation=' + (await language().inputValue()));
  } finally {
    await page.context().close();
  }
};

checks['BB-05'] = async () => {
  const page = await openPage();
  try {
    await page.goto(BASE + '/product/1');
    const images = region(page, 'Product images');
    const main = images.getByRole('img', { name: 'Hummingbird detail t-shirt', exact: true });
    log('[BB-05] main image alt=' + JSON.stringify(await main.getAttribute('alt')));
    await action(images, 'Back').click();
    await page.waitForTimeout(300);
    await action(images, 'Zoom').click();
    const zoom = page.getByRole('dialog', { name: 'Product image', exact: true });
    await expect(zoom).toBeVisible();
    log('[BB-05] dialog text=' + (await flat(zoom)));
    const enlarged = zoom.getByRole('img');
    for (let i = 0; i < (await enlarged.count()); i++) {
      log('[BB-05] enlarged image alt=' + JSON.stringify(await enlarged.nth(i).getAttribute('alt')));
    }
    log('[BB-05] images named after the product inside the dialog=' +
      (await zoom.getByRole('img', { name: 'Hummingbird detail t-shirt', exact: true }).count()));
    log('[BB-05] dialog snapshot=' + (await zoom.ariaSnapshot()).replace(/\s*\n\s*/g, ' '));
    await page.screenshot({ path: path.join(ASSETS, 'bb05-zoom-dialog.png'), fullPage: true });
    await action(zoom, 'Close').click();
    await expect(zoom).toHaveCount(0);
  } finally {
    await page.context().close();
  }
};

checks['BB-04'] = async () => {
  const page = await openPage();
  try {
    await login(page, 'prestashop_checkout_invoice_user@example.com');
    await ensureHome(page);
    const shipping = await reachShipping(page, 3, 'Hummingbird checkout-step t-shirt');
    log('[BB-04] shipping region text=' + (await flat(shipping.shipping)));
    log('[BB-04] named regions inside Shipping Method=' + JSON.stringify(
      await shipping.shipping.getByRole('region').evaluateAll((els) => els.map((el) => el.getAttribute('aria-label')))));
    log('[BB-04] "Shipping cost" regions inside Shipping Method=' + (await region(shipping.shipping, 'Shipping cost').count()));
    log('[BB-04] "Shipping cost" regions inside Order summary=' +
      (await region(region(page, 'Order summary'), 'Shipping cost').count()));
    log('[BB-04] delivery radio snapshot=' + (await shipping.shipping.getByRole('radio', { name: 'Delivery', exact: true }).ariaSnapshot()).replace(/\s*\n\s*/g, ' '));
    await shipping.shipping.screenshot({ path: path.join(ASSETS, 'bb04-shipping-method-step.png') });
    await page.screenshot({ path: path.join(ASSETS, 'bb04-checkout-shipping-step.png'), fullPage: true });
  } finally {
    await page.context().close();
  }
};

checks['BB-03'] = async () => {
  const page = await openPage();
  const orderBodies = [];
  page.on('response', async (response) => {
    if (/\/api\/orders(\?|$)/.test(response.url()) && response.request().method() === 'GET') {
      try { orderBodies.push(await response.json()); } catch { /* ignore non-JSON */ }
    }
  });
  const historyRows = async () => {
    const history = await orderHistory(page);
    await expect(history.getByRole('row').nth(1)).toBeVisible({ timeout: 8000 }).catch(() => {});
    return history.getByRole('row').evaluateAll((els) => els.map((el) => el.innerText.replace(/\s*\n\s*/g, ' | ')));
  };
  try {
    await login(page, 'prestashop_checkout_6_7_user@example.com');
    await ensureHome(page);
    log('[BB-03] history before the experiment=' + JSON.stringify(await historyRows()));

    const productName = 'Hummingbird wishlist t-shirt';
    const first = await placeOrder(page, 7, productName);
    log('[BB-03] first checkout cart=' + first.cartSummary);
    log('[BB-03] first checkout reference=' + first.reference + ' url=' + page.url());
    log('[BB-03] first confirmation=' + (await flat(page.getByRole('main'))));
    await page.screenshot({ path: path.join(ASSETS, 'bb03-order-1-confirmation.png'), fullPage: true });
    log('[BB-03] history after the first checkout=' + JSON.stringify(await historyRows()));

    await page.goto(BASE + '/');
    const second = await placeOrder(page, 7, productName);
    log('[BB-03] second checkout cart=' + second.cartSummary);
    log('[BB-03] identical carts=' + (first.cartSummary === second.cartSummary));
    log('[BB-03] second checkout reference=' + second.reference + ' url=' + page.url());
    log('[BB-03] references identical=' + (first.reference === second.reference));
    log('[BB-03] second confirmation=' + (await flat(page.getByRole('main'))));
    await page.screenshot({ path: path.join(ASSETS, 'bb03-order-2-confirmation.png'), fullPage: true });

    const afterSecond = await historyRows();
    log('[BB-03] history after the identical second checkout=' + JSON.stringify(afterSecond));
    const history = region(page, 'Order history');
    log('[BB-03] history rows naming ' + first.reference + '=' + (await history.getByRole('row', { name: first.reference }).count()));
    await page.screenshot({ path: path.join(ASSETS, 'bb03-order-history-after-two-orders.png'), fullPage: true });

    await page.goto(BASE + '/');
    const control = await placeOrder(page, 8, 'White t-shirt');
    log('[BB-03] control checkout cart=' + control.cartSummary);
    log('[BB-03] control checkout (different product) reference=' + control.reference);
    log('[BB-03] control reference differs from first=' + (control.reference !== first.reference));
    log('[BB-03] history after the control checkout=' + JSON.stringify(await historyRows()));

    for (const body of orderBodies) {
      const list = Array.isArray(body) ? body : (body.orders || body.data || []);
      log('[BB-03] /api/orders response: count=' + list.length + ' references=' + JSON.stringify(list.map((order) => order.reference)));
    }
  } finally {
    await page.context().close();
  }
};

checks['BB-06'] = async () => {
  const page = await openPage();
  try {
    await login(page, 'prestashop_order_history_user@example.com');
    await page.route('**/api/orders', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 5000));
      await route.continue();
    });
    await action(nav(page), 'My account').click();
    await action(region(page, 'Account overview'), 'Order history and details').click();
    const history = region(page, 'Order history');
    await expect(history).toBeVisible();
    const empty = history.getByText('You have no orders.', { exact: true });
    await expect(empty).toBeVisible();
    log('[BB-06] during load: text=' + JSON.stringify(await flat(history)));
    log('[BB-06] during load: "You have no orders." visible=' + (await empty.isVisible()));
    log('[BB-06] during load: rows=' + (await history.getByRole('row').count()));
    await page.screenshot({ path: path.join(ASSETS, 'bb06-order-history-loading.png'), fullPage: true });

    await expect(history.getByRole('row', { name: 'PS-HISTORY-001' })).toBeVisible({ timeout: 20000 });
    log('[BB-06] after load: text=' + JSON.stringify(await flat(history)));
    log('[BB-06] after load: "You have no orders." count=' + (await empty.count()));
    log('[BB-06] after load: rows=' + (await history.getByRole('row').count()));
    await page.screenshot({ path: path.join(ASSETS, 'bb06-order-history-loaded.png'), fullPage: true });
  } finally {
    await page.context().close();
  }
};

const only = (process.env.ONLY || '').split(',').map((name) => name.trim()).filter(Boolean);
const results = [];
for (const name of Object.keys(checks).sort()) {
  if (only.length && !only.includes(name)) continue;
  log('\n=== ' + name + ' ===');
  try {
    await checks[name]();
    results.push(name + ': observations captured');
  } catch (error) {
    log('[' + name + '] ERROR ' + (error instanceof Error ? error.message : String(error)).split('\n')[0]);
    results.push(name + ': ERROR');
  }
}

log('\n=== summary ===');
for (const result of results) log(result);
await browser.close();
process.exit(results.some((result) => result.endsWith('ERROR')) ? 1 : 0);
