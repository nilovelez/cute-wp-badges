# Plan

Milestones run one at a time, each started on Nilo's go-ahead and stopped for his review (see [AGENTS.md](../AGENTS.md)).

1. **Badge catalog.** `data/badges.json` with every badge: id, public name, team, team URL, WordPress.org CSS class, color, icon and whether it is a team badge. Research on how to get a user's badges from WordPress.org. *Done, pending review.*
2. **Single badge generator.** A JavaScript function that takes a badge id, a format (SVG or PNG) and a size, and returns the image in the old style, checked against Nilo's reference image. Includes the icons: the Dashicons the catalog uses and the custom SVGs from the profile CSS.
3. **Proof-of-concept page.** A badge selector, size and format fields, a generate button and a download. Published on GitHub Pages.

Later, not yet planned in detail:

- A grid editor: pick badges and lay them out (for example, five columns), like Nilo's reference image.
- Loading a user's badges from their WordPress.org profile (see [wporg-profile-api.md](wporg-profile-api.md)).
