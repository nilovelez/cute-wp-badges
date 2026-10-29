# Cute WP Badges: agent instructions

Read this file, then [docs/HANDOFF.md](docs/HANDOFF.md) for where the work stands and [docs/PLAN.md](docs/PLAN.md) for the milestones.

## The project

An image generator for WordPress.org profile badges, drawn in the old profile style (a colored ring around a white or tinted circle, with the icon in the badge color). The end goal: anyone gets an image, such as a grid, of their own badges. It is a WordPress plugin, published on GitHub only, built around a standalone JavaScript library that draws the badges in the browser and in Node. See [docs/PLAN.md](docs/PLAN.md).

## How we work with Nilo

- Nilo runs the project and sets the pace. Do not make assumptions or fire off lists of questions; listen, and ask only what blocks the work.
- Talk to Nilo in Spanish. Everything in the repo is in US English: code, names, comments, docs, README, commit messages.
- Work goes milestone by milestone ([docs/PLAN.md](docs/PLAN.md)). Start a milestone only when Nilo says so: explain what you will do, do it, then stop for his review. Never chain milestones.
- Work locally on `main`, with no branches and no pull requests. Commit locally as you go.
- Never push on your own. Nilo asks for a push when he has reviewed and approved a milestone, before the next one starts, or now and then to try something on another machine.
- Branches only when Nilo says so: when he wants to try something experimental, asks you to open a branch for a feature, or leaves you his own code on a branch he names.
- Keep the agent docs in the repo so any agent can pick the work up: update [docs/HANDOFF.md](docs/HANDOFF.md) at the end of every session.

## WordPress workflow

This plugin follows the `wp-agentic-workflow` skill (https://github.com/nilovelez/wp-agentic-workflow): load it before changing plugin code. In short:

- Check the environment with the skill's `check-env.mjs` at the start of a session.
- WordPress Coding Standards: `composer install` once, then `composer lint` before every commit that touches PHP.
- Test sites: Playground, which Nilo reaches from another machine over Tailscale (`npx @wp-playground/cli@latest server --blueprint ./blueprint.json --mount-dir . /wordpress/wp-content/plugins/cute-wp-badges`), with `--site-url http://<IP>:9400` using this machine's Tailscale IP (`tailscale ip -4`), or its LAN IP if it has none. Login `admin` / `password`. Start a site only when Nilo asks for it, and give him the URL. The Studio site (see [docs/HANDOFF.md](docs/HANDOFF.md#testing)) is only for when he works on this machine itself, over VNC: Studio only takes `.local` domains and listens on localhost, so it cannot be reached by IP.
- `assets/` and `assets-src/` are reserved for the WordPress.org directory images, as the skill says, even if the plugin is only on GitHub for now. The plugin's own files (icons, scripts) live in `resources/`. Development files are `export-ignore` in `.gitattributes`.

## Layout

- `cute-wp-badges.php`: main plugin file.
- `includes/admin-page.php`: the Tools → WordPress.org Badges page, with the tabs "My badges" and "Any badge" and the editor they share (pick, order, image). It prints the page settings (REST URLs, saved state, strings) in `data-settings`, registers the script modules and loads the current tab's script and `resources/css/admin-page.css`.
- `includes/profile-badges.php`: the REST route `GET /cute-wp-badges/v1/badges/<username>`, which reads a user's badges from their WordPress.org profile on the server, with a 12-hour cache.
- `includes/badge-state.php`: the REST route `POST /cute-wp-badges/v1/state/<tab>`, which saves each tab's state per user in user meta.
- `resources/js/`: script modules, written to the WordPress JavaScript coding standards, no build step:
  - `cute-wp-badges.js`: the badge library (`renderBadge()`, `renderGrid()`), for the browser and Node. Usage in the README.
  - `badge-store.js`: the state of the current tab and its saving; every other module reads and changes the state through it.
  - `badge-picker.js`, `badge-order.js`, `badge-output.js`: the three parts of the editor.
  - `profile-tab.js`, `any-tab.js`: the source of each tab.
- `data/badges.json`: catalog of every badge. Fields and sources in [docs/badges.md](docs/badges.md).
- `resources/badges/`: every badge as a finished, sanitized SVG file, built by `scripts/build-badges.mjs` (`composer build-badges`) with `scripts/compose-badge.mjs`. Never edit them by hand.
- `resources/icons/`: the source icons of the badges, in `dashicons/` (the whole Dashicons set) and `custom/` (team icons from the WordPress.org profile CSS). Not in the plugin zip. See its README.
- `scripts/render-samples.mjs`: renders every badge and two grids with the library into `samples/` (`npm run samples`), one of them to compare with `docs/reference-badges.png`, Nilo's reference image of the old style.
- `scripts/update-badges.mjs`: updates the catalog and the icons from WordPress.org (`composer update-badges`). The process is documented in the README.
- `scripts/validate-badges.mjs`: checks the catalog and that every badge file is up to date and clean (`composer validate-badges`, which also rebuilds `preview.html`). Run `composer build-badges` and then this after every change to the catalog or the icons.
- `docs/wporg-profile-api.md`: how to get a user's badges from WordPress.org.
