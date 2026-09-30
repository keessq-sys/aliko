import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

const root = process.env.ADK_BACKUP_DIR || path.resolve(process.cwd(), '.backups');
await mkdir(root, { recursive: true });
const stamp = new Date().toISOString().replaceAll(':', '-').replace('.000Z', 'Z');
const snapshot = path.join(root, `convex-production-${stamp}.zip`);
const cli = path.resolve(process.cwd(), 'node_modules/convex/bin/main.js');
const result = spawnSync(process.execPath, [cli, 'export', '--prod', '--include-file-storage', '--path', snapshot], {
  cwd: process.cwd(), stdio: 'inherit', shell: false,
});
if (result.error) throw result.error;
if (result.status !== 0) process.exit(result.status || 1);
const bytes = await readFile(snapshot);
const sha256 = createHash('sha256').update(bytes).digest('hex');
const manifest = { createdAt: new Date().toISOString(), source: 'production', includesFileStorage: true,
  file: path.basename(snapshot), bytes: bytes.byteLength, sha256 };
await writeFile(`${snapshot}.manifest.json`, `${JSON.stringify(manifest, null, 2)}\n`, { mode: 0o600 });
console.log(`Verified encrypted-storage-ready backup: ${snapshot}`);
console.log(`SHA-256: ${sha256}`);
