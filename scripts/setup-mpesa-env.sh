#!/usr/bin/env bash
# Interactive helper: paste each Daraja credential; saves to .env (gitignored).
# Usage: from the project root, run:  bash scripts/setup-mpesa-env.sh
set -euo pipefail

ENV_FILE="${1:-.env}"
touch "$ENV_FILE"

upsert() {
  local key="$1" val="$2"
  # remove any existing line for this key
  if [ -f "$ENV_FILE" ]; then
    grep -v "^${key}=" "$ENV_FILE" > "${ENV_FILE}.tmp" 2>/dev/null || true
    mv "${ENV_FILE}.tmp" "$ENV_FILE" 2>/dev/null || true
  fi
  printf '%s="%s"\n' "$key" "$val" >> "$ENV_FILE"
}

ask() {
  local key="$1" label="$2" default="${3:-}" secret="${4:-0}"
  local val
  if [ "$secret" = "1" ]; then
    read -rsp "  $label: " val; echo
  else
    if [ -n "$default" ]; then
      read -rp "  $label [$default]: " val
      val="${val:-$default}"
    else
      read -rp "  $label: " val
    fi
  fi
  upsert "$key" "$val"
}

echo "Saving Daraja credentials to $ENV_FILE"
echo "Paste each value and press Enter. Secret inputs are hidden."
echo
ask MPESA_CONSUMER_KEY   "Consumer Key"           "" 1
ask MPESA_CONSUMER_SECRET "Consumer Secret"       "" 1
ask MPESA_SHORTCODE       "Shortcode"             "174379" 0
ask MPESA_PASSKEY         "Passkey"               "bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919" 0
ask MPESA_CALLBACK_URL    "Callback URL"          "https://your-domain.com/api/payments/callback" 0
ask APP_URL               "App URL"               "https://your-domain.com" 0
echo
echo "Done. Values stored in $ENV_FILE (gitignored)."
echo "Verify presence with:  grep -E '^(MPESA_|APP_URL)' $ENV_FILE | sed 's/=.*/=<set>/'"
