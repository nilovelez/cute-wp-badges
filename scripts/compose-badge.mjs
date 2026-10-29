// Composes a badge in the old profile style as a clean, self-contained SVG:
// the ring, the white border, the white or tinted circle and the icon, all in
// the badge color. Used by scripts/build-badges.mjs and validate-badges.mjs.
//
// The icon is sanitized on the way in, with an allowlist: only basic shapes
// and their geometry and paint attributes survive. No ids, classes, styles,
// metadata, comments, embedded images, scripts or external references.

// Geometry of the old profile badge, in CSS pixels of the original 32 px
// badge (see "Old badge style" in docs/badges.md): a 32 px circle with a 2 px
// white border, a 4 px ring outside it, a 24 px Dashicon or a 22 px custom
// icon. The whole badge, ring included, is 40 px wide.
export const VIEWBOX = 40;
const RING_RADIUS = 20;
const BORDER_RADIUS = 16;
const FILL_RADIUS = 14;
const ICON_SIZE = { dashicon: 24, svg: 22 };
const TINT = 0.25;

const SHAPES = ['path', 'rect', 'circle', 'ellipse', 'polygon', 'polyline', 'line'];
// Dropped with everything inside them.
const DROPPED = ['defs', 'style', 'title', 'desc', 'metadata'];
const GEOMETRY = ['d', 'x', 'y', 'width', 'height', 'rx', 'ry', 'cx', 'cy', 'r', 'points', 'x1', 'y1', 'x2', 'y2'];
const PAINT = ['fill-rule', 'clip-rule', 'stroke-width', 'stroke-linecap', 'stroke-linejoin', 'stroke-miterlimit'];

// Mixes a color with white, like a semi-transparent color on a white background.
function tint(hex, amount) {
  let result = '#';
  for (let i = 1; i < 7; i += 2) {
    const channel = parseInt(hex.slice(i, i + 2), 16);
    const mixed = Math.round(255 - (255 - channel) * amount);
    result += mixed.toString(16).padStart(2, '0');
  }
  return result;
}

function parseAttributes(text) {
  const attributes = {};
  for (const [, name, , value] of text.matchAll(/([\w:-]+)\s*=\s*(["'])([\s\S]*?)\2/g)) {
    attributes[name] = value;
  }
  return attributes;
}

// Turns an icon file into clean shapes painted in one color.
// Returns { viewBox, body }.
export function sanitizeIcon(iconSvg, color) {
  const svg = iconSvg
    .replace(/<\?xml[\s\S]*?\?>/g, '')
    .replace(/<!DOCTYPE[\s\S]*?>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '');

  let viewBox = null;
  let body = '';
  let dropDepth = 0;
  // Inherited paint, one entry per open element: { fill, stroke, keep }.
  const stack = [{ fill: color, stroke: 'none', keep: false }];

  for (const [, closing, name, rest, slash] of svg.matchAll(/<(\/?)([a-zA-Z][\w:-]*)\b([^>]*?)(\/?)>/g)) {
    const selfClosing = slash === '/';
    const tag = name.toLowerCase();

    if (dropDepth) {
      if (DROPPED.includes(tag) && !selfClosing) {
        dropDepth += closing ? -1 : 1;
      }
      continue;
    }
    if (DROPPED.includes(tag)) {
      if (!closing && !selfClosing) {
        dropDepth = 1;
      }
      continue;
    }

    if (closing) {
      const open = stack.pop();
      if (open.keep) {
        body += '</g>';
      }
      continue;
    }

    const attributes = parseAttributes(rest);
    const parent = stack[stack.length - 1];
    const paint = (value, inherited) => (value === undefined ? inherited : value === 'none' ? 'none' : color);
    const fill = paint(attributes.fill, parent.fill);
    const stroke = paint(attributes.stroke, parent.stroke);

    if (tag === 'svg') {
      if (viewBox !== null) {
        throw new Error('Nested <svg> elements are not supported in icons.');
      }
      viewBox = attributes.viewBox ?? `0 0 ${attributes.width ?? 20} ${attributes.height ?? 20}`;
      if (!selfClosing) {
        stack.push({ fill, stroke, keep: false });
      }
      continue;
    }

    if (tag === 'g') {
      // Only groups that move their content are kept.
      const keep = attributes.transform !== undefined;
      if (keep) {
        body += `<g transform="${attributes.transform}">`;
      }
      if (!selfClosing) {
        stack.push({ fill, stroke, keep });
      }
      continue;
    }

    if (!SHAPES.includes(tag)) {
      throw new Error(`Unsupported element <${tag}> in an icon: add it to scripts/compose-badge.mjs or clean the icon.`);
    }

    // Invisible shapes, such as the empty background rect of Dashicons.
    if (fill === 'none' && stroke === 'none') {
      if (!selfClosing) {
        stack.push({ fill, stroke, keep: false });
      }
      continue;
    }

    let element = `<${tag}`;
    for (const attribute of [...GEOMETRY, 'transform']) {
      if (attributes[attribute] !== undefined) {
        element += ` ${attribute}="${attributes[attribute]}"`;
      }
    }
    if (fill === 'none') {
      element += ' fill="none"';
    }
    if (stroke !== 'none') {
      element += ` stroke="${color}"`;
    }
    for (const attribute of PAINT) {
      if (attributes[attribute] !== undefined && (stroke !== 'none' || !attribute.startsWith('stroke'))) {
        element += ` ${attribute}="${attributes[attribute]}"`;
      }
    }
    body += element + '/>';

    if (!selfClosing) {
      stack.push({ fill, stroke, keep: false });
    }
  }

  if (viewBox === null) {
    throw new Error('The icon is not an SVG file.');
  }
  return { viewBox, body };
}

// Builds the SVG of a badge from its catalog entry and its icon file.
export function composeBadge(badge, iconSvg) {
  const center = VIEWBOX / 2;
  const iconSize = ICON_SIZE[badge.icon.type];
  const offset = (VIEWBOX - iconSize) / 2;
  const icon = sanitizeIcon(iconSvg, badge.color);

  // Team badges have a tinted circle inside the white border; the others are
  // white all the way to the ring.
  const tinted = badge.isTeam
    ? `<circle cx="${center}" cy="${center}" r="${FILL_RADIUS}" fill="${tint(badge.color, TINT)}"/>`
    : '';

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VIEWBOX} ${VIEWBOX}">` +
    `<circle cx="${center}" cy="${center}" r="${RING_RADIUS}" fill="${badge.color}"/>` +
    `<circle cx="${center}" cy="${center}" r="${BORDER_RADIUS}" fill="#ffffff"/>` +
    tinted +
    `<svg x="${offset}" y="${offset}" width="${iconSize}" height="${iconSize}" viewBox="${icon.viewBox}" fill="${badge.color}">${icon.body}</svg>` +
    '</svg>\n'
  );
}

// Checks that an SVG only has what composeBadge() writes. Returns a list of
// problems, empty if there are none.
export function checkCleanSvg(svg) {
  const problems = [];
  const allowedElements = ['svg', 'circle', 'g', ...SHAPES];
  const allowedAttributes = ['xmlns', 'viewBox', 'fill', 'stroke', 'transform', ...GEOMETRY, ...PAINT];
  for (const [, name, rest] of svg.matchAll(/<([a-zA-Z][\w:-]*)\b([^>]*)>/g)) {
    if (!allowedElements.includes(name)) {
      problems.push(`element <${name}>`);
    }
    for (const attribute of Object.keys(parseAttributes(rest))) {
      if (!allowedAttributes.includes(attribute)) {
        problems.push(`attribute ${attribute} on <${name}>`);
      }
    }
  }
  if (/<!--|<\?|<!|href|url\(|data:/i.test(svg)) {
    problems.push('comment, processing instruction, reference or embedded data');
  }
  return problems;
}
