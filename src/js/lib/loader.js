import _ from 'lodash';
import { Promise } from 'es6-promise';
import localforage from 'localforage';
import createDebug from 'debug';
import EventEmitter from 'wolfy87-eventemitter';

import Requests from './requests';
import Progress from './progress';

const debug = createDebug('manivelle:loader');

var Loader = function(opts)
{
    this.options = _.extend({
        bubblesPerPage: 300,
        bubblesPageLoadConcurrency: 3,
        useLocalStorage: false,
        data: {
            bubbles: null,
            channels: null,
            timeline: null
        },
        url: {
            bubbles: 'http://localhost:8080/data/bubbles.json',
            channels: 'http://localhost:8080/data/channels.json',
            timeline: 'http://localhost:8080/data/timeline.json',
            bubblesPage: 'http://localhost:8080/data/bubbles/page/<%= count %>/<%= page %>.json'
        }
    }, opts);

    this.data = {};

    this.cache = {};
    this.store = localforage.createInstance({
        name: 'manivelle_loader'
    });

    this.progress = new Progress({
        namespaces: {
            bubbles: {
                weight: 0.6,
                value: 0
            },
            channels: {
                weight: 0.2,
                value: 0
            },
            timeline: {
                weight: 0.2,
                value: 0
            }
        }
    });

    this.progress.on('progress', _.bind(function(value)
    {
        this.emit('progress', value);
    }, this));

    this.progress.on('completed', _.bind(function()
    {
        this.emit('completed');
    }, this));
};

Loader.prototype = new EventEmitter();

Loader.prototype.clearCache = function()
{
    debug('Clearing cache and local storage');
    this.cache = {};
    return this.store.clear();
};

Loader.prototype.reload = function()
{
    if(this.loading)
    {
        debug('Already loading.');
        return new Promise(function(resolve, reject)
        {
            reject();
        });
    }

    debug('Reloading data...');

    this.progress.reset();

    this.loading = true;
    var loadPromise = this.clearCache()
        .then(_.bind(function()
        {
            return this.load();
        }, this))
        .then(_.bind(function(data)
        {
            this.loading = false;
            return data;
        }, this));

    return loadPromise;
};

Loader.prototype.load = function()
{
    debug('Loading data...');

    var lastKey = null;
    var lastPromise = new Promise(function(resolve, reject){resolve();});
    for(var key in this.options.data)
    {
        if(this.options.data[key])
        {
            lastPromise = lastPromise.then(this.createSetDataPromise(key, lastKey, this.options.data[key]));
        }
        else
        {
            lastPromise = lastPromise.then(this.createLoadDataPromise(key, lastKey));
        }
        lastPromise = lastPromise.then(this.createProgressPromise(key));
        lastKey = key;
    }

    lastPromise = lastPromise.then(_.bind(function(value)
    {
        this.data[lastKey] = value;
        debug('Data reloaded.', this.data);
        return this.data;
    }, this));

    return lastPromise;
};

Loader.prototype.createLoadDataPromise = function(key, lastKey)
{
    return _.bind(function(value)
    {
        if(lastKey)
        {
            this.data[lastKey] = value;
        }
        return this.loadData(key);
    }, this);
};

Loader.prototype.createSetDataPromise = function(key, lastKey, data)
{
    return _.bind(function(value)
    {
        debug('Static data found for '+key+'.');
        if(lastKey)
        {
            this.data[lastKey] = value;
        }
        return data;
    }, this);
};

Loader.prototype.createProgressPromise = function(key)
{
    return _.bind(function(value)
    {
        debug('Loaded '+key+'.');
        this.progress.update(1, key);
        return value;
    }, this);
};

Loader.prototype.loadData = function(key)
{
    debug('Loading '+key+'...');

    var url = _.get(this.options.url, key);

    return Requests.loadData(url)
        .then(_.bind(function(body)
        {
            if(key === 'bubbles' && !_.isObject(_.get(body, '0')))
            {
                return this.loadBubbles(body);
            }
            else if(key === 'timeline')
            {
                return _.get(body, 'cycles', body || []);
            }
            return body;
        }, this));
};

/*Loader.prototype.loadBubbles = function(ids)
{
    debug('Loading '+ids.length+' bubbles...');
    var bubbles = [];
    var id;
    var lastPromise = new Promise(function(resolve){resolve();});
    for(var i = 0, l = ids.length; i < l; i++)
    {
        id = ids[i];
        lastPromise = lastPromise.then(this.createLoadBubblePromise(id))
                                .then(this.createAddBubblePromise(bubbles))
                                .then(this.createBubbleProgressPromise(i, l));
    }

    return lastPromise.then(_.bind(function()
    {
        debug('Loaded '+bubbles.length+' bubbles.');
        return bubbles;
    }, this));
};*/

Loader.prototype.loadBubbles = function(ids)
{
    debug('Loading '+ids.length+' bubbles...');

    var bubblesPerPage = this.options.bubblesPerPage;
    var pages = {};
    var page, id;
    var pageCount = 0;
    for(var i = 0, l = ids.length; i < l; i++)
    {
        id = ids[i];
        page = Math.floor(id/bubblesPerPage)+1;
        if(!pages[page])
        {
            pages[page] = [];
            pageCount++;
        }
        pages[page].push(id);
    }

    debug('Found '+pageCount+' pages.');

    return this.loadBubblesPages(pages)
        .then(function(bubbles)
        {
            debug('Loaded '+bubbles.length+' bubbles.');
            return bubbles;
        });

    /*var bubbles = [];
    var id;
    var lastPromise = new Promise(function(resolve){resolve();});

    return lastPromise.then(_.bind(function()
    {
        debug('Loaded '+bubbles.length+' bubbles.');
        return bubbles;
    }, this));*/
};

Loader.prototype.loadBubblesPages = function(pages)
{
    var concurrency = this.options.bubblesPageLoadConcurrency;
    var pagesLoader = [];
    var ids, pageLoader;
    var i = 0;
    var count = _.keys(pages).length;
    for(var page in pages)
    {
        ids = pages[page];
        pageLoader = this.createBubblesPageLoader(page, ids, i, count);
        pagesLoader.push(pageLoader);
        i++;
    }

    var pagesLoading = [];
    var allBubbles = [];
    return this.loadBubblesPagesConcurrent(pagesLoader, pagesLoading, concurrency, allBubbles);
};

Loader.prototype.loadBubblesPagesConcurrent = function(pagesLoader, pagesLoading, concurrency, allBubbles, endPromise)
{
    var loadingCount = pagesLoading.length;
    var pagesRemaining = pagesLoader.length;
    var pagesToLoad = concurrency-loadingCount;
    var pageLoadingPromise;
    if(typeof(endPromise) === 'undefined')
    {
        endPromise = {};
    }

    var pageLoaded = _.bind(function(bubbles)
    {
        for(var i = 0, l = bubbles.length; i < l; i++)
        {
            allBubbles.push(bubbles[i]);
        }

        if(!pagesLoader.length && !pagesLoading.length)
        {
            debug('No page left.');
            endPromise.resolve(allBubbles);
        }
        else if(pagesLoader.length)
        {
            debug('Loading new pages ('+pagesLoader.length+' pages left)...');
            this.loadBubblesPagesConcurrent(pagesLoader, pagesLoading, concurrency, allBubbles, endPromise);
        }
    }, this);

    var pageLoader;
    for(var i = 0; i < (pagesToLoad > pagesRemaining ? pagesRemaining:pagesToLoad); i++)
    {
        pageLoader = pagesLoader.shift();
        pageLoadingPromise = this.createBubblesPageLoadPromise(pageLoader, i, pagesLoading).then(pageLoaded);
        pageLoadingPromise.pageIndex = i;
        pagesLoading.push(pageLoadingPromise);
    }

    return new Promise(function(resolve)
    {
        if(!endPromise.resolve)
        {
            endPromise.resolve = resolve;
        }
    });
};


Loader.prototype.createBubblesPageLoader = function(page, ids, i, count)
{
    return _.bind(function()
    {
        return this.loadBubblesPage(page)
            .then(function(bubbles)
            {
                var bubblesMap = {};
                var pageBubbles = [];
                var bubble, id;
                for(var i = 0, l = bubbles.length; i < l; i++)
                {
                    bubble = bubbles[i];
                    bubblesMap[bubble.id] = bubble;
                }

                for(i = 0, l = ids.length; i < l; i++)
                {
                    id = ids[i];
                    bubble = _.get(bubblesMap, id);
                    if(bubble)
                    {
                        pageBubbles.push(bubble);
                    }
                }
                if(pageBubbles.length !== ids.length)
                {
                    debug('Page '+page+' bubbles count difference should be '+ids.length+' received '+pageBubbles.length);
                }

                return pageBubbles;
            })
            .then(this.createBubbleProgressPromise(i, count));
    }, this);
};

Loader.prototype.createBubblesPageLoadPromise = function(pageLoader, i, pagesLoading)
{
    return pageLoader()
        .then(_.bind(function(bubbles)
        {
            var pagesLoadingIndex = _.find(pagesLoading, function(pageLoadPromise)
            {
                return pageLoadPromise.pageIndex === i;
            });

            if(pagesLoadingIndex !== -1)
            {
                pagesLoading.splice(pagesLoadingIndex, 1);
            }

            return bubbles;
        }, this));
};

Loader.prototype.loadBubblesPage = function(page)
{
    debug('Loading page '+page+'...');
    var bubblesPerPage = this.options.bubblesPerPage;
    var url = this.options.url.bubblesPage.replace(/\:page/, page).replace(/\:count/, bubblesPerPage);
    return Requests.get(url)
        .then(function(bubbles)
        {
            return bubbles;
        }, function()
        {
            return [];
        })
        .then(function(bubbles)
        {
            debug('Page '+page+' loaded with '+bubbles.length+' bubbles.');
            return bubbles;
        });
};


Loader.prototype.createLoadBubblePromise = function(id)
{
    return _.bind(function()
    {
        return this.loadBubble(id);
    }, this);
};
Loader.prototype.createAddBubblePromise = function(bubbles)
{
    return _.bind(function(bubble)
    {
        if(bubble)
        {
            bubbles.push(bubble);
        }

        return bubble;
    }, this);
};

Loader.prototype.createBubbleProgressPromise = function(i, l)
{
    return _.bind(function(value)
    {
        var progress = i/l;
        var currentProgress = this.progress.getValue('bubbles');
        if(progress > currentProgress)
        {
            this.progress.update(progress, 'bubbles');
        }
        return value;
    }, this);
};

Loader.prototype.loadFromStorage = function(key)
{
    if(this.options.useLocalStorage)
    {
        return this.store.getItem(key);
    }

    return new Promise(function(resolve, reject)
    {
        resolve(null);
    });
};

Loader.prototype.loadBubble = function(id)
{
    var bubblesPerPage = this.options.bubblesPerPage;
    var page = Math.floor(id/bubblesPerPage)+1;
    var bubble = _.get(this.cache, 'bubblesPages.'+page+'.'+id);
    if(bubble)
    {
        return bubble;
    }

    var forageKey = 'bubbles_page_'+page+'_'+bubblesPerPage;

    //Check page in local storage
    return this.loadFromStorage(forageKey)
        .then(function(bubbles)
        {
            return bubbles;
        }, function()
        {
            return [];
        })
        //Request page if not found
        .then(_.bind(function(bubbles)
        {
            if(bubbles && bubbles.length)
            {
                debug('Bubbles page #'+page+' found in forage.');
                return bubbles;
            }

            if(this.options.useLocalStorage)
            {
                debug('Bubbles page #'+page+' not found in forage.');
            }

            var url = this.options.url.bubblesPage.replace(/\:page/, page).replace(/\:count/, bubblesPerPage);
            return Requests.get(url)
                .then(_.bind(function(bubbles)
                {
                    if(this.options.useLocalStorage)
                    {
                        debug('Bubbles page #'+page+' saved in forage.');
                        return this.store.setItem(forageKey, bubbles);
                    }
                    return bubbles;
                }, this));
        }, this))
        //Get bubble and save in cache
        .then(_.bind(function(bubbles)
        {
            var bubblesMap = {};
            _.each(bubbles, function(bubble)
            {
                bubblesMap[bubble.id] = bubble;
            });
            _.set(this.cache, 'bubblesPages.'+page, bubblesMap);
            return _.get(bubblesMap, id, null);
        }, this), function()
        {
            return null;
        });
};

export default Loader;
