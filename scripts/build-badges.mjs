// Composes every badge in data/badges.json into resources/badges/<id>.svg,
// the finished, sanitized SVG files that ship with the plugin. Removes the
// files of badges that are no longer in the catalog.
// Usage: node scripts/build-badges.mjs (or composer build-badges)
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { composeBadge } from './compose-badge.mjs';

const root = new URL('../', import.meta.url);
const { badges } = JSON.parse(readFileSync(new URL('data/badges.json', root), 'utf8'));
const out = new URL('resources/badges/', root);
const ICON_FOLDERS = { dashicon: 'dashicons', svg: 'custom' };

mkdirSync(out, { recursive: true });

let written = 0;
for (const badge of badges) {
  const icon = readFileSync(new URL(`resources/icons/${ICON_FOLDERS[badge.icon.type]}/${badge.icon.name}.svg`, root), 'utf8');
  const file = new URL(`${badge.id}.svg`, out);
  const svg = composeBadge(badge, icon);
  if (!existsSync(file) || readFileSync(file, 'utf8') !== svg) {
    writeFileSync(file, svg);
    written++;
  }
}

const ids = new Set(badges.map((b) => b.id));
let removed = 0;
for (const name of readdirSync(out)) {
  if (!ids.has(name.replace(/\.svg$/, ''))) {
    rmSync(new URL(name, out));
    removed++;
  }
}

console.log(`${badges.length} badges in resources/badges/: ${written} written, ${removed} removed.`);
