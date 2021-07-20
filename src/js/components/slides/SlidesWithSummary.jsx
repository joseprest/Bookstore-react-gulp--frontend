import React, { Component } from 'react';
import _ from 'lodash';
import $ from 'jquery';
import {
    TweenMax, TimelineMax, Power1, Linear,
} from 'gsap/TweenMax';

import Slides from './Slides';
import SlideWithSummary from './slide/SlideWithSummary';

class SlidesWithSummary extends Component {
    static getCoverOpenAnim(coverElement, duration) {
        const timeline = new TimelineMax();
        timeline.set(coverElement, {
            rotationY: '0deg',
        });

        timeline.to(coverElement, duration, {
            rotationY: '-5deg',
            ease: Power1.easeInOut,
        });

        timeline.to(coverElement, duration, {
            rotationY: '0deg',
            ease: Power1.easeInOut,
        });

        return timeline;
    }

    static createSummaryTransition(element, translation, opts) {
        const animationDuration = opts && typeof opts.animationDuration !== 'undefined' ? opts.animationDuration : 0.4;
        const ease = opts && typeof opts.ease !== 'undefined' ? opts.ease : Power1.easeInOut;
        const isCurrent = _.get(translation, 'current');
        const isLastCurrent = _.get(translation, 'lastCurrent');

        const $el = $(element);
        const coverElement = $el.find('.slide-cover')[0];
        const summaryElement = $el.find('.slide-summary-container')[0];

        const timeline = new TimelineMax({});

        if (isCurrent) {
            timeline.add(
                SlidesWithSummary.getCoverOpenAnim(coverElement, animationDuration / 2),
                0,
            );
            timeline.fromTo(
                summaryElement,
                animationDuration,
                {
                    x: 0,
                },
                {
                    x: summaryElement.offsetWidth,
                    ease,
                },
                0,
            );
        } else if (isLastCurrent) {
            timeline.add(
                SlidesWithSummary.getCoverOpenAnim(coverElement, animationDuration / 2),
                0,
            );
            timeline.fromTo(
                summaryElement,
                animationDuration,
                {
                    x: summaryElement.offsetWidth,
                },
                {
                    x: 0,
                    ease,
                },
                0,
            );
        }

        return timeline;
    }

    constructor(props) {
        super(props);

        this.refContainer = null;

        this.onUpdateSlidesPositions = this.onUpdateSlidesPositions.bind(this);
        this.onSlideTransitionOther = this.onSlideTransitionOther.bind(this);
        this.createOffsetTimeline = this.createOffsetTimeline.bind(this);
    }

    onUpdateSlidesPositions(slidesTranslations) {
        const $slides = $(this.refContainer).find('> .transitionable-views');
        slidesTranslations.forEach((translation) => {
            const $slide = $slides.find(`[data-key="${translation.key}"]`).parent();
            if ($slide.length) {
                const coverElement = $slide.find('.slide-cover')[0];
                const summaryElement = $slide.find('.slide-summary-container')[0];
                TweenMax.killTweensOf(coverElement);
                TweenMax.killTweensOf(summaryElement);

                TweenMax.set(coverElement, {
                    x: 0,
                    rotationY: '0deg',
                });

                TweenMax.set(summaryElement, {
                    x: translation.current ? summaryElement.offsetWidth : 0,
                });
            }
        });
    }

    // eslint-disable-next-line class-methods-use-this
    onSlideTransitionOther(transitionable, opts) {
        const { timeline } = opts;
        const { translation } = opts;

        const summaryTimeline = SlidesWithSummary.createSummaryTransition(
            transitionable.el,
            translation,
            opts,
        );
        timeline.add(summaryTimeline, 0);
    }

    createOffsetTimeline(offsetTimeline, offsetProps, { slidesTranslations }) {
        const $slides = $(this.refContainer).find(' > .transitionable-views');
        slidesTranslations.forEach((translation) => {
            const $slide = $slides.find(`[data-key="${translation.key}"]`).parent();

            if ($slide.length) {
                offsetTimeline.add(
                    SlidesWithSummary.createSummaryTransition($slide[0], translation, {
                        ease: Linear.easeNone,
                    }),
                    0,
                );
            }
        });
    }

    render() {
        return (
            <Slides
                {...this.props}
                refContainer={(ref) => { this.refContainer = ref; }}
                SlideComponent={SlideWithSummary}
                onUpdateSlidesPositions={this.onUpdateSlidesPositions}
                createOffsetTimeline={this.createOffsetTimeline}
                onSlideTransitionOther={this.onSlideTransitionOther}
            />
        );
    }
}

export default SlidesWithSummary;
