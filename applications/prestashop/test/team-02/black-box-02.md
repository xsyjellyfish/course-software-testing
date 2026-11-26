# BB-02: Language Selection Has No Effect and Is Discarded on Navigation

## 1. Test Method and Design Basis

- Test method: Black-box testing
- Testing technique: State transition testing

This test checks whether selecting `Français` in the `Language` combobox of the global navigation changes the storefront language, and whether the selection survives navigation. All actions are performed through the user interface.

## 2. Requirement Reference

- REQ-1.1 — Discover storefront content: *"... access language selection through "Language"(role=combobox). ... Global navigation remains available across pages."*

REQ-1.1 requires the language control to exist and the navigation to remain available across pages. It does not enumerate translated strings, so the expectation "choosing Français applies French to the interface" is an interpretation of the purpose of a language selector, not a literal requirement clause. See section 9.

## 3. Difference from Existing Tests

`baseline/REQ-1.1.spec.ts` verifies that the `Language` combobox is visible and keyboard reachable (`tabTo`). It never changes the value, so the effect of a language selection is untested.

## 4. Preconditions

- The PrestaShop application is running.
- A fresh browser context (anonymous visitor) opens the homepage; the interface is in English.
- No customer login is required.

## 5. Reproduction Steps

1. Open `/` and read the global navigation text: `my store | CLOTHES | ACCESSORIES | ART | English | Français | Cart (0)`.
2. Read `document.documentElement.lang` (observed `"en"`).
3. Select `Français` in the `Language` combobox.
4. Wait for any transition and read the navigation text and `document.documentElement.lang` again.
5. Read the combobox value.
6. Navigate to `/cart` (or any other page) and read the combobox value again.

## 6. Expected Behavior

Selecting `Français` applies French to the storefront interface, and the chosen language remains selected while the visitor navigates between pages, as required for a persistent global navigation preference.

## 7. Actual Behavior

1. The only difference in the navigation text before and after the selection is that `Sign in` appears once the navigation has hydrated; every label — `my store`, `CLOTHES`, `ACCESSORIES`, `ART`, `Cart` — remains English.
2. `document.documentElement.lang` remains `"en"`, so assistive technology still announces the page as English.
3. The combobox itself shows `Français` on the homepage, but after navigating to `/cart` it renders `English` again: the selection is React state only and is discarded as soon as the storefront view is re-created.

```text
[BB-02] navigation before=my store | CLOTHES | ACCESSORIES | ART | English | Français | Cart (0)
[BB-02] html lang before="en"
[BB-02] combobox value=Français
[BB-02] navigation after=my store | CLOTHES | ACCESSORIES | ART | English | Français | Sign in | Cart (0)
[BB-02] html lang after="en"
[BB-02] combobox value after navigation=English
```

## 8. Evidence

| Artifact | Content |
|---|---|
| `assets/bb02-language-francais.png` | Homepage with `Français` selected in the Language combobox; all interface labels still English |

Reproduction script: `scripts/repro-team-02.mjs` (check `BB-02`).

## 9. Validation Status

Candidate fault-revealing test. The observed behaviour is unambiguous (no visible translation, no `lang` change, selection lost on navigation), but REQ-1.1 does not state how far translation must go, so whether "the interface must be translated" is in scope has to be confirmed against the reference system or by the TA. The loss of the selection on navigation is the part most directly attributable to REQ-1.1's "global navigation remains available across pages" clause.
