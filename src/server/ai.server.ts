import Replicate from "replicate";

// Server-only: the connected owner's Replicate account, with no provider fallback.
const REPLICATE_API = "https://connector-gateway.lovable.dev/replicate/v1";
export const IMAGE_MODEL = "black-forest-labs/flux-kontext-pro";

export class AiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

export async function editPhoto(original: Blob, prompt: string): Promise<Uint8Array> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  const connectionKey = process.env["REPLICATE_API_KEY"];
  if (!apiKey || !connectionKey) throw new AiError("Connect Replicate before generating photos.", 401);
  const type = original.type || "image/jpeg";
  if (!["image/jpeg", "image/png", "image/webp"].includes(type))
    throw new AiError("Unsupported photo format. Use JPG, PNG or WEBP.", 400);
  if (!original.size || original.size > 10 * 1024 * 1024)
    throw new AiError("Photo must be non-empty and no larger than 10MB.", 400);
  const bytes = new Uint8Array(await original.arrayBuffer());
  let binary = "";
  for (let i = 0; i < bytes.length; i += 8192)
    binary += String.fromCharCode(...bytes.subarray(i, i + 8192));

  const redact = (message: string) => [apiKey, connectionKey].reduce((text, key) => text.split(key).join("[redacted]"), message);
  // The SDK's default retry wrapper can replay prediction creation. Override only
  // its transport so failures remain terminal and polling never creates new work.
  const replicate = new Replicate({ auth: apiKey, baseUrl: REPLICATE_API, useFileOutput: false });
  replicate.request = async (route, options) => {
    const url = new URL(String(route).replace(/^\//, ""), `${REPLICATE_API}/`);
    if (!url.href.startsWith(`${REPLICATE_API}/`)) throw new AiError("Invalid Replicate request address.", 400);
    const headers = new Headers(options.headers as HeadersInit | undefined);
    headers.set("Authorization", `Bearer ${apiKey}`);
    headers.set("X-Connection-Api-Key", connectionKey);
    headers.set("Content-Type", "application/json");
    const response = await fetch(url.href, {
      method: options.method ?? "GET", headers,
      body: options.data ? JSON.stringify(options.data) : null,
    });
    if (!response.ok) {
      const body = redact(await response.text());
      const message = response.status === 402
        ? `Replicate account has insufficient credit. Add credit at https://replicate.com/account/billing. ${body}`
        : `Replicate could not generate this photo (${response.status}): ${body}`;
      throw new AiError(message, response.status);
    }
    return response;
  };
  let prediction = await replicate.predictions.create({
    model: IMAGE_MODEL,
    wait: true,
    input: { prompt, input_image: `data:${type};base64,${btoa(binary)}`, aspect_ratio: "2:3", output_format: "png" },
  });
  while (prediction.status === "starting" || prediction.status === "processing") {
    await new Promise(resolve => setTimeout(resolve, 1000));
    prediction = await replicate.predictions.get(prediction.id);
  }
  if (prediction.status !== "succeeded")
    throw new AiError(redact(`Replicate ${prediction.status}: ${prediction.error ?? "No image was generated."}`), 422);
  const output: unknown = prediction.output;
  if (typeof output !== "string") throw new AiError("Replicate returned no image. The order has not been completed.", 502);
  const outputUrl = new URL(output);
  if (outputUrl.protocol !== "https:" || !(outputUrl.hostname === "replicate.delivery" || outputUrl.hostname.endsWith(".replicate.delivery")))
    throw new AiError("Replicate returned an unsupported image address.", 502);
  // Download with no credentials; the caller persists the PNG to private storage.
  const download = await fetch(outputUrl.href);
  if (!download.ok) throw new AiError(`Could not download the generated photo (${download.status}).`, download.status);
  const png = new Uint8Array(await download.arrayBuffer());
  if (![137, 80, 78, 71, 13, 10, 26, 10].every((byte, index) => png[index] === byte))
    throw new AiError("Replicate returned an invalid PNG image.", 502);
  return png;
}
