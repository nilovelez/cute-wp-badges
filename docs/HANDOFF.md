# Handoff

Where the work stands, for the next agent. Update it at the end of every session.

## Current state

- Milestones 1 to 4 are done and approved. Milestone 5 (composed badges, selection, order and grid, with the state saved per user) is done and waiting for Nilo's real-use review: he said it is hard to judge the interface before trying it, so expect changes. See [PLAN.md](PLAN.md).
- Every badge ships as a finished SVG in `resources/badges/`, composed and sanitized by `scripts/build-badges.mjs`; Nilo asked for this so the browser only shows, nests or rasterizes files. Nilo's rules for these files: no ids, no metadata beyond the essentials, nothing embedded; do not round the numbers (it saves little and can distort the drawing); the team tint is a solid color, never a transparency (it matters for print). The composed badges render pixel for pixel like the old in-browser drawing.
- The admin page has two tabs, chosen with `?tab=profile` (default) or `?tab=any`, sharing one editor: picker, order list and image (see "Layout" in AGENTS.md). Each tab's state (username, picked badges in order, the profile badges seen last time, columns, size, gap, format) is printed into `data-settings` when the page loads and saved through `POST /cute-wp-badges/v1/state/<tab>` half a second after each change. Strings come from PHP in the same attribute, since script modules have no `wp.i18n` in WordPress 6.6.
- "My badges" saves its state right after every profile load, which also records the badges seen; a badge that was not seen before shows up unpicked and marked as new.
- `includes/profile-badges.php` registers `GET /cute-wp-badges/v1/badges/<username>`: it reads the profile's groups tab on the server, caches the associations for 12 hours in a transient (errors are not cached), and splits them into catalog badge ids (aliases included) and unknown badges. Tested with WP-CLI: nilovelez (22 badges), a profile with none (`test`), an unknown user (404), an alias and an unknown badge (fake cache).
- `data/badges.json` has 67 badges. Every `id` and `name` matches the BuddyPress associations directory on profiles.wordpress.org; 22 classes and icons are also verified against a live profile. Open points are listed in [badges.md](badges.md#open-points).
- `resources/js/cute-wp-badges.js` reads the composed badges: `renderBadge()` returns the file as it is or rasterizes it, and `renderGrid()` nests the files in one scale-free SVG or rasterizes the whole grid, on a transparent background.
- The library is registered as the script module `@cute-wp-badges/cute-wp-badges`. The minimum WordPress version is 6.6, the first one that prints script modules in wp-admin.
- There is no public JSON API for a user's badges. The groups tab of a profile (`/<username>/groups/`) lists them by association slug, but it has no CORS headers. Details and options in [wporg-profile-api.md](wporg-profile-api.md).
- `preview.html`, built by `scripts/build-preview.mjs`, draws every badge in the catalog with CSS next to its composed SVG file. Rebuild it after changing the catalog.

## Next

Nilo tries milestone 5 for real and gives feedback on the interface. Then milestone 6 (Media Library), planned in [PLAN.md](PLAN.md). Do not start anything until Nilo says so.

## Testing

- Test sites for Nilo: start Playground with `--site-url` set to this machine's Tailscale IP (`tailscale ip -4`), or its LAN IP if it has none, and give him the URL. WordPress redirects to the URL it started with, so changing the address means restarting the site.
- There is also a Studio site, `C:\Users\manolito\Studio\cute-wp-badges`, at `http://localhost:8884` with no custom domain, and the repo linked into its plugins folder. It is only for Nilo when he is on this machine over VNC: Studio only takes `.local` domains and listens on localhost, so it cannot be reached by IP. `studio wp --path <site> eval-file <file>` is handy for PHP checks, even with the site stopped.
- `npm run samples` renders every badge into `samples/` to check the library by eye.
- For automated browser checks, `--dump-dom` is not reliable with asynchronous code; poll the page through the DevTools protocol (`--remote-debugging-port`) instead. Milestone 5 was checked that way in headless Chrome against Playground: a Node script (built-in `WebSocket`, no dependencies) logs in, resets both tabs' state through the state route, then drives the page (load a profile, move, remove, drag, sort, change options, reload, simulate a new and a gone badge, search and filter in "Any badge") and reports console errors. Wait for the "Load badges" button to be enabled before clicking it, and for the page's own save (about a second) before posting a state by hand, or the page overwrites it.

## Reference

- Nilo's reference image of the old style: `docs/reference-badges.png`, his own badges in a five-column grid.
- Profile badges handbook: https://make.wordpress.org/meta/handbook/tutorials-guides/profile-badges/
- Nilo's profile: https://profiles.wordpress.org/nilovelez/
