import { Promise } from 'es6-promise';
import request from 'superagent';
import isString from 'lodash/isString';
import isObject from 'lodash/isObject';

class Api {
    constructor(opts = {}) {
        this.options = {
            host: `http://${window.location.host}`,
            ...opts,
        };
    }

    request(requestPath, opts = {}) {
        const {
            path, method, query, data,
        } = {
            path: isString(requestPath) ? requestPath : '/',
            method: 'get',
            query: null,
            data: null,
            ...(isObject(requestPath) ? requestPath : opts),
        };

        const { host } = this.options;
        return new Promise((resolve, reject) => {
            const url = `${host}${path}`;
            request[method.toLowerCase()](url)
                .query(query)
                .send(data)
                .set('Accept', 'application/json')
                .end((err, res) => {
                    if (err) {
                        return reject(err);
                    }

                    return resolve(res.body);
                });
        });
    }

    get(path, query) {
        return this.request(path, {
            query,
        });
    }

    post(path, data, query) {
        return this.request(path, {
            method: 'post',
            data,
            query,
        });
    }

    updateScreen(data) {
        return this.post('/api/screen/update', data);
    }

    shareEmail(data) {
        return this.post('/api/share/email', data);
    }

    shareSms(data) {
        return this.post('/api/share/sms', data);
    }

    shareMessage(data) {
        return this.post('/api/share/message', data);
    }
}

export default Api;
