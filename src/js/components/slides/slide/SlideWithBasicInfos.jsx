import React from 'react';
// import PropTypes from 'prop-types';

import Slide from './Slide';
import CoverWithBasicInfos from '../covers/CoverWithBasicInfos';

const SlideWithBasicInfos = props => (
    <Slide CoverComponent={CoverWithBasicInfos} coverUsesThumbnail={false} {...props} />
);

export default SlideWithBasicInfos;
