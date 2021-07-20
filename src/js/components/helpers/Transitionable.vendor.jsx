import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import union from 'lodash/union';
import uniq from 'lodash/uniq';
import isArray from 'lodash/isArray';
import isFunction from 'lodash/isFunction';
import difference from 'lodash/difference';
import createDebug from 'debug';

const debug = createDebug('react-transitionable');

const propTypes = {
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
    childClassName: PropTypes.string,
    style: PropTypes.object, // eslint-disable-line react/forbid-prop-types
    childStyle: PropTypes.object, // eslint-disable-line react/forbid-prop-types

    transitionIn: PropTypes.func, // eslint-disable-line react/no-unused-prop-types
    transitionOut: PropTypes.func, // eslint-disable-line react/no-unused-prop-types
    transitionOther: PropTypes.func, // eslint-disable-line react/no-unused-prop-types
    onTransitionComplete: PropTypes.func,
    onTransitionInComplete: PropTypes.func,
    onTransitionOutComplete: PropTypes.func,
    onTransitionOtherComplete: PropTypes.func,
    onTransitionsStart: PropTypes.func,
    onTransitionsComplete: PropTypes.func,
};

const defaultProps = {
    children: [],
    className: null,
    childClassName: null,
    style: {},
    childStyle: {},
    transitionIn(transitionable, opts, done) {
        done();
    },
    transitionOut(transitionable, opts, done) {
        done();
    },
    transitionOther(transitionable, opts, done) {
        done();
    },
    onTransitionComplete: null,
    onTransitionInComplete: null,
    onTransitionOutComplete: null,
    onTransitionOtherComplete: null,
    onTransitionsStart: null,
    onTransitionsComplete: null,
};

class Transitionable extends Component {
    static getChildrenAsArray(children) {
        let newChildren = children;
        if (!isArray(newChildren)) {
            newChildren = newChildren ? [newChildren] : [];
        }
        return newChildren;
    }

    constructor(props) {
        super(props);

        this.renderChildren = this.renderChildren.bind(this);

        this.refViews = {};

        const children = Transitionable.getChildrenAsArray(props.children);

        this.state = {
            children,
            allChildren: children,
            transitioningChildren: [],
            transitioningIn: [],
            transitioningOut: [],
            transitioningOther: [],
        };
    }

    componentWillMount() {
        this.transitionChildren({
            mounting: true,
        });
    }

    componentWillReceiveProps({ children: nextChildren }) {
        const { children: currentChildren } = this.props;
        const nextChildrenArray = Transitionable.getChildrenAsArray(nextChildren);
        const { children, transitioningChildren } = this.state;

        // Replace existing children
        const newChildren = children.map(
            child => nextChildrenArray.find(nextChild => nextChild.key === child.key) || child,
        );

        // Replace existing transitioning children
        const newTransitioningChildren = transitioningChildren.map(
            child => nextChildrenArray.find(nextChild => nextChild.key === child.key) || child,
        );

        // Get all children
        const allChildren = uniq(union(newChildren, newTransitioningChildren), child => child.key);

        if (currentChildren !== nextChildren) {
            // Add new children
            nextChildrenArray.forEach((child) => {
                const existingIndex = allChildren.findIndex(c => c.key === child.key);
                if (existingIndex === -1) {
                    allChildren.push(child);
                }
            });
        }

        this.setState({
            children: newChildren,
            transitioningChildren: newTransitioningChildren,
            allChildren,
        });
    }

    componentDidUpdate({ children: prevChildren }) {
        const { children } = this.props;
        const currentChildrenKey = Transitionable.getChildrenAsArray(children)
            .map(it => it.key)
            .join('|');
        const prevChildrenKey = Transitionable.getChildrenAsArray(prevChildren)
            .map(it => it.key)
            .join('|');
        if (currentChildrenKey !== prevChildrenKey) {
            this.transitionChildren();
        }
    }

    onTransitionComplete(transitionable, direction) {
        const { onTransitionComplete } = this.props;
        if (onTransitionComplete !== null) {
            onTransitionComplete(transitionable, direction);
        }
    }

    onTransitionInComplete(transitionable) {
        const { onTransitionInComplete } = this.props;
        if (onTransitionInComplete !== null) {
            onTransitionInComplete(transitionable);
        }
    }

    onTransitionOutComplete(transitionable) {
        const { onTransitionOutComplete } = this.props;
        if (onTransitionOutComplete !== null) {
            onTransitionOutComplete(transitionable);
        }
    }

    onTransitionOtherComplete(transitionable) {
        const { onTransitionOtherComplete } = this.props;
        if (onTransitionOtherComplete !== null) {
            onTransitionOtherComplete(transitionable);
        }
    }

    onAllTransitionComplete(keys) {
        const { onTransitionsComplete, children } = this.props;
        const { transitioningChildren: currentTransitioningChildren } = this.state;
        debug('All transitionings completed', keys);

        const newTransitioningChildren = currentTransitioningChildren.filter(
            child => keys.indexOf(child.key) === -1,
        );

        const newChildren = Transitionable.getChildrenAsArray(children);
        const allChildren = union(newChildren, newTransitioningChildren);
        const newAllChildren = uniq(allChildren, child => child.key);

        this.setState(
            {
                allChildren: newAllChildren,
                children: newChildren,
                transitioningChildren: newTransitioningChildren,
            },
            () => {
                const {
                    transitioningChildren,
                    transitioningIn,
                    transitioningOut,
                    transitioningOther,
                } = this.state;
                debug('Transitioning children', transitioningChildren);
                debug('Transitioning in', transitioningIn);
                debug('Transitioning out', transitioningOut);
                debug('Transitioning other', transitioningOther);
                if (onTransitionsComplete !== null) {
                    onTransitionsComplete();
                }
            },
        );
    }

    transitionChildren(opts) {
        const { children, onTransitionsStart } = this.props;
        const {
            allChildren,
            transitioningChildren,
            transitioningOut,
            children: currentChildren,
        } = this.state;
        const options = {
            mounting: false,
            allChildrenKeys: allChildren.map(it => it.key),
            ...opts,
        };

        const newChildren = Transitionable.getChildrenAsArray(children);
        const allCurrentChildren = uniq(
            union(currentChildren, transitioningChildren),
            child => child.key,
        );
        const allCurrentKeys = allCurrentChildren.map(it => it.key);
        const currentKeys = currentChildren.map(it => it.key);
        const nextKeys = newChildren.map(it => it.key);
        const keysToRemove = difference(allCurrentKeys, nextKeys);
        const keysToAdd = difference(nextKeys, difference(currentKeys, transitioningOut));
        const keysOthers = difference(allCurrentKeys, keysToRemove, keysToAdd);

        const transitions = [];

        debug('Current keys', currentKeys);
        debug('Next keys', nextKeys);
        debug('Children to remove', keysToRemove);
        debug('Children to add', keysToAdd);
        debug('Children others', keysOthers);
        debug('---');

        if (keysToRemove.length) {
            keysToRemove.forEach((key) => {
                transitions.push({
                    direction: 'out',
                    key,
                });
            });
        }
        if (keysToAdd.length) {
            keysToAdd.forEach((key) => {
                transitions.push({
                    direction: 'in',
                    key,
                });
            });
        }
        if (keysOthers.length) {
            keysOthers.forEach((key) => {
                transitions.push({
                    direction: 'other',
                    key,
                });
            });
        }

        // Merge new transitioning and old transitioning
        const newTransitioningChildren = allChildren.filter(
            child => keysToAdd.indexOf(child.key) !== -1 || keysToRemove.indexOf(child.key) !== -1,
        );
        const allTransitioningChildren = union(transitioningChildren, newTransitioningChildren);

        this.setState(
            {
                transitioningChildren: uniq(allTransitioningChildren, child => child.key),
            },
            () => {
                this.callTransitions(transitions, options);

                if (!options.mounting && onTransitionsStart !== null) {
                    onTransitionsStart();
                }
            },
        );
    }

    callTransitions(transitions, opts) {
        const {
            transitioningIn: currentTransitioningIn,
            transitioningOut: currentTransitioningOut,
            transitioningOther: currentTransitioningOther,
        } = this.state;
        const keys = transitions.map(it => it.key);
        const inKeys = transitions.filter(it => it.direction === 'in').map(it => it.key);
        const outKeys = transitions.filter(it => it.direction === 'out').map(it => it.key);
        const otherKeys = transitions.filter(it => it.direction === 'other').map(it => it.key);
        const transitioningIn = difference(
            union(currentTransitioningIn, inKeys),
            outKeys,
            otherKeys,
        );
        const transitioningOut = difference(
            union(currentTransitioningOut, outKeys),
            inKeys,
            otherKeys,
        );
        const transitioningOther = difference(
            union(currentTransitioningOther, otherKeys),
            inKeys,
            outKeys,
        );

        const remainingTransitions = transitions.filter((transition) => {
            if (transition.direction === 'in') {
                return currentTransitioningIn.indexOf(transition.key) === -1;
            }
            if (transition.direction === 'out') {
                return currentTransitioningOut.indexOf(transition.key) === -1;
            }
            if (transition.direction === 'other') {
                return currentTransitioningOther.indexOf(transition.key) === -1;
            }
            return false;
        });

        // Remove others from transitioning keys or not
        const remainingTransitionsKeys = difference(
            remainingTransitions.map(it => it.key),
            transitioningOther,
        );
        // var remainingTransitionsKeys = remainingTransitions.map(it => it.key);

        debug('Should transitions', keys);
        debug('Will transitions', remainingTransitions.map(it => it.key));
        debug('Transitioning in', transitioningIn);
        debug('Transitioning out', transitioningOut);
        debug('Transitioning other', transitioningOther);

        this.setState(
            {
                transitioningIn,
                transitioningOut,
                transitioningOther,
            },
            () => {
                let transitionDone = 0;
                const transitionCount = remainingTransitions.length;
                remainingTransitions.forEach((transition) => {
                    this.callTransition(transition.direction, transition.key, opts, () => {
                        const {
                            transitioningIn: newTransitioningIn,
                            transitioningOut: newTransitioningOut,
                            transitioningOther: newTransitioningOther,
                        } = this.state;
                        transitionDone += 1;
                        if (transitionCount === transitionDone) {
                            this.setState(
                                {
                                    transitioningIn: difference(newTransitioningIn, inKeys),
                                    transitioningOut: difference(newTransitioningOut, outKeys),
                                    transitioningOther: difference(
                                        newTransitioningOther,
                                        otherKeys,
                                    ),
                                },
                                () => {
                                    this.onAllTransitionComplete(remainingTransitionsKeys);
                                },
                            );
                        }
                    });
                });
            },
        );
    }

    callTransition(direction, key, opts, done) {
        const { allChildren } = this.state;
        const el = this.refViews[key];
        const directionName = direction.substr(0, 1).toUpperCase() + direction.substr(1);
        const child = allChildren.find(c => c.key === key);
        const transitionable = {
            el,
            key,
            props: child ? child.props : {},
        };

        const onTransitionDone = () => {
            this.onTransitionComplete(transitionable, direction);
            this[`onTransition${directionName}Complete`](transitionable, child);
            setTimeout(done.bind(this), 0);
        };

        // eslint-disable-next-line react/destructuring-assignment
        const transitionReturn = this.props[`transition${directionName}`].call(
            this,
            transitionable,
            opts,
            onTransitionDone,
        );
        if (transitionReturn && isFunction(transitionReturn.then)) {
            transitionReturn.then(onTransitionDone);
        }
    }

    renderChildren(child) {
        const { childClassName, childStyle } = this.props;
        const { transitioningIn, transitioningOut, transitioningOther } = this.state;

        const isTransitioningIn = transitioningIn.indexOf(child.key) !== -1;
        const isTransitioningOut = transitioningOut.indexOf(child.key) !== -1;
        const isTransitioningOther = transitioningOther.indexOf(child.key) !== -1;

        return (
            <div
                className={classNames([
                    'transitionable-view',
                    {
                        [childClassName]: childClassName !== null,
                        transitioning:
                            isTransitioningIn || isTransitioningOut || isTransitioningOther,
                        'transitioning-in': isTransitioningIn,
                        'transitioning-out': isTransitioningOut,
                        'transitioning-other': isTransitioningOther,
                    },
                ])}
                key={`t-${child.key}`}
                ref={(ref) => {
                    this.refViews[child.key] = ref;
                }}
                style={childStyle}
            >
                {child}
            </div>
        );
    }

    render() {
        const { className, style, forwardRef } = this.props;
        const { allChildren } = this.state;
        const wrappedChildren = allChildren.map(this.renderChildren);

        return (
            <div
                className={classNames([
                    'transitionable-views',
                    {
                        [className]: className !== null,
                    },
                ])}
                style={style}
                ref={forwardRef}
            >
                {wrappedChildren}
            </div>
        );
    }
}

Transitionable.propTypes = propTypes;
Transitionable.defaultProps = defaultProps;

export default Transitionable;
