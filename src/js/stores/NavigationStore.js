import ActionTypes from '../constants/ActionTypes';

/**
 * Initial data
 */
const initialState = {
    clock: new Date().getTime(),

    browsers: [
        /*
        {
            id: 0,
            keyboard: false,
            modals: [],
            view: '' // 'channel:main',
            filter: 'collection'// name
        }
    */
    ],
};

/**
 * Open a new browser
 */
const openBrowser = ({ browsers = [], ...state }, props = {}) => {
    const { zoneIndex = null } = props;
    // Get the browser id
    const browserId = zoneIndex !== null
        ? zoneIndex
        : browsers.reduce(
            (maxId, { id }) => (parseInt(id, 10) > maxId ? parseInt(id, 10) + 1 : maxId),
            1,
        );
    return {
        ...state,
        browsers: [
            ...browsers,
            {
                id: `${browserId}`,
                ...props,
            },
        ],
    };
};

/**
 * Update a current browser
 */
function updateBrowser({ browsers = [], ...state }, id, props) {
    const { keyboard = null, view = null, bubblesIds = null } = props;
    return {
        ...state,
        browsers: browsers.map(browser => (`${browser.id}` === `${id}`
            ? {
                ...browser,
                ...props,
                ...(keyboard !== null
                    ? {
                        keyboard: {
                            ...(browser.keyboard || null),
                            ...keyboard,
                        },
                    }
                    : null),
                ...(browser.view !== view
                    ? {
                        bubblesIds,
                    }
                    : null),
            }
            : browser)),
    };
}

/**
 * Close a browser
 */
const closeBrowser = ({ browsers = [], ...state }, id) => ({
    ...state,
    browsers: browsers.filter(browser => `${browser.id}` !== `${id}`),
});

/**
 * Navigation store
 */
const NavigationStore = (state = initialState, action) => {
    switch (action.type) {
    case ActionTypes.NAVIGATION_UPDATE_CLOCK:
        return {
            ...state,
            clock: action.payload,
        };
        // Browser
    case ActionTypes.NAVIGATION_OPEN_BROWSER:
        return openBrowser(state, action.payload);
    case ActionTypes.NAVIGATION_UPDATE_BROWSER: {
        const { id, props = {} } = action.payload;
        return updateBrowser(state, id, props);
    }
    case ActionTypes.NAVIGATION_CLOSE_BROWSER:
        return closeBrowser(state, action.payload);
    default:
        return state;
    }
};

export default NavigationStore;
