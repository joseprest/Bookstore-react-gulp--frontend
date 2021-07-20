import React from 'react';
import PropTypes from 'prop-types';

import ListComponent from '../ListCover';
import ItemComponent from './ItemBubbleWithDate';

const CalendarItem = React.createClass({
    propTypes: {
        data: PropTypes.object.isRequired,
        index: PropTypes.number.isRequired,
        width: PropTypes.number.isRequired,
        height: PropTypes.number.isRequired,
        showImage: PropTypes.bool,

        onClick: PropTypes.func,
    },

    shouldComponentUpdate(nextProps) {
        const dataChanged = this.props.data !== nextProps.data;
        const sizeChanged =
            this.props.width !== nextProps.width || this.props.height !== nextProps.height;
        const showImageChanged = this.props.showImage !== nextProps.showImage;
        const indexChanged = this.props.index !== nextProps.index;

        return dataChanged || sizeChanged || showImageChanged || indexChanged; // tmp
    },

    render() {
        const { data } = this.props;

        const label = `${data.dayNumber} ${data.monthName}`;
        const { weekDay } = data;
        const items = data.bubbles;

        const itemProps = {
            showImage: this.props.showImage,
        };

        return (
            <div className="list-item list-item-date" data-list-item-index={this.props.index}>
                <div className="list-item-label">
                    <div className="list-item-label-day">{label}</div>
                    <div className="list-item-label-weekday">{weekDay}</div>
                </div>
                <div className="list-item-content">
                    <ListComponent
                        width={this.props.width}
                        height={this.props.height}
                        items={items}
                        itemProps={itemProps}
                        ItemComponent={ItemComponent}
                        onItemClick={this.onBubbleClick}
                    />
                </div>
            </div>
        );
    },

    /*
        Events handlers
    */

    onBubbleClick(e, it, index) {
        if (this.props.onClick) {
            this.props.onClick(e, it);
        }
    },
});

export default CalendarItem;
