import React from 'react';
import PropTypes from 'prop-types';
import ReactDOM from 'react-dom';
import _ from 'lodash';
import $ from 'jquery';
import { TweenMax, TimelineMax } from 'gsap/TweenMax';

import Scrollable from '../../helpers/Scrollable';

import Utils from '../../../lib/utils';

const Sidebar = React.createClass({
    /*
        Contient
        - un pointer
        - une liste de labels groupés
    */

    propTypes: {
        width: PropTypes.number.isRequired,
        height: PropTypes.number.isRequired,
        items: PropTypes.array.isRequired,
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

    autoScrollTimeline: null,

    getDefaultProps() {
        return {
            pointerAnimationDuration: 0.25,
            autoScrollAccelerationSpeed: 0.8, // second
            autoScrollEaseDistance: 200, // pixels
        };
    },

    getInitialState() {
        return {
            itemsGroups: this.getItemsGroups(this.props.items),

            pointerWidth: null,
            pointerHeight: null,

            pointerTop: null,
            scrollTop: null,
            currentScrollTop: 0,
            clientY: null,
        };
    },

    render() {
        // console.log(this.state.pointerTop, this.state.scrollTop, this.state.currentScrollTop)
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
        if (!this.state.pointerWidth || !this.state.pointerWidth) {
            return;
        }

        const style = {
            width: this.state.pointerWidth,
            height: this.state.pointerHeight,
        };

        return (
            <div ref="pointer" className="list-sidebar-pointer" style={style}>
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
        // onScroll={this.onScrollChange}
        return (
            <div
                ref="content"
                className="list-sidebar-content"
                onTouchStart={this.onTouchStart}
                onTouchMove={this.onTouchMove}
                onTouchEnd={this.onTouchStop}
                onTouchCancel={this.onTouchStop}
                onMouseDown={this.onMouseDown}
            >
                <Scrollable
                    enabled={this.state.clientY === null}
                    onScroll={this.onScrollerScroll}
                    scrollTop={this.state.scrollTop}
                >
                    <div className="list-sidebar-content-inner">
                        <ul ref="items" className="list-sidebar-labels-groups">
                            {itemsGroups}
                        </ul>
                    </div>
                </Scrollable>
            </div>
        );
    },

    renderItemsGroup(itemGroup, index) {
        const groupLabel = itemGroup.label;
        let groupLabelElement;
        if (groupLabel) {
            groupLabelElement = <div className="list-sidebar-labels-group-name">{groupLabel}</div>;
        }

        const items = itemGroup.items.map(_.bind(this.renderItem, this));

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
        const pointerSize = this.getPointerSize();

        this.setState({
            pointerWidth: pointerSize.width,
            pointerHeight: pointerSize.height,
        });
    },

    componentDidUpdate(prevProps, prevState) {
        const sizeChanged = prevProps.width !== this.props.width || prevProps.width !== this.props.width;
        // var itemKeyChanged = prevProps.itemKey !== this.props.itemKey || prevProps.itemOffset !== this.props.itemOffset;
        const pointerSizeChanged = prevState.pointerWidth !== this.state.pointerWidth
            || prevState.pointerHeight !== this.state.pointerHeight;
        const pointerTopChanged = prevState.pointerTop !== this.state.pointerTop;

        const currentScrollTopChanged = prevState.currentScrollTop !== this.state.currentScrollTop;

        const pointerDragging = prevState.clientY !== null
            && this.state.clientY !== null
            && prevState.clientY !== this.state.clientY;

        // console.log(sizeChanged, itemKeyChanged, pointerSizeChanged, pointerTopChanged)

        const state = {};
        let stateChanged = false;

        if (sizeChanged) {
            const pointerSize = this.getPointerSize();
            if (
                this.state.pointerWidth !== pointerSize.width
                || this.state.pointerHeight !== pointerSize.height
            ) {
                state.pointerWidth = pointerSize.width;
                state.pointerHeight = pointerSize.height;
                stateChanged = true;
            }
        }

        if (pointerSizeChanged) {
            const positions = this.getComputedPositions(this.props.itemKey, this.props.itemOffset);
            state.pointerTop = positions.pointerTop;
            state.scrollTop = positions.scrollTop;
            stateChanged = true;
        }

        if (pointerTopChanged) {
            this.updatePointerPosition(this.state.pointerTop);
        }

        if (pointerTopChanged || currentScrollTopChanged) {
            const it = this.getItemFromPointerTop();
            // console.log(it)
            this.onItemChange(it);
        }

        if (pointerDragging) {
            this.onPointerDrag(this.state.clientY - prevState.clientY);
        }

        if (stateChanged) {
            this.setState(state);
        }

        // --------------

        /* if (!this.userIsGrabbingPointer)
        {
            if (itemKeyChange )
            {
                this.updatePointerPosition({
                    animate: !this.userIsGrabbingPointer
                });
            }
        } */
    },

    componentWillReceiveProps(nextProps) {
        const state = {};
        let stateChanged = false;

        if (this.props.items !== nextProps.items) {
            // toujours différents puisque nouvel object par son parent
            state.itemsGroups = this.getItemsGroups(nextProps.items);
            stateChanged = true;
        }

        if (
            this.props.itemKey !== nextProps.itemKey
            || this.props.itemOffset !== nextProps.itemOffset
        ) {
            /* var positions = this.getComputedPositions(nextProps.itemKey, nextProps.itemOffset);
            state.pointerTop = positions.pointerTop;
            state.scrollTop = positions.scrollTop;
            stateChanged = true; */
        }

        if (stateChanged) {
            this.setState(state);
        }
    },

    componentWillUnmount() {
        this.removeWindowMouseEvents();
    },

    getPointerSize() {
        const $el = $(ReactDOM.findDOMNode(this));
        const $labels = $el.find('.list-sidebar-label');

        let width = 0;
        let height = 0;

        for (let i = 0, il = $labels.length; i < il; i++) {
            const label = $labels[i];
            width = Math.max(width, label.offsetWidth);
            height = Math.max(height, label.offsetHeight);
        }

        return {
            width,
            height,
        };
    },

    getComputedPositions(key, offset) {
        const pointer = ReactDOM.findDOMNode(this.refs.pointer);

        let pointerTop = this.getPointerPositionFromItem(key, offset);
        const pointerOobDifference = this.getPointerOutOfBoundsDifference(pointerTop);
        const scrollDifference = this.state.currentScrollTop + pointerOobDifference;

        pointerTop = this.getConstrainedPointerTop(pointerTop);

        return {
            pointerTop,
            scrollTop: scrollDifference,
        };
    },

    updatePointerPosition(pointerTop) {
        const pointer = ReactDOM.findDOMNode(this.refs.pointer);

        const animate = false;

        TweenMax.killTweensOf(pointer);
        TweenMax.to(pointer, animate ? this.props.pointerAnimationDuration : 0, {
            ease: Power1.easeOut,
            y: pointerTop,
        });
    },

    onScrollerScroll(e, scrollTop) {
        this.setState({
            currentScrollTop: scrollTop,
        });
    },

    onPointerDrag(diffY) {
        const content = ReactDOM.findDOMNode(this.refs.content);
        const items = ReactDOM.findDOMNode(this.refs.items);

        const pointerTop = this.state.pointerTop + diffY;
        const constrainedPointerTop = this.getConstrainedPointerTop(pointerTop);

        if (constrainedPointerTop !== pointerTop) {
            const scrollMin = 0;
            const scrollMax = $(items).outerHeight() - $(content).outerHeight();

            this.autoScrollTo(pointerTop < constrainedPointerTop ? scrollMin : scrollMax);
        } else {
            this.killAutoScroll();
        }

        this.setState({
            pointerTop: constrainedPointerTop,
        });
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

        const { currentScrollTop } = this.state;
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
            this.autoScrollTimeline.to({ scrollTop: currentScrollTop }, duration, {
                ease: Power1.easeInOut,
                scrollTop,
                onUpdateParams: ['{self}'],
                onUpdate: _.bind(function (tween) {
                    this.setState({
                        scrollTop: tween.target.scrollTop,
                    });
                }, this),
            });
        } else {
            let lastScrollTop = null;
            let lastTickerTime = null;
            let deltaTime = 0;
            let maxVelocity = 0;

            this.autoScrollTimeline.to(
                { scrollTop: currentScrollTop },
                this.props.autoScrollAccelerationSpeed,
                {
                    ease: Power1.easeIn,
                    scrollTop: easeInTo,
                    onUpdateParams: ['{self}'],
                    onUpdate: _.bind(function (tween) {
                        if (lastScrollTop !== null) {
                            const velocity = Math.abs(lastScrollTop - this.state.currentScrollTop);
                            if (velocity > maxVelocity) {
                                maxVelocity = velocity;
                            }
                        }

                        const currentTickerTime = TweenMax.ticker.time;
                        if (lastTickerTime !== null) {
                            deltaTime = currentTickerTime - lastTickerTime;
                        }
                        lastTickerTime = currentTickerTime;
                        lastScrollTop = this.state.currentScrollTop;
                        this.setState({
                            scrollTop: tween.target.scrollTop,
                        });
                    }, this),
                    onCompleteScope: this,
                    onComplete() {
                        const linearDistance = Math.abs(easeInTo - linearTo);
                        const linearSpeed = (linearDistance * deltaTime) / maxVelocity;

                        this.autoScrollTimeline.to({ scrollTop: currentScrollTop }, linearSpeed, {
                            ease: Linear.easeNone,
                            scrollTop: linearTo,
                            onUpdateParams: ['{self}'],
                            onUpdate: _.bind(function (tween) {
                                this.setState({
                                    scrollTop: tween.target.scrollTop,
                                });
                            }, this),
                        });
                        this.autoScrollTimeline.to(
                            { scrollTop: currentScrollTop },
                            this.props.autoScrollAccelerationSpeed,
                            {
                                ease: Power1.easeOut,
                                scrollTop,
                                onUpdateParams: ['{self}'],
                                onUpdate: _.bind(function (tween) {
                                    this.setState({
                                        scrollTop: tween.target.scrollTop,
                                    });
                                }, this),
                            },
                        );
                    },
                },
            );
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
        /* if (this.props.snapSidebarPointerToClosestLabel)
        {
            var it = this.getItemFromPointerTop();
            if (it.offset > 0.5)
            {
                it.key = this.getNextItemKey(it.key);
            }
            it.offset = 0;
            this.onItemChange(it);

            if (this.props.itemOffset === 0)
            {
                this.updatePointerPosition({
                    animate: true
                });
            }
        } */
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

        const items = ReactDOM.findDOMNode(this.refs.items);
        pointerTop -= this.state.scrollTop || 0;
        return pointerTop;
    },

    getItemFromPointerTop() {
        const pointer = ReactDOM.findDOMNode(this.refs.pointer);
        const { pointerTop } = this.state; // Utils.getTransform(pointer).translateY;

        const $el = $(ReactDOM.findDOMNode(this));
        const $labels = $el.find('.list-sidebar-label');
        const { currentScrollTop } = this.state;
        let currentTop = null;
        let itemKey = null;
        let itemOffset = 0;

        _.every($labels, (label) => {
            const $label = $(label);
            const labelTop = label.offsetTop - currentScrollTop;

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

    isOverPointer(target) {
        return $(target).data('key') === this.props.itemKey;
    },

    onPointerStartDrag() {
        // var content = ReactDOM.findDOMNode(this.refs.content);
        // $(content).css('overflowY', 'hidden');
    },

    onPointerStopDrag() {
        this.userIsGrabbingPointer = false;
        // var content = ReactDOM.findDOMNode(this.refs.content);
        this.setState({
            clientY: null,
        });
        this.killAutoScroll();
        // content).css('overflowY', 'auto');
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

    onTouchStart(e) {
        const touch = e.touches.item(e.touches.length - 1);
        const { clientY } = touch;

        const isOverPointer = this.isOverPointer(e.target);
        if (isOverPointer) {
            this.setState({
                clientY,
            });
        }
    },

    onTouchMove(e) {
        if (this.state.clientY === null) {
            return;
        }

        const touch = e.touches.item(e.touches.length - 1);

        this.setState({
            clientY: touch.clientY,
        });

        // this.onUserMovePointer(touch.clientY);
    },

    onTouchStop(e) {
        if (this.state.clientY !== null) {
            this.onPointerStopDrag();
            this.snapPointerToClosest();
        }
    },

    onMouseDown(e) {
        const { clientY } = e;

        const isOverPointer = this.isOverPointer(e.target);

        if (isOverPointer) {
            this.setState(
                {
                    clientY,
                },
                _.bind(function () {
                    this.addWindowMouseEvents();
                }, this),
            );
        }
    },

    onMouseUp() {
        this.onPointerStopDrag();
        this.removeWindowMouseEvents();
        this.snapPointerToClosest();
    },

    onMouseMove(e) {
        this.setState({
            clientY: e.clientY,
        });

        // this.onUserMovePointer(e.clientY);
    },

    onLabelClick(e, it) {
        this.onItemChange({
            key: _.get(it, 'key'),
            offset: 0,
        });
    },
});

export default Sidebar;
