import _ from 'lodash';

import ActionTypes from '../constants/ActionTypes';

/**
 * Initial data
 */
const initialState = {
    last_update: 0,
    repository: null,
};

/**
 * Navigation store
 */
const DataStore = (state = initialState, action) => {
    switch (action.type) {
    case ActionTypes.DATA_SET_REPOSITORY:
        return {
            last_update: new Date().getTime(),
            repository: action.payload,
        };
    case ActionTypes.DATA_UPDATE:
        return {
            last_update: new Date().getTime(),
            repository: state.repository,
        };
    case ActionTypes.DATA_SET_BUBBLES:
        state.repository.setBubbles(action.payload);
        return {
            last_update: new Date().getTime(),
            repository: state.repository,
        };
    case ActionTypes.DATA_SET_CHANNELS:
        state.repository.setChannels(action.payload);
        return {
            last_update: new Date().getTime(),
            repository: state.repository,
        };

    case ActionTypes.DATA_SET_TIMELINE:
        state.repository.setTimeline(action.payload);
        return {
            last_update: new Date().getTime(),
            repository: state.repository,
        };

    case ActionTypes.DATA_SET_DATA:
        state.repository.setBubbles(_.get(action.payload, 'bubbles'));
        state.repository.setChannels(_.get(action.payload, 'channels'));
        state.repository.setTimeline(_.get(action.payload, 'timeline'));
        return {
            last_update: new Date().getTime(),
            repository: state.repository,
        };
    default:
        return state;
    }
};

export default DataStore;
