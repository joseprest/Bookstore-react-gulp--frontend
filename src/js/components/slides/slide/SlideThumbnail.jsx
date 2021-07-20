import React from 'react';
// import PropTypes from 'prop-types';

import Slide from './Slide';
import SlideCoverImage from '../covers/CoverImage';

const SlideThumbnail = props => (
    <Slide CoverComponent={SlideCoverImage} coverUsesThumbnail={false} {...props} />
);

export default SlideThumbnail;
