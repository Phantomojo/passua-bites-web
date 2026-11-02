import crypto from "crypto";

function getSecret(): string {
  const secret = process.env.JWT_SECRET || process.env.COOKIE_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET or COOKIE_SECRET is required for payment tokens");
  }
  return secret;
}

export function signOrderPaymentToken(orderId: number): string {
  const payload = String(orderId);
  const hmac = crypto
    .createHmac("sha256", getSecret())
    .update(payload)
    .digest("base64url");
  return `${Buffer.from(payload).toString("base64url")}.${hmac}`;
}

export function verifyOrderPaymentToken(token: string, orderId: number): boolean {
  if (typeof token !== "string" || token.indexOf(".") === -1) return false;
  const [payloadB64, hmac] = token.split(".");
  let payload: string;
  try {
    payload = Buffer.from(payloadB64, "base64url").toString("utf8");
  } catch {
    return false;
  }
  if (payload !== String(orderId)) return false;
  const expected = crypto
    .createHmac("sha256", getSecret())
    .update(payload)
    .digest("base64url");
  const a = Buffer.from(hmac);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}