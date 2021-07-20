import React from 'react';
import PropTypes from 'prop-types';
import ReactDOM from 'react-dom';
import _ from 'lodash';
import $ from 'jquery';
import slug from 'slug';
import { TweenMax } from 'gsap/TweenMax';
import { connect } from 'react-redux';

import Utils from '../../lib/utils';
import Text from '../../lib/text';

// import ModalsActions from '../../actions/ModalsActions';
import NavigationActions from '../../actions/NavigationActions';

import Popover from './Popover';

const ModalSendBubble = React.createClass({
    contextTypes: {
        api: PropTypes.object,
        browser: PropTypes.object,
        channel: PropTypes.object,
        screen: PropTypes.object,
        data: PropTypes.object,
    },

    propTypes: {
        bubbleID: PropTypes.string.isRequired,
        animationDuration: PropTypes.number,
    },

    getDefaultProps() {
        return {
            animationDuration: 0.2,
        };
    },

    getInitialState() {
        return {
            type: null, // 'sms' || 'email'
            value: '',
            from: '',
            message: this.getDefaultMessage(),
            loading: false,
            completed: false,
        };
    },

    render() {
        const props = _.omit(this.props, ['onClose', 'onOpen']);

        const topContent = this.renderTopContent();
        const bottomContent = this.renderBottomContent();

        return (
            <Popover placement="top" className="modal-send-bubble" {...props}>
                {topContent}
                {bottomContent}
            </Popover>
        );
    },

    renderTopContent() {
        const { type } = this.state;
        let element;

        if (type) {
            if (this.state.loading) {
                element = this.renderLoading();
            } else if (this.state.completed) {
                element = this.renderSuccess();
            } else {
                element = this.renderForm();
            }
        } else {
            element = this.renderHome();
        }

        return (
            <div ref="topContainer" className="top-container">
                <div ref="topContent" className="top-content">
                    {element}
                </div>
            </div>
        );
    },

    renderHome() {
        const smsButton = this.renderHomeButton('sms', {
            label: Text.t('btn_send_bubble_by_sms'),
            clickCallback: this.onSmsBtnClick,
        });

        const emailButton = this.renderHomeButton('email', {
            label: Text.t('btn_send_bubble_by_email'),
            clickCallback: this.onEmailBtnClick,
        });

        return (
            <div className="top-content-home">
                {smsButton}
                {emailButton}
            </div>
        );
    },

    renderHomeButton(type, opts) {
        opts = _.extend(
            {
                clickCallback: null,
                label: 'label',
            },
            opts,
        );
        const className = `btn btn-send btn-send-${type}`;

        return (
            <button className={className} {...Utils.onClick(opts.clickCallback)}>
                <span className="btn-inner">
                    <span className="icon" />
                    <span className="label">{opts.label}</span>
                </span>
            </button>
        );
    },

    renderForm() {
        const { type } = this.state;
        const emailHasMessage = type === 'email' && this.hasMessage();
        const fields = emailHasMessage ? ['from', type, 'message'] : [type];
        const formElements = fields.map(this.renderFormField);
        const className = `top-content-${type}${emailHasMessage ? ' has-message' : ''}`;
        return (
            <form className={className} onSubmit={this.onFormSubmit}>
                {formElements}
            </form>
        );
    },

    renderFormField(fieldType, index) {
        const onInputClick = e => this.onInputClick(e, fieldType);

        const { type } = this.state;
        const hasMessage = this.hasMessage();
        const value = fieldType === type ? this.state.value : this.state[fieldType];
        let valueFormatted = value;
        const textKey = type === 'sms' || (type === 'email' && !hasMessage)
            ? `send_by_${fieldType}`
            : `send_email_${fieldType}`;

        if (fieldType === 'sms') {
            const formattedNumber = Utils.formatPhoneNumber(valueFormatted, Text.t('phone_format'));
            valueFormatted = Utils.anonymizePhoneNumber(formattedNumber);
        }

        const fieldProps = _.extend(
            {
                className: 'input-text',
                placeholder: Text.t(`${textKey}_placeholder`),
                value: valueFormatted,
            },
            Utils.onClick(onInputClick),
        );
        let fieldElement;
        if (fieldType === 'message') {
            fieldElement = <textarea {...fieldProps} readOnly />;
        } else {
            fieldElement = <input type="text" {...fieldProps} readOnly />;
        }

        return (
            <div key={`form-element-${index}`} className="form-field">
                <label
                    htmlFor={fieldType}
                    dangerouslySetInnerHTML={{ __html: Text.t(`${textKey}_label`) }}
                />
                <input type="hidden" name={fieldType} value={value} />
                {fieldElement}
            </div>
        );
    },

    renderLoading() {
        return <div className="top-content-loading">{Text.t('send_loading')}</div>;
    },

    renderSuccess() {
        const { type } = this.state;
        const className = `top-content-success top-content-success-${type}`;

        return (
            <div className={className}>
                <div className="label">{Text.t(`send_by_${type}_success`)}</div>
                <div className="icon" />
            </div>
        );
    },

    renderBottomContent() {
        const currentType = this.state.type;
        let label;

        switch (currentType) {
        case 'sms':
        case 'email':
            label = Text.t(`send_by_${currentType}_submit`);
            break;
        default:
            label = Text.t('btn_cancel');
            break;
        }

        if (this.state.loading) {
            label = Text.t('btn_cancel');
        } else if (this.state.completed) {
            label = Text.t('btn_close');
        }

        return (
            <div className="bottom-button-container">
                <button
                    ref="bottomButton"
                    className="btn bottom-button"
                    {...Utils.onClick(this.onBottomButtonClick)}
                >
                    <span className="label-container">
                        <span className="label">{label}</span>
                    </span>
                </button>
            </div>
        );
    },

    /*
     * Render elements inside Keyboard modal
     */

    renderInput(value, type) {
        const currentType = this.state.type;
        const hasMessage = this.hasMessage();
        const textKey = currentType === 'sms' || (currentType === 'email' && !hasMessage)
            ? `send_by_${type}`
            : `send_email_${type}`;

        if (type === 'sms') {
            const formattedNumber = Utils.formatPhoneNumber(value, Text.t('phone_format'));
            value = Utils.anonymizePhoneNumber(formattedNumber);
        }
        const fieldProps = {
            className: 'input-text',
            disabled: 'disabled',
            placeholder: Text.t(`${textKey}_placeholder`),
            value,
        };
        if (type === 'message') {
            return <textarea {...fieldProps} />;
        }
        return <input type="text" {...fieldProps} readOnly />;
    },

    renderKeyboardInput(value, type) {
        const currentType = this.state.type;
        const input = this.renderInput(value, type);
        const label = Text.t(`send_by_${currentType}_submit`);
        return (
            <div>
                {input}
                <button type="button" className="btn" onClick={this.onKeyboardSendClick}>
                    {label}
                </button>
            </div>
        );
    },

    /*
     * Life cycle
     */
    componentDidUpdate(prevProps, prevState) {
        const typeChanged = prevState.type !== this.state.type;
        const fromHomeToEmail = prevState.type === null && this.state.type === 'email';
        const fromEmailToHome = prevState.type === 'email' && this.state.type === null;
        if (typeChanged && (fromHomeToEmail || fromEmailToHome) && this.hasMessage()) {
            this.resizeModalHeight();
        }
    },

    componentWillUnmount() {
        this.isCancelled = true;
        const topContent = ReactDOM.findDOMNode(this.refs.topContent);
        const bottomButton = ReactDOM.findDOMNode(this.refs.bottomButton);

        TweenMax.killTweensOf([topContent, bottomButton, this.crossfade]);
    },

    /*
     * Methods
     */

    openKeyboard(type) {
        const { openKeyboard } = this.props;
        const browserId = _.get(this.context.browser, 'id');

        const currentType = this.state.type;
        const value = currentType === type ? this.state.value : this.state[type];
        let layout;

        switch (type) {
        case 'sms':
            layout = 'phone';
            break;
        case 'email':
            layout = 'email';
            break;
        case 'from':
            layout = 'name';
            break;
        default:
            layout = 'normal';
            break;
        }

        openKeyboard(browserId, {
            layout,
            children: this.renderKeyboardInput(value, type),
            onChange: val => this.onKeyboardChange(val, type),
        });
    },

    closeKeyboard() {
        const { closeKeyboard } = this.props;
        const browserId = _.get(this.context.browser, 'id');
        closeKeyboard(browserId);
    },

    updateKeyboard(value, type) {
        const { updateKeyboard } = this.props;
        const browserId = _.get(this.context.browser, 'id');
        updateKeyboard(browserId, {
            children: this.renderKeyboardInput(value, type),
        });
    },

    submitForm() {
        const currentType = this.state.type;
        const { value } = this.state;

        if (!value.length) {
            return;
        }

        this.crossfade(
            {
                loading: true,
            },
            () => {
                this.preventShare = true;
                if (currentType === 'sms') {
                    this.context.api
                        .shareSms({
                            bubble_id: this.props.bubbleID,
                            phone: value,
                        })
                        .then(_.bind(this.onShareCompleted, this), _.bind(this.onShareError, this));
                } else if (currentType === 'email') {
                    const data = {
                        bubble_id: this.props.bubbleID,
                        email: value,
                    };
                    if (this.hasMessage()) {
                        data.from = this.state.from;
                        data.message = this.state.message;
                    }
                    this.context.api
                        .shareEmail(data)
                        .then(_.bind(this.onShareCompleted, this), _.bind(this.onShareError, this));
                }

                this.closeKeyboard();
            },
        );
    },

    keyboardSend() {
        const currentType = this.state.type;
        if (currentType === 'sms' || (currentType === 'email' && !this.hasMessage())) {
            this.submitForm();
        } else {
            this.closeKeyboard();
        }
    },

    resizeModalHeight() {
        const el = ReactDOM.findDOMNode(this);
        const modal = $(el).find('.modal-send-bubble')[0];
        const topContainerElement = ReactDOM.findDOMNode(this.refs.topContainer);
        const topContentElement = ReactDOM.findDOMNode(this.refs.topContent);

        const topContainerHeight = topContainerElement.offsetHeight;
        const topContentHeight = topContentElement.offsetHeight;
        const heightDifference = topContentHeight - topContainerHeight;
        const animationDuration = this.props.animationDuration / 1.5;

        TweenMax.to(modal, animationDuration, {
            top: `-=${heightDifference}`,
        });

        TweenMax.to(topContainerElement, animationDuration, {
            height: topContentHeight,
        });
    },

    typeCrossfade(type) {
        this.crossfade(
            {
                type,
            },
            () => {
                if (type === 'sms' || (type === 'email' && !this.hasMessage())) {
                    this.openKeyboard(type);
                }

                const bubble = this.context.data.findBubbleByID(this.props.bubbleID);
                if (bubble) {
                    this.context.browser.tracker.bubbleEvent(bubble, `Send bubble ${type}`);
                }
            },
        );
    },

    crossfade(stateProps, callback) {
        stateProps = _.extend({}, stateProps);

        const topContent = ReactDOM.findDOMNode(this.refs.topContent);
        const bottomButton = ReactDOM.findDOMNode(this.refs.bottomButton);
        const elements = [topContent, bottomButton];

        this.fadeOut(
            elements,
            () => {
                this.setState(stateProps, () => {
                    this.fadeIn(elements);
                    if (_.isFunction(callback)) {
                        callback();
                    }
                });
            },
        );
    },

    fadeOut(elements, callback) {
        const halfDuration = this.props.animationDuration / 2;

        TweenMax.to(elements, halfDuration, {
            alpha: 0,
            onComplete: callback,
        });
    },

    fadeIn(elements, callback) {
        const duration = this.props.animationDuration;
        const halfDuration = duration / 2;

        TweenMax.fromTo(
            elements,
            halfDuration,
            {
                alpha: 0,
            },
            {
                alpha: 1,
                delay: halfDuration,
                onComplete: callback,
            },
        );
    },

    /*
     * Helper methods
     */

    getDefaultMessage() {
        return _.get(this.context.channel, 'fields.settings.modalSendBubbleDefaultMessage', '');
    },

    hasMessage() {
        return _.get(this.context.channel, 'fields.settings.modalSendBubbleHasMessage', false);
    },

    /*
     * Event handlers
     */

    onSmsBtnClick(e) {
        this.typeCrossfade('sms');
    },

    onEmailBtnClick(e) {
        this.typeCrossfade('email');
    },

    onBottomButtonClick(e) {
        e.preventDefault();

        if (this.state.type && !this.state.loading && !this.state.completed) {
            this.submitForm();
        } else {
            this.props.closeModal();
        }
    },

    onInputClick(e, type) {
        this.openKeyboard(type);
    },

    onKeyboardChange(value, type) {
        const state = {};
        if (type === 'sms' || type === 'email') {
            state.value = value;
        } else {
            state[type] = value;
        }
        this.setState(state, function () {
            this.updateKeyboard(value, type);
        });
    },

    onKeyboardSendClick(e) {
        this.keyboardSend();
    },

    onFormSubmit(e) {
        e.preventDefault();

        this.submitForm();
    },

    onShareCompleted() {
        if (typeof this.isCancelled !== 'undefined' && this.isCancelled) {
            return;
        }

        const state = {
            loading: false,
            completed: true,
            value: '',
        };

        if (this.state.hasMessage) {
            state.from = '';
            state.message = this.state.defaultMessage;
        }

        TweenMax.delayedCall(this.props.animationDuration, this.crossfade, [state], this);

        const screenId = _.get(this.context, 'screen.id');
        const channelSlug = slug(_.get(this.context, 'channel.snippet.title', ''), {
            lower: true,
        });
        const bubbleId = this.props.bubbleID;
        this.context.browser.tracker.send(
            'social',
            this.state.type,
            'send',
            `http://${screenId}.ecrans.manivelle.io/${channelSlug}/${bubbleId}`,
        );
    },

    onShareError() {
        if (typeof this.isCancelled !== 'undefined' && this.isCancelled) {
            return;
        }

        const state = {
            loading: false,
        };

        TweenMax.delayedCall(this.props.animationDuration, this.crossfade, [state], this);
    },
});

const WithStateContainer = connect(
    null,
    dispatch => ({
        openKeyboard: (id, props) => dispatch(NavigationActions.openKeyboard(id, props)),
        updateKeyboard: (id, props) => dispatch(NavigationActions.updateKeyboard(id, props)),
        closeKeyboard: id => dispatch(NavigationActions.closeKeyboard(id)),
    }),
)(ModalSendBubble);
export default WithStateContainer;
