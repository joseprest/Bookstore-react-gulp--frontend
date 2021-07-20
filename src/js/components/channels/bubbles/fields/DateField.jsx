import React from 'react';
import PropTypes from 'prop-types';

const propTypes = {
    data: PropTypes.shape({
        label: PropTypes.string,
        value: PropTypes.string,
    }).isRequired,
};

const DateField = ({ data }) => (
    <div className="bubble-field">
        <div className="bubble-field-label">{data.label}</div>
        <div className="bubble-field-value">{data.value}</div>
    </div>
);

DateField.propTypes = propTypes;

export default DateField;
