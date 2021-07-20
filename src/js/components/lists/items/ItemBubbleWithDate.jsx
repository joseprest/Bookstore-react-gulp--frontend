import React from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';

import Utils from '../../../lib/utils';
import Text from '../../../lib/text';

var ItemBubbleWithDate = React.createClass({

    propTypes: {
        data: PropTypes.object.isRequired,
        showImage: PropTypes.bool
    },

    getDefaultProps: function()
    {
        return {
            showImage: true
        };
    },

    getInitialState: function()
    {
        var startDate = _.get(this.props.data,'fields.date.moment.start');
        var endDate = _.get(this.props.data,'fields.date.moment.end');
        var dateHours = Utils.getDateHours(startDate, endDate);

        return {
            //hoursText: dateHours !== null ? dateHours:Text.t('hours_not_found')
            hoursText: dateHours !== null ? dateHours:null
        };
    },

    shouldComponentUpdate: function(nextProps)
    {
        var dataChanged = this.props.data !== nextProps.data;
        var showImageChanged = this.props.showImage !== nextProps.showImage;

        return dataChanged || showImageChanged;
    },

    render: function()
    {
        var bubble = this.props.data;
        var pictureLink = _.get(bubble, 'snippet.thumbnail_picture.link', null);

        if (!pictureLink)
        {
            pictureLink = _.get(bubble, 'snippet.picture.link', null);
        }

        var coverStyle = {
            backgroundImage: pictureLink && this.props.showImage ? 'url("'+pictureLink+'")':null
        };

        var name = _.get(bubble, 'snippet.title');
        var location = _.get(bubble, 'fields.venue.value');
        var hoursText;
        if(this.state.hoursText)
        {
            hoursText = (
                <div className="bubble-infos-hours">{this.state.hoursText}</div>
            );
        }

        return(
            <div key={bubble.id} className="list-item list-item-bubble list-item-bubble-with-date" {...Utils.onClick(this.onClick, 'end')}>
                <div className="bubble-cover" style={coverStyle} />
                <div className="bubble-infos">
                    { hoursText }
                    <div className="bubble-infos-name">{name}</div>
                    <div className="bubble-infos-location" dangerouslySetInnerHTML={{__html: location}} />
                </div>
            </div>
        );
    },

    onClick: function(e)
    {
        if(this.props.onClick)
        {
            this.props.onClick(e, this.props.data);
        }
    }

});

export default ItemBubbleWithDate;
