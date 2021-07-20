import { createStore, applyMiddleware, combineReducers } from 'redux';
import { composeWithDevTools } from 'redux-devtools-extension';
import thunkMiddleware from 'redux-thunk';
import promiseMiddleware from 'redux-promise';
import isObject from 'lodash/isObject';

import reducers from '../stores/index';

export default (initialData, opts) => {
    const options = {
        ...opts,
    };

    const reducer = combineReducers(reducers);
    const middlewares = [thunkMiddleware, promiseMiddleware];
    const enhancer = applyMiddleware(...middlewares);
    const store = createStore(reducer, initialData, enhancer);

    store.asyncReducers = reducers;
    store.addReducer = (name, newReducer) => {
        store.asyncReducers[name] = newReducer;
        store.replaceReducer(combineReducers(store.asyncReducers));
    };

    return store;
};
