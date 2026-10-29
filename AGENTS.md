# Cute WP Badges: agent instructions

Read this file, then [docs/HANDOFF.md](docs/HANDOFF.md) for where the work stands and [docs/PLAN.md](docs/PLAN.md) for the milestones.

## The project

An image generator for WordPress.org profile badges, drawn in the old profile style (a colored ring around a white or tinted circle, with the icon in the badge color). The end goal: anyone enters their WordPress.org profile and gets an image, such as a grid, of their own badges. It must run as a static site on GitHub Pages: HTML and JavaScript only, no server.

## How we work with Nilo

- Nilo runs the project and sets the pace. Do not make assumptions or fire off lists of questions; listen, and ask only what blocks the work.
- Talk to Nilo in Spanish. Everything in the repo is in US English: code, names, comments, docs, README, commit messages.
- Work goes milestone by milestone ([docs/PLAN.md](docs/PLAN.md)). Start a milestone only when Nilo says so: explain what you will do, do it, then stop for his review. Never chain milestones.
- One branch per milestone (`git switch -c <type>/<short-name>`), no pull requests. When Nilo approves: `git merge --no-ff` into `main`, push and delete the branch, local and remote. Push only when he asks.
- Keep the agent docs in the repo so any agent can pick the work up: update [docs/HANDOFF.md](docs/HANDOFF.md) at the end of every session.

## Layout

- `data/badges.json`: catalog of every badge. Fields and sources in [docs/badges.md](docs/badges.md).
- `scripts/validate-badges.mjs`: checks the catalog (`node scripts/validate-badges.mjs`). Run it after every change to the catalog.
- `docs/wporg-profile-api.md`: how to get a user's badges from WordPress.org.
