import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import get from 'lodash/get';

import * as ContentComponents from './details';
import * as AppPropTypes from '../../../lib/PropTypes';
import Utils from '../../../lib/utils';
import CacheManager from '../../../lib/cache';
import ModalsActions from '../../../actions/ModalsActions';

const Cache = CacheManager.create('sizes.bubble-details');

const propTypes = {
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
    bubble: AppPropTypes.bubble.isRequired,
    buttons: PropTypes.arrayOf(
        PropTypes.shape({
            type: PropTypes.string,
            label: PropTypes.string,
        }),
    ),
    openModal: PropTypes.func.isRequired,
    refContainer: PropTypes.func,

    onPrevious: PropTypes.func,
    onNext: PropTypes.func,
};

const defaultProps = {
    buttons: [
        {
            type: 'send-bubble',
            label: 'btn_send_bubble',
        },
        {
            type: 'send-bubble-email',
            label: 'btn_send_bubble_email',
        },
        {
            type: 'show-on-map',
            label: 'btn_show_on_map',
        },
        {
            type: 'previous',
            label: 'btn_previous',
        },
        {
            type: 'next',
            iconPosition: 'right',
            label: 'btn_next',
        },
    ],
    refContainer: null,

    onPrevious: null,
    onNext: null,
};

const contextTypes = {
    data: AppPropTypes.dataRepository,
    browser: AppPropTypes.browser,
};

class BubbleDetails extends Component {
    constructor(props) {
        super(props);

        this.onButtonClick = this.onButtonClick.bind(this);

        this.refBasicInfos = null;
        this.refContainer = null;

        const cacheKey = `${props.bubble.id}_${props.width}_${props.height}`;
        const size = Cache.get(cacheKey, {
            contentHeight: null,
        });
        this.state = {
            cacheKey,
            ...size,
        };
    }

    componentDidMount() {
        const { cacheKey } = this.state;
        if (!Cache.has(cacheKey)) {
            this.updateSize(cacheKey);
        }
    }

    componentWillReceiveProps({ width, height, bubble }) {
        const newCacheKey = `${bubble.id}_${width}_${height}`;
        const { cacheKey } = this.state;
        if (cacheKey !== newCacheKey) {
            this.setState({
                cacheKey: newCacheKey,
            });
        }
    }

    componentDidUpdate(prevProps, { cacheKey: prevCacheKey }) {
        const { cacheKey } = this.state;
        if (prevCacheKey !== cacheKey) {
            Cache.clear(prevCacheKey);
            if (!Cache.has(cacheKey)) {
                this.updateSize(cacheKey);
            }
        }
    }

    onButtonClick(e, button) {
        e.preventDefault();
        const {
            openModal, onPrevious, onNext, bubble,
        } = this.props;
        const {
            browser: { id: browserId, tracker },
        } = this.context;

        switch (button.type) {
        case 'send-bubble':
        case 'send-bubble-email':
            openModal('SendBubble', {
                element: e.currentTarget,
                group: `${browserId}:channelBubbles`,
                bubbleID: bubble.id,
                offsetY: 30,
            });

            tracker.bubbleEvent(bubble, 'Send bubble');
            break;

        case 'previous':
            if (onPrevious) {
                onPrevious();
            }
            break;

        case 'next':
            if (onNext) {
                onNext();
            }
            break;
        default:
            break;
        }
    }

    getContentHeight() {
        const { height } = this.props;
        return height - this.refBasicInfos.offsetHeight;
    }

    updateSize(cachekey) {
        const size = {
            contentHeight: this.getContentHeight(),
        };
        Cache.set(cachekey, size);
        this.setState({
            ...size,
        });
    }

    renderContent(ContentComponent) {
        const { width } = this.props;
        const { contentHeight } = this.state;
        if (contentHeight === null) {
            return null;
        }

        const style = {
            width,
            height: contentHeight,
        };

        const containerClassName = 'bubble-content-container';

        return (
            <div className={containerClassName} style={style}>
                <div className="bubble-content">
                    <div className="bubble-content-inner">
                        <ContentComponent {...this.props} onButtonClick={this.onButtonClick} />
                        <div className="details-gradient gradient-top" />
                        <div className="details-gradient gradient-bottom" />
                    </div>
                </div>
            </div>
        );
    }

    render() {
        const {
            width,
            height,
            bubble: {
                channel_id: bubbleChannelId = null,
                type_name: typeNameLabel = '',
                snippet: { title: titleLabel = '' } = {},
            },
            refContainer,
        } = this.props;
        const { data: dataRepository } = this.context;
        const style = {
            width,
            height,
        };

        let typeName;
        let title;

        const channel = dataRepository.findChannelByID(bubbleChannelId);

        const showTypeName = get(channel, 'fields.settings.bubbleDetailsShowTypeName');
        const showTitle = get(channel, 'fields.settings.bubbleDetailsShowTitle');

        const contentComponentType = get(channel, 'fields.settings.bubbleDetailsContentView', null);
        const ContentComponent = Utils.getComponentFromType(
            ContentComponents,
            contentComponentType || 'columns',
        );

        if (showTypeName && typeNameLabel !== null && typeNameLabel.length > 0) {
            typeName = (
                <div className="bubble-type-name-container">
                    <div className="bubble-type-name">{typeNameLabel}</div>
                </div>
            );
        }

        if (showTitle && titleLabel !== null && titleLabel.length > 0) {
            title = (
                <div className="bubble-title-container">
                    <div className="bubble-title">{titleLabel}</div>
                </div>
            );
        }

        const content = this.renderContent(ContentComponent);

        return (
            <div
                className="bubble-details"
                style={style}
                ref={(ref) => {
                    this.refContainer = ref;
                    if (refContainer !== null) {
                        refContainer(ref);
                    }
                }}
            >
                <div
                    ref={(ref) => {
                        this.refBasicInfos = ref;
                    }}
                    className="bubble-basic-infos"
                >
                    {typeName}
                    {title}
                </div>
                {content}
            </div>
        );
    }
}

BubbleDetails.propTypes = propTypes;
BubbleDetails.defaultProps = defaultProps;
BubbleDetails.contextTypes = contextTypes;

const WithStateContainer = connect(
    null,
    dispatch => ({
        openModal: (name, props) => dispatch(ModalsActions.open(name, props)),
    }),
)(BubbleDetails);
export default WithStateContainer;
