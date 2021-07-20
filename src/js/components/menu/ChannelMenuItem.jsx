/* eslint-disable react/no-danger */
import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import get from 'lodash/get';

import Utils from '../../lib/utils';
import * as AppPropTypes from '../../lib/PropTypes';

const propTypes = {
    channel: AppPropTypes.channel.isRequired, // eslint-disable-line react/forbid-prop-types
    containerWidth: PropTypes.number,
    containerHeight: PropTypes.number,
    onClick: PropTypes.func,
};

const defaultProps = {
    containerWidth: 0,
    containerHeight: 0,
    onClick: null,
};

const contextTypes = {
    theme: AppPropTypes.theme,
};

class ChannelMenuItem extends PureComponent {
    constructor(props) {
        super(props);

        this.onClick = this.onClick.bind(this);

        this.refContainer = null;
        this.refIcon = null;
        this.refName = null;

        this.state = {
            iconHeight: 0,
        };
    }

    componentDidMount() {
        this.updateIconHeight();
    }

    componentDidUpdate(prevProps) {
        const { containerWidth, containerHeight } = this.props;
        const containerSizeChanged = prevProps.containerWidth !== containerWidth
            || prevProps.containerHeight !== containerHeight;
        if (containerSizeChanged) {
            this.updateIconHeight();
        }
    }

    onClick(e) {
        const { onClick } = this.props;
        e.preventDefault();

        if (onClick !== null) {
            onClick(e);
        }
    }

    updateIconHeight() {
        const { iconHeight } = this.state;
        const el = this.refContainer;
        const nameDOM = this.refName;
        const newIconHeight = el.offsetHeight - nameDOM.offsetHeight;

        if (iconHeight !== newIconHeight) {
            this.setState({
                iconHeight: newIconHeight,
            });
        }
    }

    render() {
        const {
            channel: {
                id: channelId,
                type,
                snippet: { title: channelTitle = '', picture: { link: iconLink = null } = {} } = {},
            },
        } = this.props;
        // const { iconHeight } = this.state;
        const { theme } = this.context;

        const icon = get(theme, `channels.${type}.image`, iconLink || null);

        const iconImageStyle = {};
        if (icon !== null) {
            iconImageStyle.backgroundImage = `url(${icon})`;
        }

        const iconStyle = {
            ...iconImageStyle,
            // height: iconHeight,
        };

        return (
            <div
                className={classNames(['channel-menu-item', `channel-theme-${channelId}`, `channel-theme-type-${type}`])}
                ref={(ref) => {
                    this.refContainer = ref;
                }}
                {...Utils.onClick(this.onClick)}
            >
                <div className="channel-menu-item-inner">
                    <div
                        ref={(ref) => {
                            this.refIcon = ref;
                        }}
                        className="channel-icon"
                        style={iconStyle}
                    />
                    <div
                        ref={(ref) => {
                            this.refName = ref;
                        }}
                        className="channel-name"
                    >
                        <span
                            dangerouslySetInnerHTML={{ __html: channelTitle.replace('/', '/&#8203;') }}
                        />
                    </div>
                </div>
            </div>
        );
    }
}

ChannelMenuItem.propTypes = propTypes;
ChannelMenuItem.defaultProps = defaultProps;
ChannelMenuItem.contextTypes = contextTypes;

export default ChannelMenuItem;
