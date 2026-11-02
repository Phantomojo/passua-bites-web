import crypto from "crypto";

const TOKEN_VERSION = 1;
const TOKEN_PURPOSE = "order_payment";
const DEFAULT_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours

function getSecret(): string {
  const isProduction = process.env.NODE_ENV === "production";
  const secret = process.env.ORDER_PAYMENT_TOKEN_SECRET;
  if (isProduction) {
    if (!secret || secret.trim() === "") {
      throw new Error("ORDER_PAYMENT_TOKEN_SECRET is required in production");
    }
    return secret.trim();
  }
  return (
    secret ||
    process.env.JWT_SECRET ||
    process.env.COOKIE_SECRET ||
    "dev-payment-token-secret"
  ).trim();
}

type PaymentTokenPayload = {
  v: number;
  p: string;
  o: number;
  exp: number;
};

function encodePayload(payload: PaymentTokenPayload): string {
  return Buffer.from(JSON.stringify(payload)).toString("base64url");
}

export function signOrderPaymentToken(
  orderId: number,
  expiresInMs: number = DEFAULT_TTL_MS
): string {
  const payload: PaymentTokenPayload = {
    v: TOKEN_VERSION,
    p: TOKEN_PURPOSE,
    o: orderId,
    exp: Date.now() + expiresInMs,
  };
  const encoded = encodePayload(payload);
  const hmac = crypto
    .createHmac("sha256", getSecret())
    .update(encoded)
    .digest("base64url");
  return `${encoded}.${hmac}`;
}

export function verifyOrderPaymentToken(token: string, orderId: number): boolean {
  if (typeof token !== "string" || token.indexOf(".") === -1) return false;
  const [encoded, hmac] = token.split(".");
  if (!encoded || !hmac) return false;

  let payload: PaymentTokenPayload;
  try {
    payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
  } catch {
    return false;
  }

  if (!payload || typeof payload !== "object") return false;
  if (payload.v !== TOKEN_VERSION) return false;
  if (payload.p !== TOKEN_PURPOSE) return false;
  if (payload.o !== orderId) return false;
  if (typeof payload.exp !== "number" || !Number.isFinite(payload.exp)) return false;
  if (Date.now() > payload.exp) return false;

  const expected = crypto
    .createHmac("sha256", getSecret())
    .update(encoded)
    .digest("base64url");

  const a = Buffer.from(hmac);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}