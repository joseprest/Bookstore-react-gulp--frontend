import ActionTypes from '../constants/ActionTypes';

const initialState = process.env.NODE_ENV !== 'production'
    ? {
        loadingPercent: null,
        loadingMessage: 'Chargement en cours...',
        dataReady: false,
        ready: false,
        screen: null,
    }
    : {
        loadingPercent: null,
        loadingMessage: 'Démarrage...',
        dataReady: false,
        ready: false,
        screen: null,
    };

function updateReady(state) {
    const { dataReady, screen = {} } = state;
    const { linked: screenLinked = false } = screen;
    return {
        ...state,
        ready: dataReady && screenLinked,
    };
}

const SetupStore = (state = initialState, action) => {
    switch (action.type) {
    case ActionTypes.SETUP_UPDATE_PERCENT:
        return {
            ...state,
            loadingPercent: action.payload,
        };
    case ActionTypes.SETUP_UPDATE_LOADING_MESSAGE:
        return {
            ...state,
            loadingMessage: action.payload,
        };
    case ActionTypes.SETUP_UPDATE_PROGRESS: {
        const { percent, message } = action.payload;
        return {
            ...state,
            loadingPercent: percent,
            loadingMessage: message,
        };
    }
    case ActionTypes.SETUP_UPDATE_READY:
        return {
            ...state,
            ready: action.payload,
        };
    case ActionTypes.SETUP_UPDATE_DATA_READY:
        return updateReady({
            ...state,
            dataReady: action.payload,
        });
    case ActionTypes.SETUP_UPDATE_SCREEN:
        return updateReady({
            ...state,
            screen: action.payload,
        });
    default:
        break;
    }
    return state;
};

export default SetupStore;
