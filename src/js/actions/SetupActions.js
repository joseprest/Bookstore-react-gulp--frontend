import ActionTypes from '../constants/ActionTypes';

const SetupActions = {
    updateLoadingMessage(message) {
        return {
            type: ActionTypes.SETUP_UPDATE_LOADING_MESSAGE,
            payload: message,
        };
    },

    updateLoadingPercent(percent) {
        return {
            type: ActionTypes.SETUP_UPDATE_LOADING_PERCENT,
            payload: percent,
        };
    },

    updateProgress(progress, message) {
        return {
            type: ActionTypes.SETUP_UPDATE_PROGRESS,
            payload: {
                percent: progress * 100,
                message,
            },
        };
    },

    updateDataReady(ready) {
        return {
            type: ActionTypes.SETUP_UPDATE_DATA_READY,
            payload: ready,
        };
    },

    updateReady(ready) {
        return {
            type: ActionTypes.SETUP_UPDATE_READY,
            payload: ready,
        };
    },

    updateScreen(screen) {
        return {
            type: ActionTypes.SETUP_UPDATE_SCREEN,
            payload: screen,
        };
    },
};

export default SetupActions;
