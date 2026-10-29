# Getting a user's badges from WordPress.org

Research for a later milestone: given a WordPress.org username, find the badges that user holds. Checked on 2026-10-29.

## There is no public badges API

- `https://profiles.wordpress.org/wp-json/wporg/v1/users/<slug>` is public and sends CORS headers, but it only returns the id, name, URL, description, profile link and avatars. No badges.
- The other `wporg/v1`, `wporg-profiles/v1` and BuddyPress routes do not expose badges. `wp-abilities/v1` requires authentication.
- Badges are BuddyPress group memberships on profiles.wordpress.org. They are assigned through an internal, authenticated endpoint (`wporg-profiles-association-handler` in https://meta.svn.wordpress.org/sites/trunk/profiles.wordpress.org/).

## The profile page is the only source

`https://profiles.wordpress.org/<slug>/` lists the badges in its HTML, grouped by category:

```html
<span class="medal badge-code" title="Core Contributor · since August 2020">
  <span class="mi dashicons dashicons-editor-code"></span>
  <span class="mn">Core Contributor</span>
  <span class="myear">&#039;20</span>
</span>
```

Each badge gives its CSS class, its icon, its public name and, for most badges, the date it was earned. Matching against `data/badges.json` is described in [badges.md](badges.md#matching-a-profile).

Third-party tools do the same: WP Plugin Info Card (https://github.com/ronalfy/wp-plugin-info-card) downloads the profile page on its server and parses it.

## Problem for a static site

The profile page does not send `Access-Control-Allow-Origin`, so a page on GitHub Pages cannot read it from the browser. Options to decide on when that milestone starts:

- A CORS proxy (third-party or our own).
- A small serverless function that fetches and parses the profile.
- A GitHub Action that pre-generates the badges of known users into JSON files on the site.
- Letting the user paste their badge list, or the profile HTML, by hand.
