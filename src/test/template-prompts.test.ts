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
  it("puts a red Santa hat on every subject in the Pajama style", () => {
    const prompt = STYLES.find(s => s.key === "family")?.prompt ?? "";
    expect(prompt).toContain("red Santa hat");
    expect(prompt).toContain("every person's head");
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
  it("prioritizes the uploaded exact face over scene poses and expressions", () => {
    expect(IDENTITY_RULE).toContain("sole face reference for every subject in every style");
    expect(IDENTITY_RULE).toContain("each person's exact face");
    expect(IDENTITY_RULE).toContain("overrides any scene instruction requesting a different pose or expression");
    expect(IDENTITY_RULE).toContain("Keep the original facial expression, gaze, and head angle");
    expect(IDENTITY_RULE).toContain("Change only clothing, accessories outside the face, and Christmas surroundings");
  });
});