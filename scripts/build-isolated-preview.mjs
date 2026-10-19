import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import {
  isolatedEndpoint,
  assertIsolatedKey,
} from "./lib/deployment-boundary.mjs";
if (process.argv[2] === "--validate-key") {
  assertIsolatedKey(
    process.env.CONVEX_DEPLOY_KEY,
    process.env.ADK_DEPLOYMENT_KIND,
    process.env.CONVEX_STAGING_DEPLOYMENT,
  );
} else {
  const endpoint = isolatedEndpoint(process.env.PUBLIC_CONVEX_URL);
  const env = {
    ...process.env,
    PUBLIC_CONVEX_URL: endpoint.url,
    CONVEX_HTTP_ACTIONS_URL: endpoint.httpUrl,
    DEPLOYMENT_ENVIRONMENT: process.env.ADK_DEPLOYMENT_KIND,
    LIVE_TRANSACTIONS_ENABLED: "false",
  };
  const build = spawnSync(
    process.execPath,
    [path.resolve("node_modules/@sveltejs/kit/svelte-kit.js"), "sync"],
    { env, stdio: "inherit" },
  );
  if (build.status !== 0) process.exit(build.status || 1);
  const result = spawnSync(
    process.execPath,
    [path.resolve("node_modules/vite/bin/vite.js"), "build"],
    { env, stdio: "inherit" },
  );
  if (result.status !== 0) process.exit(result.status || 1);
  let config = readFileSync("wrangler.toml", "utf8")
    .split("[env.preview.vars]")[0]
    .replace(
      /PUBLIC_CONVEX_URL = "[^"]*"/,
      `PUBLIC_CONVEX_URL = "${endpoint.url}"`,
    )
    .replace(
      /CONVEX_HTTP_ACTIONS_URL = "[^"]*"/,
      `CONVEX_HTTP_ACTIONS_URL = "${endpoint.httpUrl}"`,
    )
    .replace(
      'bucket_name = "aliko-diamond-key-media"',
      'bucket_name = "aliko-diamond-key-media-preview"',
    )
    .replace(
      /pages_build_output_dir = "[^"]*"/,
      `pages_build_output_dir = ${JSON.stringify(path.resolve(".svelte-kit/cloudflare").replaceAll("\\", "/"))}`,
    );
  mkdirSync(".backups", { recursive: true });
  writeFileSync(".backups/isolated-wrangler.toml", config);
}
