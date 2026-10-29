/**
 * The "Any badge" tab of the badge page: a selector with every badge in the
 * catalog.
 *
 * @package Cute_WP_Badges
 */

import { getBadges } from '@cute-wp-badges/cute-wp-badges';
import { showBadge } from '@cute-wp-badges/badge-output';

const badgeField = document.getElementById( 'cute-wp-badges-badge' );

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
 * Shows the badge chosen in the selector.
 */
function showSelected() {
	showBadge( badgeField.value, badgeField.selectedOptions[ 0 ].text );
}

badgeField.addEventListener( 'change', showSelected );

await fillBadges();
showSelected();
