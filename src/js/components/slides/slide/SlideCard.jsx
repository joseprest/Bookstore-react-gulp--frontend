import React from 'react';

import Slide from './Slide';
import CoverCard from '../covers/CoverCard';

const SlideCard = props => (
    <Slide CoverComponent={CoverCard} coverUsesThumbnail={false} {...props} />
);

export default SlideCard;
