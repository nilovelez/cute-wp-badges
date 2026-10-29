/**
 * The order of the picked badges on the badge page: a list to reorder by
 * dragging or with arrow buttons, a button to take a badge out, and
 * shortcuts to sort by profile order, name or team.
 *
 * @package Cute_WP_Badges
 */

import { getBadges, renderBadge } from '@cute-wp-badges/cute-wp-badges';
import { getState, strings, subscribe, update } from '@cute-wp-badges/badge-store';

const THUMBNAIL_SIZE = 32;

const list = document.getElementById( 'cute-wp-badges-order-list' );
const catalog = new Map( ( await getBadges() ).map( ( badge ) => [ badge.id, badge ] ) );

let sourceOrder = [];
let dragged = null;
// After a click on an arrow or remove button, where to put the focus back.
let focusAfterRender = null;

/**
 * Sets the order of the source (the profile), for the "Profile" shortcut.
 *
 * @param {string[]} ids Badge ids.
 */
export function setSourceOrder( ids ) {
	sourceOrder = ids;
}

/**
 * Builds an icon button for a list item.
 *
 * @param {string} action   What it does: up, down or remove.
 * @param {string} symbol   What it shows.
 * @param {string} template Accessible label, with %s for the badge name.
 * @param {Object} badge    The badge.
 * @return {HTMLButtonElement} The button.
 */
function actionButton( action, symbol, template, badge ) {
	const button = document.createElement( 'button' );
	button.type = 'button';
	button.className = 'button button-small';
	button.dataset.action = action;
	button.setAttribute( 'aria-label', template.replace( '%s', badge.name ) );
	button.textContent = symbol;
	return button;
}

/**
 * Draws the list from the state.
 */
async function render() {
	const picked = getState().picked;
	const thumbnails = await Promise.all( picked.map( ( id ) => renderBadge( id ) ) );

	// A newer change may have been drawn already.
	if ( picked !== getState().picked ) {
		return;
	}

	const items = picked.map( ( id, index ) => {
		const badge = catalog.get( id );

		const handle = document.createElement( 'span' );
		handle.className = 'cute-wp-badges-handle';
		handle.setAttribute( 'aria-hidden', 'true' );
		handle.textContent = '⠿';

		const thumbnail = document.createElement( 'img' );
		thumbnail.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent( thumbnails[ index ] );
		thumbnail.alt = '';
		thumbnail.width = THUMBNAIL_SIZE;
		thumbnail.height = THUMBNAIL_SIZE;

		const name = document.createElement( 'span' );
		name.className = 'cute-wp-badges-name';
		name.textContent = badge.name;

		const up = actionButton( 'up', '↑', strings.moveUp, badge );
		up.disabled = index === 0;
		const down = actionButton( 'down', '↓', strings.moveDown, badge );
		down.disabled = index === picked.length - 1;
		const remove = actionButton( 'remove', '✕', strings.remove, badge );

		const item = document.createElement( 'li' );
		item.draggable = true;
		item.dataset.id = id;
		item.append( handle, thumbnail, name, up, down, remove );
		return item;
	} );

	list.replaceChildren( ...items );

	if ( focusAfterRender ) {
		const { id, action } = focusAfterRender;
		focusAfterRender = null;
		const item = list.querySelector( `li[data-id="${ id }"]` );
		let target = item ? item.querySelector( `[data-action="${ action }"]` ) : null;
		if ( target && target.disabled ) {
			target = item.querySelector( '[data-action="up"]:not(:disabled), [data-action="down"]:not(:disabled)' );
		}
		if ( ! item ) {
			target = list.querySelector( '[data-action="remove"]' );
		}
		if ( target ) {
			target.focus();
		}
	}
}

/**
 * Moves a badge to another position.
 *
 * @param {string} id    Badge id.
 * @param {number} index New position.
 */
function move( id, index ) {
	const picked = getState().picked.filter( ( other ) => other !== id );
	picked.splice( Math.max( 0, Math.min( index, picked.length ) ), 0, id );
	update( { picked } );
}

list.addEventListener( 'click', ( event ) => {
	const button = event.target.closest( 'button' );
	if ( ! button ) {
		return;
	}
	const id = button.closest( 'li' ).dataset.id;
	const index = getState().picked.indexOf( id );
	focusAfterRender = { id, action: button.dataset.action };

	if ( button.dataset.action === 'up' ) {
		move( id, index - 1 );
	} else if ( button.dataset.action === 'down' ) {
		move( id, index + 1 );
	} else {
		update( { picked: getState().picked.filter( ( other ) => other !== id ) } );
	}
} );

/**
 * Returns the list item under the pointer during a drag, and whether the
 * dragged badge goes before or after it.
 *
 * @param {DragEvent} event The drag event.
 * @return {Object|null} { item, after }, or null.
 */
function dropTarget( event ) {
	const item = event.target.closest( 'li' );
	if ( ! item || item.dataset.id === dragged ) {
		return null;
	}
	const box = item.getBoundingClientRect();
	return { item, after: event.clientY > box.top + box.height / 2 };
}

/**
 * Clears the drop marks.
 */
function clearMarks() {
	for ( const item of list.querySelectorAll( '.is-drop-before, .is-drop-after' ) ) {
		item.classList.remove( 'is-drop-before', 'is-drop-after' );
	}
}

list.addEventListener( 'dragstart', ( event ) => {
	const item = event.target.closest( 'li' );
	dragged = item.dataset.id;
	item.classList.add( 'is-dragging' );
	event.dataTransfer.effectAllowed = 'move';
	event.dataTransfer.setData( 'text/plain', dragged );
} );

list.addEventListener( 'dragover', ( event ) => {
	const target = dragged ? dropTarget( event ) : null;
	if ( ! target ) {
		return;
	}
	event.preventDefault();
	clearMarks();
	target.item.classList.add( target.after ? 'is-drop-after' : 'is-drop-before' );
} );

list.addEventListener( 'drop', ( event ) => {
	const target = dragged ? dropTarget( event ) : null;
	clearMarks();
	if ( ! target ) {
		return;
	}
	event.preventDefault();
	const others = getState().picked.filter( ( id ) => id !== dragged );
	const index = others.indexOf( target.item.dataset.id ) + ( target.after ? 1 : 0 );
	move( dragged, index );
} );

list.addEventListener( 'dragend', () => {
	clearMarks();
	const item = list.querySelector( '.is-dragging' );
	if ( item ) {
		item.classList.remove( 'is-dragging' );
	}
	dragged = null;
} );

const SORTS = {
	source: ( a, b ) => {
		const position = ( id ) => ( sourceOrder.includes( id ) ? sourceOrder.indexOf( id ) : Infinity );
		return position( a ) - position( b );
	},
	name: ( a, b ) => catalog.get( a ).name.localeCompare( catalog.get( b ).name ),
	team: ( a, b ) =>
		catalog.get( a ).team.localeCompare( catalog.get( b ).team ) ||
		Number( catalog.get( b ).isTeam ) - Number( catalog.get( a ).isTeam ) ||
		catalog.get( a ).name.localeCompare( catalog.get( b ).name ),
};

for ( const button of document.querySelectorAll( '[data-sort]' ) ) {
	button.addEventListener( 'click', () => {
		update( { picked: [ ...getState().picked ].sort( SORTS[ button.dataset.sort ] ) } );
	} );
}

subscribe( render );
render();
