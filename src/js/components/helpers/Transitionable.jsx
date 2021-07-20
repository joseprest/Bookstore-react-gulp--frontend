import React from 'react';
import PropTypes from 'prop-types';
// import TransitionableComponent from 'react-transitionable';
import { TweenMax } from 'gsap/TweenMax';

import TransitionableComponent from './Transitionable.vendor';

const propTypes = {
    transitionIn: PropTypes.func,
    transitionOut: PropTypes.func,
    transitionOther: PropTypes.func,
};

const defaultProps = {
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

const Transitionable = props => (
    <TransitionableComponent {...props} />
);

Transitionable.propTypes = propTypes;
Transitionable.defaultProps = defaultProps;

export default Transitionable;
