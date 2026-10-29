# Cute WP Badges

WordPress plugin that generates images of WordPress.org profile badges, in the classic profile style.

Work in progress. So far the project has a catalog of every badge (`data/badges.json`), documented in [docs/badges.md](docs/badges.md).

## Updating the badge catalog

The plugin ships with the list of WordPress.org badges that existed when it was released. Badges change rarely, but when a WordPress.org team adds or renames one, the catalog has to be updated and the plugin packaged again.

You need Git, Node.js 18 or later and Composer.

1. Clone the repository and go into it:

   ```bash
   git clone https://github.com/nilovelez/cute-wp-badges.git
   cd cute-wp-badges
   ```

2. Update the catalog from WordPress.org:

   ```bash
   composer update-badges
   ```

   It reads the official list of badges (https://profiles.wordpress.org/associations/) and the WordPress.org profile CSS, updates `data/badges.json` and the team icons in `resources/icons/custom/`, validates the catalog and rebuilds `preview.html`. It prints what changed:

   - `NEW`: a badge that was not in the catalog. It is added with what can be worked out automatically. The fields it could not work out are left empty (`null`).
   - `RENAMED`: a badge whose name changed on WordPress.org. The new name is applied.
   - `GONE`: a badge that is no longer on WordPress.org. It is not removed; remove it by hand if it is really gone.
   - `COLOR`: the catalog and the profile CSS disagree on a color. Nothing is changed. Check the profile badges handbook (https://make.wordpress.org/meta/handbook/tutorials-guides/profile-badges/) and decide.
   - `CLASS`: a badge class in the profile CSS that no badge uses, usually a sign of a new badge.

3. Complete the new badges by hand in `data/badges.json`. Usually that means `teamUrl` (the team's page) and, for Dashicons, `icon`, which the handbook lists for each team. Every field is described in [docs/badges.md](docs/badges.md).

4. Validate the catalog:

   ```bash
   composer validate-badges
   ```

   It checks every field and that each badge's icon file exists in `resources/icons/`, and updates the list of Dashicons that go into the zip in `.gitattributes`. If it reports errors, go back to step 3 and run it again until it reports none. Then open `preview.html` in a browser to check the new badges by eye.

5. Raise the plugin version in the `Version:` header of `cute-wp-badges.php` and commit everything, saying that the badge catalog was updated:

   ```bash
   git add -A
   git commit -m "Update the badge catalog"
   ```

   Commit before building the zip: `git archive` only packs committed files, and reads the `.gitattributes` of the commit to decide what to leave out.

6. Build the plugin zip:

   ```bash
   git archive --format=zip --prefix=cute-wp-badges/ -o cute-wp-badges-<version>.zip HEAD
   ```

   Development files are left out (see `.gitattributes`).
