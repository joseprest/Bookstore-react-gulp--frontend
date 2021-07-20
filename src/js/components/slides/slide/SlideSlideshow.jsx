import React from 'react';
import PropTypes from 'prop-types';

import Slide from './Slide';
import SlideCoverSlideshow from '../covers/CoverSlideshow';

const propTypes = {
    context: PropTypes.string,
    horizontal: PropTypes.bool,
};

const defaultProps = {
    context: null,
    horizontal: false,
};

const SlideSlideshow = ({ context, horizontal, ...props }) => (
    <Slide
        CoverComponent={SlideCoverSlideshow}
        {...props}
        coverProps={{
            horizontal,
            context,
        }}
    />
);

SlideSlideshow.propTypes = propTypes;
SlideSlideshow.defaultProps = defaultProps;

export default SlideSlideshow;
