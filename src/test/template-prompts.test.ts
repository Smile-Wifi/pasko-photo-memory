// @vitest-environment node
import { describe, expect, it } from "vitest";
import { STYLES, IDENTITY_RULE } from "@/lib/catalog";

describe("Owner's five Christmas scenes", () => {
  it("uses Simbang Gabi church and lantern instructions for the stored santa style", () => {
    expect(STYLES.find(s => s.key === "santa")?.prompt).toMatch(/Simbang Gabi.*Filipino stone church.*handheld lanterns/);
  });
  it("dresses the Simbang Gabi style in casual mass clothes instead of barong", () => {
    const prompt = STYLES.find(s => s.key === "santa")?.prompt ?? "";
    expect(prompt).toContain("casual, modest Simbang Gabi mass-outing clothes");
    expect(prompt).toContain("No barong Tagalog");
    expect(prompt).toContain("no Filipiniana gowns");
  });
  it("uses Snow forest and winter coats for the stored winter style", () => {
    expect(STYLES.find(s => s.key === "winter")?.prompt).toMatch(/Snow winter portrait.*pine forest.*winter coats/);
  });
  it("uses matching tartan pajamas on a sofa for the stored family style", () => {
    expect(STYLES.find(s => s.key === "family")?.prompt).toMatch(/Pajama portrait.*tartan pajamas.*sofa/);
  });
  it("uses a parol-filled street celebration for the stored lights style", () => {
    expect(STYLES.find(s => s.key === "lights")?.prompt).toMatch(/Street Celebration.*colorful glowing parol/);
  });
  it("uses traditional barong and burgundy Filipiniana for the stored fashion style", () => {
    expect(STYLES.find(s => s.key === "fashion")?.prompt).toMatch(/Spanish-colonial Filipino home.*barong Tagalog.*burgundy Filipiniana/);
  });
  it("keeps the uploaded people rather than copying the illustrative family", () => {
    expect(IDENTITY_RULE).toContain("Preserve the exact number of subjects");
    expect(IDENTITY_RULE).toContain("never copy the illustrative sample family");
  });
});