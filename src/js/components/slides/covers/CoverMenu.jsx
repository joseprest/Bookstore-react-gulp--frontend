/* eslint-disable react/no-danger */
import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';
import { connect } from 'react-redux';
import Color from 'color';

import * as AppPropTypes from '../../../lib/PropTypes';
import Text from '../../../lib/text';
import NavigationActions from '../../../actions/NavigationActions';
import Button from '../../partials/Button';

// const Cache = CacheManager.create('sizes.slide-cover-slideshow');

const propTypes = {
    data: AppPropTypes.bubble.isRequired,
    context: PropTypes.string,
    width: PropTypes.number,
    height: PropTypes.number,
    updateBrowser: PropTypes.func.isRequired,
};

const defaultProps = {
    width: 0,
    height: 0,
    context: 'menu',
};

const contextTypes = {
    browser: AppPropTypes.browserContext,
    data: AppPropTypes.dataRepository,
};

const linearGradientsCache = {};

class MenuCover extends PureComponent {
    static getLinearGradient(color) {
        if (isEmpty(color)) {
            return color;
        }
        if (typeof linearGradientsCache[color] === 'undefined') {
            const rgb = new Color(color)
                .rgb()
                .array()
                .join(', ');
            linearGradientsCache[color] = `linear-gradient(rgba(${rgb}, 0), rgba(${rgb}, 1) 55%)`;
        }
        return linearGradientsCache[color];
    }

    constructor(props) {
        super(props);

        this.onButtonClick = this.onButtonClick.bind(this);

        this.state = {};
    }

    onButtonClick() {
        const { data, updateBrowser } = this.props;
        const { browser, data: dataRepository } = this.context;
        const { id: browserId } = browser;
        const { id: bubbleId, channel_id: channelId } = data;
        const bubbleChannel = dataRepository.findChannelByID(channelId);
        const browserView =
            get(bubbleChannel, 'fields.settings.slideMenuDestinationView', null) ||
            'channel:bubbles';

        updateBrowser(browserId, {
            view: browserView,
            channelId,
            bubbleId,
        });
    }

    getCacheKey() {
        const { context, data, width, height } = this.props;
        return `${context}_${data.id}_${width}_${height}`;
    }

    render() {
        const { data } = this.props;
        const { data: dataRepository } = this.context;
        const { channel_id: channelId = null } = data;
        const channel = dataRepository.findChannelByID(channelId);

        const channelColor = get(channel, 'fields.theme.color_medium', null);
        const style = {
            backgroundColor: channelColor,
        };

        const type = get(data, 'type_name', null);
        const title = get(data, 'snippet.title', null);
        const subtitle = get(data, 'snippet.subtitle', null);
        const description = get(data, 'snippet.description', null);
        const picture = get(data, 'snippet.picture.link', null);
        const pictureWidth = get(data, 'snippet.picture.width', 0);
        const pictureHeight = get(data, 'snippet.picture.height', 0);

        const pictureStyle = {
            backgroundImage: picture !== null ? `url(${picture})` : null,
            paddingBottom:
                pictureWidth > 0 && pictureHeight > 0
                    ? `${(pictureHeight / pictureWidth) * 100}%`
                    : null,
        };

        const footerStyle = {
            background: MenuCover.getLinearGradient(channelColor),
        };

        return (
            <div className={classNames(['slide-cover', 'slide-cover-menu'])} style={style}>
                <div className="slide-cover-inner">
                    {picture !== null ? (
                        <div className="slide-cover-image-container">
                            <div className="slide-cover-image" style={pictureStyle} />
                        </div>
                    ) : null}
                    <div className="slide-cover-title-container">
                        {type !== null ? <h4 className="slide-cover-type">{type}</h4> : null}
                        {title !== null ? <h3 className="slide-cover-title">{title}</h3> : null}
                        {subtitle !== null ? (
                            <h3 className="slide-cover-subtitle">{subtitle}</h3>
                        ) : null}
                    </div>
                    {description !== null ? (
                        <div
                            className="slide-cover-description"
                            dangerouslySetInnerHTML={{ __html: description }}
                        />
                    ) : null}
                </div>
                <div className="slide-cover-footer" style={footerStyle}>
                    <Button icon="right" iconPosition="right" onClick={this.onButtonClick}>
                        {Text.t('btn_summary')}
                    </Button>
                </div>
            </div>
        );
    }
}

MenuCover.propTypes = propTypes;
MenuCover.defaultProps = defaultProps;
MenuCover.contextTypes = contextTypes;

const WithStateContainer = connect(
    null,
    dispatch => ({
        updateBrowser: (id, props) => dispatch(NavigationActions.updateBrowser(id, props)),
    }),
)(MenuCover);

export default WithStateContainer;
