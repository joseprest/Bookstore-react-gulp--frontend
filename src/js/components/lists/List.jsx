import React from 'react';
import PropTypes from 'prop-types';
import ReactDOM from 'react-dom';
import _ from 'lodash';
import $ from 'jquery';
import { TweenMax } from 'gsap/TweenMax';

import ReactList from '../../vendor/react-list';
import CacheManager from '../../lib/cache';
import Utils from '../../lib/utils';
import { FTScroller } from '../../vendor/ftscroller';

const Cache = CacheManager.create('sizes.list');

const List = React.createClass({
    propTypes: {
        width: PropTypes.number.isRequired,
        height: PropTypes.number.isRequired,
        ItemComponent: PropTypes.func.isRequired,
        itemProps: PropTypes.object,
        items: PropTypes.array.isRequired,
        className: PropTypes.string,
        infinite: PropTypes.bool,
        active: PropTypes.bool,
        disableScroll: PropTypes.bool,

        scrollable: PropTypes.bool,
        scroll: PropTypes.number,
        scrollableAxis: PropTypes.string,
        scrollableWidth: PropTypes.number,
        scrollableHeight: PropTypes.number,

        manivelleOffsetFactor: PropTypes.number,

        onScroll: PropTypes.func,
        onScrollEnd: PropTypes.func,
        onItemClick: PropTypes.func,
        onItemSelected: PropTypes.func,
    },

    scrollPane: null,
    scroller: null,
    scrollTween: null,

    getDefaultProps() {
        return {
            active: true,
            itemProps: {},
            className: '',
            infinite: false,
            scrollable: false,
            scroll: 0,
            animationDuration: 0.4,
            scrollableAxis: 'y',
            scrollableWidth: null,
            scrollableHeight: null,
            manivelleOffsetFactor: 20000, // pixels * manivelleDeltaPercent
        };
    },

    getInitialState() {
        const infiniteCache = this.props.infinite
            ? Cache.get(
                  `${this.props.width}_${this.props.height}${this.getCacheKey(this.props.items)}`,
                  null,
              )
            : null;
        return {
            scroll: this.props.scroll,
            infinitePageFrom: 0,
            infinitePageTo: 0,
            infiniteCache,
        };
    },

    render() {
        let content;
        if (this.props.infinite) {
            content = (
                <ReactList
                    axis={this.props.scrollableAxis}
                    width={this.props.width}
                    height={this.props.height}
                    useTranslate3d
                    ref="list"
                    type="variable"
                    threshold={this.props.height}
                    scroll={this.state.scroll}
                    cache={this.state.infiniteCache}
                    itemRenderer={this.renderInfiniteItem}
                    itemsRenderer={this.renderInfiniteItems}
                    length={this.props.items.length}
                    onPageChange={this.onInfinitePageChange}
                    onHeightsCached={this.onHeightsCached}
                    active={this.props.active}
                />
            );
        } else {
            const className = `${this.props.className} list-items`;
            const items = this.renderItems(this.props.items);
            content = (
                <div className={className} ref="list">
                    {items}
                </div>
            );
        }

        if (this.props.infinite || this.props.scrollable) {
            const scrollableStyle = {
                width: this.props.scrollableWidth,
                height: this.props.scrollableHeight,
            };
            return (
                <div className="list-scrollable" ref="listScroll" style={scrollableStyle}>
                    {content}
                </div>
            );
        }
        return content;
    },

    renderInfiniteItems(items, ref) {
        const className = `${this.props.className} list-items`;

        return (
            <div ref={ref} className={className}>
                {items}
            </div>
        );
    },

    renderInfiniteItem(index) {
        if (this.state.infiniteCache !== null) {
            // console.log(this.state.infiniteCache.positions[index]);
        }
        const it = this.props.items[index];
        return this.renderItem(it, index);
    },

    renderItems(items) {
        return items.map(this.renderItem);
    },

    renderItem(it, index) {
        const { ItemComponent } = this.props;

        const itemProps = _.extend(
            {
                data: it,
                index,
                width: this.props.width,
                height: this.props.height,
                scroll: this.state.scroll,
            },
            this.props.itemProps,
        );

        if (this.props.infinite) {
            itemProps.showImage = this.state.infiniteCache !== null;
        }

        const onClick = _.bind(function(e, it) {
            if (itemProps.onClick) {
                itemProps.onClick(e, it);
            }
            this.onItemClick(e, it, index);
        }, this);

        // console.log('render', index, this.props.items.length)

        return (
            <ItemComponent
                key={`item-${index}`}
                ref={`item-${index}`}
                {...itemProps}
                onClick={onClick}
            />
        );
    },

    componentWillReceiveProps(nextProps) {
        if (nextProps.infinite) {
            if (nextProps.width !== this.props.width || nextProps.height !== this.props.height) {
                const cacheKey = `${this.props.width}_${this.props.height}${this.getCacheKey(
                    this.props.items,
                )}`;
                Cache.clear(cacheKey);
                this.setState({
                    infiniteCache: null,
                });
            }
        }
    },

    componentDidMount() {
        if (this.props.scrollable) {
            _.bindAll(this, 'onScrollerScroll');
            const listScroll = ReactDOM.findDOMNode(this.refs.listScroll);
            this.scroller = new FTScroller(listScroll, {
                scrollbars: false,
                scrollingX: false,
                bouncing: false,
            });
            this.scroller.addEventListener('scroll', this.onScrollerScroll);
            $(document).on('manivelle:rotation', this.onManivelleRotation);
        }
    },

    componentDidUpdate(prevProps, prevState) {
        const scrollChanged =
            prevProps.scroll !== this.props.scroll && this.props.scroll !== this.state.scroll;
        const infinitePageFromChanged = prevState.infinitePageFrom !== this.state.infinitePageFrom;
        const infinitePageToChanged = prevState.infinitePageTo !== this.state.infinitePageTo;

        if (scrollChanged && this.props.scrollable) {
            this.scrollTo(this.props.scroll);
        }

        if (this.props.infinite && infinitePageFromChanged && infinitePageToChanged) {
            const list = ReactDOM.findDOMNode(this.refs.list);
            const height = list.offsetHeight || this.props.height;
            this.scroller.updateDimensions(this.props.width, height);
        }
    },

    componentWillUnmount() {
        if (this.scroller) {
            this.scroller.removeEventListener('scroll', this.onScrollerScroll);
            this.scroller.destroy();
            this.scroller = null;
        }

        if (this.scrollTween) {
            this.scrollTween.kill();
            this.scrollTween = null;
        }
        $(document).off('manivelle:rotation', this.onManivelleRotation);
    },

    scrollTo(scroll) {
        const { scroller } = this;
        if (!scroller) {
            return;
        }

        const speed = this.props.animationDuration;
        if (this.scrollTween) {
            this.scrollTween.kill();
        }
        this.scrollTween = TweenMax.to(
            {
                scrollTop: scroller.scrollTop,
            },
            speed,
            {
                scrollTop: scroll,
                onUpdate(e) {
                    scroller.scrollTo(false, this.target.scrollTop);
                },
                onComplete: this.onScrollEnd,
                onCompleteScope: this,
            },
        );
    },

    getCacheKey(items) {
        const itemKeys = [];
        for (let i = 0, il = items.length; i < il; i++) {
            const it = items[i];
            itemKeys.push(_.values(it).join(','));
            itemKeys.push(_.keys(it).join(','));
        }
        const cacheKey = Utils.getMD5FromString(itemKeys.join(','));
        return cacheKey;
    },

    getScrollParent() {
        const $el = $(ReactDOM.findDOMNode(this));
        return $el.parents('.list-container-inner')[0];
    },

    getItemOffsetTop(index) {
        return this.refs.list.getSpaceBefore(index);
    },

    /**
     * Events handlers
     */

    onManivelleRotation(e) {
        const manivelleReady = this.props.active && !this.props.disableScroll;
        const { manivelle } = e;
        if (!manivelleReady || manivelle.deltaPercent === 0) {
            return;
        }

        const scroll =
            this.state.scroll + manivelle.deltaPercent * this.props.manivelleOffsetFactor;
        this.scrollTo(scroll);
    },

    onHeightsCached(cache) {
        cache.positions = [];
        let currentY = 0;
        for (let i = 0, il = this.props.items.length; i < il; i++) {
            cache.positions[i] = currentY;
            currentY += cache[i];
        }
        const cacheKey = `${this.props.width}_${this.props.height}${this.getCacheKey(
            this.props.items,
        )}`;
        Cache.clear(cacheKey);
        this.setState(
            {
                infiniteCache: cache,
            },
            () => {
                Cache.set(cacheKey, cache);
            },
        );
    },

    onInfinitePageChange(page) {
        this.setState({
            infinitePageFrom: page.from,
            infinitePageTo: page.from + page.size,
        });
    },

    onScrollerScroll(e) {
        const scroll = e.scrollTop;
        this.setState(
            {
                scroll,
            },
            function() {
                if (this.props.onScroll) {
                    this.props.onScroll(scroll);
                }
            },
        );
    },

    onScrollEnd() {
        if (this.props.onScrollEnd) {
            this.props.onScrollEnd();
        }
    },

    onItemClick(e, it, index) {
        if (this.props.onItemClick) {
            this.props.onItemClick(e, it, index);
        }
    },
});

export default List;
