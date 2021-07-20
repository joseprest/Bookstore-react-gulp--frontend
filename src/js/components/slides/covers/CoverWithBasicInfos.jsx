import React from 'react';
import PropTypes from 'prop-types';
import ReactDOM from 'react-dom';

import Utils from '../../../lib/utils';

import CoverImage from './CoverImage';

var _imageHeightCacheKey = '';
var _imageHeightCache = {};
function ensureFreshCache(imageHeightCacheKey)
{
    if(_imageHeightCacheKey !== imageHeightCacheKey)
    {
        _imageHeightCacheKey = imageHeightCacheKey;
        _imageHeightCache = {};
    }
}

var WithBasicInfosCover = React.createClass({

    propTypes: {
        data: PropTypes.object.isRequired,
        width: PropTypes.number.isRequired,
        height: PropTypes.number.isRequired,

        useThumbnail: PropTypes.bool,
        gradientHeightRatio: PropTypes.number
    },

    getDefaultProps: function()
    {
        return {
            useThumbnail: false,
            gradientHeightRatio: 0.3
        };
    },

    getInitialState: function()
    {
        var imageHeightCacheKey = this.props.width+'x'+this.props.height;
        ensureFreshCache(imageHeightCacheKey);
        return {
            imageHeight: _imageHeightCache[this.props.data.id] || null
        }
    },

    render: function()
    {
        var content = this.renderContent();

        return (
            <div className="slide-cover slide-cover-with-basic-infos">
                { content }
            </div>
        );
    },

    renderContent: function()
    {
        var image = this.renderImage();
        var gradient = this.renderGradient();
        var infos = this.renderInfos();

        return (
            <div ref="content" className="slide-cover-content">
                { image }
                { gradient }
                { infos }
            </div>
        );
    },

    renderImage: function()
    {
        var imageHeight = this.state.imageHeight;
        if(!imageHeight)
        {
            return;
        }
        var props = _.omit(this.props, ['height']);
        props.height = imageHeight;
        props.fullSize = true;

        return (
            <CoverImage ref="image" {...props}></CoverImage>
        );
    },

    renderGradient: function()
    {
        var imageHeight = this.state.imageHeight;
        if(!imageHeight)
        {
            return;
        }

        var gradientHeight = Math.round(this.props.gradientHeightRatio * this.props.height) * 2;
        var gradientTop = Math.max(0, imageHeight - gradientHeight);

        var style = {
            transform: 'translateY('+gradientTop+'px)',
            height: gradientHeight
        };

        return (
            <div className="slide-cover-gradient" style={style}/>
        );
    },

    renderInfos: function()
    {
        var typeLabel = _.get(this.props.data, 'type_name', 'Roman');
        var title = _.get(this.props.data, 'snippet.title', null);

        return (
            <div ref="infos" className="slide-cover-infos-container">
                <div className="slide-cover-infos">
                    <div className="slide-cover-type">{ typeLabel }</div>
                    <div className="slide-cover-title">{ title }</div>
                </div>
            </div>
        );
    },

    componentDidMount: function()
    {
        if(!this.state.imageHeight)
        {
            this.onResize();
        }
    },

    componentDidUpdate: function(prevProps)
    {
        if(prevProps.height !== this.props.height || prevProps.width !== this.props.width)
        {
            this.onResize();
        }
    },

    onResize: function()
    {
        var imageHeight = this.props.height;
        var imageHeightCacheKey = this.props.width+'x'+imageHeight;
        ensureFreshCache(imageHeightCacheKey);

        var infos = ReactDOM.findDOMNode(this.refs.infos);
        imageHeight -= (infos.offsetHeight - this.props.height * this.props.gradientHeightRatio);

        _imageHeightCache[this.props.data.id] = Math.round(imageHeight);

        this.setState({
            imageHeight: Math.round(imageHeight)
        });
    }

});

export default WithBasicInfosCover;
