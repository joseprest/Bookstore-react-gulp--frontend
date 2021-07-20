

import React from 'react';
import ReactDOM from 'react-dom';
import ClusterIconComponent from '../components/map/ClusterIcon';

/**
 * A cluster icon
 *
 * @param {Cluster} cluster The cluster to be associated with.
 * @param {string} typeKey A string of the key of the marker to use
 * @constructor
 * @extends google.maps.OverlayView
 * @ignore
 */
function ClusterIcon(cluster, params) {
    cluster.getMarkerClusterer().extend(ClusterIcon, google.maps.OverlayView);

    this.cluster_ = cluster;
    this.typeKey_ = typeof params.typeKey !== 'undefined' ? params.typeKey : null;
    this.type_ = typeof params.type !== 'undefined' ? params.type : null;

    this.center_ = null;
    this.map_ = cluster.getMap();
    this.div_ = null;
    this.contentDiv_ = null;
    this.visible_ = false;
    this.markers_ = [];

    this.setMap(this.map_);
}

/**
 * Triggers the clusterclick event and zoom's if the option is set.
 *
 * @param {google.maps.MouseEvent} event The event to propagate
 */
ClusterIcon.prototype.triggerClusterClick = function (event) {
    const markerClusterer = this.cluster_.getMarkerClusterer();

    // Trigger the clusterclick event.
    google.maps.event.trigger(markerClusterer, 'clusterclick', this.cluster_, event);

    if (markerClusterer.isZoomOnClick()) {
        // Zoom into the cluster.

        // if no zoom changes after click, zoom one level
        const zoomLevel = this.map_.getZoom();

        const oldBounds = this.map_.getBounds();
        this.map_.fitBounds(this.cluster_.getBounds());
        const newBounds = this.map_.getBounds();

        if (oldBounds === newBounds) {
            if (this.map_.getZoom() === zoomLevel) {
                this.map_.setZoom(zoomLevel + 1);
            }
        } else {
            google.maps.event.addListenerOnce(this.map_, 'idle', function () {
                if (this.getZoom() === zoomLevel) {
                    this.setZoom(zoomLevel + 1);
                }
            });
        }
    }
};

/**
 * Adding the cluster icon to the dom.
 * @ignore
 */
ClusterIcon.prototype.onAdd = function () {
    this.div_ = document.createElement('div');
    this.div_.style.borderStyle = 'none';
    this.div_.style.borderWidth = '0px';
    this.div_.style.position = 'absolute';

    const panes = this.getPanes();
    panes.overlayMouseTarget.appendChild(this.div_);

    if (this.visible_) {
        ReactDOM.render(
            React.createElement(ClusterIconComponent, {
                markers: this.markers_,
                typeKey: this.typeKey_,
                type: this.type_,
            }),
            this.div_,
        );
    }

    const that = this;
    google.maps.event.addDomListener(this.div_, 'click', (event) => {
        that.triggerClusterClick(event);
    });
};

/**
 * Returns the position to place the div dending on the latlng.
 *
 * @param {google.maps.LatLng} latlng The position in latlng.
 * @return {google.maps.Point} The position in pixels.
 * @private
 */
ClusterIcon.prototype.getPosFromLatLng_ = function (latlng) {
    const pos = this.getProjection().fromLatLngToDivPixel(latlng);
    return pos;
};

/**
 * Draw the icon.
 * @ignore
 */
ClusterIcon.prototype.draw = function () {
    if (this.visible_) {
        const pos = this.getPosFromLatLng_(this.center_);
        this.div_.style.position = 'absolute';
        this.div_.style.cursor = 'pointer';
        this.div_.style.top = `${pos.y - this.div_.offsetHeight}px`;
        this.div_.style.left = `${pos.x - this.div_.offsetWidth / 2}px`;
    }
};

/**
 * Hide the icon.
 */
ClusterIcon.prototype.hide = function () {
    if (this.div_) {
        this.div_.style.display = 'none';
    }
    this.visible_ = false;
};

/**
 * Position and show the icon.
 */
ClusterIcon.prototype.show = function () {
    if (this.div_) {
        const pos = this.getPosFromLatLng_(this.center_);
        this.div_.style.display = '';
    }
    this.visible_ = true;
};

/**
 * Remove the icon from the map
 */
ClusterIcon.prototype.remove = function () {
    this.setMap(null);
};

/**
 * Implementation of the onRemove interface.
 * @ignore
 */
ClusterIcon.prototype.onRemove = function () {
    if (this.div_ && this.div_.parentNode) {
        this.hide();
        this.div_.parentNode.removeChild(this.div_);
        this.div_ = null;
    }
};

/**
 * Sets the center of the icon.
 *
 * @param {google.maps.LatLng} center The latlng to set as the center.
 */
ClusterIcon.prototype.setCenter = function (center) {
    this.center_ = center;
};

/**
 * Set the markers of the icon.
 *
 * @param {Array} markers The markers inside the cluster
 */

ClusterIcon.prototype.setMarkers = function (markers) {
    this.markers_ = markers;
};

// Export Symbols for Closure
// If you are not going to compile with closure then you can remove the
// code below.
window.ClusterIcon = ClusterIcon;
ClusterIcon.prototype.onAdd = ClusterIcon.prototype.onAdd;
ClusterIcon.prototype.draw = ClusterIcon.prototype.draw;
ClusterIcon.prototype.onRemove = ClusterIcon.prototype.onRemove;
