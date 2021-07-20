import React, { Component } from 'react';
import PropTypes from 'prop-types';
import slug from 'slug';

import Button from '../partials/Button';
import * as AppPropTypes from '../../lib/PropTypes';

const propTypes = {
    onChange: PropTypes.func,
    children: PropTypes.node,
};

const defaultProps = {
    onChange: null,
    children: null,
};

const contextTypes = {
    channel: AppPropTypes.channel,
    browser: AppPropTypes.browser,
};

class ChannelTabs extends Component {
    static getTabsFromChildren(children) {
        return children.map(({ props: { title = '', icon = null, active = false } = {} }) => ({
            title,
            icon,
            active,
        }));
    }

    constructor(props) {
        super(props);

        this.renderTabButton = this.renderTabButton.bind(this);
        this.onChangeTab = this.onChangeTab.bind(this);

        this.state = {
            tabs: ChannelTabs.getTabsFromChildren(props.children),
        };
    }

    componentWillReceiveProps({ children: nextChildren }) {
        const { children } = this.props;
        // @TODO toujours true
        if (children !== nextChildren) {
            this.setState({
                tabs: ChannelTabs.getTabsFromChildren(nextChildren),
            });
        }
    }

    onChangeTab(tab, index) {
        const { onChange } = this.props;
        const { browser, channel } = this.context;
        if (onChange !== null) {
            onChange(tab, index);
        }

        const tabSlug = slug(tab.title, {
            lower: true,
        });
        browser.tracker.channelPageview(channel, `/tabs/${tabSlug}`);
    }

    renderTabButton(tab, index) {
        const onClick = () => this.onChangeTab(tab, index);
        return (
            <Button key={`b${index}`} active={tab.active} icon={tab.icon} onClick={onClick}>
                {tab.title}
            </Button>
        );
    }

    renderTabsButtons() {
        const { tabs } = this.state;
        if (tabs.length <= 1) {
            return <div className="channel-tabs-list btn-group" />;
        }
        return <div className="channel-tabs-list btn-group">{tabs.map(this.renderTabButton)}</div>;
    }

    render() {
        const { children } = this.props;
        const buttons = this.renderTabsButtons();

        return (
            <div className="channel-tabs">
                {buttons}
                {children}
            </div>
        );
    }
}

ChannelTabs.propTypes = propTypes;
ChannelTabs.defaultProps = defaultProps;
ChannelTabs.contextTypes = contextTypes;

export default ChannelTabs;
