import ActionTypes from '../constants/ActionTypes';

const ManivelleActions = {
    updateValue(value) {
        return {
            type: ActionTypes.MANIVELLE_UPDATE_VALUE,
            payload: value,
        };
    },

    updateData(data) {
        return {
            type: ActionTypes.MANIVELLE_UPDATE_DATA,
            payload: data,
        };
    },
};

export default ManivelleActions;
