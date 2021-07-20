/* globals ga: true */
import uuid from 'node-uuid';
import slug from 'slug';
import createDebug from 'debug';

const debug = createDebug('manivelle:tracker');

class Tracker {
    static getBubbleLabel(bubble = {}) {
        const { type_name: bubbleTypeName = '', snippet = {} } = bubble;
        const { title: bubbleTitle = '' } = snippet;

        const label = [];
        if (bubbleTypeName && bubbleTypeName.length) {
            label.push(bubbleTypeName);
        }
        if (bubbleTitle && bubbleTitle.length) {
            label.push(bubbleTitle);
        }
        return label.join(' - ');
    }

    static getChannelLabel(channel = {}) {
        const { snippet = {} } = channel;
        const { title: channelTitle = '' } = snippet;

        const label = [];
        if (channelTitle && channelTitle.length) {
            label.push(channelTitle);
        }
        return label.join(' - ');
    }

    constructor(name, opts = {}) {
        this.options = {
            trackingId: 'UA-79618919-4',
            screenId: null,
            ...opts,
        };

        this.name = name;
        this.created = false;

        this.onTrackerReady = this.onTrackerReady.bind(this);

        this.create();
    }

    create() {
        const { name } = this;
        const { trackingId, screenId } = this.options;
        ga('create', {
            trackingId,
            storage: 'none',
            name,
            clientId: uuid.v1(),
        });

        this.created = true;

        debug(`Init tracker ${name} for screen #${screenId}`);

        ga(this.onTrackerReady);
    }

    destroy() {
        const { name } = this;
        ga.remove(name);
        this.tracker = null;
        this.created = false;
    }

    onTrackerReady() {
        const { name } = this;
        this.tracker = ga.getByName(name);

        debug(`Tracker ${name} ready.`);
    }

    send(...args) {
        const { name } = this;
        if (!this.created) {
            this.create();
        }

        if (this.tracker) {
            this.tracker.send(...args);
        } else {
            ga(`${name}.send`, ...args);
        }
    }

    screenPageview(page) {
        const { screenId } = this.options;
        this.send('pageview', `/screen/${screenId}/${page.replace(/^\//, '')}`);
    }

    channelPageview(channel = {}, page) {
        const { snippet = {} } = channel;
        const { title = '' } = snippet;
        const channelSlug = slug(title, {
            lower: true,
        });
        this.screenPageview(`/channel/${channelSlug}/${page.replace(/^\//, '')}`);
    }

    screenEvent(action, label, value) {
        const { screenId } = this.options;
        this.send('event', `Screen #${screenId}`, action, label, value);
    }

    bubbleEvent(bubble = {}, action) {
        const { id: bubbleId = 0 } = bubble;
        const bubbleLabel = Tracker.getBubbleLabel(bubble);
        this.screenEvent(action, bubbleLabel, bubbleId);
    }

    channelEvent(channel, action) {
        const { id: channelId = 0 } = channel;
        const channelLabel = Tracker.getChannelLabel(channel);
        this.screenEvent(action, channelLabel, channelId);
    }
}

export default Tracker;
