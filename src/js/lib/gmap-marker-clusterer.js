require('./gmap-marker-cluster-icon');

// ==ClosureCompiler==
// @compilation_level ADVANCED_OPTIMIZATIONS
// @externs_url http://closure-compiler.googlecode.com/svn/trunk/contrib/externs/maps/google_maps_api_v3_3.js
// ==/ClosureCompiler==

/**
 * @name MarkerClusterer for Google Maps v3
 * @version version 1.0
 * @author Luke Mahe
 * @fileoverview
 * The library creates and manages per-zoom-level clusters for large amounts of
 * markers.
 * <br/>
 * This is a v3 implementation of the
 * <a href="http://gmaps-utility-library-dev.googlecode.com/svn/tags/markerclusterer/"
 * >v2 MarkerClusterer</a>.
 */

/**
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * A Marker Clusterer that clusters markers.
 *
 * @param {google.maps.Map} map The Google map to attach to.
 * @param {Array.<google.maps.Marker>=} opt_markers Optional markers to add to
 *   the cluster.
 * @param {Object=} opt_options support the following options:
 *     'gridSize': (number) The grid size of a cluster in pixels.
 *     'maxZoom': (number) The maximum zoom level that a marker can be part of a
 *                cluster.
 *     'zoomOnClick': (boolean) Whether the default behaviour of clicking on a
 *                    cluster is to zoom into it.
 *     'averageCenter': (boolean) Wether the center of each cluster should be
 *                      the average of all markers in the cluster.
 *     'minimumClusterSize': (number) The minimum number of markers to be in a
 *                           cluster before the markers are hidden and a count
 *                           is shown.
 *     'iconType':  (string) ClusterIcon React type component
 *     'clusterTypes': (array.Object) The different zoom levels (0-21) of the markers
 *                      {
 *                          'key': (string) key of the markers
 *                          'minZoom': (number)
 *                          'maxZoom': (number)
 *                      }
 * @constructor
 * @extends google.maps.OverlayView
 */
function MarkerClusterer(map, opt_markers, opt_options) {
    // MarkerClusterer implements google.maps.OverlayView interface. We use the
    // extend function to extend MarkerClusterer with google.maps.OverlayView
    // because it might not always be available when the code is defined so we
    // look for it at the last possible moment. If it doesn't exist now then
    // there is no point going ahead :)
    this.extend(MarkerClusterer, google.maps.OverlayView);
    this.map_ = map;

    /**
     * @type {Array.<google.maps.Marker>}
     * @private
     */
    this.markers_ = [];

    /**
     *  @type {Array.<Cluster>}
     */
    this.clusters_ = [];

    this.sizes = [53, 56, 66, 78, 90];

    /**
     * @type {boolean}
     * @private
     */
    this.ready_ = false;

    const options = opt_options || {};

    /**
     *  @type {string}
     *  @private
     */

    this.iconType_ = options.iconType || null;
    /**
     *  @type {Array}
     *  @private
     */
    this.clusterTypes_ = options.clusterTypes || [];

    /**
     * @type {number}
     * @private
     */
    this.gridSize_ = options.gridSize || 60;

    /**
     * @private
     */
    this.minClusterSize_ = options.minimumClusterSize || 2;

    /**
     * @type {?number}
     * @private
     */
    this.maxZoom_ = options.maxZoom || null;

    /**
     * @type {boolean}
     * @private
     */
    this.zoomOnClick_ = true;

    if (options.zoomOnClick != undefined) {
        this.zoomOnClick_ = options.zoomOnClick;
    }

    /**
     * @type {boolean}
     * @private
     */
    this.averageCenter_ = false;

    if (options.averageCenter != undefined) {
        this.averageCenter_ = options.averageCenter;
    }

    this.setMap(map);

    /**
     * @type {number}
     * @private
     */
    this.prevZoom_ = this.map_.getZoom();

    // Add the map event listeners
    const that = this;
    google.maps.event.addListener(this.map_, 'zoom_changed', () => {
        const zoom = that.map_.getZoom();

        if (that.prevZoom_ != zoom) {
            that.prevZoom_ = zoom;
            that.resetViewport();
        }
    });

    google.maps.event.addListener(this.map_, 'idle', () => {
        that.redraw();
    });

    // Finally, add the markers
    if (opt_markers && opt_markers.length) {
        this.addMarkers(opt_markers, false);
    }
}

/**
 * Extends a objects prototype by anothers.
 *
 * @param {Object} obj1 The object to be extended.
 * @param {Object} obj2 The object to extend with.
 * @return {Object} The new extended object.
 * @ignore
 */
MarkerClusterer.prototype.extend = function (obj1, obj2) {
    return function (object) {
        for (const property in object.prototype) {
            this.prototype[property] = object.prototype[property];
        }
        return this;
    }.apply(obj1, [obj2]);
};

/**
 * Implementaion of the interface method.
 * @ignore
 */
MarkerClusterer.prototype.onAdd = function () {
    this.setReady_(true);
};

/**
 * Implementaion of the interface method.
 * @ignore
 */
MarkerClusterer.prototype.draw = function () {};

/**
 *  Fit the map to the bounds of the markers in the clusterer.
 */
MarkerClusterer.prototype.fitMapToMarkers = function () {
    const markers = this.getMarkers();
    const bounds = new google.maps.LatLngBounds();
    for (var i = 0, marker; (marker = markers[i]); i++) {
        bounds.extend(marker.getPosition());
    }

    this.map_.fitBounds(bounds);
};

/**
 *  Gets the clusterTypes.
 *
 *  @return {Array} The clusterTypes array.
 */
MarkerClusterer.prototype.getClusterTypes = function () {
    return this.clusterTypes_;
};

/**
 *  Gets the clusterType from zoom level.
 *
 *  @return {Object} The clusterType object.
 */
MarkerClusterer.prototype.getClusterTypeKey = function () {
    const zoomLevel = this.getMap().getZoom();
    const clusterTypes = this.getClusterTypes();

    for (let i = 0, il = clusterTypes.length; i < il; i++) {
        const clusterType = clusterTypes[i];

        if (zoomLevel >= clusterType.minZoom && zoomLevel <= clusterType.maxZoom) {
            return clusterType.key;
        }
    }
    return null;
};

/**
 *  Gets the Cluster icon type.
 *
 *  @return {string} The cluster icon type.
 */
MarkerClusterer.prototype.getClusterIconType = function () {
    return this.iconType_;
};

/**
 * Whether zoom on click is set.
 *
 * @return {boolean} True if zoomOnClick_ is set.
 */
MarkerClusterer.prototype.isZoomOnClick = function () {
    return this.zoomOnClick_;
};

/**
 * Whether average center is set.
 *
 * @return {boolean} True if averageCenter_ is set.
 */
MarkerClusterer.prototype.isAverageCenter = function () {
    return this.averageCenter_;
};

/**
 *  Returns the array of markers in the clusterer.
 *
 *  @return {Array.<google.maps.Marker>} The markers.
 */
MarkerClusterer.prototype.getMarkers = function () {
    return this.markers_;
};

/**
 *  Returns the number of markers in the clusterer
 *
 *  @return {Number} The number of markers.
 */
MarkerClusterer.prototype.getTotalMarkers = function () {
    return this.markers_.length;
};

/**
 *  Sets the max zoom for the clusterer.
 *
 *  @param {number} maxZoom The max zoom level.
 */
MarkerClusterer.prototype.setMaxZoom = function (maxZoom) {
    this.maxZoom_ = maxZoom;
};

/**
 *  Gets the max zoom for the clusterer.
 *
 *  @return {number} The max zoom level.
 */
MarkerClusterer.prototype.getMaxZoom = function () {
    return this.maxZoom_;
};

/**
 * Add an array of markers to the clusterer.
 *
 * @param {Array.<google.maps.Marker>} markers The markers to add.
 * @param {boolean=} opt_nodraw Whether to redraw the clusters.
 */
MarkerClusterer.prototype.addMarkers = function (markers, opt_nodraw) {
    for (var i = 0, marker; (marker = markers[i]); i++) {
        this.pushMarkerTo_(marker);
    }
    if (!opt_nodraw) {
        this.redraw();
    }
};

/**
 * Pushes a marker to the clusterer.
 *
 * @param {google.maps.Marker} marker The marker to add.
 * @private
 */
MarkerClusterer.prototype.pushMarkerTo_ = function (marker) {
    marker.isAdded = false;
    if (marker.draggable) {
        // If the marker is draggable add a listener so we update the clusters on
        // the drag end.
        const that = this;
        google.maps.event.addListener(marker, 'dragend', () => {
            marker.isAdded = false;
            that.repaint();
        });
    }
    this.markers_.push(marker);
};

/**
 * Adds a marker to the clusterer and redraws if needed.
 *
 * @param {google.maps.Marker} marker The marker to add.
 * @param {boolean=} opt_nodraw Whether to redraw the clusters.
 */
MarkerClusterer.prototype.addMarker = function (marker, opt_nodraw) {
    this.pushMarkerTo_(marker);
    if (!opt_nodraw) {
        this.redraw();
    }
};

/**
 * Removes a marker and returns true if removed, false if not
 *
 * @param {google.maps.Marker} marker The marker to remove
 * @return {boolean} Whether the marker was removed or not
 * @private
 */
MarkerClusterer.prototype.removeMarker_ = function (marker) {
    let index = -1;
    if (this.markers_.indexOf) {
        index = this.markers_.indexOf(marker);
    } else {
        for (var i = 0, m; (m = this.markers_[i]); i++) {
            if (m == marker) {
                index = i;
                break;
            }
        }
    }

    if (index == -1) {
        // Marker is not in our list of markers.
        return false;
    }

    marker.setMap(null);

    this.markers_.splice(index, 1);

    return true;
};

/**
 * Remove a marker from the cluster.
 *
 * @param {google.maps.Marker} marker The marker to remove.
 * @param {boolean=} opt_nodraw Optional boolean to force no redraw.
 * @return {boolean} True if the marker was removed.
 */
MarkerClusterer.prototype.removeMarker = function (marker, opt_nodraw) {
    const removed = this.removeMarker_(marker);

    if (!opt_nodraw && removed) {
        this.resetViewport();
        this.redraw();
        return true;
    }
    return false;
};

/**
 * Removes an array of markers from the cluster.
 *
 * @param {Array.<google.maps.Marker>} markers The markers to remove.
 * @param {boolean=} opt_nodraw Optional boolean to force no redraw.
 */
MarkerClusterer.prototype.removeMarkers = function (markers, opt_nodraw) {
    let removed = false;

    for (var i = 0, marker; (marker = markers[i]); i++) {
        const r = this.removeMarker_(marker);
        removed = removed || r;
    }

    if (!opt_nodraw && removed) {
        this.resetViewport();
        this.redraw();
        return true;
    }
};

/**
 * Sets the clusterer's ready state.
 *
 * @param {boolean} ready The state.
 * @private
 */
MarkerClusterer.prototype.setReady_ = function (ready) {
    if (!this.ready_) {
        this.ready_ = ready;
        this.createClusters_();
    }
};

/**
 * Returns the number of clusters in the clusterer.
 *
 * @return {number} The number of clusters.
 */
MarkerClusterer.prototype.getTotalClusters = function () {
    return this.clusters_.length;
};

/**
 * Returns the google map that the clusterer is associated with.
 *
 * @return {google.maps.Map} The map.
 */
MarkerClusterer.prototype.getMap = function () {
    return this.map_;
};

/**
 * Sets the google map that the clusterer is associated with.
 *
 * @param {google.maps.Map} map The map.
 */
MarkerClusterer.prototype.setMap = function (map) {
    this.map_ = map;
};

/**
 * Returns the size of the grid.
 *
 * @return {number} The grid size.
 */
MarkerClusterer.prototype.getGridSize = function () {
    return this.gridSize_;
};

/**
 * Sets the size of the grid.
 *
 * @param {number} size The grid size.
 */
MarkerClusterer.prototype.setGridSize = function (size) {
    this.gridSize_ = size;
};

/**
 * Returns the min cluster size.
 *
 * @return {number} The grid size.
 */
MarkerClusterer.prototype.getMinClusterSize = function () {
    return this.minClusterSize_;
};

/**
 * Sets the min cluster size.
 *
 * @param {number} size The grid size.
 */
MarkerClusterer.prototype.setMinClusterSize = function (size) {
    this.minClusterSize_ = size;
};

/**
 * Extends a bounds object by the grid size.
 *
 * @param {google.maps.LatLngBounds} bounds The bounds to extend.
 * @return {google.maps.LatLngBounds} The extended bounds.
 */
MarkerClusterer.prototype.getExtendedBounds = function (bounds) {
    const projection = this.getProjection();

    // Turn the bounds into latlng.
    const tr = new google.maps.LatLng(bounds.getNorthEast().lat(), bounds.getNorthEast().lng());
    const bl = new google.maps.LatLng(bounds.getSouthWest().lat(), bounds.getSouthWest().lng());

    const gridSize = this.getGridSize();

    // Convert the points to pixels and the extend out by the grid size.
    const trPix = projection.fromLatLngToDivPixel(tr);
    trPix.x += gridSize;
    trPix.y -= gridSize;

    const blPix = projection.fromLatLngToDivPixel(bl);
    blPix.x -= gridSize;
    blPix.y += gridSize;

    // Convert the pixel points back to LatLng
    const ne = projection.fromDivPixelToLatLng(trPix);
    const sw = projection.fromDivPixelToLatLng(blPix);

    // Extend the bounds to contain the new bounds.
    bounds.extend(ne);
    bounds.extend(sw);

    return bounds;
};

/**
 * Determins if a marker is contained in a bounds.
 *
 * @param {google.maps.Marker} marker The marker to check.
 * @param {google.maps.LatLngBounds} bounds The bounds to check against.
 * @return {boolean} True if the marker is in the bounds.
 * @private
 */
MarkerClusterer.prototype.isMarkerInBounds_ = function (marker, bounds) {
    return bounds.contains(marker.getPosition());
};

/**
 * Clears all clusters and markers from the clusterer.
 */
MarkerClusterer.prototype.clearMarkers = function () {
    this.resetViewport(true);

    // Set the markers a empty array.
    this.markers_ = [];
};

/**
 * Clears all existing clusters and recreates them.
 * @param {boolean} opt_hide To also hide the marker.
 */
MarkerClusterer.prototype.resetViewport = function (opt_hide) {
    // Remove all the clusters
    for (var i = 0, cluster; (cluster = this.clusters_[i]); i++) {
        cluster.remove();
    }

    // Reset the markers to not be added and to be invisible.
    for (var i = 0, marker; (marker = this.markers_[i]); i++) {
        marker.isAdded = false;
        if (opt_hide) {
            marker.setMap(null);
        }
    }

    this.clusters_ = [];
};

/**
 *
 */
MarkerClusterer.prototype.repaint = function () {
    const oldClusters = this.clusters_.slice();
    this.clusters_.length = 0;
    this.resetViewport();
    this.redraw();

    // Remove the old clusters.
    // Do it in a timeout so the other clusters have been drawn first.
    window.setTimeout(() => {
        for (var i = 0, cluster; (cluster = oldClusters[i]); i++) {
            cluster.remove();
        }
    }, 0);
};

/**
 * Redraws the clusters.
 */
MarkerClusterer.prototype.redraw = function () {
    this.createClusters_();
};

/**
 * Calculates the distance between two latlng locations in km.
 * @see http://www.movable-type.co.uk/scripts/latlong.html
 *
 * @param {google.maps.LatLng} p1 The first lat lng point.
 * @param {google.maps.LatLng} p2 The second lat lng point.
 * @return {number} The distance between the two points in km.
 * @private
 */
MarkerClusterer.prototype.distanceBetweenPoints_ = function (p1, p2) {
    if (!p1 || !p2) {
        return 0;
    }

    const R = 6371; // Radius of the Earth in km
    const dLat = ((p2.lat() - p1.lat()) * Math.PI) / 180;
    const dLon = ((p2.lng() - p1.lng()) * Math.PI) / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
        + Math.cos((p1.lat() * Math.PI) / 180)
            * Math.cos((p2.lat() * Math.PI) / 180)
            * Math.sin(dLon / 2)
            * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c;
    return d;
};

/**
 * Add a marker to a cluster, or creates a new cluster.
 *
 * @param {google.maps.Marker} marker The marker to add.
 * @private
 */
MarkerClusterer.prototype.addToClosestCluster_ = function (marker) {
    let distance = 40000; // Some large number
    let clusterToAddTo = null;
    const pos = marker.getPosition();
    for (var i = 0, cluster; (cluster = this.clusters_[i]); i++) {
        const center = cluster.getCenter();
        if (center) {
            const d = this.distanceBetweenPoints_(center, marker.getPosition());
            if (d < distance) {
                distance = d;
                clusterToAddTo = cluster;
            }
        }
    }

    if (clusterToAddTo && clusterToAddTo.isMarkerInClusterBounds(marker)) {
        clusterToAddTo.addMarker(marker);
    } else {
        var cluster = new Cluster(this);
        cluster.addMarker(marker);
        this.clusters_.push(cluster);
    }
};

/**
 * Creates the clusters.
 *
 * @private
 */
MarkerClusterer.prototype.createClusters_ = function () {
    if (!this.ready_) {
        return;
    }

    // Get our current map view bounds.
    // Create a new bounds object so we don't affect the map.
    const mapBounds = new google.maps.LatLngBounds(
        this.map_.getBounds().getSouthWest(),
        this.map_.getBounds().getNorthEast(),
    );
    const bounds = this.getExtendedBounds(mapBounds);

    for (var i = 0, marker; (marker = this.markers_[i]); i++) {
        if (!marker.isAdded && this.isMarkerInBounds_(marker, bounds)) {
            this.addToClosestCluster_(marker);
        }
    }
};

/**
 * Gets the cluster from zoom level.
 *
 * @private
 */
MarkerClusterer.prototype.getCluster = function () {
    if (!this.ready_) {

    }
};

/**
 * A cluster that contains markers.
 *
 * @param {MarkerClusterer} markerClusterer The markerclusterer that this
 *     cluster is associated with.
 * @constructor
 * @ignore
 */
function Cluster(markerClusterer) {
    this.markerClusterer_ = markerClusterer;
    this.map_ = markerClusterer.getMap();
    this.gridSize_ = markerClusterer.getGridSize();
    this.minClusterSize_ = markerClusterer.getMinClusterSize();
    this.averageCenter_ = markerClusterer.isAverageCenter();
    this.center_ = null;
    this.markers_ = [];
    this.bounds_ = null;
    this.clusterIcon_ = new ClusterIcon(this, {
        type: markerClusterer.getClusterIconType(),
        typeKey: markerClusterer.getClusterTypeKey(),
    });
}

/**
 * Determins if a marker is already added to the cluster.
 *
 * @param {google.maps.Marker} marker The marker to check.
 * @return {boolean} True if the marker is already added.
 */
Cluster.prototype.isMarkerAlreadyAdded = function (marker) {
    if (this.markers_.indexOf) {
        return this.markers_.indexOf(marker) != -1;
    }
    for (var i = 0, m; (m = this.markers_[i]); i++) {
        if (m == marker) {
            return true;
        }
    }

    return false;
};

/**
 * Add a marker the cluster.
 *
 * @param {google.maps.Marker} marker The marker to add.
 * @return {boolean} True if the marker was added.
 */
Cluster.prototype.addMarker = function (marker) {
    if (this.isMarkerAlreadyAdded(marker)) {
        return false;
    }

    if (!this.center_) {
        this.center_ = marker.getPosition();
        this.calculateBounds_();
    } else if (this.averageCenter_) {
        const l = this.markers_.length + 1;
        const lat = (this.center_.lat() * (l - 1) + marker.getPosition().lat()) / l;
        const lng = (this.center_.lng() * (l - 1) + marker.getPosition().lng()) / l;
        this.center_ = new google.maps.LatLng(lat, lng);
        this.calculateBounds_();
    }

    marker.isAdded = true;
    this.markers_.push(marker);

    const len = this.markers_.length;
    if (len < this.minClusterSize_ && marker.getMap() != this.map_) {
        // Min cluster size not reached so show the marker.
        marker.setMap(this.map_);
    }

    if (len == this.minClusterSize_) {
        // Hide the markers that were showing.
        for (let i = 0; i < len; i++) {
            this.markers_[i].setMap(null);
        }
    }

    if (len >= this.minClusterSize_) {
        marker.setMap(null);
    }

    this.updateIcon();
    return true;
};

/**
 * Returns the marker clusterer that the cluster is associated with.
 *
 * @return {MarkerClusterer} The associated marker clusterer.
 */
Cluster.prototype.getMarkerClusterer = function () {
    return this.markerClusterer_;
};

/**
 * Returns the bounds of the cluster.
 *
 * @return {google.maps.LatLngBounds} the cluster bounds.
 */
Cluster.prototype.getBounds = function () {
    const bounds = new google.maps.LatLngBounds(this.center_, this.center_);
    const markers = this.getMarkers();
    for (var i = 0, marker; (marker = markers[i]); i++) {
        bounds.extend(marker.getPosition());
    }
    return bounds;
};

/**
 * Removes the cluster
 */
Cluster.prototype.remove = function () {
    this.clusterIcon_.remove();
    this.markers_.length = 0;
    delete this.markers_;
};

/**
 * Returns the center of the cluster.
 *
 * @return {number} The cluster center.
 */
Cluster.prototype.getSize = function () {
    return this.markers_.length;
};

/**
 * Returns the center of the cluster.
 *
 * @return {Array.<google.maps.Marker>} The cluster center.
 */
Cluster.prototype.getMarkers = function () {
    return this.markers_;
};

/**
 * Returns the center of the cluster.
 *
 * @return {google.maps.LatLng} The cluster center.
 */
Cluster.prototype.getCenter = function () {
    return this.center_;
};

/**
 * Calculated the extended bounds of the cluster with the grid.
 *
 * @private
 */
Cluster.prototype.calculateBounds_ = function () {
    const bounds = new google.maps.LatLngBounds(this.center_, this.center_);
    this.bounds_ = this.markerClusterer_.getExtendedBounds(bounds);
};

/**
 * Determines if a marker lies in the clusters bounds.
 *
 * @param {google.maps.Marker} marker The marker to check.
 * @return {boolean} True if the marker lies in the bounds.
 */
Cluster.prototype.isMarkerInClusterBounds = function (marker) {
    return this.bounds_.contains(marker.getPosition());
};

/**
 * Returns the map that the cluster is associated with.
 *
 * @return {google.maps.Map} The map.
 */
Cluster.prototype.getMap = function () {
    return this.map_;
};

/**
 * Updates the cluster icon
 */
Cluster.prototype.updateIcon = function () {
    const zoom = this.map_.getZoom();
    const mz = this.markerClusterer_.getMaxZoom();

    if (mz && zoom > mz) {
        // The zoom is greater than our max zoom so show all the markers in cluster.
        for (var i = 0, marker; (marker = this.markers_[i]); i++) {
            marker.setMap(this.map_);
        }
        return;
    }

    if (this.markers_.length < this.minClusterSize_) {
        // Min cluster size not yet reached.
        this.clusterIcon_.hide();
        return;
    }

    this.clusterIcon_.setCenter(this.center_);
    this.clusterIcon_.setMarkers(this.markers_);
    this.clusterIcon_.show();
};

// Export Symbols for Closure
// If you are not going to compile with closure then you can remove the
// code below.
window.MarkerClusterer = MarkerClusterer;
MarkerClusterer.prototype.addMarker = MarkerClusterer.prototype.addMarker;
MarkerClusterer.prototype.addMarkers = MarkerClusterer.prototype.addMarkers;
MarkerClusterer.prototype.clearMarkers = MarkerClusterer.prototype.clearMarkers;
MarkerClusterer.prototype.fitMapToMarkers = MarkerClusterer.prototype.fitMapToMarkers;
MarkerClusterer.prototype.getGridSize = MarkerClusterer.prototype.getGridSize;
MarkerClusterer.prototype.getExtendedBounds = MarkerClusterer.prototype.getExtendedBounds;
MarkerClusterer.prototype.getMap = MarkerClusterer.prototype.getMap;
MarkerClusterer.prototype.getMarkers = MarkerClusterer.prototype.getMarkers;
MarkerClusterer.prototype.getMaxZoom = MarkerClusterer.prototype.getMaxZoom;
MarkerClusterer.prototype.getTotalClusters = MarkerClusterer.prototype.getTotalClusters;
MarkerClusterer.prototype.getTotalMarkers = MarkerClusterer.prototype.getTotalMarkers;
MarkerClusterer.prototype.redraw = MarkerClusterer.prototype.redraw;
MarkerClusterer.prototype.removeMarker = MarkerClusterer.prototype.removeMarker;
MarkerClusterer.prototype.removeMarkers = MarkerClusterer.prototype.removeMarkers;
MarkerClusterer.prototype.resetViewport = MarkerClusterer.prototype.resetViewport;
MarkerClusterer.prototype.repaint = MarkerClusterer.prototype.repaint;
MarkerClusterer.prototype.setGridSize = MarkerClusterer.prototype.setGridSize;
MarkerClusterer.prototype.setMaxZoom = MarkerClusterer.prototype.setMaxZoom;
MarkerClusterer.prototype.onAdd = MarkerClusterer.prototype.onAdd;
MarkerClusterer.prototype.draw = MarkerClusterer.prototype.draw;

Cluster.prototype.getCenter = Cluster.prototype.getCenter;
Cluster.prototype.getSize = Cluster.prototype.getSize;
Cluster.prototype.getMarkers = Cluster.prototype.getMarkers;
