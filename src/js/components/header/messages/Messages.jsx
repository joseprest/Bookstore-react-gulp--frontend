import React from 'react';
import PropTypes from 'prop-types';
import Message from './Message';

var Messages = React.createClass({

    propTypes: {
        data: PropTypes.array.isRequired
    },

    render: function()
    {
        var messagesElements = [];
        _.each(this.props.data, function(message, i){

            var iconElement;
            if (message.icon)
            {
                var iconStyle = {
                    backgroundImage: 'url("'+message.icon+'")'
                }
                iconElement = <span className="icon" style={ iconStyle }/>;
            }

            var labelElement;
            if (message.label)
            {
                var htmlValue = message.label;
                labelElement = <span className="label" dangerouslySetInnerHTML={{__html: htmlValue}} />
            }

            messagesElements.push(
                <Message key={ 'm-'+i }>
                    { iconElement }
                    { labelElement }
                </Message>
            );
        });

        return (
            <div className="messages">
                { messagesElements }
            </div>
        );
    }

});

export default Messages;
