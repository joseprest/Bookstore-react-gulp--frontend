import isObject from 'lodash/isObject';
import EventEmitter from 'wolfy87-eventemitter';

class Progress extends EventEmitter {
    constructor(opts) {
        super();
        this.options = {
            namespaces: {
                default: 0,
            },
            ...opts,
        };
        const { namespaces } = this.options;

        this.namespaces = namespaces;
        this.value = 0;
        this.message = '';
    }

    reset() {
        this.value = 0;
        this.namespaces = Object.keys(this.namespaces).reduce((namespaces, key) => ({
            ...namespaces,
            [key]: isObject(this.namespaces[key]) ? {
                ...this.namespaces[key],
                value: 0,
            } : 0,
        }), {});

        this.emit('reset');
    }

    update(progress, namespaceKey = 'default') {
        const namespace = this.namespaces[namespaceKey] || null;
        if (namespace === null) {
            return;
        }

        if (isObject(namespace)) {
            this.namespaces[namespaceKey].value = progress;
        } else {
            this.namespaces[namespaceKey] = progress;
        }

        this.emit('progress:namespace', namespaceKey, progress);

        if (progress === 1) {
            this.emit('completed:namespace', namespaceKey);
        }

        this.updateValue();
    }

    updateValue() {
        const lastValue = this.value;
        this.value = Object.keys(this.namespaces).reduce((newValue, key) => {
            if (!isObject(this.namespaces[key])) {
                return newValue + this.namespaces[key];
            }
            const { weight = 1, value = 0 } = this.namespaces[key];
            return newValue + (weight * value);
        }, 0);

        if (lastValue !== this.value) {
            this.emit('progress', this.value);
        }

        if (this.value === 1) {
            this.emit('completed');
        }

        return this.value;
    }

    getValue(namespaceKey) {
        if (typeof namespaceKey !== 'undefined') {
            const namespace = this.namespaces[namespaceKey] || null;
            return isObject(namespace) ? namespace.value || 0 : namespace;
        }
        return this.value;
    }

    getMessage() {
        return this.message;
    }

    setMessage(message) {
        this.message = message;
        this.emit('message', message);
    }
}

export default Progress;
