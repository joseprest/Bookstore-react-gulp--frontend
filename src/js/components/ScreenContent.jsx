import React, { Component } from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import $ from 'jquery';
import { connect } from 'react-redux';
import Draggable from 'react-draggable';
import { TweenMax } from 'gsap/TweenMax';
import classNames from 'classnames';

import Utils from '../lib/utils';
import * as AppPropTypes from '../lib/PropTypes';
import Timeline from '../lib/timeline';

import Slideshow from './content/Slideshow';
import Browser from './content/Browser';
import Transitionable from './helpers/Transitionable';
import NavigationActions from '../actions/NavigationActions';

// catches onPress events from Slideshow and dispatches a new browser action to
// the navigation store if there is only one maxBrowser, Browser opens fullscreen,
// and slideshow should be in a paused state until Browser is closed else if
// there is more than one maxBrowsers, Browsers opens in a bubble while the
// slideshow keeps animating Browsers in bubble are opened in a zone, a zone is
// splitted equally on the width, one browser per zone
const propTypes = {
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
    maxBrowsers: PropTypes.number,
    browsers: AppPropTypes.browsers,
    clock: PropTypes.number,
    modals: AppPropTypes.modals,
    data: AppPropTypes.dataRepository,
    keyboardAlternativeLayout: PropTypes.string,
    animationDuration: PropTypes.number,
    horizontalScreenBrowserRatio: PropTypes.number,
    browserMarginX: PropTypes.number,
    browserMarginY: PropTypes.number,
    draggableBrowserMarginX: PropTypes.number,
    draggableBrowserMarginY: PropTypes.number,
    disableBrowserAutoClose: PropTypes.bool,
    menuWithSummary: PropTypes.bool,
    channelsMenuAlwaysVisible: PropTypes.bool,

    closeBrowser: PropTypes.func.isRequired,
    openBrowser: PropTypes.func.isRequired,
};

const defaultProps = {
    maxBrowsers: 1,
    browsers: [],
    modals: [],
    data: null,
    clock: 0,
    animationDuration: 0.4,
    horizontalScreenBrowserRatio: 768 / 1024,
    browserMarginX: 30,
    browserMarginY: 30,
    draggableBrowserMarginX: 70,
    draggableBrowserMarginY: 70,
    keyboardAlternativeLayout: null,
    disableBrowserAutoClose: false,
    menuWithSummary: true,
    channelsMenuAlwaysVisible: false,
};

const contextTypes = {
    app: AppPropTypes.app,
};

class ScreenContent extends Component {
    static getModalsByBrowsers(modals, browsers) {
        const browsersModals = browsers.reduce(
            (modalsMap, { id }) => ({
                ...modals,
                [id]: [],
            }),
            {},
        );
        return modals.reduce((modalsMap, { group = '', ...modal }) => {
            const [browserId, ...newGroup] = group.split(':');
            return typeof browsersModals[browserId] !== 'undefined'
                ? {
                    ...modalsMap,
                    [browserId]: [
                        ...modalsMap[browserId],
                        {
                            ...modal,
                            group: newGroup.join(':'),
                        },
                    ],
                }
                : modalsMap;
        }, browsersModals);
    }

    constructor(props) {
        super(props);

        this.renderBrowser = this.renderBrowser.bind(this);
        this.createBrowserTracker = this.createBrowserTracker.bind(this);
        this.onBrowserTransitionsStart = this.onBrowserTransitionsStart.bind(this);
        this.onBrowserTransitionsComplete = this.onBrowserTransitionsComplete.bind(this);
        this.onBrowserTransitionIn = this.onBrowserTransitionIn.bind(this);
        this.onBrowserTransitionOut = this.onBrowserTransitionOut.bind(this);
        this.onBrowserTransitionOther = this.onBrowserTransitionOther.bind(this);
        this.onBrowserIdleChange = this.onBrowserIdleChange.bind(this);
        this.onSlideshowPress = this.onSlideshowPress.bind(this);

        this.refContainer = null;
        this.timeline = new Timeline({
            data: props.data,
            timeline: props.data.getTimeline(),
        });
        const { cycleIndex, bubbles, bubbleIndex } = this.timeline.getStateFromClock(props.clock);

        this.state = {
            timeline: props.data.getTimeline(),
            browserIdle: false,
            slideshowCycleIndex: cycleIndex,
            slideshowBubbles: bubbles,
            slideshowBubbleIndex: bubbleIndex,
            browsersModals: ScreenContent.getModalsByBrowsers(props.modals, props.browsers),
            transitioning: false, // eslint-disable-line react/no-unused-state
        };
    }

    componentWillReceiveProps({
        modals: nextModals,
        browsers: nextBrowsers,
        clock: nextClock,
        data: nextData,
    }) {
        const {
            modals, browsers, clock, disableBrowserAutoClose, data,
        } = this.props;
        const { browserIdle } = this.state;
        const modalsChanged = modals !== nextModals;
        const browsersChanged = browsers !== nextBrowsers;
        const clockChanged = clock !== nextClock;
        const dataChanged = data !== nextData;

        if (dataChanged) {
            const timeline = data.getTimeline();
            this.timeline.setTimeline(timeline);
            this.setState({
                timeline,
            });
        }

        if (modalsChanged || browsersChanged) {
            this.setState({
                browsersModals: ScreenContent.getModalsByBrowsers(nextModals, nextBrowsers),
            });
        }

        const slideshowActive = (disableBrowserAutoClose && browserIdle)
            || (!disableBrowserAutoClose && browsers.length === 0);
        if (clockChanged && slideshowActive) {
            const { cycleIndex, bubbles, bubbleIndex } = this.timeline.getStateFromClock(nextClock);
            this.setState({
                slideshowCycleIndex: cycleIndex,
                slideshowBubbles: bubbles,
                slideshowBubbleIndex: bubbleIndex,
            });
        }
    }

    componentDidUpdate({ maxBrowsers: prevMaxBrowsers }) {
        const { maxBrowsers } = this.props;
        const maxBrowsersChanged = prevMaxBrowsers !== maxBrowsers;
        if (maxBrowsersChanged && maxBrowsers < prevMaxBrowsers) {
            this.closeBrowsers();
        }
    }

    onBrowserTransitionsStart() {
        this.setState({
            transitioning: true, // eslint-disable-line react/no-unused-state
        });
    }

    onBrowserTransitionsComplete() {
        this.setState({
            transitioning: false, // eslint-disable-line react/no-unused-state
        });
    }

    onBrowserTransitionIn(transitionable, opts, done) {
        const { animationDuration } = this.props;
        const browser = $(transitionable.el).find('.browser')[0];

        TweenMax.fromTo(
            browser,
            animationDuration,
            {
                scale: 0,
                alpha: 0,
            },
            {
                scale: 1,
                alpha: 1,
                onComplete: done,
            },
        );
    }

    onBrowserTransitionOut(transitionable, opts, done) {
        const { animationDuration } = this.props;
        const browser = $(transitionable.el).find('.browser')[0];

        TweenMax.to(browser, animationDuration, {
            scale: 0,
            alpha: 0,
            onComplete: done,
        });
    }

    // eslint-disable-next-line class-methods-use-this
    onBrowserTransitionOther(transitionable, opts, done) {
        done();
    }

    onSlideshowPress(bubbleIndex, ids, point) {
        const { openBrowser, browsers, maxBrowsers } = this.props;
        const el = this.refContainer;
        const zoneWidth = el.offsetWidth / maxBrowsers;

        const browserProps = {
            bubbleId: null,
            view: 'menu',
            pointX: _.get(point, 'x', 0),
            pointY: _.get(point, 'y', 0),
            zoneIndex: 0,
        };

        if (maxBrowsers > 1) {
            if (typeof point === 'undefined') {
                return;
            }

            // get zone index from point
            for (let i = 0; i <= maxBrowsers; i += 1) {
                const zoneX = zoneWidth * (i + 1);
                if (point.x < zoneX) {
                    browserProps.zoneIndex = i;
                    break;
                }
            }

            // check if zone is full
            const zoneFull = browsers.find(it => it.zoneIndex === browserProps.zoneIndex) || null;
            if (zoneFull !== null) {
                console.warn('cannot create new browser: zone', browserProps.zoneIndex, 'is full.');
                return;
            }
        } else if (browsers.length === 1) {
            return;
        }

        openBrowser(browserProps);
    }

    onBrowserIdleChange(browserIdle) {
        this.setState({
            browserIdle,
        });
    }

    createBrowserTracker(id) {
        const { app } = this.context;
        return app.createTracker(`browser-${id}`);
    }

    closeBrowsers() {
        const { browsers, maxBrowsers, closeBrowser } = this.props;
        browsers.slice(maxBrowsers).forEach(({ id }) => closeBrowser(id));
    }

    renderBrowser(browser) {
        const {
            width: screenWidth,
            height: screenHeight,
            maxBrowsers,
            draggableBrowserMarginX: draggableMarginX,
            draggableBrowserMarginY: draggableMarginY,
            browserMarginX,
            browserMarginY,
            horizontalScreenBrowserRatio,
            menuWithSummary,
            channelsMenuAlwaysVisible,
            keyboardAlternativeLayout,
            disableBrowserAutoClose,
        } = this.props;
        const {
            browsersModals, slideshowBubbleIndex, slideshowBubbles, browserIdle,
        } = this.state;
        // console.log('browser', browser);
        const isHorizontal = screenWidth > screenHeight;
        let browserWidth = screenWidth;
        let browserHeight = screenHeight;
        let browserScale = 1;

        const containerStyle = {};
        const marginX = browserMarginX + draggableMarginX;
        const marginY = browserMarginY + draggableMarginY;
        let className = '';
        let bounds;

        if (maxBrowsers > 1) {
            browserScale = 1 / maxBrowsers;
            browserWidth = screenWidth * browserScale - marginX * 2;
            browserScale = browserWidth / screenWidth;
            // prettier-ignore
            browserHeight = (
                isHorizontal
                    ? screenWidth / horizontalScreenBrowserRatio
                    : screenHeight
            ) * browserScale;

            // si la hauteur dépasse le screenHeight, height = screenHeight, width selon le ratio
            if (isHorizontal && browserHeight > screenHeight - marginY * 2) {
                browserHeight = screenHeight - marginY * 2;
                browserWidth = screenHeight * horizontalScreenBrowserRatio;
                browserScale = browserWidth / screenWidth;
            }

            const { zoneIndex } = browser;
            const zoneWidth = screenWidth / maxBrowsers;

            const middleX = browserWidth / 2;
            const middleY = browserHeight / 2;

            const minX = zoneIndex * zoneWidth + marginX - draggableMarginX;
            const maxX = minX + (zoneWidth - (marginX - draggableMarginX) * 2) - browserWidth;

            const minY = marginY - draggableMarginY;
            const maxY = screenHeight - middleY * 2 - (marginY - draggableMarginY);

            let left = browser.pointX - middleX;
            let top = browser.pointY - middleY;
            left = Math.max(minX, Math.min(left, maxX));
            top = Math.max(minY, Math.min(top, maxY));

            bounds = {
                left: -left + minX,
                right: -left + maxX,
                top: -top + minY,
                bottom: -top + maxY,
            };

            className = `screen-size-${Utils.getScreenWithSize(browserWidth, browserHeight)}`;

            containerStyle.top = top;
            containerStyle.left = left;
            containerStyle.width = browserWidth;
            containerStyle.height = browserHeight;
        }

        const browserElement = (
            <Browser
                width={browserWidth}
                height={browserHeight}
                scale={browserScale}
                screenWidth={screenWidth * browserScale}
                screenHeight={screenHeight * browserScale}
                closeable={maxBrowsers > 1}
                modals={browsersModals[browser.id]}
                className={className}
                menuWithSummary={menuWithSummary}
                channelsMenuAlwaysVisible={channelsMenuAlwaysVisible}
                keyboardAlternativeLayout={keyboardAlternativeLayout}
                disableAutoClose={disableBrowserAutoClose}
                {...browser}
                menuBubbleIndex={
                    !browserIdle && typeof browser.menuBubbleIndex !== 'undefined'
                        ? browser.menuBubbleIndex || slideshowBubbleIndex
                        : slideshowBubbleIndex
                }
                menuBubbles={slideshowBubbles}
                createBrowserTracker={this.createBrowserTracker}
                onIdleChange={this.onBrowserIdleChange}
            />
        );

        return maxBrowsers === 1 ? (
            <div
                key={`browser-${browser.id}`}
                data-id={browser.id}
                className="browser-container"
                style={containerStyle}
            >
                {browserElement}
            </div>
        ) : (
            <Draggable
                key={`browser-${browser.id}`}
                axis="both"
                handle=".browser-top-bar"
                bounds={bounds}
            >
                <div data-id={browser.id} className="browser-container" style={containerStyle}>
                    {browserElement}
                </div>
            </Draggable>
        );
    }

    renderBrowsers() {
        const { browsers } = this.props;
        const { slideshowBubbleIndex, slideshowBubbles } = this.state;
        return (
            <Transitionable
                className="browsers-container"
                transitionIn={this.onBrowserTransitionIn}
                transitionOut={this.onBrowserTransitionOut}
                transitionOther={this.onBrowserTransitionOther}
                onTransitionsStart={this.onBrowserTransitionsStart}
                onTransitionsComplete={this.onBrowserTransitionsComplete}
                bubbleIndex={slideshowBubbleIndex}
                bubbles={slideshowBubbles}
            >
                {browsers.map(this.renderBrowser)}
            </Transitionable>
        );
    }

    // eslint-disable-next-line class-methods-use-this
    renderBrowserZone(width, index) {
        const style = {
            width,
            left: width * index,
        };

        return <div key={`browser-zone-${index}`} className="browser-zone" style={style} />;
    }

    renderBrowserZones() {
        const { maxBrowsers, width } = this.props;
        const zoneWidth = width / maxBrowsers;
        const browserZones = [];
        for (let i = 0; i <= maxBrowsers; i += 1) {
            browserZones.push(this.renderBrowserZone(zoneWidth, i));
        }
        return <div className="browser-zones">{browserZones}</div>;
    }

    renderSlideshow() {
        const {
            width, height, browsers, maxBrowsers,
        } = this.props;
        const {
            timeline,
            slideshowCycleIndex,
            slideshowBubbles,
            slideshowBubbleIndex,
        } = this.state;
        const presseable = browsers.length < maxBrowsers;
        const oneBrowserOpened = browsers.length >= 1;

        return slideshowBubbles !== null ? (
            <Slideshow
                width={width}
                height={height}
                paused={oneBrowserOpened}
                cycleIndex={slideshowCycleIndex}
                bubbles={slideshowBubbles}
                bubbleIndex={slideshowBubbleIndex}
                presseable={presseable}
                onPress={this.onSlideshowPress}
                timeline={timeline}
            />
        ) : null;
    }

    render() {
        const { browsers, maxBrowsers } = this.props;

        return (
            <div
                className={classNames([
                    'screen-content',
                    {
                        full: browsers.length === maxBrowsers,
                    },
                ])}
                ref={(ref) => {
                    this.refContainer = ref;
                }}
            >
                {this.renderSlideshow()}
                {this.renderBrowserZones()}
                {this.renderBrowsers()}
            </div>
        );
    }
}

ScreenContent.propTypes = propTypes;
ScreenContent.defaultProps = defaultProps;
ScreenContent.contextTypes = contextTypes;

const WithStateContainer = connect(
    null,
    dispatch => ({
        closeBrowser: id => dispatch(NavigationActions.closeBrowser(id)),
        openBrowser: browser => dispatch(NavigationActions.openBrowser(browser)),
    }),
)(ScreenContent);

export default WithStateContainer;
