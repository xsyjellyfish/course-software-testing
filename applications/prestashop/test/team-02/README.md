# PrestaShop - Team 02 White-box Tests

Team members: xvsuyi, luoyawen, fanghaotian. Tested revision: `024c2bc`.

| Case | Finding | Requirements |
| --- | --- | --- |
| [WB01](white-box-01.md) | Size and color filters match different variants | REQ-2.7, REQ-2.10 |
| [WB02](white-box-02.md) | Editing a shipping address changes the invoice address | REQ-5.4, REQ-5.7 |
| [WB03](white-box-03.md) | Two purchases receive the same order reference | REQ-5.6 |
| [WB04](white-box-04.md) | Creating an address overwrites an existing address | REQ-7.3, REQ-7.4 |
| [WB05](white-box-05.md) | Renaming a wishlist changes another list | REQ-7.7, REQ-7.8 |
| [WB06](white-box-06.md) | Signing in merges cart quantities beyond stock | REQ-3.2, REQ-3.9 |
| [WB07](white-box-07.md) | The cart saves a fractional shirt quantity | REQ-4.4 |
| [WB08](white-box-08.md) | Adding the same shirt twice leaves one unit | REQ-3.3, REQ-4.1 |
| [WB09](white-box-09.md) | Keyboard focus disappears from search suggestions | REQ-1.1, REQ-1.3 |
| [WB10](white-box-10.md) | Registration empties an existing guest cart | REQ-4.1, REQ-6.2 |
| [WB11](white-box-11.md) | The global category menu stops opening on its parent page | REQ-1.2 |
| [WB12](white-box-12.md) | Returning from the cart resets the product variant | REQ-3.9, REQ-4.5 |

## Running the tests

Use Node.js 22.12+, npm, Google Chrome and Playwright Test 1.55. From the repository root, run:

```sh
cd applications/prestashop
npm ci --include=dev --include=optional
npm install --no-save --package-lock=false @playwright/test@1.55.0
npx playwright test -c test/team-02 --reporter=list
```

To run one case, append `-g WB08` (or another case ID) to the last command. Leave port 4188 available. The runner starts a fresh in-memory database. Each assertion checks expected behavior and fails when the reported discrepancy occurs. Screenshots and logs record the local implementation.

For manual reproduction, run `DATABASE_URL=:memory: sh start.sh` from the application directory and open the printed URL. Account names in the cases expand to `prestashop_<name>@example.com` with password `ShopPass123!`. Default address fields are Store User, 1 Commerce Road, 200000, Shanghai, China and 13800000020.
