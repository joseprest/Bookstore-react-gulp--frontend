var should = require('should');
var basePath = require('../../utils/Tests').jsBasePath;
var Colors = require(basePath('lib/colors'));
var palettes = require(basePath('lib/color-palettes'));

describe('Colors', function() {
    describe('#ensurePaletteName',function() {
        var defaultPaletteName = Colors.defaultPaletteName;

        it('returns default when receiving undefined', function() {
            should(Colors.ensurePaletteName()).equal(Colors.defaultPaletteName);
        });

        it('returns default when receiving invalid', function() {
            should(Colors.ensurePaletteName('--invalid--')).equal(Colors.defaultPaletteName);
        });

        it('returns palette name when valid', function() {
            var testName;

            // We find a valid palette name
            for (var name in palettes) {
                if (name != defaultPaletteName) {
                    testName = name;
                    break;
                }
            }

            should(Colors.ensurePaletteName(testName)).equal(testName);
        });

        it('works with null and false', function() {
            should(Colors.ensurePaletteName(null)).equal(Colors.defaultPaletteName);
            should(Colors.ensurePaletteName(false)).equal(Colors.defaultPaletteName);
        });
    });

    describe('#getNextColor', function() {
        var result = '',
            testPalette = [
                '#aaa',
                '#bbb',
                '#ccc'
            ],
            type = 'testType',
            palette = 'test-palette';

        palettes[palette] = testPalette;

        it('returns the first color the first time', function() {
            result = Colors.getNextColor(type, palette);
            should(result).equal(testPalette[0]);
        });

        it('returns the second color the second time', function() {
            result = Colors.getNextColor(type, palette);
            should(result).equal(testPalette[1]);
        });

        it('cycles', function() {
            var lastColor;
            for (var i=2; i<testPalette.length + 1; i++) {
                lastColor = Colors.getNextColor(type, palette);
            }
            should(lastColor).equal(testPalette[0]);
        });

        it('a different type restarts cursor', function() {
            result = Colors.getNextColor(type + 'other', palette);
            should(result).equal(testPalette[0]);
        });
    });

    describe('#get', function() {
        var result = '',
            type = 'typeTest',
            key = 'keyTest',
            palette = 'testPalette',
            testPalette = [
                '#aaa',
                '#bbb',
                '#ccc'
            ];

        palettes[palette] = testPalette;

        it('returns new color the first time', function() {
            result = Colors.get(type, key, palette);
            should(result).equal(testPalette[0]);
        });

        it('returns the same color the second time', function() {
            result = Colors.get(type, key, palette);
            should(result).equal(testPalette[0]);
        });

        it('works with different key', function() {
            var otherKey = key + 'other';

            result = Colors.get(type, otherKey, palette);
            should(result).equal(testPalette[1]);
            
            result = Colors.get(type, otherKey, palette);
            should(result).equal(testPalette[1]);
        });

        it('works with different type', function() {
            var otherType = type + 'other';

            result = Colors.get(otherType, key, palette);
            should(result).equal(testPalette[0]);

            result = Colors.get(otherType, key, palette);
            should(result).equal(testPalette[0]);
        });

        it('cycles', function() {
            Colors.get(type, 'test-other-1', palette);
            result = Colors.get(type, 'test-other-2', palette);
            should(result).equal(testPalette[0]);
        });

        it('works with different palette', function() {
            var otherPalette = [
                '#abc'
            ];
            palettes['test-other'] = otherPalette;
            result = Colors.get(type, key, 'test-other');
            should(result).equal(otherPalette[0]);

            // Test still works with other color
            result = Colors.get(type, key, palette);
            should(result).equal(testPalette[0]);
        });

        it('uses default if without a palette name', function() {
            var defaultColors = palettes[Colors.defaultPaletteName];

            result = Colors.get(type, key);
            should(result).equal(defaultColors[0]);
        });
    });
})