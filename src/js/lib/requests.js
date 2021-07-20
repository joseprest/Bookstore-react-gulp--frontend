
import { Promise } from 'es6-promise';
// import EventEmitter from 'wolfy87-eventemitter';
import request from 'superagent';
import createDebug from 'debug';

const debug = createDebug('manivelle:request');

var Requests = {

    get: function(url)
    {
        debug('Requesting GET '+url+'...');

        return new Promise(_.bind(function(resolve, reject)
        {
            request.get(url)
                .end(function(err, response)
                {
                    if(err)
                    {
                        return reject(err);
                    }
                    return resolve(response.body);
                });
        }, this));

    },

    loadData: function(url)
    {
        return Requests.get(url)
            .then(function(body)
            {
                return _.get(body, 'data.data', _.get(body, 'data', body));
            });
    },

    loadBubble: function(url)
    {
        debug('Loading '+url+'...');

        return new Promise(_.bind(function(resolve, reject)
        {
            request.get(url)
                .end(function(err, response)
                {
                    if(err)
                    {
                        return reject(err);
                    }

                    return resolve(response.body);
                });
        }, this));

    },

    loadScreen: function(url)
    {
        debug('Loading screen...');

        return new Promise(_.bind(function(resolve, reject)
        {
            request.get(url)
                .end(function(err, response)
                {
                    if(err)
                    {
                        return reject(err);
                    }
                    debug('Screen loaded.');
                    var body = response.body;
                    return resolve(body)
                });
        }, this));

    }

};

export default Requests;
