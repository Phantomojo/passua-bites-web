import { describe, expect, it } from "vitest";
import { maskName, maskPhone } from "./routers/orders";
import { normalizeReceiptCode } from "./routers/payments";

describe("public order privacy", () => {
  it("masks a phone number to its final four digits", () => {
    expect(maskPhone("0712345678")).toBe("••••••5678");
  });

  it("masks names without exposing the complete customer name", () => {
    expect(maskName("Amina Wanjiku")).toBe("A••• W•••");
    expect(maskName("Amina")).toBe("A•••");
  });
});

describe("Pochi receipt validation", () => {
  it("normalizes a valid receipt code", () => {
    expect(normalizeReceiptCode("  qjk7abcd12  ")).toBe("QJK7ABCD12");
  });

  it("rejects values that are too short or contain unsafe characters", () => {
    expect(() => normalizeReceiptCode("short")).toThrow();
    expect(() => normalizeReceiptCode("QJK7-ABCD")).toThrow();
  });
});
