import ActionTypes from '../constants/ActionTypes';

const initialState = {
    direction: 'clockwise', // clockwise or counterclockwise
    value: 0,
    percent: 0,
    end: false,
    deltaValue: 0,
    deltaPercent: 0,
    initial: true,
};

const ManivelleStore = (state = initialState, action) => {
    switch (action.type) {
    case ActionTypes.MANIVELLE_UPDATE_VALUE:
        return {
            ...state,
            value: action.payload,
            percent: action.payload / 1024,
        };
    case ActionTypes.MANIVELLE_UPDATE_DATA: {
        const newState = {
            ...action.payload,
        };

        if (state.initial) {
            newState.deltaValue = 0;
            newState.deltaPercent = 0;
        } else if (newState.end) {
            if (newState.direction === 'clockwise') {
                newState.deltaValue = 1024 - state.value;
                newState.deltaPercent = 1 - state.percent;
            } else {
                newState.deltaValue = 0 - state.value;
                newState.deltaPercent = 0 - state.percent;
                newState.value = 1024;
                newState.percent = 1;
            }
        } else {
            newState.deltaValue = newState.value - state.value;
            newState.deltaPercent = newState.percent - state.percent;
        }

        return newState;
    }
    default:
        return state;
    }
};

export default ManivelleStore;
