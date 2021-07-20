// prettier-ignore
// eslint-disable-next-line import/prefer-default-export
export const getScreenInformation = () => new Promise((resolve, reject) => (
    navigator.geolocation.getCurrentPosition(
        position => resolve({
            resolution: {
                x: window.screen.width,
                y: window.screen.height,
            },
            position: {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
            },
        }),
        err => reject(err),
    )
));
