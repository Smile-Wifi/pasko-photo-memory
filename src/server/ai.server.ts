// Server-only: AI image transformation through the Lovable AI Gateway.
// The API key is read from the server environment and never sent to the browser.
const GATEWAY = "https://ai.gateway.lovable.dev";
const IMAGE_MODEL = "openai/gpt-image-2.5-sunburst";

export class AiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

export async function editPhoto(original: Blob, prompt: string): Promise<Uint8Array> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new AiError("AI service is not configured", 500);

  const form = new FormData();
  const type = original.type || "image/jpeg";
  form.append("image", new File([original], `original.${type.split("/")[1] ?? "jpg"}`, { type }));
  form.append("prompt", prompt);
  form.append("model", IMAGE_MODEL);
  form.append("size", "1024x1536");
  form.append("quality", "medium");

  const res = await fetch(`${GATEWAY}/v1/images/edits`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
  });
  if (!res.ok) {
    let msg = `AI service error (${res.status})`;
    try {
      const j = (await res.json()) as { error?: { message?: string }; message?: string };
      msg = j.error?.message ?? j.message ?? msg;
    } catch {
      /* ignore */
    }
    if (res.status === 402) msg = "AI credits are used up. Please top up to continue generating.";
    if (res.status === 429) msg = "AI service is busy. Please try again in a minute.";
    throw new AiError(msg, res.status);
  }
  const json = (await res.json()) as { data?: { b64_json?: string }[] };
  const b64 = json.data?.[0]?.b64_json;
  if (!b64) throw new AiError("The AI service returned no image (it may have declined this photo).", 502);
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
