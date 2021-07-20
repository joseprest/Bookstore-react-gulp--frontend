import React from 'react';
import PropTypes from 'prop-types';
import ReactDOM from 'react-dom';

import MarkerNormal from './MarkerNormal';
import Utils from '../../../lib/utils';

var MarkerPreview = React.createClass({

    propTypes: {
        data: PropTypes.object,
        maxCovers: PropTypes.number
    },

    getDefaultProps: function()
    {
        return {
            data: {
                /*label: 'Label',
                count: 0,
                bubbles: []*/
            },
            minCoversSize: 50,
            coversPadding: 10,
            maxCovers: 5
        };
    },

    getInitialState: function()
    {
        return {
            coversSize: null
        };
    },

    render: function()
    {
        var bubbleCovers;
        var markerNormal;

        var bubblesCount = _.get(this.props.data, 'count', 0);
        var hasNormalMarker = bubblesCount > this.props.maxCovers;

        var className = 'marker marker-preview ';

        if (hasNormalMarker)
        {
            markerNormal = this.renderNormalMarker();
            className += 'with-label';
        } else {
            className += 'without-label';
        }
        if (!hasNormalMarker || this.state.coversSize)
        {
            bubbleCovers = this.renderCovers();
        }

        return (
            <div className={ className } >
                { bubbleCovers }
                { markerNormal }
            </div>
        );
    },

    renderNormalMarker: function()
    {
        var props = _.omit(this.props, ['maxCovers', 'minCoversSize', 'coversPadding']);

        return (
            <MarkerNormal {...props} />
        );
    },

    renderCovers: function()
    {
        var bubbles = _.get(this.props.data, 'bubbles', []);
        var covers = [];

        var i = 0,
            il = Math.min(this.props.maxCovers, bubbles.length);

        var containerSize = this.state.coversSize;
        var maxCoverSize = containerSize - (il-1) * this.props.coversPadding;

        var highestWidth = 0;
        var highestHeight = 0;

        for (i; i < il; i++)
        {
            var bubble = bubbles[i];
            var picture = _.get(bubble, 'snippet.thumbnail_picture', null);

            if (!picture)
            {
                continue;
            }

            var pictureWidth = _.get(picture, 'width', null);
            var pictureHeight = _.get(picture, 'height', null);
            var pictureLink = _.get(picture, 'link', null);

            var size = Utils.getMaxSize(pictureWidth, pictureHeight, maxCoverSize, maxCoverSize);
            var padding = this.props.coversPadding * i;

            highestWidth = Math.max(padding + size.width, highestWidth);
            highestHeight = Math.max(padding + size.height, highestHeight);

            covers.push(this.renderCover(pictureLink, size.width, size.height, padding, i));
        }

        var style = {
            width: highestWidth,
            height: highestHeight
        };

        return (
            <ul className="bubbles-covers" style={style}>
                { covers }
            </ul>
        );
    },

    renderCover: function(pictureLink, width, height, padding, index)
    {
        var style = {
            backgroundImage: pictureLink ? 'url("'+pictureLink+'")':null,
            width: width,
            height: height,
            top: padding,
            left: padding
        };

        return (
            <li key={'cover-'+index} className="bubble-cover" style={style} />
        );
    },

    componentDidMount: function()
    {
        var bubblesCount = _.get(this.props.data, 'count', 0);
        var hasNormalMarker = bubblesCount > this.props.maxCovers;

        var coversSize;

        if (hasNormalMarker)
        {
            coversSize = ReactDOM.findDOMNode(this).offsetWidth;
        } else {
            coversSize = this.props.minCoversSize;
        }

        this.setState({
            coversSize: coversSize
        });

    }

});

export default MarkerPreview;
