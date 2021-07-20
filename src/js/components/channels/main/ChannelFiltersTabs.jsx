import React from 'react';
import PropTypes from 'prop-types';
import ReactDOM from 'react-dom';
import _ from 'lodash';
import $ from 'jquery';
import { TweenMax, TimelineMax } from 'gsap/TweenMax';

import * as TabsComponents from '../tabs';

import Utils from '../../../lib/utils';

import ChannelTabs from '../ChannelTabs';
import ChannelTab from '../ChannelTab';

const ChannelFiltersTabs = React.createClass({
    propTypes: {
        bubbles: PropTypes.array.isRequired,
        width: PropTypes.number.isRequired,
        height: PropTypes.number.isRequired,
        topBarHeight: PropTypes.number.isRequired,
        active: PropTypes.bool.isRequired,
        ready: PropTypes.bool.isRequired,

        initialTabIndex: PropTypes.number,
    },

    contextTypes: {
        data: PropTypes.object,
        channel: PropTypes.object,
    },

    getDefaultProps() {
        return {
            initialTabIndex: 0,
        };
    },

    getInitialState() {
        const filters = _.get(this.context.channel, 'filters', []);
        return {
            transitioning: false,
            tabHeight: null,
            tabIndex: this.props.initialTabIndex,
            filters,
            filtersBubbles: this.getFiltersBubbles(filters),
        };
    },

    render() {
        const tabs = this.renderFiltersTabs();

        return (
            <div className="channel-filters-tabs">
                <ChannelTabs ref="tabs" onChange={this.onChangeTab}>
                    {tabs}
                </ChannelTabs>
            </div>
        );
    },

    renderFiltersTabs() {
        return this.state.filters.map(_.bind(this.renderFilterTab, this));
    },

    renderFilterTab(filter, index) {
        const active = index === this.state.tabIndex;
        const title = _.get(filter, 'label', 'Label');
        const icon = _.get(filter, 'icon');

        const { tabHeight } = this.state;
        let tabsBtnsHeight = null;

        let content;

        if (tabHeight) {
            tabsBtnsHeight = this.props.height - tabHeight;

            let Component;
            const componentProps = _.extend(
                _.omit(this.props, ['bubbles', 'initialTabIndex', 'height', 'topBarHeight']),
                _.omit(filter, ['name', 'type', 'label', 'values']),
            );
            componentProps.filterLabel = _.get(filter, 'label');
            componentProps.active = active && this.props.active;
            componentProps.ready = this.props.ready;
            componentProps.height = tabHeight;
            componentProps.topSpaceHeight = tabsBtnsHeight + this.props.topBarHeight;

            const filterType = _.get(filter, 'type');
            const filterName = _.get(filter, 'name');
            componentProps.filteredBubbles = this.state.filtersBubbles[filterName] || [];

            Component = Utils.getComponentFromType(TabsComponents, filterType);

            if (componentProps.filteredBubbles.length) {
                content = <Component {...componentProps} />;
            }
        }

        return (
            <ChannelTab
                ref={`tab${index}`}
                key={`t-${index}`}
                title={title}
                icon={icon}
                active={active}
                height={tabHeight}
            >
                {content}
            </ChannelTab>
        );
    },

    componentDidMount() {
        this.setState({
            tabHeight: this.getTabHeight(),
        });

        // hide inactive tab
        for (let i = 0, il = this.state.filters.length; i < il; i++) {
            const active = i === this.state.tabIndex;
            if (!active) {
                const tab = ReactDOM.findDOMNode(this.refs[`tab${i}`]);
                TweenMax.set(tab, {
                    autoAlpha: 0,
                });
            }
        }
    },

    componentDidUpdate(prevProps, prevState) {
        const sizeChanged = prevProps.width !== this.props.width || prevProps.height !== this.props.height;
        const tabIndexChanged = prevState.tabIndex !== this.state.tabIndex;
        const state = {};
        let stateChanged = false;

        if (sizeChanged) {
            stateChanged = true;
            state.tabHeight = this.getTabHeight();
        }

        if (tabIndexChanged) {
            const previousTab = ReactDOM.findDOMNode(this.refs[`tab${prevState.tabIndex}`]);
            const currentTab = ReactDOM.findDOMNode(this.refs[`tab${this.state.tabIndex}`]);
            state.transitioning = true;
            stateChanged = true;
            this.onTabTransitionStart(previousTab, currentTab);
        }

        if (stateChanged) {
            this.setState(state);
        }
    },

    getFiltersBubbles(filters) {
        const filtersBubbles = {};
        let filter; let
            filterName;
        const channelId = this.context.channel.id;
        for (let i = 0, l = filters.length; i < l; i++) {
            filter = filters[i];
            filterName = _.get(filter, 'name');
            filtersBubbles[filterName] = this.context.data.getChannelFilter(channelId, filterName);
        }
        return filtersBubbles;
    },

    getTabHeight() {
        const tabs = ReactDOM.findDOMNode(this.refs.tabs);
        const $tabsList = $(tabs).find('.channel-tabs-list');
        const tabsListHeight = $tabsList[0].offsetHeight;

        return this.props.height - tabsListHeight;
    },

    onTabTransitionStart(previousTab, currentTab) {
        const animationDuration = 0.4;

        const timeline = new TimelineMax({
            onComplete: this.onTabTransitionComplete,
        });

        timeline.to(
            previousTab,
            animationDuration / 2,
            {
                autoAlpha: 0,
            },
            0,
        );

        timeline.fromTo(
            currentTab,
            animationDuration / 2,
            {
                autoAlpha: 0,
            },
            {
                delay: animationDuration / 2,
                autoAlpha: 1,
            },
            0,
        );
    },

    onTabTransitionComplete() {
        this.setState({
            transitioning: false,
        });
    },

    onChangeTab(tab, index) {
        if (this.state.transitioning || this.state.tabIndex === index) {
            return;
        }

        this.setState({
            tabIndex: index,
        });
    },
});

export default ChannelFiltersTabs;
