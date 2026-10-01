import { spawn } from "node:child_process";
const key = process.env.MEDIA_PROCESSOR_KEY;
if (!key || !process.env.CLOUDFLARE_API_TOKEN)
  throw new Error("Protected media and Cloudflare credentials are required");
const url =
  process.env.MEDIA_PROCESSOR_URL ||
  "https://adk-media-security.alikodiamondkey.workers.dev";
function command(args, input) {
  return new Promise((resolve, reject) => {
    const child = spawn("npx", args, {
      shell: process.platform === "win32",
      stdio: ["pipe", "pipe", "pipe"],
      env: process.env,
    });
    let log = "";
    child.stdout.on("data", (x) => (log += x));
    child.stderr.on("data", (x) => (log += x));
    child.stdin.end(input);
    child.on("error", reject);
    child.on("exit", (code) =>
      code === 0
        ? resolve()
        : reject(
            new Error(
              `Configuration command failed (${code}). Inspect provider status without displaying secrets.`,
            ),
          ),
    );
  });
}
await command([
  "wrangler",
  "deploy",
  "--config",
  "wrangler.media-security.toml",
]);
console.log("Media image-processing worker deployed.");
await command(
  [
    "wrangler",
    "secret",
    "put",
    "MEDIA_PROCESSOR_KEY",
    "--config",
    "wrangler.media-security.toml",
  ],
  key,
);
await command(
  [
    "wrangler",
    "pages",
    "secret",
    "put",
    "MEDIA_PROCESSOR_KEY",
    "--project-name",
    "aliko",
  ],
  key,
);
await command(
  [
    "wrangler",
    "pages",
    "secret",
    "put",
    "MEDIA_PROCESSOR_URL",
    "--project-name",
    "aliko",
  ],
  url,
);
await command(["convex", "env", "set", "MEDIA_PROCESSOR_KEY", key]);
await command(["convex", "env", "set", "MEDIA_PROCESSOR_URL", url]);
console.log(
  "Protected processor configuration synchronized to Pages and Convex.",
);
const unauthorized = await fetch(url, {
  method: "POST",
  headers: { "Content-Type": "image/png" },
  body: new Uint8Array([1]),
});
const malformed = await fetch(url, {
  method: "POST",
  headers: { "Content-Type": "image/png", Authorization: `Bearer ${key}` },
  body: new Uint8Array([1, 2, 3]),
});
console.log(
  JSON.stringify({
    unauthorized: unauthorized.status,
    malformedImage: malformed.status,
  }),
);
if (unauthorized.status !== 403 || malformed.status !== 422)
  throw new Error("Processor verification failed");
