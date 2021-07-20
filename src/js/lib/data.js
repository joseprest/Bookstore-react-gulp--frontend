/* eslint-disable no-underscore-dangle */
import EventEmitter from 'wolfy87-eventemitter';
import createDebug from 'debug';
import moment from 'moment-timezone';
import _ from 'lodash';

const debug = createDebug('manivelle:data');
const debugBubbles = createDebug('manivelle:data:bubbles');
const debugChannels = createDebug('manivelle:data:channels');
const debugTimeline = createDebug('manivelle:data:timeline');

class Data extends EventEmitter {
    static shouldSkipBubble(bubble, now = new Date()) {
        const categoryLabel = _.get(bubble, 'fields.category.value');
        const categoryFilter = _.get(bubble, 'filters.category');
        if (
            (categoryLabel && categoryLabel === 'Romans sentimentaux') ||
            (categoryFilter && categoryFilter === 'romance')
        ) {
            return true;
        }
        if (bubble.type === 'event') {
            const startDate = _.get(bubble, 'fields.date.daterange.start', null) || null;
            let startDateObj = _.get(bubble, 'fields.date.moment.start', null) || null;
            const endDate = _.get(bubble, 'fields.date.daterange.end', null) || null;
            let endDateObj = _.get(bubble, 'fields.date.moment.end', null) || null;
            if (
                startDate !== null ||
                startDateObj !== null ||
                endDate !== null ||
                endDateObj !== null
            ) {
                if (startDate !== null && startDateObj === null) {
                    startDateObj = moment(startDate, 'YYYY-MM-DD hh:mm:ss');
                }
                if (endDate !== null && endDateObj === null) {
                    endDateObj = moment(endDate, 'YYYY-MM-DD hh:mm:ss');
                }
                return (
                    (startDateObj === null || startDateObj.diff(now, 'days') <= -1) &&
                    (endDateObj === null || endDateObj.diff(now, 'days') <= -1)
                );
            }
        }
        return false;
    }

    constructor(opts) {
        super();
        this._options = _.extend(
            {
                minImageSize: 0.5,
                ignoreBubblelessFilterValues: true,
                ignoreSmallPicturesBubbleForEmptyTimeline: false,
                screenWidth: 1,
                screenHeight: 1,
            },
            opts,
        );

        this._bubbles = [];
        this._channels = [];
        this._timeline = [];
        this._timelineRaw = [];
        this._bubblesCount = 0;
        this._channelsCount = 0;
        this._timelineCyclesCount = 0;
        this._bubblesMap = {};
        this._channelsMap = {};
        this._bubblesByChannelMap = {};
        this._bubblesByTimelineCycleMap = {};
        this._channelsFiltersMap = {};
        this._removeSkippedBubblesTime = null;

        this.triggerChange = _.debounce(this.triggerChange.bind(this), 10);
    }

    setBubbles(bubbles) {
        debug('Setting bubbles...');

        const bubblesMap = {};
        let bubble;
        let id;
        const newBubbles = [];
        let i;
        let il;
        let key;
        let field;
        let dateKey;
        let date;
        // let validBubble;
        // let picture;
        let skipped = 0;
        const emptyArray = [];
        const now = new Date();
        for (i = 0, il = bubbles.length; i < il; i += 1) {
            bubble = _.cloneDeep(bubbles[i]);
            id = bubble.id;

            if (Data.shouldSkipBubble(bubble, now)) {
                skipped += 1;
                // debugBubbles('Skip bubble #'+id+' because is in romance category');
                continue;
            }

            /* eslint-disable guard-for-in */
            const keys =
                typeof bubble.fields !== 'undefined' ? Object.keys(bubble.fields) : emptyArray;
            for (let ii = 0, iil = keys.length; ii < iil; ii += 1) {
                key = keys[ii];
                field = bubble.fields[key];
                if (field && field.type === 'date') {
                    _.set(
                        bubble,
                        `fields.${key}.moment`,
                        moment(field.date, 'YYYY-MM-DD hh:mm:ss'),
                    );
                } else if (field && field.type === 'daterange') {
                    _.set(bubble, `fields.${key}.moment`, {});
                    let dateKeys =
                        typeof field.daterange !== 'undefined'
                            ? Object.keys(field.daterange)
                            : emptyArray;
                    for (let iii = 0, iiil = dateKeys.length; iii < iiil; iii += 1) {
                        dateKey = dateKeys[iii];
                        date = field.daterange[dateKey];
                        _.set(
                            bubble,
                            `fields.${key}.moment.${dateKey}`,
                            moment(date, 'YYYY-MM-DD hh:mm:ss'),
                        );
                    }
                    dateKeys =
                        typeof field.date !== 'undefined' ? Object.keys(field.date) : emptyArray;
                    for (let iii = 0, iiil = dateKeys.length; iii < iiil; iii += 1) {
                        dateKey = dateKeys[iii];
                        // compatibility with old json
                        date = field.date[dateKey];
                        _.set(
                            bubble,
                            `fields.${key}.moment.${dateKey}`,
                            moment(date, 'YYYY-MM-DD hh:mm:ss'),
                        );
                    }
                }
            }

            bubblesMap[id] = bubble;
            newBubbles.push(bubble);
        }
        this._removeSkippedBubblesTime = moment(now);
        this._bubblesMap = bubblesMap;
        this._bubbles = newBubbles;
        this._bubblesCount = newBubbles.length;

        this.updateChannels();
        this.updateTimeline();

        debug(`${this._bubblesCount} bubbles setted and ${skipped} skipped.`);

        this.triggerChange();

        /* var timelineAll = _.get(this._timeline, '0.id', '') === 'all';
        if(!this._timelineCyclesCount || timelineAll)
        {
            this.setTimeline(this.createEmptyTimeline());
        } */
    }

    removeSkippedBubbles() {
        const now = new Date();
        const nowDate = moment(now);
        if (
            this._removeSkippedBubblesTime !== null &&
            this._removeSkippedBubblesTime.format('YYYY-MM-DD') === nowDate.format('YYYY-MM-DD')
        ) {
            return;
        }
        debug('Removing skipped bubbles...');
        const { _bubbles: bubbles } = this;
        const bubblesMap = {};
        let bubble;
        let id;
        const newBubbles = [];
        let skipped = 0;
        for (let i = 0, il = bubbles.length; i < il; i += 1) {
            bubble = bubbles[i];
            if (Data.shouldSkipBubble(bubble, now)) {
                skipped += 1;
            } else {
                bubblesMap[id] = bubble;
                newBubbles.push(bubble);
            }
        }
        this._removeSkippedBubblesTime = nowDate;
        this._bubblesMap = bubblesMap;
        this._bubbles = newBubbles;
        this._bubblesCount = newBubbles.length;

        this.updateChannels();
        this.updateTimeline();

        debug(`${skipped} bubbles removed.`);

        this.triggerChange();
    }

    triggerChange() {
        debug('Trigger change event');
        this.trigger('change');
    }

    setChannels(channels) {
        debug('Setting channels...');

        const channelsMap = {};
        const channelsCount = channels.length;
        let channel;
        let id;
        for (let i = 0; i < channelsCount; i += 1) {
            channel = channels[i];
            id = channel.id;
            channelsMap[id] = channel;
        }
        this._channelsMap = channelsMap;
        this._channels = channels;
        this._channelsCount = channelsCount;

        this.updateChannels();

        debug(`${channelsCount} channels setted.`);

        this.triggerChange();
    }

    setTimeline(timeline) {
        debug('Setting timeline...');

        this._timelineRaw = timeline || [];

        this.updateTimeline();

        debug(`${this._timelineCyclesCount} timeline cycles setted.`);

        this.triggerChange();
    }

    updateChannels() {
        debugChannels('Updating channels...');
        this.mapBubblesByChannels();
        this.mapChannelsFilters();
        debugChannels('Channels updated.');
    }

    updateTimeline(timelineRaw, generatedTimeline) {
        if (typeof timelineRaw === 'undefined') {
            timelineRaw = this._timelineRaw;
        }

        if (typeof generatedTimeline === 'undefined') {
            generatedTimeline = false;
        }

        debugTimeline(`Updating ${generatedTimeline ? 'auto-generated' : ''} timeline...`);

        this._timeline = this.ensureTimelineCycleItemsExists(timelineRaw);
        this._timelineCyclesCount = this._timeline.length;

        if (!this._timelineCyclesCount && !generatedTimeline) {
            debugTimeline('Timeline is empty. Creating auto-generated...');
            const emptyTimeline = this.createEmptyTimeline();
            this.updateTimeline(emptyTimeline, true);
            return;
        }

        this.mapBubblesByTimelineCycles();

        debugTimeline('Timeline updated.');
    }

    createEmptyTimeline() {
        const items = [];

        const shuffledBubbles = _.shuffle(this._bubbles);

        for (let i = 0, il = shuffledBubbles.length; i < il; i += 1) {
            const bubble = shuffledBubbles[i];
            let validBubble = true;

            if (this._options.ignoreSmallPicturesBubbleForEmptyTimeline) {
                const widthRatio =
                    _.get(bubble, 'snippet.picture.width', 0) / this._options.screenWidth;
                const heightRatio =
                    _.get(bubble, 'snippet.picture.height', 0) / this._options.screenHeight;
                validBubble =
                    widthRatio >= this._options.minImageSize ||
                    heightRatio >= this._options.minImageSize;
            }

            if (validBubble) {
                items.push({
                    bubble_id: bubble.id,
                    duration: process.env.NODE_ENV !== 'production' ? 10 : 5,
                });
            }
        }

        debugTimeline(
            `Created default timeline cycle: ${items.length}/${shuffledBubbles.length} bubbles.`,
        );

        return [
            {
                start: new Date().getTime() / 1000,
                end: null,
                id: 'all',
                items: _.shuffle(items),
            },
        ];
    }

    ensureTimelineCycleItemsExists(timeline) {
        debugTimeline('Ensuring all timeline bubbles exists...');

        let notFound = 0;
        const newTimeline = [];
        let cycle;
        let newItems;
        let it;
        for (let i = 0, l = timeline.length; i < l; i += 1) {
            cycle = _.cloneDeep(timeline[i]);

            newItems = [];
            for (let ii = 0, il = cycle.items.length; ii < il; ii += 1) {
                it = cycle.items[ii];
                if (this._bubblesMap[it.bubble_id]) {
                    newItems.push(it);
                } else {
                    notFound += 1;
                    debugTimeline(`Bubble #${it.bubble_id} not found in timeline`);
                }
            }
            cycle.items = newItems;
            newTimeline.push(cycle);
        }

        debugTimeline(`Timeline has ${notFound} bubble(s) not found.`);

        return newTimeline;
    }

    mapBubblesByTimelineCycles() {
        const bubblesByTimelineCycleMap = {};
        let cycle;
        let bubble;
        let bubbleId;
        let id;
        for (let i = 0; i < this._timelineCyclesCount; i += 1) {
            cycle = this._timeline[i];
            id = i;
            if (!bubblesByTimelineCycleMap[id]) {
                bubblesByTimelineCycleMap[id] = [];
            }
            for (let ii = 0, il = cycle.items.length; ii < il; ii += 1) {
                bubbleId = cycle.items[ii].bubble_id;
                bubble = this._bubblesMap[bubbleId] || null;
                if (bubble) {
                    bubblesByTimelineCycleMap[id].push(bubble);
                }
            }
        }
        this._bubblesByTimelineCycleMap = bubblesByTimelineCycleMap;
    }

    mapBubblesByChannels() {
        debugChannels('Mapping bubbles by channel...');

        const bubblesByChannelMap = {};
        const bubblesIdsByChannelMap = {};

        let bubble;
        let channelId;
        let id;
        for (let i = 0; i < this._bubblesCount; i += 1) {
            bubble = this._bubbles[i];
            id = bubble.id;
            if (!bubble.channel_id) {
                continue;
            }
            channelId = bubble.channel_id;
            if (!bubblesByChannelMap[channelId]) {
                bubblesByChannelMap[channelId] = [];
            }
            if (!bubblesIdsByChannelMap[channelId]) {
                bubblesIdsByChannelMap[channelId] = {};
            }
            if (!bubblesIdsByChannelMap[channelId][bubble.id]) {
                bubblesByChannelMap[channelId].push(bubble);
                bubblesIdsByChannelMap[channelId][bubble.id] = true;
            }
        }

        let notFound = 0;
        let channel;
        let bubblesIds;
        let bubbleId;
        for (let i = 0; i < this._channelsCount; i += 1) {
            channel = this._channels[i];
            channelId = channel.id;

            if (!bubblesByChannelMap[channelId]) {
                bubblesByChannelMap[channelId] = [];
            }
            if (!bubblesIdsByChannelMap[channelId]) {
                bubblesIdsByChannelMap[channelId] = {};
            }

            bubblesIds = _.get(channel, 'bubbles_ids', []);
            for (let ii = 0, l = bubblesIds.length; ii < l; ii += 1) {
                bubbleId = bubblesIds[ii];
                if (!this._bubblesMap[bubbleId]) {
                    notFound += 1;
                    debugChannels(`Bubble #${bubbleId} not found in channel #${channelId}`);
                } else if (!bubblesIdsByChannelMap[channelId][bubbleId]) {
                    bubblesIdsByChannelMap[channelId][bubbleId] = true;
                    bubblesByChannelMap[channelId].push(this._bubblesMap[bubbleId]);
                }
            }
        }

        this._bubblesByChannelMap = bubblesByChannelMap;

        if (notFound) {
            debugChannels(`Bubbles mapped to channel. ${notFound} bubble(s) not found.`);
        } else {
            debugChannels('Bubbles mapped to channel.');
        }
    }

    mapChannelsFilters() {
        const channelFiltersMap = {};
        let channel;
        let filter;
        let id;
        let filters;
        let channelFilters;
        let bubbles;
        for (let i = 0; i < this._channelsCount; i += 1) {
            channel = this._channels[i];
            id = channel.id;
            filters = channel.filters;
            channelFilters = {};
            channelFiltersMap[id] = channelFilters;
            if (!filters) {
                continue;
            }
            for (let ii = 0, fl = filters.length; ii < fl; ii += 1) {
                filter = filters[ii];
                bubbles = this._bubblesByChannelMap[id] || [];
                channelFilters[filter.name] = this.getFilteredBubbles(bubbles, filter);
            }
        }
        this._channelsFiltersMap = channelFiltersMap;
    }

    findChannelByID(id) {
        return this._channelsMap[id] || null;
    }

    findBubbleByID(id) {
        return this._bubblesMap[id] || null;
    }

    getBubblesByChannelID(channelId) {
        this.removeSkippedBubbles();
        const bubbles = this._bubblesByChannelMap[channelId] || [];
        return bubbles;
    }

    getBubblesByTimelineCycle(cycleId) {
        this.removeSkippedBubbles();
        return this._bubblesByTimelineCycleMap[cycleId] || [];
    }

    getFilteredBubbles(bubbles, filter) {
        const filterName = _.get(filter, 'name', null);
        const filterValues = _.get(filter, 'values', null);

        if (filterName === 'all') {
            return [
                {
                    label: _.get(filter, 'label'),
                    bubbles,
                },
            ];
        }

        const filteredBubbles = [];
        const valuesMap = {};

        _.each(filterValues, value => {
            const valueCopy = _.clone(value);
            valueCopy.bubbles = [];
            valueCopy.hasBubble = false;
            filteredBubbles.push(valueCopy);

            if (typeof valueCopy.date !== 'undefined') {
                _.set(valueCopy, 'moment', moment(valueCopy.date, 'YYYY-MM-DD'));
            }

            valuesMap[valueCopy.value] = valueCopy;
        });

        _.each(bubbles, bubble => {
            let filterValue = null;
            let filterValueID = _.get(bubble, `filters.${filterName}`, null);

            if (!_.isArray(filterValueID)) {
                filterValueID = filterValueID ? [filterValueID] : [];
            }

            _.each(filterValueID, valueId => {
                filterValue = valueId && valuesMap[valueId] ? valuesMap[valueId] : null;
                if (filterValue) {
                    filterValue.hasBubble = true;
                    filterValue.bubbles.push(bubble);
                }
            });
        });

        if (!this._options.ignoreBubblelessFilterValues) {
            return filteredBubbles;
        }

        const notEmptyFilteredBubbles = [];

        _.each(filteredBubbles, group => {
            if (group.hasBubble) {
                notEmptyFilteredBubbles.push(group);
            }
        });

        return notEmptyFilteredBubbles;
    }

    getChannelFilter(channelId, filter) {
        const filters = this._channelsFiltersMap[channelId][filter];
        return filters;
    }

    getBubbles() {
        this.removeSkippedBubbles();
        return this._bubbles;
    }

    getChannels() {
        return this._channels;
    }

    getTimeline() {
        return this._timeline;
    }

    getBubblesByIDs(ids) {
        this.removeSkippedBubbles();
        const bubbles = [];
        for (let i = 0, il = ids.length; i < il; i += 1) {
            const id = ids[i];
            if (this._bubblesMap[id]) {
                bubbles.push(this._bubblesMap[id]);
            }
        }

        return bubbles;
    }

    isReady() {
        return !!(this._bubblesCount > 0 && this._channelsCount > 0);
    }
}

export default Data;
