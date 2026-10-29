<?php
/**
 * The "My WordPress.org Badges" admin page, under Tools.
 *
 * The page has two tabs: "My badges", which loads the badges of a
 * WordPress.org profile, and "Any badge", which offers every badge in the
 * catalog. The page only holds the forms. The badges are drawn in the browser
 * by the badge library (resources/js/cute-wp-badges.js), loaded as a script
 * module.
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
 * Returns the tabs of the page.
 *
 * @return array Tab slug => tab label.
 */
function cute_wp_badges_get_admin_tabs() {
	return array(
		'profile' => __( 'My badges', 'cute-wp-badges' ),
		'any'     => __( 'Any badge', 'cute-wp-badges' ),
	);
}

/**
 * Returns the tab being shown, "profile" by default.
 *
 * @return string Tab slug.
 */
function cute_wp_badges_get_current_tab() {
	// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Only picks the tab to show.
	$tab = isset( $_GET['tab'] ) ? sanitize_key( wp_unslash( $_GET['tab'] ) ) : 'profile';

	if ( ! array_key_exists( $tab, cute_wp_badges_get_admin_tabs() ) ) {
		$tab = 'profile';
	}

	return $tab;
}

/**
 * Returns the URL of a tab of the page.
 *
 * @param string $tab Tab slug.
 * @return string
 */
function cute_wp_badges_get_tab_url( $tab ) {
	return add_query_arg(
		array(
			'page' => 'cute-wp-badges',
			'tab'  => $tab,
		),
		admin_url( 'tools.php' )
	);
}

/**
 * Runs only when the page loads: queues its scripts and styles.
 */
function cute_wp_badges_load_admin_page() {
	add_action( 'admin_enqueue_scripts', 'cute_wp_badges_enqueue_admin_page' );
}

/**
 * Queues the badge library, the script of the current tab and the page styles.
 */
function cute_wp_badges_enqueue_admin_page() {
	wp_register_script_module(
		'@cute-wp-badges/cute-wp-badges',
		plugins_url( 'resources/js/cute-wp-badges.js', CUTE_WP_BADGES_FILE ),
		array(),
		CUTE_WP_BADGES_VERSION
	);

	wp_register_script_module(
		'@cute-wp-badges/badge-output',
		plugins_url( 'resources/js/badge-output.js', CUTE_WP_BADGES_FILE ),
		array( '@cute-wp-badges/cute-wp-badges' ),
		CUTE_WP_BADGES_VERSION
	);

	$tab = cute_wp_badges_get_current_tab();

	wp_enqueue_script_module(
		'@cute-wp-badges/' . $tab . '-tab',
		plugins_url( 'resources/js/' . $tab . '-tab.js', CUTE_WP_BADGES_FILE ),
		array( '@cute-wp-badges/cute-wp-badges', '@cute-wp-badges/badge-output' ),
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
	$current_tab = cute_wp_badges_get_current_tab();
	?>
	<div class="wrap">
		<h1><?php esc_html_e( 'My WordPress.org Badges', 'cute-wp-badges' ); ?></h1>

		<nav class="nav-tab-wrapper" aria-label="<?php esc_attr_e( 'Secondary menu', 'cute-wp-badges' ); ?>">
			<?php foreach ( cute_wp_badges_get_admin_tabs() as $tab => $label ) : ?>
				<a href="<?php echo esc_url( cute_wp_badges_get_tab_url( $tab ) ); ?>" class="nav-tab<?php echo $tab === $current_tab ? ' nav-tab-active' : ''; ?>"<?php echo $tab === $current_tab ? ' aria-current="page"' : ''; ?>><?php echo esc_html( $label ); ?></a>
			<?php endforeach; ?>
		</nav>

		<?php
		if ( 'any' === $current_tab ) {
			cute_wp_badges_render_any_tab();
		} else {
			cute_wp_badges_render_profile_tab();
		}

		cute_wp_badges_render_badge_output();
		?>
	</div>
	<?php
}

/**
 * Prints the "My badges" tab: a username field and the badges of that profile.
 */
function cute_wp_badges_render_profile_tab() {
	$username = get_user_meta( get_current_user_id(), 'cute_wp_badges_username', true );
	$settings = array(
		'restUrl' => rest_url( 'cute-wp-badges/v1/badges/' ),
		'nonce'   => wp_create_nonce( 'wp_rest' ),
		'strings' => array(
			'loading'        => __( 'Loading badges from WordPress.org…', 'cute-wp-badges' ),
			'noBadges'       => __( 'This profile has no badges.', 'cute-wp-badges' ),
			'invalidName'    => __( 'Enter a WordPress.org username: lowercase letters, numbers, dots, hyphens and underscores, as in the profile URL.', 'cute-wp-badges' ),
			'requestFailed'  => __( 'The badges could not be loaded.', 'cute-wp-badges' ),
			/* translators: %d: number of badges. */
			'badgeCount'     => __( 'Badges on this profile: %d. Pick one to preview and download it.', 'cute-wp-badges' ),
			'unknownBadges'  => __( 'This profile has badges that this version of the plugin does not know, so they are not shown. Update the plugin to get them:', 'cute-wp-badges' ),
			'updateHelpUrl'  => 'https://github.com/nilovelez/cute-wp-badges#updating-the-badge-catalog',
			'updateHelpText' => __( 'How to update the badge list', 'cute-wp-badges' ),
		),
	);
	?>
	<div id="cute-wp-badges-profile" data-settings="<?php echo esc_attr( wp_json_encode( $settings ) ); ?>">
		<form id="cute-wp-badges-profile-form">
			<table class="form-table" role="presentation">
				<tr>
					<th scope="row"><label for="cute-wp-badges-username"><?php esc_html_e( 'WordPress.org username', 'cute-wp-badges' ); ?></label></th>
					<td>
						<input type="text" id="cute-wp-badges-username" name="username" class="regular-text" value="<?php echo esc_attr( $username ); ?>" autocomplete="off" spellcheck="false" aria-describedby="cute-wp-badges-username-description">
						<button type="submit" class="button"><?php esc_html_e( 'Load badges', 'cute-wp-badges' ); ?></button>
						<p class="description" id="cute-wp-badges-username-description">
							<?php
							/* translators: %s: example profile URL. */
							printf( esc_html__( 'As in your profile URL: %s', 'cute-wp-badges' ), '<code>https://profiles.wordpress.org/<strong>username</strong>/</code>' );
							?>
						</p>
					</td>
				</tr>
			</table>
		</form>

		<p id="cute-wp-badges-profile-status" role="status"></p>
		<div id="cute-wp-badges-unknown" class="notice notice-warning inline" hidden></div>
		<ul id="cute-wp-badges-picker" class="cute-wp-badges-picker" hidden></ul>
		<p id="cute-wp-badges-refresh" hidden>
			<button type="button" class="button-link"><?php esc_html_e( 'Read the profile again from WordPress.org', 'cute-wp-badges' ); ?></button>
		</p>
	</div>
	<?php
}

/**
 * Prints the "Any badge" tab: a selector with every badge in the catalog.
 */
function cute_wp_badges_render_any_tab() {
	?>
	<table class="form-table" role="presentation">
		<tr>
			<th scope="row"><label for="cute-wp-badges-badge"><?php esc_html_e( 'Badge', 'cute-wp-badges' ); ?></label></th>
			<td><select id="cute-wp-badges-badge" name="badge"></select></td>
		</tr>
	</table>
	<?php
}

/**
 * Prints the part both tabs share: size, format, preview and download.
 */
function cute_wp_badges_render_badge_output() {
	?>
	<div id="cute-wp-badges-output" hidden>
		<form id="cute-wp-badges-form">
			<table class="form-table" role="presentation">
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
