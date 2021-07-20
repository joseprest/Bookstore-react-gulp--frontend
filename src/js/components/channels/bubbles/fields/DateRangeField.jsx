import React from 'react';
import PropTypes from 'prop-types';
import get from 'lodash/get';
import Utils from '../../../../lib/utils';

const getDateFormatted = data => {
    const startDate = get(data, 'moment.start', null);
    const endDate = get(data, 'moment.end', null);
    const dateHours = Utils.getDateHours(startDate, endDate);
    const startDateFormatted = startDate.format('dddd D MMMM');
    const endDateFormatted = endDate !== null && endDate.isValid() ? endDate.format('dddd D MMMM') : null;

    if (endDate !== null && startDateFormatted !== endDateFormatted) {
        return `${startDateFormatted} au ${endDateFormatted} ${
            dateHours !== null ? `, ${dateHours}` : ''
        }`;
    }

    return `${startDateFormatted}${dateHours !== null ? `, ${dateHours}` : ''}`;
};

const propTypes = {
    data: PropTypes.shape({
        label: PropTypes.string,
        moment: PropTypes.shape({
            start: PropTypes.object,
            end: PropTypes.object,
        }),
    }).isRequired,
};

const DateRangeField = ({ data }) => (
    <div className="bubble-field">
        <div className="bubble-field-label">{data.label}</div>
        <div className="bubble-field-value">{getDateFormatted(data)}</div>
    </div>
);

DateRangeField.propTypes = propTypes;

export default DateRangeField;
