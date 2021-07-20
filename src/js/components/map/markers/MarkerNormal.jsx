import React from 'react';
import PropTypes from 'prop-types';

import Button from '../../partials/Button';

const propTypes = {
    data: PropTypes.shape({
        label: PropTypes.string,
        count: PropTypes.number,
    }),
};

const defaultProps = {
    data: {},
};

const MarkerNormal = ({ data: { label = null, count = 0 } }) => (
    <div className="marker marker-normal">
        <Button>
            <span className="label">
                {' '}
                {label}
                {' '}
                <span className="count">{`(${count})`}</span>
            </span>
        </Button>
        <span className="arrow arrow-shadow" />
        <span className="arrow" />
    </div>
);

MarkerNormal.propTypes = propTypes;
MarkerNormal.defaultProps = defaultProps;

export default MarkerNormal;
