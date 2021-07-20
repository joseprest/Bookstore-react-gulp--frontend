import PropTypes from 'prop-types';

import Api from './api';
import Data from './data';
import Tracker from './tracker';

/**
 * Core
 */
export const app = PropTypes.shape({});

export const api = PropTypes.instanceOf(Api);

export const tracker = PropTypes.instanceOf(Tracker);

export const dataRepository = PropTypes.instanceOf(Data);

export const store = PropTypes.shape({
    dispatch: PropTypes.func.isRequired,
});

export const screen = PropTypes.shape({
    id: PropTypes.string,
    uuid: PropTypes.string,
    linked: PropTypes.bool,
    auth_code: PropTypes.string,
});

export const setup = PropTypes.shape({
    loadingPercent: PropTypes.number,
    loadingMessage: PropTypes.string,
    dataReady: PropTypes.bool,
    ready: PropTypes.bool,
    screen,
});

export const modal = PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    type: PropTypes.string,
    group: PropTypes.string,
    props: PropTypes.object,
});
export const modals = PropTypes.arrayOf(modal);

export const keyboard = PropTypes.shape({});

export const browser = PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    keyboard,
    modals,
    view: PropTypes.string,
    filter: PropTypes.string,
});
export const browsers = PropTypes.arrayOf(browser);

export const headerMessage = PropTypes.shape({
    icon: PropTypes.string,
    label: PropTypes.string,
});
export const headerMessages = PropTypes.arrayOf(headerMessage);

export const navigationStore = PropTypes.shape({
    clock: PropTypes.number.isRequired,
    browsers: browsers.isRequired,
});

export const browserContext = PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    scale: PropTypes.number.isRequired,
    closeable: PropTypes.bool.isRequired,
    tracker: tracker.isRequired,
});

export const theme = PropTypes.shape({
    id: PropTypes.string.isRequired,
});

/**
 * Data
 */
export const picture = PropTypes.shape({
    link: PropTypes.string,
});

export const snippet = PropTypes.shape({
    title: PropTypes.string,
    picture,
});

export const bubble = PropTypes.shape({
    id: PropTypes.string.isRequired,
    snippet,
});
export const bubbles = PropTypes.arrayOf(bubble);

export const channel = PropTypes.shape({
    id: PropTypes.string.isRequired,
    snippet,
});
export const channels = PropTypes.arrayOf(channel);

export const timelineCycleItem = PropTypes.shape({
    bubble_id: PropTypes.string,
    duration: PropTypes.number,
});
export const timelineCycleItems = PropTypes.arrayOf(timelineCycleItem);

export const timelineCycle = PropTypes.shape({
    id: PropTypes.string,
    start: PropTypes.number,
    end: PropTypes.number,
    items: timelineCycleItems,
});
export const timeline = PropTypes.arrayOf(timelineCycle);
