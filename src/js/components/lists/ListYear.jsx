import React from 'react';
import PropTypes from 'prop-types';
import ReactDOM from 'react-dom';
import _ from 'lodash';

import ListWithSidebarComponent from './ListWithSidebar';
import ItemYearComponent from './items/ItemYear';

var ListYear = React.createClass({

    propTypes: {
        bubbleWidthRatio: PropTypes.number,
        bubbleHeightRatio: PropTypes.number,
        width: PropTypes.number.isRequired,
        height: PropTypes.number.isRequired
    },

    getDefaultProps: function()
    {
        return {
            ItemComponent: ItemYearComponent,
            className: 'list-years'
        };
    },

    getInitialState: function()
    {
        var items = this.getOrderedItems(this.props.items);
        return {
            items: items,
            sidebarItems: this.getSidebarItems(items)
        };
    },

    render: function()
    {
        var props = _.omit(this.props, ['items']);
        return (
            <ListWithSidebarComponent
                ref="list"
                {...props}
                items={this.state.items}
                sidebarItems={this.state.sidebarItems}
            />
        );
    },

    componentDidMount: function()
    {

    },

    componentWillReceiveProps: function(nextProps)
    {
        if(this.props.items !== nextProps.items)
        {
            var items = this.getOrderedItems(nextProps.items);
            this.setState({
                items: items,
                sidebarItems: this.getSidebarItems(items)
            });
        }
    },

    getSidebarItems: function(items)
    {
        return items.map(function(it)
        {
            return {
                key: it.key,
                label: it.label
            };
        });
    },

    getOrderedItems: function(items)
    {
        var orderedItems =  _.sortBy(items, 'value');
        var groupedItems = [];
        _.each(orderedItems, function(it)
        {
            groupedItems.push({
                key: it.value,
                label: it.label,
                bubbles: it.bubbles
            });
        });

        return groupedItems;
    }

});

export default ListYear;
