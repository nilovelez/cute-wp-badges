/**
 * The part of the badge page both tabs share: draws the chosen badge with the
 * badge library at the chosen size and format, shows it and offers it for
 * download.
 *
 * @package Cute_WP_Badges
 */

import { renderBadge } from '@cute-wp-badges/cute-wp-badges';

const output = document.getElementById( 'cute-wp-badges-output' );
const form = document.getElementById( 'cute-wp-badges-form' );
const image = document.getElementById( 'cute-wp-badges-image' );
const message = document.getElementById( 'cute-wp-badges-message' );
const download = document.getElementById( 'cute-wp-badges-download' );

let badgeId = null;
let badgeName = '';
let imageUrl = null;
let lastRequest = 0;

/**
 * Draws the current badge and updates the preview and the download link.
 */
async function update() {
	if ( ! badgeId ) {
		return;
	}

	lastRequest++;
	const request = lastRequest;
	const id = badgeId;
	const size = Number( form.elements.size.value );
	const format = form.elements.format.value;

	let blob;
	try {
		const result = await renderBadge( id, { format, size } );
		blob = format === 'svg' ? new Blob( [ result ], { type: 'image/svg+xml' } ) : result;
	} catch ( error ) {
		if ( request === lastRequest ) {
			image.hidden = true;
			download.hidden = true;
			message.textContent = error.message;
		}
		return;
	}

	// A newer change may have finished first.
	if ( request !== lastRequest ) {
		return;
	}

	if ( imageUrl ) {
		URL.revokeObjectURL( imageUrl );
	}
	imageUrl = URL.createObjectURL( blob );

	image.src = imageUrl;
	image.alt = badgeName;
	image.hidden = false;
	download.href = imageUrl;
	download.download = `${ id }-${ size }.${ format }`;
	download.hidden = false;
	message.textContent = '';
}

/**
 * Shows the size, format, preview and download for a badge.
 *
 * @param {string} id   Badge id.
 * @param {string} name Badge name, for the preview's alternative text.
 */
export function showBadge( id, name ) {
	badgeId = id;
	badgeName = name;
	output.hidden = false;
	update();
}

/**
 * Hides the size, format, preview and download.
 */
export function hideBadge() {
	badgeId = null;
	output.hidden = true;
}

form.addEventListener( 'input', update );
form.addEventListener( 'submit', ( event ) => event.preventDefault() );
