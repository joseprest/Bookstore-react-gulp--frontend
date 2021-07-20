import React from 'react';
import PropTypes from 'prop-types';
import ReactDOM from 'react-dom';
import _ from 'lodash';
import { TweenMax } from 'gsap/TweenMax';

import Utils from '../../../../lib/utils';
import Button from '../../../partials/Button';
import Transitionable from '../../../helpers/Transitionable';
//import Transitionable from 'react-transitionable';

var QuestionChoice = React.createClass({

    propTypes: {
        buttonColor: PropTypes.string.isRequired,
        buttonLabel: PropTypes.string.isRequired,

        answerIcon: PropTypes.bool,// null === not answered yet
        highlighted: PropTypes.bool,
        content: PropTypes.string,// can be html
        lowlightedOpacity: PropTypes.number,
        animationDuration: PropTypes.number,
        onClick: PropTypes.func
    },

    getDefaultProps: function()
    {
        return {
            animationDuration: 0.4,
            lowlightedOpacity: 0.5
        };
    },

    render: function()
    {
        var buttonLabel = this.props.buttonLabel;

        var contentElement = this.renderContent();

        var answerIconElement;
        var answerIcon = this.props.answerIcon;
        var highlighted = this.props.highlighted;

        if (answerIcon !== null)
        {
            var answerIconClassName = 'question-choice-answer-icon';
            answerIconClassName += this.props.answerIcon ? ' right':' wrong';
            answerIconElement = <div key="answer-icon" className={answerIconClassName} />;
        }

        var innerStyle = {
            opacity: highlighted ? 1:this.props.lowlightedOpacity
        };

        var buttonColor = this.props.buttonColor;
        var buttonShadowColor = Utils.getShadeColor(buttonColor, -30);

        return (
            <div className="question-choice" {...Utils.onClick(this.onClick, 'end')}>
                <Transitionable>{ answerIconElement }</Transitionable>
                <div ref="inner" className="question-choice-inner" style={innerStyle}>
                    <Button
                        ref="button"
                        color={buttonColor}
                        shadowColor={buttonShadowColor}
                    >
                        { buttonLabel }
                    </Button>
                    { contentElement }
                </div>
            </div>
        );
    },

    renderContent: function()
    {
        var content = this.props.content;

        if (!content)
        {
            return;
        }

        return (
            <div className="question-choice-content" dangerouslySetInnerHTML={{ __html: content }} />
        );
    },

    componentDidUpdate: function(prevProps)
    {
        var highlightChanged = prevProps.highlighted !== this.props.highlighted;

        if (highlightChanged)
        {
            var innerElement = ReactDOM.findDOMNode(this.refs.inner);
            TweenMax.from(innerElement, this.props.animationDuration, {
                opacity: prevProps.highlighted ? 1:this.props.lowlightedOpacity
            });
        }
    },

    onClick: function(e)
    {
        if (this.props.onClick)
        {
            this.props.onClick(e);
        }
    }

});

export default QuestionChoice;
