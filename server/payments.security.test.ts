import "dotenv/config";
import { describe, expect, it } from "vitest";
import {
  signOrderPaymentToken,
  verifyOrderPaymentToken,
} from "./_core/paymentToken";
import { formatPhoneNumber } from "./routers/payments";

describe("payment token", () => {
  it("verifies a valid token for the matching order", () => {
    const token = signOrderPaymentToken(42);
    expect(verifyOrderPaymentToken(token, 42)).toBe(true);
  });

  it("rejects a token for a different order", () => {
    const token = signOrderPaymentToken(42);
    expect(verifyOrderPaymentToken(token, 43)).toBe(false);
  });

  it("rejects malformed tokens", () => {
    expect(verifyOrderPaymentToken("not-a-token", 1)).toBe(false);
    expect(verifyOrderPaymentToken("", 1)).toBe(false);
    expect(verifyOrderPaymentToken("a.b.c", 1)).toBe(false);
  });

  it("rejects expired tokens", () => {
    const token = signOrderPaymentToken(7, -1000);
    expect(verifyOrderPaymentToken(token, 7)).toBe(false);
  });

  it("fails closed when production secret is missing", () => {
    const oldNodeEnv = process.env.NODE_ENV;
    const oldSecret = process.env.ORDER_PAYMENT_TOKEN_SECRET;
    process.env.NODE_ENV = "production";
    delete process.env.ORDER_PAYMENT_TOKEN_SECRET;
    try {
      expect(() => signOrderPaymentToken(1)).toThrow();
    } finally {
      process.env.NODE_ENV = oldNodeEnv;
      if (oldSecret) process.env.ORDER_PAYMENT_TOKEN_SECRET = oldSecret;
    }
  });
});

describe("phone formatting", () => {
  it("normalizes local numbers", () => {
    expect(formatPhoneNumber("0712345678")).toBe("254712345678");
  });

  it("rejects invalid numbers", () => {
    expect(() => formatPhoneNumber("123")).toThrow();
  });
});