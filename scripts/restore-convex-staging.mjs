import {
  existsSync,
  mkdtempSync,
  writeFileSync,
  unlinkSync,
  rmdirSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { validateRestoreTarget } from "./lib/restore-target.mjs";
import { spawnSync } from "node:child_process";
import path from "node:path";

const [snapshot] = process.argv.slice(2);
if (!snapshot || !existsSync(snapshot))
  throw new Error("Pass an existing Convex snapshot ZIP path.");
const { key } = validateRestoreTarget(process.env);
const cli = path.resolve(process.cwd(), "node_modules/convex/bin/main.js");
const temporaryDirectory = mkdtempSync(
  path.join(tmpdir(), "adk-staging-restore-"),
);
const envFile = path.join(temporaryDirectory, "staging.env");
const cleanEnvironment = { ...process.env };
for (const name of [
  "CONVEX_DEPLOY_KEY",
  "CONVEX_DEPLOYMENT",
  "CONVEX_SELF_HOSTED_ADMIN_KEY",
  "CONVEX_SELF_HOSTED_URL",
])
  delete cleanEnvironment[name];
try {
  writeFileSync(envFile, `CONVEX_DEPLOY_KEY=${key}\n`, { mode: 0o600 });
  const result = spawnSync(
    process.execPath,
    [
      cli,
      "import",
      path.resolve(snapshot),
      "--env-file",
      envFile,
      "--replace-all",
      "--yes",
    ],
    { env: cleanEnvironment, stdio: "inherit", shell: false },
  );
  if (result.error) throw result.error;
  process.exitCode = result.status ?? 1;
} finally {
  unlinkSync(envFile);
  rmdirSync(temporaryDirectory);
}
