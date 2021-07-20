import React from 'react';
import PropTypes from 'prop-types';

import ListComponent from '../ListCover';
import * as AppPropTypes from '../../../lib/PropTypes';

const propTypes = {
    data: PropTypes.shape({
        label: PropTypes.string,
        bubbles: AppPropTypes.bubbles,
    }),
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
    index: PropTypes.number.isRequired,
    scroll: PropTypes.number,
    showImage: PropTypes.bool,
    onClick: PropTypes.func,
};

const defaultProps = {
    data: {},
    scroll: 0,
    showImage: false,
    onClick: null,
};

const YearItem = ({
    width,
    height,
    showImage,
    scroll,
    index,
    data: { label = null, bubbles = [] },
    onClick,
}) => (
    <div className="list-item list-item-year" data-list-item-index={index}>
        <div className="list-item-label">{label}</div>
        <div
            className="list-item-content"
            style={{
                width,
            }}
        >
            <ListComponent
                width={width}
                height={height}
                items={bubbles}
                itemProps={{
                    showImage,
                    scroll,
                    itemIndex: index,
                }}
                onItemClick={onClick}
                useRows
                scrollable={false}
            />
        </div>
    </div>
);

YearItem.propTypes = propTypes;
YearItem.defaultProps = defaultProps;

export default YearItem;
