import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
for (const file of ['client', 'security', 'identity', 'ui']) {
  const args = [...(file === 'ui' ? ['--experimental-vm-modules'] : []), `tests/member-onboarding-${file}.test.mjs`];
  const result = spawnSync(process.execPath, args, { cwd: root, stdio: 'inherit' });
  if (result.status !== 0) process.exit(result.status || 1);
}
