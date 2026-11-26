# WB06 - White-box test: Signing in merges cart quantities beyond stock

## Description

The matching-row login branch adds quantities without applying the normal stock check. The baseline tests an oversized single addition and a valid two-unit addition separately. [Source](../../backend/src/slices/store.ts)

## Requirement: Expected Output

[REQ-3.2, REQ-3.9](../../requirements/requirements.yaml) - L/Black quantity stays within its stock of two.

## Test description

Start with the [seeded test environment](README.md).

1. Sign in as user and add two L/Black detail shirts. Verify the displayed stock is two.
2. Sign out, add one L/Black shirt as a guest, then sign back in to the same account. Inspect the cart.

## Observed Output

Cart shows three units and a $108 subtotal.

[Screenshot](evidence/WB06.png) · [Run log, search for WB06](evidence/browser.txt) · [Playwright test](business.spec.ts)
