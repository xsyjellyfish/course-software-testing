# WB10 - White-box test: Registration empties an existing guest cart

## Description

Registration starts a new session and refreshes the cart under the new owner ID. The baseline registers with an empty cart. [Source](../../backend/src/slices/store.ts)

## Requirement: Expected Output

[REQ-4.1, REQ-6.2](../../requirements/requirements.yaml) - Under cart continuity across registration, the chosen shirt remains available. Preserving a guest cart across registration is inferred from cart continuity within a shopping flow.

## Test description

Start with the [seeded test environment](README.md).

1. Add one default detail shirt as a guest and confirm its cart quantity.
2. Open registration through Sign in. Enter New Customer, new_customer_7_3@example.com, ShopPass123! and 1995-08-21. Select Mr., Receive offers, Newsletter and Terms.
3. Save, verify New Customer is signed in and open the cart.

## Observed Output

The new customer sees an empty cart.

[Screenshot](evidence/WB10.png) · [Run log, search for WB10](evidence/browser.txt) · [Playwright test](business.spec.ts)
