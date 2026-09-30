import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

const [snapshot] = process.argv.slice(2);
const deployment = process.env.CONVEX_RESTORE_DEPLOYMENT;
if (!snapshot || !existsSync(snapshot)) throw new Error('Pass an existing Convex snapshot ZIP path.');
if (!deployment) throw new Error('Set CONVEX_RESTORE_DEPLOYMENT to the dedicated staging deployment.');
if (/^(prod|production)$/i.test(deployment)) throw new Error('Restore rehearsal refuses a production target.');
if (process.env.CONFIRM_STAGING_RESTORE !== 'RESTORE_TO_STAGING')
  throw new Error('Set CONFIRM_STAGING_RESTORE=RESTORE_TO_STAGING after verifying the target.');
const cli = path.resolve(process.cwd(), 'node_modules/convex/bin/main.js');
const result = spawnSync(process.execPath, [cli, 'import', snapshot, '--deployment', deployment, '--replace-all', '--yes'], {
  cwd: process.cwd(), stdio: 'inherit', shell: false,
});
if (result.error) throw result.error;
process.exit(result.status || 0);
