import { describe, expect, it } from "vitest";
import { ORDER_STEPS, canAdvance, canGenerate, generationOrder, templateSchema } from "@/lib/order-process";

describe("Required order process", () => {
  it("follows upload, template, payment, generation", () => {
    expect(ORDER_STEPS).toEqual(["upload", "template", "payment", "generate"]);
  });
  it("requires one photo before choosing a template", () => {
    expect(canAdvance(1, false, null)).toBe(false);
    expect(canAdvance(1, true, null)).toBe(true);
  });
  it("requires a chosen template before payment", () => {
    expect(canAdvance(2, true, null)).toBe(false);
    expect(canAdvance(2, true, "winter")).toBe(true);
    expect(templateSchema.safeParse("unknown").success).toBe(false);
  });
  it("produces all five styles starting with the selected template", () => {
    expect(generationOrder("winter")).toEqual([2, 0, 1, 3, 4]);
  });
  it("blocks generation without verified payment, even for failed orders", () => {
    expect(canGenerate("pending_payment", null)).toBe(false);
    expect(canGenerate("failed", null)).toBe(false);
    expect(canGenerate("payment_verified", "2026-11-07T04:04:00Z")).toBe(true);
    expect(canGenerate("failed", "2026-11-07T04:04:00Z")).toBe(true);
  });
});