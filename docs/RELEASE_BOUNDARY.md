# Passua Bites — Consolidated Implementation Plan (Scope Freeze)

## Release objective
Customer can view menu, place order, arrange payment (Pochi/cash), track order; owner can securely manage orders/payments.

## Environments
- Development: feature work, synthetic data.
- Staging: release candidates, sandbox M-Pesa, migration testing.
- Production: approved releases only.

## Workstream status
- PR #6 Payment/order security: in progress (latest `cbd2ed26`).
- PR #7 Owner auth: separate workstream.
- PR #8 CI/CD: consolidate to one workflow.
- PR #9 WhatsApp: deferred post-V1.

## Payment boundary
Automated M-Pesa STK settlement disabled for V1. Pochi manual verification + COD only. No Paybill.

## Migration plan
- Consolidated migration: `drizzle/0006_true_ghost_rider.sql` + `drizzle/0007_groovy_strong_guy.sql`.
- Pre-migration duplicate-active check required.
- No production application without approval.

## Remaining release blockers
1. Database-backed concurrency/callback integration tests not yet implemented.
2. CI green run not yet obtained.
3. Role-based authorization review (PR #7).
4. Staging acceptance test report.
5. Deployment/rollback checklist execution.

## Rollback
- Revert application deployment to previous Vercel release.
- Database rollback via documented reverse migration (manual, approval-controlled).
