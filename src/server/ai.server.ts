// Server-only: reference-photo editing using the owner's saved Gemini key.
const GEMINI_API = "https://generativelanguage.googleapis.com/v1beta";
export const IMAGE_MODEL = "gemini-3.1-flash-image";

export class AiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

export async function editPhoto(original: Blob, prompt: string): Promise<Uint8Array> {
  const apiKey = process.env["GEMINI_API_KEY"] || process.env["GOOGLE_API_KEY"];
  if (!apiKey) throw new AiError("Save a Gemini API key in Secrets before generating photos.", 401);
  const type = original.type || "image/jpeg";
  if (!["image/jpeg", "image/png", "image/webp"].includes(type))
    throw new AiError("Unsupported photo format. Use JPG, PNG or WEBP.", 400);
  if (!original.size || original.size > 10 * 1024 * 1024)
    throw new AiError("Photo must be non-empty and no larger than 10MB.", 400);
  const bytes = new Uint8Array(await original.arrayBuffer());
  let binary = "";
  for (let i = 0; i < bytes.length; i += 8192)
    binary += String.fromCharCode(...bytes.subarray(i, i + 8192));

  const res = await fetch(`${GEMINI_API}/models/${IMAGE_MODEL}:generateContent`, {
    method: "POST",
    headers: { "x-goog-api-key": apiKey, "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [
        { text: prompt },
        { inlineData: { mimeType: type, data: btoa(binary) } },
      ] }],
      generationConfig: {
        responseModalities: ["IMAGE"],
        imageConfig: { aspectRatio: "2:3" },
      },
    }),
  });
  if (!res.ok) {
    let msg = `Gemini could not generate this photo (${res.status}).`;
    try {
      const j = (await res.json()) as { error?: { message?: string }; message?: string };
      msg = j.error?.message ?? j.message ?? msg;
    } catch {
      /* ignore */
    }
    // Provider errors can echo credentials; never store or return their values.
    for (const key of [apiKey, process.env["GOOGLE_API_KEY"], process.env["GEMINI_API_KEY"]])
      if (key) msg = msg.split(key).join("[redacted]");
    throw new AiError(msg, res.status);
  }
  const json = (await res.json()) as {
    promptFeedback?: { blockReason?: string };
    candidates?: { finishReason?: string; content?: { parts?: { inlineData?: { data?: string; mimeType?: string } }[] } }[];
  };
  if (json.promptFeedback?.blockReason || json.candidates?.some(c => ["SAFETY", "IMAGE_SAFETY", "PROHIBITED_CONTENT"].includes(c.finishReason ?? "")))
    throw new AiError("Gemini declined this photo request. No image was generated.", 422);
  const image = json.candidates?.flatMap(c => c.content?.parts ?? []).find(p => p.inlineData?.data)?.inlineData;
  if (!image?.data) throw new AiError("Gemini returned no image. The order has not been completed.", 502);
  if (image.mimeType !== "image/png") throw new AiError("Gemini returned an unsupported image format.", 502);
  const bin = atob(image.data);
  if (!bin.length) throw new AiError("Gemini returned an empty image.", 502);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
