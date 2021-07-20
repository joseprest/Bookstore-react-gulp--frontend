/* eslint-disable react/jsx-props-no-spreading */
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import get from 'lodash/get';
import { connect } from 'react-redux';

import Map from '../../map/Map';
import ModalsActions from '../../../actions/ModalsActions';
import NavigationActions from '../../../actions/NavigationActions';

const propTypes = {
    filteredBubbles: PropTypes.array.isRequired, // eslint-disable-line react/forbid-prop-types
    topSpaceHeight: PropTypes.number.isRequired,
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
    active: PropTypes.bool.isRequired,
    ready: PropTypes.bool.isRequired,

    modalMargin: PropTypes.number,
    selectedMarkerMarginTop: PropTypes.number,
    updateBrowser: PropTypes.func.isRequired,
    openModal: PropTypes.func.isRequired,
};

const defaultProps = {
    modalMargin: 100,
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

class TabMap extends Component {
    static getMarkersFromFilteredBubbles(filteredBubbles) {
        return filteredBubbles
            .map(group => ({
                key: group.value,
                position: group.position,
                city: group.city,
                region: group.region,
                label: group.label,
                count: group.bubbles.length,
                bubbles: group.bubbles,
            }))
            .filter(marker => marker.count > 0);
    }

    constructor(props) {
        super(props);

        this.onMarkerSelected = this.onMarkerSelected.bind(this);
        this.onModalItemClick = this.onModalItemClick.bind(this);
        this.onModalClose = this.onModalClose.bind(this);
        this.refMapContainer = null;
        this.refMap = null;

        this.state = {
            active: props.active && props.ready,
            markers: TabMap.getMarkersFromFilteredBubbles(props.filteredBubbles),
        };
    }

    componentWillReceiveProps({
        filteredBubbles: nextFilteredBubbles,
        active: nextActive,
        ready: nextReady,
    }) {
        const { filteredBubbles } = this.props;
        const { active } = this.state;
        if (nextFilteredBubbles !== filteredBubbles) {
            this.setState({
                markers: TabMap.getMarkersFromFilteredBubbles(nextFilteredBubbles),
            });
        }
        if (nextActive && nextReady && !active) {
            this.setState({
                active: nextActive,
            });
        }
    }

    onMarkerSelected(e, marker) {
        const { width, height, modalMargin, topSpaceHeight, openModal } = this.props;
        const {
            channel,
            data: dataRepository,
            browser: { id: browserId },
        } = this.context;
        const markerElement = marker.div;
        const mapContainer = this.refMapContainer;

        const markerPoint = () => {
            const {
                width: currentWidth,
                topSpaceHeight: currentTopSpaceHeight,
                selectedMarkerMarginTop: currentSelectedMarkerMarginTop,
            } = this.props;
            return {
                x: currentWidth / 2,
                y:
                    currentTopSpaceHeight +
                    mapContainer.offsetTop +
                    currentSelectedMarkerMarginTop +
                    markerElement.offsetHeight,
            };
        };

        const modalWidth = width - modalMargin * 2;
        const modalHeight = height + topSpaceHeight - markerPoint().y - modalMargin;

        let bubbles = get(marker, 'data.bubbles', []);

        // TMP
        if (get(channel, 'fields.settings.modalBubblesListView') === 'calendar') {
            const markerKey = get(marker, 'data.key');
            const channelId = get(channel, 'id');
            const filteredDateBubbles = dataRepository.getChannelFilter(channelId, 'date');
            bubbles = filteredDateBubbles.reduce((newBubbles, group) => {
                const groupBubbles = group.bubbles.filter(groupBubble => {
                    return get(groupBubble, 'filters.venue') === markerKey;
                });
                if (groupBubbles.length > 0) {
                    const groupCopy = {
                        ...group,
                        bubbles: groupBubbles,
                    };
                    return [...newBubbles, groupCopy];
                }
                return newBubbles;
            }, []);
        }

        console.log(bubbles);

        if (bubbles.length > 0 && bubbles[0].type === 'location') {
            openModal('Location', {
                group: `${browserId}:channelMain`,
                bubbles,
                closeOtherModals: true,
                width,
                height,
                top: mapContainer.offsetTop + topSpaceHeight,
                onClose: this.onModalClose,
            });
            return;
        }

        openModal('BubblesList', {
            group: `${browserId}:channelMain`,
            btnClose: true,
            point: markerPoint,
            bubbles,
            placement: 'bottom',
            width: modalWidth,
            height: modalHeight,
            onItemClick: this.onModalItemClick,
        });
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

    render() {
        const { filteredBubbles, topSpaceHeight, modalMargin, ...props } = this.props;
        const { markers, active } = this.state;

        return (
            <div className="tab tab-map">
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
                            {...props}
                        />
                    ) : null}
                </div>
            </div>
        );
    }
}

TabMap.propTypes = propTypes;
TabMap.contextTypes = contextTypes;
TabMap.defaultProps = defaultProps;

export default connect(
    null,
    dispatch => ({
        updateBrowser: (id, props) => dispatch(NavigationActions.updateBrowser(id, props)),
        openModal: (name, props) => dispatch(ModalsActions.open(name, props)),
    }),
)(TabMap);
