# Handoff

Where the work stands, for the next agent. Update it at the end of every session.

## Current state

- Milestones 1 (badge catalog), 2 (badge library) and 3 (plugin skeleton and badge page) are done. Milestone 4 (tabs and the user's badges) is done; Nilo tested it in Playground and approved it. See [PLAN.md](PLAN.md).
- The admin page has two tabs, chosen with `?tab=profile` (default) or `?tab=any`; each loads its own script module (`resources/js/profile-tab.js`, `resources/js/any-tab.js`), and both use `resources/js/badge-output.js` for size, format, preview and download. Strings for the profile tab come from PHP in a `data-settings` attribute, since script modules have no `wp.i18n` in WordPress 6.6.
- `includes/profile-badges.php` registers `GET /cute-wp-badges/v1/badges/<username>`: it reads the profile's groups tab on the server, caches the associations for 12 hours in a transient (errors are not cached), and splits them into catalog badge ids (aliases included) and unknown badges. Tested with WP-CLI: nilovelez (22 badges), a profile with none (`test`), an unknown user (404), an alias and an unknown badge (fake cache).
- `data/badges.json` has 67 badges. Every `id` and `name` matches the BuddyPress associations directory on profiles.wordpress.org; 22 classes and icons are also verified against a live profile. Open points are listed in [badges.md](badges.md#open-points).
- `resources/js/cute-wp-badges.js` draws any badge as SVG or PNG, in the browser and in Node, with a transparent background outside the badge. Icon `<style>` elements are stripped, since their rules would leak into every badge in the same document.
- Tools → WordPress.org Badges (`includes/admin-page.php`, `resources/js/admin-page.js`, `resources/css/admin-page.css`) lets you pick any badge, a size and a format, previews it and downloads it. It is a proof of concept of the WordPress integration: the page, loading the library and the download stay; the selector with every badge is temporary. The library is registered as the script module `@cute-wp-badges/cute-wp-badges`. The minimum WordPress version is 6.6, the first one that prints script modules in wp-admin. Nilo tried it in Playground.
- There is no public JSON API for a user's badges. The groups tab of a profile (`/<username>/groups/`) lists them by association slug, but it has no CORS headers. Details and options in [wporg-profile-api.md](wporg-profile-api.md).
- `preview.html`, built by `scripts/build-preview.mjs`, draws every badge in the catalog with CSS. Rebuild it after changing the catalog.

## Next

Milestone 5 (selection, order and grid, with the state saved per user) is planned in detail in [PLAN.md](PLAN.md), with Nilo's decisions. Do not start it until Nilo says so.

## Testing

- Test sites for Nilo: start Playground with `--site-url` set to this machine's Tailscale IP (`tailscale ip -4`), or its LAN IP if it has none, and give him the URL. WordPress redirects to the URL it started with, so changing the address means restarting the site.
- There is also a Studio site, `C:\Users\manolito\Studio\cute-wp-badges`, at `http://localhost:8884` with no custom domain, and the repo linked into its plugins folder. It is only for Nilo when he is on this machine over VNC: Studio only takes `.local` domains and listens on localhost, so it cannot be reached by IP. `studio wp --path <site> eval-file <file>` is handy for PHP checks, even with the site stopped.
- `npm run samples` renders every badge into `samples/` to check the library by eye.
- For automated browser checks, `--dump-dom` is not reliable with asynchronous code; poll the page through the DevTools protocol (`--remote-debugging-port`) instead.

## Reference

- Nilo's reference image of the old style: `docs/reference-badges.png`, his own badges in a five-column grid.
- Profile badges handbook: https://make.wordpress.org/meta/handbook/tutorials-guides/profile-badges/
- Nilo's profile: https://profiles.wordpress.org/nilovelez/
