# Status

Cute WP Badges is a WordPress plugin, published on GitHub only, that generates images of WordPress.org profile badges in the old profile style. Milestone 1 is done: a catalog of all 67 badges in `data/badges.json`, keyed by their WordPress.org association slugs, with `composer update-badges` to refresh it. A user's badges can be read from the groups tab of their profile, on the server. The plugin development environment is set up. Next is milestone 2, a JavaScript library that draws a single badge as SVG or PNG in the browser and in Node.

## Log

Newest entries first. One per work session, brief.

- 2026-10-29: Badge ids switched to the WordPress.org association slugs; the groups tab of a profile matches the profile badges on 11 profiles. Project turned into a WordPress plugin, environment set up with wp-agentic-workflow, plugin files moved to `resources/`. Added `composer update-badges` and a static `preview.html`.
- 2026-10-29: Milestone 1 (badge catalog) built: 67 badges from the handbook, the profile CSS and a live profile; agent docs, plan and handoff added. Pending review.
- 2026-10-29: guppy/STATUS.md created. Project registered in Guppy; no code written yet.
