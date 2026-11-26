# WB07 - White-box test: The cart saves a fractional shirt quantity

## Description

A quantity of 1.5 passes both the lower and upper bounds for a cart update. The baseline enters the integer 3. [Source](../../backend/src/slices/store.ts)

## Requirement: Expected Output

[REQ-4.4](../../requirements/requirements.yaml) - For shirts sold by the unit, saved quantity is a whole number. The whole-number expectation is inferred from shirts being counted in units.

## Test description

Start with the [seeded test environment](README.md).

1. As a guest, add one M/White detail shirt and open the cart.
2. Enter 1.5 in Quantity, press Tab and reload. Read the saved quantity and subtotal.

## Observed Output

Quantity remains 1.5 with a $36 subtotal.

[Screenshot](evidence/WB07.png) · [Run log, search for WB07](evidence/browser.txt) · [Playwright test](business.spec.ts)
