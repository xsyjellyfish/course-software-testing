# BB-06: Order History Announces "You have no orders." for a Customer Who Has Orders

## 1. Test Method and Design Basis

- Test method: Black-box testing
- Testing technique: State transition testing over the asynchronous load of the order list (request pending → response rendered), using request throttling to make the intermediate state observable

This test checks what `Order history` displays while the order list is still being fetched for a customer who definitely has an order.

## 2. Requirement Reference

- REQ-7.5 — Read historical orders and details: *"Clicking "Order history and details"(role=link) shows the historical "PS-HISTORY-001"(role=row), with the order-history t-shirt, reference, date 2026-07-18, Delivered status, and Total 34. ... Order history is a named region."*

The region must present the customer's orders; the requirement gives no licence to state the opposite of the data at any moment of the load.

## 3. Difference from Existing Tests

`baseline/REQ-7.5.spec.ts` waits for the row `PS-HISTORY-001` with a retrying assertion, so it passes on the final state and never observes the intermediate state. Nothing in the baseline suite covers the pending state of `Order history`.

## 4. Preconditions

- The PrestaShop application is running with the seeded data.
- Signed-in customer: `prestashop_order_history_user@example.com` / `ShopPass123!`, who owns the seeded Delivered order `PS-HISTORY-001` (Total $34.00, 2026-07-18).
- The browser throttles `**/api/orders` by 5 s (DevTools "Slow 3G"-style emulation of a slow list request; the response content itself is untouched).

## 5. Reproduction Steps

1. Sign in as `prestashop_order_history_user@example.com`.
2. Slow the order-list request: in Playwright `page.route('**/api/orders', ...)` with a 5 s delay before `route.continue()`; in a browser, use DevTools network throttling.
3. Open `My account` → `Order history and details` (`/account/orders`).
4. As soon as the region `Order history` is visible, read its text.
5. Wait for the row `PS-HISTORY-001` and read the region text again.

## 6. Expected Behavior

Until the data arrives, the region shows a neutral loading state (or nothing), never a statement about the customer's data. A customer with a Delivered order must never be told that they have no orders.

## 7. Actual Behavior

Immediately after the region appears, the table header is rendered together with the empty-state sentence `You have no orders.`:

```text
[BB-06] during load: text="Order reference\tDate\tTotal\tStatus\tActions | You have no orders."
[BB-06] during load: "You have no orders." visible=true
[BB-06] during load: rows=1
[BB-06] after load: text="Order reference\tDate\tTotal\tStatus\tActions | PS-HISTORY-001\t2026-07-18 | $34.00 | Delivered | Hummingbird order-history t-shirt | Details | Reorder | PDF"
[BB-06] after load: "You have no orders." count=0
[BB-06] after load: rows=2
```

The message is removed when the response arrives, so the defect is a false empty state that is displayed for the whole duration of the fetch. It also occurs without artificial throttling: on this local instance the sentence flashes on every visit to `/account/orders` (observed while taking the pre-state reading of the BB-03 run), and it appears for the account that placed orders seconds earlier.

Consequences:

- The region first contradicts the customer's data; a user or an assistive-technology user who reacts to the first announcement is told that their order history is empty.
- No `aria-busy`/loading indication distinguishes "not loaded yet" from "genuinely empty", so the two states are indistinguishable while the message is on screen.

## 8. Evidence

| Artifact | Content |
|---|---|
| `assets/bb06-order-history-loading.png` | `Order history` with the header row and `You have no orders.` while the request is pending |
| `assets/bb06-order-history-loaded.png` | The same region after the response: `PS-HISTORY-001`, 2026-07-18, $34.00, Delivered |

Reproduction script: `scripts/repro-team-02.mjs` (check `BB-06`).

## 9. Validation Status

Confirmed in the target implementation on a freshly seeded database, both with a throttled list request (deterministic) and as a visible flash without throttling. The expected behaviour is derived from REQ-7.5's data requirement rather than from an explicit sentence about loading states, so the defect is the *false* content, not the absence of a spinner.
