import React from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import ReactDOM from 'react-dom';
import createDebug from 'debug';
import { TweenMax } from 'gsap/TweenMax';

const debug = createDebug('app:transitionable');

const Transitionable = React.createClass({
    propTypes: {
        children: PropTypes.oneOfType([
            PropTypes.arrayOf(
                PropTypes.shape({
                    key: PropTypes.string,
                }),
            ),
            PropTypes.shape({
                key: PropTypes.string,
            }),
        ]),

        className: PropTypes.string,
        style: PropTypes.object,
        styleView: PropTypes.object,

        transitionIn: PropTypes.func,
        transitionOut: PropTypes.func,
        transitionOther: PropTypes.func,
        onTransitionsStart: PropTypes.func,
        onTransitionsComplete: PropTypes.func,
    },

    getDefaultProps() {
        return {
            className: '',
            style: {},
            styleView: {},
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

    getInitialState() {
        const children = this.getChildrenAsArray(this.props.children);
        return {
            children,
            allChildren: children,
            transitioningChildren: [],
            transitioningIn: [],
            transitioningOut: [],
            transitioningOther: [],
        };
    },

    render() {
        const wrappedChildren = this.state.allChildren.map(_.bind(this.renderChildren, this));

        let { className } = this.props;
        className += ' transitionable-views';

        return (
            <div className={className} style={this.props.style}>
                {wrappedChildren}
            </div>
        );
    },

    renderChildren(child, index) {
        const key = `t-${child.key}`;

        let className = 'transitionable-view';

        if (_.indexOf(this.state.transitioningIn, child.key) > -1) {
            className += ' transitioning transitioning-in';
        } else if (_.indexOf(this.state.transitioningOut, child.key) > -1) {
            className += ' transitioning transitioning-out';
        } else if (_.indexOf(this.state.transitioningOther, child.key) > -1) {
            className += ' transitioning transitioning-other';
        }

        return (
            <div className={className} key={key} ref={key} style={this.props.styleView}>
                {child}
            </div>
        );
    },

    componentWillMount() {
        this.transitionChildren({
            mounting: true,
        });
    },

    componentWillReceiveProps(nextProps) {
        if (this.props.children !== nextProps.children) {
            const nextChildren = this.getChildrenAsArray(nextProps.children);

            // Replace existing children
            const newChildren = [];
            _.each(this.state.children, (child) => {
                const existingChild = _.find(nextChildren, 'key', child.key);
                newChildren.push(existingChild || child);
            });

            // Replace existing transitioning children
            const newTransitioningChildren = [];
            _.each(this.state.transitioningChildren, (child) => {
                const existingChild = _.find(nextChildren, 'key', child.key);
                newTransitioningChildren.push(existingChild || child);
            });

            // Get all children
            const allChildren = _.uniq(_.union(newChildren, newTransitioningChildren), child => child.key);

            // Add new children
            _.each(nextChildren, (child) => {
                const existingIndex = _.findIndex(allChildren, 'key', child.key);
                if (existingIndex === -1) {
                    allChildren.push(child);
                }
            });

            this.setState({
                children: newChildren,
                transitioningChildren: newTransitioningChildren,
                allChildren,
            });
        }
    },

    componentDidUpdate(prevProps, prevState) {
        const currentChildrenKey = _.pluck(this.getChildrenAsArray(this.props.children), 'key').join(
            '|',
        );
        const prevChildrenKey = _.pluck(this.getChildrenAsArray(prevProps.children), 'key').join('|');
        if (currentChildrenKey !== prevChildrenKey) {
            this.transitionChildren();
        }
    },

    transitionChildren(opts) {
        opts = _.extend(
            {
                mounting: false,
                allChildrenKeys: _.pluck(this.state.allChildren, 'key'),
            },
            opts,
        );

        const newChildren = this.getChildrenAsArray(this.props.children);
        const currentChildren = _.uniq(
            _.union(this.state.children, this.state.transitioningChildren),
            child => child.key,
        );
        const allCurrentKeys = _.pluck(currentChildren, 'key');
        const currentKeys = _.pluck(this.state.children, 'key');
        const nextKeys = _.pluck(newChildren, 'key');
        const keysToRemove = _.difference(allCurrentKeys, nextKeys);
        const keysToAdd = _.difference(
            nextKeys,
            _.difference(currentKeys, this.state.transitioningOut),
        );
        const keysOthers = _.difference(allCurrentKeys, keysToRemove, keysToAdd);

        const transitions = [];

        debug('Current keys', currentKeys);
        debug('Next keys', nextKeys);
        debug('Children to remove', keysToRemove);
        debug('Children to add', keysToAdd);
        debug('Children others', keysOthers);
        debug('---');

        if (keysToRemove.length) {
            for (let i = 0, brl = keysToRemove.length; i < brl; i++) {
                transitions.push({
                    direction: 'out',
                    key: keysToRemove[i],
                });
            }
        }
        if (keysToAdd.length) {
            for (let j = 0, bal = keysToAdd.length; j < bal; j++) {
                transitions.push({
                    direction: 'in',
                    key: keysToAdd[j],
                });
            }
        }
        if (keysOthers.length) {
            for (let k = 0, bol = keysOthers.length; k < bol; k++) {
                transitions.push({
                    direction: 'other',
                    key: keysOthers[k],
                });
            }
        }

        // Merge new transitioning and old transitioning
        const newTransitioningChildren = _.filter(this.state.allChildren, child => (
            _.indexOf(keysToAdd, child.key) !== -1 || _.indexOf(keysToRemove, child.key) !== -1
        ));
        const allTransitioningChildren = _.union(
            this.state.transitioningChildren,
            newTransitioningChildren,
        );
        const transitioningChildren = _.uniq(allTransitioningChildren, child => child.key);

        this.setState(
            {
                transitioningChildren,
            },
            function () {
                this.callTransitions(transitions, opts);

                if (!opts.mounting && this.props.onTransitionsStart) {
                    this.props.onTransitionsStart();
                }
            },
        );
    },

    callTransitions(transitions, opts) {
        const keys = _.pluck(transitions, 'key');
        const inKeys = _.pluck(_.filter(transitions, 'direction', 'in'), 'key');
        const outKeys = _.pluck(_.filter(transitions, 'direction', 'out'), 'key');
        const otherKeys = _.pluck(_.filter(transitions, 'direction', 'other'), 'key');
        const transitioningIn = _.difference(
            _.union(this.state.transitioningIn, inKeys),
            outKeys,
            otherKeys,
        );
        const transitioningOut = _.difference(
            _.union(this.state.transitioningOut, outKeys),
            inKeys,
            otherKeys,
        );
        const transitioningOther = _.difference(
            _.union(this.state.transitioningOther, otherKeys),
            inKeys,
            outKeys,
        );

        const remainingTransitions = _.filter(
            transitions,
            _.bind(function (transition) {
                if (transition.direction === 'in') {
                    return _.indexOf(this.state.transitioningIn, transition.key) === -1;
                } if (transition.direction === 'out') {
                    return _.indexOf(this.state.transitioningOut, transition.key) === -1;
                } if (transition.direction === 'other') {
                    return _.indexOf(this.state.transitioningOther, transition.key) === -1;
                }
            }, this),
        );

        // Remove others from transitioning keys or not
        const remainingTransitionsKeys = _.difference(
            _.pluck(remainingTransitions, 'key'),
            transitioningOther,
        );
        // var remainingTransitionsKeys = _.pluck(remainingTransitions, 'key');

        /* debug('Should transitions', keys);
        debug('Will transitions', _.pluck(remainingTransitions, 'key'));
        debug('Transitioning in', transitioningIn);
        debug('Transitioning out', transitioningOut);
        debug('Transitioning other', transitioningOther); */

        this.setState(
            {
                transitioningIn,
                transitioningOut,
                transitioningOther,
            },
            function () {
                const transitionCount = remainingTransitions.length;
                let transitionDone = 0;
                const transitionCompleted = function () {
                    transitionDone++;
                    if (transitionCount === transitionDone) {
                        this.setState(
                            {
                                transitioningIn: _.difference(this.state.transitioningIn, inKeys),
                                transitioningOut: _.difference(
                                    this.state.transitioningOut,
                                    outKeys,
                                ),
                                transitioningOther: _.difference(
                                    this.state.transitioningOther,
                                    otherKeys,
                                ),
                            },
                            function () {
                                this.onAllTransitionComplete(remainingTransitionsKeys);
                            },
                        );
                    }
                };
                let transition;
                for (let i = 0; i < transitionCount; i++) {
                    transition = remainingTransitions[i];
                    this.callTransition(
                        transition.direction,
                        transition.key,
                        opts,
                        transitionCompleted,
                    );
                }
            },
        );
    },

    callTransition(direction, key, opts, done) {
        const el = ReactDOM.findDOMNode(this.refs[`t-${key}`]);
        const directionName = direction.substr(0, 1).toUpperCase() + direction.substr(1);
        const child = _.find(this.state.allChildren, 'key', key);
        const transitionable = {
            el,
            key,
            props: child ? child.props : {},
        };
        this.props[`transition${directionName}`].call(
            this,
            transitionable,
            opts,
            _.bind(function () {
                this.onTransitionComplete(transitionable, direction);
                this[`onTransition${directionName}Complete`](transitionable, child);
                setTimeout(_.bind(done, this), 0);
            }, this),
        );
    },

    getChildrenAsArray(children) {
        let newChildren = children;
        if (!_.isArray(newChildren)) {
            newChildren = newChildren ? [newChildren] : [];
        }
        return newChildren;
    },

    onTransitionComplete(transitionable, direction) {
        if (this.props.onTransitionComplete) {
            this.props.onTransitionComplete(transitionable, direction);
        }
    },

    onTransitionInComplete(transitionable) {
        if (this.props.onTransitionInComplete) {
            this.props.onTransitionInComplete(transitionable);
        }
    },

    onTransitionOutComplete(transitionable) {
        if (this.props.onTransitionOutComplete) {
            this.props.onTransitionOutComplete(transitionable);
        }
    },

    onTransitionOtherComplete(transitionable) {
        if (this.props.onTransitionOtherComplete) {
            this.props.onTransitionOtherComplete(transitionable);
        }
    },

    onAllTransitionComplete(keys) {
        debug('All transitionings completed', keys);

        const transitioningChildren = _.filter(this.state.transitioningChildren, child => _.indexOf(keys, child.key) === -1);

        const newChildren = this.getChildrenAsArray(this.props.children);
        const allChildren = _.union(newChildren, transitioningChildren);
        const children = _.uniq(allChildren, child => child.key);

        this.setState(
            {
                allChildren: children,
                children: newChildren,
                transitioningChildren,
            },
            function () {
                /* debug('Transitioning children', this.state.transitioningChildren);
            debug('Transitioning in', this.state.transitioningIn);
            debug('Transitioning out', this.state.transitioningOut);
            debug('Transitioning other', this.state.transitioningOther); */
                if (this.props.onTransitionsComplete) {
                    this.props.onTransitionsComplete();
                }
            },
        );
    },
});

export default Transitionable;
