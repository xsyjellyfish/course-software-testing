# WB09 - White-box test: Keyboard focus disappears from search suggestions

## Description

Tab triggers a 120 ms blur timer on the search field. The baseline presses Enter while focus is still in that field. [Source](../../frontend/src/foundation/Shell.tsx)

## Requirement: Expected Output

[REQ-1.1, REQ-1.3](../../requirements/requirements.yaml) - A keyboard user can activate the focused suggestion.

## Test description

Start with the [seeded test environment](README.md).

1. Type shirt in Search. Press Tab and verify the detail shirt suggestion has focus.
2. Wait 350 ms, press Enter and inspect the page.

## Observed Output

The suggestion disappears and the homepage remains open.

[Screenshot](evidence/WB09.png) · [Run log, search for WB09](evidence/browser.txt) · [Playwright test](business.spec.ts)
