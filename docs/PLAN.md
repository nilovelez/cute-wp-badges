# Plan

Milestones run one at a time, each started on Nilo's go-ahead and stopped for his review (see [AGENTS.md](../AGENTS.md)).

The project is a WordPress plugin, published on GitHub only (not in the WordPress.org directory). Badge drawing lives in a standalone JavaScript library that works both in the browser and in Node; the plugin uses it in an admin page and fetches the user's badges on the server, which avoids the CORS limits of profiles.wordpress.org (see [wporg-profile-api.md](wporg-profile-api.md)).

1. **Badge catalog.** `data/badges.json` with every badge: WordPress.org association slug, public name, team, team URL, profile CSS class, color, icon and whether it is a team badge. Research on how to get a user's badges from WordPress.org. *Done.*
2. **Badge library.** A JavaScript module, usable in the browser and in Node, that takes a badge id from the catalog, a format (SVG or PNG) and a size, and returns the image in the old style, checked against Nilo's reference image. It always builds an SVG and rasterizes it for PNG. Icons are SVG paths: the Dashicons the catalog uses, taken from the official Dashicons repository, plus the custom SVGs from the profile CSS.
3. **Plugin skeleton and badge page.** The WordPress plugin with an admin page ("My WordPress.org Badges"): a badge selector, size and format fields, a preview and a download, using the library.

Later, not yet planned in detail:

- Loading the user's badges: a REST endpoint in the plugin that reads `https://profiles.wordpress.org/<username>/groups/?num=100` on the server, with a cache. If the profile has a badge that is not in the catalog, the plugin shows a notice saying that a badge it does not know was found and that the plugin needs updating (see "Updating the badge catalog" in the README).
- A grid editor: pick badges and lay them out (for example, five columns), like Nilo's reference image.
- Uploading the generated image to the Media Library through the WordPress REST API: PNG by default, SVG only if the user turns on an option.
