// Audit pemakaian localStorage langsung di src/.
//
// Tujuan: menjaga agar key media (foto/bab) tidak kembali ditulis ke
// localStorage, dan supaya sisa pemakaian langsung bisa dicicil ke modul
// storage bertipe. Jalankan: npm run audit:storage
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = process.cwd();
const SRC = join(ROOT, 'src');

// File yang MEMANG boleh menyentuh localStorage langsung (lapisan storage).
const ALLOWED = new Set([
  'src/lib/mediaStore.ts',
  'src/lib/schemaMigration.ts',
  'src/lib/storageQuota.ts',
  'src/lib/authClient.ts',
  'src/lib/idb.ts',
  'src/main.tsx',
]);

const PATTERN = /localStorage\.(getItem|setItem|removeItem|clear)\b/g;
const MEDIA_KEY_PATTERN = /bunda_(photos|bab[1-5])|_foto_\d|_\d_foto/;

function walk(dir) {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) return walk(full);
    return /\.(ts|tsx)$/.test(entry) ? [full] : [];
  });
}

let total = 0;
const offenders = [];
const mediaLeaks = [];

for (const file of walk(SRC)) {
  const rel = relative(ROOT, file).replace(/\\/g, '/');
  const text = readFileSync(file, 'utf8');
  const lines = text.split('\n');
  let count = 0;

  lines.forEach((line, i) => {
    const matches = line.match(PATTERN);
    if (!matches) return;
    count += matches.length;
    if (MEDIA_KEY_PATTERN.test(line) && !ALLOWED.has(rel)) {
      mediaLeaks.push(`${rel}:${i + 1}  ${line.trim()}`);
    }
  });

  if (count === 0) continue;
  total += count;
  if (!ALLOWED.has(rel)) offenders.push({ file: rel, count });
}

offenders.sort((a, b) => b.count - a.count);
console.log(`localStorage langsung: ${total} pemanggilan di ${offenders.length} file (di luar lapisan storage)`);
for (const { file, count } of offenders) console.log(`  ${String(count).padStart(3)}  ${file}`);

if (mediaLeaks.length > 0) {
  console.error('\nKEY MEDIA ditulis langsung ke localStorage (harus lewat mediaStore):');
  mediaLeaks.forEach((line) => console.error(`  ${line}`));
  process.exitCode = 1;
} else {
  console.log('\nTidak ada key media yang ditulis langsung ke localStorage. OK');
}
