<?php
/**
 * Saving badge images to the Media Library.
 *
 * PNG images are drawn in the browser and uploaded through the core route,
 * POST /wp/v2/media. WordPress does not accept SVG uploads, so SVG images
 * are only saved when an administrator turns on the site option
 * cute_wp_badges_allow_svg, and never come from the browser: the browser
 * sends the badge ids and the layout to POST /cute-wp-badges/v1/media, and
 * this file builds the SVG from the badge files the plugin ships, the same
 * way the badge library does. Other SVG uploads stay blocked.
 *
 * @package Cute_WP_Badges
 */

defined( 'ABSPATH' ) || exit;

/**
 * Registers the option that allows SVG images in the Media Library. It can be
 * changed through /wp/v2/settings, by users who can manage options.
 */
function cute_wp_badges_register_settings() {
	register_setting(
		'cute_wp_badges',
		'cute_wp_badges_allow_svg',
		array(
			'type'         => 'boolean',
			'description'  => __( 'Whether the badge page can save SVG images to the Media Library.', 'cute-wp-badges' ),
			'default'      => false,
			'show_in_rest' => true,
		)
	);
}
add_action( 'init', 'cute_wp_badges_register_settings' );

/**
 * Whether SVG images can be saved to the Media Library.
 *
 * @return bool
 */
function cute_wp_badges_svg_allowed() {
	return (bool) get_option( 'cute_wp_badges_allow_svg', false );
}

/**
 * Registers the REST route that saves an SVG image.
 */
function cute_wp_badges_register_media_route() {
	register_rest_route(
		'cute-wp-badges/v1',
		'/media',
		array(
			'methods'             => WP_REST_Server::CREATABLE,
			'callback'            => 'cute_wp_badges_rest_save_svg',
			'permission_callback' => 'cute_wp_badges_rest_can_save_svg',
			'args'                => array(
				'picked'   => array(
					'description' => __( 'Badges in the image, in order.', 'cute-wp-badges' ),
					'type'        => 'array',
					'items'       => array(
						'type'    => 'string',
						'pattern' => '^[a-z0-9-]+$',
					),
					'minItems'    => 1,
					'maxItems'    => CUTE_WP_BADGES_MAX_PICKED,
					'required'    => true,
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
				'filename' => array(
					'description' => __( 'File name, without extension.', 'cute-wp-badges' ),
					'type'        => 'string',
					'pattern'     => '^[a-z0-9._-]{1,100}$',
					'required'    => true,
				),
				'title'    => array(
					'description'       => __( 'Title of the Media Library item.', 'cute-wp-badges' ),
					'type'              => 'string',
					'default'           => '',
					'sanitize_callback' => 'sanitize_text_field',
				),
				'alt_text' => array(
					'description'       => __( 'Alternative text of the image.', 'cute-wp-badges' ),
					'type'              => 'string',
					'default'           => '',
					'sanitize_callback' => 'sanitize_text_field',
				),
			),
		)
	);
}
add_action( 'rest_api_init', 'cute_wp_badges_register_media_route' );

/**
 * Only users who can upload files can save images, and SVG images only when
 * the site allows them.
 *
 * @return bool|WP_Error
 */
function cute_wp_badges_rest_can_save_svg() {
	if ( ! current_user_can( 'upload_files' ) ) {
		return false;
	}

	if ( ! cute_wp_badges_svg_allowed() ) {
		return new WP_Error(
			'cute_wp_badges_svg_not_allowed',
			__( 'Saving SVG images to the Media Library is turned off on this site.', 'cute-wp-badges' ),
			array( 'status' => 403 )
		);
	}

	return true;
}

/**
 * Builds an SVG image and saves it to the Media Library.
 *
 * @param WP_REST_Request $request The request.
 * @return WP_REST_Response|WP_Error
 */
function cute_wp_badges_rest_save_svg( $request ) {
	$ids = cute_wp_badges_clean_badge_ids( $request['picked'] );

	if ( count( $ids ) !== count( $request['picked'] ) ) {
		return new WP_Error(
			'cute_wp_badges_unknown_badge',
			__( 'The image has a badge this version of the plugin does not know.', 'cute-wp-badges' ),
			array( 'status' => 400 )
		);
	}

	$image = cute_wp_badges_build_svg( $ids, $request['columns'], $request['size'], $request['gap'] );
	if ( is_wp_error( $image ) ) {
		return $image;
	}

	$attachment_id = cute_wp_badges_save_svg( $image, $request['filename'], $request['title'], $request['alt_text'] );
	if ( is_wp_error( $attachment_id ) ) {
		return $attachment_id;
	}

	return rest_ensure_response(
		array(
			'id'   => $attachment_id,
			'link' => get_permalink( $attachment_id ),
		)
	);
}

/**
 * Reads the composed SVG file of a badge.
 *
 * @param string $id Badge id.
 * @return string|false SVG markup, or false if the file cannot be read.
 */
function cute_wp_badges_read_badge_svg( $id ) {
	$file = plugin_dir_path( CUTE_WP_BADGES_FILE ) . 'resources/badges/' . $id . '.svg';

	if ( ! is_readable( $file ) ) {
		return false;
	}

	return file_get_contents( $file ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents -- Local file.
}

/**
 * Builds the SVG image of some badges, like the badge library does: a single
 * badge is its file as it is, and several are a grid that nests each file.
 *
 * @param string[] $ids     Badge ids, in order.
 * @param int      $columns Badges per row.
 * @param int      $size    Width and height of each badge.
 * @param int      $gap     Space between badges.
 * @return array|WP_Error The markup ('svg'), 'width' and 'height'.
 */
function cute_wp_badges_build_svg( $ids, $columns, $size, $gap ) {
	$svgs = array();
	foreach ( $ids as $id ) {
		$svg = cute_wp_badges_read_badge_svg( $id );
		if ( false === $svg ) {
			return new WP_Error(
				'cute_wp_badges_missing_file',
				/* translators: %s: badge id. */
				sprintf( __( 'The image file of the badge "%s" is missing.', 'cute-wp-badges' ), $id ),
				array( 'status' => 500 )
			);
		}
		$svgs[] = $svg;
	}

	if ( 1 === count( $svgs ) ) {
		return array(
			'svg'    => $svgs[0],
			'width'  => $size,
			'height' => $size,
		);
	}

	$used_columns = min( $columns, count( $svgs ) );
	$rows         = (int) ceil( count( $svgs ) / $used_columns );
	$width        = $used_columns * $size + ( $used_columns - 1 ) * $gap;
	$height       = $rows * $size + ( $rows - 1 ) * $gap;

	$cells = '';
	foreach ( $svgs as $index => $svg ) {
		$x = ( $index % $used_columns ) * ( $size + $gap );
		$y = intdiv( $index, $used_columns ) * ( $size + $gap );

		// The badge file, placed in its cell. Its own namespace is inherited.
		$cells .= preg_replace(
			'/^<svg\b[^>]*?(\sviewBox="[^"]*")[^>]*>/',
			'<svg x="' . $x . '" y="' . $y . '" width="' . $size . '" height="' . $size . '"$1>',
			trim( $svg )
		);
	}

	return array(
		'svg'    => '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' . $width . ' ' . $height . '">' . $cells . "</svg>\n",
		'width'  => $width,
		'height' => $height,
	);
}

/**
 * Adds SVG to the allowed file types. Only hooked while the plugin saves its
 * own SVG image.
 *
 * @param array $mimes Allowed file types.
 * @return array
 */
function cute_wp_badges_allow_svg_mime( $mimes ) {
	$mimes['svg'] = 'image/svg+xml';
	return $mimes;
}

/**
 * Writes an SVG image to the uploads folder and adds it to the Media Library.
 *
 * @param array  $image    The markup ('svg'), 'width' and 'height'.
 * @param string $filename File name, without extension.
 * @param string $title    Title of the item.
 * @param string $alt_text Alternative text.
 * @return int|WP_Error Attachment id.
 */
function cute_wp_badges_save_svg( $image, $filename, $title, $alt_text ) {
	add_filter( 'upload_mimes', 'cute_wp_badges_allow_svg_mime' );
	$upload = wp_upload_bits( $filename . '.svg', null, $image['svg'] );
	remove_filter( 'upload_mimes', 'cute_wp_badges_allow_svg_mime' );

	if ( ! empty( $upload['error'] ) ) {
		return new WP_Error( 'cute_wp_badges_upload_failed', $upload['error'], array( 'status' => 500 ) );
	}

	$attachment_id = wp_insert_attachment(
		array(
			'guid'           => $upload['url'],
			'post_mime_type' => 'image/svg+xml',
			'post_title'     => '' !== $title ? $title : $filename,
			'post_content'   => '',
			'post_status'    => 'inherit',
		),
		$upload['file'],
		0,
		true
	);

	if ( is_wp_error( $attachment_id ) ) {
		wp_delete_file( $upload['file'] );
		return $attachment_id;
	}

	wp_update_attachment_metadata(
		$attachment_id,
		array(
			'width'    => $image['width'],
			'height'   => $image['height'],
			'file'     => _wp_relative_upload_path( $upload['file'] ),
			'filesize' => strlen( $image['svg'] ),
		)
	);

	if ( '' !== $alt_text ) {
		update_post_meta( $attachment_id, '_wp_attachment_image_alt', $alt_text );
	}

	return $attachment_id;
}
