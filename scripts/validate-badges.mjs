// Checks data/badges.json for structural errors.
// Usage: node scripts/validate-badges.mjs [path]
import { readFileSync } from 'node:fs';

const path = process.argv[2] ?? new URL('../data/badges.json', import.meta.url);
const { badges } = JSON.parse(readFileSync(path, 'utf8'));

const errors = [];
const seen = new Set();

for (const b of badges) {
  const where = b.id ?? JSON.stringify(b);
  const keys = ['id', 'name', 'team', 'teamUrl','wporgClass', 'color', 'icon', 'isTeam', 'aliases', 'verified'];
  for (const k of keys) {
    if (!(k in b)) errors.push(`${where}: missing "${k}"`);
  }
  if (!/^[a-z0-9-]+$/.test(b.id)) errors.push(`${where}: bad id`);
  for (const id of [b.id, ...(b.aliases ?? [])]) {
    if (seen.has(id)) errors.push(`${where}: duplicate id or alias "${id}"`);
    seen.add(id);
  }
  if (!/^#[0-9a-f]{6}$/.test(b.color)) errors.push(`${where}: bad color "${b.color}"`);
  if (!/^badge-[a-z0-9-]+$/.test(b.wporgClass)) errors.push(`${where}: bad wporgClass "${b.wporgClass}"`);
  if (!/^https:\/\/[^\s]+\/$/.test(b.teamUrl)) errors.push(`${where}: bad teamUrl "${b.teamUrl}"`);
  if (!['dashicon', 'svg'].includes(b.icon?.type) || !b.icon?.name) errors.push(`${where}: bad icon`);
  if (typeof b.isTeam !== 'boolean' || typeof b.verified !== 'boolean') errors.push(`${where}: isTeam and verified must be booleans`);
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log(`${badges.length} badges, no errors.`);
