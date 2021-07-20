import createDebug from 'debug';

const debug = createDebug('manivelle:timeline:data');

class Timeline {
    static getTodayTime() {
        const today = new Date();
        today.setHours(0);
        today.setMinutes(0);
        today.setSeconds(0);
        return today.getTime();
    }

    static getTimelineWithAdjustedCycles(timeline, clock) {
        const foundCycle = timeline.some((cycle) => {
            const startTime = cycle.start * 1000;
            const endTime = cycle.end * 1000;
            return clock >= startTime && clock < endTime;
        });
        if (foundCycle) {
            return timeline;
        }

        debug('Timeline cycles need adjustment.');

        const startTime = Timeline.getTodayTime();
        const endTime = startTime + 24 * 3600 * 1000;
        const il = timeline.length;
        const durations = {};
        const newTimeline = [];
        let currentTime = startTime;
        let cycleIndex = 0;
        while (currentTime <= endTime) {
            const currentCycle = timeline[cycleIndex];
            if (typeof durations[cycleIndex] === 'undefined') {
                // prettier-ignore
                durations[cycleIndex] = currentCycle.items.reduce((sum, it) => (
                    sum + it.duration
                ), 0) * 1000;
            }
            const duration = durations[cycleIndex];
            newTimeline.push({
                ...currentCycle,
                start: currentTime,
                end: currentTime + duration,
            });

            cycleIndex = cycleIndex === il - 1 ? 0 : cycleIndex;
            currentTime += duration;
        }

        return newTimeline;
    }

    static getCycleIndex(timeline, clock) {
        if (!timeline || !timeline.length) {
            return null;
        }

        return timeline.reduce((cycleIndex, cycle, i) => {
            const startTime = cycle.start * 1000;
            const endTime = cycle.end * 1000;
            return clock >= startTime && clock < endTime ? i : cycleIndex;
        }, 0);
    }

    static getCycleBubbleIndex(timeline, clock, cycleIndex) {
        if (!timeline || !timeline.length) {
            return 0;
        }

        const { start, items: cycleItems = [] } = timeline[cycleIndex];
        const itemsDuration = cycleItems.reduce((total, { duration = 0 }) => total + duration, 0);
        const delta = clock / 1000 - start;
        const position = delta % itemsDuration;

        // Find the item covering this position
        const { index } = cycleItems.reduce(
            (state, { duration = 0 }, newIndex) => (state.currentPosition > position
                ? state
                : {
                    index: newIndex,
                    currentPosition: state.currentPosition + duration,
                }),
            {
                index: 0,
                currentPosition: 0,
            },
        );

        return index;
    }

    static getTimelineStartAndEndTime(timeline) {
        return timeline.reduce(({ startTime, endTime }, cycle) => ({
            startTime: cycle.start * 1000 < startTime ? cycle.start * 1000 : startTime,
            endTime: cycle.end * 1000 > endTime ? cycle.end * 1000 : endTime,
        }), {
            startTime: 0,
            endTime: 0,
        });
    }

    constructor({ data, timeline = null }) {
        this.data = data;
        this.timeline = timeline;
        this.adjustedTimeline = null;

        const { startTime, endTime } = Timeline.getTimelineStartAndEndTime(timeline);
        this.timelineStartTime = startTime;
        this.timelineStartTime = endTime;
    }

    setTimeline(timeline = null) {
        this.timeline = timeline;
        this.adjustedTimeline = null;
        const { startTime, endTime } = Timeline.getTimelineStartAndEndTime(timeline);
        this.timelineStartTime = startTime;
        this.timelineStartTime = endTime;
    }

    createAdjustedTimeline(clock) {
        this.adjustedTimeline = Timeline.getTimelineWithAdjustedCycles(this.timeline, clock);
        const { startTime, endTime } = Timeline.getTimelineStartAndEndTime(this.adjustedTimeline);
        this.timelineStartTime = startTime;
        this.timelineStartTime = endTime;
    }

    getCycleBubbles(timeline, cycleIndex) {
        const { data } = this;
        return timeline === null || !timeline.length
            ? data.getBubbles()
            : data.getBubblesByTimelineCycle(cycleIndex);
    }

    getStateFromClock(clock) {
        if (clock < this.timelineStartTime || clock > this.timelineEndTime) {
            debug('Create adjusted timeline.');
            this.createAdjustedTimeline(clock);
        } else if (this.adjustedTimeline !== null) {
            this.adjustedTimeline = null;
        }
        const timeline = this.adjustedTimeline || this.timeline;
        const cycleIndex = Timeline.getCycleIndex(timeline, clock);
        const bubbles = this.getCycleBubbles(timeline, cycleIndex);
        const bubbleIndex = Timeline.getCycleBubbleIndex(timeline, clock, cycleIndex);
        return {
            cycleIndex,
            bubbles,
            bubbleIndex,
        };
    }
}

export default Timeline;
