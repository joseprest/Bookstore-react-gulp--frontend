import React, { Component } from 'react';
import PropTypes from 'prop-types';
import isEqual from 'lodash/isEqual';

import Utils from '../../../lib/utils';
import SlideCoverDebug from '../covers/CoverDebug';

const propTypes = {
    data: PropTypes.shape({}).isRequired,
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
    current: PropTypes.bool.isRequired,

    coverWidth: PropTypes.number,
    coverHeight: PropTypes.number,
    coverScale: PropTypes.number,
    coverUsesThumbnail: PropTypes.bool,

    CoverComponent: PropTypes.func,
    coverProps: PropTypes.object, // eslint-disable-line react/forbid-prop-types
    children: PropTypes.node,
    onClick: PropTypes.func,
};

const defaultProps = {
    CoverComponent: SlideCoverDebug,
    coverProps: {},
    coverWidth: null,
    coverHeight: null,
    coverScale: 1,
    coverUsesThumbnail: false,
    children: null,
    onClick: null,
};

class Slide extends Component {
    constructor(props) {
        super(props);

        this.onClick = this.onClick.bind(this);
    }

    shouldComponentUpdate({
        data: nextData,
        width: nextWidth,
        height: nextHeight,
        current: nextCurrent,
        coverWidth: nextCoverWidth,
        coverHeight: nextCoverHeight,
        coverScale: nextCoverScale,
        coverUsesThumbnail: nextCoverUsesThumbnail,
        CoverComponent: nextCoverComponent,
        coverProps: nextCoverProps,
    }) {
        const {
            data,
            width,
            height,
            current,
            coverWidth,
            coverHeight,
            coverScale,
            coverUsesThumbnail,
            CoverComponent,
            coverProps,
        } = this.props;

        const dataChanged = data !== nextData;
        const sizeChanged = width !== nextWidth || height !== nextHeight;
        const currentChanged = current !== nextCurrent;
        const coverSizeChanged = coverWidth !== nextCoverWidth || coverHeight !== nextCoverHeight;
        const coverScaleChanged = coverScale !== nextCoverScale;
        const coverUsesThumbnailChanged = coverUsesThumbnail !== nextCoverUsesThumbnail;
        const coverComponentChanged = CoverComponent !== nextCoverComponent;
        const coverPropsChanged = !isEqual(coverProps, nextCoverProps);

        return (
            dataChanged
            || sizeChanged
            || currentChanged
            || coverSizeChanged
            || coverScaleChanged
            || coverUsesThumbnailChanged
            || coverComponentChanged
            || coverPropsChanged
        );
    }

    onClick(e) {
        const { onClick } = this.props;
        // e.preventDefault();

        if (onClick !== null) {
            onClick(e);
        }
    }

    render() {
        const {
            width,
            height,
            coverWidth,
            coverHeight,
            coverScale,
            coverUsesThumbnail,
            coverProps,
            CoverComponent,
            children,
        } = this.props;

        const scaledCoverWidth = (coverWidth || width) / coverScale;
        const scaledCoverHeight = (coverHeight || height) / coverScale;

        const coverContainerStyle = {
            width: scaledCoverWidth,
            height: scaledCoverHeight,
            transform: `scale(${coverScale})`,
            perspective: scaledCoverWidth,
        };

        return (
            <div className="slide">
                <div className="slide-content">
                    <div
                        className="slide-cover-container"
                        style={coverContainerStyle}
                        {...Utils.onClick(this.onClick, 'end')}
                    >
                        <CoverComponent
                            {...this.props}
                            width={scaledCoverWidth}
                            height={scaledCoverHeight}
                            scale={coverScale}
                            useThumbnail={coverUsesThumbnail}
                            {...coverProps}
                        />
                    </div>

                    {children}
                </div>
            </div>
        );
    }
}

Slide.propTypes = propTypes;
Slide.defaultProps = defaultProps;

export default Slide;
