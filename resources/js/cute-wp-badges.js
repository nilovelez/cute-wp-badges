/**
 * Cute WP Badges: draws WordPress.org profile badges in the classic profile
 * style, as SVG or PNG. Works in the browser and in Node 18+.
 *
 *     import { renderBadge } from './cute-wp-badges.js';
 *     const png = await renderBadge( 'translation-contributor', { format: 'png', size: 500 } );
 *
 * In the browser, PNG output is a Blob drawn with a canvas. In Node it is a
 * Buffer drawn with @resvg/resvg-js, which has to be installed.
 *
 * The badge catalog and the icons are read from the plugin folder, relative
 * to this file: ../../data/badges.json and ../icons/.
 *
 * @package Cute_WP_Badges
 */

const CATALOG_URL = new URL( '../../data/badges.json', import.meta.url );
const ICONS_URL = new URL( '../icons/', import.meta.url );
const ICON_FOLDERS = { dashicon: 'dashicons', svg: 'custom' };

const MAX_SIZE = 4096;

/*
 * Geometry of the old profile badge, in CSS pixels of the original 32 px
 * badge (see "Old badge style" in docs/badges.md): a 32 px circle with a
 * 2 px white border, a 4 px ring outside it, a 24 px Dashicon or a 22 px
 * custom icon. The whole badge, ring included, is 40 px wide.
 */
const VIEWBOX = 40;
const RING_RADIUS = 20;
const BORDER_RADIUS = 16;
const FILL_RADIUS = 14;
const ICON_SIZE = { dashicon: 24, svg: 22 };
const TINT = 0.25;

let catalogPromise = null;
const iconCache = new Map();

/**
 * Reads a text file next to this module: with fetch() in the browser, or
 * from disk in Node.
 *
 * @param {URL} url File URL.
 * @return {Promise<string>} File contents.
 */
async function loadText( url ) {
	if ( url.protocol === 'file:' && typeof document === 'undefined' ) {
		const { readFile } = await import( 'node:fs/promises' );
		return readFile( url, 'utf8' );
	}
	const response = await fetch( url );
	if ( ! response.ok ) {
		throw new Error( `Cannot load ${ url }: HTTP ${ response.status }` );
	}
	return response.text();
}

/**
 * Returns every badge in the catalog.
 *
 * @return {Promise<Object[]>} Badges, as in data/badges.json.
 */
export async function getBadges() {
	if ( ! catalogPromise ) {
		catalogPromise = loadText( CATALOG_URL ).then( ( text ) => JSON.parse( text ).badges );
	}
	return catalogPromise;
}

/**
 * Finds a badge by its id or one of its aliases.
 *
 * @param {string} id Badge id, the WordPress.org association slug.
 * @return {Promise<Object|null>} The badge, or null if it is not in the catalog.
 */
export async function getBadge( id ) {
	const badges = await getBadges();
	for ( const badge of badges ) {
		if ( badge.id === id || badge.aliases.includes( id ) ) {
			return badge;
		}
	}
	return null;
}

/**
 * Loads the SVG of a badge icon.
 *
 * @param {Object} icon Icon from the catalog: { type, name }.
 * @return {Promise<string>} SVG markup.
 */
async function loadIcon( icon ) {
	const key = `${ icon.type }/${ icon.name }`;
	if ( ! iconCache.has( key ) ) {
		const url = new URL( `${ ICON_FOLDERS[ icon.type ] }/${ icon.name }.svg`, ICONS_URL );
		iconCache.set( key, loadText( url ) );
	}
	return iconCache.get( key );
}

/**
 * Mixes a color with white, like a semi-transparent color on a white background.
 *
 * @param {string} hex    Color, #rrggbb.
 * @param {number} amount How much of the color to keep, from 0 to 1.
 * @return {string} The mixed color, #rrggbb.
 */
function tint( hex, amount ) {
	let result = '#';
	for ( let i = 1; i < 7; i += 2 ) {
		const channel = parseInt( hex.slice( i, i + 2 ), 16 );
		const mixed = Math.round( 255 - ( 255 - channel ) * amount );
		result += mixed.toString( 16 ).padStart( 2, '0' );
	}
	return result;
}

/**
 * Turns an icon file into a nested <svg> painted in one color.
 *
 * Every fill and stroke color in the icon becomes the badge color, the way
 * WordPress.org paints its icons with a CSS mask. "none" stays "none".
 * <style> elements are removed: their rules are global, so in a document with
 * several badges they would paint every icon.
 *
 * @param {string} iconSvg SVG markup of the icon.
 * @param {string} color   Badge color.
 * @param {number} size    Icon size, in viewbox units.
 * @return {string} SVG markup.
 */
function iconElement( iconSvg, color, size ) {
	const open = iconSvg.match( /<svg\b[^>]*>/ );
	if ( ! open ) {
		throw new Error( 'The icon is not an SVG file.' );
	}
	const viewBox = open[ 0 ].match( /viewBox=["']([^"']+)["']/ );
	const rootFill = open[ 0 ].match( /\sfill=["']([^"']+)["']/ );
	const groupFill = rootFill && rootFill[ 1 ] === 'none' ? 'none' : color;

	let body = iconSvg.slice( open.index + open[ 0 ].length, iconSvg.lastIndexOf( '</svg>' ) );
	body = body.replace( /<style\b[\s\S]*?<\/style>/g, '' );
	body = body.replace( /\s(fill|stroke)=(["'])(.*?)\2/g, ( match, attribute, quote, value ) =>
		value === 'none' ? match : ` ${ attribute }="${ color }"`
	);
	body = body.replace( /\b(fill|stroke)\s*:\s*([^;"']+)/g, ( match, property, value ) =>
		value.trim() === 'none' ? match : `${ property }:${ color }`
	);

	const offset = ( VIEWBOX - size ) / 2;
	return (
		`<svg x="${ offset }" y="${ offset }" width="${ size }" height="${ size }" viewBox="${ viewBox ? viewBox[ 1 ] : '0 0 20 20' }">` +
		`<g fill="${ groupFill }">${ body }</g>` +
		'</svg>'
	);
}

/**
 * Builds the SVG of a badge. No file access: the badge and its icon are given.
 *
 * @param {Object} badge   Badge from the catalog.
 * @param {string} iconSvg SVG markup of the badge icon.
 * @param {number} size    Width and height of the image, in pixels.
 * @return {string} SVG markup.
 */
export function buildBadgeSvg( badge, iconSvg, size ) {
	const center = VIEWBOX / 2;
	const fill = badge.isTeam ? tint( badge.color, TINT ) : '#ffffff';

	return (
		`<svg xmlns="http://www.w3.org/2000/svg" width="${ size }" height="${ size }" viewBox="0 0 ${ VIEWBOX } ${ VIEWBOX }" role="img" aria-label="${ badge.name.replace( /"/g, '&quot;' ) }">` +
		`<circle cx="${ center }" cy="${ center }" r="${ RING_RADIUS }" fill="${ badge.color }"/>` +
		`<circle cx="${ center }" cy="${ center }" r="${ BORDER_RADIUS }" fill="#ffffff"/>` +
		`<circle cx="${ center }" cy="${ center }" r="${ FILL_RADIUS }" fill="${ fill }"/>` +
		iconElement( iconSvg, badge.color, ICON_SIZE[ badge.icon.type ] ) +
		'</svg>'
	);
}

/**
 * Draws an SVG into a PNG.
 *
 * @param {string} svg  SVG markup.
 * @param {number} size Width and height, in pixels.
 * @return {Promise<Blob|Buffer>} PNG image: a Blob in the browser, a Buffer in Node.
 */
async function svgToPng( svg, size ) {
	if ( typeof document !== 'undefined' ) {
		const image = new Image();
		image.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent( svg );
		await image.decode();

		const canvas = document.createElement( 'canvas' );
		canvas.width = size;
		canvas.height = size;
		canvas.getContext( '2d' ).drawImage( image, 0, 0, size, size );

		return new Promise( ( resolve, reject ) => {
			canvas.toBlob( ( blob ) => ( blob ? resolve( blob ) : reject( new Error( 'Cannot create the PNG.' ) ) ), 'image/png' );
		} );
	}

	const { Resvg } = await import( '@resvg/resvg-js' );
	return new Resvg( svg, { fitTo: { mode: 'width', value: size } } ).render().asPng();
}

/**
 * Draws a badge.
 *
 * @param {string} id              Badge id (WordPress.org association slug) or alias.
 * @param {Object} options         Options.
 * @param {string} options.format  'svg' (default) or 'png'.
 * @param {number} options.size    Width and height, in pixels. Default 128.
 * @return {Promise<string|Blob|Buffer>} SVG markup, or a PNG image (Blob in the browser, Buffer in Node).
 */
export async function renderBadge( id, { format = 'svg', size = 128 } = {} ) {
	if ( format !== 'svg' && format !== 'png' ) {
		throw new Error( `Unknown format "${ format }": use "svg" or "png".` );
	}
	if ( ! Number.isInteger( size ) || size < 1 || size > MAX_SIZE ) {
		throw new Error( `Size must be a whole number of pixels from 1 to ${ MAX_SIZE }.` );
	}

	const badge = await getBadge( id );
	if ( ! badge ) {
		throw new Error( `Unknown badge "${ id }".` );
	}

	const svg = buildBadgeSvg( badge, await loadIcon( badge.icon ), size );
	return format === 'svg' ? svg : svgToPng( svg, size );
}
