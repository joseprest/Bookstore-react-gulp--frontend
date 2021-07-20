import React from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import classNames from 'classnames';

import Utils from '../../../../lib/utils';

const BubbleSuggestion = React.createClass({
    propTypes: {
        height: PropTypes.number.isRequired,
        bubble: PropTypes.object.isRequired,

        thumbnailLabel: PropTypes.string,
        squareThumbnails: PropTypes.bool,
        hideSubTitle: PropTypes.bool,
        onClick: PropTypes.func,
    },

    getDefaultProps() {
        return {};
    },

    render() {
        const { bubble } = this.props;
        return (
            <div
                className={classNames([
                    'bubble-suggestion',
                    `channel-theme-${_.get(bubble, 'channel_id')}`,
                ])}
                {...Utils.onClick(this.onClick, 'end')}
            >
                {this.renderCover()}
                {this.renderDetails()}
            </div>
        );
    },

    renderCover() {
        let thumbnailPicture = _.get(this.props.bubble, 'snippet.thumbnail_picture', null);
        if (!thumbnailPicture) {
            thumbnailPicture = _.get(this.props.bubble, 'snippet.picture', null);
        }
        const width = _.get(thumbnailPicture, 'width', 0);
        const height = _.get(thumbnailPicture, 'height', 0);
        const imageLink = _.get(thumbnailPicture, 'link', null);

        const size = Utils.getMaxSize(width, height, null, this.props.height);
        const maxWidth = this.props.squareThumbnails ? size.height : size.width;

        const style = {
            width: maxWidth,
            height: size.height,
            backgroundImage: imageLink ? `url("${imageLink}")` : null,
        };

        return (
            <div ref="cover" className="bubble-suggestion-thumbnail" style={style}>
                {this.renderCoverLabel()}
            </div>
        );
    },

    renderCoverLabel() {
        if (!this.props.thumbnailLabel) {
            return;
        }

        return <div className="bubble-suggestion-thumbnail-label">{this.props.thumbnailLabel}</div>;
    },

    renderDetails() {
        const typeName = _.get(this.props.bubble, 'type_name');
        const title = _.get(this.props.bubble, 'snippet.title');
        const subtitle = _.get(this.props.bubble, 'snippet.subtitle');

        let typeNameElement;
        if (typeName) {
            typeNameElement = <div className="bubble-suggestion-type-name">{typeName}</div>;
        }

        let titleElement;
        if (title) {
            titleElement = <div className="bubble-suggestion-title">{title}</div>;
        }

        let subtitleElement;
        if (subtitle && !this.props.hideSubTitle) {
            subtitleElement = <div className="bubble-suggestion-subtitle">{subtitle}</div>;
        }

        return (
            <div ref="details" className="bubble-suggestion-details">
                {typeNameElement}
                {titleElement}
                {subtitleElement}
            </div>
        );
    },

    onClick() {
        if (this.props.onClick) {
            this.props.onClick();
        }
    },
});

export default BubbleSuggestion;
