# Customer messaging and owner operations

Customers continue using the public website; they do not install an app. The public order acknowledgement must say **Order received**, not **Order confirmed**, because the order starts pending and kitchen acceptance/payment verification happen later.

Owners should receive a separate installable PWA backed by the same API/database. Its home screen is a kitchen queue for new, accepted, preparing and ready orders, with one clear next action per order. Menu availability, sales, completed orders, reviews and settings are secondary. Owner PWA, service worker, push and walk-in POS are outside this PR.

## Availability
- Public menu includes unavailable records.
- Sold-out items remain visible but cannot be added.
- Menu refreshes every 15 seconds while open.
- Server order creation re-checks availability and rejects stale carts.
- No hard-coded fallback menu when the database has no items.

## WhatsApp consent
Two optional permissions are independent: per-order transactional status updates, and persistent marketing offers/new-menu announcements. Order consent is stored on each order. Marketing consent is stored by normalized phone in `customerMessagingPreferences`. Ordering does not silently subscribe customers to marketing.

Inbound STOP/STOPALL/UNSUBSCRIBE/CANCEL/END/QUIT messages revoke marketing consent and outstanding per-order update consent for that phone. Campaign creation/sending is not implemented in this PR.

## Meta Cloud API setup
Keep credentials server-side only; never use VITE_ prefixes.
- `WHATSAPP_ACCESS_TOKEN`: Meta system-user token.
- `WHATSAPP_PHONE_NUMBER_ID`: Cloud API phone-number ID.
- `WHATSAPP_GRAPH_API_VERSION`: configured Graph API version.
- `WHATSAPP_APP_SECRET`: webhook signature secret.
- `WHATSAPP_WEBHOOK_VERIFY_TOKEN`: chosen webhook verify token.
- `WHATSAPP_TEMPLATE_LANGUAGE`: language code.
- `WHATSAPP_ORDER_RECEIVED_TEMPLATE`: approved Utility template.
- `WHATSAPP_ORDER_STATUS_TEMPLATE`: approved Utility template.

Webhook: `https://<api-host>/api/webhooks/whatsapp`; GET challenge is checked and POST `X-Hub-Signature-256` is verified against raw body. Suggested templates: `passua_order_received` (name, order reference, total, payment note), `passua_order_status` (name, order reference, status, total). Ensure approved template parameter order matches server values.

Provider failure does not roll back an order. Durable retries/outbox and delivery receipt tracking remain follow-up tasks. Apply migration 0008 after 0005–0007; configure templates and secrets; test opt-in permutations, STOP, and stale sold-out carts. Policy/docs: https://whatsappbusiness.com/policy/ and https://developers.facebook.com/docs/whatsapp/cloud-api/guides/send-messages/
