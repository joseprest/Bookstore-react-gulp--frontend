import React from 'react';
import PropTypes from 'prop-types';
import ReactDOM from 'react-dom';
import _ from 'lodash';
import $ from 'jquery';
import { TweenMax } from 'gsap/TweenMax';

import ListComponent from './List';
import Sidebar from './partials/Sidebar';

const ListWithSidebar = React.createClass({
    propTypes: {
        width: PropTypes.number.isRequired,
        height: PropTypes.number.isRequired,

        ListComponent: PropTypes.func.isRequired,

        items: PropTypes.array,
        sidebarItems: PropTypes.array,
        sidebarItemKey: PropTypes.string,
        sidebarItemOffset: PropTypes.number,

        centered: PropTypes.bool,
        infinite: PropTypes.bool,

        searchField: PropTypes.object,

        scrollTopDuration: PropTypes.number,

        snapSidebarPointerToClosestLabel: PropTypes.bool,

        active: PropTypes.bool,
        disableScroll: PropTypes.bool,

        onScroll: PropTypes.func,
        onScrollEnd: PropTypes.func,
    },

    manualScroll: false,

    getDefaultProps() {
        return {
            disableScroll: false,
            centered: true,
            infinite: true,
            active: false,

            ListComponent,

            sidebarItems: [],
            sidebarItemKey: null,
            sidebarItemOffset: 0,

            scrollTopDuration: 0.5,
            snapSidebarPointerToClosestLabel: true,
        };
    },

    getInitialState() {
        return {
            searchText: '',
            sidebarItemKey: this.props.sidebarItemKey,
            sidebarItemOffset: this.props.sidebarItemOffset,
            scroll: 0,
            scrollAnimating: false,
            listWidth: null,
            topSpace: 0,
        };
    },

    render() {
        const { width, height } = this.props;
        const { listWidth } = this.state;
        const style = {
            width,
            height,
        };

        const searchField = this.renderSearchField();

        let inner;
        if (listWidth) {
            inner = this.renderInner();
        }
        const sidebar = this.renderSidebar();

        return (
            <div className="list list-with-sidebar" style={style}>
                {searchField}
                <div className="list-container" ref="listContainer">
                    {inner}
                    {sidebar}
                    <div className="list-gradient gradient-top" />
                    <div className="list-gradient gradient-bottom" />
                </div>
            </div>
        );
    },

    renderSearchField() {
        const { searchField } = this.props;
        if (!searchField) {
            return null;
        }

        const params = _.extend(
            {
                placeholder: '',
                onChange: null,
            },
            searchField,
        );

        const searchFieldChange = _.bind(function(e) {
            this.onSearchFieldChange(e, params.onChange);
        }, this);

        return (
            <div ref="searchField" className="search-field">
                <input
                    type="text"
                    placeholder={params.placeholder}
                    value={this.state.searchText}
                    onChange={searchFieldChange}
                />
            </div>
        );
    },

    renderInner() {
        const { centered, width } = this.props;
        const { scroll, height } = this.state;
        let { listWidth } = this.state;
        let left = 0;

        if (centered) {
            const sidebarWidth = width - listWidth;
            listWidth -= sidebarWidth;
            left = sidebarWidth;
        }

        const { ListComponent: InnerListComponent } = this.props;

        const style = {
            width: listWidth,
            left,
        };

        const props = _.omit(this.props, ['ListComponent', 'width']);

        return (
            <div className="list-container-inner" style={style}>
                <InnerListComponent
                    {...props}
                    ref="list"
                    width={listWidth}
                    scrollable
                    scrollableWidth={listWidth}
                    scrollableHeight={height}
                    scroll={scroll}
                    onScroll={this.onListScroll}
                    onScrollEnd={this.onListScrollEnd}
                />
            </div>
        );
    },

    renderSidebar() {
        const { sidebarItems: items, width, height, snapSidebarPointerToClosestLabel } = this.props;

        const { sidebarItemKey, sidebarItemOffset } = this.state;
        if (!items.length) {
            return null;
        }

        return (
            <Sidebar
                ref="sidebar"
                width={width}
                height={height}
                items={items}
                itemKey={`${sidebarItemKey}`}
                itemOffset={sidebarItemOffset}
                snapSidebarPointerToClosestLabel={snapSidebarPointerToClosestLabel}
                onChange={this.onSidebarChange}
            />
        );
    },

    componentWillMount() {
        if (
            /* this.props.sidebarItemKey === null || */ !this.props.sidebarItems ||
            !this.props.sidebarItems.length
        ) {
            return;
        }

        const firstItem = this.props.sidebarItems[0];
        if (firstItem.items && !firstItem.items.length) {
            return;
        }

        this.setState({
            sidebarItemKey: _.get(firstItem, 'items.0.key', _.get(firstItem, 'key')),
        });
    },

    componentWillReceiveProps(nextProps) {
        const sidebarItemKeyChanged = this.props.sidebarItemKey !== nextProps.sidebarItemKey;
        const scrollChanged = this.props.scroll !== nextProps.scroll;

        const state = {};

        if (sidebarItemKeyChanged) {
            state.sidebarItemKey = nextProps.sidebarItemKey;
        }
        if (scrollChanged) {
            state.scroll = nextProps.scroll;
        }

        if (_.values(state).length) {
            this.setState(state);
        }
    },

    componentDidMount() {
        this.updateSizes();

        if (this.state.listWidth) {
            const itemKey = this.state.sidebarItemKey;
            const itemOffset = this.state.sidebarItemOffset;
            this.updateScrollTopFromItem(itemKey, itemOffset, false);
        }
    },

    componentDidUpdate(prevProps, prevState) {
        const sizeChange =
            prevProps.width !== this.props.width || prevProps.height !== this.props.height;
        const keyChange = prevState.sidebarItemKey !== this.state.sidebarItemKey;
        const offsetChange = prevState.sidebarItemOffset !== this.state.sidebarItemOffset;

        const nowHasListWidth = prevState.listWidth === null && this.state.listWidth !== null;

        const itemKey = this.state.sidebarItemKey;
        const itemOffset = this.state.sidebarItemOffset;
        const itemsChange = prevProps.items !== this.props.items;

        if (sizeChange || itemsChange) {
            this.updateSizes();
        }

        if (nowHasListWidth) {
            this.updateScrollTopFromItem(itemKey, itemOffset, false);
        }

        if (!this.manualScroll && (keyChange || offsetChange)) {
            this.updateScrollTopFromItem(itemKey, itemOffset);
        }
    },

    updateSizes() {
        let { height } = this.props;

        if (this.props.searchField) {
            const searchField = ReactDOM.findDOMNode(this.refs.searchField);
            height -= searchField.offsetHeight;
        }

        const listContainer = ReactDOM.findDOMNode(this.refs.listContainer);
        TweenMax.set(listContainer, {
            height,
        });

        // Update list width
        const $el = $(ReactDOM.findDOMNode(this));
        const $sidebarContainer = $(ReactDOM.findDOMNode(this.refs.sidebar));
        let sidebarWidth = 0;
        if ($sidebarContainer.length) {
            sidebarWidth = $sidebarContainer.outerWidth();
        }
        const listWidth = this.props.width - sidebarWidth;

        const state = {};
        if (this.state.listWidth !== listWidth) {
            state.listWidth = listWidth;
        }

        const $container = $el.find('.list-items:eq(0)');
        state.topSpace = $container.outerHeight() - $container.height();

        this.setState(state);
    },

    updateItemFromCurrentScrollTop(scrollTop) {
        const it = this.getCurrentItemFromScrollTop(scrollTop);

        const state = {
            scrollAnimating: false,
            sidebarItemKey: it.key,
            sidebarItemOffset: this.props.snapSidebarPointerToClosestLabel ? 0 : it.offset,
        };

        this.manualScroll = true;
        this.setState(state, function() {
            this.manualScroll = false;
        });
    },

    updateScrollTopFromItem(itemKey, itemOffset, animating) {
        if (typeof animating === 'undefined') {
            animating = true;
        }

        const scrollTop = this.getScrollTopFromItemKey(itemKey, itemOffset);

        this.setState({
            scrollAnimating: animating,
            scroll: scrollTop,
        });
    },

    getScrollTopFromItemKey(itemKey, offset) {
        const itemIndex = _.findIndex(this.props.items, it => it.key === itemKey);

        if (itemIndex === -1) {
            return 0;
        }

        let itemTop;
        let nextItemTop;

        if (this.props.infinite) {
            itemTop = this.refs.list.getItemOffsetTop(itemIndex);
            if (offset > 0) {
                nextItemTop = this.refs.list.getItemOffsetTop(itemIndex + 1);
                itemTop += (nextItemTop - itemTop) * offset;
            }
            return itemTop;
        }
        const $el = $(ReactDOM.findDOMNode(this));
        const $container = $el.find('.list-items:eq(0)');
        const $listItems = $container.find('>.list-item');
        itemTop = $listItems[itemIndex].offsetTop;
        if (offset > 0) {
            nextItemTop = $listItems[itemIndex + 1].offsetTop;
            itemTop += (nextItemTop - itemTop) * offset;
        }
        itemTop -= this.state.topSpace;

        return itemTop;
    },

    getCurrentItemFromScrollTop(scrollTop) {
        /* return {
            key: this.props.items[0].key,
            offset: 0
        }; */

        const { topSpace } = this.state;

        let itemIndex = -1;
        let itemOffset = 0;
        let lastItemTop;

        let items;
        let $el;
        let $listItemsContainer;
        if (this.props.infinite) {
            items = this.props.items;
        } else {
            $el = $(ReactDOM.findDOMNode(this));
            $listItemsContainer = $el.find('.list-items:eq(0)');
            items = $listItemsContainer
                .find('.list-item:eq(0)')
                .siblings()
                .andSelf();
        }

        let index;
        let itemTop;
        _.every(
            items,
            _.bind(function(item, i) {
                if (this.props.infinite) {
                    index = i;
                    itemTop = this.refs.list.getItemOffsetTop(i) - topSpace;
                } else {
                    const $item = $(item);
                    index = $item.data('list-item-index') || i;
                    itemTop = item.offsetTop - topSpace;
                }

                if (itemTop <= scrollTop) {
                    lastItemTop = itemTop;
                    itemIndex = index;
                } else if (itemIndex !== null) {
                    itemOffset = (scrollTop - lastItemTop) / (itemTop - lastItemTop);
                    return false;
                }
                return true;
            }, this),
        );

        return {
            key: _.get(this.props.items, `${itemIndex}.key`),
            offset: itemOffset,
        };
    },

    getNeighboorLabelKey(labelKey, deltaIndex) {
        const labels = [];

        _.each(this.props.sidebarItems, item => {
            if (item.items && item.items.length) {
                _.each(item.items, groupItem => {
                    labels.push(groupItem.key);
                });
            } else {
                labels.push(item.key);
            }
        });
        const index = labels.indexOf(labelKey);
        const newIndex = index + deltaIndex;
        if (index > -1 && newIndex < labels.length) {
            labelKey = labels[newIndex];
        }
        return labelKey;
    },

    /*
        Events handlers
    */

    onSidebarChange(item) {
        this.setState({
            sidebarItemKey: item.key,
            sidebarItemOffset: item.offset,
        });
    },

    onListScroll(scroll) {
        // return;// TMP
        if (!this.state.scrollAnimating) {
            this.updateItemFromCurrentScrollTop(scroll);
        }

        if (this.props.onScroll) {
            this.props.onScroll(scroll);
        }
    },

    onListScrollEnd() {
        this.setState(
            {
                scrollAnimating: false,
            },
            function() {
                if (this.props.onScrollEnd) {
                    this.props.onScrollEnd();
                }
            },
        );
    },

    onSearchFieldChange(e, callback) {
        const { value } = e.target;

        this.setState(
            {
                searchText: value,
            },
            () => {
                if (_.isFunction(callback)) {
                    callback(e);
                }
            },
        );
    },
});

export default ListWithSidebar;
