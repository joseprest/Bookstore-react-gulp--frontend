var basePath = require('../../utils/Tests').jsBasePath;
var Clock = require(basePath('lib/clock'));

/**
 * Acceptable error between to dates that should be equal
 * (in milliseconds)
 * @type {Number}
 */
var epsilon = 50;

describe('Clock (tests with timeouts, be patient !)', function() {
    describe('update event', function() {
        it('called without a delay', function(done) {
            var clock = new Clock(),
                delay = clock.getDelay();

            this.timeout(2 * delay);

            checkDelay(clock, delay, done);
        });

        it('called with short delay', function(done) {
            var clock = new Clock(200),
                delay = clock.getDelay();

            this.timeout(2 * delay);

            checkDelay(clock, delay, done);
        });

        it('called with long delay', function(done) {
            var clock = new Clock(2000),
                delay = clock.getDelay();

            this.timeout(2 * delay);

            checkDelay(clock, delay, done);
        });
    });

    describe('#stop', function() {
        it('really stops the timeout', function(done) {
            var clock = new Clock(500),
                delay = clock.getDelay(),
                updateCount = 0;

            this.timeout(4 * clock.getDelay());

            clock.on('update', function() {
                updateCount += 1;

                clock.stop();
            });

            clock.start();

            setTimeout(function() {
                if (updateCount == 1) {
                    done();
                } else {
                    done(new Error('update was emitted more than once'));
                }
            }, 3 * delay);
        });
    });

    describe('#start', function() {
        it('stops before restarting', function(done) {
            var delay = 500,
                clock = new Clock(delay),
                updateCount = 0;

            /*
             * The delay is 500 ms. We start the clock, but after 250 ms
             * (so before any update can be sent), we restart the clock.
             * We then check after 1100ms, only one update should be emitted
             * (the one at 250ms + 500ms = 750ms).
             */

            this.timeout(4 * delay);

            clock.on('update', function() {
                updateCount += 1;
            });

            clock.start();

            // Restart after 250ms
            setTimeout(function() {
                clock.start();
            }, delay/2);

            // At the end of 1100ms
            setTimeout(function() {
                clock.stop();

                if (updateCount == 1) {
                    done();
                } else {
                    done(new Error('update was emitted more than 1 time (' + updateCount + ' times)'));
                }
            }, delay * 2 + 100);
        });

        it('accepts initial time (3 update checks)', function(done) {
            var clock = new Clock(1000),
                delay = clock.getDelay(),
                initialTime = new Date(1983, 4, 4, 6, 59, 0, 0),
                maxUpdates = 3,
                updateCount = 0;

            this.timeout(maxUpdates * delay + delay/2);

            clock.on('update', function(newTime) {
                updateCount += 1;

                if (datesAreEqual(initialTime, newTime, updateCount * delay)) {
                    if (updateCount == maxUpdates) {
                        clock.stop();
                        done();
                    }
                } else {
                    var newDate = new Date(newTime);
                    done(new Error('Difference between dates is not ' + updateCount * delay + 'ms: (' + initialTime + ') and (' + newDate + ')'));
                }
            });

            clock.start(initialTime.getTime());
        });
    });
});

function checkDelay(clock, delay, done)
{
    var startTime = new Date();

    clock.on('update', function() {
        var endTime = new Date();

        clock.stop();

        if (datesAreEqual(startTime, endTime, delay)) {
            done();
        } else {
            done(new Error('Difference between dates'));
        }
    });

    clock.start();
}

function datesAreEqual(date1, date2, delay)
{
    if (typeof delay === 'undefined') {
        delay = 0;
    }

    var time1 = (typeof date1 == 'number') ? date1 : date1.getTime(),
        time2 = (typeof date2 == 'number') ? date2 : date2.getTime(),
        timeDiff = Math.abs(time2 - time1),
        diff = Math.abs(timeDiff - delay);

    return diff < epsilon;
}
