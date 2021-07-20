/* globals google:true */
import { Promise } from 'es6-promise';

export const API_KEY = 'AIzaSyDebncMpylj9qPSv1CQaIjHHJi7kH-bYfI';

export const loadGMap = (apiKey = API_KEY) => new Promise((resolve) => {
    if (typeof google !== 'undefined' && typeof google.maps !== 'undefined') {
        resolve();
        return;
    }

    const callbackName = `gmapLoaded_${new Date().getTime()}`;
    window[callbackName] = () => {
        window[callbackName] = null;
        return resolve();
    };
    const url = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&language=fr&callback=${callbackName}`;
    const script = document.createElement('script');
    script.src = url;
    script.type = 'text/javascript';
    document.getElementsByTagName('head')[0].appendChild(script);
});

export const geocode = address => new Promise((resolve, reject) => {
    const geocoder = new google.maps.Geocoder();

    geocoder.geocode(
        {
            address,
        },
        (results, status) => {
            if (status === google.maps.GeocoderStatus.OK) {
                resolve(results[0].geometry.location);
            } else {
                reject(status);
            }
        },
    );
});
