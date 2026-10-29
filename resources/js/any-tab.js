/**
 * The "Any badge" tab of the badge page: every badge in the catalog, by
 * name, with a search field and a filter for team badges.
 *
 * @package Cute_WP_Badges
 */

import { getBadges } from '@cute-wp-badges/cute-wp-badges';
import { strings } from '@cute-wp-badges/badge-store';
import { showBadges } from '@cute-wp-badges/badge-picker';
import '@cute-wp-badges/badge-order';
import '@cute-wp-badges/badge-output';

const search = document.getElementById( 'cute-wp-badges-search' );
const teamsOnly = document.getElementById( 'cute-wp-badges-teams-only' );

const badges = [ ...( await getBadges() ) ];
badges.sort( ( a, b ) => a.name.localeCompare( b.name ) );

/**
 * Shows the badges that match the search and the filter.
 *
 * @return {Promise} Resolves when the picker is drawn.
 */
function filter() {
	const words = search.value.trim().toLowerCase().split( /\s+/ ).filter( Boolean );
	const matches = badges.filter( ( badge ) => {
		if ( teamsOnly.checked && ! badge.isTeam ) {
			return false;
		}
		const text = `${ badge.name } ${ badge.team }`.toLowerCase();
		return words.every( ( word ) => text.includes( word ) );
	} );
	return showBadges(
		matches.map( ( badge ) => badge.id ),
		{ message: strings.noMatches }
	);
}

search.addEventListener( 'input', filter );
teamsOnly.addEventListener( 'change', filter );

await filter();
document.getElementById( 'cute-wp-badges-editor' ).hidden = false;
