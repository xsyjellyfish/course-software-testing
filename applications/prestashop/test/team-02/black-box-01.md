# BB-01: Repeated Add-to-Cart Operations Overwrite the Existing Quantity

## 1. Test Method and Design Basis

- Test method: Black-box testing
- Testing technique: State transition testing

This test examines whether repeated Add to cart operations correctly accumulate the quantity of a product variant that is already in the cart. All actions are performed through the user interface; no source code is inspected and no request is sent outside the flows the interface triggers.

## 2. Requirement Reference

- REQ-3.3 — Add product to cart and choose next destination: *"Clicking "Add to cart"(role=button) ... opens "Product successfully added to your shopping cart"(role=dialog) with that product and increases cart count."*
- REQ-4.1 — Inspect cart contents and summary: *"Cart count counts units, and cart state remains consistent across navigation within a flow."*

Adding the same variant again must therefore increase the cart count and the unit count of the existing row. The count must never decrease as a result of an Add to cart operation.

## 3. Difference from Existing Tests

- `baseline/REQ-3.3.spec.ts` adds a product once and then verifies the dialog, the same detail page, and the transition to the shopping cart. It never adds the same variant twice.
- `baseline/REQ-4.2.spec.ts` and `baseline/REQ-4.4.spec.ts` change the quantity inside the shopping cart (increase, direct entry, delete), not by adding the variant again from the product page.

This test adds the missing state transition *"variant already in cart" + Add to cart*.

## 4. Preconditions

- The PrestaShop application is running and the seeded catalog is available.
- The shopping cart is empty (navigation reports `Cart (0)`).
- Product: `Hummingbird detail t-shirt` (`/product/1`), unit price $24, regular price $30, stock 50.
- Variant: Size `M`, Color `White`.

## 5. Reproduction Steps

1. Open `/product/1` (Hummingbird detail t-shirt).
2. Select Size `M` and Color `White`.
3. Set `Quantity` to `2` and click `Add to cart`.
4. In the dialog `Product successfully added to your shopping cart`, read the global navigation entry; then click `Continue shopping`.
5. Keep the same variant and set `Quantity` to `1`.
6. Click `Add to cart` again and read the navigation entry again.
7. Click `Proceed to checkout` and inspect the cart row, the `Quantity` spinbutton and the region `Cart summary`.

## 6. Expected Behavior

The second addition accumulates on the existing line: 2 units + 1 unit = 3 units.

| Observation | Expected |
|---|---|
| Navigation after the first addition | `Cart (2)` |
| Navigation after the second addition | `Cart (3)` |
| Cart row quantity | 3 |
| Items subtotal | $72.00 |
| Shipping | $5.00 |
| Total | $77.00 |

## 7. Actual Behavior

The second addition replaces the stored quantity instead of adding to it, so the cart count **decreases** from 2 to 1.

| Observation | Expected | Actual (observed) |
|---|---|---|
| Navigation after the first addition | `Cart (2)` | `Cart (2)` |
| Navigation after the second addition | `Cart (3)` | **`Cart (1)`** |
| Cart row `Quantity` spinbutton | 3 | **1** |
| `Cart summary` | Items subtotal $72.00, Shipping $5.00, Total $77.00 | **Items subtotal $24.00, Discount $6.00, Shipping $5.00, Total $29.00** |

The success dialog appears a second time and names the product, so the user is told the product was added again, while the cart silently keeps one unit only. The `Total` stays consistent with the wrong quantity ($24.00 + $5.00 = $29.00), which makes the missing units easy to overlook; the `Cart summary` also lists `Discount $6.00`, a row that is not subtracted from `Total` at all (unrelated to this finding, but it explains why the total does not read $23.00).

The same overwrite also weakens the per-variant stock guard: the product page validates only the quantity entered in the current operation (REQ-3.2 / REQ-3.9), so a cart line can never exceed the currently entered amount and repeated additions cannot be rejected on the accumulated total.

## 8. Evidence

| Artifact | Content |
|---|---|
| `assets/bb01-add-two-units.png` | After step 3: dialog open, navigation `Cart (2)` |
| `assets/bb01-add-one-more-unit.png` | After step 6: dialog open again, navigation `Cart (1)` |
| `assets/bb01-cart-after-two-adds.png` | Shopping cart with quantity 1, subtotal $24.00, total $29.00 |

Raw values captured by the reproduction script:

```text
[BB-01] after adding 2 units: Cart (2)
[BB-01] after adding 1 more unit of the same variant: Cart (1)
[BB-01] cart row=Hummingbird detail t-shirt | Size: M | Color: White | $24.00 | Increase quantity | Decrease quantity | $24.00 | Delete
[BB-01] cart summary=Items subtotal | $24.00 | Discount | $6.00 | Shipping | $5.00 | Total | $29.00 | Total including tax
[BB-01] quantity spinbutton=1
[BB-01] EXPECTED: 3 units, items subtotal $72.00, total $77.00
```

Reproduction script: `scripts/repro-team-02.mjs` (check `BB-01`).

## 9. Validation Status

Confirmed in the target implementation on a freshly seeded database (the `backend/data/app.db*` files were moved aside and the application recreated and re-seeded them before the run) and reproduced in more than one session. No baseline test contradicts the observation; no existing test covers the repeated-addition transition.
