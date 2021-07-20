import React from 'react';
import PropTypes from 'prop-types';
import ReactDOM from 'react-dom';
import _ from 'lodash';
import $ from 'jquery';
import ListWithSidebar from './ListWithSidebar';
import ItemComponent from './items/ItemAlphabetic';

var ListAlphabetic = React.createClass({

    propTypes: {
        items: PropTypes.array.isRequired,
        width: PropTypes.number.isRequired,
        height: PropTypes.number.isRequired,

        selectedItemIndex: PropTypes.number
    },

    getDefaultProps: function()
    {
        return {
            selectedItemIndex: null
        };
    },

    getInitialState: function()
    {
        var items = this.getGroupedValues(this.props.items);
        return {
            items: items,
            sidebarItems: this.getSidebarItems(items),
            listScroll: 0,
            scrollingToItemIndex: null
        };
    },

    render: function()
    {
        var listProps = _.omit(this.props, ['items']);
        var items = this.state.items;
        var sidebarItems = this.state.sidebarItems;

        var searchField = {
            placeholder: this.props.searchPlaceholder// devrait juste etre une bool
        };

        var disableScroll = this.props.selectedItemIndex !== null || this.state.scrollingToItemIndex !== null;

        //console.log('render', disableScroll, this.state.listScroll, this.state.scrollingToItemIndex);

        return (
            <ListWithSidebar
                {...listProps}
                disableScroll={disableScroll}
                scroll={this.state.listScroll}
                className="list-alphabetic"
                items={items}
                ItemComponent={ItemComponent}
                sidebarItems={sidebarItems}
                searchField={searchField}
                onScroll={this.onListScroll}
                onScrollEnd={this.onListScrollEnd}
                onItemClick={this.onItemClick}
            />
        );
    },

    componentWillReceiveProps: function(nextProps)
    {
        var state = {}
        if (this.props.selectedItemIndex !== nextProps.selectedItemIndex)
        {
            state.scrollingToItemIndex = null;
        }

        if (this.props.items !== nextProps.items)
        {
            state.items = this.getGroupedValues(nextProps.items);
            state.sidebarItems = this.getSidebarItems(state.items);
        }

        if (_.values(state).length)
        {
            this.setState(state);
        }
    },

    componentDidUpdate: function(prevProps, prevState)
    {
        if (prevProps.selectedItemIndex !== this.props.selectedItemIndex)
        {
            var $el = $(ReactDOM.findDOMNode(this));
            var $list = $el.find('.list-alphabetic');
            var index = this.props.selectedItemIndex;
            var it = index !== null ? (this.props.items[index] || null):null;
            if(!it)
            {
                $list.find('.list-item.active').removeClass('active');
            }
        }
    },

    getGroupedValues: function(items)
    {
        for (var i = 0, il = items.length; i < il; i++)
        {
            items[i].index = i;
        }
        var orderedValues = _.sortBy(items, 'alpha');

        var groupedValues = [];
        for (i = 0, il = orderedValues.length; i < il; i++)
        {
            var value = orderedValues[i];
            var letter;
            var valueAlpha = _.get(value, 'alpha');
            var backupValue = _.get(value, 'value');// si on n'a pas recu de alpha
            if (valueAlpha && valueAlpha.length)
            {
                letter = valueAlpha.substr(0, 1);
            }
            else if (backupValue && backupValue.length)
            {
                console.log('Warning: no "alpha" prop found inside alphabetic list filter, using "value"');
                letter = backupValue.substr(0, 1);
            } else
            {
                continue;
            }
            var letterIndex = _.findIndex(groupedValues, function(value)
            {
                return value.label === letter;
            });
            if (letterIndex === -1)
            {
                groupedValues.push({
                    key: letter,
                    label: letter,
                    items: [value]
                });
            } else
            {
                groupedValues[letterIndex].items.push(value);
            }
        };

        return groupedValues;
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

    /*
        Events handlers
    */

    onItemClick: function(e, it, index)// index du groupe
    {
        if (this.state.scrollingToItemIndex !== null)
        {
            return;
        }

        var el = ReactDOM.findDOMNode(this);
        var $list = $(el).find('.list-alphabetic');
        var $reactList = $list.parents('.react-list-container');
        var target = e.currentTarget;
        var $target = $(target);

        $target.addClass('active');

        var listHeight = $list.height();
        var listOuterHeight = $list.outerHeight();
        var listTotalHeight = $reactList.height();

        var paddingTop = listOuterHeight - listHeight;
        var targetPosition = (target.getBoundingClientRect().top - el.getBoundingClientRect().top) + this.state.listScroll;
        var scrollHeight = listTotalHeight - this.props.height;
        var scrollTop = targetPosition;

        if (targetPosition < scrollHeight)
        {
            scrollTop -= paddingTop;
        }
        else
        {
            scrollTop -= (this.props.height - $target.height()) - paddingTop;
        }

        var itemIndex = $target.data('list-item-index');

        if (scrollTop === this.state.listScroll)
        {
            this.selectItem(itemIndex);
        } else {
            this.setState({
                scrollingToItemIndex: itemIndex,
                listScroll: scrollTop
            });
        }
    },

    onListScrollEnd: function()
    {
        if(this.state.scrollingToItemIndex === null)
        {
            return;
        }

        var index = this.state.scrollingToItemIndex;
        this.setState({
            scrollingToItemIndex: null
        }, _.bind(function()
        {
            this.selectItem(index);
        }, this))
    },

    selectItem: function(index)
    {
        var it = index !== null ? (this.props.items[index] || null):null;
        if(it && this.props.onItemSelected)
        {
            this.props.onItemSelected(it, index);
        }
    },

    onListScroll: function(scroll)
    {
        this.setState({
            listScroll: scroll
        });
    }

});

export default ListAlphabetic;
