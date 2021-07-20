import React from 'react';
// import PropTypes from 'prop-types';

import MarkerVaudreuil from '../../icons/MarkerVaudreuil';

const propTypes = {};

const defaultProps = {};

const MarkerIcon = () => (
    <div className="marker marker-icon">
        <MarkerVaudreuil />
    </div>
);

MarkerIcon.propTypes = propTypes;
MarkerIcon.defaultProps = defaultProps;

export default MarkerIcon;
