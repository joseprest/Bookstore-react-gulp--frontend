/* globals Modernizr: true */
import React from 'react';
import ReactDOM from 'react-dom';
import _ from 'lodash';
import io from 'socket.io-client';
import PUBNUB from 'pubnub';
import { Promise } from 'es6-promise';
import EventEmitter from 'wolfy87-eventemitter';
// import request from 'superagent';
import moment from 'moment-timezone';
import createDebug from 'debug';
import { Provider as ProviderComponent } from 'react-redux';
import 'moment/locale/fr';

import createStore from './createStore';
import Api from './api';
import Data from './data';
import Cache from './cache';
import Clock from './clock';
import * as Screen from './screen';
import Loader from './loader';
import Requests from './requests';
import Progress from './progress';
import Manivelle from './manivelle';
import Utils from './utils';
import Tracker from './tracker';
import Text from './text';
import defaultThemes from '../themes';

import AppComponent from '../containers/App';
import NavigationActions from '../actions/NavigationActions';
// import ManivelleActions from '../actions/ManivelleActions';
import SetupActions from '../actions/SetupActions';
import DataActions from '../actions/DataActions';

import defaultPhrases from '../../data/text.json';

const debug = createDebug('manivelle:app');
const debugStart = createDebug('manivelle:start');
const debugSocket = createDebug('manivelle:socket');
const debugSocketIO = createDebug('manivelle:socket:io');
const debugSocketPubnub = createDebug('manivelle:socket:pubnub');

class Application extends EventEmitter {
    constructor(opts) {
        super();

        this.initTime = new Date();

        this.options = {
            debug: process.env.NODE_ENV !== 'production',
            locale: 'fr_CA',
            phrases: defaultPhrases,
            width: window.innerWidth,
            height: window.innerHeight,
            touch: typeof Modernizr !== 'undefined' ? Modernizr.touchevents : false,
            checkResize: true,
            manivelleProps: {},
            screen:
                process.env.NODE_ENV !== 'production'
                    ? {
                        id: '1',
                        uuid: 'DEV-UUID',
                        linked: true,
                        auth_code: '1234',
                    }
                    : null,
            clock: true,
            clockInterval: 1000,
            /**
             * "Official" initial time to use instead of the computer's time.
             * The value should be valid for Date.parse(). It is recommended to
             * use a timestamp (number of milliseconds since epoch UTC). If
             * null, screen's time is used.
             *
             * @type {null|string|int}
             */
            initialTime: null,
            /**
             * Timezone of the screen in. Ex: 'America/Toronto'.
             * If null, screen's timezone is used.
             * @see  http://momentjs.com/timezone/docs/
             *
             * @type {null|string}
             */
            timezone: null,
            apiHost: `http://${
                process.env.NODE_ENV !== 'production'
                    ? `${window.location.hostname}:8080`
                    : window.location.host
            }`,
            socket:
                process.env.NODE_ENV !== 'production'
                || window.location.hostname === 'localhost'
                || window.location.hostname === '127.0.0.1'
                    ? 'io'
                    : 'pubnub',
            socketHost: `http://${
                process.env.NODE_ENV !== 'production'
                    ? `${window.location.hostname}:8080`
                    : window.location.host
            }/socket`,
            socketPubnub: {
                publish_key: '',
                subscribe_key: '',
                namespace: 'manivelle',
            },
            loaderData: {
                bubbles: null,
                channels: null,
                timeline: null,
            },
            loaderUrl:
                process.env.NODE_ENV !== 'production'
                    ? {
                        // bubbles: 'http://683690b0-c1f5-11e9-b760-08002742a146.ecrans.manivelle.io.homestead.flklr.ca/data/bubbles.json',
                        // channels: 'http://683690b0-c1f5-11e9-b760-08002742a146.ecrans.manivelle.io.homestead.flklr.ca/data/channels.json',
                        // timeline: 'http://683690b0-c1f5-11e9-b760-08002742a146.ecrans.manivelle.io.homestead.flklr.ca/data/timeline.json',
                        // bubblesPage: 'http://683690b0-c1f5-11e9-b760-08002742a146.ecrans.manivelle.io.homestead.flklr.ca/data/bubbles/page/:count/:page.json',
                        bubbles: '/data/bubbles_vaudreuil.json',
                        channels: '/data/channels_vaudreuil.json',
                        timeline: '/data/timeline_vaudreuil.json',
                        bubblesPage: '/data/bubbles/page/:count/:page.json',
                    }
                    : {
                        bubbles: '/data/bubbles.json',
                        channels: '/data/channels.json',
                        timeline: '/data/timeline.json',
                        bubblesPage: '/data/bubbles/page/:count/:page.json',
                    },
            openBrowserOnReady: process.env.NODE_ENV !== 'production' ? { view: 'menu' } : null,
            // openBrowserOnReady: null,
            // openBrowserOnReady: { channelId: '1', view: 'channel:main' },
            loaderBubblesPerPage: 300,
            dataMinImageSize: 0.5,
            dataIgnoreBubblelessFilterValues: process.env.NODE_ENV === 'production',
            dataIgnoreSmallPicturesBubbleForEmptyTimeline: false,
            trackingId: 'UA-79618919-4',
            theme: null,
            themes: defaultThemes,
            ...opts,
        };

        _.bindAll(
            this,
            'onClockUpdate',
            'onResize',
            'onRender',
            'onProgress',
            'onProgressMessage',
            'onLoaderProgress',
            'onDataChange',
            'onInterfaceReady',
            'onInterfaceActivityChange',
            'onSocketConnect',
            'onSocketDataUpdate',
            'onSocketReadyChange',
            'onSocketBootProgress',
            'onSocketCommandReset',
            'onSocketScreenUpdate',
            'onSocketCommandReload',
            'onSocketBubblesUpdate',
            'onSocketChannelsUpdate',
            'onSocketTimelineUpdate',
            'onSocketManivelleRotation',
            'onPubnubSocketMessage',
            'onPubnubSocketConnect',
        );

        this.width = this.options.width;
        this.height = this.options.height;

        this.userActive = false;
        this.debug = this.options.debug;
        this.store = createStore();
        this.updates = [];
        this.data = null;
        this.cache = Cache;
        this.socket = null;
        this.element = null;
        this.clock = null;
        this.screen = null;
        this.loadingScreen = false;

        this.api = new Api({
            host: this.options.apiHost,
        });

        this.loader = new Loader({
            bubblesPerPage: this.options.loaderBubblesPerPage,
            data: this.options.loaderData,
            url: this.options.loaderUrl,
        });
        this.loader.on('progress', this.onLoaderProgress);

        this.updateManivelleThrottled = _.throttle(_.bind(this.updateManivelle, this), 10, {
            trailing: true,
        });

        this.loadLocale();

        this.progress = new Progress({
            namespaces: {
                screen: {
                    weight: 0.1,
                    value: 0,
                },
                start: {
                    weight: 0.1,
                    value: 0,
                },
                data: {
                    weight: 0.8,
                    value: 0,
                },
            },
        });
        this.progress.on('progress', this.onProgress);
        this.progress.on('message', this.onProgressMessage);
    }

    start() {
        debug('Start application...');

        if (process.env.NODE_ENV === 'production') {
            if (document.addEventListener) {
                document.addEventListener(
                    'contextmenu',
                    (e) => {
                        e.preventDefault();
                    },
                    false,
                );
            } else {
                document.attachEvent('oncontextmenu', () => {
                    window.event.returnValue = false;
                });
            }
        }

        // Screen
        this.progress.setMessage('Récupération des informations...');
        debugStart('Starting screen...');
        this.loadScreen(this.options.screen)
            // Socket
            .then((screen) => {
                this.setScreen(screen);

                this.progress.setMessage('Initialisation de la manivelle...');
                this.progress.update(1, 'screen');

                if (!this.options.socket) {
                    debugStart('Skip socket.');
                    return null;
                }
                return this.startSocket();
            })
            // Clock
            .then(() => {
                if (!this.options.clock) {
                    debugStart('Skip clock.');
                    return null;
                }
                return this.startClock();
            })
            // Events
            .then(() => this.startEvents())
            // Data
            .then(() => {
                this.progress.update(1, 'start');
                this.progress.setMessage('Récupération des données...');

                return this.startData();
            });
    }

    /**
     * From the locale specified in the options, updates libraries
     * using a locale (ex: moment, Text). Also updates the phrases in Text
     * from options.phrases[<locale>].
     */
    loadLocale() {
        const { locale } = this.options;
        const isRfc3066 = locale.indexOf('_') !== -1;
        const baseLocale = isRfc3066 ? locale.split('_')[0] : locale;
        // const momentLocale = isRfc3066 ? [locale, baseLocale] : locale;
        const phrasesLocale = isRfc3066 ? [baseLocale, locale] : [locale];

        moment.locale(locale);
        Text.setLocale(baseLocale);

        if (typeof this.options.phrases[baseLocale] !== 'undefined') {
            const { phrases } = this.options;
            const localePhrases = _.reduce(
                phrasesLocale,
                (allPhrases, phraseLocale) => _.extend(allPhrases, phrases[phraseLocale] || {}),
                {},
            );
            Text.setPhrases(localePhrases);
        } else {
            Text.clearPhrases();
        }
    }

    startData() {
        debugStart('Starting data...');
        this.data = new Data({
            minImageSize: this.options.dataMinImageSize,
            ignoreBubblelessFilterValues: this.options.dataIgnoreBubblelessFilterValues,
            ignoreSmallPicturesBubbleForEmptyTimeline: this.options
                .dataIgnoreSmallPicturesBubbleForEmptyTimeline,
            screenWidth: this.width,
            screenHeight: this.height,
        });
        this.data.on('change', this.onDataChange);

        this.store.dispatch(DataActions.setRepository(this.data));

        this.loader.load().then(this.createLoadDataHandler('data'));
    }

    startEvents() {
        debugStart('Starting events...');
        if (this.options.checkResize) {
            window.addEventListener('resize', this.onResize);
        }

        // if (this.options.touch) {
        //     document.addEventListener('touchmove', (e) => {
        //         e.preventDefault();
        //     });
        // }
    }

    startClock() {
        debugStart('Starting clock...');
        this.clock = new Clock(this.options.clockInterval);
        this.clock.on('update', this.onClockUpdate);
        this.clock.start(this.getEffectiveCurrentTime());
    }

    /**
     * Returns the current timestamp for the clock based on the
     * initialTime option.
     *
     * It parses the initialTime option (initTime if null) and
     * adds the the number of milliseconds since initTime.
     *
     * @return {int} Timestamp
     */
    getEffectiveCurrentTime() {
        let initialDateTime = this.initTime;
        const now = new Date();
        const elapsedTime = now.getTime() - this.initTime.getTime();

        if (this.options.initialTime) {
            initialDateTime = new Date(this.options.initialTime);
        }

        return initialDateTime.getTime() + elapsedTime;
    }

    startSocket() {
        debugStart('Starting socket...');
        if (this.options.socket === 'io') {
            debugSocket('Starting socket.io...');
            this.startSocketIO();
        } else if (this.options.socket === 'pubnub') {
            debugSocket('Starting pubnub...');
            this.startPubnubSocket();
        }
    }

    render(element) {
        const { element: currentElement } = this;
        const {
            openBrowserOnReady, manivelleProps, theme, themes,
        } = this.options;
        const finalElement = element || currentElement;

        const props = {
            disableBrowserAutoClose: openBrowserOnReady !== null,
            theme: theme !== null ? themes.find(({ id }) => id === theme) || null : null,
            ...(manivelleProps || {}),
        };
        props.width = this.width;
        props.height = this.height;
        props.debug = this.debug;
        props.api = this.api;
        props.app = this;
        props.onActivityChange = this.onInterfaceActivityChange;
        props.onReady = this.onInterfaceReady;
        props.timezone = this.options.timezone;

        const children = React.createElement(AppComponent, props);
        const provider = React.createElement(
            ProviderComponent,
            {
                store: this.store,
            },
            children,
        );

        // Render to html
        ReactDOM.render(provider, finalElement, this.onRender);

        this.element = finalElement;
    }

    createTracker(name) {
        return new Tracker(name, {
            trackingId: this.options.trackingId,
            screenId: _.get(this.screen, 'id'),
        });
    }

    startSocketIO() {
        this.socket = io(this.options.socketHost);

        this.socket.on('connect', this.onSocketConnect);
        this.socket.on('boot:progress', this.onSocketBootProgress);
        this.socket.on('ready', this.onSocketReadyChange);
        this.socket.on('command:reload', this.onSocketCommandReload);
        this.socket.on('command:reset', this.onSocketCommandReset);
        this.socket.on('screen:update', this.onSocketScreenUpdate);
        this.socket.on('data:update', this.onSocketDataUpdate);
        this.socket.on('bubbles:update', this.onSocketBubblesUpdate);
        this.socket.on('channels:update', this.onSocketChannelsUpdate);
        this.socket.on('timeline:update', this.onSocketTimelineUpdate);
        this.socket.on('manivelle:rotation', this.onSocketManivelleRotation);
    }

    startPubnubSocket() {
        this.pubnub = PUBNUB({
            publish_key: this.options.socketPubnub.publish_key,
            subscribe_key: this.options.socketPubnub.subscribe_key,
        });

        const channel = this.getPubnubChannel();

        debugSocketPubnub(`Subscribing to channel ${channel}`);

        this.pubnub.subscribe({
            channel,
            message: this.onPubnubSocketMessage,
            connect: this.onPubnubSocketConnect,
        });
    }

    getPubnubChannel() {
        const screenId = _.get(this.screen, 'id');
        const parts = [];
        if (this.options.socketPubnub.namespace) {
            parts.push(this.options.socketPubnub.namespace);
        }
        parts.push(`screen_${screenId}`);

        return parts.join(':');
    }

    // eslint-disable-next-line class-methods-use-this
    updateManivelle(value) {
        debug('manivelle:rotation:throttle', value.percent);

        Manivelle.updateData(value);
        // this.store.dispatch(ManivelleActions.updateData(value));
    }

    loadScreen(url) {
        if (_.isObject(url)) {
            return new Promise((resolve) => {
                resolve(url);
            });
        }

        this.loadingScreen = true;
        return Requests.get(url).then(
            (screen) => {
                this.loadingScreen = false;
                this.trigger('screen:loaded', screen);
                return screen;
            },
            () => {
                debug('Screen not found. Waiting 5 seconds...');
                return Utils.wait(5000).then(() => this.loadScreen(url));
            },
        );
    }

    setScreen(screen) {
        debug(`Screen id:${screen.id} uuid:${screen.uuid} linked:${screen.linked}`);
        this.screen = screen;
        this.store.dispatch(SetupActions.updateScreen(screen));

        // const screenId = screen.id;

        if (!_.get(screen, 'fields.technical.resolution.x')) {
            this.updateScreen();
        }
    }

    updateScreen() {
        debug('Updating screen information...');
        const API = this.api;
        Screen.getScreenInformation()
            .then(screen => API.updateScreen(screen))
            .then(
                () => {
                    debug('Screen updated.');
                },
                (err) => {
                    debug('Screen information error', err);
                },
            );
    }

    createLoadDataHandler(name) {
        const methodName = `set${name.substr(0, 1).toUpperCase()}${name.substr(1)}`;
        return (data) => {
            debug(`${name} loaded.`);
            if (this.userActive) {
                debug(`User active, waiting incativity for ${name} update.`);
                this.updates.push(() => {
                    // this.data[methodName](data);
                    this.store.dispatch(DataActions[methodName](data));
                });
            } else {
                // this.data[methodName](data);
                debug(`${name} updated.`);
                this.store.dispatch(DataActions[methodName](data));
            }
        };
    }

    executeUpdates() {
        const ul = this.updates.length;
        debug(`Executing ${ul} updates...`);
        for (let i = 0; i < ul; i += 1) {
            this.updates[i]();
        }
        this.updates = [];
    }

    updateProgress() {
        const percent = this.progress.getValue();
        const message = this.progress.getMessage();
        this.store.dispatch(SetupActions.updateProgress(percent, message));
    }

    onClockUpdate(time) {
        this.store.dispatch(NavigationActions.updateClock(time));
    }

    onProgress() {
        this.updateProgress();
    }

    onProgressMessage() {
        this.updateProgress();
    }

    onLoaderProgress(progress) {
        this.progress.update(progress, 'data');
    }

    onResize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;

        debug(`Resize ${this.width}x${this.height}`);

        this.cache.clear('sizes');
        this.trigger('resize');

        this.render();
    }

    onRender() {
        debug('Render');
        this.trigger('render');
    }

    onInterfaceReady() {
        const { openBrowserOnReady } = this.options;
        if (openBrowserOnReady !== null) {
            this.store.dispatch(
                NavigationActions.openBrowser({
                    zoneIndex: 0,
                    ...openBrowserOnReady,
                }),
            );
        }
    }

    onInterfaceActivityChange(activity) {
        debug('Activity change:', activity);

        if (activity) {
            this.userActive = true;
        } else {
            this.userActive = false;
            this.executeUpdates();
        }

        this.trigger('activity:change', activity);
    }

    onDataChange() {
        const ready = this.data.isReady();
        this.store.dispatch(DataActions.update());
        this.store.dispatch(SetupActions.updateDataReady(ready));
        debug(`Data has changed. Ready: ${ready}`);
    }

    onPubnubSocketConnect() {
        const channel = this.getPubnubChannel();
        debugSocketPubnub(`Connected to channel ${channel}.`);
    }

    onPubnubSocketMessage(message) {
        debugSocketPubnub('Message:', message);

        const actionParts = message.action.split(':');
        const methodNameParts = [];
        let action;
        for (let i = 0, al = actionParts.length; i < al; i += 1) {
            action = actionParts[i];
            methodNameParts.push(action.substr(0, 1).toUpperCase() + action.substr(1));
        }

        const methodName = `onSocket${methodNameParts.join('')}`;

        if (typeof this[methodName] !== 'undefined') {
            this[methodName](..._.values(_.omit(message, ['action'])));
        }
    }

    // eslint-disable-next-line class-methods-use-this
    onSocketConnect() {
        debugSocketIO('Connected.');
    }

    // eslint-disable-next-line class-methods-use-this
    onSocketBootProgress(data) {
        // this.store.dispatch(SetupActions.updateProgress(data.progress, data.message));
        debugSocket('boot:progress', `${Math.round(data.progress * 100)}%`, data.message);
    }

    onSocketReadyChange(ready) {
        debug(`Server is ${!ready ? 'not ' : ''}ready.`);
        this.store.dispatch(SetupActions.updateReady(ready));
    }

    // eslint-disable-next-line class-methods-use-this
    onSocketCommandReload() {
        debugSocket('command:reload');
        window.location.reload();
    }

    onSocketCommandReset() {
        debugSocket('command:reset');
        this.store.dispatch(NavigationActions.reset());
    }

    onSocketScreenUpdate(value) {
        debugSocket('screen:update', value);
        this.setScreen(value);
        this.loader.reload().then(this.createLoadDataHandler('data'));
    }

    onSocketDataUpdate() {
        debugSocket('data:update');
        this.loader.reload().then(this.createLoadDataHandler('data'));
    }

    onSocketBubblesUpdate() {
        debugSocket('bubbles:update');
        this.loader.reloadBubbles().then(this.createLoadDataHandler('bubbles'));
    }

    onSocketChannelsUpdate() {
        debugSocket('channels:update');
        this.loader.reloadChannels().then(this.createLoadDataHandler('channels'));
    }

    onSocketTimelineUpdate() {
        debugSocket('timeline:update');
        this.loader.reloadTimeline().then(this.createLoadDataHandler('timeline'));
    }

    onSocketManivelleRotation(value) {
        if (value.end) {
            this.updateManivelleThrottled.cancel();
            this.updateManivelle(value);
            // this.store.dispatch(ManivelleActions.updateData(value));
        } else {
            this.updateManivelleThrottled(value);
        }
    }
}

export default Application;
