import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import $ from 'jquery';
import classNames from 'classnames';
import createDebug from 'debug';
import get from 'lodash/get';

import * as AppPropTypes from '../../lib/PropTypes';
import Slides from '../slides/Slides';
import SlideSlideshow from '../slides/slide/SlideSlideshow';
import Hand from '../partials/Hand';

const debugSlideshow = createDebug('manivelle:components:slideshow');

const propTypes = {
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
    timeline: AppPropTypes.timeline.isRequired,
    cycleIndex: PropTypes.number.isRequired,
    bubbleIndex: PropTypes.number.isRequired,
    bubbles: AppPropTypes.bubbles.isRequired,
    paused: PropTypes.bool.isRequired,
    presseable: PropTypes.bool.isRequired,
    manivelleMinimumDelta: PropTypes.number,
    onPress: PropTypes.func, // bubbles:array, index:number, point:{x,y}
};

const defaultProps = {
    manivelleMinimumDelta: 2 / 1024,
    onPress: null,
};

const contextTypes = {
    data: AppPropTypes.dataRepository, // eslint-disable-line react/forbid-prop-types
};

class Slideshow extends PureComponent {
    constructor(props) {
        super(props);

        this.onTouchStart = this.onTouchStart.bind(this);
        this.onMouseDown = this.onMouseDown.bind(this);
        this.onPress = this.onPress.bind(this);
        this.onManivelleRotation = this.onManivelleRotation.bind(this);
        this.getSlideProps = this.getSlideProps.bind(this);
        this.getSlideSize = this.getSlideSize.bind(this);

        this.refContainer = null;
    }

    componentDidMount() {
        $(document).on('manivelle:rotation', this.onManivelleRotation);
    }

    componentWillUnmount() {
        $(document).off('manivelle:rotation', this.onManivelleRotation);
    }

    onPress(point) {
        const { onPress, bubbles, bubbleIndex } = this.props;
        const el = this.refContainer;
        const ids = bubbles.map(it => it.id);
        let relativePoint;

        if (typeof point !== 'undefined') {
            const elBounds = el.getBoundingClientRect();
            const x = point.x - elBounds.left;
            const y = point.y - elBounds.top;
            relativePoint = {
                x,
                y,
            };
        }

        if (onPress) {
            onPress(bubbleIndex, ids, relativePoint);
        }
    }

    /**
     * Events handlers
     */

    onManivelleRotation(e) {
        const { paused, manivelleMinimumDelta } = this.props;
        if (paused || Math.abs(e.manivelle.deltaValue) < manivelleMinimumDelta) {
            return;
        }

        this.onPress();
    }

    onTouchStart(e) {
        // return;// TMP

        const touches = e.targetTouches;
        const lastTouch = touches[touches.length - 1];

        this.onPress({
            x: lastTouch.clientX,
            y: lastTouch.clientY,
        });
    }

    onMouseDown(e) {
        // TMP - cancel right click
        if (e.nativeEvent.which !== 1) {
            return;
        }

        this.onPress({
            x: e.clientX,
            y: e.clientY,
        });
    }

    getSlideProps(slide, slidePosition, index) {
        const {
            width, height, timeline, cycleIndex,
        } = this.props;
        const duration = get(timeline, `${cycleIndex}.items.${index}.duration`, 0) / 2;
        return {
            horizontal: width > height,
            context: 'slideshow',
            duration,
        };
    }

    // eslint-disable-next-line class-methods-use-this
    getSlideSize(slide, index, current, { width, height }) {
        return {
            width,
            height,
        };
    }

    renderSlides() {
        const {
            width, height, bubbles, bubbleIndex,
        } = this.props;
        return bubbles !== null ? (
            <div className="slides-container">
                <Slides
                    transitionType="fade"
                    slides={bubbles}
                    index={bubbleIndex}
                    SlideComponent={SlideSlideshow}
                    slideProps={this.getSlideProps}
                    slideSize={this.getSlideSize}
                    width={width}
                    height={height}
                    otherSlidesOpacity={1}
                />
            </div>
        ) : null;
    }

    render() {
        const { paused, presseable } = this.props;
        debugSlideshow('render', this.props);

        const userEvents = {
            onTouchStart: this.onTouchStart,
            onMouseDown: this.onMouseDown,
        };

        return (
            <div
                className={classNames([
                    'slideshow',
                    {
                        paused,
                    },
                ])}
                ref={(ref) => {
                    this.refContainer = ref;
                }}
                {...userEvents}
            >
                {this.renderSlides()}
                <Hand animate={presseable} />
            </div>
        );
    }
}

Slideshow.propTypes = propTypes;
Slideshow.defaultProps = defaultProps;
Slideshow.contextTypes = contextTypes;

export default Slideshow;
