import EventEmitter from 'wolfy87-eventemitter';

const DEFAULT_DELAY = 1000;

/**
 * Object to retrieve the time. Starts with an initial time
 * (leave empty for current time) and triggers an 'update'
 * event at each delay with the new time.
 *
 * @param {undefined|int} delay Delay in milliseconds to emit each 'update'
 */
class Clock extends EventEmitter {
    constructor(delay = DEFAULT_DELAY) {
        super();

        this.delay = delay;
        this.initialTime = null;
        this.interval = null;
        this.startDate = null;

        this.onInterval = this.onInterval.bind(this);
    }

    /**
     * Starts the clock. Will emit 'update' at each delay.
     * You can pass an initial time. If not defined, uses the
     * current time.
     *
     * @param  {undefined|int} initialTime As returned by Date.getTime()
     */
    start(initialTime) {
        if (this.interval) {
            this.stop();
        }

        this.startTime = new Date().getTime();
        this.initialTime = parseInt(initialTime || this.startTime, 10);
        this.interval = setInterval(this.onInterval, this.getDelay());
    }

    /**
     * Stops the emition of 'update' events.
     */
    stop() {
        if (!this.interval) {
            return;
        }

        clearInterval(this.interval);
        this.interval = null;
    }

    /**
     * Returns the delay used between each 'update' events in miliseconds.
     *
     * @return {int} Delay, in miliseconds
     */
    getDelay() {
        return this.delay;
    }

    /**
     * Internal function that emits the 'update' event with
     * the new time.
     */
    onInterval() {
        const currentTime = new Date().getTime();
        const elapsedTime = currentTime - this.startTime;
        const newTime = this.initialTime + elapsedTime;

        this.emit('update', newTime);
    }
}

export default Clock;
