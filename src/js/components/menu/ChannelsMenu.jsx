import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import ChannelMenuItem from './ChannelMenuItem';
import * as AppPropTypes from '../../lib/PropTypes';
import ModalsActions from '../../actions/ModalsActions';
import NavigationActions from '../../actions/NavigationActions';

const propTypes = {
    channels: AppPropTypes.channels.isRequired,
    onChannelClick: PropTypes.func,
    width: PropTypes.number,
    containerHeight: PropTypes.number,
    updateBrowser: PropTypes.func.isRequired,
    closeModals: PropTypes.func.isRequired,
};

const defaultProps = {
    width: 0,
    containerHeight: 0,
    onChannelClick: null,
};

const contextTypes = {
    browser: AppPropTypes.browser,
};

class ChannelsMenu extends Component {
    constructor(props) {
        super(props);
        this.renderChannelMenuItem = this.renderChannelMenuItem.bind(this);
    }

    onMenuItemClick(e, channel) {
        const { updateBrowser, closeModals, onChannelClick } = this.props;
        const {
            browser: { id: browserId, channelId: currentChannelId },
        } = this.context;
        const { id: channelId } = channel;

        updateBrowser(browserId, {
            view: 'channel:main',
            channelId,
        });

        if (channelId !== currentChannelId) {
            closeModals(browserId);
        }

        if (onChannelClick !== null) {
            onChannelClick(e, channel);
        }
    }

    renderChannelMenuItem(channel, index) {
        const { width, containerHeight } = this.props;
        const onMenuItemClick = e => this.onMenuItemClick(e, channel);
        return (
            <ChannelMenuItem
                key={`channel-menu-${index}`}
                channel={channel}
                onClick={onMenuItemClick}
                containerWidth={width}
                containerHeight={containerHeight}
            />
        );
    }

    render() {
        const { channels } = this.props;
        return <div className="channels-menu">{channels.map(this.renderChannelMenuItem)}</div>;
    }
}

ChannelsMenu.propTypes = propTypes;
ChannelsMenu.defaultProps = defaultProps;
ChannelsMenu.contextTypes = contextTypes;

const WithStateContainer = connect(
    null,
    dispatch => ({
        updateBrowser: (id, props) => dispatch(NavigationActions.updateBrowser(id, props)),
        closeModals: id => dispatch(ModalsActions.closeBrowserModals(id)),
    }),
)(ChannelsMenu);
export default WithStateContainer;
