# WB02 - White-box test: Editing a shipping address changes the invoice address

## Description

Saving an address sets both addressId and invoiceId. The baseline exercises separate invoicing and shipping edits independently. [Source](../../frontend/src/pages/Checkout.tsx)

## Requirement: Expected Output

[REQ-5.4, REQ-5.7](../../requirements/requirements.yaml) - Office stays selected for invoicing.

## Test description

Start with the [seeded test environment](README.md).

1. Sign in as checkout_invoice_user and create Office and Home. Add the checkout-step shirt and proceed to checkout.
2. Select Home for shipping, clear Use same address and select Office for invoicing.
3. Edit the Home street to 88 Market Street, save and inspect the invoice selection.

## Observed Output

Home becomes the checked invoice address.

[Screenshot](evidence/WB02.png) · [Run log, search for WB02](evidence/browser.txt) · [Playwright test](business.spec.ts)
