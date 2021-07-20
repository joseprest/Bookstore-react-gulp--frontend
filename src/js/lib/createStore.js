/* eslint-disable global-require */
const createStore = process.env.NODE_ENV !== 'production'
    ? require('./createStore.dev').default
    : require('./createStore.prod').default;

export default createStore;
