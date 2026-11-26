# WB01 - White-box test: Size and color filters match different variants

## Description

Two separate some() calls can match different variants. The size baseline selects M alone and the combined-filter baseline checks stock and price. [Source](../../frontend/src/pages/Catalog.tsx)

## Requirement: Expected Output

[REQ-2.7, REQ-2.10](../../requirements/requirements.yaml) - Under variant-level intersection, only purchasable combinations match. The requirement defines intersection but leaves its granularity implicit. This case interprets it at the variant level.

## Test description

Start with the [seeded test environment](README.md).

1. Open Men. Select L and confirm the detail shirt appears.
2. Also select White. Inspect the product list and count.

## Observed Output

One shirt remains despite offering only M/White and L/Black.

[Screenshot](evidence/WB01.png) · [Run log, search for WB01](evidence/browser.txt) · [Playwright test](business.spec.ts)
