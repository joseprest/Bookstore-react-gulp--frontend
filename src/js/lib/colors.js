import palettes from './color-palettes';

const hash = {};
const defaultPaletteName = '_default';
const cursor = {};

/**
 * Returns the hash key for this combination of type, key and palette.
 *
 * @param  {string} type
 * @param  {string} key
 * @param  {string} paletteName
 * @return {string}
 */
function getColorHashKey(type, key, paletteName) {
    return `${type}_${key}_${paletteName}`;
}

/**
 * Returns the defined color for this combination of type, key and palette.
 * If no color is defined, returns null.
 *
 * @param  {string} type
 * @param  {string} key
 * @param  {string} paletteName
 * @return {string|null}
 */
function getSavedColor(type, key, paletteName) {
    const hashKey = getColorHashKey(type, key, paletteName);

    if (typeof hash[hashKey] === 'undefined') {
        return null;
    }

    return hash[hashKey];
}

/**
 * Returns true if a color is already defined for this combination of
 * type, key and palette.
 *
 * @param  {string} type
 * @param  {string} key
 * @param  {string} paletteName
 * @return {boolean}
 */
function colorIsSaved(type, key, paletteName) {
    return getSavedColor(type, key, paletteName) !== null;
}

/**
 * Defines the color for this combination of type, key and palette.
 *
 * @param  {string} type
 * @param  {string} key
 * @param  {string} paletteName
 */
function saveColor(color, type, key, paletteName) {
    const hashKey = getColorHashKey(type, key, paletteName);
    hash[hashKey] = color;
}

const Colors = {
    defaultPaletteName,

    /**
     * Returns the CSS color for the type, key and palette.
     *
     * For a specified type and key in a palette, always returns the
     * same color. If no color is yet selected for this combination,
     * use the next color in the palette. If no palette is defined,
     * use the '_base' palette.
     *
     * @param  {string} type
     * @param  {string} key
     * @param  {string} paletteName
     * @return {string} The color as CSS value (ex: #15a8f3)
     */
    get(type, key, paletteName) {
        let color;
        const finalPaletteName = this.ensurePaletteName(paletteName);

        if (colorIsSaved(type, key, finalPaletteName)) {
            color = getSavedColor(type, key, finalPaletteName);
        } else {
            color = this.getNextColor(type, finalPaletteName);
            saveColor(color, type, key, finalPaletteName);
        }

        return color;
    },

    /**
     * If the palette exists, returns the name unchanged. Else return
     * the default palette name.
     *
     * @param  {string} paletteName
     * @return {string}
     */
    ensurePaletteName(paletteName = null) {
        if (paletteName === null || typeof paletteName !== 'string' || typeof palettes[paletteName] === 'undefined') {
            return defaultPaletteName;
        }
        return paletteName;
    },

    /**
     * Returns the next color of the palette for this type (different
     * types may use the same palette, but have different cursor) at its
     * internal cursor and advances the cursor to the next. Once the
     * cursor reaches the last color, returns to the beginning.
     *
     * @param  {string} type
     * @param  {string} paletteName
     * @return {string}
     */
    getNextColor(type, paletteName) {
        const cursorKey = `${type}_${paletteName}`;
        if (typeof cursor[cursorKey] === 'undefined') {
            cursor[cursorKey] = 0;
        }

        const paletteColors = palettes[paletteName];
        let paletteCursor = cursor[cursorKey];

        if (paletteCursor >= paletteColors.length) {
            paletteCursor = 0;
        }

        const color = paletteColors[paletteCursor];

        cursor[cursorKey] = paletteCursor + 1;

        return color;
    },
};

export default Colors;
