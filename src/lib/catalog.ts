import original from "@/assets/style-original.jpg";
import santa from "@/assets/template-santa-v3.jpg.asset.json";
import family from "@/assets/template-family-v3.jpg.asset.json";
import winter from "@/assets/template-winter-v3.jpg.asset.json";
import lights from "@/assets/template-lights-v3.jpg.asset.json";
import fashion from "@/assets/template-fashion-v3.jpg.asset.json";

export type PackageId = "basic" | "premium";
export type PaymentMethod = "gcash" | "maya" | "bank";
export type OrderStatus = "pending_payment" | "payment_verified" | "processing" | "completed" | "failed";

export const ORIGINAL_SAMPLE = original;

/** The five Christmas styles every order receives. Keys are stored with results. */
export const STYLES = [
  {
    key: "santa",
    name: "Santa Claus Christmas",
    image: santa.url as string | null,
    prompt:
      "Transform this photo into a warm Filipino Santa Claus Christmas portrait: everyone wears red Santa hats, women and girls in red Filipiniana dresses with gold embroidery, men in cream barong, cozy living room with a decorated Christmas tree, fireplace and stockings, warm golden lighting.",
  },
  {
    key: "family",
    name: "Christmas Family Portrait",
    image: family.url,
    prompt:
      "Transform this photo into an elegant Filipino Christmas family portrait: seated together on a sofa in a capiz-window Filipino home with a glowing parol star, Christmas tree and fairy lights, red Filipiniana dresses and cream barong, warm professional studio quality.",
  },
  {
    key: "winter",
    name: "Winter Wonderland",
    image: winter.url,
    prompt:
      "Transform this photo into a winter wonderland portrait: cozy white winter coats with fur trim over festive red outfits, holding warm mugs, in a snowy pine forest with gently falling snow, soft natural light.",
  },
  {
    key: "lights",
    name: "Cozy Golden Christmas",
    image: lights.url,
    prompt:
      "Transform this photo into a cozy golden Christmas portrait: wearing Santa hats, cream barong and red Filipiniana, holding warm mugs beside glowing candles, under a garland of golden fairy lights, pine cones and dried oranges, warm candlelit glow.",
  },
  {
    key: "fashion",
    name: "A Magical Filipino Christmas",
    image: fashion.url,
    prompt:
      "Transform this photo into a magical Filipino Christmas portrait: standing in front of a tall golden Christmas tree in a traditional Filipino home with capiz windows, glowing parol star lanterns and poinsettias, red Filipiniana dresses and cream barong, warm festive lighting.",
  },
] as const;

export const IDENTITY_RULE =
  "Keep the person's face, facial features, skin tone, age, and natural appearance exactly the same as the original photo — the same recognizable person. If the original is old, faded or scratched, restore it to a clean, sharp, natural-looking modern photo. Photorealistic, high quality.";

export const DEFAULT_PRICES: Record<PackageId, number> = { basic: 99, premium: 149 };

export const PACKAGES: Record<PackageId, { name: string; features: string[]; cta: string; music: boolean }> = {
  basic: {
    name: "Basic Magic",
    cta: "GET BASIC",
    music: false,
    features: [
      "5 Magical Christmas Photos",
      "5 different Christmas styles",
      "High-quality downloadable images",
      "No background music",
      "Instant download when processing is complete",
    ],
  },
  premium: {
    name: "Magic with Music",
    cta: "GET PREMIUM",
    music: true,
    features: [
      "5 Magical Christmas Photos",
      "5 different Christmas styles",
      "Christmas background music",
      "Beautiful slideshow presentation",
      "High-quality downloadable images",
      "Instant download when processing is complete",
    ],
  },
};

export const PAYMENT_METHODS: Record<PaymentMethod, string> = {
  gcash: "GCash",
  maya: "Maya",
  bank: "Bank transfer",
};

export const STATUS_LABEL: Record<OrderStatus, string> = {
  pending_payment: "Pending Payment",
  payment_verified: "Payment Verified",
  processing: "Processing",
  completed: "Completed",
  failed: "Failed",
};

export const peso = (n: number) => `₱${n.toLocaleString("en-PH")}`;

export const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const MAX_UPLOAD_MB = 10;

/** Returns an error message, or null when the file is acceptable. */
export function validatePhoto(file: { type: string; size: number }): string | null {
  if (!ACCEPTED_TYPES.includes(file.type)) return "Please upload a JPG, JPEG, PNG or WEBP photo.";
  if (file.size > MAX_UPLOAD_MB * 1024 * 1024) return `Photo is too large. Maximum size is ${MAX_UPLOAD_MB}MB.`;
  if (file.size < 10 * 1024) return "This photo looks too small. Please choose a clearer photo.";
  return null;
}

/** Philippine mobile: 09XXXXXXXXX or +639XXXXXXXXX */
export function normalizePhMobile(input: string): string | null {
  const d = input.replace(/[\s-]/g, "");
  if (/^09\d{9}$/.test(d)) return "+63" + d.slice(1);
  if (/^\+639\d{9}$/.test(d)) return d;
  if (/^639\d{9}$/.test(d)) return "+" + d;
  return null;
}
