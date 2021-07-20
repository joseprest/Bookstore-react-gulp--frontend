import React from 'react';
import PropTypes from 'prop-types';

var AlphabeticItem = React.createClass({

    propTypes: {
        data: PropTypes.object.isRequired,
        onClick: PropTypes.func
    },

    shouldComponentUpdate: function(nextProps)
    {
        var dataChanged = this.props.data !== nextProps.data;
        return dataChanged
    },

    render: function()
    {
        var data = this.props.data;
        var label = _.get(data, 'label');
        var items = _.get(data, 'items');

        return (
            <div className="list-item">
                <div className="list-item-label">{label}</div>
                { this.renderItems(items) }
            </div>
        );
    },

    renderItems: function(items)
    {
        var itemsList = items.map(_.bind(this.renderItem, this));

        return(
            <div className="list-items">{ itemsList }</div>
        );
    },

    renderItem: function(it, index)
    {
        var label = it.label;

        var onClick = _.bind(function(e)
        {
            this.onClick(e, it);
        },this);

        return(
            <div key={'value'+index} className="list-item" data-list-item-index={it.index} onClick={onClick}>
                <span className="list-item-content">
                    {label}
                </span>
            </div>
        );
    },

    /*
        Events handlers
    */

    onClick: function(e, it)
    {
        if(this.props.onClick)
        {
            this.props.onClick(e, it);
        }
    }

});

export default AlphabeticItem;
