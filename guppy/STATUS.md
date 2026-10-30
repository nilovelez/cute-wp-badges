# Status

Cute WP Badges is a WordPress plugin, published on GitHub only, that generates images of WordPress.org profile badges in the old profile style. Milestones 1 to 6 are done and approved: a catalog of all 67 badges, every badge composed into a clean SVG file, a JavaScript library that shows, nests or rasterizes them (`renderBadge()`, `renderGrid()`) in the browser and in Node, and Tools → WordPress.org Badges with two tabs, "My badges" (read from the WordPress.org profile on the server, cached for 12 hours) and "Any badge" (the whole catalog). Both tabs pick badges, order them and lay them out as one badge or a grid, as PNG or SVG, and keep their state per user. Milestone 6 is done and approved as well: images are saved to the Media Library (PNG, or SVG built on the server when an administrator allows it), and a design can be exported to a JSON file and imported again. Next is milestone 7: clean uninstall, Plugin Check, a friendlier README and version 1.0.0 released on GitHub.

## Log

Newest entries first. One per work session, brief.

- 2026-10-30: Milestone 6 (Media Library, settings export and import) built, tested in Playground with headless Chrome and approved. Milestone 7 (release 1.0.0) started.
- 2026-10-30: Milestone 5 approved by Nilo as it is; settings export and import added to milestone 6. Milestones 4 and 5 pushed.
- 2026-10-29: Milestones 4 (tabs and the user's badges from the profile) and 5 (composed badge SVGs, pick, order, grid, state saved per user) built and tested in Playground with headless Chrome.
- 2026-10-29: Milestone 3 tried by Nilo in a Playground site reached over Tailscale; test sites now use the Tailscale IP. Session closed.
- 2026-10-29: Milestone 3 (plugin skeleton and badge page) built and tested in Playground with headless Chrome; minimum WordPress raised to 6.6. Pending review.
- 2026-10-29: Milestone 2 approved after two fixes: icon `<style>` rules no longer leak between badges, and the sample sheets have a transparent background.
- 2026-10-29: Milestone 2 (badge library) built: every icon as an SVG file, the zip only carries the Dashicons in use, `renderBadge()` tested in Node and headless Chrome and compared with the reference image. Pending review.
- 2026-10-29: Badge ids switched to the WordPress.org association slugs; the groups tab of a profile matches the profile badges on 11 profiles. Project turned into a WordPress plugin, environment set up with wp-agentic-workflow, plugin files moved to `resources/`. Added `composer update-badges` and a static `preview.html`.
- 2026-10-29: Milestone 1 (badge catalog) built: 67 badges from the handbook, the profile CSS and a live profile; agent docs, plan and handoff added. Pending review.
- 2026-10-29: guppy/STATUS.md created. Project registered in Guppy; no code written yet.
