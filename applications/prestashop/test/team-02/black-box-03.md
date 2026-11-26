# BB-03: Repeating an Identical Purchase Re-Shows the Previous Order Instead of Creating a New One

## 1. Test Method and Design Basis

- Test method: Black-box testing
- Testing technique: State transition testing over the order state machine (cart → checkout → order → history), with a control experiment

The test checks what the store records when a signed-in customer completes the checkout twice with an identical basket, an identical address, the same carrier and the same payment. A control checkout with a *different* basket is performed in the same session to prove that the flow is able to create orders and to isolate the trigger.

## 2. Requirement Reference

- REQ-5.6 — Place order and inspect completion: *"... "Order reference"(role=region) contains a nonempty assigned reference ... For new order: Created through REQ-5.6; assigned reference is observed, never predetermined."*
- REQ-7.5 — Read historical orders and details: *"Order history is a named region."* listing the customer's orders (reference, date, total, status).

A checkout that reaches `Place order` and returns `Order confirmation` is a new order; its reference must be assigned for that order, not inherited from an earlier one, and `Order history` must list both purchases.

## 3. Difference from Existing Tests

- `baseline/REQ-5.6.spec.ts` places exactly one order per test and inspects that confirmation page.
- `baseline/REQ-7.5.spec.ts` reads only the pre-seeded order `PS-HISTORY-001`.

No baseline test places two orders, so neither reference assignment nor history accumulation across repeated checkouts is covered.

## 4. Preconditions

- The PrestaShop application is running with the seeded catalog and seeded customers.
- Signed-in customer `prestashop_checkout_6_7_user@example.com` / `ShopPass123!`; on a freshly seeded database this account has no orders at all (`history before the experiment=[header only]` in the recorded run).
- Address `Home` created through the UI at `/account/addresses` → `Create new address`.
- Cart empty at the start of each checkout.

## 5. Reproduction Steps

1. Sign in as `prestashop_checkout_6_7_user@example.com`.
2. Open `My account` → `Order history and details`; confirm the account starts with no order rows.
3. Open `/product/7` (`Hummingbird wishlist t-shirt`, $23.00), `Add to cart`, then `Proceed to checkout` twice.
4. Record the `Cart summary` (Items subtotal $23.00, Shipping $5.00, Total $28.00).
5. In `Addresses` select `Home` → `Continue`; in `Shipping Method` select `Delivery` → `Continue`; in `Payment` select `Bank wire`, tick `Terms and conditions`, click `Place order`.
6. Read the region `Order reference` → R1. Return to `Order history and details` and count the rows.
7. Go back to the homepage and repeat steps 3–5 with exactly the same basket, address, carrier and payment.
8. Read `Order reference` again → R2. Compare R1 with R2 and count the rows again.
9. Control: repeat the same checkout with a different product (`/product/8`, `White t-shirt`, $22.00 → Total $27.00) and read `Order reference` → R3.

## 6. Expected Behavior

| Observation | Expected |
|---|---|
| R1 (first purchase) | new, non-empty reference |
| R2 (second, identical purchase) | a **different** reference, assigned to the second order |
| `Order history` after both purchases | two rows, one per purchase |
| R3 (control, different product) | a third reference |

## 7. Actual Behavior

The first checkout creates an order. The second, identical checkout is answered with the **same** confirmation page and records nothing:

```text
history before the experiment=[header only]
first checkout cart=Items subtotal | $23.00 | Shipping | $5.00 | Total | $28.00
first checkout reference=PS-MUWMNAH1181
history after the first checkout=[header, PS-MUWMNAH1181 | 2026-10-06 | $28.00 | Pending | Hummingbird wishlist t-shirt | ...]
second checkout cart=Items subtotal | $23.00 | Shipping | $5.00 | Total | $28.00
identical carts=true
second checkout reference=PS-MUWMNAH1181
references identical=true
history after the identical second checkout=[header, PS-MUWMNAH1181 | 2026-10-06 | $28.00 | Pending | Hummingbird wishlist t-shirt | ...]
history rows naming PS-MUWMNAH1181=1
control checkout cart=Items subtotal | $22.00 | Shipping | $5.00 | Total | $27.00
control checkout reference=PS-MUWMNBWT168
history after the control checkout=[header, PS-MUWMNBWT168 | $27.00 | White t-shirt | ..., PS-MUWMNAH1181 | $28.00 | Hummingbird wishlist t-shirt]
```

The reference strings are generated per database (a rebuilt database yields different strings with the same relation), so the values above identify this recorded run; the relation that carries the finding is `references identical=true`.

The order list endpoint, read through the page's own request, confirms that nothing was added by the second checkout:

```text
/api/orders response: count=0 references=[]
/api/orders response: count=1 references=["PS-MUWMNAH1181"]
/api/orders response: count=1 references=["PS-MUWMNAH1181"]   <- after the identical second checkout
/api/orders response: count=2 references=["PS-MUWMNBWT168","PS-MUWMNAH1181"]   <- after the control checkout
```

| Observation | Expected | Actual |
|---|---|---|
| Reference of the second, identical purchase | new reference | **PS-MUWMNAH1181, the first purchase's reference** |
| Rows in `Order history` after two purchases | 2 | **1** |
| Orders returned by the order list after two purchases | 2 | **1** |
| Reference after the control (different product) | new reference | PS-MUWMNBWT168 (correct) |

Both `Place order` clicks empty the cart and show `Order confirmation`, so from the customer's point of view the second purchase succeeded. The confirmation is the first order's page: its `Order reference`, `Order details`, `Status` and history `Date` all belong to the earlier purchase, and the second purchase cannot be found anywhere in `Order history`.

Consequences:

- A returning customer who buys the same item again has no record of the second purchase; the history, the invoice (`PDF`) and the status shown for "the" order all describe the earlier transaction.
- Because the earlier order's status is carried over, a repeat purchase of an already `Delivered` order shows a confirmation whose `Status` reads `Delivered` for a purchase just placed.
- The collapse is silent: no message tells the customer that no new order was created.

The control checkout shows the flow itself is healthy: a different basket produced a new reference and a new history row. The trigger is the repetition of the *same* basket with the same address, carrier and payment.

## 8. Evidence

| Artifact | Content |
|---|---|
| `assets/bb03-order-1-confirmation.png` | First purchase: `Order reference` PS-MUWMNAH1181, Total $28.00 |
| `assets/bb03-order-2-confirmation.png` | Second identical purchase: the same reference and the same amounts |
| `assets/bb03-order-history-after-two-orders.png` | `Order history` after both purchases: one row, PS-MUWMNAH1181 |

Reproduction script: `scripts/repro-team-02.mjs` (check `BB-03`); full transcript in `scripts/repro.log` (look for the run block whose history starts empty).

## 9. Validation Status

Confirmed in one uninterrupted session on the running application, with the cart summary captured before each checkout to prove both baskets are identical (`identical carts=true`), and with a control checkout that created a new order. The observation is stable: once an order for a basket exists, every later checkout of that basket returns it instead of recording a new purchase.

Interpretation note: no requirement clause describes merging identical orders, and REQ-5.6 requires the reference of a new order to be assigned rather than inherited. If the reference system is nevertheless expected to de-duplicate identical baskets, this finding should be reclassified as intended behaviour; the observable facts above (one reference, one history row, unchanged order count for two completed checkouts) remain as recorded.
