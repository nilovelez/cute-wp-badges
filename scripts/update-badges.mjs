// Updates data/badges.json and resources/icons/custom/ from WordPress.org.
//
// Reads the associations directory (the official list of badges) and the
// profile theme CSS (classes, colors and custom SVG icons). Hand-checked
// fields of existing badges are never overwritten: differences are reported.
// New badges are added with what can be inferred; the fields that need a
// person are left as null, and validate-badges.mjs reports them.
//
// Usage: node scripts/update-badges.mjs
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const catalogFile = new URL('data/badges.json', root);
const iconsDir = new URL('resources/icons/custom/', root);

const ASSOCIATIONS_URL = 'https://profiles.wordpress.org/associations/?num=200';
const CSS_URL = 'https://profiles.wordpress.org/wp-content/themes/profiles.wordpress.org/style.css';

async function download(url) {
  const response = await fetch(url, { headers: { 'User-Agent': 'cute-wp-badges/update-badges' } });
  if (!response.ok) {
    throw new Error(`${url}: HTTP ${response.status}`);
  }
  return response.text();
}

function decodeHtml(text) {
  return text.replace(/&amp;/g, '&').replace(/&#0?39;/g, "'").replace(/&quot;/g, '"').trim();
}

// Associations: [{ id, name }], from the BuddyPress groups directory.
function parseAssociations(html) {
  const associations = [];
  const pattern = /item-title"><a href="https:\/\/profiles\.wordpress\.org\/associations\/([^/]+)\/">([^<]+)<\/a>/g;
  for (const match of html.matchAll(pattern)) {
    associations.push({ id: match[1], name: decodeHtml(match[2]) });
  }
  const total = html.match(/Viewing \d+ - \d+ of (\d+) groups/);
  if (total && Number(total[1]) !== associations.length) {
    throw new Error(`The directory lists ${total[1]} associations but only ${associations.length} were read.`);
  }
  return associations;
}

// CSS: colors and icons keyed by badge class, and the custom SVG icons.
function parseCss(css) {
  const colors = {};
  const svgByClass = {};
  const svgs = {};

  for (const match of css.matchAll(/--svg-badge-([a-z0-9-]+):\s*url\("data:image\/svg\+xml,(.*?)"\);/g)) {
    svgs[match[1]] = decodeURIComponent(match[2]).trim();
  }

  // Each rule: a list of selectors, then a body.
  for (const match of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const classes = [...match[1].matchAll(/\.(badge-[a-z0-9-]+)/g)].map((m) => m[1]);
    if (classes.length === 0) {
      continue;
    }
    const body = match[2];
    const color = body.match(/--badge-color:\s*rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    const svg = body.match(/var\(--svg-badge-([a-z0-9-]+)\)/);
    for (const cls of classes) {
      if (color && !colors[cls]) {
        colors[cls] = '#' + color.slice(1, 4).map((n) => Number(n).toString(16).padStart(2, '0')).join('');
      }
      if (svg && !svgByClass[cls]) {
        svgByClass[cls] = svg[1];
      }
    }
  }

  return { colors, svgByClass, svgs };
}

// Best guess for a new badge; null where a person has to decide.
function newBadge(association, css) {
  const { id, name } = association;
  const isTeam = / Team$/.test(name);
  const team = name.replace(/ (Contributor|Team)$/, '');
  const guessedClass = [`badge-${id}`, `badge-${id.replace(/-(contributor|team)$/, '')}`]
    .find((cls) => css.colors[cls]);
  const svg = guessedClass ? css.svgByClass[guessedClass] : null;

  return {
    id,
    name,
    team,
    teamUrl: null,
    wporgClass: guessedClass ?? null,
    color: guessedClass ? css.colors[guessedClass] : null,
    icon: svg ? { type: 'svg', name: svg } : null,
    isTeam,
    aliases: [],
    verified: false,
  };
}

const catalog = JSON.parse(readFileSync(catalogFile, 'utf8'));
const associations = parseAssociations(await download(ASSOCIATIONS_URL));
const css = parseCss(await download(CSS_URL));

const report = [];
const byId = new Map(catalog.badges.map((badge) => [badge.id, badge]));
const officialIds = new Set(associations.map((association) => association.id));

for (const association of associations) {
  const badge = byId.get(association.id);
  if (!badge) {
    const added = newBadge(association, css);
    catalog.badges.push(added);
    report.push(`NEW      ${added.id} (${added.name}): complete the null fields by hand.`);
    continue;
  }
  if (badge.name !== association.name) {
    report.push(`RENAMED  ${badge.id}: "${badge.name}" -> "${association.name}"`);
    badge.name = association.name;
  }
}

for (const badge of catalog.badges) {
  if (!officialIds.has(badge.id)) {
    report.push(`GONE     ${badge.id} (${badge.name}) is no longer in the directory. Remove it by hand if it is really gone.`);
  }
  const cssColor = css.colors[badge.wporgClass];
  if (badge.color && cssColor && cssColor !== badge.color) {
    report.push(`COLOR    ${badge.id}: catalog ${badge.color}, profile CSS ${cssColor}. Check the handbook.`);
  }
}

const knownClasses = new Set(catalog.badges.map((badge) => badge.wporgClass));
for (const cls of Object.keys(css.colors)) {
  if (cls !== 'badge-unknown' && !knownClasses.has(cls)) {
    report.push(`CLASS    ${cls} is in the profile CSS but no badge uses it.`);
  }
}

mkdirSync(iconsDir, { recursive: true });
for (const [name, svg] of Object.entries(css.svgs)) {
  writeFileSync(new URL(`${name}.svg`, iconsDir), svg + '\n');
}

writeFileSync(catalogFile, JSON.stringify(catalog, null, 2) + '\n');

console.log(`${associations.length} associations on WordPress.org, ${catalog.badges.length} badges in the catalog, ${Object.keys(css.svgs).length} SVG icons written.`);
console.log(report.length ? report.join('\n') : 'No changes to review.');
