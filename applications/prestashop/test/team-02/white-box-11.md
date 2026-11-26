# WB11 - White-box test: The global category menu stops opening on its parent page

## Description

ClothesMenu renders the submenu only when open && !onParentCategory. The baseline opens the menu on the homepage or uses links in the parent page body. [Source](../../frontend/src/foundation/Shell.tsx)

## Requirement: Expected Output

[REQ-1.2](../../requirements/requirements.yaml) - Activating the global CLOTHES control exposes Women and Men.

## Test description

Start with the [seeded test environment](README.md).

1. Hover over CLOTHES on the homepage and verify Women appears. Click CLOTHES to open its parent page.
2. Move away, hover over the same global link again, then focus it and press Enter. Inspect global navigation.

## Observed Output

Women is absent from global navigation.

[Screenshot](evidence/WB11.png) · [Run log, search for WB11](evidence/navigation.txt) · [Playwright test](business.spec.ts)
