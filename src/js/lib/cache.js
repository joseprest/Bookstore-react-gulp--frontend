import _ from 'lodash';
import unset from 'lodash.unset';

let CACHE_STORE = {};
let CACHE_MANAGERS = {};

function getByKey(key, defaults) {
    if (_.isObject(key)) {
        defaults = key;
        key = null;
    }

    if (this.namespace) {
        key = this.namespace + (key ? `.${key}` : '');
    }
    return _.get(CACHE_STORE, key, defaults);
}

function hasKey(key) {
    if (typeof key === 'undefined' && this.namespace) {
        return _.has(CACHE_STORE, this.namespace);
    }

    if (this.namespace) {
        key = `${this.namespace}.${key}`;
    }
    return _.has(CACHE_STORE, key);
}

function setByKey(key, value) {
    if (_.isObject(key)) {
        var value = key;
        if (this.namespace) {
            value = {};
            value[this.namespace] = key;
        }
        return _.merge(CACHE_STORE, value);
    }

    if (this.namespace) {
        key = `${this.namespace}.${key}`;
    }
    return _.set(CACHE_STORE, key, value);
}

function clear(key) {
    if (typeof key === 'undefined') {
        if (this.namespace) {
            unset(CACHE_STORE, this.namespace);
        } else {
            CACHE_STORE = {};
        }
        return;
    }

    if (this.namespace) {
        key = `${this.namespace}.${key}`;
    }

    return unset(CACHE_STORE, key);
}

function createManager(namespace) {
    if (typeof namespace === 'undefined') {
        namespace = null;
    }

    if (
        typeof this !== 'undefined'
        && typeof this.namespace !== 'undefined'
        && this.namespace !== null
    ) {
        namespace = this.namespace + (namespace ? `.${namespace}` : '');
    }

    if (namespace && _.has(CACHE_MANAGERS, namespace)) {
        return _.get(CACHE_MANAGERS, namespace);
    }

    const cache = {};
    cache.namespace = namespace;
    cache.get = _.bind(getByKey, cache);
    cache.has = _.bind(hasKey, cache);
    cache.set = _.bind(setByKey, cache);
    cache.clear = _.bind(clear, cache);
    cache.create = _.bind(createManager, cache);
    cache.destroy = _.bind(destroyManager, cache);

    if (namespace) {
        _.set(CACHE_MANAGERS, namespace, cache);
    }

    return cache;
}

function destroyManager(namespace) {
    if (typeof namespace === 'undefined') {
        namespace = null;
    }

    if (this.namespace) {
        namespace = this.namespace + (namespace ? `.${namespace}` : '');
    }

    if (!namespace) {
        CACHE_MANAGERS = {};
        return;
    }

    return _.unset(CACHE_MANAGERS, namespace);
}

const mainManager = createManager();
export default mainManager;
