# Badge icons

- `dashicons/`: every Dashicon as an SVG file, copied from the `svg-min` folder of https://github.com/WordPress/dashicons on 2026-10-29. That repository is archived and Dashicons gets no new icons, so the copy does not need updating. Licensed under GPLv2 or later, with font exception. Only the icons the badge catalog uses go into the plugin zip; the rest are `export-ignore`d by a block in `.gitattributes` that `composer validate-badges` keeps up to date.
- `custom/`: the icons of the teams that do not use a Dashicon, extracted from the WordPress.org profile CSS (`--svg-badge-*`). `composer update-badges` refreshes them.

In `data/badges.json`, `{ "type": "dashicon", "name": "camera" }` is `dashicons/camera.svg` and `{ "type": "svg", "name": "playground" }` is `custom/playground.svg`.
