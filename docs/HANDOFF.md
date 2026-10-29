# Handoff

Where the work stands, for the next agent. Update it at the end of every session.

## Current state

- Milestone 1 (badge catalog) is done and approved. The project is now a WordPress plugin; the environment is set up with the `wp-agentic-workflow` skill.
- `data/badges.json` has 67 badges. Every `id` and `name` matches the BuddyPress associations directory on profiles.wordpress.org; 22 classes and icons are also verified against a live profile. Open points are listed in [badges.md](badges.md#open-points).
- There is no public JSON API for a user's badges. The groups tab of a profile (`/<username>/groups/`) lists them by association slug, but it has no CORS headers. Details and options in [wporg-profile-api.md](wporg-profile-api.md).
- `preview.html`, built by `scripts/build-preview.mjs`, draws every badge in the catalog with CSS. Rebuild it after changing the catalog.

## Next

Milestone 2 (badge library) is done and waiting for Nilo's review. Do not start milestone 3 until he says so.

Milestone 2 was tested in Node (`npm run samples`) and in headless Chrome. For the browser test, `--dump-dom` is not reliable: it can dump the page before asynchronous code finishes. Polling the page through the DevTools protocol (`--remote-debugging-port`) works.

## Reference

- Nilo's reference image of the old style: `docs/reference-badges.png`, his own badges in a five-column grid.
- Profile badges handbook: https://make.wordpress.org/meta/handbook/tutorials-guides/profile-badges/
- Nilo's profile: https://profiles.wordpress.org/nilovelez/
