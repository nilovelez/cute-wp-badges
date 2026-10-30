<?php
/**
 * Plugin Name:       Cute WP Badges
 * Plugin URI:        https://github.com/nilovelez/cute-wp-badges
 * Description:       Generates images of your WordPress.org profile badges in the classic profile style.
 * Version:           1.0.0
 * Requires at least: 6.6
 * Requires PHP:      7.4
 * Author:            Nilo Velez
 * Author URI:        https://www.nilovelez.com
 * License:           GPL-2.0-or-later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       cute-wp-badges
 *
 * @package Cute_WP_Badges
 */

defined( 'ABSPATH' ) || exit;

define( 'CUTE_WP_BADGES_VERSION', '1.0.0' );
define( 'CUTE_WP_BADGES_FILE', __FILE__ );

require_once __DIR__ . '/includes/admin-page.php';
require_once __DIR__ . '/includes/profile-badges.php';
require_once __DIR__ . '/includes/badge-state.php';
require_once __DIR__ . '/includes/media-library.php';
