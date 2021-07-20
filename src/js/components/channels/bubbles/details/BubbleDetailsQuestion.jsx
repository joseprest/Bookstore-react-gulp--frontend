import React from 'react';
import PropTypes from 'prop-types';
import ReactDOM from 'react-dom';
import { TweenMax, TimelineMax } from 'gsap/TweenMax';
import get from 'lodash/get';

import Button from '../../../partials/Button';
import QuestionChoice from '../partials/QuestionChoice';
import NavigationActions from '../../../../actions/NavigationActions';
import Transitionable from '../../../helpers/Transitionable';
//import Transitionable from 'react-transitionable';
import Scrollable from '../../../helpers/Scrollable';
import Text from '../../../../lib/text';
import Colors from '../../../../lib/colors';
import * as ManivellePropTypes from '../../../../lib/PropTypes';

var BubbleDetailsQuestion = React.createClass({
    propTypes: {
        bubble: PropTypes.object.isRequired,
        buttons: PropTypes.array,
        buttonLabels: PropTypes.string,
        buttonColors: PropTypes.array,
        answerButtonTypes: PropTypes.array,
        answerDetailsDelay: PropTypes.number,
        animationDuration: PropTypes.number,
        onButtonClick: PropTypes.func,
    },

    contextTypes: {
        channel: ManivellePropTypes.channel,
        data: PropTypes.object,
    },

    getDefaultProps: function() {
        return {
            buttonLabels: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
            buttonColors: ['#D99E40', '#D23A26', '#21A389'],
            answerButtonTypes: ['send-bubble', 'next'],
            answerDetailsDelay: 2,
            animationDuration: 0.4,
        };
    },

    timelines: null,

    getInitialState: function() {
        return {
            selectedIndex: null,
            showAnswerDetails: false,
        };
    },

    render: function() {
        var choicesData = _.get(this.props.bubble, 'fields.answers.answers', []);

        var choices = this.renderChoices(choicesData);
        var infos = this.renderInfos();

        var scrollTop = this.state.showAnswerDetails ? 0 : null;

        return (
            <div className="bubble-details-question">
                <Scrollable scrollTop={scrollTop} scrollingDuration={this.props.animationDuration}>
                    <div className="bubble-details-question-scroller">
                        <div className="bubble-details-question-content">
                            {choices}
                            {infos}
                        </div>
                    </div>
                </Scrollable>
            </div>
        );
    },

    renderChoices: function(choices) {
        const {
            channel: {
                fields: { settings: channelSettings = {} },
            },
        } = this.context;
        var selectedIndex = this.state.selectedIndex;
        var isAnswered = selectedIndex !== null;
        var showAnswerDetails = this.state.showAnswerDetails;

        var choicesElements = [];

        var buttonLabels = this.props.buttonLabels;
        var buttonColors = this.props.buttonColors;
        const colorType = 'question-buttons';
        const colorPalette = get(channelSettings, 'colorPalette', null);

        _.each(
            choices,
            _.bind(function(choice, index) {
                var buttonLabel =
                    index < buttonLabels.length
                        ? buttonLabels[index]
                        : String(index - buttonLabels.length + 1);
                const buttonColor =
                    colorPalette !== null
                        ? Colors.get(colorType, index, colorPalette)
                        : buttonColors[index % buttonColors.length];
                var content = _.get(choice, 'text', '');
                var answer = _.get(choice, 'good', false);
                var selectedAnswer = index === selectedIndex;
                var answerIcon = !isAnswered || showAnswerDetails ? null : answer;

                var highlighted = !isAnswered || selectedAnswer || showAnswerDetails;
                var visible = !showAnswerDetails || answer;

                var onClick = _.bind(function(e) {
                    this.onChoiceClick(choice, index);
                }, this);

                if (visible) {
                    choicesElements.push(
                        <QuestionChoice
                            key={'choice-' + index}
                            buttonColor={buttonColor}
                            buttonLabel={buttonLabel}
                            content={content}
                            highlighted={highlighted}
                            answerIcon={answerIcon}
                            onClick={onClick}
                        />,
                    );
                }
            }, this),
        );

        return (
            <div ref="choices" className="question-choices">
                <Transitionable
                    transitionOut={this.onChoiceTransitionOut}
                    transitionOther={this.onChoiceTransitionOther}
                >
                    {choicesElements}
                </Transitionable>
            </div>
        );
    },

    renderInfos: function() {
        var element;
        var answers = _.get(this.props.bubble, 'fields.answers.answers');
        var goodAnswer = _.find(answers, function(answer) {
            return answer.good === true;
        });
        var answerDetails = _.get(goodAnswer, 'explanation', '');

        if (this.state.showAnswerDetails) {
            var buttons = this.renderButtons();
            element = (
                <div key={'infos'} className="question-infos">
                    <div
                        className="answer-details"
                        dangerouslySetInnerHTML={{ __html: answerDetails }}
                    />
                    {buttons}
                </div>
            );
        }

        return <Transitionable transitionIn={this.onInfosTransitionIn}>{element}</Transitionable>;
    },

    renderButtons: function() {
        var bubbleChannelId = _.get(this.props.bubble, 'channel_id');
        var channel = this.context.data.findChannelByID(bubbleChannelId);
        var buttonTypes = this.props.answerButtonTypes;
        var excludedButtons = _.get(channel, 'fields.settings.bubbleDetailsExcludedButtons', []);
        if (_.isString(excludedButtons)) {
            excludedButtons = excludedButtons.length > 0 ? excludedButtons.split(',') : [];
        }

        var selectedButtons = [];
        var button;
        for (var i = 0, il = buttonTypes.length; i < il; i++) {
            button = _.find(this.props.buttons, function(btn) {
                return btn.type === buttonTypes[i] && _.indexOf(excludedButtons, btn.type) === -1;
            });
            if (button) {
                selectedButtons.push(button);
            }
        }

        var buttons = selectedButtons.map(this.renderButton);

        return <div className="buttons-container">{buttons}</div>;
    },

    renderButton: function(button, index) {
        var type = _.get(button, 'type');
        var iconPosition = _.get(button, 'iconPosition');
        var label = _.get(button, 'label');

        var onClick = _.bind(function(e) {
            this.onButtonClick(e, button);
        }, this);

        return (
            <Button key={'b' + index} icon={type} iconPosition={iconPosition} onClick={onClick}>
                {Text.t(label)}
            </Button>
        );
    },

    componentDidMount: function() {
        this.timelines = [];
    },

    componentWillUnmount: function() {
        TweenMax.killDelayedCallsTo(this.onShowAnswerDetails);
        this.killTimelines();
    },

    onButtonClick: function(e, button) {
        if (this.props.onButtonClick) {
            this.props.onButtonClick(e, button);
        }
    },

    onChoiceClick: function(choice, index) {
        if (this.state.selectedIndex !== null) {
            return;
        }

        this.setState(
            {
                selectedIndex: index,
            },
            _.bind(function() {
                TweenMax.delayedCall(this.props.answerDetailsDelay, this.onShowAnswerDetails);
            }, this),
        );
    },

    onShowAnswerDetails: function() {
        this.setState({
            showAnswerDetails: true,
        });
    },

    onChoiceTransitionOut: function(transitionable, opts, done) {
        var el = transitionable.el;
        var choiceTop = el.offsetTop;

        var timeline = new TimelineMax({
            onStart: function() {
                TweenMax.set(el, {
                    position: 'absolute',
                    y: choiceTop,
                });
            },
            onComplete: done,
        });

        timeline.to(
            el,
            this.props.animationDuration,
            {
                alpha: 0,
            },
            0,
        );

        this.timelines.push(timeline);
    },

    onChoiceTransitionOther: function(transitionable, opts, done) {
        if (opts.mounting) {
            done();
            return;
        }

        var el = transitionable.el;
        var choices = ReactDOM.findDOMNode(this.refs.choices);
        var choiceTop = el.offsetTop;
        var choicesHeight = choices.offsetHeight;

        var timeline = new TimelineMax({
            onStart: function() {
                TweenMax.set(el, {
                    position: 'absolute',
                    y: choiceTop,
                });
            },
            onComplete: function() {
                TweenMax.set(choices, {
                    height: 'auto',
                });
                TweenMax.set(el, {
                    position: 'static',
                    y: 0,
                });
                done();
            },
        });

        timeline.set(choices, {
            height: choicesHeight,
        });

        timeline.to(
            el,
            this.props.animationDuration,
            {
                y: 0,
                ease: Power1.easeInOut,
            },
            0,
        );

        this.timelines.push(timeline);
    },

    onInfosTransitionIn: function(transitionable, opts, done) {
        var el = transitionable.el;

        var timeline = new TimelineMax({
            delay: this.props.animationDuration,
            onComplete: done,
        });

        timeline.from(
            el,
            this.props.animationDuration,
            {
                alpha: 0,
            },
            0,
        );

        this.timelines.push(timeline);
    },

    killTimelines: function() {
        while (this.timelines.length) {
            var lastTimeline = this.timelines[this.timelines.length - 1];
            if (lastTimeline) {
                lastTimeline.kill();
                lastTimeline = null;
            }
            this.timelines.pop();
        }
        this.timelines = null;
    },
});

export default BubbleDetailsQuestion;
