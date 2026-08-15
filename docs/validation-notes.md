# Passua Bites local validation notes

Date: 15 August 2026.

| Check | Result |
| --- | --- |
| TypeScript check after Pochi/admin changes | Passed |
| Vitest suite | Passed: 2 files, 5 tests |
| Production build | Passed: Vite 7.3.6 frontend plus esbuild API bundle |
| Local `/health` endpoint | HTTP 200 on both local listeners |
| Allowed CORS preflight | HTTP 204 with the exact Vercel origin and credentials enabled |
| Unknown CORS preflight | HTTP 403 with no reflected origin |
| `payments.getInstructions` | Returned Pochi la Biashara and `0725619991` without database access |
| Malformed legacy M-Pesa callback | HTTP 200 acknowledgement; no production credentials used |
| Unknown-shaped legacy callback | HTTP 200 acknowledgement; unknown transaction was not accepted |
| Critical dependency advisories after upgrades | 0 reported by pnpm audit; residual low/moderate/high advisories remain and are documented for review |

The local smoke tests did not submit an order, enter a customer phone number, send a payment, use a production database, or deploy to Vercel/Render. The admin browser check only inspected the login screen and did not submit credentials.

## Final validation rerun

After the workspace-manifest cleanup, `pnpm install --frozen-lockfile`, `pnpm run check`, `pnpm run test`, and `pnpm run build` all passed. The final audit reported **0 critical**, **9 high**, **15 moderate**, and **3 low** advisories in the resolved dependency tree. The remaining high/moderate/low findings are not presented as zero-risk; they require a separate upgrade review, but the original critical advisory class was eliminated.

The only non-failing test output is the existing informational OAuth warning that `OAUTH_SERVER_URL` is not configured in the secrets-free local test environment.
