import crypto from "crypto";

const SCRYPT_KEYLEN = 64;
const SCRYPT_COST = 16384;

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16);
  const derived = crypto.scryptSync(password, salt, SCRYPT_KEYLEN, {
    N: SCRYPT_COST,
  });
  return `scrypt$${SCRYPT_COST}$${salt.toString("hex")}$${derived.toString("hex")}`;
}

export function verifyPassword(password: string, hash: string): boolean {
  const parts = hash.split("$");
  if (parts.length !== 4 || parts[0] !== "scrypt") return false;
  const cost = Number(parts[1]);
  const salt = Buffer.from(parts[2], "hex");
  const stored = Buffer.from(parts[3], "hex");
  const derived = crypto.scryptSync(password, salt, stored.length, { N: cost });
  return crypto.timingSafeEqual(stored, derived);
}