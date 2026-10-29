# Handoff

Where the work stands, for the next agent. Update it at the end of every session.

## Current state

- Milestone 1 (badge catalog) is done on `main`, waiting for Nilo's review.
- `data/badges.json` has 67 badges. Every `id` and `name` matches the BuddyPress associations directory on profiles.wordpress.org; 22 classes and icons are also verified against a live profile. Open points are listed in [badges.md](badges.md#open-points).
- There is no public JSON API for a user's badges. The groups tab of a profile (`/<username>/groups/`) lists them by association slug, but it has no CORS headers. Details and options in [wporg-profile-api.md](wporg-profile-api.md).
- `preview.html`, built by `scripts/build-preview.mjs`, draws every badge in the catalog with CSS. Rebuild it after changing the catalog.

## Next

Wait for Nilo's review of milestone 1. Do not start milestone 2 until he says so.

## Reference

- Nilo's reference image of the old style: his own badges in a five-column grid. It is not in the repo yet.
- Profile badges handbook: https://make.wordpress.org/meta/handbook/tutorials-guides/profile-badges/
- Nilo's profile: https://profiles.wordpress.org/nilovelez/
