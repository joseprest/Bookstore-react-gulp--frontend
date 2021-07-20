import React from 'react';

import BubbleSuggestion from './BubbleSuggestion';

var BubbleSuggestionWithDates = React.createClass({

    render: function()
    {
        var startDate = _.get(this.props,'bubble.fields.date.moment.start');
        var thumbnailLabel = startDate.isValid() ? startDate.date() + ' ' + startDate.locale('fr-fr').format('MMM'):null;

        return (
            <BubbleSuggestion
                thumbnailLabel={thumbnailLabel}
                squareThumbnails={true}
                hideSubTitle={true}
                {...this.props}
            />
        );
    }

});

export default BubbleSuggestionWithDates;
