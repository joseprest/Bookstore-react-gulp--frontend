/* globals SOCKET_HOST: true, WEB_HOST: true */
export default {
    SOCKET_HOST: typeof SOCKET_HOST !== 'undefined' ? SOCKET_HOST : 'http://localhost:8080/socket',
    WEB_HOST: typeof WEB_HOST !== 'undefined' ? WEB_HOST : 'http://localhost:8080',

    API_URL: `http://localhost:${8080}`,

    SCREEN_WIDTH: {
        small: 1000,
        medium: 1200,
        large: 1800,
        ultra: 3000,
    },
    SCREEN_HEIGHT: {
        small: 700,
        medium: 1000,
        large: 1200,
        ultra: 1800,
    },
};
