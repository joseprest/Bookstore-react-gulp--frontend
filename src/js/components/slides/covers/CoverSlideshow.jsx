import React, { Component } from 'react';
import PropTypes from 'prop-types';
import get from 'lodash/get';
import omit from 'lodash/omit';
import $ from 'jquery';
import classNames from 'classnames';

import Utils from '../../../lib/utils';
import * as AppPropTypes from '../../../lib/PropTypes';
// import CacheManager from '../../../lib/cache';

import CoverImage from './CoverImage';
import * as InfosComponents from '../infos';

// const Cache = CacheManager.create('sizes.slide-cover-slideshow');

const propTypes = {
    context: PropTypes.string,
    data: AppPropTypes.bubble.isRequired,
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
    current: PropTypes.bool.isRequired,
    scale: PropTypes.number,
    useThumbnail: PropTypes.bool,
    horizontal: PropTypes.bool,
    maxImageWidthPercent: PropTypes.number,
};

const defaultProps = {
    context: 'slideshow',
    useThumbnail: false,
    horizontal: false,
    maxImageWidthPercent: 0.5,
    scale: 1,
};

const contextTypes = {
    data: AppPropTypes.dataRepository,
};

class SlideshowCover extends Component {
    constructor(props) {
        super(props);

        this.refInfos = null;
        this.refImage = null;

        this.state = {
            imageHeight: props.height,
            infosWidth: props.width,
            imagePadding: null,
        };
    }

    componentDidMount() {
        this.updateSize();
    }

    componentWillReceiveProps(nextProps) {
        const { horizontal, height } = nextProps;
        if (horizontal) {
            this.setState({
                imageHeight: height,
            });
        }
    }

    componentDidUpdate(
        { width: prevWidth, height: prevHeight, horizontal: prevHorizontal },
        { imagePadding: prevImagePadding },
    ) {
        const { width, height, horizontal } = this.props;
        const sizeChanged = width !== prevWidth || height !== prevHeight;
        const horizontalChanged = horizontal !== prevHorizontal;

        if (sizeChanged || horizontalChanged || prevImagePadding === null) {
            this.updateSize();
        }
    }

    updateSize() {
        const { width, height, horizontal } = this.props;
        let imageHeight = height;
        let infosWidth = width;

        const $image = $(this.refImage);

        if (!horizontal) {
            const infos = this.refInfos;
            const infosHeight = height - infos.offsetTop;
            imageHeight -= infosHeight;
        } else {
            const imageWidth = $image.outerWidth();
            infosWidth -= imageWidth;
        }

        const paddingTop = parseInt($image.css('paddingTop').replace(/[^0-9]gi/, ''), 10);
        const paddingLeft = parseInt($image.css('paddingLeft').replace(/[^0-9]gi/, ''), 10);
        const imagePadding = [paddingTop, paddingLeft];

        const size = {
            imagePadding,
            imageHeight,
            infosWidth,
        };

        this.setState(size);
    }

    renderBackground() {
        const { data } = this.props;
        const backgroundLink = get(data, 'snippet.background_picture.link', null);
        if (!backgroundLink) {
            return null;
        }

        const style = {
            backgroundImage: `url("${backgroundLink}")`,
        };

        return <div className="slide-cover-background" style={style} />;
    }

    renderContent() {
        const image = this.renderImage();
        const infos = this.renderInfos();

        return (
            <div className="slide-cover-content">
                {image}
                {infos}
            </div>
        );
    }

    renderImage() {
        const {
            width,
            horizontal,
            data,
            maxImageWidthPercent: defaultMaxImageWidthPercent,
        } = this.props;
        const { imagePadding } = this.state;
        const { data: dataRepository } = this.context;
        let imageWidth = width;
        const { imageHeight } = this.state;
        if (horizontal) {
            const pictureWidth = get(data, 'snippet.picture.width', imageWidth);
            const pictureHeight = get(data, 'snippet.picture.height', imageHeight);
            const imageSize = Utils.getMaxSize(
                pictureWidth,
                pictureHeight,
                imageWidth,
                imageHeight,
            );
            const imageWidthPercent = imageSize.width / width;
            const bubbleChannelId = get(data, 'channel_id', null);
            const bubbleChannel = dataRepository.findChannelByID(bubbleChannelId);
            let maxImageWidthPercent = get(
                bubbleChannel,
                'fields.settings.slideshowImageMaxWidth',
                null,
            );
            if (!maxImageWidthPercent) {
                maxImageWidthPercent = defaultMaxImageWidthPercent;
            }
            imageWidth = imageWidthPercent > maxImageWidthPercent
                ? imageWidth * maxImageWidthPercent
                : imageSize.width;
        }
        const props = omit(this.props, ['width', 'height']);
        props.width = imageWidth;
        props.height = imageHeight;
        props.padding = imagePadding;

        return (
            <CoverImage
                refContainer={(ref) => {
                    this.refImage = ref;
                }}
                {...props}
            />
        );
    }

    renderInfos() {
        const { height, data, horizontal } = this.props;
        const { infosWidth, imageHeight } = this.state;
        const { data: dataRepository } = this.context;
        const style = {
            width: infosWidth,
        };

        const bubbleChannelId = get(data, 'channel_id', null);
        const bubbleChannel = dataRepository.findChannelByID(bubbleChannelId);
        const infosType = get(bubbleChannel, 'fields.settings.slideshowInfosView', null);

        const Infos = Utils.getComponentFromType(InfosComponents, infosType);

        const props = omit(this.props, ['width', 'height']);
        props.width = infosWidth;
        props.height = horizontal ? imageHeight : height - imageHeight;

        return (
            <div
                ref={(ref) => {
                    this.refInfos = ref;
                }}
                className="slide-cover-infos-container"
                style={style}
            >
                <Infos {...props} />
            </div>
        );
    }

    render() {
        const { horizontal } = this.props;

        return (
            <div
                className={classNames([
                    'slide-cover',
                    'slide-cover-slideshow',
                    {
                        'slide-cover-horizontal': horizontal,
                    },
                ])}
            >
                {this.renderBackground()}
                {this.renderContent()}
            </div>
        );
    }
}

SlideshowCover.propTypes = propTypes;
SlideshowCover.defaultProps = defaultProps;
SlideshowCover.contextTypes = contextTypes;

export default SlideshowCover;
