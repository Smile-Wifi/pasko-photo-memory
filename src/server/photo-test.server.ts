import { STYLES, IDENTITY_RULE } from "@/lib/catalog";

// Test photos use Lovable's built-in AI gateway so testers never spend the
// owner's Replicate balance. Paid orders still generate through Replicate.
const AI_GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";
const TEST_IMAGE_MODEL = "google/gemini-3.1-flash-lite-image";

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
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: `${style.prompt} ${IDENTITY_RULE}` },
            { type: "image_url", image_url: { url: photo } },
          ],
        },
      ],
      modalities: ["image", "text"],
    }),
  });
  if (!response.ok) {
    const body = (await response.text()).slice(0, 300);
    if (response.status === 402) throw new Error("AI test credits are exhausted. Top up credits to keep testing.");
    if (response.status === 429) throw new Error("Too many test requests. Wait a moment and try again.");
    throw new Error(`Photo test failed (${response.status}): ${body}`);
  }
  const data: unknown = await response.json();
  const image = (data as { choices?: { message?: { images?: { image_url?: { url?: unknown } }[] } }[] })
    ?.choices?.[0]?.message?.images?.[0]?.image_url?.url;
  if (typeof image !== "string" || !image.startsWith("data:image/"))
    throw new Error("The AI returned no image. Please try again.");
  return { image };
}
