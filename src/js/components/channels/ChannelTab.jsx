import React from 'react';
import PropTypes from 'prop-types';

var ChannelTab = React.createClass({

    propTypes: {
        height: PropTypes.number
    },

    getDefaultProps: function()
    {
        return {
            height: 0
        };
    },

    render: function()
    {
        var style = {
            height: this.props.height
        };

        return (
            <div className="channel-tab" style={style}>
                { this.props.children }
            </div>
        );
    }

});

export default ChannelTab;
