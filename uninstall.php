<?php
/**
 * Removes what the plugin stores when it is deleted: the option that allows
 * SVG images, the saved state of the badge page of every user and the cached
 * WordPress.org profiles. The images saved to the Media Library stay.
 *
 * @package Cute_WP_Badges
 */

defined( 'WP_UNINSTALL_PLUGIN' ) || exit;

/**
 * Removes the data of the plugin on the current site.
 */
function cute_wp_badges_uninstall_site() {
	global $wpdb;

	delete_option( 'cute_wp_badges_allow_svg' );

	// The profile cache: one transient per username, named after its hash.
	// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching -- Transient names are not known in advance; runs once.
	$wpdb->query(
		$wpdb->prepare(
			"DELETE FROM {$wpdb->options} WHERE option_name LIKE %s OR option_name LIKE %s",
			$wpdb->esc_like( '_transient_cute_wp_badges_profile_' ) . '%',
			$wpdb->esc_like( '_transient_timeout_cute_wp_badges_profile_' ) . '%'
		)
	);
}

if ( is_multisite() ) {
	foreach ( get_sites( array( 'fields' => 'ids' ) ) as $cute_wp_badges_site_id ) {
		switch_to_blog( $cute_wp_badges_site_id );
		cute_wp_badges_uninstall_site();
		restore_current_blog();
	}
} else {
	cute_wp_badges_uninstall_site();
}

// User meta is shared by every site of a network.
delete_metadata( 'user', 0, 'cute_wp_badges_state_profile', '', true );
delete_metadata( 'user', 0, 'cute_wp_badges_state_any', '', true );
