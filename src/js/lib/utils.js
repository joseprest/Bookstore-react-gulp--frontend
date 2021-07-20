/* globals Modernizr: true */
import sortBy from 'lodash/sortBy';
import isString from 'lodash/isString';
import { Promise } from 'es6-promise';
import Color from 'color';
import CONFIG from '../config';

import Text from './text';

const touchValid = {};

const colorIntCache = {};
const colorIsDarkCache = {};

const Utils = {
    wait(delay) {
        return new Promise(resolve => {
            setTimeout(() => {
                resolve();
            }, delay);
        });
    },

    getScreenWithSize(width) {
        const sizes = sortBy(
            Object.keys(CONFIG.SCREEN_WIDTH).map(key => ({
                key,
                size: CONFIG.SCREEN_WIDTH[key],
            })),
        );

        return sizes.reduce(
            (closestKey, { size, key }) => (width < size ? closestKey || key : key),
            null,
        );
    },

    onClick(cb, type = 'start', options = {}) {
        const { onCancelOutside = true } = options;

        const eventType = type.substr(0, 1).toUpperCase() + type.substr(1);
        const mouseEvents = {};
        if (Modernizr.touchevents) {
            if (type === 'end' && onCancelOutside) {
                mouseEvents.onTouchStart = e => {
                    for (let i = 0, tl = e.changedTouches.length; i < tl; i += 1) {
                        const touch = e.changedTouches[i];
                        touchValid[touch.identifier] = true;
                    }
                };
                mouseEvents.onTouchMove = e => {
                    for (let i = 0, tl = e.changedTouches.length; i < tl; i += 1) {
                        const touch = e.changedTouches[i];
                        if (touchValid[touch.identifier]) {
                            touchValid[touch.identifier] = false;
                        }
                    }
                };
            }

            mouseEvents[`onTouch${eventType}`] = e => {
                if (eventType === 'Start') {
                    cb(e);
                    return;
                }

                let notFound = true;
                for (let i = 0, tl = e.changedTouches.length; i < tl; i += 1) {
                    const touch = e.changedTouches[i];
                    if (touchValid[touch.identifier]) {
                        cb(e);
                        return;
                    }
                    if (typeof touchValid[touch.identifier] !== 'undefined') {
                        notFound = false;
                    }
                }

                if (notFound) {
                    cb(e);
                }
            };
        } else {
            mouseEvents.onClick = cb;
        }

        return mouseEvents;
    },

    getMaxSize(width, height, maxWidth, maxHeight) {
        if (!width || width <= 0 || !height || height <= 0) {
            console.warn('width/height not set', width, height);
            return {
                width: 0,
                height: 0,
                ratio: 1,
            };
        }

        const finalMaxWidth = maxWidth || width;
        const finalMaxHeight = maxHeight || height;

        const ratioWidth = Math.round(finalMaxWidth) / width;
        const ratioHeight = Math.round(finalMaxHeight) / height;
        const ratio = Math.min(ratioWidth, ratioHeight);

        const computedWidth = Math.round(width * ratio);
        const computedHeight = Math.round(height * ratio);

        return {
            width: computedWidth,
            height: computedHeight,
            ratio,
        };
    },

    getComponentFromType(Components, type) {
        const normalizedType = (type || '').replace(/[^a-z0-9]/gi, '').toLowerCase();
        // prettier-ignore
        const componentKeys = Object.keys(Components);
        const componentKey =
            componentKeys.find(key => key.toLowerCase() === normalizedType) ||
            componentKeys[0] ||
            null;
        return componentKey !== null ? Components[componentKey] : null;
    },

    addLeadingZeroes(number, size) {
        let str = `${number}`;
        while (str.length < size) {
            str = `0${str}`;
        }
        return str;
    },

    colorStringToInt(str = '#000') {
        if (typeof colorIntCache[str] === 'undefined') {
            const color = new Color(str);
            colorIntCache[str] = color.rgbNumber();
        }
        return colorIntCache[str];
    },

    colorIsDark(str) {
        if (typeof colorIsDarkCache[str] === 'undefined') {
            const color = new Color(str);
            colorIsDarkCache[str] = color.isDark();
        }
        return colorIsDarkCache[str];
    },

    getShadeColor(color, percent) {
        if (color === null) {
            return null;
        }

        const finalColor =
            color.length === 4
                ? color[0] + color[1] + color[1] + color[2] + color[2] + color[3] + color[3]
                : color;

        let R = parseInt(finalColor.substring(1, 3), 16);
        let G = parseInt(finalColor.substring(3, 5), 16);
        let B = parseInt(finalColor.substring(5, 7), 16);

        R = parseInt((R * (100 + percent)) / 100, 10);
        G = parseInt((G * (100 + percent)) / 100, 10);
        B = parseInt((B * (100 + percent)) / 100, 10);

        R = R < 255 ? R : 255;
        G = G < 255 ? G : 255;
        B = B < 255 ? B : 255;

        const RR = R.toString(16).length === 1 ? `0${R.toString(16)}` : R.toString(16);
        const GG = G.toString(16).length === 1 ? `0${G.toString(16)}` : G.toString(16);
        const BB = B.toString(16).length === 1 ? `0${B.toString(16)}` : B.toString(16);

        return `#${RR}${GG}${BB}`;
    },

    getLoopNumber(number, min, max) {
        if (number < min) {
            return max;
        }
        if (number > max) {
            return min;
        }

        return number;
    },

    getDateHours(startDate, endDate) {
        if (
            typeof startDate === 'undefined' ||
            startDate === null ||
            !startDate.isValid() ||
            typeof endDate === 'undefined' ||
            endDate === null ||
            !endDate.isValid()
        ) {
            return null;
        }

        const startHours = startDate.hours();
        const startMinutes = startDate.minutes();
        const endHours = endDate.hours();
        const endMinutes = endDate.minutes();

        let dateHours;

        if (startHours === 0 && startMinutes === 0 && endHours === 0 && endMinutes === 0) {
            dateHours = null;
        } else {
            const startHoursText = startDate.format(Text.t('hours_format', startMinutes));
            const endHoursText = endDate.format(Text.t('hours_format', endMinutes));
            if ((endHours !== 0 || endMinutes !== 0) && endHoursText !== startHoursText) {
                dateHours = Text.t('hours_range', {
                    start: startHoursText,
                    end: endHoursText,
                });
            } else {
                dateHours = startHoursText;
            }
        }

        return dateHours;
    },

    /*

    getTransform: function(element)
    {
        var matrix = new WebKitCSSMatrix($(element).css("-webkit-transform"));
        return {
            translateX: matrix.e,
            translateY: matrix.f,
            scaleX: matrix.a,
            scaleY: matrix.d
        };
    },

    getHashFromString: function(string)
    {
        var hash = 0, i, chr, len;
        if (string.length === 0)
        {
            return hash;
        }
        for (i = 0, len = string.length; i < len; i++)
        {
            chr   = string.charCodeAt(i);
            hash  = ((hash << 5) - hash) + chr;
            hash |= 0; // Convert to 32bit integer
        }
        return hash;
    }, */

    /* eslint-disable */
    getMD5FromString(str) {
        //  http://phpjs.org/functions/md5

        let xl;

        const rotateLeft = function(lValue, iShiftBits) {
            return (lValue << iShiftBits) | (lValue >>> (32 - iShiftBits));
        };

        const addUnsigned = (lX, lY) => {
            let lX4;
            let lY4;
            let lX8;
            let lY8;
            let lResult;
            lX8 = lX & 0x80000000;
            lY8 = lY & 0x80000000;
            lX4 = lX & 0x40000000;
            lY4 = lY & 0x40000000;
            lResult = (lX & 0x3fffffff) + (lY & 0x3fffffff);
            if (lX4 & lY4) {
                return lResult ^ 0x80000000 ^ lX8 ^ lY8;
            }
            if (lX4 | lY4) {
                if (lResult & 0x40000000) {
                    return lResult ^ 0xc0000000 ^ lX8 ^ lY8;
                }
                return lResult ^ 0x40000000 ^ lX8 ^ lY8;
            }
            return lResult ^ lX8 ^ lY8;
        };

        const _F = function(x, y, z) {
            return (x & y) | (~x & z);
        };
        const _G = function(x, y, z) {
            return (x & z) | (y & ~z);
        };
        const _H = function(x, y, z) {
            return x ^ y ^ z;
        };
        const _I = function(x, y, z) {
            return y ^ (x | ~z);
        };

        const _FF = function(a, b, c, d, x, s, ac) {
            a = addUnsigned(a, addUnsigned(addUnsigned(_F(b, c, d), x), ac));
            return addUnsigned(rotateLeft(a, s), b);
        };

        const _GG = function(a, b, c, d, x, s, ac) {
            a = addUnsigned(a, addUnsigned(addUnsigned(_G(b, c, d), x), ac));
            return addUnsigned(rotateLeft(a, s), b);
        };

        const _HH = function(a, b, c, d, x, s, ac) {
            a = addUnsigned(a, addUnsigned(addUnsigned(_H(b, c, d), x), ac));
            return addUnsigned(rotateLeft(a, s), b);
        };

        const _II = function(a, b, c, d, x, s, ac) {
            a = addUnsigned(a, addUnsigned(addUnsigned(_I(b, c, d), x), ac));
            return addUnsigned(rotateLeft(a, s), b);
        };

        const convertToWordArray = str => {
            let lWordCount;
            const lMessageLength = str.length;
            const lNumberOfWords_temp1 = lMessageLength + 8;
            const lNumberOfWords_temp2 = (lNumberOfWords_temp1 - (lNumberOfWords_temp1 % 64)) / 64;
            const lNumberOfWords = (lNumberOfWords_temp2 + 1) * 16;
            const lWordArray = new Array(lNumberOfWords - 1);
            let lBytePosition = 0;
            let lByteCount = 0;
            while (lByteCount < lMessageLength) {
                lWordCount = (lByteCount - (lByteCount % 4)) / 4;
                lBytePosition = (lByteCount % 4) * 8;
                lWordArray[lWordCount] =
                    lWordArray[lWordCount] | (str.charCodeAt(lByteCount) << lBytePosition);
                lByteCount++;
            }
            lWordCount = (lByteCount - (lByteCount % 4)) / 4;
            lBytePosition = (lByteCount % 4) * 8;
            lWordArray[lWordCount] = lWordArray[lWordCount] | (0x80 << lBytePosition);
            lWordArray[lNumberOfWords - 2] = lMessageLength << 3;
            lWordArray[lNumberOfWords - 1] = lMessageLength >>> 29;
            return lWordArray;
        };

        const wordToHex = lValue => {
            let wordToHexValue = '';
            let wordToHexValue_temp = '';
            let lByte;
            let lCount;
            for (lCount = 0; lCount <= 3; lCount++) {
                lByte = (lValue >>> (lCount * 8)) & 255;
                wordToHexValue_temp = `0${lByte.toString(16)}`;
                wordToHexValue += wordToHexValue_temp.substr(wordToHexValue_temp.length - 2, 2);
            }
            return wordToHexValue;
        };

        const utf8_encode = argString => {
            if (argString === null || typeof argString === 'undefined') {
                return '';
            }

            const string = `${argString}`; // .replace(/\r\n/g, "\n").replace(/\r/g, "\n");
            let utftext = '';
            let start;
            let end;
            let stringl = 0;

            start = end = 0;
            stringl = string.length;
            for (let n = 0; n < stringl; n++) {
                let c1 = string.charCodeAt(n);
                let enc = null;

                if (c1 < 128) {
                    end++;
                } else if (c1 > 127 && c1 < 2048) {
                    enc = String.fromCharCode((c1 >> 6) | 192, (c1 & 63) | 128);
                } else if ((c1 & 0xf800) != 0xd800) {
                    enc = String.fromCharCode(
                        (c1 >> 12) | 224,
                        ((c1 >> 6) & 63) | 128,
                        (c1 & 63) | 128,
                    );
                } else {
                    // surrogate pairs
                    if ((c1 & 0xfc00) != 0xd800) {
                        throw new RangeError(`Unmatched trail surrogate at ${n}`);
                    }
                    const c2 = string.charCodeAt(++n);
                    if ((c2 & 0xfc00) != 0xdc00) {
                        throw new RangeError(`Unmatched lead surrogate at ${n - 1}`);
                    }
                    c1 = ((c1 & 0x3ff) << 10) + (c2 & 0x3ff) + 0x10000;
                    enc = String.fromCharCode(
                        (c1 >> 18) | 240,
                        ((c1 >> 12) & 63) | 128,
                        ((c1 >> 6) & 63) | 128,
                        (c1 & 63) | 128,
                    );
                }
                if (enc !== null) {
                    if (end > start) {
                        utftext += string.slice(start, end);
                    }
                    utftext += enc;
                    start = end = n + 1;
                }
            }

            if (end > start) {
                utftext += string.slice(start, stringl);
            }

            return utftext;
        };

        let x = [];
        let k;
        let AA;
        let BB;
        let CC;
        let DD;
        let a;
        let b;
        let c;
        let d;
        const S11 = 7;
        const S12 = 12;
        const S13 = 17;
        const S14 = 22;
        const S21 = 5;
        const S22 = 9;
        const S23 = 14;
        const S24 = 20;
        const S31 = 4;
        const S32 = 11;
        const S33 = 16;
        const S34 = 23;
        const S41 = 6;
        const S42 = 10;
        const S43 = 15;
        const S44 = 21;

        str = utf8_encode(str);
        x = convertToWordArray(str);
        a = 0x67452301;
        b = 0xefcdab89;
        c = 0x98badcfe;
        d = 0x10325476;

        xl = x.length;
        for (k = 0; k < xl; k += 16) {
            AA = a;
            BB = b;
            CC = c;
            DD = d;
            a = _FF(a, b, c, d, x[k + 0], S11, 0xd76aa478);
            d = _FF(d, a, b, c, x[k + 1], S12, 0xe8c7b756);
            c = _FF(c, d, a, b, x[k + 2], S13, 0x242070db);
            b = _FF(b, c, d, a, x[k + 3], S14, 0xc1bdceee);
            a = _FF(a, b, c, d, x[k + 4], S11, 0xf57c0faf);
            d = _FF(d, a, b, c, x[k + 5], S12, 0x4787c62a);
            c = _FF(c, d, a, b, x[k + 6], S13, 0xa8304613);
            b = _FF(b, c, d, a, x[k + 7], S14, 0xfd469501);
            a = _FF(a, b, c, d, x[k + 8], S11, 0x698098d8);
            d = _FF(d, a, b, c, x[k + 9], S12, 0x8b44f7af);
            c = _FF(c, d, a, b, x[k + 10], S13, 0xffff5bb1);
            b = _FF(b, c, d, a, x[k + 11], S14, 0x895cd7be);
            a = _FF(a, b, c, d, x[k + 12], S11, 0x6b901122);
            d = _FF(d, a, b, c, x[k + 13], S12, 0xfd987193);
            c = _FF(c, d, a, b, x[k + 14], S13, 0xa679438e);
            b = _FF(b, c, d, a, x[k + 15], S14, 0x49b40821);
            a = _GG(a, b, c, d, x[k + 1], S21, 0xf61e2562);
            d = _GG(d, a, b, c, x[k + 6], S22, 0xc040b340);
            c = _GG(c, d, a, b, x[k + 11], S23, 0x265e5a51);
            b = _GG(b, c, d, a, x[k + 0], S24, 0xe9b6c7aa);
            a = _GG(a, b, c, d, x[k + 5], S21, 0xd62f105d);
            d = _GG(d, a, b, c, x[k + 10], S22, 0x2441453);
            c = _GG(c, d, a, b, x[k + 15], S23, 0xd8a1e681);
            b = _GG(b, c, d, a, x[k + 4], S24, 0xe7d3fbc8);
            a = _GG(a, b, c, d, x[k + 9], S21, 0x21e1cde6);
            d = _GG(d, a, b, c, x[k + 14], S22, 0xc33707d6);
            c = _GG(c, d, a, b, x[k + 3], S23, 0xf4d50d87);
            b = _GG(b, c, d, a, x[k + 8], S24, 0x455a14ed);
            a = _GG(a, b, c, d, x[k + 13], S21, 0xa9e3e905);
            d = _GG(d, a, b, c, x[k + 2], S22, 0xfcefa3f8);
            c = _GG(c, d, a, b, x[k + 7], S23, 0x676f02d9);
            b = _GG(b, c, d, a, x[k + 12], S24, 0x8d2a4c8a);
            a = _HH(a, b, c, d, x[k + 5], S31, 0xfffa3942);
            d = _HH(d, a, b, c, x[k + 8], S32, 0x8771f681);
            c = _HH(c, d, a, b, x[k + 11], S33, 0x6d9d6122);
            b = _HH(b, c, d, a, x[k + 14], S34, 0xfde5380c);
            a = _HH(a, b, c, d, x[k + 1], S31, 0xa4beea44);
            d = _HH(d, a, b, c, x[k + 4], S32, 0x4bdecfa9);
            c = _HH(c, d, a, b, x[k + 7], S33, 0xf6bb4b60);
            b = _HH(b, c, d, a, x[k + 10], S34, 0xbebfbc70);
            a = _HH(a, b, c, d, x[k + 13], S31, 0x289b7ec6);
            d = _HH(d, a, b, c, x[k + 0], S32, 0xeaa127fa);
            c = _HH(c, d, a, b, x[k + 3], S33, 0xd4ef3085);
            b = _HH(b, c, d, a, x[k + 6], S34, 0x4881d05);
            a = _HH(a, b, c, d, x[k + 9], S31, 0xd9d4d039);
            d = _HH(d, a, b, c, x[k + 12], S32, 0xe6db99e5);
            c = _HH(c, d, a, b, x[k + 15], S33, 0x1fa27cf8);
            b = _HH(b, c, d, a, x[k + 2], S34, 0xc4ac5665);
            a = _II(a, b, c, d, x[k + 0], S41, 0xf4292244);
            d = _II(d, a, b, c, x[k + 7], S42, 0x432aff97);
            c = _II(c, d, a, b, x[k + 14], S43, 0xab9423a7);
            b = _II(b, c, d, a, x[k + 5], S44, 0xfc93a039);
            a = _II(a, b, c, d, x[k + 12], S41, 0x655b59c3);
            d = _II(d, a, b, c, x[k + 3], S42, 0x8f0ccc92);
            c = _II(c, d, a, b, x[k + 10], S43, 0xffeff47d);
            b = _II(b, c, d, a, x[k + 1], S44, 0x85845dd1);
            a = _II(a, b, c, d, x[k + 8], S41, 0x6fa87e4f);
            d = _II(d, a, b, c, x[k + 15], S42, 0xfe2ce6e0);
            c = _II(c, d, a, b, x[k + 6], S43, 0xa3014314);
            b = _II(b, c, d, a, x[k + 13], S44, 0x4e0811a1);
            a = _II(a, b, c, d, x[k + 4], S41, 0xf7537e82);
            d = _II(d, a, b, c, x[k + 11], S42, 0xbd3af235);
            c = _II(c, d, a, b, x[k + 2], S43, 0x2ad7d2bb);
            b = _II(b, c, d, a, x[k + 9], S44, 0xeb86d391);
            a = addUnsigned(a, AA);
            b = addUnsigned(b, BB);
            c = addUnsigned(c, CC);
            d = addUnsigned(d, DD);
        }

        const temp = wordToHex(a) + wordToHex(b) + wordToHex(c) + wordToHex(d);

        return temp.toLowerCase();
    },
    /* eslint-enable */

    /**
     * Formats a (complete or not) phone number (a serie of only digits)
     * to a more "traditional" output. With an entry of '5551112222',
     * returns '(555) 111-2222'. Will format the phone number even if
     * it is not yet complete, so '5551112' will return '(514) 111-2'.
     *
     * @param {string} number
     * @return {string}
     */
    formatPhoneNumber(strNumber = '', format = '(XXX) XXX-XXXX') {
        let numberCursor = 0;
        let formatted = '';
        let parenCount = 0;
        let charIsNumber;
        let character;
        // Convert number to a string
        const number = !isString(strNumber) ? `${strNumber || ''}` : strNumber;

        // If no number was given, return empty string
        if (number.length === 0) {
            return formatted;
        }

        // If the input number has any non-digit character, return it unchanged
        if (number.match(/[^0-9]/)) {
            return number;
        }

        // If we have more digits in the number than what the format accepts,
        // we do not format the number
        const formatNbDigits = (format.match(/X/gi) || []).length;
        const numberNbDigits = number.length;

        // We pass each caracter in the format. If it is a 9 (number
        // placeholder), we add the next digit in number to the formatted
        // output. Else, we add the character
        for (let i = 0; i < format.length; i += 1) {
            character = format[i];
            charIsNumber = character === 'X';

            // If it is not a number, we add it to the format
            if (!charIsNumber) {
                // For parenthesis, we keep the count to later close any
                // opened parenthesis
                if (character === '(') {
                    parenCount += 1;
                }

                if (character === ')') {
                    parenCount -= 1;
                }

                formatted += character;
            } else {
                // It is a number. If we don't have any more digit left, we stop here
                if (numberCursor >= number.length) {
                    break;
                }
                formatted += number[numberCursor];
                numberCursor += 1;
            }
        }

        // Close any still opened parenthesis
        if (parenCount > 0) {
            formatted += Array(parenCount + 1).join(')');
        }

        if (numberNbDigits > formatNbDigits) {
            formatted += number.substr(formatNbDigits);
        }

        return formatted;
    },

    /**
     * Anonymizes a phone number to show "in clear" only the last part.
     * Examples :
     * (514) => (514)
     * (514) 555- => (***) 555-
     * (514) 555-1234 => (***) ***-1234
     * 5551112222333 => *********2333
     *
     * @param {string} number
     * @param {string} Optionnal. The placeholder to use (defaults to '•')
     * @return {string}
     */
    anonymizePhoneNumber(strNumber, placeholder = '•') {
        const number = `${strNumber || ''}`;
        const maxClearDigits = 4;
        let anonymized = number;
        let digitGroup;
        let placeholders;
        let digitsToKeep;

        if (number.length === 0) {
            return anonymized;
        }

        // We split the number into digit groups
        const digitGroups = number.match(/([0-9]+)/g);

        for (let i = 0; i < digitGroups.length; i += 1) {
            digitGroup = digitGroups[i];

            // If this is the last group, we don't anonymize it, unless
            // its length is greater than maxClearDigits, where we will keep
            // only the last maxClearDigits digits in clear.
            if (i === digitGroups.length - 1) {
                if (digitGroup.length > maxClearDigits) {
                    placeholders = Array(digitGroup.length - maxClearDigits + 1).join(placeholder);
                    digitsToKeep = digitGroup.substring(digitGroup.length - maxClearDigits);
                    // The replace() function replaces only the
                    // first occurence, which is what we want
                    anonymized = anonymized.replace(digitGroup, placeholders + digitsToKeep);
                }
            } else {
                // We replace the digit group with placeholders
                placeholders = Array(digitGroup.length + 1).join(placeholder);
                // The replace() function replaces only the first occurence, which is what we want
                anonymized = anonymized.replace(digitGroup, placeholders);
            }
        }

        return anonymized;
    },

    rad(x) {
        return (x * Math.PI) / 180;
    },

    getDistance(p1, p2) {
        const R = 6378137;
        const dLat = Utils.rad(p2.lat() - p1.lat());
        const dLong = Utils.rad(p2.lng() - p1.lng());
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(Utils.rad(p1.lat())) *
                Math.cos(Utils.rad(p2.lat())) *
                Math.sin(dLong / 2) *
                Math.sin(dLong / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const d = R * c;
        return d;
    },
};

export default Utils;
