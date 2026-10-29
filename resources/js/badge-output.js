/**
 * The image of the badge page: the output options (columns, badge size, gap
 * and format), a live preview and the download. One picked badge gives that
 * badge alone; several give a grid.
 *
 * @package Cute_WP_Badges
 */

import { renderBadge, renderGrid } from '@cute-wp-badges/cute-wp-badges';
import { getState, strings, subscribe, update } from '@cute-wp-badges/badge-store';

const form = document.getElementById( 'cute-wp-badges-form' );
const image = document.getElementById( 'cute-wp-badges-image' );
const message = document.getElementById( 'cute-wp-badges-message' );
const download = document.getElementById( 'cute-wp-badges-download' );
const NUMBERS = [ 'columns', 'size', 'gap' ];

let imageUrl = null;
let lastRequest = 0;

/**
 * Returns the size of the image, in pixels, as the library lays it out.
 *
 * @param {Object} state The state.
 * @return {number[]} Width and height.
 */
function imageSize( state ) {
	const count = state.picked.length;
	const columns = Math.min( state.columns, count );
	const rows = Math.ceil( count / columns );
	return [
		columns * state.size + ( columns - 1 ) * state.gap,
		rows * state.size + ( rows - 1 ) * state.gap,
	];
}

/**
 * Returns the file name for the download, without extension.
 *
 * @param {Object} state The state.
 * @return {string} File name.
 */
function fileName( state ) {
	if ( state.picked.length === 1 ) {
		return state.picked[ 0 ];
	}
	return state.username ? `${ state.username }-wordpress-badges` : 'wordpress-badges';
}

/**
 * Shows the fields that apply: columns and gap only for a grid, and the
 * size except for a single SVG badge, which has no size.
 *
 * @param {Object} state The state.
 */
function showFields( state ) {
	const isGrid = state.picked.length > 1;
	for ( const row of form.querySelectorAll( '[data-show="grid"]' ) ) {
		row.hidden = ! isGrid;
	}
	form.querySelector( '[data-show="size"]' ).hidden = ! isGrid && state.format === 'svg';
}

/**
 * Hides the image and the download, with a message.
 *
 * @param {string} text Message.
 */
function hideImage( text ) {
	image.hidden = true;
	download.hidden = true;
	message.textContent = text;
}

/**
 * Draws the image from the state and updates the preview and the download.
 */
async function render() {
	const state = getState();
	showFields( state );

	lastRequest++;
	const request = lastRequest;

	if ( state.picked.length === 0 ) {
		hideImage( strings.pickSome );
		return;
	}

	const { format, size } = state;
	let result;
	try {
		result =
			state.picked.length === 1
				? await renderBadge( state.picked[ 0 ], { format, size } )
				: await renderGrid( state.picked, { columns: state.columns, size, gap: state.gap, format } );
	} catch ( error ) {
		if ( request === lastRequest ) {
			hideImage( error.message );
		}
		return;
	}

	// A newer change may have finished first.
	if ( request !== lastRequest ) {
		return;
	}

	const blob = format === 'svg' ? new Blob( [ result ], { type: 'image/svg+xml' } ) : result;
	const [ width, height ] = imageSize( state );

	if ( imageUrl ) {
		URL.revokeObjectURL( imageUrl );
	}
	imageUrl = URL.createObjectURL( blob );

	image.src = imageUrl;
	image.width = width;
	image.height = height;
	image.hidden = false;
	download.href = imageUrl;
	download.download = format === 'png' ? `${ fileName( state ) }-${ width }x${ height }.png` : `${ fileName( state ) }.svg`;
	download.hidden = false;
	message.textContent =
		format === 'png' ? strings.imageSize.replace( '%1$d', width ).replace( '%2$d', height ) : '';
}

/**
 * Puts the state into the form fields.
 */
function fillForm() {
	const state = getState();
	for ( const name of NUMBERS ) {
		form.elements[ name ].value = state[ name ];
	}
	form.elements.format.value = state.format;
}

form.addEventListener( 'input', ( event ) => {
	const field = event.target;
	if ( field.name === 'format' ) {
		update( { format: field.value } );
		return;
	}
	if ( ! NUMBERS.includes( field.name ) ) {
		return;
	}
	if ( field.value === '' || ! field.checkValidity() ) {
		hideImage( field.validationMessage || field.labels[ 0 ].textContent );
		return;
	}
	update( { [ field.name ]: Number( field.value ) } );
} );
form.addEventListener( 'submit', ( event ) => event.preventDefault() );

fillForm();
subscribe( render );
render();
