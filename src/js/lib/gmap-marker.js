/* globals google: true */
import React from 'react';
import ReactDOM from 'react-dom';
import MarkerComponent from '../components/map/MapMarker';

const createMarker = () => {
    class Marker extends google.maps.OverlayView {
        constructor(params = {}) {
            super();
            this.div = null;
            this.position = params.position || { lat: 0, lng: 0 };
            this.data = params.data;
            this.type = params.type;

            this.onClickDiv = this.onClickDiv.bind(this);

            if (params.map) {
                this.setMap(params.map);
            }
        }

        getPosition() {
            return new google.maps.LatLng(this.position.lat, this.position.lng);
        }

        getPointPosition() {
            const overlayProjection = this.getProjection();
            const pos = overlayProjection.fromLatLngToDivPixel(this.getPosition());
            return pos;
        }

        onAdd() {
            const div = document.createElement('div');
            div.style.borderStyle = 'none';
            div.style.borderWidth = '0px';
            div.style.position = 'absolute';

            this.div = div;

            const panes = this.getPanes();
            panes.overlayMouseTarget.appendChild(div);

            ReactDOM.render(
                React.createElement(MarkerComponent, {
                    data: this.data,
                    type: this.type,
                }),
                div,
            );

            this.clickListener = google.maps.event.addDomListener(
                div,
                'click',
                this.onClickDiv,
            );
        }

        onRemove() {
            google.maps.event.removeListener(this.clickListener);
            this.div.parentNode.removeChild(this.div);
            this.div = null;
        }

        onClickDiv(e) {
            google.maps.event.trigger(this, 'click', e);
        }

        draw() {
            const pos = this.getPointPosition();

            const { div } = this;
            div.style.left = `${pos.x - div.offsetWidth / 2}px`;
            div.style.top = `${pos.y - div.offsetHeight}px`;
        }
    }

    return Marker;
};


export default createMarker;
