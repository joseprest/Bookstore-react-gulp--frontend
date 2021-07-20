import React from 'react';
import PropTypes from 'prop-types';
import ReactDOM from 'react-dom';
import _ from 'lodash';

import ListComponent from './List';
import ItemComponent from './items/ItemBubbleCover';
import ItemComponentRow from './items/ItemBubbleCoverRow';
import Utils from '../../lib/utils';

var ListCover = React.createClass({

    propTypes: {
        width: PropTypes.number,
        height: PropTypes.number,
        maxBubbleWidth: PropTypes.number,
        maxBubbleHeight: PropTypes.number,
        infinite: PropTypes.bool
    },

    getDefaultProps: function()
    {
        return {
            ItemComponent: ItemComponent,
            className: 'list-covers',
            bubbleWidthRatio: 0.445,
            bubbleHeightRatio: 0.18,
            margin: 30,// devrait utiliser la valeur css
            infinite: false,
            useRows: false
        };
    },

    getInitialState: function()
    {
        return {
            rowItems: this.props.useRows ? this.getRowItems(this.props.items, this.props.width, this.props.height):null
        };
    },

    render: function()
    {
        var itemProps = _.extend({
            maxBubbleWidth: this.props.width * this.props.bubbleWidthRatio,
            maxBubbleHeight: this.props.height * this.props.bubbleHeightRatio
        }, this.props.itemProps);

        var props = _.omit(this.props, ['bubbleWidthRatio', 'bubbleHeightRatio']);

        if (this.props.useRows)
        {
            props.items = this.state.rowItems;
            props.ItemComponent = ItemComponentRow;
        }

        //console.log(props.calculateShowImage)

        return (
            <ListComponent {...props} itemProps={itemProps} />
        );
    },

    componentWillReceiveProps: function(nextProps)
    {
        if (!nextProps.useRows)
        {
            return;
        }

        var itemsChanged = this.props.items !== nextProps.items;
        var sizeChanged = this.props.width !== nextProps.width || this.props.height !== nextProps.height;

        if (itemsChanged || sizeChanged)
        {
            this.setState({
                rowItems: this.getRowItems(nextProps.items, nextProps.width, nextProps.height)
            });
        }
    },

    getRowItems: function(items, width, height)
    {
        var rows = [];
        var positions = [];
        var containerWidth = width - this.props.margin;
        var maxBubbleWidth = width * this.props.bubbleWidthRatio;
        var maxBubbleHeight = height * this.props.bubbleHeightRatio;
        var currentX = 0;
        var rowIndex = 0;

        var item, picture, size, itemWidth;

        for (var i = 0, il = items.length; i < il; i++)
        {
            item = items[i];
            picture = _.get(item, 'snippet.thumbnail_picture', null) || _.get(item, 'snippet.picture', null);
            if (!picture)
            {
                continue;
            }
            size = Utils.getMaxSize(picture.width, picture.height, maxBubbleWidth, maxBubbleHeight);
            itemWidth = size.width;

            currentX += (itemWidth + this.props.margin);

            if (currentX > containerWidth)
            {
                currentX = itemWidth + this.props.margin;
                rowIndex++;
            }

            if (typeof rows[rowIndex] === 'undefined')
            {
                rows[rowIndex] = [];
            }

            rows[rowIndex].push(item);
        }
        return rows;
    }

});

export default ListCover;
