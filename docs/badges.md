# Badge catalog

`data/badges.json` lists every WordPress.org profile badge known to exist. Each entry is one badge, that is, one team plus one variant ("Playground Contributor", "Playground Team"), never a whole team.

## Fields

| Field | Type | Content |
|---|---|---|
| `id` | string | Our unique identifier. It is the badge name passed through WordPress `sanitize_title()` (`Core Contributor` → `core-contributor`), which is the same key WordPress.org uses in `wporg_profiles_get_association_classes()` to map a badge to its CSS classes. |
| `name` | string | Public name, as WordPress.org shows it on profiles. |
| `team` | string | Team the badge belongs to, as named in the Meta handbook. |
| `teamUrl` | string | Full URL of the team's page. Usually its make.wordpress.org site (`https://make.wordpress.org/tv/`); teams without one point to their own site (`https://buddypress.org/`). |
| `wporgClass` | string | CSS class WordPress.org puts on the badge in the profile HTML (`badge-code`). Not unique: `badge-organizer` is used by both Meetup Organizer and WordCamp Organizer. |
| `color` | string | Badge color, lowercase hex. |
| `icon` | object | `{ "type": "dashicon", "name": "editor-code" }` for a Dashicon (`dashicons-editor-code`), or `{ "type": "svg", "name": "playground" }` for a custom SVG that WordPress.org ships in its profile CSS (`--svg-badge-playground`). |
| `isTeam` | boolean | `true` for team-level badges, drawn with a tinted background (the badge color at 25% opacity). `false` for contributor-level badges, drawn on white. |
| `aliases` | array | Other identifiers WordPress.org has used for the same badge (`polyglots-team` for Translation Editor). |
| `verified` | boolean | `true` when the exact name and class have been seen on a live profile. `false` when they come only from the handbook, the CSS or third-party code. |

## Matching a profile

On a profile page each badge is a `<span class="medal badge-…">` with the icon and the name inside (`<span class="mn">Core Contributor</span>`). Match on `sanitize_title(name)` against `id` and `aliases`. Do not match on the CSS class alone, because it is not unique.

## Sources

Checked on 2026-10-29.

1. **Profile badges handbook page**: https://make.wordpress.org/meta/handbook/tutorials-guides/profile-badges/. Team names, variants, colors and icons. The HTML carries the Dashicon class of each team.
2. **Profile theme CSS**: https://profiles.wordpress.org/wp-content/themes/profiles.wordpress.org/style.css. The complete list of `badge-*` classes, the colors, the tint, the custom SVG icons and the old badge geometry (see below).
3. **A live profile**: https://profiles.wordpress.org/nilovelez/. 22 badges with their exact names, classes and Dashicons. These are the `verified` entries.
4. **Five for the Future**: `plugins/wporg-5ftf/includes/xprofile.php` in https://github.com/WordPress/five-for-the-future. An older copy of `wporg_profiles_get_association_classes()`, which maps `sanitize_title()` names to classes. Source of the aliases.
5. **WP Plugin Info Card**: `php/Shortcodes.php` in https://github.com/ronalfy/wp-plugin-info-card. A third-party list of badge names, classes and the `has-overlay` (team) flag. Used as a hint only: it has errors (Security Contributor named "Security Team", Mobile named "Mobile Contributor").
6. **make.wordpress.org**: the list of team sites on the home page, plus direct checks of each path.

## Old badge style

The profile CSS still contains the rules of the old badge style that this project imitates:

- A 32 px circle with a 2 px white border and a 4 px ring in the badge color outside it (`box-shadow: 0 0 0 4px`).
- Team badges (`has-overlay`) fill the circle with the badge color at 25% opacity. Contributor badges have a white fill.
- The icon is drawn in the badge color: a 24 px Dashicon, or a custom SVG at 22 px.
- Some Dashicons get a 1 px nudge for optical centering (`admin-appearance`, `admin-plugins`, `art`, `format-chat`, `tickets`, `cloud`, `admin-site-alt3`).

## Open points

- **Unverified names.** 45 badges have `verified: false`. Their names follow the handbook pattern ("<Team> Contributor", "<Team> Team"), but the exact wording on profiles is not confirmed. Check them against profiles of people who hold them.
- **Variants missing from the handbook.** The CSS has Hosting Contributor, Security Contributor and Pathways Maintainer, which the handbook does not list (it says Hosting and Security are Team only, and Contributor Pathways has Contributor and Team).
- **WP Credits colors.** The handbook gives Graduate `#ae47f2` and Mentor `#8329e3`. The profile CSS uses `#ae47f2` for both. The catalog follows the handbook.
- **bbPress icon.** The handbook uses `buddicons-bbpress-logo`. The Five for the Future copy used `buddicons-replies`.
- **BuddyPress icon.** The handbook names a Dashicon (`buddicons-buddypress-logo`), but live profiles draw the custom SVG from the CSS. The catalog follows the live profile.
- **`tide` Dashicon.** Not part of the standard Dashicons set; it has to be checked when icons are extracted.
- **Team URLs.** The four event badges (Meetup Organizer, WordCamp Organizer, Speaker, Volunteer) point to the Community team site. Teams without a Make site point to their own page: bbPress (`bbpress.org`), BuddyPress (`buddypress.org`), Patterns (the Block Pattern Directory), WP Credits and Campus Connect (their wordpress.org/education pages) and Contributor Pathways (its Make handbook page). Core AI is at `make.wordpress.org/ai/` and Core Performance at `make.wordpress.org/performance/`.
- **Pathways Maintainer as a team badge.** Set to `isTeam: true` because it is the second, higher variant. Not confirmed.
