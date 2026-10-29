<?php
/**
 * Loads a user's badges from their WordPress.org profile.
 *
 * WordPress.org has no public API for badges, so the plugin reads the groups
 * tab of the profile on the server (see docs/wporg-profile-api.md) and serves
 * the result through a REST route: GET /cute-wp-badges/v1/badges/<username>.
 *
 * @package Cute_WP_Badges
 */

defined( 'ABSPATH' ) || exit;

/**
 * How long a profile stays cached, in seconds.
 */
define( 'CUTE_WP_BADGES_PROFILE_CACHE', 12 * HOUR_IN_SECONDS );

/**
 * Registers the REST route.
 */
function cute_wp_badges_register_rest_routes() {
	register_rest_route(
		'cute-wp-badges/v1',
		'/badges/(?P<username>[a-z0-9._-]{1,60})',
		array(
			'methods'             => WP_REST_Server::READABLE,
			'callback'            => 'cute_wp_badges_rest_get_badges',
			'permission_callback' => 'cute_wp_badges_rest_can_get_badges',
			'args'                => array(
				'username' => array(
					'description' => __( 'WordPress.org username, as in the profile URL.', 'cute-wp-badges' ),
					'type'        => 'string',
				),
				'refresh'  => array(
					'description' => __( 'Read the profile again instead of using the cached copy.', 'cute-wp-badges' ),
					'type'        => 'boolean',
					'default'     => false,
				),
			),
		)
	);
}
add_action( 'rest_api_init', 'cute_wp_badges_register_rest_routes' );

/**
 * Only users who can use the badge page can load profiles.
 *
 * @return bool
 */
function cute_wp_badges_rest_can_get_badges() {
	return current_user_can( 'upload_files' );
}

/**
 * Returns the badges of a WordPress.org user.
 *
 * The response lists the badges the catalog knows, by id, in profile order,
 * and apart the ones it does not know, which mean the catalog needs updating.
 *
 * @param WP_REST_Request $request The request.
 * @return WP_REST_Response|WP_Error
 */
function cute_wp_badges_rest_get_badges( $request ) {
	$username     = $request['username'];
	$associations = cute_wp_badges_get_profile_associations( $username, $request['refresh'] );

	if ( is_wp_error( $associations ) ) {
		return $associations;
	}

	$catalog = cute_wp_badges_get_catalog_ids();
	$badges  = array();
	$unknown = array();

	foreach ( $associations as $association ) {
		$slug = $association['id'];

		if ( isset( $catalog[ $slug ] ) ) {
			$id = $catalog[ $slug ];
			if ( ! in_array( $id, $badges, true ) ) {
				$badges[] = $id;
			}
		} else {
			$unknown[] = $association;
		}
	}

	return rest_ensure_response(
		array(
			'username' => $username,
			'badges'   => $badges,
			'unknown'  => $unknown,
		)
	);
}

/**
 * Returns the associations (badges) listed on a user's profile, cached.
 *
 * @param string $username WordPress.org username.
 * @param bool   $refresh  Whether to skip the cache.
 * @return array|WP_Error List of arrays with 'id' (association slug) and 'name'.
 */
function cute_wp_badges_get_profile_associations( $username, $refresh = false ) {
	$cache_key = 'cute_wp_badges_profile_' . md5( $username );

	if ( ! $refresh ) {
		$cached = get_transient( $cache_key );
		if ( is_array( $cached ) ) {
			return $cached;
		}
	}

	$associations = cute_wp_badges_fetch_profile_associations( $username );

	// Errors are not cached, so the next try reads the profile again.
	if ( ! is_wp_error( $associations ) ) {
		set_transient( $cache_key, $associations, CUTE_WP_BADGES_PROFILE_CACHE );
	}

	return $associations;
}

/**
 * Reads the groups tab of a profile on WordPress.org.
 *
 * @param string $username WordPress.org username.
 * @return array|WP_Error List of arrays with 'id' (association slug) and 'name'.
 */
function cute_wp_badges_fetch_profile_associations( $username ) {
	$url      = 'https://profiles.wordpress.org/' . rawurlencode( $username ) . '/groups/?num=100';
	$response = wp_safe_remote_get( $url, array( 'timeout' => 15 ) );

	if ( is_wp_error( $response ) ) {
		return new WP_Error(
			'cute_wp_badges_unreachable',
			__( 'Could not reach WordPress.org. Try again later.', 'cute-wp-badges' ),
			array( 'status' => 502 )
		);
	}

	$code = wp_remote_retrieve_response_code( $response );

	if ( 404 === $code ) {
		return new WP_Error(
			'cute_wp_badges_no_user',
			__( 'There is no WordPress.org user with that username.', 'cute-wp-badges' ),
			array( 'status' => 404 )
		);
	}

	if ( 200 !== $code ) {
		return new WP_Error(
			'cute_wp_badges_unreachable',
			__( 'Could not reach WordPress.org. Try again later.', 'cute-wp-badges' ),
			array( 'status' => 502 )
		);
	}

	return cute_wp_badges_parse_profile_associations( wp_remote_retrieve_body( $response ) );
}

/**
 * Extracts the associations from the HTML of a profile's groups tab.
 *
 * Each association is a link to /associations/<slug>/ inside an item-title.
 * A profile with no badges has the groups section but no list.
 *
 * @param string $html The page.
 * @return array|WP_Error List of arrays with 'id' (association slug) and 'name'.
 */
function cute_wp_badges_parse_profile_associations( $html ) {
	if ( false === strpos( $html, 'id="groups-list"' ) ) {
		if ( false !== strpos( $html, 'class="groups mygroups"' ) ) {
			return array();
		}

		return new WP_Error(
			'cute_wp_badges_unexpected_page',
			__( 'The WordPress.org profile page has changed and the plugin cannot read it. Update the plugin.', 'cute-wp-badges' ),
			array( 'status' => 502 )
		);
	}

	preg_match_all(
		'#class="item-title">\s*<a href="https://profiles\.wordpress\.org/associations/([a-z0-9-]+)/"[^>]*>(.*?)</a>#s',
		$html,
		$matches,
		PREG_SET_ORDER
	);

	$associations = array();
	foreach ( $matches as $match ) {
		$associations[] = array(
			'id'   => $match[1],
			'name' => trim( html_entity_decode( wp_strip_all_tags( $match[2] ), ENT_QUOTES, 'UTF-8' ) ),
		);
	}

	return $associations;
}

/**
 * Maps every badge id and alias in the catalog to its badge id.
 *
 * @return array Association slug => badge id.
 */
function cute_wp_badges_get_catalog_ids() {
	static $ids = null;

	if ( null !== $ids ) {
		return $ids;
	}

	$ids  = array();
	$json = file_get_contents( plugin_dir_path( CUTE_WP_BADGES_FILE ) . 'data/badges.json' ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents -- Local file.
	$data = json_decode( (string) $json, true );

	if ( ! is_array( $data ) || empty( $data['badges'] ) ) {
		return $ids;
	}

	foreach ( $data['badges'] as $badge ) {
		$ids[ $badge['id'] ] = $badge['id'];
		foreach ( $badge['aliases'] as $alias ) {
			$ids[ $alias ] = $badge['id'];
		}
	}

	return $ids;
}
