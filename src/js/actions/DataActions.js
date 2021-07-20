import ActionTypes from '../constants/ActionTypes';

const DataActions = {
    update() {
        return {
            type: ActionTypes.DATA_UPDATE,
        };
    },

    setRepository(repository) {
        return {
            type: ActionTypes.DATA_SET_REPOSITORY,
            payload: repository,
        };
    },

    setBubbles(data) {
        return {
            type: ActionTypes.DATA_SET_BUBBLES,
            payload: data,
        };
    },

    setChannels(data) {
        return {
            type: ActionTypes.DATA_SET_CHANNELS,
            payload: data,
        };
    },

    setTimeline(data) {
        return {
            type: ActionTypes.DATA_SET_TIMELINE,
            payload: data,
        };
    },

    setData(data) {
        return {
            type: ActionTypes.DATA_SET_DATA,
            payload: data,
        };
    },
};

export default DataActions;
