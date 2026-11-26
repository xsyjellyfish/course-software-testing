# BB-05: The Enlarged Product Image Carries a Generic Accessible Name, Not the Selected Product Image

## 1. Test Method and Design Basis

- Test method: Black-box testing
- Testing technique: State transition testing over the image gallery (`Front`/`Back` selection → `Zoom` → `Close`), verified through the accessibility tree

This test checks whether the enlargement opened by `Zoom` presents *the currently selected product image* — as distinguished from any other image — and whether it stays identified after the thumbnail identity changes.

## 2. Requirement Reference

- REQ-3.8 — Open and close enlarged product image: *"Clicking "Zoom"(role=button) in Product images opens "Product image"(role=dialog) with the currently selected product image and a visible Front view or Back view caption. "Close"(role=button) dismisses the enlargement without changing the product or selected image."*
- REQ-3.7 — Switch product thumbnail image (the thumbnail identity `Front`/`Back` that the enlargement must reflect).

The dialog must carry the *selected* image; an image whose accessible name is a fixed placeholder cannot be mapped to the selection.

## 3. Difference from Existing Tests

- `baseline/REQ-3.7.spec.ts` switches thumbnails on the detail page and compares the main image source.
- `baseline/REQ-3.8.spec.ts` opens `Zoom` and asserts that the dialog contains an image named after the product. **This baseline test fails on a clean database** (see section 8); the enlargement keeps a caption but loses the product identity.

## 4. Preconditions

- The PrestaShop application is running with the seeded catalog.
- Anonymous visitor, product detail page `/product/1` (`Hummingbird detail t-shirt`) open.
- The main image currently has accessible name `Hummingbird detail t-shirt` (its `alt`).

## 5. Reproduction Steps

1. Open `/product/1`.
2. In the region `Product images`, read the main image's accessible name (observed `Hummingbird detail t-shirt`).
3. Click `Back` to switch the thumbnail identity, and read the main image again.
4. Click `Zoom`.
5. In the dialog `Product image`, enumerate images and read their accessible names; compare with the product name.
6. Click `Close` and re-read the page.

## 6. Expected Behavior

- The dialog contains an image whose accessible name identifies the selected product image (for example the product name plus the identity `Back`), matching the caption.
- Changing the thumbnail identity before opening `Zoom` changes what the enlargement is identified as.
- `Close` returns to the unchanged detail page.

## 7. Actual Behavior

The enlarged image has the fixed accessible name `Product image`, i.e. the dialog's own generic label, and it does not change when the selected identity changes:

```text
[BB-05] main image alt="Hummingbird detail t-shirt"
[BB-05] dialog text=Back view | Close
[BB-05] enlarged image alt="Product image"
[BB-05] images named after the product inside the dialog=0
[BB-05] dialog snapshot=- dialog "Product image": - img "Product image" - paragraph: Back view - button "Close"
```

Consequences:

- The requirement's "with the currently selected product image" is only satisfied visually; programmatically the enlargement is indistinguishable from a decorative placeholder.
- A screen-reader user is told "Product image" and "Back view", never which product, even though the same page announces the product name for the small image.
- Because the caption is the only carrier of the identity, any future identity (a second product page, a different thumbnail) would be announced identically.

The parts that do work are recorded for completeness: the dialog opens from `Zoom`, the caption `Back view` is visible, `Close` dismisses the dialog without changing the product, and the main image keeps `alt="Hummingbird detail t-shirt"` afterwards.

## 8. Evidence

| Artifact | Content |
|---|---|
| `assets/bb05-zoom-dialog.png` | `Zoom` enlargement: dialog named `Product image`, image named `Product image`, caption `Back view` |

Baseline confirmation on a clean database (`npx playwright test baseline/REQ-3.8.spec.ts`):

```text
Locator: getByRole('dialog', { name: 'Product image', exact: true }).getByRole('img', { name: 'Hummingbird detail t-shirt', exact: true })
Expected: 1
Received: 0
  1 failed  › REQ-3.8: Open and close enlarged product image
```

Reproduction script: `scripts/repro-team-02.mjs` (check `BB-05`).

## 9. Validation Status

Confirmed in the target implementation on a freshly seeded database, and consistent with the failing baseline test. The requirement's phrase "with the currently selected product image" is interpreted as requiring the selected image to be identified, which is the reading the baseline test also encodes.
