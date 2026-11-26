# WB04 - White-box test: Creating an address overwrites an existing address

## Description

The create handler updates an existing row when the alias matches. Baseline cases create a fresh alias or explicitly edit a saved address. [Source](../../backend/src/slices/store.ts)

## Requirement: Expected Output

[REQ-7.3, REQ-7.4](../../requirements/requirements.yaml) - Creating an address preserves the previously saved street. The requirement distinguishes creation from editing and leaves duplicate-name handling open.

## Test description

Start with the [seeded test environment](README.md).

1. Sign in as address_create_user and create Home at 1 Commerce Road.
2. Choose Create new address. Use Home again with street 88 Market Street. Save and reload the address book.

## Observed Output

Only 88 Market Street remains.

[Screenshot](evidence/WB04.png) · [Run log, search for WB04](evidence/browser.txt) · [Playwright test](business.spec.ts)
