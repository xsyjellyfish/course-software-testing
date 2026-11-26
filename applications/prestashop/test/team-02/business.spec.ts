// Team 02: xvsuyi, luoyawen, fanghaotian
// Run from applications/prestashop: npx playwright test -c test/team-02
import { expect, test, type Page } from '@playwright/test';
import { action, addressesStep, card, cartRow, cartSetup, checkoutSetup, count, createAddress,
  createWishlist, DETAIL, fillAddress, home, login, men, nav, openProduct, paymentStep, placeOrder,
  region, STEP, success, wishlist, wishlistPage } from '../baseline/helpers';

test.beforeEach(async ({ page }) => { await home(page); });

/**
 * Description: Catalog.tsx filters size and color in separate variant scans.
 * Requirement: Expected Output: Under variant-level intersection, only purchasable combinations match.
 * Test description: Select L, then White in Men.
 * Observed Output: One shirt remains despite offering only M/White and L/Black.
 */
test('[White-box] REQ-2.7/2.10 WB01 incompatible size and color', async ({ page }) => {
  await men(page);
  const filters = region(page, 'Filters');
  await filters.getByLabel('L', { exact: true }).check();
  await expect(card(page, DETAIL)).toBeVisible();
  await filters.getByLabel('White', { exact: true }).check();
  console.log('L + White:', await count(page).innerText(), await region(page, 'Product list').innerText());
  await expect(card(page, DETAIL)).toHaveCount(0);
});

/**
 * Description: Checkout.tsx updates invoiceId after saving a shipping edit.
 * Requirement: Expected Output: Office stays selected for invoicing.
 * Test description: Choose Home for shipping and Office for invoicing. Edit the Home street.
 * Observed Output: Home becomes the checked invoice address.
 */
test('[White-box] REQ-5.4/5.7 WB02 separate invoice survives shipping edit', async ({ page }) => {
  await login(page, 'checkout_invoice_user');
  await createAddress(page, 'Office');
  await createAddress(page, 'Home');
  await cartSetup(page, STEP);
  await action(page, 'Proceed to checkout').click();
  await addressesStep(page);
  const addresses = region(page, 'Addresses');
  await addresses.getByRole('radio', { name: 'Home', exact: true }).check();
  await addresses.getByLabel('Use same address').uncheck();
  const invoice = region(page, 'Invoice address');
  await invoice.getByLabel('Office', { exact: true }).check();
  await expect(invoice.getByLabel('Office')).toBeChecked();
  await action(addresses, 'Edit address Home').click();
  await page.getByLabel('Address', { exact: true }).fill('88 Market Street');
  await action(page, 'Save').click();
  await expect(addresses).toContainText('88 Market Street');
  console.log('After editing Home, invoice selection:', await invoice.ariaSnapshot());
  await expect(invoice.getByLabel('Office')).toBeChecked();
});

/**
 * Description: store.ts matches new purchases against historical orders.
 * Requirement: Expected Output: A second completed purchase gets its own order reference.
 * Test description: Buy the same shirt twice through two complete shopping flows.
 * Observed Output: Both confirmations show the same reference.
 */
test('[White-box] REQ-5.6 WB03 new cart and second checkout create a new order', async ({ page }) => {
  const product = 'Hummingbird order-complete t-shirt';
  await checkoutSetup(page, 'checkout_6_7_user', product);
  await paymentStep(page); await placeOrder(page);
  const reference = region(page, 'Order reference');
  const first = await reference.innerText();
  await action(page, 'Continue shopping').click();
  await cartSetup(page, product);
  await action(page, 'Proceed to checkout').click();
  await addressesStep(page); await paymentStep(page); await placeOrder(page);
  const second = await reference.innerText();
  console.log('References after two completed shopping flows:', first, second);
  expect(second).not.toBe(first);
});

/**
 * Description: The address creation handler updates an existing alias.
 * Requirement: Expected Output: Creating an address preserves the previously saved street.
 * Test description: Create Home twice with different streets and reload.
 * Observed Output: Only 88 Market Street remains.
 */
test('[White-box] REQ-7.3/7.4 WB04 creating a second Home preserves the original address', async ({ page }) => {
  await login(page, 'address_create_user');
  await createAddress(page, 'Home');
  await action(page, 'Create new address').click();
  await fillAddress(page, 'Home');
  await page.getByLabel('Address', { exact: true }).fill('88 Market Street');
  const saved = page.waitForResponse(r => r.request().method() === 'POST' && r.url().endsWith('/api/addresses'));
  await action(page, 'Save').click();
  await saved;
  await page.reload();
  const original = page.getByRole('article', { name: 'Home', exact: true });
  await original.first().waitFor();
  console.log('Saved Home articles:', await original.allInnerTexts());
  await expect(original.filter({ hasText: '1 Commerce Road' })).toHaveCount(1);
});

/**
 * Description: The rename collision branch transfers wishlist items.
 * Requirement: Expected Output: Renaming Favorites preserves the contents of the other list.
 * Test description: Rename populated Favorites to the name of an existing empty list, then reopen the original destination.
 * Observed Output: Holiday Picks gains the wishlist shirt.
 */
test('[White-box] REQ-7.7/7.8 WB05 rename transfers a product into an unrelated wishlist', async ({ page }) => {
  await wishlistPage(page, 'wishlist_view_user');
  await createWishlist(page, 'Holiday Picks');
  const target = wishlist(page, 'Holiday Picks');
  const targetLink = action(target, 'Holiday Picks');
  await targetLink.click();
  const originalDestination = page.url();
  await expect(page.getByText('This wishlist is empty.')).toBeVisible();
  await page.goBack();
  await action(wishlist(page, 'Favorites'), 'Edit').click();
  await page.getByLabel('Name', { exact: true }).fill('Holiday Picks');
  await action(page.getByRole('dialog'), 'Save').click();
  await page.getByRole('dialog').waitFor({ state: 'hidden' });
  await page.goto(originalDestination);
  const item = page.getByRole('listitem', { name: 'Hummingbird wishlist t-shirt' });
  await expect(page.getByRole('heading', { name: 'Holiday Picks', exact: true })).toBeVisible();
  console.log('Original empty destination after rename:', await page.locator('main').innerText());
  await expect(item).toHaveCount(0);
});

async function addBlack(page: Page, units: string) {
  await openProduct(page, DETAIL);
  await page.getByLabel('Size', { exact: true }).selectOption({ label: 'L' });
  await expect(page.getByRole('status', { name: 'Stock' })).toContainText('2');
  await page.getByLabel('Quantity').fill(units);
  await action(page, 'Add to cart').click();
  await action(success(page), 'Continue shopping').click();
}

/**
 * Description: The login merge adds quantities without checking variant stock.
 * Requirement: Expected Output: L/Black quantity stays within its stock of two.
 * Test description: Add two as a customer, sign out, add one as a guest and sign back in.
 * Observed Output: Cart shows three units and a $108 subtotal.
 */
test('[White-box] REQ-3.2/3.9 WB06 login merges quantities beyond variant stock', async ({ page }) => {
  await login(page, 'user'); await addBlack(page, '2');
  await action(nav(page), 'Sign out').click();
  await addBlack(page, '1'); await login(page, 'user');
  await action(nav(page), 'Cart').click();
  const row = cartRow(page, DETAIL);
  const quantity = await row.getByLabel('Quantity').inputValue();
  console.log('Published L/Black stock 2; merged quantity', quantity, await row.innerText());
  expect(Number(quantity)).toBeLessThanOrEqual(2);
});

/**
 * Description: Cart quantity validation checks bounds but accepts fractions.
 * Requirement: Expected Output: For shirts sold by the unit, saved quantity is a whole number.
 * Test description: Enter 1.5 in the cart and reload.
 * Observed Output: Quantity remains 1.5 with a $36 subtotal.
 */
test('[White-box] REQ-4.4 WB07 cart accepts fractional shirts', async ({ page }) => {
  await cartSetup(page, DETAIL);
  const row = cartRow(page, DETAIL);
  const quantity = row.getByLabel('Quantity');
  const changed = page.waitForResponse(r => r.request().method() === 'PATCH' && r.url().includes('/api/cart/items/'));
  await quantity.fill('1.5');
  await changed;
  await quantity.press('Tab');
  await page.reload();
  const saved = await quantity.inputValue();
  console.log('Persisted quantity', saved, await row.innerText());
  expect(Number.isInteger(Number(saved))).toBe(true);
});

/**
 * Description: The existing-row branch assigns the latest requested quantity.
 * Requirement: Expected Output: Two additions of one unit yield two units.
 * Test description: Add the default cart shirt twice using Continue shopping between additions.
 * Observed Output: Both additions succeed but the cart shows one unit at $25.
 */
test('[White-box] REQ-3.3/4.1 WB08 adding the same cart shirt twice increases its unit count', async ({ page }) => {
  const name = 'Hummingbird cart t-shirt';
  await openProduct(page, name);
  await action(page, 'Add to cart').click();
  await action(success(page), 'Continue shopping').click();
  await expect(action(nav(page), 'Cart')).toContainText('1');
  await action(page, 'Add to cart').click();
  await action(success(page), 'Proceed to checkout').click();
  const row = cartRow(page, name);
  const units = await row.getByLabel('Quantity').inputValue();
  console.log('Two successful additions:', units, await row.innerText());
  expect(units).toBe('2');
});

/**
 * Description: The search blur timer removes a focused suggestion.
 * Requirement: Expected Output: A keyboard user can activate the focused suggestion.
 * Test description: Type shirt, Tab to the first suggestion, pause and press Enter.
 * Observed Output: The suggestion disappears and the homepage remains open.
 */
test('[White-box] REQ-1.1/1.3 WB09 keyboard focus is lost inside search suggestions', async ({ page }) => {
  const search = nav(page).getByRole('searchbox');
  await search.fill('shirt');
  const suggestion = action(region(page, 'Search suggestions'), DETAIL);
  await expect(suggestion).toBeVisible();
  await search.press('Tab');
  await expect(suggestion).toBeFocused();
  // Allow an ordinary reading pause after Tab, exceeding the blur timer in Shell.tsx.
  await page.waitForTimeout(350);
  console.log('Suggestion count after keyboard pause:', await suggestion.count());
  await page.keyboard.press('Enter');
  console.log('After Enter:', page.url(), await page.getByRole('heading').allTextContents());
  await expect(page.getByRole('heading', { name: DETAIL, exact: true })).toBeVisible();
});

/**
 * Description: Registration changes the cart owner without migrating guest items.
 * Requirement: Expected Output: Under cart continuity across registration, the chosen shirt remains available.
 * Test description: Add a guest item, register and reopen the cart.
 * Observed Output: The new customer sees an empty cart.
 */
test('[White-box] REQ-4.1/6.2 WB10 registration loses an existing guest cart', async ({ page }) => {
  await cartSetup(page, DETAIL);
  await expect(cartRow(page, DETAIL).getByLabel('Quantity')).toHaveValue('1');
  await action(nav(page), 'Sign in').click();
  await action(page, 'No account? Create one here').click();
  const fields = { 'First name': 'New', 'Last name': 'Customer',
    Email: 'new_customer_7_3@example.com', Password: 'ShopPass123!', Birthdate: '1995-08-21' };
  for (const [label, value] of Object.entries(fields)) {
    await page.getByLabel(label, { exact: true }).fill(value);
  }
  await page.getByRole('radio', { name: 'Mr.', exact: true }).check();
  for (const label of ['Receive offers', 'Newsletter', 'Terms']) await page.getByLabel(label).check();
  await action(page, 'Save').click();
  await expect(page.getByText('New Customer', { exact: true })).toBeVisible();
  await action(nav(page), 'Cart').click();
  await region(page, 'Cart summary').waitFor();
  console.log('Cart after registration:', await page.locator('main').innerText());
  await expect(cartRow(page, DETAIL)).toBeVisible();
});

/**
 * Description: ClothesMenu suppresses its submenu on the parent category route.
 * Requirement: Expected Output: Activating the global CLOTHES control exposes Women and Men.
 * Test description: Open CLOTHES, then hover and keyboard-activate its global navigation link.
 * Observed Output: Women is absent from global navigation.
 */
test('[White-box] REQ-1.2 WB11 global category menu stops opening on the parent page', async ({ page }) => {
  const clothes = action(nav(page), 'CLOTHES');
  await clothes.hover();
  await expect(action(nav(page), 'Women')).toBeVisible();
  await clothes.click();
  await expect(page.getByRole('heading', { name: 'CLOTHES', exact: true })).toBeVisible();
  await action(nav(page), 'Logo').hover();
  await clothes.hover();
  await clothes.focus();
  await clothes.press('Enter');
  console.log('Global navigation on parent page:', await nav(page).ariaSnapshot());
  await expect(action(nav(page), 'Women')).toBeVisible();
});

/**
 * Description: ProductPage restores the default variant on remount.
 * Requirement: Expected Output: Returning in the same flow preserves L/Black at $36.
 * Test description: Add L/Black, open the cart and go back.
 * Observed Output: The detail page displays M/White at $24.
 */
test('[White-box] REQ-3.9/4.5 WB12 browser back resets the selected product combination', async ({ page }) => {
  await openProduct(page, DETAIL);
  await page.getByLabel('Size', { exact: true }).selectOption({ label: 'L' });
  await expect(page.getByRole('radio', { name: 'Black' })).toBeChecked();
  await action(page, 'Add to cart').click();
  await action(success(page), 'Proceed to checkout').click();
  await expect(cartRow(page, DETAIL)).toContainText('Color: Black');
  await page.goBack();
  await expect(page.getByRole('heading', { name: DETAIL, exact: true })).toBeVisible();
  const size = page.getByLabel('Size', { exact: true });
  console.log('Returning from cart:', await size.inputValue(), await region(page, 'Product information').innerText());
  await expect(size).toHaveValue('L');
});
