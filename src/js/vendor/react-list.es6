import React, {Component, PropTypes} from 'react';
import ReactDOM from 'react-dom';

const {findDOMNode} = ReactDOM;

const isEqualSubset = (a, b) => {
  for (let key in a) if (a[key] !== b[key]) return false;
  return true;
};

const isEqual = (a, b) => isEqualSubset(a, b) && isEqualSubset(b, a);

const CLIENT_SIZE_KEYS = {x: 'clientWidth', y: 'clientHeight'};
const CLIENT_START_KEYS = {x: 'clientTop', y: 'clientLeft'};
const INNER_SIZE_KEYS = {x: 'innerWidth', y: 'innerHeight'};
const OFFSET_SIZE_KEYS = {x: 'offsetWidth', y: 'offsetHeight'};
const OFFSET_START_KEYS = {x: 'offsetLeft', y: 'offsetTop'};
const OVERFLOW_KEYS = {x: 'overflowX', y: 'overflowY'};
const SCROLL_KEYS = {x: 'scrollLeft', y: 'scrollTop'};
const SIZE_KEYS = {x: 'width', y: 'height'};

const NOOP = () => {};

export default class extends Component {
    static displayName = 'ReactList';

    static propTypes = {
        axis: PropTypes.oneOf(['x', 'y']),
        width: PropTypes.number,
        height: PropTypes.number,
        initialIndex: PropTypes.number,
        itemSizeGetter: PropTypes.func,
        itemRenderer: PropTypes.func,
        itemsRenderer: PropTypes.func,
        length: PropTypes.number,
        pageSize: PropTypes.number,
        scrollParentGetter: PropTypes.func,
        threshold: PropTypes.number,
        type: PropTypes.oneOf(['simple', 'variable', 'uniform']),
        useTranslate3d: PropTypes.bool,
        onInfinitePageChange: PropTypes.func,
        onItemsCached: PropTypes.func,
        cacheAllOnFirstRender: PropTypes.bool,
        active: PropTypes.bool
    };

    static defaultProps = {
        axis: 'y',
        initialIndex: null,
        itemSizeGetter: null,
        itemRenderer: (index, key) => <div key={key}>{index}</div>,
        itemsRenderer: (items, ref) => <div ref={ref}>{items}</div>,
        length: 0,
        pageSize: 10,
        scrollParentGetter: null,
        threshold: 100,
        type: 'simple',
        useTranslate3d: false,
        cacheAllOnFirstRender: true,
        active: true,
        cache: null,
        cacheNumElements: 10
    };

    constructor(props)
    {
        super(props);
        const {initialIndex, length, pageSize} = this.props;
        const itemsPerRow = 1;
        const from = this.constrainFrom(initialIndex, length, itemsPerRow);
        const size = this.constrainSize(pageSize, length, pageSize, from);
        this.state = {from, size, itemsPerRow, scroll: 0, rendered: this.props.cache === null ? 0:this.props.length};
        if (this.props.cache === null)
        {
            this.cache = {};
            this.firstCache = false;
        }
        else
        {
            this.cache = this.props.cache;
            this.firstCache = true;
        }
    }

    componentWillReceiveProps(next)
    {
        let {itemsPerRow, from, size, scroll} = this.state;
        const {length, pageSize} = next;
        if(next.scroll !== this.props.scroll)
        {
            scroll = next.scroll;
        }
        from = this.constrainFrom(from, length, itemsPerRow);
        size = this.constrainSize(size, length, pageSize, from);
        var state = {
            scroll: scroll
        };

        if (this.props.cache !== next.cache)
        {
            if (next.cache === null)
            {
                this.cache = {};
                this.firstCache = false;
                state.rendered = 0;
            }
            else
            {
                this.cache = next.cache;
            }

        }
        //console.log('wrp',from,size)
        this.setState(state);
    }

    componentDidMount()
    {
        const {axis} = this.props;
        this.updateFrame = this.updateFrame.bind(this);
        if(this.firstCache)
        {
            this.updateFrame(this.scrollTo.bind(this, this.props.initialIndex));
        } else {
            this.progressiveCache();
        }
    }

    shouldComponentUpdate(props, state)
    {
        //return true;
        return !isEqual(props, this.props) || !isEqual(state, this.state);
    }

    componentDidUpdate(prevProps, prevState)
    {
        if (this.state.rendered < this.props.length)
        {
            this.progressiveCache();
        }
        else
        {
            if (prevState.rendered !== this.state.rendered && this.state.rendered >= this.props.length - 1 && this.props.onHeightsCached)
            {
                //console.log('CACHED', Object.keys(this.cache).length)
                this.props.onHeightsCached(this.cache);
            }
            this.updateFrame();
        }
    }

    componentWillUnmount()
    {
        if (this.cacheTimeout)
        {
            clearTimeout(this.cacheTimeout);
        }
    }

    progressiveCache()
    {
        if (!this.props.active)
        {
            return;
        }

        const itemEls = findDOMNode(this.items).children;
        const sizeKey = OFFSET_SIZE_KEYS[this.props.axis];
        for (let i = 0, l = itemEls.length; i < l; ++i)
        {
            var childI = this.state.rendered === 0 ? i:this.props.pageSize+i;
            if (childI >= itemEls.length)
            {
                break;
            }
            this.cache[i+this.state.rendered] = itemEls[childI][sizeKey];
            //console.log('caching', i+this.state.rendered, childI)
        }
        //console.log(this.state.rendered, '---')

        if (this.state.rendered + this.props.cacheNumElements >= this.props.length)
        {
            this.firstCache = true;
        }

        if (this.cacheTimeout)
        {
            clearTimeout(this.cacheTimeout);
        }
        this.cacheTimeout = setTimeout(_.bind(function(){
            this.setState({
                rendered: this.state.rendered === 0 ? this.props.pageSize:Math.min(this.state.rendered + this.props.cacheNumElements, this.props.length)
            })
        }, this), 1);
    }

    getOffset(el)
    {
        const {axis} = this.props;
        let offset = el[CLIENT_START_KEYS[axis]] || 0;
        const offsetKey = OFFSET_START_KEYS[axis];
        do offset += el[offsetKey] || 0; while (el = el.offsetParent);
        return offset;
    }

    getScroll()
    {
        return this.state.scroll;
    }

    getViewportSize()
    {
        const {axis, width, height} = this.props;
        return axis === 'x' ? width:height;
    }

    setScroll(offset)
    {
        var scroll = this.state.scroll + offset - this.getScroll();
        this.setState({scroll}, function()
        {
            this.updateFrame();
            if(this.props.onScroll)
            {
                this.props.onScroll(scroll);
            }
        });
    }

    getStartAndEnd(threshold = this.props.threshold)
    {
        const scroll = this.getScroll();
        const start = scroll - threshold;
        const end = start + this.getViewportSize() + (threshold * 2);
        return {start, end};
    }

    getItemSizeAndItemsPerRow()
    {
        const itemEls = findDOMNode(this.items).children;
        if (!itemEls.length) return {};

        const firstEl = itemEls[0];

        // Firefox has a problem where it will return a *slightly* (less than
        // thousandths of a pixel) different size for the same element between
        // renders. This can cause an infinite render loop, so only change the
        // itemSize when it is significantly different.
        let {itemSize} = this.state;
        const {axis} = this.props;
        const firstElSize = firstEl[OFFSET_SIZE_KEYS[axis]];
        const delta = Math.abs(firstElSize - itemSize);
        if (isNaN(delta) || delta >= 1) itemSize = firstElSize;

        if (!itemSize) return {};

        const startKey = OFFSET_START_KEYS[axis];
        const firstStart = firstEl[startKey];
        let itemsPerRow = 1;
        for (
            let item = itemEls[itemsPerRow];
            item && item[startKey] === firstStart;
            item = itemEls[itemsPerRow]
        ) ++itemsPerRow;

        return {itemSize, itemsPerRow};
    }

    updateFrame(cb)
    {
        if (typeof cb != 'function') cb = NOOP;
        switch (this.props.type) {
            case 'simple': return this.updateSimpleFrame(cb);
            case 'variable': return this.updateVariableFrame(cb);
            case 'uniform': return this.updateUniformFrame(cb);
        }
    }

    updateSimpleFrame(cb)
    {
        const {end} = this.getStartAndEnd();
        const itemEls = findDOMNode(this.items).children;
        let elEnd = 0;

        if (itemEls.length)
        {
            const {axis} = this.props;
            const firstItemEl = itemEls[0];
            const lastItemEl = itemEls[itemEls.length - 1];
            elEnd = this.getOffset(lastItemEl) + lastItemEl[OFFSET_SIZE_KEYS[axis]] -
            this.getOffset(firstItemEl);
        }

        if (elEnd > end) return cb();

        const {pageSize, length} = this.props;
        this.setState({size: Math.min(this.state.size + pageSize, length)}, cb);
    }

    updateVariableFrame(cb)
    {
        //if (!this.props.itemSizeGetter) this.cacheSizes();

        const {start, end} = this.getStartAndEnd();
        const {length, pageSize} = this.props;
        let space = 0;
        let from = 0;
        let size = 0;
        const maxFrom = length - 1;
        while (from < maxFrom)
        {
            const itemSize = this.getSizeOf(from);
            if (itemSize == null || space + itemSize > start) break;
            space += itemSize;
            ++from;
        }

        const maxSize = length - from;

        //console.log('before', size, maxSize, space, start, end)

        while (size < maxSize && space < end)
        {
            const itemSize = this.getSizeOf(from + size);
            if (itemSize === null)
            {
                size = Math.min(size + pageSize, maxSize);
                break;
            }
            space += itemSize;
            ++size;
        }
;
        //console.log(from, this.state.from,  size, this.state.size)

        if(from !== this.state.from || size !== this.state.size)
        {
            this.setState({from, size}, function()
            {
                //console.log('State changed', this.state.from, this.state.size)
                cb();
                if(this.props.onPageChange)
                {
                    this.props.onPageChange({from, size});
                }
            });
        }
    }

    updateUniformFrame(scroll, cb)
    {
        let {itemSize, itemsPerRow} = this.getItemSizeAndItemsPerRow();

        if (!itemSize || !itemsPerRow) return cb();

        const {length, pageSize} = this.props;
        const {start, end} = this.getStartAndEnd();

        const from = this.constrainFrom(
            Math.floor(start / itemSize) * itemsPerRow,
            length,
            itemsPerRow
        );

        const size = this.constrainSize(
            (Math.ceil((end - start) / itemSize) + 1) * itemsPerRow,
            length,
            pageSize,
            from
        );

        return this.setState({itemsPerRow, from, itemSize, size}, cb);
    }

    getSpaceBefore(index, cache = {})
    {
        if (cache[index] != null) return cache[index];

        // Try the static itemSize.
        const {itemSize, itemsPerRow} = this.state;
        if (itemSize)
        {
            return cache[index] = Math.ceil(index / itemsPerRow) * itemSize;
        }

        // Find the closest space to index there is a cached value for.
        let from = index;
        while (from > 0 && cache[--from] == null);

        // Finally, accumulate sizes of items from - index.
        let space = cache[from] || 0;
        for (let i = from; i < index; ++i)
        {
            cache[i] = space;
            const itemSize = this.getSizeOf(i);
            if (itemSize == null) break;
            space += itemSize;
        }

        return cache[index] = space;
    }

    cacheSizes()
    {
        const {from, rendered} = this.state;
        const {length} = this.props;
        const itemEls = findDOMNode(this.items).children;
        const sizeKey = OFFSET_SIZE_KEYS[this.props.axis];
        for (let i = 0, l = itemEls.length; i < l; ++i)
        {
            this.cache[from + i] = itemEls[i][sizeKey];
        }
        /*if (rendered >= length && this.props.onHeightsCached)
        {
            console.log(cache)
            this.props.onHeightsCached(cache);
        }*/
    }

    getSizeOf(index)
    {
        const {cache, items} = this;
        const {axis, itemSizeGetter, type} = this.props;
        const {from, itemSize, size} = this.state;

        // Try the static itemSize.
        if (itemSize) return itemSize;

        // Try the itemSizeGetter.
        if (itemSizeGetter) return itemSizeGetter(index);

        // Try the cache.
        if (index in cache)
        {
            return cache[index];
        }

        //const itemEl = findDOMNode(items).children[index - from];
        //console.log('icitte', itemEl);

        // Try the DOM.
        if (type === 'simple' && index >= from && index < from + size && items)
        {
            const itemEl = findDOMNode(items).children[index - from];
            if (itemEl) return itemEl[OFFSET_SIZE_KEYS[axis]];
        }
    }

    constrainFrom(from, length, itemsPerRow)
    {
        if (this.props.type === 'simple') return 0;
        if (!from) return 0;
        return Math.max(
            Math.min(from, length - itemsPerRow - (length % itemsPerRow)),
            0
        );
    }

    constrainSize(size, length, pageSize, from)
    {
        return Math.min(Math.max(size, pageSize), length - from);
    }

    scrollTo(index)
    {
        if (index != null) this.setScroll(this.getSpaceBefore(index));
    }

    scrollAround(index) {
        const current = this.getScroll();

        const max = this.getSpaceBefore(index);
        if (current > max) return this.setScroll(max);

        const min = max - this.getViewportSize() + this.getSizeOf(index);
        if (current < min) this.setScroll(min);
    }

    getVisibleRange()
    {
        const {from, size} = this.state;
        const {start, end} = this.getStartAndEnd(0);
        const cache = {};
        let first, last;
        for (let i = from; i < from + size; ++i)
        {
            const itemStart = this.getSpaceBefore(i, cache);
            const itemEnd = itemStart + this.getSizeOf(i);
            if (first == null && itemEnd > start) first = i;
            if (first != null && itemStart < end) last = i;
        }
        return [first, last];
    }

    renderItems()
    {
        const {itemRenderer, itemsRenderer, length, cacheNumElements, pageSize} = this.props;
        const {rendered} = this.state;
        var from, size;
        const items = [];
        var itemAlwaysShown = 0;
        if(!this.firstCache && this.props.cacheAllOnFirstRender)
        {
            from = 0;
            size = length;
            if (rendered < size)
            {
                from = rendered;
                size = cacheNumElements;
                if (from + size >= length)
                {
                    size = length - from;
                }
                for (let i = 0; i < Math.min(pageSize,length); ++i)
                {
                    items.push(itemRenderer(i, i));
                    //console.log('render', i)
                }
            }
        }
        else
        {
            from = this.state.from;
            size = this.state.size;
        }
        for (let i = 0; i < size; ++i)
        {
            if (typeof items[from+i] === 'undefined')
            {
                //console.log('render', from+i)
                items.push(itemRenderer(from + i, i));
            }
        }
        //console.log('---')

        return itemsRenderer(items, c => this.items = c);
    }

    render()
    {
        if (!this.props.active)
        {
            return <div/>;
        }

        const {axis, length, type, useTranslate3d} = this.props;
        const {from} = this.state;

        const items = this.renderItems();
        if (type === 'simple') return items;

        var style = {
            position: 'relative'
        };
        const cache = {};
        const size = this.getSpaceBefore(length, cache);
        if (size) {
            style[SIZE_KEYS[axis]] = size;
            if (axis === 'x') style.overflowX = 'hidden';
        }
        const offset = this.getSpaceBefore(from, cache);
        const x = axis === 'x' ? offset : 0;
        const y = axis === 'y' ? offset : 0;
        const transform =
            useTranslate3d ?
            `translate3d(${x}px, ${y}px, 0)` :
            `translate(${x}px, ${y}px)`;
        const listStyle = {
            msTransform: transform,
            WebkitTransform: transform,
            transform
        };
        if (this.props.cache === null)
        {
            //style.visibility = 'hidden';
        }

        return (
            <div className="react-list-container" {...{style}}>
                <div className="react-list-list" style={listStyle}>{items}</div>
            </div>
        );

    }
}
