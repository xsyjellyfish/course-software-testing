# WB08 - White-box test: Adding the same shirt twice leaves one unit

## Description

The first addition inserts a row. The second assigns the requested quantity to that row. The baseline adds once or increments inside the cart. [Source](../../backend/src/slices/store.ts)

## Requirement: Expected Output

[REQ-3.3, REQ-4.1](../../requirements/requirements.yaml) - Two additions of one unit yield two units.

## Test description

Start with the [seeded test environment](README.md).

1. Open the cart shirt as a guest and add one unit. Choose Continue shopping and verify the header count is one.
2. Add one more unit from the product page and open the cart from the success dialog.

## Observed Output

Both additions succeed but the cart shows one unit at $25.

[Screenshot](evidence/WB08.png) · [Run log, search for WB08](evidence/browser.txt) · [Playwright test](business.spec.ts)
