# WB03 - White-box test: Two purchases receive the same order reference

## Description

The second checkout matches a historical order on address, payment, shipping, total and line items. The baseline places one order per account. [Source](../../backend/src/slices/store.ts)

## Requirement: Expected Output

[REQ-5.6](../../requirements/requirements.yaml) - A second completed purchase gets its own order reference.

## Test description

Start with the [seeded test environment](README.md).

1. Sign in as checkout_6_7_user. Create Home and buy one order-complete shirt using Delivery and Bank wire. Accept the terms and record the reference.
2. Continue shopping, add the same shirt to the fresh cart and repeat checkout. Compare references.

## Observed Output

Both confirmations show the same reference.

[Screenshot](evidence/WB03.png) · [Run log, search for WB03](evidence/browser.txt) · [Playwright test](business.spec.ts)
