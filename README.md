# Cute WP Badges

WordPress plugin that generates images of WordPress.org profile badges, in the classic profile style.

Work in progress. So far the project has a catalog of every badge (`data/badges.json`), documented in [docs/badges.md](docs/badges.md), the badges as finished SVG files, a JavaScript library that lays them out, and an admin page that loads your badges from your WordPress.org profile and turns them into a single badge or a grid, as PNG or SVG.

## The plugin

Requires WordPress 6.6 or later. Once active, **Tools → WordPress.org Badges** has two tabs:

- **My badges**: enter a WordPress.org username and the page loads the badges of that profile. If the profile has a badge the plugin does not know, a notice says so: the badge catalog needs updating (see below).
- **Any badge**: every badge in the catalog, with a search field and a "Team badges only" filter, for example to get a team badge for a contributor day.

Both tabs work the same way: pick badges (with "All" and "None"), put them in order (drag them, use the arrows, or sort by profile order, name or team), and get one image. One badge gives that badge alone; several give a grid, with the number of columns, the badge size and the gap between badges. The background is always transparent. Download it as PNG, or as SVG, which scales to any size.

The page saves each tab as you leave it, per WordPress user: the username, the picked badges, their order and the image options. The first time, "My badges" picks every badge of the profile. After that it keeps your picks and order: a badge that is new on your profile shows up unpicked and marked as new, ready to add at the end, and a badge gone from your profile is taken out, with a notice.

WordPress.org has no public API for badges, so the plugin reads the groups tab of the profile (`https://profiles.wordpress.org/<username>/groups/`) on the server, through its REST route `GET /wp-json/cute-wp-badges/v1/badges/<username>`, and keeps the result for 12 hours. Add `?refresh=true` (or use the link under the username) to read the profile again. The saved state goes through `POST /wp-json/cute-wp-badges/v1/state/<tab>`. Both routes need the `upload_files` capability.

## The badges

Every badge ships as a finished SVG file in `resources/badges/<id>.svg`: the ring, the white border, the tinted circle of team badges (a solid color, no transparency) and the icon, all in the badge color, with a transparent background outside the ring. The files are scale-free (a `viewBox`, no fixed size) and clean: no ids, classes, styles, metadata, comments, embedded data or external references.

They are built from the catalog and the icons in `resources/icons/` by `composer build-badges` (`scripts/build-badges.mjs`), which sanitizes each icon with an allowlist on the way in. `composer validate-badges` checks that every badge has its file, up to date and clean. The icons themselves are only a source for the build and stay out of the plugin zip.

## The badge library

`resources/js/cute-wp-badges.js` gives you any badge of the catalog, or a grid of them, as SVG or PNG. It is a plain ES module with no build step, and works in the browser and in Node 18 or later:

```js
import { renderBadge, renderGrid } from './resources/js/cute-wp-badges.js';

const svg = await renderBadge( 'translation-contributor' );                                // the badge file as it is
const png = await renderBadge( 'translation-contributor', { format: 'png', size: 500 } );    // 500 × 500 PNG
const grid = await renderGrid( [ 'core-contributor', 'polyglots-team', 'photos-team' ], { format: 'png', columns: 5 } );
```

- `renderBadge( id, { format, size } )`: `id` is the badge id (the WordPress.org association slug) or one of its aliases; `format` is `'svg'` (default) or `'png'`. As SVG it returns the badge file as it is. As PNG it draws it `size` pixels wide and high, from 1 to 4096 (default 128).
- `renderGrid( ids, { columns, size, gap, format } )`: lays the badges out left to right and top to bottom, `columns` per row (default 5, fewer if there are fewer badges), each `size` wide (default 128) with `gap` between them (default 32), on a transparent background. As SVG, it nests each badge file as it is inside one scale-free SVG, where `size` and `gap` only set the proportions. As PNG, the whole grid is rasterized at once, up to 8192 pixels on each side.
- Both return SVG markup as a string, or the PNG as a `Blob` in the browser and a `Buffer` in Node, and throw on an unknown badge, format or out-of-range number.
- `getBadges()`: every badge in the catalog. `getBadge( id )`: one badge, or `null`.

The library reads the catalog and the badge files relative to its own file, so it has to stay in the plugin folder structure. In the browser, PNG output is drawn with a canvas. In Node it needs `@resvg/resvg-js`: run `npm install` in the repo.

To check it by eye, `npm run samples` renders into `samples/` (not committed) one SVG and one PNG per badge, a sheet with all of them, and `reference-grid.svg` and `.png`, the badges of [docs/reference-badges.png](docs/reference-badges.png) in the same order to compare with it. `preview.html` shows each badge drawn with plain CSS next to its composed SVG file.

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

   It reads the official list of badges (https://profiles.wordpress.org/associations/) and the WordPress.org profile CSS, updates `data/badges.json` and the team icons in `resources/icons/custom/`, composes the badge files in `resources/badges/`, validates the catalog and rebuilds `preview.html`. It prints what changed:

   - `NEW`: a badge that was not in the catalog. It is added with what can be worked out automatically. The fields it could not work out are left empty (`null`).
   - `RENAMED`: a badge whose name changed on WordPress.org. The new name is applied.
   - `GONE`: a badge that is no longer on WordPress.org. It is not removed; remove it by hand if it is really gone.
   - `COLOR`: the catalog and the profile CSS disagree on a color. Nothing is changed. Check the profile badges handbook (https://make.wordpress.org/meta/handbook/tutorials-guides/profile-badges/) and decide.
   - `CLASS`: a badge class in the profile CSS that no badge uses, usually a sign of a new badge.

3. Complete the new badges by hand in `data/badges.json`. Usually that means `teamUrl` (the team's page) and, for Dashicons, `icon`, which the handbook lists for each team. Every field is described in [docs/badges.md](docs/badges.md).

4. Compose the badges again and validate the catalog:

   ```bash
   composer build-badges
   composer validate-badges
   ```

   `build-badges` rewrites the badge files in `resources/badges/` with your changes. `validate-badges` checks every field, that each badge's icon file exists in `resources/icons/`, and that each badge file is up to date and clean. If it reports errors, go back to step 3 and run both again until it reports none. Then open `preview.html` in a browser to check the new badges by eye.

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
