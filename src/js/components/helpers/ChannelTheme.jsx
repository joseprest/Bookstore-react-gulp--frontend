import React from 'react';
import PropTypes from 'prop-types';
// import createDebug from 'debug';
import themeCss from './channel-theme.scss';

// const debug = createDebug('app:theme');

const propTypes = {
    theme: PropTypes.object.isRequired, // eslint-disable-line react/forbid-prop-types
    name: PropTypes.string.isRequired,
};

const ChannelTheme = ({ name, theme }) => (
    <style type="text/css">
        {themeCss.replace(/#[^\s;.:]+/gi, (value) => {
            const key = value.substr(1);
            if (key === 'name') {
                return name;
            }
            if (typeof theme[key] !== 'undefined') {
                return theme[key];
            }
            return value;
        })}
    </style>
);

ChannelTheme.propTypes = propTypes;

export default ChannelTheme;
