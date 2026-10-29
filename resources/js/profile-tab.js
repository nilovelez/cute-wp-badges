/**
 * The "My badges" tab of the badge page: loads the badges of a WordPress.org
 * profile through the plugin's REST route and offers them to the picker.
 *
 * The first time, every badge of the profile is picked, in profile order.
 * After that the saved picks and order are kept: a badge that is new on the
 * profile shows up unpicked and marked as new, and a badge gone from the
 * profile leaves the picks, with a notice.
 *
 * @package Cute_WP_Badges
 */

import { getBadge } from '@cute-wp-badges/cute-wp-badges';
import { getState, settings, strings, update } from '@cute-wp-badges/badge-store';
import { showBadges } from '@cute-wp-badges/badge-picker';
import { setSourceOrder } from '@cute-wp-badges/badge-order';
import '@cute-wp-badges/badge-output';

const form = document.getElementById( 'cute-wp-badges-profile-form' );
const usernameField = document.getElementById( 'cute-wp-badges-username' );
const status = document.getElementById( 'cute-wp-badges-profile-status' );
const unknown = document.getElementById( 'cute-wp-badges-unknown' );
const changes = document.getElementById( 'cute-wp-badges-changes' );
const refresh = document.getElementById( 'cute-wp-badges-refresh' );
const editor = document.getElementById( 'cute-wp-badges-editor' );

const USERNAME_PATTERN = /^[a-z0-9._-]{1,60}$/;

let lastRequest = 0;

/**
 * Hides the results of the previous profile.
 */
function clearResults() {
	unknown.hidden = true;
	changes.hidden = true;
	changes.replaceChildren();
	refresh.hidden = true;
	editor.hidden = true;
}

/**
 * Asks the plugin's REST route for the badges of a profile.
 *
 * @param {string}  username  WordPress.org username.
 * @param {boolean} skipCache Whether to read the profile again.
 * @return {Promise<Object>} The badge ids and the unknown badges.
 */
async function fetchBadges( username, skipCache ) {
	const url = new URL( settings.badgeUrl + encodeURIComponent( username ) );
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
 * Fills a notice with a text, a list of names and, optionally, a link.
 *
 * @param {HTMLElement} notice The notice.
 * @param {string}      text   Text.
 * @param {string[]}    names  Names to list.
 * @param {Object}      link   Optional { url, text }.
 */
function fillNotice( notice, text, names, link = null ) {
	const paragraph = document.createElement( 'p' );
	paragraph.textContent = text;

	const list = document.createElement( 'ul' );
	for ( const name of names ) {
		const item = document.createElement( 'li' );
		item.textContent = name;
		list.append( item );
	}

	notice.replaceChildren( paragraph, list );

	if ( link ) {
		const help = document.createElement( 'p' );
		const anchor = document.createElement( 'a' );
		anchor.href = link.url;
		anchor.textContent = link.text;
		help.append( anchor );
		notice.append( help );
	}

	notice.hidden = false;
}

/**
 * Returns the names of some badges.
 *
 * @param {string[]} ids Badge ids.
 * @return {Promise<string[]>} Names.
 */
async function names( ids ) {
	const badges = await Promise.all( ids.map( getBadge ) );
	return badges.map( ( badge ) => badge.name );
}

/**
 * Loads the badges of the username in the form and merges them with the
 * saved state.
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
		fillNotice(
			unknown,
			strings.unknownBadges,
			result.unknown.map( ( badge ) => badge.name || badge.id ),
			{ url: strings.updateHelpUrl, text: strings.updateHelpText }
		);
	}

	const profile = result.badges;
	const saved = getState();
	let picked = profile;
	let fresh = [];

	// The same profile as last time: keep the picks and the order.
	if ( saved.username === username && saved.seen.length ) {
		fresh = profile.filter( ( id ) => ! saved.seen.includes( id ) );
		picked = saved.picked.filter( ( id ) => profile.includes( id ) );
		const gone = saved.picked.filter( ( id ) => ! profile.includes( id ) );

		if ( fresh.length ) {
			fillNotice( changes, strings.newBadges, await names( fresh ) );
		}
		if ( gone.length ) {
			const goneNotice = document.createElement( 'div' );
			fillNotice( goneNotice, strings.goneBadges, await names( gone ) );
			changes.append( ...goneNotice.childNodes );
			changes.hidden = false;
		}
	}

	update( { username, picked, seen: profile } );

	if ( ! profile.length ) {
		status.textContent = strings.noBadges;
		return;
	}

	status.textContent = strings.badgeCount.replace( '%d', profile.length );
	setSourceOrder( profile );
	await showBadges( profile, { fresh } );

	if ( request === lastRequest ) {
		editor.hidden = false;
	}
}

form.addEventListener( 'submit', ( event ) => {
	event.preventDefault();
	load( false );
} );
form.querySelector( 'button[type="submit"]' ).disabled = false;

refresh.querySelector( 'button' ).addEventListener( 'click', () => load( true ) );

// Load the last profile right away; it usually comes from the cache.
if ( usernameField.value ) {
	load( false );
}
