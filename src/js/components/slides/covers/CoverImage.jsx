import React from 'react';
import PropTypes from 'prop-types';
import get from 'lodash/get';

import Utils from '../../../lib/utils';
import * as AppPropTypes from '../../../lib/PropTypes';

const propTypes = {
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
    data: AppPropTypes.bubble.isRequired,
    fullSize: PropTypes.bool,
    useThumbnail: PropTypes.bool,
    refContainer: PropTypes.func,
    padding: PropTypes.oneOfType([PropTypes.number, PropTypes.arrayOf(PropTypes.number)]),
    maxImageWidth: PropTypes.number,
    maxImageScale: PropTypes.number,
};

const defaultProps = {
    refContainer: null,
    fullSize: false,
    useThumbnail: false,
    padding: 0,
    maxImageWidth: 2,
    maxImageScale: 3,
};

const ImageCover = ({
    width,
    height,
    padding,
    useThumbnail,
    maxImageScale,
    maxImageWidth,
    fullSize,
    data,
    refContainer,
}) => {
    const horizontal = width > height;
    const paddingWidth = get(padding, '1', padding);
    const paddingHeight = get(padding, '0', padding);
    let maxWidth = width - paddingWidth * 2;
    const maxHeight = height - paddingHeight * 2;

    const style = {
        width,
        height,
    };

    const imageStyle = {
        width: maxWidth,
        height: Math.round(Math.min(height, maxWidth * 1.5)),
    };

    let picture = null;

    if (useThumbnail) {
        picture = get(data, 'snippet.thumbnail_picture', null);
    }
    if (picture === null) {
        picture = get(data, 'snippet.picture', null);
    }

    if (picture !== null) {
        const size = Utils.getMaxSize(picture.width, picture.height, maxWidth, maxHeight);
        const sizeRatio = size.width / picture.width;

        if (sizeRatio >= maxImageScale) {
            size.width = picture.width * maxImageScale;
            size.height = picture.height * maxImageScale;
            const imageWidth = Math.round(maxWidth / size.width);

            if (horizontal && imageWidth > maxImageWidth) {
                maxWidth = size.width * maxImageWidth;
                imageStyle.width = maxWidth;
                style.width = maxWidth + paddingWidth * 2;
            }
        }

        const x = Math.round((maxWidth - size.width) / 2) + paddingWidth;
        const y = Math.round((maxHeight - size.height) / 2) + paddingHeight;

        imageStyle.backgroundImage = `url("${picture.link}")`;
        if (!fullSize) {
            imageStyle.width = size.width;
            imageStyle.height = size.height;
            imageStyle.transform = `translate(${x}px,${y}px)`;
        }
    }

    return (
        <div className="slide-cover slide-cover-image" style={style} ref={refContainer}>
            <div className="slide-image" style={imageStyle} />
        </div>
    );
};

ImageCover.propTypes = propTypes;
ImageCover.defaultProps = defaultProps;

export default ImageCover;
