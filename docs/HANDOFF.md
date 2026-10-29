# Handoff

Where the work stands, for the next agent. Update it at the end of every session.

## Current state

- Milestone 1 (badge catalog) is done and approved. The project is now a WordPress plugin; the environment is set up with the `wp-agentic-workflow` skill.
- `data/badges.json` has 67 badges. Every `id` and `name` matches the BuddyPress associations directory on profiles.wordpress.org; 22 classes and icons are also verified against a live profile. Open points are listed in [badges.md](badges.md#open-points).
- There is no public JSON API for a user's badges. The groups tab of a profile (`/<username>/groups/`) lists them by association slug, but it has no CORS headers. Details and options in [wporg-profile-api.md](wporg-profile-api.md).
- `preview.html`, built by `scripts/build-preview.mjs`, draws every badge in the catalog with CSS. Rebuild it after changing the catalog.

## Next

Milestone 2 (badge library) is done and approved: `resources/js/cute-wp-badges.js` draws any badge as SVG or PNG, with a transparent background outside the badge. Icon `<style>` elements are stripped, since their rules would leak into every badge in the same document.

Milestone 3 (plugin skeleton and badge page) is done and waiting for Nilo's review: Tools → WordPress.org Badges (`includes/admin-page.php`, `resources/js/admin-page.js`, `resources/css/admin-page.css`). The library is registered as the script module `@cute-wp-badges/cute-wp-badges` and the page script imports it by that name. The minimum WordPress version went from 6.5 to 6.6, the first one that prints script modules in wp-admin. Tested in Playground with headless Chrome: 67 badges listed, PNG and SVG drawn at the chosen size, download link and error message work, no JavaScript errors. Do not start the next milestone until Nilo says so.

Milestone 2 was tested in Node (`npm run samples`) and in headless Chrome. For the browser test, `--dump-dom` is not reliable: it can dump the page before asynchronous code finishes. Polling the page through the DevTools protocol (`--remote-debugging-port`) works.

## Reference

- Nilo's reference image of the old style: `docs/reference-badges.png`, his own badges in a five-column grid.
- Profile badges handbook: https://make.wordpress.org/meta/handbook/tutorials-guides/profile-badges/
- Nilo's profile: https://profiles.wordpress.org/nilovelez/
