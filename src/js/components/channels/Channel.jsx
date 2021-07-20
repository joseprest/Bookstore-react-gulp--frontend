import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { TimelineMax, Power1 } from 'gsap/TweenMax';
import classNames from 'classnames';
import { connect } from 'react-redux';
// import createDebug from 'debug';

import ChannelMain from './ChannelMain';
import ChannelBubbles from './ChannelBubbles';
import Transitionable from '../helpers/Transitionable';
// import Transitionable from 'react-transitionable';

import * as AppPropTypes from '../../lib/PropTypes';
import Text from '../../lib/text';
import NavigationActions from '../../actions/NavigationActions';

// const debugChannel = createDebug('app:components:channel');

const propTypes = {
    channel: AppPropTypes.channel.isRequired,
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
    view: PropTypes.string.isRequired, // main || bubbles
    ready: PropTypes.bool.isRequired,
    bubbleId: PropTypes.string,
    bubblesIds: PropTypes.arrayOf(PropTypes.string),
    updateBrowser: PropTypes.func.isRequired,

    animationDuration: PropTypes.number,

    modals: AppPropTypes.modals,
    onTransitionComplete: PropTypes.func,
};

const defaultProps = {
    bubbleId: null,
    animationDuration: 0.4,
    bubblesIds: null,
    modals: [],
    onTransitionComplete: null,
};

const contextTypes = {
    browser: AppPropTypes.browser,
    data: AppPropTypes.dataRepository,
};

const childContextTypes = {
    channel: AppPropTypes.channel,
};

class Channel extends Component {
    constructor(props) {
        super(props);

        this.onChannelBubblesTransitionIn = this.onChannelBubblesTransitionIn.bind(this);
        this.onChannelBubblesTransitionOut = this.onChannelBubblesTransitionOut.bind(this);
        this.onChannelBubblesTransitionComplete = this.onChannelBubblesTransitionComplete.bind(this);
        this.onBackButtonClick = this.onBackButtonClick.bind(this);

        this.refMain = null;
        this.refBubbles = null;

        this.state = {
            previousView: null,
            channelBubbles: [],
        };
    }

    getChildContext() {
        const { channel } = this.props;
        return {
            channel,
        };
    }

    componentDidMount() {
        const { channel, bubblesIds } = this.props;
        this.setState({
            channelBubbles: this.getChannelBubbles(channel, bubblesIds),
        });
    }

    componentWillReceiveProps({
        view: nextView,
        channel: nextChannel,
        bubblesIds: nextBubblesIds,
    }) {
        const { view, channel, bubblesIds } = this.props;
        const viewChanged = view !== nextView;
        const channelChanged = channel !== nextChannel;
        const bubblesIdsChanged = bubblesIds !== nextBubblesIds;

        if (viewChanged) {
            this.setState({
                previousView: view,
            });
        }

        if (channelChanged || bubblesIdsChanged) {
            this.setState({
                channelBubbles: this.getChannelBubbles(nextChannel, nextBubblesIds),
            });
        }
    }

    onChannelBubblesTransitionIn(transitionable, opts, done) {
        const { animationDuration, width } = this.props;
        const main = this.refMain;
        const bubbles = this.refBubbles;

        const timeline = new TimelineMax({
            onComplete: done,
        });

        timeline.to(
            main,
            animationDuration,
            {
                x: -width,
                ease: Power1.easeInOut,
            },
            0,
        );
        timeline.from(
            bubbles,
            animationDuration,
            {
                x: width,
                ease: Power1.easeInOut,
            },
            0,
        );
    }

    onChannelBubblesTransitionOut(transitionable, opts, done) {
        const { animationDuration, width } = this.props;
        const main = this.refMain;
        const bubbles = this.refBubbles;

        const timeline = new TimelineMax({
            onComplete: done,
        });

        timeline.to(
            main,
            animationDuration,
            {
                x: 0,
                ease: Power1.easeInOut,
            },
            0,
        );
        timeline.to(
            bubbles,
            animationDuration,
            {
                x: width,
                ease: Power1.easeInOut,
            },
            0,
        );
    }

    onChannelBubblesTransitionComplete() {
        const { onTransitionComplete } = this.props;
        if (onTransitionComplete !== null) {
            onTransitionComplete();
        }
    }

    onBackButtonClick() {
        const { updateBrowser } = this.props;
        const { previousView } = this.state;
        const {
            browser: { id: browserId },
        } = this.context;
        const params = {
            bubbleId: null,
        };

        if (previousView === 'main') {
            params.view = `channel:${previousView}`;
        } else {
            params.view = 'menu';
            params.channelId = null;
        }

        updateBrowser(browserId, params);
    }

    getChannelBubbles({ id: channelId }, bubblesIds) {
        const { data: dataRepository } = this.context;
        if (bubblesIds && bubblesIds.length) {
            return dataRepository.getBubblesByIDs(bubblesIds);
        }
        return dataRepository.getBubblesByChannelID(channelId);
    }

    render() {
        const {
            width, height, channel, bubbleId, ready, modals, view,
        } = this.props;
        const { previousView, channelBubbles } = this.state;
        // const contentStyle = {
        //     height,
        // };

        let channelBubblesElement;

        const channelProps = {
            width,
            height,
            channel,
            bubbles: channelBubbles,
            bubbleId,
            ready,
            onBackButtonClick: this.onBackButtonClick,
        };

        const mainModals = [];
        const bubblesModals = [];

        for (let i = 0, il = modals.length; i < il; i += 1) {
            const modal = modals[i];
            if (modal.group === 'channelMain') {
                mainModals.push(modal);
            } else if (modal.group === 'channelBubbles') {
                bubblesModals.push(modal);
            }
        }

        let channelMainElement;
        const homeButtonLabel = Text.t('btn_home');

        if (view === 'main' || previousView === 'main') {
            let initialTabIndex; // pourrait etre un param du browser
            channelMainElement = (
                <ChannelMain
                    refContainer={(ref) => {
                        this.refMain = ref;
                    }}
                    key="channel-main"
                    initialTabIndex={initialTabIndex}
                    active={view === 'main'}
                    modals={mainModals}
                    backButtonLabel={homeButtonLabel}
                    {...channelProps}
                />
            );
        }

        if (view === 'bubbles') {
            const backButtonLabel = Text.t('btn_home');
            channelBubblesElement = (
                <ChannelBubbles
                    refContainer={(ref) => {
                        this.refBubbles = ref;
                    }}
                    key="channel-bubbles"
                    active={view === 'bubbles'}
                    modals={bubblesModals}
                    backButtonLabel={backButtonLabel}
                    {...channelProps}
                />
            );
        }

        const channelContent = (
            <div className="channel-content">
                {channelMainElement}
                <Transitionable
                    transitionIn={this.onChannelBubblesTransitionIn}
                    transitionOut={this.onChannelBubblesTransitionOut}
                    onTransitionsComplete={this.onChannelBubblesTransitionComplete}
                >
                    {channelBubblesElement}
                </Transitionable>
            </div>
        );

        return (
            <div className={classNames(['channel', `channel-theme-${channel.id}`])}>
                {channelContent}
            </div>
        );
    }
}

Channel.propTypes = propTypes;
Channel.defaultProps = defaultProps;
Channel.contextTypes = contextTypes;
Channel.childContextTypes = childContextTypes;

const WithStateContainer = connect(
    null,
    dispatch => ({
        // prettier-ignore
        updateBrowser: (browserId, props) => (
            dispatch(NavigationActions.updateBrowser(browserId, props))
        ),
    }),
)(Channel);
export default WithStateContainer;
