import React, { Component } from 'react';
import PropTypes from 'prop-types';
import get from 'lodash/get';
import * as BubbleSuggestionComponents from './suggestions';
import Utils from '../../../lib/utils';
import * as ManivellePropTypes from '../../../lib/PropTypes';
import Scrollable from '../../helpers/Scrollable';

const propTypes = {
    bubbles: ManivellePropTypes.bubbles.isRequired,
    height: PropTypes.number.isRequired,
    onSuggestionClick: PropTypes.func,
};

const defaultProps = {
    onSuggestionClick: null,
};

const contextTypes = {
    data: ManivellePropTypes.dataRepository,
};

class BubbleSuggestions extends Component {
    constructor(props) {
        super(props);

        this.renderSuggestion = this.renderSuggestion.bind(this);
    }

    renderSuggestion(bubble, index) {
        const { height, onSuggestionClick } = this.props;
        const { data } = this.context;
        const { id: bubbleId, channel_id: channelId } = bubble;
        const channel = data.findChannelByID(channelId);
        const suggestionType = get(channel, 'fields.settings.bubbleSuggestionView');
        const BubbleSuggestion = Utils.getComponentFromType(
            BubbleSuggestionComponents,
            suggestionType,
        );

        return (
            <BubbleSuggestion
                key={`s${bubbleId}`}
                height={height}
                bubble={bubble}
                onClick={() => {
                    if (onSuggestionClick) {
                        onSuggestionClick(bubble, index);
                    }
                }}
            />
        );
    }

    render() {
        const { bubbles, height } = this.props;

        return (
            <div
                className="bubble-suggestions"
                style={{
                    height,
                }}
            >
                <Scrollable axis="x">
                    <div className="bubble-suggestions-scrolled-content">
                        <div className="bubble-suggestions-list">
                            {bubbles.map(this.renderSuggestion)}
                        </div>
                    </div>
                </Scrollable>
                <div className="bubble-suggestions-gradient gradient-left" />
                <div className="bubble-suggestions-gradient gradient-right" />
            </div>
        );
    }
}

BubbleSuggestions.propTypes = propTypes;
BubbleSuggestions.defaultProps = defaultProps;
BubbleSuggestions.contextTypes = contextTypes;

export default BubbleSuggestions;
