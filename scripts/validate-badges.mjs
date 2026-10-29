// Checks data/badges.json for structural errors and missing icon files, and
// that every badge has its composed SVG in resources/badges/, up to date and
// clean (see scripts/compose-badge.mjs).
// Usage: node scripts/validate-badges.mjs
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { checkCleanSvg, composeBadge } from './compose-badge.mjs';

const root = new URL('../', import.meta.url);
const { badges } = JSON.parse(readFileSync(new URL('data/badges.json', root), 'utf8'));

const ICON_FOLDERS = { dashicon: 'dashicons', svg: 'custom' };

const errors = [];
const seen = new Set();

for (const b of badges) {
  const where = b.id ?? JSON.stringify(b);
  const keys = ['id', 'name', 'team', 'teamUrl', 'wporgClass', 'color', 'icon', 'isTeam', 'aliases', 'verified'];
  for (const k of keys) {
    if (!(k in b)) errors.push(`${where}: missing "${k}"`);
    else if (b[k] === null) errors.push(`${where}: "${k}" is empty, fill it in by hand (see docs/badges.md)`);
  }
  if (!/^[a-z0-9-]+$/.test(b.id)) errors.push(`${where}: bad id`);
  for (const id of [b.id, ...(b.aliases ?? [])]) {
    if (seen.has(id)) errors.push(`${where}: duplicate id or alias "${id}"`);
    seen.add(id);
  }
  if (b.color !== null && !/^#[0-9a-f]{6}$/.test(b.color)) errors.push(`${where}: bad color "${b.color}"`);
  if (b.wporgClass !== null && !/^badge-[a-z0-9-]+$/.test(b.wporgClass)) errors.push(`${where}: bad wporgClass "${b.wporgClass}"`);
  if (b.teamUrl !== null && !/^https:\/\/[^\s]+\/$/.test(b.teamUrl)) errors.push(`${where}: bad teamUrl "${b.teamUrl}"`);
  if (b.icon !== null) {
    const folder = ICON_FOLDERS[b.icon?.type];
    if (!folder || !b.icon?.name) {
      errors.push(`${where}: bad icon`);
    } else if (!existsSync(new URL(`resources/icons/${folder}/${b.icon.name}.svg`, root))) {
      errors.push(`${where}: icon file resources/icons/${folder}/${b.icon.name}.svg does not exist`);
    }
  }
  if (typeof b.isTeam !== 'boolean' || typeof b.verified !== 'boolean') errors.push(`${where}: isTeam and verified must be booleans`);
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}

// The composed badges: one per badge, up to date with the catalog and the
// icons, and clean.
const ids = new Set(badges.map((b) => b.id));
for (const b of badges) {
  const file = new URL(`resources/badges/${b.id}.svg`, root);
  if (!existsSync(file)) {
    errors.push(`${b.id}: resources/badges/${b.id}.svg does not exist, run composer build-badges`);
    continue;
  }
  const svg = readFileSync(file, 'utf8');
  const icon = readFileSync(new URL(`resources/icons/${ICON_FOLDERS[b.icon.type]}/${b.icon.name}.svg`, root), 'utf8');
  if (svg !== composeBadge(b, icon)) {
    errors.push(`${b.id}: resources/badges/${b.id}.svg is out of date, run composer build-badges`);
  }
  for (const problem of checkCleanSvg(svg)) {
    errors.push(`${b.id}: resources/badges/${b.id}.svg is not clean: ${problem}`);
  }
}
for (const name of readdirSync(new URL('resources/badges/', root))) {
  if (!ids.has(name.replace(/\.svg$/, ''))) {
    errors.push(`resources/badges/${name} is not a badge in the catalog, run composer build-badges`);
  }
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log(`${badges.length} badges, no errors. Every composed badge is up to date and clean.`);
