import React from 'react';
import PropTypes from 'prop-types';
import ReactDOM from 'react-dom';
import { TweenMax } from 'gsap/TweenMax';

import { FTScroller } from '../../vendor/ftscroller';

const Scrollable = React.createClass({
    propTypes: {
        axis: PropTypes.string,
        scrollLeft: PropTypes.number,
        scrollTop: PropTypes.number,
        scrollingDuration: PropTypes.number,
        scrollingEase: PropTypes.string,
        enabled: PropTypes.bool,

        onScroll: PropTypes.func,
    },

    getDefaultProps() {
        return {
            enabled: true,
            axis: 'y', // x || y || both
            scrollLeft: null,
            scrollTop: null,
            scrollingDuration: 0,
            scrollingEase: 'Power1.easeInOut',
        };
    },

    tween: null,
    scroller: null,

    render() {
        return this.props.children;
    },

    componentDidMount() {
        const scrollable = ReactDOM.findDOMNode(this);
        const { axis } = this.props;

        this.scroller = new FTScroller(scrollable, {
            scrollbars: false,
            scrollingX: axis === 'x' || axis === 'both',
            scrollingY: axis === 'y' || axis === 'both',
            bouncing: false,
            updateOnWindowResize: true,
        });

        this.setEnabled(this.props.enabled);
        this.scrollTo(this.props.scrollLeft || false, this.props.scrollTop || false);
        this.scroller.addEventListener('scroll', this.onScroll);
    },

    componentDidUpdate(prevProps) {
        const enabledChanged = prevProps.enabled !== this.props.enabled;
        const scrollChanged = prevProps.scrollLeft !== this.props.scrollLeft
            || prevProps.scrollTop !== this.props.scrollTop;

        if (enabledChanged) {
            this.setEnabled(this.props.enabled);
        }

        if (scrollChanged) {
            this.scrollTo(this.props.scrollLeft, this.props.scrollTop);
        }
    },

    componentWillUnmount() {
        if (this.tween) {
            this.tween.kill();
            this.tween = null;
        }

        if (this.scroller) {
            this.scroller.removeEventListener('scroll', this.onScroll);
            this.scroller.destroy();
            this.scroller = null;
        }
    },

    setEnabled(enabled) {
        this.scroller.setDisabledInputMethods({
            mouse: !enabled,
            touch: !enabled,
            scroll: !enabled,
            pointer: !enabled,
            focus: !enabled,
        });
    },

    scrollTo(scrollLeft, scrollTop) {
        scrollLeft = scrollLeft === null ? false : scrollLeft;
        scrollTop = scrollTop === null ? false : scrollTop;
        const { scroller } = this;

        if (scroller.scrollLeft === scrollLeft || scroller.scrollTop === scrollTop) {
            // console.log('same scroll value');
            return;
        }

        const scrollingDuration = this.props.scrollingDuration === null ? 0 : this.props.scrollingDuration;

        if (scrollingDuration) {
            if (this.tween) {
                this.tween.kill();
            }

            const startingValues = {
                scrollLeft: scrollLeft === false ? false : scroller.scrollLeft,
                scrollTop: scrollTop === false ? false : scroller.scrollTop,
            };

            this.tween = TweenMax.to(
                startingValues,
                scrollingDuration,
                {
                    scrollTop,
                    scrollLeft,
                    onUpdate() {
                        scroller.scrollTo(this.target.scrollLeft, this.target.scrollTop);
                    },
                    ease: EaseLookup.find(this.props.scrollingEase),
                },
                0,
            );
        } else {
            scroller.scrollTo(scrollLeft, scrollTop);
        }
    },

    onScroll(e) {
        if (this.props.onScroll) {
            this.props.onScroll(e, this.scroller.scrollTop);
        }
    },
});

export default Scrollable;
