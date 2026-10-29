# Cute WP Badges

WordPress plugin that generates images of WordPress.org profile badges, in the classic profile style.

Work in progress. So far the project has a catalog of every badge (`data/badges.json`), documented in [docs/badges.md](docs/badges.md), and a JavaScript library that draws them.

## The badge library

`resources/js/cute-wp-badges.js` draws any badge of the catalog as SVG or PNG. It is a plain ES module with no build step, and works in the browser and in Node 18 or later:

```js
import { renderBadge } from './resources/js/cute-wp-badges.js';

const svg = await renderBadge( 'translation-contributor' );                             // SVG markup, 128 px
const png = await renderBadge( 'translation-contributor', { format: 'png', size: 500 } ); // PNG image
```

- `renderBadge( id, { format, size } )`: `id` is the badge id (the WordPress.org association slug) or one of its aliases; `format` is `'svg'` (default) or `'png'`; `size` is the width and height in pixels, from 1 to 4096 (default 128). It returns the SVG markup as a string, or the PNG as a `Blob` in the browser and a `Buffer` in Node. It throws on an unknown badge, format or size.
- `getBadges()`: every badge in the catalog. `getBadge( id )`: one badge, or `null`.
- `buildBadgeSvg( badge, iconSvg, size )`: builds the SVG from a badge and its icon, without reading any file.

The library reads the catalog and the icons relative to its own file, so it has to stay in the plugin folder structure. In the browser, PNG output is drawn with a canvas. In Node it needs `@resvg/resvg-js`: run `npm install` in the repo.

To check it by eye, `npm run samples` renders every badge into `samples/` (not committed): one SVG and one PNG per badge, a sheet with all of them, and `reference-grid.png`, the badges of [docs/reference-badges.png](docs/reference-badges.png) in the same order to compare with it.

## Updating the badge catalog

The plugin ships with the list of WordPress.org badges that existed when it was released. Badges change rarely, but when a WordPress.org team adds or renames one, the catalog has to be updated and the plugin packaged again.

You need Git, Node.js 18 or later and Composer.

1. Clone the repository and go into it:

   ```bash
   git clone https://github.com/nilovelez/cute-wp-badges.git
   cd cute-wp-badges
   ```

2. Update the catalog from WordPress.org:

   ```bash
   composer update-badges
   ```

   It reads the official list of badges (https://profiles.wordpress.org/associations/) and the WordPress.org profile CSS, updates `data/badges.json` and the team icons in `resources/icons/custom/`, validates the catalog and rebuilds `preview.html`. It prints what changed:

   - `NEW`: a badge that was not in the catalog. It is added with what can be worked out automatically. The fields it could not work out are left empty (`null`).
   - `RENAMED`: a badge whose name changed on WordPress.org. The new name is applied.
   - `GONE`: a badge that is no longer on WordPress.org. It is not removed; remove it by hand if it is really gone.
   - `COLOR`: the catalog and the profile CSS disagree on a color. Nothing is changed. Check the profile badges handbook (https://make.wordpress.org/meta/handbook/tutorials-guides/profile-badges/) and decide.
   - `CLASS`: a badge class in the profile CSS that no badge uses, usually a sign of a new badge.

3. Complete the new badges by hand in `data/badges.json`. Usually that means `teamUrl` (the team's page) and, for Dashicons, `icon`, which the handbook lists for each team. Every field is described in [docs/badges.md](docs/badges.md).

4. Validate the catalog:

   ```bash
   composer validate-badges
   ```

   It checks every field and that each badge's icon file exists in `resources/icons/`, and updates the list of Dashicons that go into the zip in `.gitattributes`. If it reports errors, go back to step 3 and run it again until it reports none. Then open `preview.html` in a browser to check the new badges by eye.

5. Raise the plugin version in the `Version:` header of `cute-wp-badges.php` and commit everything, saying that the badge catalog was updated:

   ```bash
   git add -A
   git commit -m "Update the badge catalog"
   ```

   Commit before building the zip: `git archive` only packs committed files, and reads the `.gitattributes` of the commit to decide what to leave out.

6. Build the plugin zip:

   ```bash
   git archive --format=zip --prefix=cute-wp-badges/ -o cute-wp-badges-<version>.zip HEAD
   ```

   Development files are left out (see `.gitattributes`).
