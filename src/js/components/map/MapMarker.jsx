import React from 'react';
import PropTypes from 'prop-types';

import * as MarkerComponents from './markers';
import Utils from '../../lib/utils';

const propTypes = {
    // data: PropTypes.object.isRequired,
    type: PropTypes.string.isRequired,
};

const defaultProps = {};

const MapMarker = ({ type, ...props }) => {
    const MarkerComponent = Utils.getComponentFromType(MarkerComponents, type);

    return (
        <div className="marker-container">
            <MarkerComponent {...props} />
        </div>
    );
};

MapMarker.propTypes = propTypes;
MapMarker.defaultProps = defaultProps;

export default MapMarker;
