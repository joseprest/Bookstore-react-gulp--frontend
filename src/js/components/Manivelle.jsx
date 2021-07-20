/* eslint-disable react/jsx-props-no-spreading */
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import createDebug from 'debug';
import classNames from 'classnames';

import * as AppPropTypes from '../lib/PropTypes';
import DebugControls from './debug/Controls';
import ScreenHeader from './ScreenHeader';
import ScreenContent from './ScreenContent';
import Setup from './setup/Setup';
import ChannelTheme from './helpers/ChannelTheme';
import Theme from './helpers/Theme';

const debugComponent = createDebug('manivelle:component:manivelle');

const propTypes = {
    width: PropTypes.number, // manivelle width (window width for now)
    height: PropTypes.number, // manivelle height (window height for now)
    ready: PropTypes.bool,
    debug: PropTypes.bool,
    app: AppPropTypes.app.isRequired,
    api: AppPropTypes.api.isRequired,
    data: AppPropTypes.dataRepository,
    setup: AppPropTypes.setup.isRequired,
    screen: AppPropTypes.screen,
    hasHeader: PropTypes.bool, // defines if header is present
    headerTitle: PropTypes.string,
    maxBrowsers: PropTypes.oneOfType([PropTypes.number, PropTypes.oneOf(['auto'])]), // defines the number of openable browsers -> Content
    keyboardAlternativeLayout: PropTypes.string,
    menuWithSummary: PropTypes.bool,
    channelsMenuAlwaysVisible: PropTypes.bool,
    hasManivelle: PropTypes.bool,
    autoBrowserMaxWidth: PropTypes.number,
    disableBrowserAutoClose: PropTypes.bool,
    fontFamily: PropTypes.oneOf(['normal', 'simplon']),
    browsers: AppPropTypes.browsers, // current opened browsers are pushed here -> Content
    modals: AppPropTypes.modals, // all modals
    clock: PropTypes.number, // manivelle clock in ms from UTC -> Header,
    timezone: PropTypes.string,
    theme: AppPropTypes.theme,
    onActivityChange: PropTypes.func,
    onReady: PropTypes.func,
};

const defaultProps = {
    width: 0,
    height: 0,
    ready: false,
    debug: false,
    data: null,
    screen: null,
    hasHeader: true,
    headerTitle: null,
    keyboardAlternativeLayout: null,
    menuWithSummary: false,
    channelsMenuAlwaysVisible: false,
    hasManivelle: process.env.NODE_ENV === 'production',
    fontFamily: 'normal', // 'normal' || 'simplon'
    maxBrowsers: 'auto',
    disableBrowserAutoClose: false,
    autoBrowserMaxWidth: 1000, // fit three browsers in a 4k resolution (3840*2160)
    browsers: [],
    modals: [],
    clock: 0,
    timezone: null,
    theme: null,
    onActivityChange: null,
    onReady: null,
};

const childContextTypes = {
    app: AppPropTypes.app,
    api: AppPropTypes.api,
    data: AppPropTypes.dataRepository,
    screen: AppPropTypes.screen,
    theme: AppPropTypes.theme,
    hasManivelle: PropTypes.bool,
    debug: PropTypes.bool,
    keyboardAlternativeLayout: PropTypes.string,
};

class Manivelle extends Component {
    constructor(props) {
        super(props);

        this.renderChannelTheme = this.renderChannelTheme.bind(this);
        this.onSetupCompleted = this.onSetupCompleted.bind(this);
        this.onActivityChange = this.onActivityChange.bind(this);

        this.refHeaderContainer = null;

        this.state = {
            ready: props.ready,
            headerHeight: !props.hasHeader ? 0 : null,
            maxBrowsers:
                props.maxBrowsers === 'auto'
                    ? this.getMaxBrowsersFromWidth(props.width, props.autoBrowserMaxWidth)
                    : props.maxBrowsers,
        };
    }

    getChildContext() {
        const { app, data, api, screen, theme, hasManivelle, debug } = this.props;
        return {
            app,
            data,
            api,
            screen,
            theme,
            hasManivelle,
            debug,
        };
    }

    componentDidMount() {
        this.updateSize();
    }

    componentWillReceiveProps({
        width: nextWidth,
        maxBrowsers: nextMaxBrowsers,
        autoBrowserMaxWidth: nextAutoBrowserMaxWidth,
        ready: nextReady,
    }) {
        const state = {};

        if (!nextReady) {
            state.ready = false;
        }

        const { width, maxBrowsers } = this.props;
        const widthChanged = width !== nextWidth;
        const maxBrowsersChanged = maxBrowsers !== nextMaxBrowsers;

        if (nextMaxBrowsers === 'auto' && (widthChanged || maxBrowsersChanged)) {
            state.maxBrowsers = this.getMaxBrowsersFromWidth(nextWidth, nextAutoBrowserMaxWidth);
        } else if (maxBrowsersChanged) {
            state.maxBrowsers = nextMaxBrowsers;
        }

        if (Object.keys(state).length) {
            this.setState(state);
        }
    }

    componentDidUpdate(
        { browsers: prevBrowsers, width: prevWidth, height: prevHeight },
        { ready: prevReady },
    ) {
        const { width, height, browsers, onReady } = this.props;
        const { ready } = this.state;

        const prevBrowsersCount = prevBrowsers.length;
        const browsersCount = browsers.length;
        if (prevBrowsersCount && !browsersCount) {
            this.onActivityChange(false);
        } else if (!prevBrowsersCount && browsersCount) {
            this.onActivityChange(true);
        }

        const sizeChanged = prevWidth !== width || prevHeight !== height;
        if (sizeChanged) {
            this.updateSize();
        }

        if (prevReady !== ready && ready) {
            this.updateSize();
            if (onReady !== null) {
                onReady();
            }
        }
    }

    /**
     * Events handlers
     */
    onSetupCompleted() {
        const { setup } = this.props;
        const { ready = false } = setup;
        this.setState({
            ready,
        });
    }

    onActivityChange(activity) {
        const { onActivityChange } = this.props;
        if (onActivityChange !== null) {
            onActivityChange(activity);
        }
    }

    // eslint-disable-next-line class-methods-use-this
    getMaxBrowsersFromWidth(width, maxBrowserWidth) {
        /* width /= window.devicePixelRatio; */
        const maxBrowsers = Math.max(1, Math.floor(width / maxBrowserWidth));
        debugComponent(`max browser width: ${maxBrowserWidth}.`);
        debugComponent(`max browsers: ${maxBrowsers}.`);
        // debug('using pixelRatio: '+window.devicePixelRatio+'.');
        return maxBrowsers;
    }

    updateSize() {
        if (this.refHeaderContainer !== null) {
            this.setState({
                headerHeight: this.refHeaderContainer.offsetHeight,
            });
        }
    }

    renderSetup() {
        const { setup } = this.props;
        const { loadingPercent, loadingMessage, screen, ready = false } = setup;
        return (
            <Setup
                loadingPercent={ready ? 100 : loadingPercent}
                loadingMessage={loadingMessage}
                screen={screen}
                onCompleted={this.onSetupCompleted}
            />
        );
    }

    renderHeader() {
        const { width, hasHeader, debug, clock, timezone, headerTitle } = this.props;
        const { headerHeight } = this.state;
        if (!hasHeader) {
            return null;
        }

        const messages = debug
            ? [
                  {
                      icon: '/images/ui/messages/weather/cloudy.svg',
                      label: '9°C',
                  },
              ]
            : [];

        return (
            <div
                className="header-screen-container"
                ref={ref => {
                    this.refHeaderContainer = ref;
                }}
            >
                <ScreenHeader
                    width={width}
                    height={headerHeight}
                    clock={clock}
                    timezone={timezone}
                    messages={messages}
                    title={headerTitle}
                />
            </div>
        );
    }

    renderContent() {
        const {
            width,
            height,
            browsers,
            clock,
            modals,
            data,
            disableBrowserAutoClose,
            menuWithSummary,
            keyboardAlternativeLayout,
            channelsMenuAlwaysVisible,
        } = this.props;
        const { maxBrowsers, headerHeight } = this.state;

        if (headerHeight === null) {
            return null;
        }

        return (
            <div className="content-screen-container">
                <ScreenContent
                    width={width}
                    height={height - headerHeight}
                    maxBrowsers={maxBrowsers}
                    disableBrowserAutoClose={disableBrowserAutoClose}
                    browsers={browsers}
                    clock={clock}
                    modals={modals}
                    data={data}
                    menuWithSummary={menuWithSummary}
                    channelsMenuAlwaysVisible={channelsMenuAlwaysVisible}
                    keyboardAlternativeLayout={keyboardAlternativeLayout}
                />
            </div>
        );
    }

    renderChannelThemes() {
        const { data } = this.props;
        const channels = data.getChannels();
        return channels.map(this.renderChannelTheme);
    }

    // eslint-disable-next-line class-methods-use-this
    renderChannelTheme(channel) {
        return (
            <ChannelTheme
                key={`channel-theme-${channel.id}`}
                name={channel.id}
                theme={channel.fields.theme}
            />
        );
    }

    renderTheme() {
        const { theme } = this.props;
        return theme !== null ? <Theme {...theme} /> : null;
    }

    renderDebugControls() {
        const { debug } = this.props;
        if (!debug) {
            return null;
        }

        return <DebugControls {...this.props} />;
    }

    render() {
        const { fontFamily, theme, } = this.props;
        const { ready } = this.state;

        return (
            <div
                className={classNames([
                    'manivelle',
                    {
                        'font-normal': fontFamily === null || fontFamily.length === 0,
                        [`font-${fontFamily || ''}`]: fontFamily !== null && fontFamily.length > 0,
                        [`theme-${theme !== null ? theme.id : null}`]: theme !== null,
                    },
                ])}
            >
                {!ready && this.renderSetup()}
                {ready && this.renderDebugControls()}
                {ready && this.renderHeader()}
                {ready && this.renderContent()}
                {ready && this.renderChannelThemes()}
                {ready && this.renderTheme()}
            </div>
        );
    }
}

Manivelle.propTypes = propTypes;
Manivelle.childContextTypes = childContextTypes;
Manivelle.defaultProps = defaultProps;

export default Manivelle;
