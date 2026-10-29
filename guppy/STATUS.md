# Status

Cute WP Badges is a WordPress plugin, published on GitHub only, that generates images of WordPress.org profile badges in the old profile style. Milestone 1 is done: a catalog of all 67 badges in `data/badges.json`, keyed by their WordPress.org association slugs, with `composer update-badges` to refresh it. Milestone 2 is done and approved: `resources/js/cute-wp-badges.js` draws any badge as SVG or PNG (transparent background) in the browser and in Node, from SVG icons (the whole Dashicons set plus the custom team icons), and matches Nilo's reference image. Next is milestone 3, the plugin skeleton and its admin page.

## Log

Newest entries first. One per work session, brief.

- 2026-10-29: Milestone 2 approved after two fixes: icon `<style>` rules no longer leak between badges, and the sample sheets have a transparent background.
- 2026-10-29: Milestone 2 (badge library) built: every icon as an SVG file, the zip only carries the Dashicons in use, `renderBadge()` tested in Node and headless Chrome and compared with the reference image. Pending review.
- 2026-10-29: Badge ids switched to the WordPress.org association slugs; the groups tab of a profile matches the profile badges on 11 profiles. Project turned into a WordPress plugin, environment set up with wp-agentic-workflow, plugin files moved to `resources/`. Added `composer update-badges` and a static `preview.html`.
- 2026-10-29: Milestone 1 (badge catalog) built: 67 badges from the handbook, the profile CSS and a live profile; agent docs, plan and handoff added. Pending review.
- 2026-10-29: guppy/STATUS.md created. Project registered in Guppy; no code written yet.
