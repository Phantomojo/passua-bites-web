# Menu, media, and Arch staging review

Date: 15 August 2026 UTC.

## Menu/media changes

The homepage and menu now gate inline video source assignment with an `IntersectionObserver`-based `useLazyMedia` hook. Videos no longer open every media connection when the full menu grid renders; they load within a 240px viewport margin. Playback effects now handle rejected browser play promises safely. Food images retain lazy loading and asynchronous decoding, and now include intrinsic dimensions plus responsive `sizes` hints to reduce layout shift and avoid oversized transfers. Menu queries use a five-minute stale cache, thirty-minute garbage-collection window, and a single retry.

## Arch staging findings

The connected Arch host is `Linux 7.0.14-arch1-1`, with approximately 15 GiB RAM, 572 GiB free in `/home`, PostgreSQL client tools, Docker, and a dirty local Passua repository on `master` at `afae727`. The existing Arch checkout was not modified.

The host PostgreSQL server binary could not run because the installed binary requires `GLIBC_2.44`, while the host environment does not provide that version. Instead, the reviewed migrations were run in a disposable `postgres:16-alpine` Docker container on Arch. The container applied migrations `0000` through `0007` successfully, and verification confirmed the new `orders.trackingToken`, `subtotal`, `deliveryFee`, `totalPrice`, `deliveryZone`, `paymentSubmittedAt`, `paymentVerifiedAt`, and `paymentVerifiedBy` columns; the tracking index and unique constraint; and the order, menu-item, user, and payment foreign keys. The container, copied migrations, and temporary harness were deleted afterward. The Docker image may remain cached on Arch for future staging rehearsal.

No production database URL, application secret, admin password, customer data, or private key was copied to Arch. No production migration was executed.
