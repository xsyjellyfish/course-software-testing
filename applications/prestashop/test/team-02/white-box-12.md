# WB12 - White-box test: Returning from the cart resets the product variant

## Description

Remounting ProductPage initializes size and color from product defaults. The baseline changes variants within the detail page or ends at the cart. [Source](../../frontend/src/pages/Product.tsx)

## Requirement: Expected Output

[REQ-3.9, REQ-4.5](../../requirements/requirements.yaml) - Returning in the same flow preserves L/Black at $36.

## Test description

Start with the [seeded test environment](README.md).

1. Open the detail shirt, select L and verify Black is selected. Add one unit and open the cart from the dialog.
2. Verify Black in the cart row. Use browser Back and inspect size, color and price.

## Observed Output

The detail page displays M/White at $24.

[Screenshot](evidence/WB12.png) · [Run log, search for WB12](evidence/navigation.txt) · [Playwright test](business.spec.ts)
