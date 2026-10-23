/** Keep cookie renewal separate from genuine permission denials and edge blocks. */
export async function uploadMedia(form: FormData): Promise<{ url: string }> {
  const send = () =>
    fetch("/api/media/upload", {
      method: "POST",
      body: form,
      credentials: "same-origin",
      cache: "no-store",
    });
  let response = await send();
  if (response.status === 401) {
    // The server already refreshes expired JWTs. Recheck once in case this
    // request raced with browser session establishment; do not rotate a valid
    // refresh token unnecessarily or retry an actual role/subscription denial.
    const session = await fetch("/api/auth/session", {
      credentials: "same-origin",
      cache: "no-store",
    });
    if (session.ok && (await session.json()).token) response = await send();
    else if (session.status === 503)
      throw new Error(
        "Account verification is temporarily unavailable. Selected files are retained; retry shortly.",
      );
  }
  const data = await response.json().catch(() => null);
  if (response.ok) {
    if (!data || typeof data.url !== "string")
      throw new Error(
        "The upload response was incomplete. Please contact support.",
      );
    return data;
  }
  if (typeof data?.error === "string") throw new Error(data.error);
  const ray = response.headers.get("cf-ray");
  if (response.status === 403)
    throw new Error(
      `The security gateway blocked this upload. Reload the page and retry; if it persists, contact support${ray ? ` with reference ${ray}` : ""}. Selected files are retained.`,
    );
  if (response.status === 429)
    throw new Error(
      "Too many upload requests. Wait a moment and retry; selected files are retained.",
    );
  if (response.status === 401)
    throw new Error(
      "Sign in again to upload images. Selected files are retained.",
    );
  throw new Error(
    `Upload unavailable (${response.status}). Selected files are retained; retry shortly.`,
  );
}
