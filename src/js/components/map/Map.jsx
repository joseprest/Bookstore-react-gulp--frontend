/* globals google: true, MarkerClusterer: true */
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import get from 'lodash/get';
import createDebug from 'debug';

import { loadGMap } from '../../lib/gmap';
import createMarker from '../../lib/gmap-marker';
import Utils from '../../lib/utils';

import '../../lib/gmap-marker-clusterer';

const debug = createDebug('manivelle:component:map');

const propTypes = {
    active: PropTypes.bool,
    ready: PropTypes.bool,
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,

    markerType: PropTypes.string,
    clusterIconType: PropTypes.string,

    markers: PropTypes.arrayOf(
        PropTypes.shape({
            key: PropTypes.string,
            position: PropTypes.shape({
                latitude: PropTypes.number,
                longitude: PropTypes.number,
            }),
            label: PropTypes.string,
        }),
    ),
    clustererEnabled: PropTypes.bool,
    clusterTypes: PropTypes.arrayOf(
        PropTypes.shape({
            minZoom: PropTypes.number,
            maxZoom: PropTypes.number,
            key: PropTypes.string,
        }),
    ),
    mergeCloseMarkers: PropTypes.bool,
    mergeMarkersDistance: PropTypes.number,
    boundsPadding: PropTypes.number,
    // selectedMarkerMarginTop: PropTypes.number,
    mapOptions: PropTypes.object, // eslint-disable-line react/forbid-prop-types

    onMarkerSelected: PropTypes.func,
};

const defaultProps = {
    active: true,
    ready: true,
    markers: [
        /* {
            key: '1',
            position: {
                latitude: 45.509247,
                longitude: -73.56816
            },
            city: 'Ville',
            region: 'Région',
            label: 'Label',
            count: 0,
            bubbles: []
        } */
    ],
    markerType: 'normal',
    clusterIconType: 'normal',
    clusterTypes: [
        {
            minZoom: 15,
            maxZoom: 21,
            key: 'label',
        },
        {
            minZoom: 8,
            maxZoom: 14,
            key: 'city',
        },
        {
            minZoom: 0,
            maxZoom: 7,
            key: 'region',
        },
    ],
    // selectedMarkerMarginTop: 0,
    clustererEnabled: false,
    mergeCloseMarkers: true,
    mergeMarkersDistance: 200,
    boundsPadding: 50,
    mapOptions: {
        center: {
            lat: 45.509247,
            lng: -73.56816,
        },
        zoom: 10,
        draggable: false,
        zoomControl: false,
        mapTypeControl: false,
        scaleControl: false,
        streetViewControl: false,
        rotateControl: false,
        disableDoubleClickZoom: true,
        scrollwheel: false,
        styles: [
            {
                stylers: [{ hue: '#ffcc00' }, { saturation: -80 }],
            },
            {
                featureType: 'poi',
                elementType: 'labels',
                stylers: [
                    {
                        visibility: 'off',
                    },
                ],
            },
            {
                featureType: 'transit.station',
                elementType: 'labels',
                stylers: [
                    {
                        visibility: 'off',
                    },
                ],
            },
        ],
    },
    onMarkerSelected: null,
};

class Map extends Component {
    constructor(props) {
        super(props);

        this.onMapReady = this.onMapReady.bind(this);
        this.onMarkerSelect = this.onMarkerSelect.bind(this);
        this.onMarkerSelected = this.onMarkerSelected.bind(this);

        this.refMap = null;
        this.map = null;
        this.Marker = null;
        this.clusterer = null;

        this.state = {
            rendered: false,
            mapMarkers: [],
        };
    }

    componentDidMount() {
        this.loadGMap();
    }

    componentDidUpdate({ width: prevWidth, height: prevHeight }) {
        const { active, ready, width, height } = this.props;
        const { rendered } = this.state;
        if (active && ready && !rendered) {
            this.renderMap();
        } else {
            const sizeChanged = prevWidth !== width || prevHeight !== height;

            if (sizeChanged) {
                this.renderMap();
            }
        }
    }

    componentWillUnmount() {
        this.destroyGMap();
    }

    // eslint-disable-next-line
    onMapReady(e) {
        this.map.fitBounds(this.getMarkersBounds());
    }

    onMarkerSelect(e, marker, index) {
        const { width, height } = this.props;
        const bounds = this.map.getBounds();
        const ne = bounds.getNorthEast();
        const sw = bounds.getSouthWest();

        const markerProjection = marker.getProjection();
        const mapPointNE = markerProjection.fromLatLngToDivPixel(ne);
        const mapPointSW = markerProjection.fromLatLngToDivPixel(sw);

        const diffX = marker.getPointPosition().x - mapPointSW.x - width * 0.75;
        const diffY =
            marker.getPointPosition().y - mapPointNE.y - marker.div.offsetHeight - height * 0.5;

        const onMarkerSelected = markerEvent => this.onMarkerSelected(markerEvent, marker, index);

        if (diffX || diffY) {
            google.maps.event.addListenerOnce(this.map, 'idle', onMarkerSelected);
            this.map.panBy(diffX, diffY);
        } else {
            onMarkerSelected();
        }
    }

    onMarkerSelected(e, marker, index) {
        const { onMarkerSelected } = this.props;
        if (onMarkerSelected !== null) {
            onMarkerSelected(e, marker, index);
        }
    }

    getMarkersBounds(mapMarkers = null) {
        const { mapMarkers: currentMapMarkers } = this.state;
        return (mapMarkers || currentMapMarkers).reduce((bounds, marker) => {
            bounds.extend(marker.getPosition());
            return bounds;
        }, new google.maps.LatLngBounds());
    }

    loadGMap() {
        loadGMap().then(() => {
            const { active, ready } = this.props;
            this.Marker = createMarker();
            if (active && ready) {
                this.renderMap();
            }
        });
    }

    destroyGMap() {
        const { mapMarkers } = this.state;
        mapMarkers.forEach(marker => {
            marker.setMap(null);
            google.maps.event.clearInstanceListeners(marker);
        });
        if (this.map !== null) {
            google.maps.event.clearInstanceListeners(this.map);
            this.map = null;
        }
    }

    mergeSamePositionMarkers(markers) {
        const { mergeMarkersDistance } = this.props;

        const mergedMarkers = markers.reduce((newMarkers, marker) => {
            const markerLatitude = get(marker, 'position.latitude');
            const markerLongitude = get(marker, 'position.longitude');
            const markerPosition = new google.maps.LatLng(markerLatitude, markerLongitude);
            const foundIndex = newMarkers.findIndex(newMarker => {
                const newMarkerLatitude = get(newMarker, 'position.latitude');
                const newMarkerLongitude = get(newMarker, 'position.longitude');
                const newMarkerPosition = new google.maps.LatLng(
                    newMarkerLatitude,
                    newMarkerLongitude,
                );
                const distance = Utils.getDistance(markerPosition, newMarkerPosition);
                return distance < mergeMarkersDistance;
            });
            if (foundIndex !== -1) {
                const currentMarker = newMarkers[foundIndex];
                return [
                    ...newMarkers.slice(0, foundIndex),
                    {
                        ...currentMarker,
                        key: `${currentMarker.key}_${marker.key}`,
                        bubbles: [...currentMarker.bubbles, ...marker.bubbles],
                        count: currentMarker.count + marker.count,
                        label: [currentMarker.label, marker.label]
                            .filter(label => label.length > 0)
                            .join(', '),
                    },
                    ...newMarkers.slice(foundIndex + 1),
                ];
            }
            return [...newMarkers, marker];
        }, []);

        // const mergedMarkers = [];
        // for (let i = 0, il = markers.length; i < il; i += 1) {
        //     const marker = markers[i];
        //     const markerLatitude = get(marker, 'position.latitude');
        //     const markerLongitude = get(marker, 'position.longitude');
        //
        //     let mergedMarkerIndex = null;
        //
        //     for (let ii = 0, iil = mergedMarkers.length; ii < iil; ii += 1) {
        //         const mergedMarker = mergedMarkers[ii];
        //         const mergedMarkerLatitude = get(mergedMarker, 'position.latitude');
        //         const mergedMarkerLongitude = get(mergedMarker, 'position.longitude');
        //
        //         const diffLatitude = Math.abs(markerLatitude - mergedMarkerLatitude);
        //         const diffLongitude = Math.abs(markerLongitude - mergedMarkerLongitude);
        //
        //         if (diffLatitude < minDistance && diffLongitude < minDistance) {
        //             mergedMarkerIndex = ii;
        //             break;
        //         }
        //     }
        //
        //     if (mergedMarkerIndex !== null) {
        //         let samePositionMarker = mergedMarkers[mergedMarkerIndex];
        //         debug(`merging "${marker.label}" to "${samePositionMarker.label}".`);
        //         samePositionMarker = {
        //             key: `${samePositionMarker.key}_${marker.key}`,
        //             bubbles: samePositionMarker.bubbles.concat(marker.bubbles),
        //             count: samePositionMarker.count + marker.count,
        //             label:
        //                 samePositionMarker.label.length > marker.label.length
        //                     ? marker.label
        //                     : samePositionMarker.label,
        //             ...samePositionMarker,
        //         };
        //     } else {
        //         mergedMarkers.push(marker);
        //     }
        // }

        return mergedMarkers;
    }

    centerMap() {
        // const { boundsPadding } = this.props;
        this.map.panTo(this.getMarkersBounds().getCenter());
    }

    renderMap() {
        const {
            mapOptions,
            markers,
            clustererEnabled,
            clusterIconType,
            clusterTypes,
            mergeCloseMarkers,
            boundsPadding,
        } = this.props;

        this.destroyGMap();

        this.map = new google.maps.Map(this.refMap, mapOptions);

        const markersWithPosition = markers
            .filter(marker => {
                const latitude = parseFloat(get(marker, 'position.latitude') || 0);
                const longitude = parseFloat(get(marker, 'position.longitude') || 0);
                return latitude !== 0 && longitude !== 0;
            })
            .map(marker => ({
                ...marker,
                position: {
                    latitude: parseFloat(marker.position.latitude),
                    longitude: parseFloat(marker.position.longitude),
                },
            }));
        const mergedMarkers = mergeCloseMarkers
            ? this.mergeSamePositionMarkers(markersWithPosition)
            : markersWithPosition;
        const mapMarkers = mergedMarkers.map((marker, i) =>
            this.renderMarker(
                {
                    lat: get(marker, 'position.latitude'),
                    lng: get(marker, 'position.longitude'),
                },
                marker,
                i,
            ),
        );
        const hasMarkers = mapMarkers.length > 0;

        if (hasMarkers) {
            this.map.fitBounds(this.getMarkersBounds(mapMarkers), boundsPadding);
        }

        google.maps.event.addListenerOnce(this.map, 'idle', this.onMapReady);

        if (clustererEnabled) {
            this.clusterer = new MarkerClusterer(this.map, mapMarkers, {
                iconType: clusterIconType,
                clusterTypes,
                gridSize: 250,
                averageCenter: true,
            });
        }

        this.setState({
            rendered: true,
            mapMarkers,
        });
    }

    renderMarker(position, data, index) {
        const { markerType } = this.props;
        const { Marker } = this;
        const marker = new Marker({
            position,
            data,
            map: this.map,
            type: markerType,
        });

        google.maps.event.addListener(marker, 'click', e => this.onMarkerSelect(e, marker, index));

        return marker;
    }

    render() {
        return (
            <div
                ref={ref => {
                    this.refMap = ref;
                }}
                className="map"
            />
        );
    }
}

Map.propTypes = propTypes;
Map.defaultProps = defaultProps;

export default Map;
