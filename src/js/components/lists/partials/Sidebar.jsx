import React from 'react';
import PropTypes from 'prop-types';
import ReactDOM from 'react-dom';
import _ from 'lodash';
import $ from 'jquery';
import { TweenMax, TimelineMax } from 'gsap/TweenMax';

// import { FTScroller } from '../../../vendor/ftscroller';

import Utils from '../../../lib/utils';

const Sidebar = React.createClass({
    /*
        Contient
        - un pointer
        - une liste de labels groupés
    */

    propTypes: {
        items: PropTypes.array,
        itemKey: PropTypes.string.isRequired,
        itemOffset: PropTypes.number.isRequired,

        snapSidebarPointerToClosestLabel: PropTypes.bool.isRequired,

        pointerAnimationDuration: PropTypes.number,
        autoScrollAccelerationSpeed: PropTypes.number,
        autoScrollEaseDistance: PropTypes.number,
        onItemChange: PropTypes.func,
    },

    contextTypes: {
        browser: PropTypes.object,
    },

    scroller: null,
    lastMouseY: null,
    pointerTop: null, // à mettre en state
    userScroll: true, // à mettre en state
    userIsGrabbingPointer: false, // à mettre en state
    autoScrollTimeline: null,

    getDefaultProps() {
        return {
            items: [
                /* {
                    key: string,
                    label: String
                }

                ou

                {
                    label: String|null,
                    items: [
                        {
                            key: string,
                            label: String
                        }
                    ]
                } */
            ],
            pointerAnimationDuration: 0.25,
            autoScrollAccelerationSpeed: 0.8, // second
            autoScrollEaseDistance: 200, // pixels
        };
    },

    getInitialState() {
        // console.log(this.props.items)
        return {
            itemsGroups: this.getItemsGroups(this.props.items),
            // pointerTop à saver ici, pour ne pas avoir a getter le translate
        };
    },

    render() {
        const pointer = this.renderPointer();
        const content = this.renderContent(this.state.itemsGroups);

        return (
            <div className="list-sidebar-container">
                <div className="list-sidebar">
                    {pointer}
                    {content}
                </div>
            </div>
        );
    },

    renderPointer() {
        return (
            <div ref="pointer" className="list-sidebar-pointer">
                <div className="list-sidebar-pointer-shape shape-main">
                    {this.renderPointerArrow('main')}
                </div>
                <div className="list-sidebar-pointer-shape shape-shadow">
                    {this.renderPointerArrow('shadow')}
                </div>
                <span className="list-sidebar-pointer-icon icon-hamburger" />
            </div>
        );
    },

    renderPointerArrow(className) {
        return (
            <div className="list-sidebar-pointer-arrow">
                <div className={className} />
            </div>
        );
    },

    renderContent(groups) {
        const itemsGroups = groups.map(_.bind(this.renderItemsGroup, this));
        //
        return (
            <div
                ref="content"
                className="list-sidebar-content"
                onTouchStart={this.onTouchStart}
                onTouchMove={this.onTouchMove}
                onTouchEnd={this.onTouchStop}
                onTouchCancel={this.onTouchStop}
                onMouseDown={this.onMouseDown}
                onScroll={this.onScrollChange}
            >
                <ul ref="items" className="list-sidebar-labels-groups">
                    {itemsGroups}
                </ul>
            </div>
        );
    },

    renderItemsGroup(itemGroup, index) {
        const groupLabel = itemGroup.label;
        let groupLabelElement;
        if (groupLabel) {
            groupLabelElement = <div className="list-sidebar-labels-group-name">{groupLabel}</div>;
        }

        const items = itemGroup.items.map(this.renderItem);

        return (
            <li key={`group${index}`} className="list-sidebar-labels-group">
                {groupLabelElement}
                <ul className="list-sidebar-labels">{items}</ul>
            </li>
        );
    },

    renderItem(it) {
        const onClick = _.bind(function (e) {
            this.onLabelClick(e, it);
        }, this);

        return (
            <li
                key={`label${it.key}`}
                data-key={it.key}
                className="list-sidebar-label"
                {...Utils.onClick(onClick, 'end')}
            >
                {it.label}
            </li>
        );
    },

    componentDidMount() {
        /* var content = ReactDOM.findDOMNode(this.refs.content);
        this.scroller = new FTScroller(content, {
            scrollbars: false,
            scrollingX: false,
            bouncing: false
        });

        this.scroller.addEventListener('scroll', this.onScrollChange);
        */

        this.updatePointerSize();
        this.updatePointerPosition();
    },

    componentDidUpdate(prevProps, prevState) {
        const groupsChanged = this.state.itemsGroups !== prevState.itemsGroups;

        if (groupsChanged) {
            this.updatePointerSize();
        }

        if (!this.userIsGrabbingPointer) {
            const itemKeyChange = prevProps.itemKey !== this.props.itemKey
                || prevProps.itemOffset !== this.props.itemOffset;
            if (itemKeyChange) {
                this.updatePointerPosition({
                    animate: !this.userIsGrabbingPointer,
                });
            }
        }
    },

    componentWillReceiveProps(nextProps) {
        if (this.props.items !== nextProps.items) {
            this.setState({
                itemsGroups: this.getItemsGroups(nextProps.items),
            });
        }
    },

    componentWillUnmount() {
        this.removeWindowMouseEvents();
    },

    getItemsGroups(items) {
        const groups = [];
        const currentGroupItems = [];
        _.each(items, (it, i) => {
            if (typeof it.items === 'undefined') {
                currentGroupItems.push(it);
            } else {
                if (currentGroupItems && currentGroupItems.length) {
                    groups.push({
                        label: null,
                        items: currentGroupItems,
                    });
                }
                groups.push(it);
            }
        });

        if (currentGroupItems && currentGroupItems.length) {
            groups.push({
                label: null,
                items: currentGroupItems,
            });
        }

        return groups;
    },

    updatePointerSize() {
        const $el = $(ReactDOM.findDOMNode(this));
        const $labels = $el.find('.list-sidebar-label');
        const $pointer = $(ReactDOM.findDOMNode(this.refs.pointer));

        let maxWidth = 0;
        let maxHeight = 0;

        _.each($labels, (label) => {
            const $label = $(label);
            const labelWidth = $label.outerWidth();
            const labelHeight = $label.outerHeight();

            if (labelWidth > maxWidth) {
                maxWidth = labelWidth;
            }
            if (labelHeight > maxHeight) {
                maxHeight = labelHeight;
            }
        });

        TweenMax.set($pointer, {
            width: maxWidth,
            height: maxHeight,
        });
    },

    updatePointerPosition(params) {
        params = _.extend(
            {
                animate: false,
            },
            params,
        );

        const content = ReactDOM.findDOMNode(this.refs.content);
        const pointer = ReactDOM.findDOMNode(this.refs.pointer);

        let pointerTop = this.getPointerPositionFromItem(this.props.itemKey, this.props.itemOffset);
        const pointerOobDifference = this.getPointerOutOfBoundsDifference(pointerTop);
        const scrollDifference = content.scrollTop + pointerOobDifference;

        pointerTop = this.getConstrainedPointerTop(pointerTop);

        TweenMax.to(pointer, params.animate ? this.props.pointerAnimationDuration : 0, {
            ease: Power1.easeOut,
            y: pointerTop,
        });

        if (pointerOobDifference !== 0) {
            if (params.animate) {
                this.userScroll = false;
                TweenMax.killTweensOf(content);
                TweenMax.to(content, this.props.pointerAnimationDuration, {
                    scrollTop: scrollDifference,
                    onCompleteScope: this,
                    onComplete() {
                        this.userScroll = true;
                    },
                });
            } else {
                TweenMax.set(content, {
                    scrollTop: scrollDifference,
                });
            }
        }
    },

    onUserMovePointer(clientY) {
        if (clientY === this.lastMouseY) {
            return;
        }

        const content = ReactDOM.findDOMNode(this.refs.content);
        const pointer = ReactDOM.findDOMNode(this.refs.pointer);

        let pointerTop = $(pointer).position().top; // Utils.getTransform(pointer).translateY;

        const diffY = clientY - this.lastMouseY;

        // scale compensation
        /* var browserScale = _.get(this.context.browser, 'scale', 1);
        diffY /= browserScale; */

        pointerTop += diffY;

        const constrainedPointerTop = this.getConstrainedPointerTop(pointerTop);

        const direction = this.lastMouseY <= clientY ? 1 : -1;
        this.lastMouseY = clientY;

        if (constrainedPointerTop !== pointerTop) {
            this.lastMouseY += constrainedPointerTop - pointerTop;

            const scrollMin = 0;
            const scrollMax = content.scrollHeight - $(content).outerHeight();
            const { scrollTop } = content;

            if (direction === -1 && scrollTop > scrollMin) {
                this.autoScrollTo(scrollMin);
            } else if (direction === 1 && scrollTop < scrollMax) {
                this.autoScrollTo(scrollMax);
            }
        } else {
            this.killAutoScroll();
        }

        TweenMax.killTweensOf(pointer);
        TweenMax.set(pointer, {
            y: constrainedPointerTop,
        });
        const it = this.getItemFromPointerTop();
        this.onItemChange(it);
    },

    /*
     * UTILS -------------------------------------------------------------
     */

    autoScrollTo(scrollTop) {
        if (this.autoScrollTimeline) {
            return;
        }

        this.autoScrollTimeline = new TimelineMax({
            onComplete: this.killAutoScroll,
        });

        const content = ReactDOM.findDOMNode(this.refs.content);

        const currentScrollTop = content.scrollTop;
        const direction = currentScrollTop > scrollTop ? -1 : 1;
        const easeInTo = currentScrollTop + this.props.autoScrollEaseDistance * direction;
        const linearTo = scrollTop - this.props.autoScrollEaseDistance * direction;

        if (
            (direction === 1 && easeInTo >= linearTo)
            || (direction === -1 && easeInTo <= linearTo)
        ) {
            const distance = Math.abs(currentScrollTop - scrollTop);
            const duration = (distance * this.props.autoScrollAccelerationSpeed)
                / this.props.autoScrollEaseDistance;
            this.autoScrollTimeline.to(content, duration, {
                ease: Power1.easeInOut,
                scrollTop,
            });
        } else {
            let lastScrollTop = null;
            let lastTickerTime = null;
            let deltaTime = 0;
            let maxVelocity = 0;

            this.autoScrollTimeline.to(content, this.props.autoScrollAccelerationSpeed, {
                ease: Power1.easeIn,
                scrollTop: easeInTo,
                onUpdate() {
                    if (lastScrollTop !== null) {
                        const velocity = Math.abs(lastScrollTop - content.scrollTop);
                        if (velocity > maxVelocity) {
                            maxVelocity = velocity;
                        }
                    }

                    const currentTickerTime = TweenMax.ticker.time;
                    if (lastTickerTime !== null) {
                        deltaTime = currentTickerTime - lastTickerTime;
                    }
                    lastTickerTime = currentTickerTime;
                    lastScrollTop = content.scrollTop;
                },
                onCompleteScope: this,
                onComplete() {
                    const linearDistance = Math.abs(easeInTo - linearTo);
                    const linearSpeed = (linearDistance * deltaTime) / maxVelocity;

                    this.autoScrollTimeline.to(content, linearSpeed, {
                        ease: Linear.easeNone,
                        scrollTop: linearTo,
                    });
                    this.autoScrollTimeline.to(content, this.props.autoScrollAccelerationSpeed, {
                        ease: Power1.easeOut,
                        scrollTop,
                    });
                },
            });
        }
        // console.log(currentScrollTop, easeInTo, linearTo, scrollTop);
    },

    killAutoScroll() {
        if (this.autoScrollTimeline) {
            this.autoScrollTimeline.kill();
            this.autoScrollTimeline = null;
        }
    },

    snapPointerToClosest() {
        if (this.props.snapSidebarPointerToClosestLabel) {
            const it = this.getItemFromPointerTop();
            if (it.offset > 0.5) {
                it.key = this.getNextItemKey(it.key);
            }
            it.offset = 0;
            this.onItemChange(it);

            if (this.props.itemOffset === 0) {
                this.updatePointerPosition({
                    animate: true,
                });
            }
        }
    },

    getPointerOutOfBoundsDifference(pointerTop) {
        const pointerBounds = this.getPointerBounds();

        let difference;
        if (pointerTop < pointerBounds.min) {
            difference = pointerTop - pointerBounds.min;
        } else if (pointerTop > pointerBounds.max) {
            difference = pointerTop - pointerBounds.max;
        } else {
            difference = 0;
        }

        return difference;
    },

    getPointerPositionFromItem(itemKey, itemOffset) {
        const $el = $(ReactDOM.findDOMNode(this));
        const $labels = $el.find('.list-sidebar-label');
        let pointerTop = null;

        _.every($labels, (label) => {
            const $label = $(label);
            if (itemKey === `${$label.data('key')}`) {
                pointerTop = label.offsetTop;
            } else if (pointerTop !== null) {
                pointerTop += itemOffset * (label.offsetTop - pointerTop);
                return false;
            }
            return true;
        });

        const content = ReactDOM.findDOMNode(this.refs.content);
        pointerTop -= content.scrollTop;
        return pointerTop;
    },

    getItemFromPointerTop() {
        const pointer = ReactDOM.findDOMNode(this.refs.pointer);
        const content = ReactDOM.findDOMNode(this.refs.content);
        const pointerTop = $(pointer).position().top; // Utils.getTransform(pointer).translateY;

        const $el = $(ReactDOM.findDOMNode(this));
        const $labels = $el.find('.list-sidebar-label');
        let currentTop = null;
        let itemKey = null;
        let itemOffset = 0;

        _.every($labels, (label) => {
            const $label = $(label);
            const labelTop = label.offsetTop - content.scrollTop;

            if (pointerTop >= labelTop) {
                itemKey = `${$label.data('key')}`;
                currentTop = labelTop;
                return true;
            }
            itemOffset = (pointerTop - currentTop) / (labelTop - currentTop);
            return false;
        });

        return {
            key: itemKey,
            offset: itemOffset,
        };
    },

    getConstrainedPointerTop(pointerTop) {
        const pointerBounds = this.getPointerBounds();

        pointerTop = Math.max(pointerBounds.min, pointerTop);
        pointerTop = Math.min(pointerTop, pointerBounds.max);

        return pointerTop;
    },

    getPointerBounds() {
        const $el = $(ReactDOM.findDOMNode(this));
        const $labels = $el.find('.list-sidebar-label');
        const pointer = ReactDOM.findDOMNode(this.refs.pointer);
        const content = ReactDOM.findDOMNode(this.refs.content);
        const items = ReactDOM.findDOMNode(this.refs.items);

        const firstLabel = $labels.eq(0)[0];
        const lastLabel = $labels.eq($labels.length - 1)[0];
        const min = firstLabel ? firstLabel.offsetTop : 0;

        const lastLabelPosition = lastLabel ? lastLabel.offsetTop : 0;
        const paddingTop = (items.offsetHeight - $(items).height()) / 2;
        const contentMax = $(content).height() - paddingTop - pointer.offsetHeight;
        const max = Math.min(lastLabelPosition, contentMax);

        return {
            min,
            max,
        };
    },

    getNextItemKey(itemKey) {
        const keys = [];
        _.each(this.state.itemsGroups, (itemsGroup) => {
            _.each(itemsGroup.items, (it) => {
                keys.push(it.key);
            });
        });
        let index = keys.indexOf(itemKey);
        if (index > -1 && ++index < keys.length) {
            itemKey = keys[index];
        }
        return itemKey;
    },

    isOverPointer(clientY) {
        const $pointer = $(ReactDOM.findDOMNode(this.refs.pointer));
        const min = $pointer.offset().top;
        const max = min + $pointer.height();

        return clientY >= min && clientY <= max;
    },

    onPointerStartDrag() {
        const content = ReactDOM.findDOMNode(this.refs.content);
        $(content).css('overflowY', 'hidden');
    },

    onPointerStopDrag() {
        this.userIsGrabbingPointer = false;
        const content = ReactDOM.findDOMNode(this.refs.content);
        this.killAutoScroll();
        $(content).css('overflowY', 'auto');
    },

    addWindowMouseEvents() {
        $(window).on('mouseup', this.onMouseUp);
        $(window).on('mousemove', this.onMouseMove);
    },

    removeWindowMouseEvents() {
        $(window).off('mouseup', this.onMouseUp);
        $(window).off('mousemove', this.onMouseMove);
    },

    /*
        Events handlers
    */

    onItemChange(it) {
        if (it.key === this.props.itemKey && it.offset === this.props.itemOffset) {
            return;
        }

        if (this.props.onChange) {
            this.props.onChange(it);
        }
    },

    onScrollChange(e) {
        if (!this.userScroll) {
            return;
        }
        const it = this.getItemFromPointerTop();
        this.onItemChange(it);
    },

    onTouchStart(e) {
        const touch = e.touches.item(0);
        const { clientY } = touch;

        this.userIsGrabbingPointer = this.isOverPointer(clientY);
        if (this.userIsGrabbingPointer) {
            this.lastMouseY = clientY;
            this.onPointerStartDrag();
        }
    },

    onTouchMove(e) {
        if (!this.userIsGrabbingPointer) {
            return;
        }

        const touch = e.touches.item(0);
        const { clientY } = touch;
        this.onUserMovePointer(touch.clientY);
    },

    onTouchStop(e) {
        if (this.userIsGrabbingPointer) {
            this.onPointerStopDrag();
        }
        this.snapPointerToClosest();
    },

    onMouseDown(e) {
        const { clientY } = e;

        if (this.isOverPointer(clientY)) {
            this.userIsGrabbingPointer = true;
            this.lastMouseY = clientY;
            this.onPointerStartDrag();
            this.addWindowMouseEvents();
        }
    },

    onMouseUp() {
        this.onPointerStopDrag();
        this.removeWindowMouseEvents();
        this.snapPointerToClosest();
    },

    onMouseMove(e) {
        this.onUserMovePointer(e.clientY);
    },

    onLabelClick(e, it) {
        this.onItemChange({
            key: _.get(it, 'key'),
            offset: 0,
        });
    },
});

export default Sidebar;
