import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { authClient, sessionToken } from "$lib/server/auth-session";
import { api } from "$lib/convex/_generated/api";
import { prepareUploadFile } from "$lib/utils/prepareUploadFile";
export const POST: RequestHandler = async ({
  request,
  cookies,
  url,
  locals,
}) => {
  if (request.headers.get("origin") !== url.origin)
    return json({ error: "Forbidden" }, { status: 403 });
  if (Number(request.headers.get("content-length")) > 2_100_000)
    return json({ error: "Choose an image up to 2 MB." }, { status: 413 });
  try {
    const token = await sessionToken(cookies, url, false, locals);
    if (!token)
      return json(
        { error: "Sign in to update your portrait" },
        { status: 401 },
      );
    const form = await request.formData(),
      selected = form.get("file");
    if (
      !(selected instanceof File) ||
      !["image/jpeg", "image/png", "image/webp", "image/avif"].includes(
        selected.type,
      ) ||
      selected.size < 1 ||
      selected.size > 2_000_000
    )
      return json(
        { error: "Choose a JPG, PNG, WebP or AVIF image up to 2 MB." },
        { status: 400 },
      );
    const file = await prepareUploadFile(selected),
      bytes = await file.arrayBuffer();
    const sha256 = Array.from(
      new Uint8Array(await crypto.subtle.digest("SHA-256", bytes)),
    )
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    const metadata = {
      purpose: "AVATAR_IMAGE" as const,
      fileName: file.name,
      mimeType: file.type,
      size: file.size,
      sha256,
    };
    const client = authClient();
    client.setAuth(token);
    const upload = await client.mutation(
      api.storage.generateUploadUrl,
      metadata,
    );
    const response = await fetch(upload.url, {
      method: "POST",
      headers: { "Content-Type": file.type },
      body: bytes,
    });
    if (!response.ok) throw new Error("Photo storage unavailable");
    const { storageId } = (await response.json()) as { storageId: any };
    await client.action(api.storage.registerUpload, {
      ...metadata,
      intentId: upload.intentId,
      storageId,
    });
    const profile = await client.query(api.users.getMyProfile, {});
    return json(
      { avatarUrl: profile?.avatarUrl },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    console.error(
      "Portrait update failed",
      error instanceof Error ? error.message : "unknown",
    );
    return json(
      {
        error:
          "Your portrait could not be saved. Please retry; contact support if this continues.",
      },
      { status: 503 },
    );
  }
};
