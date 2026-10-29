/**
 * The badge picker of the badge page: a button with a small image per badge,
 * which picks or unpicks it, plus "All" and "None". Picking a badge adds it
 * at the end of the order.
 *
 * @package Cute_WP_Badges
 */

import { getBadges, renderBadge } from '@cute-wp-badges/cute-wp-badges';
import { getState, strings, subscribe, update } from '@cute-wp-badges/badge-store';

const THUMBNAIL_SIZE = 64;

const list = document.getElementById( 'cute-wp-badges-picker' );
const empty = document.getElementById( 'cute-wp-badges-picker-empty' );
const catalog = new Map( ( await getBadges() ).map( ( badge ) => [ badge.id, badge ] ) );

// The picker items, built once per badge and reused.
const items = new Map();
let shown = [];

/**
 * Returns the picker item of a badge, building it the first time.
 *
 * @param {string} id Badge id.
 * @return {Promise<HTMLLIElement>} The item.
 */
async function getItem( id ) {
	if ( items.has( id ) ) {
		return items.get( id );
	}

	const badge = catalog.get( id );

	const thumbnail = document.createElement( 'img' );
	thumbnail.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent( await renderBadge( id ) );
	thumbnail.alt = '';
	thumbnail.width = THUMBNAIL_SIZE;
	thumbnail.height = THUMBNAIL_SIZE;

	const label = document.createElement( 'span' );
	label.textContent = badge.name;

	const tag = document.createElement( 'span' );
	tag.className = 'cute-wp-badges-new-tag';
	tag.textContent = strings.newLabel;
	tag.hidden = true;

	const button = document.createElement( 'button' );
	button.type = 'button';
	button.value = id;
	button.append( thumbnail, label, tag );

	const item = document.createElement( 'li' );
	item.append( button );
	items.set( id, item );
	return item;
}

/**
 * Marks the picked badges.
 */
function refresh() {
	const picked = new Set( getState().picked );
	for ( const [ id, item ] of items ) {
		item.querySelector( 'button' ).setAttribute( 'aria-pressed', picked.has( id ) ? 'true' : 'false' );
	}
}

/**
 * Shows these badges in the picker, in this order.
 *
 * @param {string[]} ids             Badge ids.
 * @param {Object}   options         Options.
 * @param {string[]} options.fresh   Badges to mark as new.
 * @param {string}   options.message What to say when there are none.
 */
export async function showBadges( ids, { fresh = [], message = '' } = {} ) {
	shown = ids;
	const built = await Promise.all( ids.map( getItem ) );

	// A newer call may have finished first.
	if ( shown !== ids ) {
		return;
	}

	for ( const [ id, item ] of items ) {
		item.querySelector( '.cute-wp-badges-new-tag' ).hidden = ! fresh.includes( id );
		item.classList.toggle( 'is-new', fresh.includes( id ) );
	}
	list.replaceChildren( ...built );
	empty.textContent = message;
	empty.hidden = ids.length > 0;
	refresh();
}

list.addEventListener( 'click', ( event ) => {
	const button = event.target.closest( 'button' );
	if ( ! button ) {
		return;
	}
	const picked = getState().picked;
	if ( picked.includes( button.value ) ) {
		update( { picked: picked.filter( ( id ) => id !== button.value ) } );
	} else {
		update( { picked: [ ...picked, button.value ] } );
	}
} );

document.getElementById( 'cute-wp-badges-pick-all' ).addEventListener( 'click', () => {
	const picked = getState().picked;
	update( { picked: [ ...picked, ...shown.filter( ( id ) => ! picked.includes( id ) ) ] } );
} );

document.getElementById( 'cute-wp-badges-pick-none' ).addEventListener( 'click', () => {
	update( { picked: getState().picked.filter( ( id ) => ! shown.includes( id ) ) } );
} );

subscribe( refresh );
