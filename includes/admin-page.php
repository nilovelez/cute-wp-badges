<?php
/**
 * The "My WordPress.org Badges" admin page, under Tools.
 *
 * The page only holds the form. The badges are drawn in the browser by the
 * badge library (resources/js/cute-wp-badges.js), loaded as a script module.
 *
 * @package Cute_WP_Badges
 */

defined( 'ABSPATH' ) || exit;

/**
 * Adds the page to the Tools menu.
 */
function cute_wp_badges_add_admin_page() {
	$hook_suffix = add_management_page(
		__( 'My WordPress.org Badges', 'cute-wp-badges' ),
		__( 'WordPress.org Badges', 'cute-wp-badges' ),
		'upload_files',
		'cute-wp-badges',
		'cute_wp_badges_render_admin_page'
	);

	if ( $hook_suffix ) {
		add_action( 'load-' . $hook_suffix, 'cute_wp_badges_load_admin_page' );
	}
}
add_action( 'admin_menu', 'cute_wp_badges_add_admin_page' );

/**
 * Runs only when the page loads: queues its scripts and styles.
 */
function cute_wp_badges_load_admin_page() {
	add_action( 'admin_enqueue_scripts', 'cute_wp_badges_enqueue_admin_page' );
}

/**
 * Queues the badge library, the page script and the page styles.
 */
function cute_wp_badges_enqueue_admin_page() {
	wp_register_script_module(
		'@cute-wp-badges/cute-wp-badges',
		plugins_url( 'resources/js/cute-wp-badges.js', CUTE_WP_BADGES_FILE ),
		array(),
		CUTE_WP_BADGES_VERSION
	);

	wp_enqueue_script_module(
		'@cute-wp-badges/admin-page',
		plugins_url( 'resources/js/admin-page.js', CUTE_WP_BADGES_FILE ),
		array( '@cute-wp-badges/cute-wp-badges' ),
		CUTE_WP_BADGES_VERSION
	);

	wp_enqueue_style(
		'cute-wp-badges-admin-page',
		plugins_url( 'resources/css/admin-page.css', CUTE_WP_BADGES_FILE ),
		array(),
		CUTE_WP_BADGES_VERSION
	);
}

/**
 * Prints the page.
 */
function cute_wp_badges_render_admin_page() {
	?>
	<div class="wrap">
		<h1><?php esc_html_e( 'My WordPress.org Badges', 'cute-wp-badges' ); ?></h1>

		<form id="cute-wp-badges-form">
			<table class="form-table" role="presentation">
				<tr>
					<th scope="row"><label for="cute-wp-badges-badge"><?php esc_html_e( 'Badge', 'cute-wp-badges' ); ?></label></th>
					<td><select id="cute-wp-badges-badge" name="badge"></select></td>
				</tr>
				<tr>
					<th scope="row"><label for="cute-wp-badges-size"><?php esc_html_e( 'Size', 'cute-wp-badges' ); ?></label></th>
					<td>
						<input type="number" id="cute-wp-badges-size" name="size" class="small-text" value="500" min="1" max="4096" step="1">
						<?php esc_html_e( 'pixels', 'cute-wp-badges' ); ?>
					</td>
				</tr>
				<tr>
					<th scope="row"><?php esc_html_e( 'Format', 'cute-wp-badges' ); ?></th>
					<td>
						<fieldset>
							<legend class="screen-reader-text"><?php esc_html_e( 'Format', 'cute-wp-badges' ); ?></legend>
							<label><input type="radio" name="format" value="png" checked> PNG</label><br>
							<label><input type="radio" name="format" value="svg"> SVG</label>
						</fieldset>
					</td>
				</tr>
			</table>
		</form>

		<h2><?php esc_html_e( 'Preview', 'cute-wp-badges' ); ?></h2>
		<div class="cute-wp-badges-preview">
			<img id="cute-wp-badges-image" alt="" hidden>
		</div>
		<p id="cute-wp-badges-message" role="status"></p>
		<p><a id="cute-wp-badges-download" class="button button-primary" hidden><?php esc_html_e( 'Download', 'cute-wp-badges' ); ?></a></p>
	</div>
	<?php
}
