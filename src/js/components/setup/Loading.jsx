import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { TimelineMax } from 'gsap/TweenMax';

const propTypes = {
    percent: PropTypes.number,
    message: PropTypes.string,
    onProgressed: PropTypes.func,
    onCompleted: PropTypes.func,
};

const defaultProps = {
    percent: 0,
    message: null,
    onProgressed: null,
    onCompleted: null,
};

class Loading extends PureComponent {
    constructor(props) {
        super(props);

        this.onFillTransitionComplete = this.onFillTransitionComplete.bind(this);
        this.onMessageTransitionComplete = this.onMessageTransitionComplete.bind(this);

        this.fillTimeline = null;
        this.fillTween = null;
        this.messageTimeline = null;
        this.refFill = null;
        this.refMessage = null;

        this.state = {
            percent: props.percent,
            message: props.message,
        };
    }

    componentDidMount() {
        this.createTimeline();
        this.updateFill();
        this.updateMessage();
    }

    componentDidUpdate(prevProps, prevState) {
        const { percent, message } = this.props;
        const { message: stateMessage } = this.state;

        const percentChanged = prevProps.percent !== percent;

        const messagePropsChanged = prevProps.message !== message;
        const messageStateChanged = prevState.message !== stateMessage;

        if (percentChanged) {
            this.updateFill();
        }

        if (messagePropsChanged || messageStateChanged) {
            this.updateMessage({
                appear: messageStateChanged,
            });
        }
    }

    componentWillUnmount() {
        if (this.fillTimeline) {
            this.fillTimeline.kill();
            this.fillTimeline = null;
        }

        if (this.fillTween) {
            this.fillTween.kill();
            this.fillTween = null;
        }

        if (this.messageTimeline) {
            this.messageTimeline.kill();
            this.messageTimeline = null;
        }
    }

    onFillTransitionComplete() {
        const { percent, onProgressed, onCompleted } = this.props;
        this.setState(
            {
                percent,
            },
            () => {
                const { percent: currentPercent } = this.state;
                if (onProgressed) {
                    onProgressed(currentPercent);
                }

                if (currentPercent === 100 && onCompleted) {
                    onCompleted();
                }
            },
        );
    }

    onMessageTransitionComplete() {
        const { message } = this.props;
        const { message: currentMessage } = this.state;
        if (message !== currentMessage) {
            this.setState({
                message,
            });
        }
    }

    createTimeline() {
        this.fillTimeline = new TimelineMax({
            paused: true,
        });

        this.fillTimeline.to(this.refFill, 2, {
            height: '100%',
        });
    }

    updateFill() {
        const { percent } = this.props;
        const safePercent = Math.max(0, Math.min(percent, 100));
        this.fillTween = this.fillTimeline.tweenTo(
            (safePercent / 100) * this.fillTimeline.duration(),
            {
                onComplete: this.onFillTransitionComplete,
            },
        );
    }

    updateMessage(params = {}) {
        const { appear = true } = params;
        if (this.messageTimeline) {
            this.messageTimeline.kill();
        }
        this.messageTimeline = new TimelineMax({
            onComplete: this.onMessageTransitionComplete,
        });

        this.messageTimeline.to(this.refMessage, 0.4, {
            alpha: appear ? 1 : 0,
        });
    }

    render() {
        const { message } = this.state;

        const messageStyle = {
            opacity: 0,
        };

        return (
            <div className="manivelle-loading">
                <div className="image-loading">
                    <div className="hole">
                        <div
                            className="fill"
                            ref={(ref) => {
                                this.refFill = ref;
                            }}
                        />
                        <div className="smile" />
                    </div>
                    <div className="handle" />
                </div>
                <div
                    className="message"
                    style={messageStyle}
                    ref={(ref) => {
                        this.refMessage = ref;
                    }}
                >
                    {message}
                </div>
            </div>
        );
    }
}

Loading.propTypes = propTypes;
Loading.defaultProps = defaultProps;

export default Loading;
