import React from 'react';
import PropTypes from 'prop-types';

import Slide from './Slide';
import SlideCoverMenu from '../covers/CoverMenu';

const propTypes = {
    context: PropTypes.string,
    horizontal: PropTypes.bool,
};

const defaultProps = {
    context: null,
    horizontal: false,
};

const SlideMenu = ({ context, horizontal, ...props }) => (
    <Slide
        CoverComponent={SlideCoverMenu}
        {...props}
        coverProps={{
            horizontal,
            context,
        }}
    />
);

SlideMenu.propTypes = propTypes;
SlideMenu.defaultProps = defaultProps;

export default SlideMenu;
