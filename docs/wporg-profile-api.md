# Getting a user's badges from WordPress.org

Research for a later milestone: given a WordPress.org username, find the badges that user holds. Checked on 2026-10-29.

## Badges are BuddyPress groups

WordPress.org profiles run on BuddyPress, and each badge is a BuddyPress group called an association (see [badges.md](badges.md#how-badges-work-on-wordpressorg)). Other WordPress.org sites assign and remove badges through `assign_badge()` and `remove_badge()` in `mu-plugins/pub/profile-helpers.php` (Meta repository), which post to an internal, authenticated `admin-ajax.php` action on profiles.wordpress.org (`wporg_handle_association`). That action only accepts `add` and `remove`; there is no read command. `get_user_badges()` in the same file reads the groups straight from the database, so it is not reachable from outside either.

## There is no public JSON API

- `https://profiles.wordpress.org/wp-json/wporg/v1/users/<slug>` is public and sends CORS headers, but it only returns the id, name, URL, description, profile link and avatars. No badges.
- The other `wporg/v1` and `wporg-profiles/v1` routes, and the BuddyPress REST API, do not expose badges. `wp-abilities/v1` requires authentication.
- A JSON endpoint for profile data, badges included, has been requested since Meta Trac ticket #613 and is still open.

## The groups tab of a profile

`https://profiles.wordpress.org/<username>/groups/` is the BuddyPress groups tab of the profile. It lists the user's associations, 20 per page (`?num=100` returns them all at once):

```html
<li class="odd bp-group-status-private private group-no-avatar">
  …
  <div class="item-title"><a href="https://profiles.wordpress.org/associations/photo-contributor/">Photo Contributor</a></div>
  …
</li>
```

The link gives the association slug, which is the `id` in `data/badges.json`. This is the cleanest source: slugs instead of names, no CSS classes to decode.

`https://profiles.wordpress.org/associations/?num=100` lists every association the same way.

Some badges are assigned dynamically rather than by group membership (the code comments in `profile-helpers.php` say so): Plugin Developer has a single stored member and Theme Developer 19, yet thousands of users show them. The groups tab includes them anyway. On 2026-10-29 the groups tab and the profile page listed exactly the same badges for 11 users (nilovelez, matt, westonruter, johnjamesjacoby, otto42, pento, ryelle, jeffpaul, sabernhardt, poena, dd32), with Plugin Developer for 10 of them and Theme Developer for 5. No other association has a member count that suggests dynamic assignment.

## The profile page

`https://profiles.wordpress.org/<username>/` also lists the badges, with their names, CSS classes, icons and the date each one was earned:

```html
<span class="medal badge-code" title="Core Contributor · since August 2020">
  <span class="mi dashicons dashicons-editor-code"></span>
  <span class="mn">Core Contributor</span>
  <span class="myear">&#039;20</span>
</span>
```

Every third-party tool checked (WP Plugin Info Card, Contributor Highlights, Contributor Resume and, by its markup, thewp.world) downloads this page on its server and parses it.

## Problem for a static site

Neither page sends `Access-Control-Allow-Origin`, so a page on GitHub Pages cannot read them from the browser. Options to decide on when that milestone starts:

- A CORS proxy (third-party or our own).
- A small serverless function that fetches and parses the page.
- A GitHub Action that pre-generates the badges of known users into JSON files on the site.
- Letting the user paste their badge list, or the page HTML, by hand.
