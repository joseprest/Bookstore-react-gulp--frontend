/* eslint-disable react/jsx-props-no-spreading */
import detectPointerEvents from 'detect-pointer-events';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import $ from 'jquery';
import debounce from 'lodash/debounce';
import classNames from 'classnames';
import createDebug from 'debug';
import { connect } from 'react-redux';
import { TweenMax, TimelineMax, Power1 } from 'gsap/TweenMax';

import Utils from '../../lib/utils';
import * as AppPropTypes from '../../lib/PropTypes';

import Menu from './Menu';
import Channel from '../channels/Channel';
import ChannelsMenu from '../menu/ChannelsMenu';
import Transitionable from '../helpers/Transitionable';
import NavigationActions from '../../actions/NavigationActions';
import ModalsActions from '../../actions/ModalsActions';
import Keyboard from '../keyboard/Keyboard';

const debug = createDebug('manivelle:browser');

const propTypes = {
    id: PropTypes.string.isRequired, // Identify browser for multi-users
    // bubbles to show in Menu (from the selected Slideshow timeline)
    menuBubbles: AppPropTypes.bubbles.isRequired,
    menuBubbleIndex: PropTypes.number.isRequired,
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
    scale: PropTypes.number,
    screenWidth: PropTypes.number.isRequired,
    screenHeight: PropTypes.number.isRequired,
    closeable: PropTypes.bool.isRequired, // show close button
    hasCloseButton: PropTypes.bool,
    disableAutoClose: PropTypes.bool,

    channelId: PropTypes.string, // current channel data
    bubbleId: PropTypes.string, // current channel data
    bubblesIds: PropTypes.arrayOf(PropTypes.string),
    view: PropTypes.string, // current browser view deep string (e.g: channel:main),

    keyboard: AppPropTypes.keyboard,
    modals: AppPropTypes.modals,
    keyboardAlternativeLayout: PropTypes.string,
    animationDuration: PropTypes.number,
    autoCloseBrowserTimeout: PropTypes.number,
    menuWithSummary: PropTypes.bool,
    channelsMenuAlwaysVisible: PropTypes.bool,
    className: PropTypes.string,

    createBrowserTracker: PropTypes.func.isRequired,
    openKeyboard: PropTypes.func.isRequired,
    updateKeyboard: PropTypes.func.isRequired,
    closeKeyboard: PropTypes.func.isRequired,
    openModal: PropTypes.func.isRequired,
    closeBrowser: PropTypes.func.isRequired,
    updateBrowser: PropTypes.func.isRequired,

    onClose: PropTypes.func,
    onIdleChange: PropTypes.func,
};

const defaultProps = {
    hasCloseButton: false,
    disableAutoClose: false,
    scale: 1,
    view: '',
    keyboard: null,
    modals: null,
    channelId: null,
    bubbleId: null,
    bubblesIds: null,
    className: null,
    animationDuration: 0.4,
    keyboardAlternativeLayout: null,
    autoCloseBrowserTimeout: process.env.NODE_ENV !== 'production' ? 9999999 : 60000,
    menuWithSummary: false,
    channelsMenuAlwaysVisible: false,
    onClose: null,
    onIdleChange: null,
};

const contextTypes = {
    data: AppPropTypes.dataRepository,
};

const childContextTypes = {
    browser: AppPropTypes.browserContext,
};

class Browser extends Component {
    constructor(props) {
        super(props);

        this.startAutoCloseTimeout = this.startAutoCloseTimeout.bind(this);
        this.startAutoCloseTimeoutDebounced = debounce(this.startAutoCloseTimeout, 1, {
            leading: true,
        });
        this.onManivelleRotation = this.onManivelleRotation.bind(this);
        this.onUserInteraction = this.onUserInteraction.bind(this);
        this.onModalOpenClick = this.onModalOpenClick.bind(this);
        this.onKeyboardOpenClick = this.onKeyboardOpenClick.bind(this);
        this.onKeyboardPhoneOpenClick = this.onKeyboardPhoneOpenClick.bind(this);
        this.onKeyboardChange = this.onKeyboardChange.bind(this);
        this.onOverlayTransitionIn = this.onOverlayTransitionIn.bind(this);
        this.onOverlayTransitionOut = this.onOverlayTransitionOut.bind(this);
        this.onKeyboardClose = this.onKeyboardClose.bind(this);
        this.onChannelTransitionIn = this.onChannelTransitionIn.bind(this);
        this.onChannelTransitionOut = this.onChannelTransitionOut.bind(this);
        this.onChannelTransitionsComplete = this.onChannelTransitionsComplete.bind(this);
        
        this.onCloseButtonClick = this.onCloseButtonClick.bind(this);

        this.onAutoCloseTimeout = this.onAutoCloseTimeout.bind(this);

        this.autoCloseTimeout = null;
        this.autoCloseDebounce = null;
        this.refContainer = null;
        this.refTopBar = null;
        this.refFooter = null;

        this.state = {
            topBarHeight: 0,
            footerHeight: 0,
            keyboardValue: '',
            channelReady: false,
            channelView:
                props.channelId !== null && props.view !== null && props.view.match(/^channel/)
                    ? `channel:${props.channelId}`
                    : `${props.view}:${props.channelId}`,
            tracker: props.createBrowserTracker(props.id),
        };
    }

    getChildContext() {
        const { id, scale, closeable } = this.props;
        const { tracker } = this.state;
        return {
            browser: {
                id,
                scale,
                closeable,
                tracker,
            },
        };
    }

    componentDidMount() {
        // Update state
        this.setState({
            topBarHeight: this.getTopBarHeight(),
            footerHeight: this.getFooterHeight(),
        });

        $(document).on('manivelle:rotation', this.onManivelleRotation);

        if (detectPointerEvents.hasApi) {
            this.refContainer.addEventListener('pointerdown', this.onUserInteraction);
            this.refContainer.addEventListener('pointermove', this.onUserInteraction);
            this.refContainer.addEventListener('pointerleave', this.onUserInteraction);
            this.refContainer.addEventListener('pointerenter', this.onUserInteraction);
            this.refContainer.addEventListener('pointerup', this.onUserInteraction);
        }

        this.startAutoCloseTimeoutDebounced();
    }

    componentWillReceiveProps(nextProps) {
        const { channelView } = this.state;
        const nextChannelView =
            nextProps.channelId !== null &&
            nextProps.view !== null &&
            nextProps.view.match(/^channel/)
                ? `channel:${nextProps.channelId}`
                : `${nextProps.view}:${nextProps.channelId}`;
        if (nextChannelView !== channelView) {
            this.setState({
                channelView: nextChannelView,
                channelReady: false,
            });
        }
    }

    componentDidUpdate({ width: prevWidth, height: prevHeight }) {
        const { width, height } = this.props;
        const sizeChanged = prevWidth !== width || prevHeight !== height;
        if (sizeChanged) {
            this.updateSize();
        }
    }

    componentWillUnmount() {
        const { tracker } = this.state;
        this.stopAutoCloseTimeout();
        $(document).off('manivelle:rotation', this.onManivelleRotation);

        if (tracker !== null && typeof tracker.destroy !== 'undefined') {
            tracker.destroy();
        }

        if (detectPointerEvents.hasApi) {
            this.refContainer.removeEventListener('pointerdown', this.onUserInteraction);
            this.refContainer.removeEventListener('pointermove', this.onUserInteraction);
            this.refContainer.removeEventListener('pointerleave', this.onUserInteraction);
            this.refContainer.removeEventListener('pointerenter', this.onUserInteraction);
            this.refContainer.removeEventListener('pointerup', this.onUserInteraction);
        }
    }

    onManivelleRotation() {
        this.onUserInteraction();
    }

    onUserInteraction() {
        this.startAutoCloseTimeoutDebounced();
    }

    onModalOpenClick() {
        const { openModal } = this.props;
        openModal();
    }

    onKeyboardOpenClick(e) {
        const { openKeyboard } = this.props;
        e.preventDefault();

        openKeyboard({
            children: (
                <div className="form-group">
                    <input type="text" className="input-text" />
                </div>
            ),
            onChange: this.onKeyboardChange,
        });
    }

    onKeyboardPhoneOpenClick(e) {
        const { openKeyboard } = this.props;

        e.preventDefault();

        openKeyboard({
            layout: 'phone',
            onChange: this.onKeyboardChange,
        });
    }

    onKeyboardChange(value) {
        const { updateKeyboard } = this.props;
        this.setState(
            {
                keyboardValue: value,
            },
            () => {
                const { keyboardValue } = this.state;
                updateKeyboard({
                    children: (
                        <div className="form-group">
                            <input type="text" className="input-text" value={keyboardValue} />
                        </div>
                    ),
                    onChange: this.onKeyboardChange,
                });
            },
        );
    }

    onOverlayTransitionIn(transitionable, opts, done) {
        const { animationDuration } = this.props;
        if (transitionable.key === 'keyboard') {
            const timeline = new TimelineMax({
                onComplete: done,
            });

            const keyboardSafe = $(transitionable.el).find('.keyboard-safe')[0];
            const keyboard = $(transitionable.el).find('.keyboard')[0];
            const btnClose = $(transitionable.el).find('.btn-close')[0];
            const height = keyboard.offsetHeight + btnClose.offsetHeight / 2;

            timeline.fromTo(
                keyboardSafe,
                animationDuration,
                {
                    alpha: 0,
                },
                {
                    alpha: 1,
                    ease: Power1.easeInOut,
                },
                0,
            );
            timeline.from(
                keyboard,
                animationDuration,
                {
                    y: height,
                    ease: Power1.easeInOut,
                },
                0,
            );
        } else {
            TweenMax.from(transitionable.el, animationDuration, {
                alpha: 0,
                onComplete: done,
            });
        }
    }

    onOverlayTransitionOut(transitionable, opts, done) {
        const { animationDuration } = this.props;
        if (transitionable.key === 'keyboard') {
            const timeline = new TimelineMax({
                onComplete: done,
            });

            const keyboardSafe = $(transitionable.el).find('.keyboard-safe')[0];
            const keyboard = $(transitionable.el).find('.keyboard')[0];
            const btnClose = $(transitionable.el).find('.btn-close')[0];
            const height = keyboard.offsetHeight + btnClose.offsetHeight / 2;

            timeline.to(
                keyboardSafe,
                animationDuration,
                {
                    alpha: 0,
                    ease: Power1.easeIn,
                },
                0,
            );
            timeline.to(
                keyboard,
                animationDuration,
                {
                    y: height,
                    ease: Power1.easeIn,
                },
                0,
            );
        } else {
            TweenMax.to(transitionable.el, animationDuration, {
                alpha: 0,
                onComplete: done,
            });
        }
    }

    onKeyboardClose() {
        const { closeKeyboard } = this.props;
        closeKeyboard();
    }

    onChannelTransitionIn(transitionable, opts, done) {
        const { animationDuration } = this.props;
        const timeline = new TimelineMax({
            onComplete: done,
        });
        timeline.fromTo(
            transitionable.el,
            animationDuration,
            {
                scale: 0,
                alpha: 0,
            },
            {
                delay: 0.1,
                // y: '100%',
                scale: 1,
                alpha: 1,
                ease: Power1.easeInOut,
            },
        );
    }

    onChannelTransitionOut(transitionable, opts, done) {
        const { animationDuration } = this.props;
        const timeline = new TimelineMax({
            onComplete: done,
        });

        timeline.to(transitionable.el, animationDuration, {
            // y: '100%',
            scale: 0,
            alpha: 0,
            ease: Power1.easeInOut,
        });
    }

    onChannelTransitionsComplete() {
        const { view } = this.props;
        const viewParts = view.split(':');
        const currentView = viewParts.length ? viewParts[0] : null;

        this.setState({
            channelReady: currentView === 'channel',
        });
    }

    onCloseButtonClick(e) {
        const { id, onClose } = this.props;
        e.preventDefault();

        if (onClose) {
            onClose(id);
        }
        this.close();
    }

    onAutoCloseTimeout() {
        const { disableAutoClose, onIdleChange, updateBrowser } = this.props;
        if (disableAutoClose) {
            debug('Auto-close timeout reached. Browser is idle.');
            onIdleChange(true);
            updateBrowser({
                menuBubbleIndex: null,
                bubbleId: null,
                view: 'menu',
            });
        } else {
            debug('Auto-close timeout reached. Closing browser...');
            this.close();
        }
    }

    getTopBarHeight() {
        return this.refTopBar !== null ? this.refTopBar.offsetHeight : 0;
    }

    getFooterHeight() {
        return this.refFooter !== null ? this.refFooter.offsetHeight : 0;
    }

    updateSize() {
        const { topBarHeight, footerHeight } = this.state;
        const newTopBarHeight = this.getTopBarHeight();
        const newFooterHeight = this.getFooterHeight();
        if (topBarHeight !== newTopBarHeight || footerHeight !== newFooterHeight) {
            this.setState({
                topBarHeight: newTopBarHeight,
                footerHeight: newFooterHeight,
            });
        }
    }

    startAutoCloseTimeout() {
        const { autoCloseBrowserTimeout, disableAutoClose, onIdleChange } = this.props;

        this.stopAutoCloseTimeout();

        if (disableAutoClose) {
            onIdleChange(false);
        }

        debug('Start auto-close timeout');

        this.autoCloseTimeout = setTimeout(this.onAutoCloseTimeout, autoCloseBrowserTimeout);
    }

    stopAutoCloseTimeout() {
        if (this.autoCloseTimeout) {
            debug('Stop auto-close timeout');
            clearTimeout(this.autoCloseTimeout);
            this.autoCloseTimeout = null;
        }

        if (this.startAutoCloseTimeoutDebounced !== null) {
            this.startAutoCloseTimeoutDebounced.cancel();
        }
    }

    close() {
        const { closeBrowser } = this.props;
        closeBrowser();
    }

    renderTopBar() {
        const { closeable, hasCloseButton } = this.props;
        if (!closeable) {
            return null;
        }

        let button;
        if (hasCloseButton) {
            button = (
                <button
                    type="button"
                    className="browser-close"
                    {...Utils.onClick(this.onCloseButtonClick)}
                />
            );
        }

        return (
            <div
                className="browser-top-bar"
                ref={ref => {
                    this.refTopBar = ref;
                }}
            >
                {button}
            </div>
        );
    }

    renderMenu(active) {
        const {
            width,
            height,
            screenWidth,
            screenHeight,
            scale,
            menuWithSummary,
            menuBubbleIndex,
            menuBubbles,
            channelsMenuAlwaysVisible,
        } = this.props;
        const { topBarHeight, footerHeight } = this.state;
        return (
            <Menu
                active={active}
                width={width}
                height={height - topBarHeight - footerHeight}
                slideWidth={screenWidth}
                slideHeight={screenHeight}
                scale={scale}
                bubbles={menuBubbles}
                index={menuBubbleIndex}
                withSummary={menuWithSummary}
                withoutChannelsMenu={channelsMenuAlwaysVisible}
            />
        );
    }

    renderChannel(view) {
        const { width, height, channelId, bubbleId, bubblesIds, modals } = this.props;
        const { topBarHeight, footerHeight, channelReady } = this.state;
        const { data } = this.context;
        const channel = data.findChannelByID(channelId);

        return (
            <Channel
                key={`c-${channelId}`}
                channel={channel}
                width={width}
                height={height - topBarHeight - footerHeight}
                view={view}
                bubbleId={bubbleId}
                bubblesIds={bubblesIds}
                modals={modals}
                ready={channelReady}
                onTransitionComplete={this.onChannelTransitionsComplete}
            />
        );
    }

    renderChannelsMenu() {
        const { width, height } = this.props;
        const { data } = this.context;
        const channels = data.getChannels();
        return (
            <ChannelsMenu
                channels={channels}
                width={width}
                containerHeight={height}
                onChannelClick={this.onChannelClick}
            />
        );
    }

    render() {
        const {
            height,
            scale,
            view,
            channelId,
            className,
            keyboard,
            keyboardAlternativeLayout,
            channelsMenuAlwaysVisible,
            menuBubbles,
        } = this.props;
        const { topBarHeight, footerHeight } = this.state;

        const contentStyle = {
            height: height - topBarHeight - footerHeight,
            top: topBarHeight,
        };

        let menuElement;
        let channelElement;
        if (menuBubbles !== null) {
            const viewParts = view.split(':');
            const currentView = viewParts.length ? viewParts[0] : null;
            menuElement = this.renderMenu(currentView === 'menu');

            if (currentView === 'channel') {
                const channelView = viewParts.slice(1).join(':');
                channelElement = this.renderChannel(channelView);
            }
        }

        const overlays = [];

        // Keyboard
        if (keyboard !== null) {
            const { children = null, ...keyboardProps } = keyboard;
            overlays.push(
                <div key="keyboard" className="keyboard-container">
                    <Keyboard
                        alternativeLayout={keyboardAlternativeLayout}
                        {...keyboardProps}
                        onClose={this.onKeyboardClose}
                    >
                        {children}
                    </Keyboard>
                </div>,
            );
        }

        const style = {};
        if (scale !== 1) {
            // style.transform = 'scale('+this.props.scale+')';
            // console.log(style.transform);
        }

        const activityEvent = {
            onTouchStart: this.onUserInteraction,
            onTouchMove: this.onUserInteraction,
            onTouchEnd: this.onUserInteraction,
            onClick: this.onUserInteraction,
            onMouseMove: this.onUserInteraction,
            onMouseDown: this.onUserInteraction,
            onMouseUp: this.onUserInteraction,
            onMouseLeave: this.onUserInteraction,
            onMouseEnter: this.onUserInteraction,
        };

        return (
            <div
                className={classNames([
                    'browser',
                    {
                        [`channel-theme-${channelId}`]: channelId !== null,
                        [className]: className !== null,
                    },
                ])}
                style={style}
                {...activityEvent}
                ref={ref => {
                    this.refContainer = ref;
                }}
            >
                {this.renderTopBar()}

                <div className="browser-content" style={contentStyle}>
                    {menuElement}
                    <Transitionable
                        transitionIn={this.onChannelTransitionIn}
                        transitionOut={this.onChannelTransitionOut}
                        onTransitionsStart={this.onChannelTransitionsStart}
                        onTransitionsComplete={this.onChannelTransitionsComplete}
                    >
                        {channelElement}
                    </Transitionable>
                </div>

                {channelsMenuAlwaysVisible ? (
                    <div
                        className="browser-footer"
                        ref={ref => {
                            this.refFooter = ref;
                        }}
                    >
                        {this.renderChannelsMenu()}
                    </div>
                ) : null}

                <Transitionable
                    transitionIn={this.onOverlayTransitionIn}
                    transitionOut={this.onOverlayTransitionOut}
                >
                    {overlays}
                </Transitionable>
            </div>
        );
    }
}

Browser.propTypes = propTypes;
Browser.defaultProps = defaultProps;
Browser.contextTypes = contextTypes;
Browser.childContextTypes = childContextTypes;

const WithStateContainer = connect(
    null,
    (dispatch, { id }) => ({
        openKeyboard: props => dispatch(NavigationActions.openKeyboard(id, props)),
        updateKeyboard: props => dispatch(NavigationActions.updateKeyboard(id, props)),
        closeKeyboard: () => dispatch(NavigationActions.closeKeyboard(id)),
        openModal: () =>
            dispatch(
                ModalsActions.open('Modal', {
                    group: id,
                }),
            ),
        updateBrowser: data => dispatch(NavigationActions.updateBrowser(id, data)),
        closeBrowser: () => dispatch(NavigationActions.closeBrowser(id)),
    }),
)(Browser);

export default WithStateContainer;
