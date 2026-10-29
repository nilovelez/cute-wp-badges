<?php
/**
 * The saved state of each tab of the badge page, per WordPress user: the
 * badges picked, in order, and the output options, so the page comes back
 * as it was left.
 *
 * The page gets the state when it loads (see admin-page.php) and saves it on
 * every change through a REST route: POST /cute-wp-badges/v1/state/<tab>.
 *
 * @package Cute_WP_Badges
 */

defined( 'ABSPATH' ) || exit;

/**
 * Most badges a state can hold; the catalog has fewer.
 */
define( 'CUTE_WP_BADGES_MAX_PICKED', 200 );

/**
 * Registers the REST route.
 */
function cute_wp_badges_register_state_route() {
	$ids = array(
		'type'     => 'array',
		'items'    => array(
			'type'    => 'string',
			'pattern' => '^[a-z0-9-]+$',
		),
		'maxItems' => CUTE_WP_BADGES_MAX_PICKED,
	);

	register_rest_route(
		'cute-wp-badges/v1',
		'/state/(?P<tab>profile|any)',
		array(
			'methods'             => WP_REST_Server::CREATABLE,
			'callback'            => 'cute_wp_badges_rest_save_state',
			'permission_callback' => 'cute_wp_badges_rest_can_get_badges',
			'args'                => array(
				'tab'      => array(
					'description' => __( 'Tab of the badge page.', 'cute-wp-badges' ),
					'type'        => 'string',
					'enum'        => array( 'profile', 'any' ),
				),
				'username' => array(
					'description' => __( 'WordPress.org username, for the "My badges" tab.', 'cute-wp-badges' ),
					'type'        => 'string',
					'pattern'     => '^[a-z0-9._-]{0,60}$',
					'default'     => '',
				),
				'picked'   => array_merge(
					$ids,
					array(
						'description' => __( 'Picked badges, in order.', 'cute-wp-badges' ),
						'required'    => true,
					)
				),
				'seen'     => array_merge(
					$ids,
					array(
						'description' => __( 'Badges the profile had when the state was saved, picked or not.', 'cute-wp-badges' ),
						'default'     => array(),
					)
				),
				'columns'  => array(
					'description' => __( 'Badges per row.', 'cute-wp-badges' ),
					'type'        => 'integer',
					'minimum'     => 1,
					'maximum'     => 100,
					'required'    => true,
				),
				'size'     => array(
					'description' => __( 'Badge size, in pixels.', 'cute-wp-badges' ),
					'type'        => 'integer',
					'minimum'     => 1,
					'maximum'     => 4096,
					'required'    => true,
				),
				'gap'      => array(
					'description' => __( 'Space between badges, in pixels.', 'cute-wp-badges' ),
					'type'        => 'integer',
					'minimum'     => 0,
					'maximum'     => 4096,
					'required'    => true,
				),
				'format'   => array(
					'description' => __( 'Image format.', 'cute-wp-badges' ),
					'type'        => 'string',
					'enum'        => array( 'png', 'svg' ),
					'required'    => true,
				),
			),
		)
	);
}
add_action( 'rest_api_init', 'cute_wp_badges_register_state_route' );

/**
 * Saves the state of a tab for the current user.
 *
 * @param WP_REST_Request $request The request.
 * @return WP_REST_Response
 */
function cute_wp_badges_rest_save_state( $request ) {
	$state = array(
		'username' => 'profile' === $request['tab'] ? $request['username'] : '',
		'picked'   => cute_wp_badges_clean_badge_ids( $request['picked'] ),
		'seen'     => 'profile' === $request['tab'] ? cute_wp_badges_clean_badge_ids( $request['seen'] ) : array(),
		'columns'  => $request['columns'],
		'size'     => $request['size'],
		'gap'      => $request['gap'],
		'format'   => $request['format'],
	);

	update_user_meta( get_current_user_id(), 'cute_wp_badges_state_' . $request['tab'], $state );

	return rest_ensure_response( $state );
}

/**
 * Returns the saved state of a tab for the current user.
 *
 * @param string $tab Tab slug: "profile" or "any".
 * @return array|null The state, or null if nothing was saved yet.
 */
function cute_wp_badges_get_state( $tab ) {
	$state = get_user_meta( get_current_user_id(), 'cute_wp_badges_state_' . $tab, true );

	return is_array( $state ) ? $state : null;
}

/**
 * Keeps the ids that are badges of the catalog, as their main id, once each,
 * in the order given.
 *
 * @param array $ids Badge ids or aliases.
 * @return array Badge ids.
 */
function cute_wp_badges_clean_badge_ids( $ids ) {
	$catalog = cute_wp_badges_get_catalog_ids();
	$clean   = array();

	foreach ( $ids as $id ) {
		if ( isset( $catalog[ $id ] ) && ! in_array( $catalog[ $id ], $clean, true ) ) {
			$clean[] = $catalog[ $id ];
		}
	}

	return $clean;
}
