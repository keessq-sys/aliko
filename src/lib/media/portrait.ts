/** Use the verified cookie session rather than waiting for a realtime connection. */
export async function updatePortrait(file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  const response = await fetch("/api/profile/photo", {
    method: "POST",
    body: form,
    credentials: "same-origin",
  });
  const result = await response.json();
  if (!response.ok || !result.avatarUrl)
    throw new Error(result.error ?? "Photo upload failed");
  return result.avatarUrl;
}
