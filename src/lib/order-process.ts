import { z } from "zod";
import { STYLES } from "@/lib/catalog";

export const templateSchema = z.enum(["santa", "family", "winter", "lights", "fashion"]);
export type TemplateId = z.infer<typeof templateSchema>;
export const ORDER_STEPS = ["upload", "template", "payment", "generate"] as const;
export function canAdvance(step: number, hasPhoto: boolean, template: TemplateId | null) {
  return step === 1 ? hasPhoto : step === 2 ? hasPhoto && template !== null : false;
}
export function canGenerate(status: string, verifiedAt: string | null) {
  return Boolean(verifiedAt) && ["payment_verified", "processing", "failed"].includes(status);
}
export function generationOrder(template: string) {
  const first = STYLES.findIndex(s => s.key === template);
  return [first < 0 ? 0 : first, ...STYLES.map((_, i) => i).filter(i => i !== (first < 0 ? 0 : first))];
}