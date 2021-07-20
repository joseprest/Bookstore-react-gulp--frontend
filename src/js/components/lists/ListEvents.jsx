/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';
import PropTypes from 'prop-types';
import moment from 'moment-timezone';
import ListCalendar from './ListCalendar';

const propTypes = {
    items: PropTypes.arrayOf(PropTypes.object),
};

const defaultProps = {
    items: [],
};

const ListEvents = ({ items, ...props }) => {
    const groupedItems = items.reduce((groups, item) => {
        const { filters: { date } = {} } = item;
        if (typeof groups[date] === 'undefined') {
            const momentValue = moment(date, 'YYYY-MM-DD');
            return {
                ...groups,
                [date]: {
                    date,
                    bubbles: [item],
                    hasBubble: true,
                    moment: momentValue,
                    label: date,
                    value: date,
                },
            };
        }
        groups[date].bubbles.push(item);
        return groups;
    }, {});
    const calendarItems = Object.keys(groupedItems).map(date => groupedItems[date]);
    return <ListCalendar {...props} items={calendarItems} />;
};

ListEvents.propTypes = propTypes;
ListEvents.defaultProps = defaultProps;

export default ListEvents;
