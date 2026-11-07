import { STYLES, IDENTITY_RULE } from "@/lib/catalog";

export async function generateTestPhoto(photo: string, index: number) {
  const match = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(photo);
  if (!match?.[1] || !match[2]) throw new Error("Choose a JPG, PNG or WEBP photo.");
  const binary = atob(match[2]);
  if (!binary.length || binary.length > 10 * 1024 * 1024) throw new Error("Photo must be non-empty and no larger than 10MB.");
  const style = STYLES[index];
  if (!style) throw new Error("Invalid template");
  const bytes = Uint8Array.from(binary, char => char.charCodeAt(0));
  const { editPhoto } = await import("@/server/ai.server");
  const png = await editPhoto(new Blob([bytes], { type: match[1] }), `${style.prompt} ${IDENTITY_RULE}`);
  let result = "";
  for (let i = 0; i < png.length; i += 8192) result += String.fromCharCode(...png.subarray(i, i + 8192));
  return { image: `data:image/png;base64,${btoa(result)}` };
}