export async function scanFile(
  file: Blob,
  fileName: string,
  config: { provider?: string; url?: string; key?: string },
) {
  if (!config.key) throw new Error("Malware scanner is not configured");
  const cloudmersive = config.provider === "CLOUDMERSIVE";
  const endpoint = cloudmersive
    ? "https://api.cloudmersive.com/virus/scan/file"
    : config.url;
  if (!endpoint || new URL(endpoint).protocol !== "https:")
    throw new Error("An HTTPS scanner is required");
  const form = new FormData();
  form.append(cloudmersive ? "inputFile" : "file", file, fileName);
  const response = await fetch(endpoint, {
    method: "POST",
    signal: AbortSignal.timeout(20000),
    headers: cloudmersive
      ? { Apikey: config.key }
      : { Authorization: `Bearer ${config.key}` },
    body: form,
  });
  if (!response.ok) throw new Error("Malware scanner unavailable");
  const result = (await response.json()) as any;
  const clean = cloudmersive ? result.CleanResult : result.clean;
  if (typeof clean !== "boolean")
    throw new Error("Invalid malware scan result");
  return {
    clean,
    threat: cloudmersive
      ? clean
        ? undefined
        : "Malware detected"
      : typeof result.threat === "string"
        ? result.threat.slice(0, 300)
        : undefined,
  };
}
export async function decodeImage(
  file: Blob,
  config: { url?: string; key?: string },
) {
  if (!config.url || !config.key || new URL(config.url).protocol !== "https:")
    throw new Error("Secure image decoding is not configured");
  const response = await fetch(config.url, {
    method: "POST",
    signal: AbortSignal.timeout(30000),
    headers: {
      Authorization: `Bearer ${config.key}`,
      "Content-Type": file.type,
    },
    body: file,
  });
  if (
    !response.ok ||
    response.headers.get("content-type")?.split(";")[0] !== "image/webp"
  )
    throw new Error("Image decoding failed");
  const result = await response.blob();
  if (!result.size || result.size > 15_000_000)
    throw new Error("Invalid decoded image");
  return result;
}
