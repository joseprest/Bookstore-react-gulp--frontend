import React from 'react';
import PropTypes from 'prop-types';
import ReactDOM from 'react-dom';
import _ from 'lodash';

import Utils from '../../lib/utils';
import Modals from '../modals/Modals';
import Transitionable from '../helpers/Transitionable';
// import Transitionable from 'react-transitionable';
import Button from '../partials/Button';

import * as ChannelMainComponents from './main';

const ChannelMain = React.createClass({
    propTypes: {
        bubbles: PropTypes.array.isRequired,
        bubbleId: PropTypes.string,
        width: PropTypes.number.isRequired,
        height: PropTypes.number.isRequired,
        active: PropTypes.bool.isRequired,
        ready: PropTypes.bool.isRequired,
        backButtonLabel: PropTypes.string.isRequired,
        modals: PropTypes.array,
        refContainer: PropTypes.func,

        onBackButtonClick: PropTypes.func,
    },

    contextTypes: {
        channel: PropTypes.object,
        browser: PropTypes.object,
    },

    getDefaultProps() {
        return {
            refContainer: null,
            bubbleId: null,
        };
    },

    getInitialState() {
        return {
            topBarHeight: null,
        };
    },

    render() {
        const { refContainer } = this.props;
        const titleSpace = this.renderTitleSpace();
        let content;

        if (this.state.topBarHeight !== null) {
            content = this.renderContent();
        }

        return (
            <div className="channel-main" ref={refContainer}>
                {titleSpace}
                {content}
                <Modals modals={this.props.modals} />
            </div>
        );
    },

    renderTitleSpace() {
        const title = _.get(this.context.channel, 'snippet.title', 'Chaîne');
        const { backButtonLabel } = this.props;

        return (
            <div className="title-space" ref="topBar">
                <div className="channel-name-container">
                    <span className="channel-name">{title}</span>
                </div>
                <div className="btn-container">
                    <Button icon="left" onClick={this.onBackButtonClick}>
                        {backButtonLabel}
                    </Button>
                </div>
            </div>
        );
    },

    renderContent() {
        const style = {
            top: this.state.topBarHeight,
            height: this.props.height - this.state.topBarHeight,
        };

        const viewType = _.get(this.context.channel, 'fields.settings.channelView');
        const Component = Utils.getComponentFromType(ChannelMainComponents, viewType);
        const colorPalette = _.get(this.context.channel, 'fields.settings.colorPalette');
        const randomPosition = _.get(
            this.context.channel,
            'fields.settings.randomPositionCards',
            true,
        );
        const props = _.omit(this.props, ['height']);
        props.topBarHeight = this.state.topBarHeight;
        props.height = style.height;

        if (colorPalette) {
            props.colorPalette = colorPalette;
        }
        if (randomPosition !== null) {
            props.randomPosition = randomPosition;
        }

        return (
            <div className="channel-main-content" style={style}>
                <Component {...props} />
            </div>
        );
    },

    shouldComponentUpdate(nextProps) {
        const sizeChanged =
            this.props.width !== nextProps.width || this.props.height !== nextProps.height;

        return nextProps.active || sizeChanged;
    },

    componentDidMount() {
        this.updateTopBarHeight();

        this.context.browser.tracker.channelPageview(this.context.channel, '/');
    },

    componentDidUpdate(prevProps) {
        const sizeChanged =
            prevProps.width !== this.props.width || prevProps.height !== this.props.height;

        if (sizeChanged) {
            this.updateTopBarHeight();
        }
    },

    updateTopBarHeight() {
        const topBar = ReactDOM.findDOMNode(this.refs.topBar);

        this.setState({
            topBarHeight: topBar.offsetHeight,
        });
    },

    onBackButtonClick(e) {
        e.preventDefault();

        if (this.props.onBackButtonClick) {
            this.props.onBackButtonClick(e);
        }
    },
});

export default ChannelMain;
