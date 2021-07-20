import React from 'react';
import PropTypes from 'prop-types';
import get from 'lodash/get';
// import createDebug from 'debug';
import themeCss from './theme.scss';

// const debug = createDebug('app:theme');

const propTypes = {
    id: PropTypes.string.isRequired,
};

const Theme = ({ id, ...props }) => (
    <style type="text/css">
        {themeCss.replace(/#[^\s;.:/]+/gi, (value) => {
            const key = value.substr(1);
            if (key === 'id') {
                return id;
            }
            const replaceValue = get(props, key, null);
            if (replaceValue !== null) {
                return replaceValue;
            }
            return value;
        })}
    </style>
);

Theme.propTypes = propTypes;

export default Theme;
