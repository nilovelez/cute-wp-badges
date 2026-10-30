/**
 * Saving the image of the badge page to the Media Library.
 *
 * A PNG image is uploaded as it is drawn, through the core route
 * /wp/v2/media. An SVG image is built on the server from the badge files of
 * the plugin, through the plugin's route /cute-wp-badges/v1/media, only when
 * the site allows SVG images (an option administrators can change here).
 *
 * @package Cute_WP_Badges
 */

import { getBadge } from '@cute-wp-badges/cute-wp-badges';
import { getState, settings, strings } from '@cute-wp-badges/badge-store';
import { onImage } from '@cute-wp-badges/badge-output';

const button = document.getElementById( 'cute-wp-badges-save-media' );
const status = document.getElementById( 'cute-wp-badges-media-status' );
const allowSvg = document.getElementById( 'cute-wp-badges-allow-svg' );

let image = null;
let svgAllowed = settings.media.allowSvg;

/**
 * Shows the save button for the current image, or a message when the image
 * cannot be saved.
 */
function showButton() {
	button.hidden = ! image;
	button.disabled = Boolean( image ) && image.format === 'svg' && ! svgAllowed;
	if ( button.disabled && ! allowSvg ) {
		status.textContent = strings.svgOff;
	} else if ( status.textContent === strings.svgOff ) {
		status.textContent = '';
	}
}

/**
 * Returns the title and the alternative text of the image.
 *
 * @param {Object} state The state.
 * @return {Promise<Object>} { title, altText }.
 */
async function describe( state ) {
	const badges = await Promise.all( state.picked.map( getBadge ) );
	const names = badges.map( ( badge ) => badge.name );

	let title = names[ 0 ];
	if ( names.length > 1 ) {
		title = state.username ? strings.userImageTitle.replace( '%s', state.username ) : strings.imageTitle;
	}

	return { title, altText: names.join( ', ' ) };
}

/**
 * Sends the image to the Media Library.
 *
 * @param {Object} current The image, as badge-output announces it.
 * @return {Promise<Object>} The response of the REST route: at least the id.
 */
async function upload( current ) {
	const state = getState();
	const { title, altText } = await describe( state );
	let response;

	if ( current.format === 'png' ) {
		const url = new URL( settings.media.pngUrl );
		url.searchParams.set( 'title', title );
		url.searchParams.set( 'alt_text', altText );
		response = await fetch( url, {
			method: 'POST',
			headers: {
				'Content-Type': 'image/png',
				'Content-Disposition': `attachment; filename="${ current.name }.png"`,
				'X-WP-Nonce': settings.nonce,
			},
			credentials: 'same-origin',
			body: current.blob,
		} );
	} else {
		response = await fetch( settings.media.svgUrl, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json', 'X-WP-Nonce': settings.nonce },
			credentials: 'same-origin',
			body: JSON.stringify( {
				picked: state.picked,
				columns: state.columns,
				size: state.size,
				gap: state.gap,
				filename: current.name,
				title,
				alt_text: altText,
			} ),
		} );
	}

	let body = null;
	try {
		body = await response.json();
	} catch {
		// Not JSON: handled below.
	}

	if ( ! response.ok || ! body || ! body.id ) {
		throw new Error( body && body.message ? body.message : strings.mediaFailed );
	}

	return body;
}

button.addEventListener( 'click', async () => {
	const current = image;
	button.disabled = true;
	status.textContent = strings.mediaSaving;

	try {
		const item = await upload( current );
		const link = document.createElement( 'a' );
		link.href = settings.media.editUrl + item.id;
		link.textContent = strings.mediaEdit;
		status.replaceChildren( strings.mediaSaved + ' ', link );
	} catch ( error ) {
		status.textContent = error.message;
	}

	showButton();
} );

onImage( ( current ) => {
	image = current;
	// A saved notice belongs to the previous image.
	if ( status.querySelector( 'a' ) ) {
		status.replaceChildren();
	}
	showButton();
} );

if ( allowSvg ) {
	allowSvg.addEventListener( 'change', async () => {
		const wanted = allowSvg.checked;
		allowSvg.disabled = true;
		let ok = false;
		try {
			const response = await fetch( settings.media.settingsUrl, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json', 'X-WP-Nonce': settings.nonce },
				credentials: 'same-origin',
				body: JSON.stringify( { cute_wp_badges_allow_svg: wanted } ),
			} );
			ok = response.ok;
		} catch {
			// Network error: handled below.
		}

		allowSvg.disabled = false;
		if ( ok ) {
			svgAllowed = wanted;
		} else {
			allowSvg.checked = ! wanted;
			status.textContent = strings.optionFailed;
		}
		showButton();
	} );
}
