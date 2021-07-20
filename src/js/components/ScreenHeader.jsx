import React from 'react';
import PropTypes from 'prop-types';
import isEmpty from 'lodash/isEmpty';
import classNames from 'classnames';

import * as AppPropTypes from '../lib/PropTypes';
import Clock from './header/Clock';

const propTypes = {
    clock: PropTypes.number.isRequired,
    timezone: PropTypes.string,
    messages: AppPropTypes.headerMessages.isRequired,
    title: PropTypes.string,
};

const defaultProps = {
    timezone: null,
    title: null,
};

const contextTypes = {
    theme: AppPropTypes.theme,
};

const ScreenHeader = ({
    title, clock, timezone, messages,
}, { theme }) => {
    const { header_is_logo: headerIsLogo = false } = theme || {};
    return (
        <div
            className={classNames([
                'screen-header',
                {
                    'has-title': !isEmpty(title),
                },
            ])}
        >
            {headerIsLogo ? (
                <div className="screen-header-logo" />
            ) : (
                <div className="screen-header-inner">
                    {title !== null ? <h1 className="screen-header-title">{title.replace(/&nbsp;/gi, '\u00a0')}</h1> : null}
                    <Clock clock={clock} timezone={timezone} messages={messages} />
                </div>
            )}
        </div>
    );
};

ScreenHeader.propTypes = propTypes;
ScreenHeader.defaultProps = defaultProps;
ScreenHeader.contextTypes = contextTypes;

export default ScreenHeader;
