# WB05 - White-box test: Renaming a wishlist changes another list

## Description

On a name collision, the rename handler transfers items to the destination list. The baseline renames to an unused name or deletes one of two lists. [Source](../../backend/src/slices/store.ts)

## Requirement: Expected Output

[REQ-7.7, REQ-7.8](../../requirements/requirements.yaml) - Renaming Favorites preserves the contents of the other list. The expected result follows from the requirement that a mutation affects the selected business object.

## Test description

Start with the [seeded test environment](README.md).

1. Sign in as wishlist_view_user. Create Holiday Picks, open it and verify it is empty. Keep its URL.
2. Rename the populated Favorites list to Holiday Picks. Reopen the original destination URL and inspect its items.

## Observed Output

Holiday Picks gains the wishlist shirt.

[Screenshot](evidence/WB05.png) · [Run log, search for WB05](evidence/browser.txt) · [Playwright test](business.spec.ts)
