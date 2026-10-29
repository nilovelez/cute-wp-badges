<?php
/**
 * The "My WordPress.org Badges" admin page, under Tools.
 *
 * The page has two tabs: "My badges", which loads the badges of a
 * WordPress.org profile, and "Any badge", which offers every badge in the
 * catalog. Both work the same way: pick badges, put them in order and get
 * one image, a single badge or a grid. The page only holds the markup; the
 * badges are drawn in the browser by the badge library
 * (resources/js/cute-wp-badges.js), loaded as a script module.
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
 * Queues the badge library, the page modules, the script of the current tab
 * and the page styles.
 */
function cute_wp_badges_enqueue_admin_page() {
	$library = '@cute-wp-badges/cute-wp-badges';
	$store   = '@cute-wp-badges/badge-store';

	wp_register_script_module( $library, plugins_url( 'resources/js/cute-wp-badges.js', CUTE_WP_BADGES_FILE ), array(), CUTE_WP_BADGES_VERSION );
	wp_register_script_module( $store, plugins_url( 'resources/js/badge-store.js', CUTE_WP_BADGES_FILE ), array(), CUTE_WP_BADGES_VERSION );

	$modules = array( 'badge-picker', 'badge-order', 'badge-output' );
	foreach ( $modules as $module ) {
		wp_register_script_module(
			'@cute-wp-badges/' . $module,
			plugins_url( 'resources/js/' . $module . '.js', CUTE_WP_BADGES_FILE ),
			array( $library, $store ),
			CUTE_WP_BADGES_VERSION
		);
	}

	$tab = cute_wp_badges_get_current_tab();

	wp_enqueue_script_module(
		'@cute-wp-badges/' . $tab . '-tab',
		plugins_url( 'resources/js/' . $tab . '-tab.js', CUTE_WP_BADGES_FILE ),
		array( $library, $store, '@cute-wp-badges/badge-picker', '@cute-wp-badges/badge-order', '@cute-wp-badges/badge-output' ),
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
 * Returns what the page scripts need: REST URLs, the saved state and the
 * interface strings (script modules have no wp.i18n in WordPress 6.6).
 *
 * @param string $tab Tab slug.
 * @return array
 */
function cute_wp_badges_get_page_settings( $tab ) {
	return array(
		'tab'      => $tab,
		'badgeUrl' => rest_url( 'cute-wp-badges/v1/badges/' ),
		'stateUrl' => rest_url( 'cute-wp-badges/v1/state/' . $tab ),
		'nonce'    => wp_create_nonce( 'wp_rest' ),
		'state'    => cute_wp_badges_get_state( $tab ),
		'strings'  => array(
			'loading'        => __( 'Loading badges from WordPress.org…', 'cute-wp-badges' ),
			'noBadges'       => __( 'This profile has no badges.', 'cute-wp-badges' ),
			'invalidName'    => __( 'Enter a WordPress.org username: lowercase letters, numbers, dots, hyphens and underscores, as in the profile URL.', 'cute-wp-badges' ),
			'requestFailed'  => __( 'The badges could not be loaded.', 'cute-wp-badges' ),
			/* translators: %d: number of badges. */
			'badgeCount'     => __( 'Badges on this profile: %d.', 'cute-wp-badges' ),
			'unknownBadges'  => __( 'This profile has badges that this version of the plugin does not know, so they are not shown. Update the plugin to get them:', 'cute-wp-badges' ),
			'updateHelpUrl'  => 'https://github.com/nilovelez/cute-wp-badges#updating-the-badge-catalog',
			'updateHelpText' => __( 'How to update the badge list', 'cute-wp-badges' ),
			'newBadges'      => __( 'New on your profile since last time. They are not in your image yet: pick them to add them at the end.', 'cute-wp-badges' ),
			'newLabel'       => __( 'New', 'cute-wp-badges' ),
			'goneBadges'     => __( 'No longer on your profile, so they were taken out of your image:', 'cute-wp-badges' ),
			'noMatches'      => __( 'No badge matches.', 'cute-wp-badges' ),
			'pickSome'       => __( 'Pick at least one badge to get an image.', 'cute-wp-badges' ),
			'saveFailed'     => __( 'Your changes could not be saved. They will be lost when you leave the page.', 'cute-wp-badges' ),
			/* translators: %s: badge name. */
			'moveUp'         => __( 'Move %s up', 'cute-wp-badges' ),
			/* translators: %s: badge name. */
			'moveDown'       => __( 'Move %s down', 'cute-wp-badges' ),
			/* translators: %s: badge name. */
			'remove'         => __( 'Remove %s', 'cute-wp-badges' ),
			/* translators: 1: image width, 2: image height, in pixels. */
			'imageSize'      => __( '%1$d × %2$d pixels', 'cute-wp-badges' ),
		),
	);
}

/**
 * Prints the page.
 */
function cute_wp_badges_render_admin_page() {
	$current_tab = cute_wp_badges_get_current_tab();
	?>
	<div class="wrap cute-wp-badges">
		<h1><?php esc_html_e( 'My WordPress.org Badges', 'cute-wp-badges' ); ?></h1>

		<nav class="nav-tab-wrapper" aria-label="<?php esc_attr_e( 'Secondary menu', 'cute-wp-badges' ); ?>">
			<?php foreach ( cute_wp_badges_get_admin_tabs() as $tab => $label ) : ?>
				<a href="<?php echo esc_url( cute_wp_badges_get_tab_url( $tab ) ); ?>" class="nav-tab<?php echo $tab === $current_tab ? ' nav-tab-active' : ''; ?>"<?php echo $tab === $current_tab ? ' aria-current="page"' : ''; ?>><?php echo esc_html( $label ); ?></a>
			<?php endforeach; ?>
		</nav>

		<div id="cute-wp-badges-app" data-settings="<?php echo esc_attr( wp_json_encode( cute_wp_badges_get_page_settings( $current_tab ) ) ); ?>">
			<?php
			if ( 'any' === $current_tab ) {
				cute_wp_badges_render_any_source();
			} else {
				cute_wp_badges_render_profile_source();
			}

			cute_wp_badges_render_editor( $current_tab );
			?>
		</div>
	</div>
	<?php
}

/**
 * Prints the source of the "My badges" tab: the username field and the
 * notices about the profile.
 */
function cute_wp_badges_render_profile_source() {
	$state    = cute_wp_badges_get_state( 'profile' );
	$username = $state ? $state['username'] : '';
	?>
	<form id="cute-wp-badges-profile-form">
		<table class="form-table" role="presentation">
			<tr>
				<th scope="row"><label for="cute-wp-badges-username"><?php esc_html_e( 'WordPress.org username', 'cute-wp-badges' ); ?></label></th>
				<td>
					<input type="text" id="cute-wp-badges-username" name="username" class="regular-text" value="<?php echo esc_attr( $username ); ?>" autocomplete="off" spellcheck="false" aria-describedby="cute-wp-badges-username-description">
					<?php /* Enabled by the tab script once it handles the form. */ ?>
					<button type="submit" class="button" disabled><?php esc_html_e( 'Load badges', 'cute-wp-badges' ); ?></button>
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
	<div id="cute-wp-badges-changes" class="notice notice-info inline" hidden></div>
	<p id="cute-wp-badges-refresh" hidden>
		<button type="button" class="button-link"><?php esc_html_e( 'Read the profile again from WordPress.org', 'cute-wp-badges' ); ?></button>
	</p>
	<?php
}

/**
 * Prints the source of the "Any badge" tab: search and filter for the catalog.
 */
function cute_wp_badges_render_any_source() {
	?>
	<div class="cute-wp-badges-filters">
		<label for="cute-wp-badges-search"><?php esc_html_e( 'Search badges', 'cute-wp-badges' ); ?></label>
		<input type="search" id="cute-wp-badges-search" class="regular-text" autocomplete="off">
		<label><input type="checkbox" id="cute-wp-badges-teams-only"> <?php esc_html_e( 'Team badges only', 'cute-wp-badges' ); ?></label>
	</div>
	<?php
}

/**
 * Prints the part both tabs share: pick, order, options, preview and download.
 *
 * @param string $tab Tab slug.
 */
function cute_wp_badges_render_editor( $tab ) {
	?>
	<div id="cute-wp-badges-save-error" class="notice notice-error inline" hidden><p></p></div>

	<div id="cute-wp-badges-editor" hidden>
		<section class="cute-wp-badges-pick" aria-labelledby="cute-wp-badges-pick-title">
			<h2 id="cute-wp-badges-pick-title"><?php esc_html_e( 'Pick badges', 'cute-wp-badges' ); ?></h2>
			<p class="cute-wp-badges-actions">
				<button type="button" class="button" id="cute-wp-badges-pick-all"><?php esc_html_e( 'All', 'cute-wp-badges' ); ?></button>
				<button type="button" class="button" id="cute-wp-badges-pick-none"><?php esc_html_e( 'None', 'cute-wp-badges' ); ?></button>
			</p>
			<ul id="cute-wp-badges-picker" class="cute-wp-badges-picker"></ul>
			<p id="cute-wp-badges-picker-empty" hidden></p>
		</section>

		<div class="cute-wp-badges-panels">
			<section class="cute-wp-badges-order" aria-labelledby="cute-wp-badges-order-title">
				<h2 id="cute-wp-badges-order-title"><?php esc_html_e( 'Order', 'cute-wp-badges' ); ?></h2>
				<p class="cute-wp-badges-actions">
					<?php esc_html_e( 'Sort by:', 'cute-wp-badges' ); ?>
					<?php if ( 'profile' === $tab ) : ?>
						<button type="button" class="button button-small" data-sort="source"><?php esc_html_e( 'Profile', 'cute-wp-badges' ); ?></button>
					<?php endif; ?>
					<button type="button" class="button button-small" data-sort="name"><?php esc_html_e( 'Name', 'cute-wp-badges' ); ?></button>
					<button type="button" class="button button-small" data-sort="team"><?php esc_html_e( 'Team', 'cute-wp-badges' ); ?></button>
				</p>
				<p class="description"><?php esc_html_e( 'Drag the badges, or use the arrows, to change the order.', 'cute-wp-badges' ); ?></p>
				<ol id="cute-wp-badges-order-list" class="cute-wp-badges-order-list"></ol>
			</section>

			<section class="cute-wp-badges-output" aria-labelledby="cute-wp-badges-output-title">
				<h2 id="cute-wp-badges-output-title"><?php esc_html_e( 'Image', 'cute-wp-badges' ); ?></h2>
				<form id="cute-wp-badges-form">
					<table class="form-table" role="presentation">
						<tr data-show="grid">
							<th scope="row"><label for="cute-wp-badges-columns"><?php esc_html_e( 'Columns', 'cute-wp-badges' ); ?></label></th>
							<td><input type="number" id="cute-wp-badges-columns" name="columns" class="small-text" min="1" max="100" step="1"></td>
						</tr>
						<tr data-show="size">
							<th scope="row"><label for="cute-wp-badges-size"><?php esc_html_e( 'Badge size', 'cute-wp-badges' ); ?></label></th>
							<td>
								<input type="number" id="cute-wp-badges-size" name="size" class="small-text" min="1" max="4096" step="1">
								<?php esc_html_e( 'pixels', 'cute-wp-badges' ); ?>
							</td>
						</tr>
						<tr data-show="grid">
							<th scope="row"><label for="cute-wp-badges-gap"><?php esc_html_e( 'Gap', 'cute-wp-badges' ); ?></label></th>
							<td>
								<input type="number" id="cute-wp-badges-gap" name="gap" class="small-text" min="0" max="4096" step="1">
								<?php esc_html_e( 'pixels', 'cute-wp-badges' ); ?>
							</td>
						</tr>
						<tr>
							<th scope="row"><?php esc_html_e( 'Format', 'cute-wp-badges' ); ?></th>
							<td>
								<fieldset>
									<legend class="screen-reader-text"><?php esc_html_e( 'Format', 'cute-wp-badges' ); ?></legend>
									<label><input type="radio" name="format" value="png"> PNG</label><br>
									<label><input type="radio" name="format" value="svg"> <?php esc_html_e( 'SVG (scales to any size)', 'cute-wp-badges' ); ?></label>
								</fieldset>
							</td>
						</tr>
					</table>
				</form>

				<div class="cute-wp-badges-preview">
					<img id="cute-wp-badges-image" alt="" hidden>
				</div>
				<p id="cute-wp-badges-message" role="status"></p>
				<p><a id="cute-wp-badges-download" class="button button-primary" hidden><?php esc_html_e( 'Download', 'cute-wp-badges' ); ?></a></p>
			</section>
		</div>
	</div>
	<?php
}
