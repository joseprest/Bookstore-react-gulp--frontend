/* eslint-disable import/no-extraneous-dependencies */
import { createStore, applyMiddleware, combineReducers } from 'redux';
import { composeWithDevTools } from 'redux-devtools-extension';
import thunkMiddleware from 'redux-thunk';
import promiseMiddleware from 'redux-promise';
import createLoggerMiddleware from 'redux-logger';
import isObject from 'lodash/isObject';

import reducers from '../stores/index';

export default (initialData, opts) => {
    const options = {
        logger: false,
        devTools: {},
        ...opts,
    };

    const reducer = combineReducers(reducers);
    const middlewares = [thunkMiddleware, promiseMiddleware];
    if (options.logger) {
        const loggerMiddleware = createLoggerMiddleware(
            isObject(options.logger) ? options.logger : {},
        );
        middlewares.push(loggerMiddleware);
    }

    const composeEnhancers = composeWithDevTools(options.devTools);
    const enhancer = composeEnhancers(applyMiddleware(...middlewares));
    const store = createStore(reducer, initialData, enhancer);

    store.asyncReducers = reducers;
    store.addReducer = (name, newReducer) => {
        store.asyncReducers[name] = newReducer;
        store.replaceReducer(combineReducers(store.asyncReducers));
    };

    return store;
};
