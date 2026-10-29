# Handoff

Where the work stands, for the next agent. Update it at the end of every session.

## Current state

- Milestones 1 (badge catalog), 2 (badge library) and 3 (plugin skeleton and badge page) are done. See [PLAN.md](PLAN.md).
- `data/badges.json` has 67 badges. Every `id` and `name` matches the BuddyPress associations directory on profiles.wordpress.org; 22 classes and icons are also verified against a live profile. Open points are listed in [badges.md](badges.md#open-points).
- `resources/js/cute-wp-badges.js` draws any badge as SVG or PNG, in the browser and in Node, with a transparent background outside the badge. Icon `<style>` elements are stripped, since their rules would leak into every badge in the same document.
- Tools → WordPress.org Badges (`includes/admin-page.php`, `resources/js/admin-page.js`, `resources/css/admin-page.css`) lets you pick any badge, a size and a format, previews it and downloads it. It is a proof of concept of the WordPress integration: the page, loading the library and the download stay; the selector with every badge is temporary. The library is registered as the script module `@cute-wp-badges/cute-wp-badges`. The minimum WordPress version is 6.6, the first one that prints script modules in wp-admin. Nilo tried it in Playground.
- There is no public JSON API for a user's badges. The groups tab of a profile (`/<username>/groups/`) lists them by association slug, but it has no CORS headers. Details and options in [wporg-profile-api.md](wporg-profile-api.md).
- `preview.html`, built by `scripts/build-preview.mjs`, draws every badge in the catalog with CSS. Rebuild it after changing the catalog.

## Next

The next milestone is not planned in detail yet; the candidates are under "Later" in [PLAN.md](PLAN.md), starting with loading a user's own badges from their profile. Do not start anything until Nilo says so.

## Testing

- Test sites for Nilo: start Playground with `--site-url` set to this machine's Tailscale IP (`tailscale ip -4`), or its LAN IP if it has none, and give him the URL. WordPress redirects to the URL it started with, so changing the address means restarting the site.
- `npm run samples` renders every badge into `samples/` to check the library by eye.
- For automated browser checks, `--dump-dom` is not reliable with asynchronous code; poll the page through the DevTools protocol (`--remote-debugging-port`) instead.

## Reference

- Nilo's reference image of the old style: `docs/reference-badges.png`, his own badges in a five-column grid.
- Profile badges handbook: https://make.wordpress.org/meta/handbook/tutorials-guides/profile-badges/
- Nilo's profile: https://profiles.wordpress.org/nilovelez/
