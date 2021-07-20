import React from 'react';
import PropTypes from 'prop-types';
import ReactDOM from 'react-dom';
import _ from 'lodash';
import $ from 'jquery';
import { TweenMax, TimelineMax } from 'gsap/TweenMax';

import ProgressBar from 'progressbar.js';
import SlideshowInfos from './SlideshowInfos';
import Transitionable from '../../helpers/Transitionable';
// import Transitionable from 'react-transitionable';

import Text from '../../../lib/text';

const SlideshowInfosWithQuestion = React.createClass({
    propTypes: {
        current: PropTypes.bool.isRequired,
        data: PropTypes.object.isRequired,
        width: PropTypes.number.isRequired,
        height: PropTypes.number.isRequired,
        horizontal: PropTypes.bool.isRequired,

        duration: PropTypes.number,
        animationDuration: PropTypes.number,
    },

    getDefaultProps() {
        return {
            context: 'slideshow',
            duration: 20,
            animationDuration: 0.5,
        };
    },

    circleProgress: null,
    timelines: null,

    getInitialState() {
        return {
            secondsRemaining: this.props.duration,
        };
    },

    render() {
        const infos = this.renderInfos();
        let question;

        if (this.props.context === 'slideshow') {
            question = this.renderQuestion();
        }

        return (
            <div className="slide-cover-infos-with-question">
                {infos}
                {question}
            </div>
        );
    },

    renderInfos() {
        const props = _.omit(this.props, ['width', 'height']);

        return <SlideshowInfos {...props} />;
    },

    renderQuestion() {
        const choices = this.renderChoices();
        const answerTimeoutBanner = this.renderAnswerTimeoutBanner();
        const answerDetails = this.renderAnswerDetails();

        return (
            <div ref="question" className="slide-cover-infos-question-container">
                <div className="slide-cover-infos-question-content">
                    <div className="slide-cover-infos-question">
                        <div ref="questionInner" className="slide-cover-infos-question-inner">
                            {choices}
                            {answerTimeoutBanner}
                            {answerDetails}
                        </div>
                    </div>
                </div>
            </div>
        );
    },

    renderChoices() {
        const choicesData = _.get(this.props.data, 'fields.answers.answers', []);
        const choices = [];
        for (let i = 0, il = choicesData.length; i < il; i++) {
            const choice = choicesData[i];
            const answer = _.get(choice, 'good', false);
            if (this.state.secondsRemaining === 0 && !answer) {
                continue;
            }

            choices.push(this.renderChoice(choice, i));
        }

        return (
            <div ref="choices" className="slide-cover-infos-question-choices">
                <Transitionable
                    transitionOut={this.onChoiceTransitionOut}
                    transitionOther={this.onChoiceTransitionOther}
                >
                    {choices}
                </Transitionable>
            </div>
        );
    },

    renderChoice(choice, index) {
        const value = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[index];
        const label = _.get(choice, 'text', '');

        return (
            <div key={`choice${index}`} className="slide-cover-infos-question-choice">
                <div className="slide-cover-infos-question-choice-value">{value}</div>
                <div className="slide-cover-infos-question-choice-label">{label}</div>
            </div>
        );
    },

    renderAnswerTimeoutBanner() {
        const seconds = this.state.secondsRemaining;

        let element;

        if (seconds > 0) {
            element = (
                <div
                    key="timeout-banner"
                    ref="timeoutBanner"
                    className="slide-cover-infos-question-answer-timeout-banner"
                >
                    <div ref="progressCircle" className="timeout-progress-circle" />
                    <span className="timeout-progress-label">
                        {Text.t('question_timeout_banner', seconds)}
                    </span>
                </div>
            );
        }

        return (
            <Transitionable transitionOut={this.onTimeoutBannerTransitionOut}>
                {element}
            </Transitionable>
        );
    },

    renderAnswerDetails() {
        const seconds = this.state.secondsRemaining;

        let element;

        if (seconds === 0) {
            const answers = _.get(this.props.data, 'fields.answers.answers');
            const goodAnswer = _.find(answers, it => it.good === true);
            const answerDetails = _.get(goodAnswer, 'explanation', '');
            element = (
                <div
                    key="answer-details"
                    ref="answerDetails"
                    className="question-answer-details"
                    dangerouslySetInnerHTML={{ __html: answerDetails }}
                />
            );
        }

        return (
            <Transitionable transitionIn={this.onAnswerDetailsTransitionIn}>
                {element}
            </Transitionable>
        );
    },

    componentDidMount() {
        this.timelines = [];

        if (this.props.current) {
            this.startCountDown();
        }
    },

    componentDidUpdate(prevProps) {
        const nowCurrent = !prevProps.current && this.props.current;

        if (nowCurrent) {
            this.startCountDown();
        }
    },

    componentWillUnmount() {
        this.killTimelines();
        this.timelines = null;

        if (this.circleProgress) {
            this.circleProgress.stop();
            this.circleProgress.destroy();
            this.circleProgress = null;
        }
    },

    onChoiceTransitionOut(transitionable, opts, done) {
        const { el } = transitionable;
        const choiceTop = el.offsetTop;

        const timeline = new TimelineMax({
            onStart() {
                TweenMax.set(el, {
                    position: 'absolute',
                    top: 0,
                    y: choiceTop,
                });
            },
            onComplete: done,
        });

        timeline.to(transitionable.el, this.props.animationDuration, {
            alpha: 0,
        });

        this.timelines.push(timeline);
    },

    onChoiceTransitionOther(transitionable, opts, done) {
        if (opts.mounting) {
            done();
            return;
        }

        const { el } = transitionable;

        const choiceTop = el.offsetTop;
        const choiceHeight = el.offsetHeight;

        const questionInner = ReactDOM.findDOMNode(this.refs.questionInner);
        const questionInnerHeight = questionInner.offsetHeight;
        const questionInnerPadding = questionInnerHeight - $(questionInner).height();

        const choices = ReactDOM.findDOMNode(this.refs.choices);
        const choicesHeight = choices.offsetHeight;

        const timeoutBanner = ReactDOM.findDOMNode(this.refs.timeoutBanner);
        const timeoutBannerHeight = timeoutBanner.offsetHeight;

        const answerDetails = ReactDOM.findDOMNode(this.refs.answerDetails);
        const answerDetailsHeight = answerDetails.offsetHeight;

        const timeline = new TimelineMax({
            onStart() {
                TweenMax.set(el, {
                    position: 'absolute',
                    y: choiceTop,
                });
            },
            onComplete() {
                TweenMax.set(el, {
                    position: 'static',
                });
                TweenMax.set(questionInner, {
                    delay: 0.00001,
                    height: 'auto',
                });
                done();
            },
        });

        timeline.fromTo(
            questionInner,
            this.props.animationDuration,
            {
                height: choicesHeight + timeoutBannerHeight + questionInnerPadding,
            },
            {
                delay: this.props.animationDuration,
                height: choiceHeight + answerDetailsHeight + questionInnerPadding,
                ease: Power1.easeInOut,
            },
            0,
        );

        timeline.to(
            el,
            this.props.animationDuration,
            {
                delay: this.props.animationDuration,
                y: 0,
                ease: Power1.easeInOut,
            },
            0,
        );

        this.timelines.push(timeline);
    },

    onTimeoutBannerTransitionOut(transitionable, opts, done) {
        const { el } = transitionable;
        const bannerTop = el.offsetTop;

        const timeline = new TimelineMax({
            onStart() {
                TweenMax.set(el, {
                    position: 'absolute',
                    top: 0,
                    y: bannerTop,
                });
            },
            onComplete: done,
        });

        timeline.to(el, this.props.animationDuration, {
            alpha: 0,
        });

        this.timelines.push(timeline);
    },

    onAnswerDetailsTransitionIn(transitionable, opts, done) {
        const { el } = transitionable;

        const timeline = new TimelineMax({
            delay: this.props.animationDuration * 2,
            onComplete: done,
        });

        timeline.from(el, this.props.animationDuration, {
            alpha: 0,
        });

        this.timelines.push(timeline);
    },

    startCountDown() {
        const circleProgressDOM = ReactDOM.findDOMNode(this.refs.progressCircle);

        if (!circleProgressDOM || this.props.context !== 'slideshow') {
            return;
        }

        this.circleProgress = new ProgressBar.Circle(circleProgressDOM, {
            color: '#FFF',
            strokeWidth: 10,
            trailColor: 'rgba(255,255,255, 0.3)',
            trailWidth: 10,
            duration: this.props.duration * 1000,
            step: _.bind(function (state, circle) {
                const secondsRemaining = Math.ceil(
                    this.props.duration - circle.value() * this.props.duration,
                );
                if (secondsRemaining !== this.state.secondsRemaining) {
                    this.setState({
                        secondsRemaining,
                    });
                }
            }, this),
        });

        this.circleProgress.animate(1);
    },

    killTimelines() {
        while (this.timelines.length) {
            let lastTimeline = this.timelines[this.timelines.length - 1];
            if (lastTimeline) {
                lastTimeline.kill();
                lastTimeline = null;
            }
            this.timelines.pop();
        }
    },
});

export default SlideshowInfosWithQuestion;
