/**
 * The "My WordPress.org Badges" admin page: draws the chosen badge with the
 * badge library, shows it and offers it for download.
 *
 * @package Cute_WP_Badges
 */

import { getBadges, renderBadge } from '@cute-wp-badges/cute-wp-badges';

const form = document.getElementById( 'cute-wp-badges-form' );
const badgeField = document.getElementById( 'cute-wp-badges-badge' );
const image = document.getElementById( 'cute-wp-badges-image' );
const message = document.getElementById( 'cute-wp-badges-message' );
const download = document.getElementById( 'cute-wp-badges-download' );

let imageUrl = null;
let lastRequest = 0;

/**
 * Fills the badge selector with every badge in the catalog, by name.
 */
async function fillBadges() {
	const badges = [ ...( await getBadges() ) ];
	badges.sort( ( a, b ) => a.name.localeCompare( b.name ) );
	for ( const badge of badges ) {
		badgeField.add( new Option( badge.name, badge.id ) );
	}
}

/**
 * Draws the badge chosen in the form and updates the preview and the download link.
 */
async function update() {
	lastRequest++;
	const request = lastRequest;
	const id = badgeField.value;
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
	image.alt = badgeField.selectedOptions[ 0 ].text;
	image.hidden = false;
	download.href = imageUrl;
	download.download = `${ id }-${ size }.${ format }`;
	download.hidden = false;
	message.textContent = '';
}

form.addEventListener( 'input', update );
form.addEventListener( 'submit', ( event ) => event.preventDefault() );

await fillBadges();
await update();
