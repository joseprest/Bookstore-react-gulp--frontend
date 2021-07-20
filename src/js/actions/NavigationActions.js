import ActionTypes from '../constants/ActionTypes';

const NavigationActions = {
    updateClock(time) {
        return {
            type: ActionTypes.NAVIGATION_UPDATE_CLOCK,
            payload: time,
        };
    },

    openBrowser(props) {
        return {
            type: ActionTypes.NAVIGATION_OPEN_BROWSER,
            payload: props || {},
        };
    },

    updateBrowser(id, props) {
        return {
            type: ActionTypes.NAVIGATION_UPDATE_BROWSER,
            payload: {
                id,
                props: props || {},
            },
        };
    },

    closeBrowser(id) {
        return {
            type: ActionTypes.NAVIGATION_CLOSE_BROWSER,
            payload: id,
        };
    },

    openKeyboard(browserId, props) {
        return {
            type: ActionTypes.NAVIGATION_UPDATE_BROWSER,
            payload: {
                id: browserId,
                props: {
                    keyboard: props || {},
                },
            },
        };
    },

    updateKeyboard(browserId, props) {
        return {
            type: ActionTypes.NAVIGATION_UPDATE_BROWSER,
            payload: {
                id: browserId,
                props: {
                    keyboard: props || {},
                },
            },
        };
    },

    closeKeyboard(browserId) {
        return {
            type: ActionTypes.NAVIGATION_UPDATE_BROWSER,
            payload: {
                id: browserId,
                props: {
                    keyboard: null,
                },
            },
        };
    },

    openModal(browserId, type, props) {
        return {
            type: ActionTypes.NAVIGATION_OPEN_MODAL,
            payload: {
                browser: browserId,
                modal: type,
                props: props || {},
            },
        };
    },

    updateModal(browserId, id, props) {
        return {
            type: ActionTypes.NAVIGATION_UPDATE_MODAL,
            payload: {
                browser: browserId,
                id,
                props: props || {},
            },
        };
    },

    closeModal(browserId, id) {
        return {
            type: ActionTypes.NAVIGATION_CLOSE_MODAL,
            payload: {
                browser: browserId,
                id,
            },
        };
    },
};

export default NavigationActions;
