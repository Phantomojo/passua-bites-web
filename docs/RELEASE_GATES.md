# Release Gates and Rollback

## Required before merge
- `pnpm check` passes
- `pnpm test` passes
- `pnpm vercel-build` passes
- No secrets in diff (gitleaks clean)
- No high/critical dependency vulnerabilities untriaged

## Required before production deploy
- Workstream PR reviewed and approved
- Migration safety notes reviewed
- No production DB changes without release assessment
- Rollback commit identified

## Rollback
- Revert the deployment in Vercel to the previous production deployment.
- If a migration was applied, document the reverse SQL and apply only after assessment.
- Restore environment variables from Vercel project settings if changed.
