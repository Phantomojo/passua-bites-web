#!/usr/bin/env bash
set -euo pipefail

# Deploy to Railway — run this locally after installing the Railway CLI.
# The caller must provide secrets through the environment; this script never stores them.

: "${NEON_DATABASE_URL:?Set NEON_DATABASE_URL before running this script}"
: "${JWT_SECRET:?Set JWT_SECRET before running this script}"
: "${ADMIN_PASSWORD:?Set ADMIN_PASSWORD before running this script}"

# 1. Login interactively
railway login

# 2. Link to project (select your existing project when prompted)
railway link

# 3. Set required environment variables
railway vars set \
  DATABASE_URL="$NEON_DATABASE_URL" \
  JWT_SECRET="$JWT_SECRET" \
  ADMIN_PASSWORD="$ADMIN_PASSWORD" \
  PAYMENT_MODE="${PAYMENT_MODE:-pochi}" \
  POCHI_BUSINESS_NUMBER="${POCHI_BUSINESS_NUMBER:-0725619991}"

# Legacy Daraja/STK variables are optional and should only be supplied after Safaricom onboarding.
if [[ -n "${MPESA_CONSUMER_KEY:-}" && -n "${MPESA_CONSUMER_SECRET:-}" && -n "${MPESA_SHORTCODE:-}" && -n "${MPESA_PASSKEY:-}" && -n "${MPESA_CALLBACK_URL:-}" ]]; then
  railway vars set \
    MPESA_CONSUMER_KEY="$MPESA_CONSUMER_KEY" \
    MPESA_CONSUMER_SECRET="$MPESA_CONSUMER_SECRET" \
    MPESA_SHORTCODE="$MPESA_SHORTCODE" \
    MPESA_PASSKEY="$MPESA_PASSKEY" \
    MPESA_CALLBACK_URL="$MPESA_CALLBACK_URL"
fi

# 4. Deploy
railway up

# 5. Get the URL
railway domain
