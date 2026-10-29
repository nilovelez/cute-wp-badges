/**
 * The state of the current tab of the badge page: the badges picked, in
 * order, and the output options. Every module of the page reads it here and
 * changes it with update(); every change is saved for the current user
 * through the plugin's REST route, so the page comes back as it was left.
 *
 * It also holds the page settings printed by PHP (REST URLs, nonce, saved
 * state and interface strings).
 *
 * @package Cute_WP_Badges
 */

const app = document.getElementById( 'cute-wp-badges-app' );

export const settings = JSON.parse( app.dataset.settings );
export const strings = settings.strings;

/**
 * Whether this tab had a saved state when the page loaded.
 */
export const hasSavedState = settings.state !== null;

const DEFAULTS = {
	username: '',
	picked: [],
	seen: [],
	columns: 5,
	size: 128,
	gap: 32,
	format: 'png',
};
const SAVE_DELAY = 500;

let state = { ...DEFAULTS, ...( settings.state || {} ) };
const listeners = new Set();
let saveTimer = null;

const saveError = document.getElementById( 'cute-wp-badges-save-error' );

/**
 * Returns the current state.
 *
 * @return {Object} State: username, picked, seen, columns, size, gap, format.
 */
export function getState() {
	return state;
}

/**
 * Calls a function after every change of the state.
 *
 * @param {Function} listener Receives the new state.
 */
export function subscribe( listener ) {
	listeners.add( listener );
}

/**
 * Changes the state, tells every listener and saves it shortly after.
 *
 * @param {Object} changes Fields to change.
 */
export function update( changes ) {
	state = { ...state, ...changes };
	for ( const listener of listeners ) {
		listener( state );
	}
	clearTimeout( saveTimer );
	saveTimer = setTimeout( save, SAVE_DELAY );
}

/**
 * Saves the state for the current user.
 *
 * @param {boolean} keepalive Whether the request has to outlive the page.
 */
async function save( keepalive = false ) {
	saveTimer = null;
	let ok = false;
	try {
		const response = await fetch( settings.stateUrl, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json', 'X-WP-Nonce': settings.nonce },
			credentials: 'same-origin',
			body: JSON.stringify( state ),
			keepalive,
		} );
		ok = response.ok;
	} catch {
		// Network error: handled below.
	}

	saveError.querySelector( 'p' ).textContent = strings.saveFailed;
	saveError.hidden = ok;
}

// A change made just before leaving the page is still saved.
window.addEventListener( 'pagehide', () => {
	if ( saveTimer ) {
		clearTimeout( saveTimer );
		save( true );
	}
} );
