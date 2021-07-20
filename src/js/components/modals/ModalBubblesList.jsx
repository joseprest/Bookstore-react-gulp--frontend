import React from 'react';
import PropTypes from 'prop-types';
import Popover from './Popover';
import * as ListComponents from '../lists';
import Utils from '../../lib/utils';

var ModalBubblesList = React.createClass({

    propTypes: {
        bubbles: PropTypes.array.isRequired,
        width: PropTypes.oneOfType([PropTypes.number, PropTypes.func]).isRequired,
        height: PropTypes.oneOfType([PropTypes.number, PropTypes.func]).isRequired,

        placement: PropTypes.string,
        bubbleWidthRatio: PropTypes.number,
        bubbleHeightRatio: PropTypes.number,
        onItemClick: PropTypes.func
    },

    contextTypes: {
        store: PropTypes.object,
        channel: PropTypes.object
    },

    getDefaultProps: function()
    {
        return {
            listView: null,
            placement: 'top',
            bubbleWidthRatio: 1,
            bubbleHeightRatio: 0.2
        };
    },

    render: function()
    {
        var modalProps = _.omit(this.props, ['onClose', 'onOpen']);

        var width, height;

        if (this.props.width)
        {
            width = _.isFunction(this.props.width)? this.props.width(): this.props.width;
        }

        if (this.props.height)
        {
            height = _.isFunction(this.props.height)? this.props.height(): this.props.height;
        }
        var bubbles = this.props.bubbles;
        var listView = this.context.channel ? _.get(this.context.channel, 'fields.settings.modalBubblesListView', 'cover'):(this.props.listView || 'cover');
        var ListComponent = Utils.getComponentFromType(ListComponents, listView);

        return (
            <Popover {...modalProps} className="modal-bubbles-list">
                <div className="list-container">
                    <ListComponent
                        items={bubbles}
                        width={width}
                        height={height}
                        onItemClick={this.onItemClick}
                        scrollable={true}
                        infinite={true}
                        active={true}
                        useRows={true}
                    />
                    <div className="gradients-container">
                        <div className="gradients-container-inner">
                            <div className="gradient gradient-top" />
                            <div className="gradient gradient-bottom" />
                        </div>
                    </div>
                </div>
            </Popover>
        );
    },

    onItemClick: function(e, it, index)
    {
        if(this.props.onItemClick)
        {
            this.props.onItemClick(e, it, index);
        }
    }

});

export default ModalBubblesList;
