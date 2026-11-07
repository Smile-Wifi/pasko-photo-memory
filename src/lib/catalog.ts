import original from "@/assets/style-original.jpg";
import santa from "@/assets/style-santa.jpg";
import family from "@/assets/style-family.jpg";
import winter from "@/assets/style-winter.jpg";
import lights from "@/assets/style-lights.jpg";
import fashion from "@/assets/style-fashion.jpg";

export type PackageId = "basic" | "premium";
export type PaymentMethod = "gcash" | "maya" | "bank";
export type OrderStatus = "pending_payment" | "payment_verified" | "processing" | "completed" | "failed";

export const ORIGINAL_SAMPLE = original;

/** The five Christmas styles every order receives. Keys are stored with results. */
export const STYLES = [
  {
    key: "santa",
    name: "Santa Claus Christmas",
    image: santa as string | null,
    prompt:
      "Transform this photo into a festive Santa Claus Christmas portrait: the person wears a classic red Santa hat and cozy red-and-white Christmas outfit, warm living room with fireplace and stockings, soft warm lighting.",
  },
  {
    key: "family",
    name: "Christmas Family Portrait",
    image: family,
    prompt:
      "Transform this photo into an elegant Christmas family-portrait style photo: seated beside a beautifully decorated Christmas tree with red and gold ornaments and wrapped gifts, warm golden light, professional studio quality.",
  },
  {
    key: "winter",
    name: "Winter Wonderland",
    image: winter,
    prompt:
      "Transform this photo into a winter wonderland portrait: the person wears a cozy white winter coat and knit scarf in a snowy pine forest with gently falling snow, soft natural light.",
  },
  {
    key: "lights",
    name: "Christmas Lights & Bokeh",
    image: lights,
    prompt:
      "Transform this photo into a dreamy night portrait with magical golden Christmas lights bokeh and glowing Filipino parol star lanterns in the background, warm cinematic lighting.",
  },
  {
    key: "fashion",
    name: "Red & Green Christmas Fashion",
    image: fashion,
    prompt:
      "Transform this photo into a stylish red and green Christmas fashion portrait holding a wrapped gift box with a gold ribbon, festive studio backdrop with a Christmas tree and wreath.",
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
