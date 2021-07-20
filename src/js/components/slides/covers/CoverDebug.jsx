import React from 'react';

var DebugCover = React.createClass({

    propTypes: {

    },

    render: function()
    {
        return (
            <div className="slide-cover slide-cover-debug">
                { this.props.data.id }
            </div>
        )
    }

});

export default DebugCover;
