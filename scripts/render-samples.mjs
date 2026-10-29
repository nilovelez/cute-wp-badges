// Renders every badge with the badge library into samples/ (not committed),
// to check the library by eye:
// - samples/badges/<id>.svg and .png, one per badge, 256 px.
// - samples/all-badges.png, every badge on one sheet.
// - samples/reference-grid.png, the badges of docs/reference-badges.png in
//   the same order, to compare with it.
// Usage: npm run samples
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { Resvg } from '@resvg/resvg-js';
import { getBadges, renderBadge } from '../resources/js/cute-wp-badges.js';

const out = new URL('../samples/', import.meta.url);

// Nilo's badges in docs/reference-badges.png, row by row.
const REFERENCE = [
  'wordcamp-organizer', 'photos-team', 'translation-editor', 'wordpress-tv-team', 'plugin-developer',
  'wordcamp-speaker', 'photo-contributor', 'translation-contributor', 'wordpress-tv-contributor', 'buddypress-contributor',
  'meetup-organizer', 'pattern-author', 'community-contributor', 'documentation-contributor', 'core-contributor',
  'wordcamp-volunteer', 'theme-developer', 'support-contributor', 'meta-contributor',
];

// Lays badges out on a grid and returns it as a PNG.
async function grid(ids, { columns, size, gap }) {
  const rows = Math.ceil(ids.length / columns);
  const width = columns * size + (columns + 1) * gap;
  const height = rows * size + (rows + 1) * gap;
  let cells = '';
  for (const [i, id] of ids.entries()) {
    const x = gap + (i % columns) * (size + gap);
    const y = gap + Math.floor(i / columns) * (size + gap);
    const svg = await renderBadge(id, { size });
    cells += svg.replace('<svg ', `<svg x="${x}" y="${y}" `);
  }
  const sheet = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect width="100%" height="100%" fill="#ffffff"/>${cells}</svg>`;
  return new Resvg(sheet).render().asPng();
}

rmSync(out, { recursive: true, force: true });
mkdirSync(new URL('badges/', out), { recursive: true });

const badges = await getBadges();
for (const badge of badges) {
  writeFileSync(new URL(`badges/${badge.id}.svg`, out), await renderBadge(badge.id, { size: 256 }));
  writeFileSync(new URL(`badges/${badge.id}.png`, out), await renderBadge(badge.id, { format: 'png', size: 256 }));
}

writeFileSync(new URL('all-badges.png', out), await grid(badges.map((b) => b.id), { columns: 10, size: 96, gap: 24 }));
writeFileSync(new URL('reference-grid.png', out), await grid(REFERENCE, { columns: 5, size: 90, gap: 30 }));

console.log(`${badges.length} badges rendered into samples/.`);
