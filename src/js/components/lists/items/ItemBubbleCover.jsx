import React from 'react';
import PropTypes from 'prop-types';
import ReactDOM from 'react-dom';
import _ from 'lodash';

import Utils from '../../../lib/utils';

var ItemBubbleCover = React.createClass({

    propTypes: {
        data: PropTypes.object.isRequired,
        index: PropTypes.number,
        onClick: PropTypes.func,
        maxBubbleWidth: PropTypes.number,
        maxBubbleHeight: PropTypes.number,
        showImage: PropTypes.bool
    },

    getDefaultProps: function()
    {
        return {
            maxBubbleWidth: 300,
            maxBubbleHeight: 300,
            showImage: true
        };
    },

    getInitialState: function()
    {
        return {
            showImage: false
        };
    },

    shouldComponentUpdate: function(nextProps, nextState)
    {
        var dataChanged = this.props.data !== nextProps.data;
        var maxSizeChanged = this.props.maxBubbleWidth !== nextProps.maxBubbleWidth || this.props.maxBubbleHeight !== nextProps.maxBubbleHeight;
        var showImageChanged = this.props.showImage !== nextProps.showImage;
        var indexChanged = this.props.index !== nextProps.index;

        return dataChanged || maxSizeChanged || showImageChanged || indexChanged;
    },

    render: function()
    {
        var style = {},
            imageStyle = {};

        var picture = _.get(this.props.data, 'snippet.thumbnail_picture', null);
        if (!picture)
        {
            picture = _.get(this.props.data, 'snippet.picture', null);
        }

        if (picture)
        {
            var width = picture.width;
            var height = picture.height;
            var imageLink = picture.link;
            //var imageLink = 'http://lorempixel.com/500/200/?time='+Math.random();
            var bubbleSize = Utils.getMaxSize(width, height, this.props.maxBubbleWidth, this.props.maxBubbleHeight);

            style.width = bubbleSize.width;
            style.height = bubbleSize.height;
            imageStyle.backgroundImage = this.props.showImage ? 'url("'+imageLink+'")': 'url("")';
            //imageStyle.backgroundColor = this.props.showImage ? 'red': 'transparent';
            //imageStyle.display = this.props.showImage ? 'block':'none';
        }
        else
        {
            style.display = 'none';
        }

        return (
            <div className="list-item list-item-bubble list-item-bubble-cover" {...Utils.onClick(this.onClick, 'end')} style={style}>
                <div className="bubble-cover-image" style={imageStyle}></div>
            </div>
        );
    },

    onClick: function(e)
    {
        if(this.props.onClick)
        {
            this.props.onClick(e, this.props.data);
        }
    }

});

export default ItemBubbleCover;
