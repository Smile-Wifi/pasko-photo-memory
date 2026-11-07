import { STYLES, IDENTITY_RULE } from "@/lib/catalog";

// Test photos use Lovable's built-in AI gateway so testers never spend the
// owner's Replicate balance. Paid orders still generate through Replicate.
const AI_GATEWAY = "https://ai.gateway.lovable.dev/v1/images/generations";
const TEST_IMAGE_MODEL = "google/gemini-3.1-flash-lite-image";

type ImagesResponse = {
  data?: { b64_json?: unknown }[];
  candidates?: { content?: { parts?: { inlineData?: { data?: unknown } }[] } }[];
};

export async function generateTestPhoto(photo: string, index: number) {
  const match = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(photo);
  if (!match?.[1] || !match[2]) throw new Error("Choose a JPG, PNG or WEBP photo.");
  const binary = atob(match[2]);
  if (!binary.length || binary.length > 10 * 1024 * 1024) throw new Error("Photo must be non-empty and no larger than 10MB.");
  const style = STYLES[index];
  if (!style) throw new Error("Invalid template");
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new Error("The built-in AI is not configured yet.");
  const response = await fetch(AI_GATEWAY, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: TEST_IMAGE_MODEL,
      contents: [
        {
          role: "user",
          parts: [
            { text: `${style.prompt} ${IDENTITY_RULE}` },
            { inlineData: { mimeType: match[1], data: match[2] } },
          ],
        },
      ],
      generationConfig: { responseModalities: ["TEXT", "IMAGE"] },
    }),
  });
  if (!response.ok) {
    const body = (await response.text()).slice(0, 300);
    if (response.status === 402) throw new Error("AI test credits are exhausted. Top up credits to keep testing.");
    if (response.status === 429) throw new Error("Too many test requests. Wait a moment and try again.");
    throw new Error(`Photo test failed (${response.status}): ${body}`);
  }
  const data = (await response.json()) as ImagesResponse;
  const b64 = data.data?.[0]?.b64_json ?? data.candidates?.[0]?.content?.parts?.find(p => typeof p.inlineData?.data === "string")?.inlineData?.data;
  if (typeof b64 !== "string" || !b64) throw new Error("The AI returned no image. Please try again.");
  const mime = b64.startsWith("/9j/") ? "image/jpeg" : "image/png";
  return { image: `data:${mime};base64,${b64}` };
}
