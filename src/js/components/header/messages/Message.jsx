import React from 'react';

var Message = React.createClass({

    propTypes: {

    },

    render: function()
    {
        return (
            <div className="message">
                { this.props.children }
            </div>
        )
    }

});

export default Message;
