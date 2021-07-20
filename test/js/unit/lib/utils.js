var should = require('should');
var basePath = require('../../utils/Tests').jsBasePath;
var Utils = require(basePath('lib/utils'));

describe('utils', function() {
    describe('#formatPhoneNumber', function() {
        it('returns empty without numbers', function() {
            var result;

            result = Utils.formatPhoneNumber('');
            should(result).be.String().and.be.empty();

            result = Utils.formatPhoneNumber();
            should(result).be.String().and.be.empty();

            result = Utils.formatPhoneNumber(null);
            should(result).be.String().and.be.empty();
        });
        
        it('formats with partial phone number', function() {
            var datas = [
                ['5', '(5)'],
                ['51', '(51)'],
                ['514', '(514) '],
                ['5142', '(514) 2'],
                ['51422', '(514) 22'],
                ['514222', '(514) 222-'],
                ['51422232', '(514) 222-32'],
            ];

            datas.forEach(function(data) {
                var input = data[0],
                    expected = data[1],
                    result = Utils.formatPhoneNumber(input);

                should(result).be.equal(expected);
            });
        });
        
        it('formats with full phone number', function() {
            var expected = '(514) 555-1234',
                result = Utils.formatPhoneNumber('5145551234');

            should(result).be.equal(expected);
        });
        
        it('fallsback if non-digits characters', function() {
            var invalid = '514.5551234',
                expected = invalid,
                result = Utils.formatPhoneNumber(invalid);

            should(result).be.equal(expected);
        });
        
        it('fallsback if longer string', function() {
            var expected = '51455511119',
                result = Utils.formatPhoneNumber('51455511119');

            should(result).be.equal(expected);
        });
        
        it('accepts int phone number', function() {
            var expected = '(514) 555-1234',
                result = Utils.formatPhoneNumber(5145551234);

            should(result).be.equal(expected);
        });
        
        it('works with 0', function() {
            var expected = '(0)',
                result = Utils.formatPhoneNumber(0);

            should(result).be.equal(expected);
        });
    });

    describe('#anonymizePhoneNumber', function() {
        it('doesn\'t anonymize if only 1 block', function() {
            var datas = [
                ['1234', '1234'],
                ['(555)', '(555)'],
                ['(514) ', '(514) ']
            ];

            datas.forEach(function(data) {
                var input = data[0],
                    expected = data[1],
                    result = Utils.anonymizePhoneNumber(input, '*');

                should(result).be.equal(expected);
            });
        });

        it('anonymizes only first blocks', function() {
            var datas = [
                ['(514) ', '(514) '],
                ['(514) 2', '(***) 2'],
                ['(514) 222-', '(***) 222-'],
                ['(514) 222-5555', '(***) ***-5555']
            ];

            datas.forEach(function(data) {
                var input = data[0],
                    expected = data[1],
                    result = Utils.anonymizePhoneNumber(input, '*');

                should(result).be.equal(expected);
            });
        });

        it('works with multiple groups of same digits', function() {
            var number = '(555) 555-',
                expected = '(***) 555-',
                result = Utils.anonymizePhoneNumber(number, '*');

            should(result).be.equal(expected);
        });

        it('doesn\'t anonymize last digits if long number', function() {
            var datas = [
                ['123456789', '*****6789'],
                ['(514) 123-456789012', '(***) ***-*****9012'],
            ];

            datas.forEach(function(data) {
                var input = data[0],
                    expected = data[1],
                    result = Utils.anonymizePhoneNumber(input, '*');

                should(result).be.equal(expected);
            });
        });

        it('uses placeholder', function() {
            var number = '(514) 222-3223',
                expected = '(aaa) aaa-3223',
                result = Utils.anonymizePhoneNumber(number, 'a');

            should(result).be.equal(expected);
        });

        it('doesn\'t require placeholder', function() {
            var number = '(514) 222-3223',
                result = Utils.anonymizePhoneNumber(number);

            should(result).be.String();
            should(result.length).be.equal(number.length);
        });
    });
});
