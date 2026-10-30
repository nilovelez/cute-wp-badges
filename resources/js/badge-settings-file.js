/**
 * Exporting and importing the design of the badge page: the picked badges,
 * in order, and the image options, in a small JSON file, to restore a design
 * later or on another site.
 *
 * The file looks like this:
 *
 *     {
 *         "plugin": "cute-wp-badges",
 *         "version": 1,
 *         "badges": [ "core-contributor", "polyglots-team" ],
 *         "columns": 5,
 *         "size": 128,
 *         "gap": 32,
 *         "format": "png"
 *     }
 *
 * In "My badges", the badges that are not on the loaded profile are left out.
 *
 * @package Cute_WP_Badges
 */

import { getBadge } from '@cute-wp-badges/cute-wp-badges';
import { getState, settings, strings, update } from '@cute-wp-badges/badge-store';
import { fillForm } from '@cute-wp-badges/badge-output';

const exportButton = document.getElementById( 'cute-wp-badges-export' );
const importButton = document.getElementById( 'cute-wp-badges-import' );
const fileField = document.getElementById( 'cute-wp-badges-import-file' );
const status = document.getElementById( 'cute-wp-badges-file-status' );

const PLUGIN = 'cute-wp-badges';
const VERSION = 1;
const LIMITS = {
	columns: [ 1, 100 ],
	size: [ 1, 4096 ],
	gap: [ 0, 4096 ],
};

/**
 * Returns today's date as yyyymmdd.
 *
 * @return {string} Date.
 */
function today() {
	const now = new Date();
	const month = String( now.getMonth() + 1 ).padStart( 2, '0' );
	const day = String( now.getDate() ).padStart( 2, '0' );
	return `${ now.getFullYear() }${ month }${ day }`;
}

/**
 * Adds a message below the buttons, with an optional list of names.
 *
 * @param {string}   text  Message.
 * @param {string[]} names Names to list.
 */
function addMessage( text, names = [] ) {
	const paragraph = document.createElement( 'p' );
	paragraph.textContent = text;
	status.append( paragraph );

	if ( names.length ) {
		const list = document.createElement( 'ul' );
		for ( const name of names ) {
			const item = document.createElement( 'li' );
			item.textContent = name;
			list.append( item );
		}
		status.append( list );
	}
}

/**
 * Checks a settings file and returns its design.
 *
 * @param {string} text File contents.
 * @return {Object|null} The design, or null if the file is not valid.
 */
function parse( text ) {
	let data;
	try {
		data = JSON.parse( text );
	} catch {
		return null;
	}

	if ( ! data || data.plugin !== PLUGIN || data.version !== VERSION || ! Array.isArray( data.badges ) ) {
		return null;
	}
	for ( const [ name, [ min, max ] ] of Object.entries( LIMITS ) ) {
		if ( ! Number.isInteger( data[ name ] ) || data[ name ] < min || data[ name ] > max ) {
			return null;
		}
	}
	if ( data.format !== 'png' && data.format !== 'svg' ) {
		return null;
	}
	if ( ! data.badges.every( ( id ) => typeof id === 'string' ) ) {
		return null;
	}

	return data;
}

/**
 * Applies the design in a settings file.
 *
 * @param {File} file The file.
 */
async function importFile( file ) {
	status.replaceChildren();
	const data = parse( await file.text() );
	if ( ! data ) {
		addMessage( strings.importInvalid );
		return;
	}

	const picked = [];
	const notHere = [];
	let unknown = false;
	for ( const id of data.badges ) {
		const badge = await getBadge( id );
		if ( ! badge ) {
			unknown = true;
		} else if ( settings.tab === 'profile' && ! getState().seen.includes( badge.id ) ) {
			notHere.push( badge.name );
		} else if ( ! picked.includes( badge.id ) ) {
			picked.push( badge.id );
		}
	}

	update( {
		picked,
		columns: data.columns,
		size: data.size,
		gap: data.gap,
		format: data.format,
	} );
	fillForm();

	addMessage( strings.importDone );
	if ( unknown ) {
		addMessage( strings.importUnknown );
	}
	if ( notHere.length ) {
		addMessage( strings.importNotHere, notHere );
	}
}

exportButton.addEventListener( 'click', () => {
	const state = getState();
	const data = {
		plugin: PLUGIN,
		version: VERSION,
		badges: state.picked,
		columns: state.columns,
		size: state.size,
		gap: state.gap,
		format: state.format,
	};
	const url = URL.createObjectURL( new Blob( [ JSON.stringify( data, null, '\t' ) + '\n' ], { type: 'application/json' } ) );

	const link = document.createElement( 'a' );
	link.href = url;
	link.download = `${ PLUGIN }-${ today() }.json`;
	link.click();
	setTimeout( () => URL.revokeObjectURL( url ), 1000 );
	status.replaceChildren();
} );

importButton.addEventListener( 'click', () => fileField.click() );

fileField.addEventListener( 'change', async () => {
	const file = fileField.files[ 0 ];
	// The same file can be picked again.
	fileField.value = '';
	if ( file ) {
		await importFile( file );
	}
} );
