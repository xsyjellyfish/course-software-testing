# Team 02 — Six Black-Box Defects in the PrestaShop Storefront

Each document below records one independent black-box defect: the technique, the requirement clause it is measured against, why the baseline suite does not catch it, the preconditions, the click path, the expected result, the observed result captured from a real run, the evidence artifacts and the validation status.

| ID | Defect | Requirement | Technique | Baseline evidence | Script check |
|---|---|---|---|---|---|
| [BB-01](black-box-01.md) | Repeating Add to cart for a variant already in the cart **overwrites** its quantity: 2 + 1 unit ends at 1 unit ($24.00, total $29.00) instead of 3 units | REQ-3.3, REQ-4.1 | State transition testing (cart quantity states) | Baseline only adds a variant once, so the accumulate path is untested | `BB-01` |
| [BB-02](black-box-02.md) | Selecting `Français` changes nothing (`html lang` stays `en`, every label stays English) and the combobox reverts to `English` after navigation | REQ-1.1 | State transition testing (selection → navigation) | Baseline only asserts the combobox exists | `BB-02` |
| [BB-03](black-box-03.md) | A second identical purchase (same basket, address, carrier, payment) returns the **first** order reference, adds no history row and leaves the order count unchanged | REQ-5.6, REQ-7.5 | State transition testing over the order state machine, with a control checkout | No baseline test repeats a purchase | `BB-03` |
| [BB-04](black-box-04.md) | `Shipping Method` contains no named region at all, the only `Shipping cost` region lives inside `Order summary`, and the `Delivery` radio carries no cost | REQ-5.4 | Equivalence partitioning over checkout regions, read through the accessibility tree | **`REQ-5.4` "Choose Delivery" fails** with `element(s) not found` | `BB-04` |
| [BB-05](black-box-05.md) | The enlarged image in the `Zoom` dialog keeps the fixed name `Product image` and never identifies the selected image | REQ-3.8, REQ-3.7 | State transition testing over the gallery, read through the accessibility tree | **`REQ-3.8` fails**: dialog image named after the product → count 0 | `BB-05` |
| [BB-06](black-box-06.md) | `Order history` shows `You have no orders.` while the order request is pending, for a customer who has an order | REQ-7.5 | State transition testing over the asynchronous load, request throttled to expose the intermediate state | Baseline reads the list only after it has loaded | `BB-06` |

## Reproducing

The checks drive the user interface only: no application source is read and no API is called directly.

1. Start the application so that the storefront answers on `http://127.0.0.1:3000` (from `applications/prestashop`: `npm run build` then `npm start`).
2. Point the script at a folder that owns a Playwright installation, then run it:

```powershell
cd applications/prestashop/test/team-02/scripts
$env:BASE_URL = 'http://127.0.0.1:3000'
$env:PLAYWRIGHT_HOME = 'd:/481/11.25/pw/'   # folder whose node_modules contains @playwright/test
node repro-team-02.mjs                       # all six checks
$env:ONLY = 'BB-04'; node repro-team-02.mjs  # a single check
```

The script creates the fixtures it needs (address alias `Home`, Bank wire payment, `Terms and conditions`), writes screenshots into [`assets/`](assets) and appends a transcript to [`scripts/repro.log`](scripts/repro.log). That file holds the run the documents quote (freshly seeded database); earlier runs, including a script error that has since been fixed, are kept in [`scripts/repro-history.log`](scripts/repro-history.log).

## Fixtures

| Account | Password | Used by |
|---|---|---|
| `prestashop_checkout_invoice_user@example.com` | `ShopPass123!` | BB-04 |
| `prestashop_checkout_6_7_user@example.com` | `ShopPass123!` | BB-03 |
| `prestashop_order_history_user@example.com` | `ShopPass123!` | BB-06 |

Products: `/product/1` (detail t-shirt, $24.00), `/product/3` (checkout-step t-shirt, $26.00), `/product/7` (wishlist t-shirt, $23.00), `/product/8` (White t-shirt, $22.00). BB-01, BB-02 and BB-05 need no account.

## Caveats

- **BB-02** is reported as a *candidate*. REQ-1.1 requires the `Language` combobox and persistent navigation but does not enumerate translated strings, so the missing translation is an interpretation of the control's purpose; the part that is directly attributable to REQ-1.1 is that the selection is lost on navigation. Section 9 of the document states this.
- **BB-03** could be intended de-duplication of identical baskets. The observable facts (one reference, one history row, an unchanged order count for two completed checkouts, while a different basket does create a new order) are recorded; if the store is meant to behave this way the finding should be reclassified rather than dropped.
- **BB-03** and **BB-06** mutate stored data, and BB-03 needs an account without orders, so the recorded run was made on a freshly seeded database. To repeat it exactly, stop the application, move `backend/data/app.db*` aside, start it again (the schema and the seed data are recreated on boot) and run `node repro-team-02.mjs`. Order reference strings are generated per database, so a rebuilt database produces different strings with the same relation; the documents quote the values of the run in `scripts/repro.log` that starts from an empty `Order history`.
