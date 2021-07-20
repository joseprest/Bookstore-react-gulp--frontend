import React, { Component } from 'react';
import PropTypes from 'prop-types';
import get from 'lodash/get';
import omit from 'lodash/omit';

import Utils from '../../../lib/utils';
import * as AppPropTypes from '../../../lib/PropTypes';
import Colors from '../../../lib/colors';

import CoverImage from './CoverImage';

const propTypes = {
    data: AppPropTypes.bubble.isRequired,
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,

    useThumbnail: PropTypes.bool,
};

const defaultProps = {
    useThumbnail: false,
};

const contextTypes = {
    channel: AppPropTypes.channel,
};

class CoverCard extends Component {
    constructor(props) {
        super(props);

        this.refTopBanner = null;
        this.refTitle = null;

        this.state = {
            imageTop: null,
            imageHeight: null,
        };
    }

    componentDidMount() {
        this.updateSize();
    }

    componentDidUpdate({ width: prevWidth, height: prevHeight }) {
        const { width, height } = this.props;
        if (prevHeight !== height || prevWidth !== width) {
            this.updateSize();
        }
    }

    updateSize() {
        const { height } = this.props;
        const topBanner = this.refTopBanner;
        const title = this.refTitle;

        let imageHeight = height;
        let topBannerHeight = 0;

        if (topBanner) {
            topBannerHeight = topBanner.offsetHeight;
            imageHeight -= topBannerHeight;
        }

        if (title) {
            imageHeight -= title.offsetHeight;
        }

        this.setState({
            imageTop: topBannerHeight,
            imageHeight,
        });
    }

    renderContent() {
        const topBanner = this.renderTopBanner();
        const image = this.renderImage();
        const title = this.renderTitle();

        return (
            <div className="slide-cover-content">
                {topBanner}
                {image}
                {title}
            </div>
        );
    }

    renderTopBanner() {
        const { data } = this.props;
        const topBannerLabel = get(data, 'snippet.subtitle', null);
        // var topBannerLabel = get(data, 'fields.category.value', null);
        if (!topBannerLabel) {
            return null;
        }

        const { channel } = this.context;
        const filterName = get(channel, 'fields.settings.channelFilterName', null);
        const filterValue = get(data, `filters.${filterName}`);
        const filterColor = Colors.get(`card-${filterName}`, filterValue);
        // const filterColorInt = Utils.colorStringToInt(filterColor);
        const textColor = Utils.colorIsDark(filterColor) < 128 ? '#FFF' : '#000';

        const style = {
            backgroundColor: filterColor,
            color: textColor,
        };

        return (
            <div
                ref={(ref) => {
                    this.refTopBanner = ref;
                }}
                className="slide-cover-top-banner"
                style={style}
            >
                {topBannerLabel}
            </div>
        );
    }

    renderImage() {
        const { imageTop } = this.state;
        const { imageHeight } = this.state;

        if (imageTop === null || !imageHeight) {
            return null;
        }

        const style = {
            top: imageTop,
            height: imageHeight,
        };

        const props = omit(this.props, ['height']);
        props.height = imageHeight;
        props.fullSize = true;

        return (
            <div className="slide-cover-image-container" style={style}>
                <CoverImage {...props} />
            </div>
        );
    }

    renderTitle() {
        const { data } = this.props;
        const title = get(data, 'snippet.title', null);
        if (!title) {
            return null;
        }

        return (
            <div
                ref={(ref) => {
                    this.refTitle = ref;
                }}
                className="slide-cover-title"
            >
                {title}
            </div>
        );
    }

    render() {
        const content = this.renderContent();

        return <div className="slide-cover slide-cover-card">{content}</div>;
    }
}

CoverCard.propTypes = propTypes;
CoverCard.defaultProps = defaultProps;
CoverCard.contextTypes = contextTypes;

export default CoverCard;
