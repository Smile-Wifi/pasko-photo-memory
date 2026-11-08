import original from "@/assets/style-original.jpg";
import santa from "@/assets/template-simbang-casual.jpg";
import family from "@/assets/template-pajama-santa-cap-45.jpg";
import winter from "@/assets/template-snow.jpg.asset.json";
import lights from "@/assets/template-street.jpg.asset.json";
import fashion from "@/assets/template-traditional.jpg.asset.json";

export type PackageId = "basic" | "premium";
export type PaymentMethod = "gcash" | "maya" | "bank";
export type OrderStatus = "pending_payment" | "payment_verified" | "processing" | "completed" | "failed";

export const ORIGINAL_SAMPLE = original;

/** The five Christmas styles every order receives. Keys are stored with results. */
export const STYLES = [
  {
    key: "santa",
     name: "Simbang Gabi",
    image: santa,
    prompt:
      "Transform the uploaded subjects into a photorealistic Simbang Gabi Christmas portrait outside a historic Filipino stone church at dusk. Show a cobblestone path, glowing parol star lanterns overhead, warm handheld lanterns, and soft golden church lights. Dress everyone in casual, modest Simbang Gabi mass-outing clothes: men and boys in plain collared polo or button-up shirts with neat trousers, women and girls in simple casual dresses or blouses with skirts. Keep the outfits relaxed and everyday, like a family walking to early morning mass. No barong Tagalog, no Filipiniana gowns, no formal embroidered traditional wear, no Santa hats, no snow, no captions, no watermarks.",
  },
  {
    key: "family",
    name: "Pajama",
    image: family,
    prompt:
      "Transform the uploaded subjects into a photorealistic cozy Christmas Pajama portrait. Dress everyone in matching red-and-green tartan pajamas, and put a classic red Santa hat with a fluffy white fur trim and white pom-pom on every person's head. Seat them comfortably together on a sofa in a warm living room. Include a decorated Christmas tree, wrapped gifts, stockings, soft golden fairy lights, mugs of hot chocolate and a bowl of popcorn. Create a relaxed, joyful holiday moment with natural expressions and warm indoor lighting. No formal barong, outdoor snow, captions, or watermarks.",
  },
  {
    key: "winter",
    name: "Snow",
    image: winter.url,
    prompt:
      "Transform the uploaded subjects into a photorealistic Snow winter portrait in a snow-covered pine forest with gently falling snow and soft natural daylight. Dress everyone in cozy ivory padded winter coats, cream knitted scarves and winter hats, with a soft blush scarf where appropriate. Show them close together, holding mugs of hot chocolate, with clear visible faces and natural happy expressions. Keep the scene bright and realistic, with detailed snowy trees behind them. No Santa costumes, captions, or watermarks.",
  },
  {
    key: "lights",
    name: "Street Celebration",
    image: lights.url,
    prompt:
      "Transform the uploaded subjects into a photorealistic Filipino Christmas Street Celebration portrait at night. Show a lively festive street beneath many colorful glowing parol star lanterns and strings of Christmas lights, with small food stalls and softly blurred celebration crowds behind the subjects. Dress men and boys in black shirts with festive red floral patterns and women and girls in coordinated red holiday outfits. Frame the uploaded subjects close together facing the camera, with bright natural faces and joyful expressions. No snow, Santa hats, added foreground people, captions, or watermarks.",
  },
  {
    key: "fashion",
    name: "Traditional / Spanish / Barong",
    image: fashion.url,
    prompt:
      "Transform the uploaded subjects into a photorealistic Traditional / Spanish / Barong Christmas portrait in an elegant Spanish-colonial Filipino home. Include dark carved wooden interiors, capiz windows, a chandelier, glowing parol star lanterns and a decorated Christmas tree. Dress men and boys in cream barong Tagalog with detailed gold embroidery and dark trousers; dress women and girls in deep burgundy Filipiniana gowns with gold embroidery and butterfly sleeves. Pose the uploaded subjects together in a formal, warm family portrait with realistic festive indoor lighting. No Santa hats, pajamas, snow, captions, or watermarks.",
  },
] as const;

export const IDENTITY_RULE =
  "IDENTITY PRESERVATION IS THE HIGHEST PRIORITY and overrides any scene instruction requesting a different pose or expression. Edit the uploaded photo; do not create new lookalike people. Use the uploaded image as the sole face reference for every subject in every style. Preserve the exact number of subjects and each person's exact face: face shape, eye shape and spacing, eyebrows, nose, lips, jawline, ears, hairline, facial hair, distinctive marks, skin texture, skin tone, and age. Keep the original facial expression, gaze, and head angle; do not invent a smile, rotate a face, beautify, smooth away distinctive features, slim a face, or change ethnicity. Never add, remove, duplicate, replace, or merge a subject, and never copy the illustrative sample family. Change only clothing, accessories outside the face, and Christmas surroundings; adapt the scene to the original people and their pose rather than redrawing their faces. Keep hats and accessories clear of facial features and every face clearly visible. If a face is unclear, retain the available facial details instead of inventing a different face. Restore faded colors, scratches, and damage conservatively without redesigning faces. Photorealistic, high quality, natural anatomy, no text or watermarks.";

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
