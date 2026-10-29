/**
 * Cute WP Badges: WordPress.org profile badges in the classic profile style,
 * one by one or in a grid, as SVG or PNG. Works in the browser and in Node 18+.
 *
 *     import { renderBadge, renderGrid } from './cute-wp-badges.js';
 *     const svg = await renderBadge( 'translation-contributor' );
 *     const png = await renderGrid( [ 'core-contributor', 'polyglots-team' ], { format: 'png', columns: 5 } );
 *
 * The badges are finished SVG files in ../badges/, composed and sanitized by
 * scripts/build-badges.mjs. This library only reads them, lays them out and
 * rasterizes them: in the browser with a canvas (PNG output is a Blob), in
 * Node with @resvg/resvg-js, which has to be installed (a Buffer).
 *
 * The catalog and the badges are read relative to this file:
 * ../../data/badges.json and ../badges/.
 *
 * @package Cute_WP_Badges
 */

const CATALOG_URL = new URL( '../../data/badges.json', import.meta.url );
const BADGES_URL = new URL( '../badges/', import.meta.url );

const MAX_SIZE = 4096;
const MAX_IMAGE = 8192;

let catalogPromise = null;
const svgCache = new Map();

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
 * Loads the composed SVG file of a badge.
 *
 * @param {string} id Badge id or alias.
 * @return {Promise<string>} SVG markup, exactly as in the file.
 */
async function loadBadgeSvg( id ) {
	const badge = await getBadge( id );
	if ( ! badge ) {
		throw new Error( `Unknown badge "${ id }".` );
	}
	if ( ! svgCache.has( badge.id ) ) {
		svgCache.set( badge.id, loadText( new URL( `${ badge.id }.svg`, BADGES_URL ) ) );
	}
	return svgCache.get( badge.id );
}

/**
 * Checks that a value is a whole number within limits.
 *
 * @param {number} value Value to check.
 * @param {string} name  Name of the option, for the error message.
 * @param {number} min   Smallest value allowed.
 * @param {number} max   Largest value allowed.
 */
function checkWholeNumber( value, name, min, max ) {
	if ( ! Number.isInteger( value ) || value < min || value > max ) {
		throw new Error( `${ name } must be a whole number from ${ min } to ${ max }.` );
	}
}

/**
 * Checks the output format.
 *
 * @param {string} format Format.
 */
function checkFormat( format ) {
	if ( format !== 'svg' && format !== 'png' ) {
		throw new Error( `Unknown format "${ format }": use "svg" or "png".` );
	}
}

/**
 * Sets the width and height of an SVG, so it has an intrinsic size when it
 * is drawn as an image.
 *
 * @param {string} svg    SVG markup.
 * @param {number} width  Width, in pixels.
 * @param {number} height Height, in pixels.
 * @return {string} SVG markup.
 */
function withSize( svg, width, height ) {
	return svg.replace( /^<svg\b/, `<svg width="${ width }" height="${ height }"` );
}

/**
 * Draws an SVG into a PNG.
 *
 * @param {string} svg    SVG markup.
 * @param {number} width  Width, in pixels.
 * @param {number} height Height, in pixels.
 * @return {Promise<Blob|Buffer>} PNG image: a Blob in the browser, a Buffer in Node.
 */
async function svgToPng( svg, width, height ) {
	if ( typeof document !== 'undefined' ) {
		const image = new Image();
		image.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent( withSize( svg, width, height ) );
		await image.decode();

		const canvas = document.createElement( 'canvas' );
		canvas.width = width;
		canvas.height = height;
		canvas.getContext( '2d' ).drawImage( image, 0, 0, width, height );

		return new Promise( ( resolve, reject ) => {
			canvas.toBlob( ( blob ) => ( blob ? resolve( blob ) : reject( new Error( 'Cannot create the PNG.' ) ) ), 'image/png' );
		} );
	}

	const { Resvg } = await import( '@resvg/resvg-js' );
	return new Resvg( svg, { fitTo: { mode: 'width', value: width } } ).render().asPng();
}

/**
 * Draws a badge.
 *
 * As SVG, the result is the badge file as it is: it has no fixed size, so
 * `size` does not apply. As PNG, it is drawn `size` pixels wide and high.
 *
 * @param {string} id             Badge id (WordPress.org association slug) or alias.
 * @param {Object} options        Options.
 * @param {string} options.format 'svg' (default) or 'png'.
 * @param {number} options.size   PNG width and height, in pixels. Default 128.
 * @return {Promise<string|Blob|Buffer>} SVG markup, or a PNG image (Blob in the browser, Buffer in Node).
 */
export async function renderBadge( id, { format = 'svg', size = 128 } = {} ) {
	checkFormat( format );
	checkWholeNumber( size, 'The size', 1, MAX_SIZE );

	const svg = await loadBadgeSvg( id );
	return format === 'svg' ? svg : svgToPng( svg, size, size );
}

/**
 * Lays badges out in a grid, left to right and top to bottom, with a
 * transparent background.
 *
 * As SVG, the result has no fixed size: `size` and `gap` only set the
 * proportions, and each badge is its own file nested as it is. As PNG, the
 * whole grid is drawn at `size` pixels per badge and `gap` pixels between
 * badges. A single badge gives the same drawing as renderBadge().
 *
 * @param {string[]} ids             Badge ids or aliases, in order.
 * @param {Object}   options         Options.
 * @param {number}   options.columns Badges per row. Default 5.
 * @param {number}   options.size    Width and height of each badge. Default 128.
 * @param {number}   options.gap     Space between badges. Default 32.
 * @param {string}   options.format  'svg' (default) or 'png'.
 * @return {Promise<string|Blob|Buffer>} SVG markup, or a PNG image (Blob in the browser, Buffer in Node).
 */
export async function renderGrid( ids, { columns = 5, size = 128, gap = 32, format = 'svg' } = {} ) {
	checkFormat( format );
	if ( ! Array.isArray( ids ) || ids.length === 0 ) {
		throw new Error( 'Pick at least one badge.' );
	}
	checkWholeNumber( columns, 'The number of columns', 1, 100 );
	checkWholeNumber( size, 'The size', 1, MAX_SIZE );
	checkWholeNumber( gap, 'The gap', 0, MAX_SIZE );

	const svgs = await Promise.all( ids.map( loadBadgeSvg ) );

	const usedColumns = Math.min( columns, ids.length );
	const rows = Math.ceil( ids.length / usedColumns );
	const width = usedColumns * size + ( usedColumns - 1 ) * gap;
	const height = rows * size + ( rows - 1 ) * gap;

	if ( format === 'png' && ( width > MAX_IMAGE || height > MAX_IMAGE ) ) {
		throw new Error( `The image would be ${ width } × ${ height } pixels; the limit is ${ MAX_IMAGE } on each side. Use a smaller size or gap.` );
	}

	let cells = '';
	for ( const [ index, svg ] of svgs.entries() ) {
		const x = ( index % usedColumns ) * ( size + gap );
		const y = Math.floor( index / usedColumns ) * ( size + gap );
		// The badge file, placed in its cell. Its own namespace is inherited.
		cells += svg
			.trim()
			.replace( /^<svg\b[^>]*?(\sviewBox="[^"]*")[^>]*>/, `<svg x="${ x }" y="${ y }" width="${ size }" height="${ size }"$1>` );
	}

	const grid = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${ width } ${ height }">${ cells }</svg>\n`;
	return format === 'svg' ? grid : svgToPng( grid, width, height );
}
