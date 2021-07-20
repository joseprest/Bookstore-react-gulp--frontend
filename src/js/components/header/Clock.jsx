import React from 'react';
import PropTypes from 'prop-types';
import moment from 'moment-timezone';

import * as AppPropTypes from '../../lib/PropTypes';
import Messages from './messages/Messages';

const propTypes = {
    clock: PropTypes.number.isRequired,
    messages: AppPropTypes.headerMessages.isRequired,
    timezone: PropTypes.string,
};

const defaultProps = {
    timezone: null,
};

const Clock = ({ clock, timezone, messages }) => {
    const date = timezone !== null ? moment(clock).tz(timezone) : moment(clock);
    return (
        <div className="clock">
            <div className="time">
                <span className="hours">{date.format('HH')}</span>
                <span className="colon">:</span>
                <span className="minutes">{date.format('mm')}</span>
            </div>

            <Messages data={messages} />
        </div>
    );
};

Clock.propTypes = propTypes;
Clock.defaultProps = defaultProps;

export default Clock;
