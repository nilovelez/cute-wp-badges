/**
 * The "My badges" tab of the badge page: loads the badges of a WordPress.org
 * profile through the plugin's REST route and lets you pick one.
 *
 * @package Cute_WP_Badges
 */

import { getBadge, renderBadge } from '@cute-wp-badges/cute-wp-badges';
import { showBadge, hideBadge } from '@cute-wp-badges/badge-output';

const container = document.getElementById( 'cute-wp-badges-profile' );
const settings = JSON.parse( container.dataset.settings );
const strings = settings.strings;

const form = document.getElementById( 'cute-wp-badges-profile-form' );
const usernameField = document.getElementById( 'cute-wp-badges-username' );
const status = document.getElementById( 'cute-wp-badges-profile-status' );
const unknown = document.getElementById( 'cute-wp-badges-unknown' );
const picker = document.getElementById( 'cute-wp-badges-picker' );
const refresh = document.getElementById( 'cute-wp-badges-refresh' );

const USERNAME_PATTERN = /^[a-z0-9._-]{1,60}$/;
const THUMBNAIL_SIZE = 64;

let lastRequest = 0;

/**
 * Clears the results of the previous profile.
 */
function clearResults() {
	unknown.hidden = true;
	unknown.replaceChildren();
	picker.hidden = true;
	picker.replaceChildren();
	refresh.hidden = true;
	hideBadge();
}

/**
 * Asks the plugin's REST route for the badges of a profile.
 *
 * @param {string}  username    WordPress.org username.
 * @param {boolean} skipCache   Whether to read the profile again.
 * @return {Promise<Object>} The badges ids and the unknown badges.
 */
async function fetchBadges( username, skipCache ) {
	const url = new URL( settings.restUrl + encodeURIComponent( username ) );
	if ( skipCache ) {
		url.searchParams.set( 'refresh', 'true' );
	}

	const response = await fetch( url, {
		headers: { 'X-WP-Nonce': settings.nonce },
		credentials: 'same-origin',
	} );

	let body = null;
	try {
		body = await response.json();
	} catch {
		// Not JSON: handled below.
	}

	if ( ! response.ok || ! body ) {
		throw new Error( body && body.message ? body.message : strings.requestFailed );
	}

	return body;
}

/**
 * Shows the notice about badges the catalog does not know.
 *
 * @param {Array<Object>} badges Unknown badges, with id and name.
 */
function showUnknown( badges ) {
	const text = document.createElement( 'p' );
	text.textContent = strings.unknownBadges;

	const list = document.createElement( 'ul' );
	for ( const badge of badges ) {
		const item = document.createElement( 'li' );
		item.textContent = badge.name || badge.id;
		list.append( item );
	}

	const help = document.createElement( 'p' );
	const link = document.createElement( 'a' );
	link.href = strings.updateHelpUrl;
	link.textContent = strings.updateHelpText;
	help.append( link );

	unknown.replaceChildren( text, list, help );
	unknown.hidden = false;
}

/**
 * Marks a badge of the picker as the chosen one and shows it.
 *
 * @param {HTMLButtonElement} button The badge's button.
 */
function choose( button ) {
	for ( const other of picker.querySelectorAll( 'button' ) ) {
		other.setAttribute( 'aria-pressed', other === button ? 'true' : 'false' );
	}
	showBadge( button.value, button.dataset.name );
}

/**
 * Fills the picker with a button per badge, each with a small image.
 *
 * @param {Array<string>} ids Badge ids.
 */
async function showPicker( ids ) {
	for ( const id of ids ) {
		const badge = await getBadge( id );
		const svg = await renderBadge( id, { size: THUMBNAIL_SIZE } );

		const thumbnail = document.createElement( 'img' );
		thumbnail.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent( svg );
		thumbnail.alt = '';
		thumbnail.width = THUMBNAIL_SIZE;
		thumbnail.height = THUMBNAIL_SIZE;

		const label = document.createElement( 'span' );
		label.textContent = badge.name;

		const button = document.createElement( 'button' );
		button.type = 'button';
		button.value = id;
		button.dataset.name = badge.name;
		button.setAttribute( 'aria-pressed', 'false' );
		button.append( thumbnail, label );

		const item = document.createElement( 'li' );
		item.append( button );
		picker.append( item );
	}

	picker.hidden = false;
}

/**
 * Loads the badges of the username in the form.
 *
 * @param {boolean} skipCache Whether to read the profile again.
 */
async function load( skipCache ) {
	const username = usernameField.value.trim().toLowerCase();
	usernameField.value = username;

	lastRequest++;
	const request = lastRequest;
	clearResults();

	if ( ! USERNAME_PATTERN.test( username ) ) {
		status.textContent = strings.invalidName;
		return;
	}

	status.textContent = strings.loading;

	let result;
	try {
		result = await fetchBadges( username, skipCache );
	} catch ( error ) {
		if ( request === lastRequest ) {
			status.textContent = error.message;
		}
		return;
	}

	// A newer request may have finished first.
	if ( request !== lastRequest ) {
		return;
	}

	refresh.hidden = false;

	if ( result.unknown.length ) {
		showUnknown( result.unknown );
	}

	if ( ! result.badges.length ) {
		status.textContent = strings.noBadges;
		return;
	}

	status.textContent = strings.badgeCount.replace( '%d', result.badges.length );
	await showPicker( result.badges );

	if ( request === lastRequest ) {
		choose( picker.querySelector( 'button' ) );
	}
}

form.addEventListener( 'submit', ( event ) => {
	event.preventDefault();
	load( false );
} );

picker.addEventListener( 'click', ( event ) => {
	const button = event.target.closest( 'button' );
	if ( button ) {
		choose( button );
	}
} );

refresh.querySelector( 'button' ).addEventListener( 'click', () => load( true ) );

// Load the last profile right away; it usually comes from the cache.
if ( usernameField.value ) {
	load( false );
}
