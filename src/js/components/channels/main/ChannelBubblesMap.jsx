/* eslint-disable react/jsx-props-no-spreading */
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import get from 'lodash/get';
import { connect } from 'react-redux';
import classNames from 'classnames';

import * as ManivellePropTypes from '../../../lib/PropTypes';
import Map from '../../map/Map';
import ModalsActions from '../../../actions/ModalsActions';
import NavigationActions from '../../../actions/NavigationActions';
import MarkerVaudreuil from '../../icons/MarkerVaudreuil';

const propTypes = {
    bubbles: ManivellePropTypes.bubbles.isRequired, // eslint-disable-line react/forbid-prop-types
    topSpaceHeight: PropTypes.number.isRequired,
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
    active: PropTypes.bool.isRequired,
    ready: PropTypes.bool.isRequired,
    selectedMarkerMarginTop: PropTypes.number,
    updateBrowser: PropTypes.func.isRequired,
    openModal: PropTypes.func.isRequired,
};

const defaultProps = {
    selectedMarkerMarginTop: 20,
};

/* eslint-disable react/forbid-prop-types */
const contextTypes = {
    browser: PropTypes.object,
    channel: PropTypes.object,
    data: PropTypes.object,
    store: PropTypes.object,
};
/* eslint-enable react/forbid-prop-types */

class ChannelBubblesMap extends Component {
    static getMarkersFromBubbles(bubbles) {
        return bubbles
            .map(bubble => ({
                key: bubble.id,
                ...get(bubble, 'fields.location', {}),
                label: bubble.snippet.title,
                count: 1,
                bubbles: [bubble],
            }))
            .filter(marker => marker.count > 0);
    }

    constructor(props) {
        super(props);

        this.onMarkerSelected = this.onMarkerSelected.bind(this);
        this.onModalItemClick = this.onModalItemClick.bind(this);
        this.onModalClose = this.onModalClose.bind(this);
        this.onClickClosePanel = this.onClickClosePanel.bind(this);
        this.refMapContainer = null;
        this.refMap = null;

        this.state = {
            active: props.active && props.ready,
            markers: ChannelBubblesMap.getMarkersFromBubbles(props.bubbles),
            markerSelected: null,
        };
    }

    componentWillReceiveProps({ bubbles: nextBubbles, active: nextActive, ready: nextReady }) {
        const { bubbles } = this.props;
        const { active } = this.state;
        if (nextBubbles !== bubbles) {
            this.setState({
                markers: ChannelBubblesMap.getMarkersFromBubbles(nextBubbles),
            });
        }
        if (nextActive && nextReady && !active) {
            this.setState({
                active: nextActive,
            });
        }
    }

    onMarkerSelected(e, marker) {
        this.setState({
            markerSelected: marker,
        });
        // const { width, height, topSpaceHeight, openModal } = this.props;
        // const {
        //     browser: { id: browserId },
        // } = this.context;
        // const mapContainer = this.refMapContainer;
        //
        // const bubbles = get(marker, 'data.bubbles', []);
        //
        // console.log(bubbles);
        //
        // openModal('Location', {
        //     group: `${browserId}:channelMain`,
        //     bubbles,
        //     closeOtherModals: true,
        //     width,
        //     height,
        //     top: mapContainer.offsetTop + topSpaceHeight,
        //     onClose: this.onModalClose,
        // });
    }

    onModalClose() {
        this.refMap.centerMap();
    }

    onModalItemClick(e, it) {
        const { updateBrowser } = this.props;
        const {
            browser: { id: browserId },
        } = this.context;
        updateBrowser(browserId, {
            view: 'channel:bubbles',
            bubbleId: it.id,
        });
    }

    onClickClosePanel() {
        this.setState({
            markerSelected: null,
        });
        this.refMap.centerMap();
    }

    renderPanel() {
        const { markerSelected } = this.state;
        const bubbles = markerSelected !== null ? get(markerSelected, 'data.bubbles', []) : [];
        return (
            <div
                className={classNames([
                    'channel-bubbles-map-panel',
                    {
                        visible: markerSelected !== null,
                    },
                ])}
            >
                <div className="channel-bubbles-map-panel-top">
                    <button
                        type="button"
                        onClick={this.onClickClosePanel}
                        className="channel-bubbles-map-panel-close"
                    >
                        X
                    </button>
                </div>
                <div className="channel-bubbles-map-panel-content">
                    {bubbles.map(bubble => {
                        const {
                            id,
                            snippet: {
                                picture = null,
                                title = null,
                                link = null,
                                description = null,
                            },
                            fields: {
                                location: { address = null } = {},
                                phone = null,
                                email = null,
                            },
                        } = bubble;
                        return (
                            <div className="channel-bubbles-map-panel-bubble" key={`bubble-${id}`}>
                                {picture !== null ? (
                                    <div className="channel-bubbles-map-panel-image-container">
                                        <img
                                            src={picture.link}
                                            className="channel-bubbles-map-panel-image"
                                            alt={title}
                                        />
                                    </div>
                                ) : null}

                                <div className="channel-bubbles-map-panel-icon-container">
                                    <MarkerVaudreuil className="channel-bubbles-map-panel-icon" />
                                </div>

                                {title !== null || link !== null ? (
                                    <div className="channel-bubbles-map-panel-title-container">
                                        {title !== null ? (
                                            <h4 className="channel-bubbles-map-panel-title">{title}</h4>
                                        ) : null}
                                        {link !== null ? (
                                            <div className="channel-bubbles-map-panel-link">{link}</div>
                                        ) : null}
                                    </div>
                                ) : null}

                                {address !== null || phone !== null || email !== null ? (
                                    <div className="channel-bubbles-map-panel-address-container">
                                        {address !== null ? <p>{address}</p> : null}
                                        {phone !== null ? <p>{phone.value}</p> : null}
                                        {email !== null ? <p>{email.value}</p> : null}
                                    </div>
                                ) : null}

                                {description !== null ? (
                                    <div className="channel-bubbles-map-panel-description-container">
                                        <p>{description}</p>
                                    </div>
                                ) : null}
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }

    render() {
        const { bubbles, topSpaceHeight, ...props } = this.props;
        const { markers, active } = this.state;
        const { channel } = this.context;
        const markerType = get(channel, 'fields.settings.channelMarkerType');
        return (
            <div className="channel-bubbles-map">
                {this.renderPanel()}
                <div
                    ref={ref => {
                        this.refMapContainer = ref;
                    }}
                    className="map-container"
                >
                    {active ? (
                        <Map
                            markers={markers}
                            onMarkerSelected={this.onMarkerSelected}
                            ref={ref => {
                                this.refMap = ref;
                            }}
                            markerType={markerType}
                            {...props}
                        />
                    ) : null}
                </div>
            </div>
        );
    }
}

ChannelBubblesMap.propTypes = propTypes;
ChannelBubblesMap.contextTypes = contextTypes;
ChannelBubblesMap.defaultProps = defaultProps;

export default connect(
    null,
    dispatch => ({
        updateBrowser: (id, props) => dispatch(NavigationActions.updateBrowser(id, props)),
        openModal: (name, props) => dispatch(ModalsActions.open(name, props)),
    }),
)(ChannelBubblesMap);
