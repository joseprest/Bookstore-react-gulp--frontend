import React, { Component } from 'react';
import PropTypes from 'prop-types';
// import createDebug from 'debug';
import { TimelineMax } from 'gsap/TweenMax';

import Loading from './Loading';
import AuthCode from './AuthCode';
import Transitionable from '../helpers/Transitionable';
import * as AppPropTypes from '../../lib/PropTypes';

// const debug = createDebug('manivelle:setup');

const propTypes = {
    loadingMessage: PropTypes.string,
    loadingPercent: PropTypes.number,
    screen: AppPropTypes.screen,
    onCompleted: PropTypes.func,
};

const defaultProps = {
    loadingMessage: '',
    loadingPercent: 0,
    screen: null,
    onCompleted: null,
};

class Setup extends Component {
    constructor(props) {
        super(props);

        this.onFadeOutComplete = this.onFadeOutComplete.bind(this);
        this.onFadeInComplete = this.onFadeInComplete.bind(this);
        this.onLoadingCompleted = this.onLoadingCompleted.bind(this);

        this.timeline = null;
        this.refView = null;
    }

    componentDidMount() {
        this.fade();
    }

    componentWillUnmount() {
        if (this.timeline) {
            this.timeline.kill();
            this.timeline = null;
        }
    }

    // eslint-disable-next-line
    onFadeInComplete() {}

    onFadeOutComplete() {
        const { onCompleted } = this.props;
        if (onCompleted !== null) {
            onCompleted();
        }
    }

    onLoadingCompleted() {
        this.fade(true);
    }

    fade(fadeOut = false) {
        if (this.timeline) {
            this.timeline.kill();
        }
        this.timeline = new TimelineMax({
            onComplete: fadeOut ? this.onFadeOutComplete : this.onFadeInComplete,
        });

        this.timeline.to(this.refView, 0.4, {
            alpha: !fadeOut ? 1 : 0,
        });
    }

    render() {
        const { screen } = this.props;
        const { linked = false, auth_code: code = null } = screen || {};

        let viewComponent;
        if (screen !== null && !linked) {
            viewComponent = <AuthCode key="auth" code={code} />;
        } else {
            const { loadingPercent } = this.props;
            const { loadingMessage } = this.props;
            viewComponent = (
                <Loading
                    key="loading"
                    percent={loadingPercent}
                    message={loadingMessage}
                    onCompleted={this.onLoadingCompleted}
                />
            );
        }

        return (
            <div className="setup">
                <div ref={(ref) => { this.refView = ref; }} className="setup-view">
                    <Transitionable>{viewComponent}</Transitionable>
                </div>
            </div>
        );
    }
}

Setup.propTypes = propTypes;
Setup.defaultProps = defaultProps;

export default Setup;
