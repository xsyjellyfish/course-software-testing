# BB-04: The Shipping Step Exposes the Carrier Price Neither as a Named Amount Region Nor as the Radio Descriptor

## 1. Test Method and Design Basis

- Test method: Black-box testing
- Testing technique: Equivalence partitioning over the checkout step regions, verified through the accessibility tree (`role`, accessible name, `aria-label`)

This test checks the accessible structure of the `Shipping Method` step: the requirement demands a named amount region for the shipping cost, and that the `Delivery` radio *displays* the cost.

## 2. Requirement Reference

- REQ-5.4 — Separate invoice address and choose carrier: *"Continuing with Home opens "Shipping Method"(role=region), where "Delivery"(role=radio) displays cost 5 and visibly reflects selection."* and *"Order summary and checkout steps Personal Information, Addresses, Shipping Method, and Payment are named regions. ... Shipping cost is a named amount region."*

Two statements apply to the step the user is standing on: the harness must expose a region whose accessible name is `Shipping cost`, and the carrier choice must present the amount.

## 3. Difference from Existing Tests

`baseline/REQ-5.4.spec.ts` ("Choose Delivery") is the closest existing test: it asserts `region(page, 'Shipping Method').getByRole('region', { name: 'Shipping cost' })` and then checks the amount 5. **On a clean database this baseline test fails** (see section 8), which shows the gap is real and not covered by any passing test. The other baseline checkout tests read only the `Order summary` copy of the amount, which is present and therefore hides the missing step-level region.

## 4. Preconditions

- The PrestaShop application is running with the seeded catalog and customers.
- Signed-in customer: `prestashop_checkout_invoice_user@example.com` / `ShopPass123!` with a UI-created `Home` address.
- Cart contains `Hummingbird checkout-step t-shirt` ($26.00), M/White, quantity 1.
- Checkout is on the `Shipping Method` step (after `Addresses` → `Home` → `Continue`).

## 5. Reproduction Steps

1. Sign in as `prestashop_checkout_invoice_user@example.com` and create `Home` through `/account/addresses`.
2. Add `/product/3` (Hummingbird checkout-step t-shirt) to the cart and proceed to checkout.
3. Select `Home` in `Addresses`, click `Continue`.
4. Inspect the region `Shipping Method`: read its text, then enumerate the named regions inside it.
5. Count the elements with accessible name `Shipping cost` on the whole page, and inside `Shipping Method` and inside `Order summary`.
6. Select `Delivery` and read the radio's accessible name and description.

## 6. Expected Behavior

Inside `Shipping Method`:

- the carrier price is exposed as a region named `Shipping cost` containing `$5.00`, as REQ-5.4 states; and
- the `Delivery` radio conveys its cost (for example through an accessible description or an included amount).

## 7. Actual Behavior

The step labels the carrier choice `Delivery` and prints `$5.00` as unrelated text:

```text
[BB-04] shipping region text=3. Shipping Method | Delivery | $5.00 | Continue
[BB-04] named regions inside Shipping Method=[]
[BB-04] "Shipping cost" regions inside Shipping Method=0
[BB-04] "Shipping cost" regions inside Order summary=1
[BB-04] delivery radio snapshot=- radio "Delivery" [checked]
```

- The `Shipping Method` region contains **no** named region at all, so the required `Shipping cost` amount region is missing at the step where the choice is made.
- The only `Shipping cost` region on the page belongs to `Order summary` ($5.00 with Total $31.00).
- The `Delivery` radio's accessible name is `Delivery` with no description, so the amount $5.00 is neither a named region nor a programmatically associated value of the radio: a screen-reader user who lands in `Shipping Method` hears "Delivery, radio button, checked" without the price, and must leave the step to find the cost in `Order summary`.

The visual rendering is correct (the step shows `Delivery $5.00`), so the defect is confined to the semantics the requirement prescribes (named region / amount presentation), not to the calculation.

## 8. Evidence

| Artifact | Content |
|---|---|
| `assets/bb04-shipping-method-step.png` | The `Shipping Method` region as rendered: `3. Shipping Method`, `Delivery`, `$5.00`, `Continue` |
| `assets/bb04-checkout-shipping-step.png` | Full checkout page at the shipping step (Order summary shows its own `Shipping cost` region) |

Baseline confirmation on a clean database (`npx playwright test baseline/REQ-5.4.spec.ts --grep "Choose Delivery"`):

```text
Locator: getByRole('region', { name: 'Shipping Method', exact: true }).getByRole('region', { name: 'Shipping cost', exact: true })
Expected: visible
Error: element(s) not found
  1 failed  › REQ-5.4: Choose Delivery
  1 passed  › REQ-5.4: Use separate invoice address
```

Reproduction script: `scripts/repro-team-02.mjs` (check `BB-04`).

## 9. Validation Status

Confirmed in the target implementation on a freshly seeded database. The requirement sentence "Shipping cost is a named amount region" is explicit, and the failing baseline test encodes the same expectation, so this is reported as a defect rather than a candidate.
