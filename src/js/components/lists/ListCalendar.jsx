/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';
import PropTypes from 'prop-types';
import sortBy from 'lodash/sortBy';

import ListWithSidebar from './ListWithSidebar';
import ItemComponent from './items/ItemDate';

const getOrderedItems = items => {
    const now = new Date();
    return sortBy(items, 'date')
        .filter(({ moment }) => moment.diff(now, 'days') > -1)
        .reduce(
            (groupedItems, { moment, date, bubbles = [], label }) =>
                bubbles.length > 0
                    ? [
                          ...groupedItems,
                          {
                              key: date,
                              date,
                              label,
                              bubbles,
                              moment,
                              dayNumber: moment.format('D'),
                              monthName: moment.format('MMM'),
                              weekDay: moment.format('dddd'),
                              year: moment.format('YYYY'),
                          },
                      ]
                    : groupedItems,
            [],
        );
};

const getSidebarItems = items =>
    items.reduce((sidebarItems, { dayNumber, monthName, year, date }) => {
        const monthKey = `${monthName}-${year}`;
        const item = {
            key: date,
            label: dayNumber,
        };
        const index = sidebarItems.findIndex(it => it.monthKey === monthKey);
        return index !== -1
            ? [
                  ...sidebarItems.slice(0, index),
                  {
                      ...sidebarItems[index],
                      items: [...sidebarItems[index].items, item],
                  },
                  ...sidebarItems.slice(index + 1),
              ]
            : [
                  ...sidebarItems,
                  {
                      monthKey,
                      label: monthName,
                      items: [item],
                      year,
                  },
              ];
    }, []);

const propTypes = {
    items: PropTypes.array.isRequired, // eslint-disable-line react/forbid-prop-types
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
    ItemComponent: PropTypes.object, // eslint-disable-line react/forbid-prop-types
    className: PropTypes.string,
};

const defaultProps = {
    ItemComponent,
    className: 'list-calendar',
};

const ListCalendar = ({ items, ...props }) => {
    const orderedItems = getOrderedItems(items);
    const sidebarItems = getSidebarItems(orderedItems);
    return (
        <ListWithSidebar
            {...props}
            centered={false}
            items={orderedItems}
            sidebarItems={sidebarItems}
        />
    );
};

ListCalendar.propTypes = propTypes;
ListCalendar.defaultProps = defaultProps;

export default ListCalendar;
