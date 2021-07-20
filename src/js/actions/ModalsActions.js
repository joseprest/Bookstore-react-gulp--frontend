import ActionTypes from '../constants/ActionTypes';

const ModalsActions = {
    open(type, props) {
        return {
            type: ActionTypes.MODALS_OPEN,
            payload: {
                modal: type,
                props: props || {},
            },
        };
    },

    update(id, props) {
        return {
            type: ActionTypes.MODALS_UPDATE,
            payload: {
                id,
                props: props || {},
            },
        };
    },

    close(id) {
        return {
            type: ActionTypes.MODALS_CLOSE,
            payload: id,
        };
    },

    closeBrowserModals(browserId) {
        return {
            type: ActionTypes.MODALS_BROWSER_CLOSE,
            payload: browserId,
        };
    },
};

export default ModalsActions;
