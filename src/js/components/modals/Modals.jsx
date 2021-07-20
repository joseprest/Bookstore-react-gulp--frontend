import React from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import $ from 'jquery';
import { TimelineMax } from 'gsap/TweenMax';

import ModalsActions from '../../actions/ModalsActions';
import Transitionable from '../helpers/Transitionable';
// import Transitionable from 'react-transitionable';
import * as ModalsComponents from './index';
import Utils from '../../lib/utils';

const Modals = React.createClass({
    propTypes: {
        modals: PropTypes.array,
        transitionIn: PropTypes.func,
        transitionOut: PropTypes.func,
        animationDuration: PropTypes.number,

        onModalOpen: PropTypes.func,
        onModalClose: PropTypes.func,
        onModalOpened: PropTypes.func,
        onModalClosed: PropTypes.func,
    },

    contextTypes: {
        store: PropTypes.object,
    },

    getDefaultProps() {
        return {
            modals: [],
            transitionIn: null,
            transitionOut: null,
            animationDuration: 0.4,
        };
    },

    getInitialState() {
        return {
            active: this.props.modals && this.props.modals.length,
        };
    },

    render() {
        const modals = this.renderModals();

        const props = {
            onTransitionInComplete: this.onTransitionInComplete,
            onTransitionOutComplete: this.onTransitionOutComplete,
        };
        if (this.props.transitionIn) {
            props.transitionIn = this.props.transitionIn;
        } else {
            props.transitionIn = this.onModalTransitionIn;
        }
        if (this.props.transitionOut) {
            props.transitionOut = this.props.transitionOut;
        } else {
            props.transitionOut = this.onModalTransitionOut;
        }

        let className = 'modals';

        if (this.state.active) {
            className += ' active';
        }

        return (
            <div className={className}>
                <Transitionable {...props}>{modals}</Transitionable>
            </div>
        );
    },

    renderModals() {
        if (this.props.modals) {
            return this.props.modals.map(_.bind(this.renderModal, this));
        }
    },

    renderModal(modal, index) {
        const type = _.get(modal, 'type', 'Modal');
        const props = _.get(modal, 'props', {});

        const Modal = Utils.getComponentFromType(ModalsComponents, type);

        const closeModal = _.bind(function() {
            this.context.store.dispatch(ModalsActions.close(modal.id));
        }, this);

        return (
            <Modal
                key={`m${modal.id}`}
                id={modal.id}
                group={modal.group}
                type={modal.type}
                closeModal={closeModal}
                {...props}
            />
        );
    },

    getModalFromTransitionable(transitionable) {
        return {
            id: _.get(transitionable, 'props.id'),
            group: _.get(transitionable, 'props.group'),
            type: _.get(transitionable, 'props.type'),
            props: _.omit(_.get(transitionable, 'props', {}), ['id', 'type', 'group']),
        };
    },

    componentWillReceiveProps(nextProps) {
        if (nextProps.modals && nextProps.modals.length && !this.state.active) {
            this.setState({
                active: true,
            });
        }
    },

    onModalTransitionIn(transitionable, opts, done) {
        const $el = $(transitionable.el);
        const popover = $el.find('.popover');
        const popoverSafe = $el.find('.popover-safe');

        const timeline = new TimelineMax({
            onComplete: done,
        });

        timeline.from(
            popoverSafe,
            this.props.animationDuration,
            {
                alpha: 0,
            },
            0,
        );

        timeline.from(
            popover,
            this.props.animationDuration,
            {
                scale: 0,
                alpha: 0,
            },
            0,
        );

        const modal = this.getModalFromTransitionable(transitionable);

        const onOpen = _.get(transitionable, 'props.onOpen');
        if (onOpen) {
            onOpen(modal);
        }

        if (this.props.onModalOpen) {
            this.props.onModalOpen(modal);
        }
    },

    onModalTransitionOut(transitionable, opts, done) {
        const $el = $(transitionable.el);
        const popover = $el.find('.popover');
        const popoverSafe = $el.find('.popover-safe');

        const timeline = new TimelineMax({
            onComplete: done,
        });

        timeline.to(
            popoverSafe,
            this.props.animationDuration,
            {
                alpha: 0,
            },
            0,
        );

        timeline.to(
            popover,
            this.props.animationDuration,
            {
                scale: 0,
                alpha: 0,
            },
            0,
        );

        const modal = this.getModalFromTransitionable(transitionable);

        const onClose = _.get(transitionable, 'props.onClose');
        if (onClose) {
            onClose(modal);
        }

        if (this.props.onModalClose) {
            this.props.onModalClose(modal);
        }
    },

    onTransitionInComplete(transitionable) {
        const modal = this.getModalFromTransitionable(transitionable);

        const onOpened = _.get(transitionable, 'props.onOpened');
        if (onOpened) {
            onOpened(modal);
        }

        if (this.props.onModalOpened) {
            this.props.onModalOpened(modal);
        }
    },

    onTransitionOutComplete(transitionable) {
        if (!this.props.modals || !this.props.modals.length) {
            this.setState({
                active: false,
            });
        }

        const modal = this.getModalFromTransitionable(transitionable);

        const onClosed = _.get(transitionable, 'props.onClosed');
        if (onClosed) {
            onClosed(modal);
        }

        if (this.props.onModalClosed) {
            this.props.onModalClosed(modal);
        }
    },
});

export default Modals;
