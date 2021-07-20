import React from 'react';
import PropTypes from 'prop-types';
import TransitionableComponent from 'react-transitionable';
import { TweenMax } from 'gsap/TweenMax';

const Transitionable = React.createClass({
    propTypes: {
        transitionIn: PropTypes.func,
        transitionOut: PropTypes.func,
        transitionOther: PropTypes.func,
    },

    getDefaultProps() {
        return {
            transitionIn(transitionable, opts, done) {
                TweenMax.fromTo(
                    transitionable.el,
                    opts.mounting ? 0 : 0.4,
                    {
                        opacity: 0,
                    },
                    {
                        opacity: 1,
                        onComplete: done,
                    },
                );
            },
            transitionOut(transitionable, opts, done) {
                TweenMax.to(transitionable.el, opts.mounting ? 0 : 0.4, {
                    opacity: 0,
                    onComplete: done,
                });
            },
            transitionOther(transitionable, opts, done) {
                done();
            },
        };
    },

    render() {
        return (
            <TransitionableComponent {...this.props}>{this.props.children}</TransitionableComponent>
        );
    },
});

export default Transitionable;
