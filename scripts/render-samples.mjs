// Renders every badge with the badge library into samples/ (not committed),
// to check the library by eye:
// - samples/badges/<id>.svg and .png, one per badge, 256 px.
// - samples/all-badges.svg and .png, every badge on one sheet.
// - samples/reference-grid.svg and .png, the badges of
//   docs/reference-badges.png in the same order, to compare with it.
// Usage: npm run samples
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { getBadges, renderBadge, renderGrid } from '../resources/js/cute-wp-badges.js';

const out = new URL('../samples/', import.meta.url);

// Nilo's badges in docs/reference-badges.png, row by row.
const REFERENCE = [
  'wordcamp-organizer', 'photos-team', 'translation-editor', 'wordpress-tv-team', 'plugin-developer',
  'wordcamp-speaker', 'photo-contributor', 'translation-contributor', 'wordpress-tv-contributor', 'buddypress-contributor',
  'meetup-organizer', 'pattern-author', 'community-contributor', 'documentation-contributor', 'core-contributor',
  'wordcamp-volunteer', 'theme-developer', 'support-contributor', 'meta-contributor',
];

// Writes a grid as SVG and as PNG.
async function writeGrid(name, ids, options) {
  writeFileSync(new URL(`${name}.svg`, out), await renderGrid(ids, options));
  writeFileSync(new URL(`${name}.png`, out), await renderGrid(ids, { ...options, format: 'png' }));
}

rmSync(out, { recursive: true, force: true });
mkdirSync(new URL('badges/', out), { recursive: true });

const badges = await getBadges();
for (const badge of badges) {
  writeFileSync(new URL(`badges/${badge.id}.svg`, out), await renderBadge(badge.id, { size: 256 }));
  writeFileSync(new URL(`badges/${badge.id}.png`, out), await renderBadge(badge.id, { format: 'png', size: 256 }));
}

await writeGrid('all-badges', badges.map((b) => b.id), { columns: 10, size: 96, gap: 24 });
await writeGrid('reference-grid', REFERENCE, { columns: 5, size: 90, gap: 30 });

console.log(`${badges.length} badges rendered into samples/.`);
