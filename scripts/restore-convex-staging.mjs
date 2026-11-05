import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
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
const { key, deployment } = validateRestoreTarget(process.env);
const manifest = JSON.parse(readFileSync(`${snapshot}.manifest.json`, "utf8"));
const snapshotBytes = readFileSync(snapshot);
if (
  manifest.file !== path.basename(snapshot) ||
  manifest.bytes !== snapshotBytes.byteLength ||
  manifest.sha256 !==
    createHash("sha256").update(snapshotBytes).digest("hex") ||
  manifest.includesFileStorage !== true
)
  throw new Error(
    "Backup manifest or integrity check failed; no restore attempted.",
  );
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
  const startedAt = new Date();
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
  const receipt = {
    startedAt: startedAt.toISOString(), finishedAt: new Date().toISOString(),
    durationMs: Date.now() - startedAt.getTime(), deployment,
    sourceSha256: manifest.sha256, includesFileStorage: true,
    operator: process.env.RESTORE_OPERATOR || process.env.USERNAME || "UNASSIGNED",
    exitCode: result.status,
    verificationStatus: result.status === 0 ? "IMPORT_COMPLETED_INTEGRITY_PENDING" : "IMPORT_FAILED",
  };
  writeFileSync(`${snapshot}.${deployment}.restore.json`, `${JSON.stringify(receipt, null, 2)}\n`, { mode: 0o600 });
  console.log(`Restore receipt recorded. Status: ${receipt.verificationStatus}. Verify restored tables, files and application journeys before declaring recovery successful.`);
  process.exitCode = result.status ?? 1;
} finally {
  unlinkSync(envFile);
  rmdirSync(temporaryDirectory);
}
