/* eslint-disable react/button-has-type */
import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import get from 'lodash/get';

import Utils from '../../lib/utils';

import * as AppPropTypes from '../../lib/PropTypes';

const propTypes = {
    type: PropTypes.string,
    active: PropTypes.bool,
    icon: PropTypes.string,
    iconPosition: PropTypes.string,
    customThemeIcon: PropTypes.string,
    color: PropTypes.string,
    shadowColor: PropTypes.string,
    children: PropTypes.node,
    className: PropTypes.string,
    onClick: PropTypes.func,
};

const defaultProps = {
    type: 'button',
    active: false,
    icon: null,
    iconPosition: 'left',
    customThemeIcon: null,
    color: null,
    shadowColor: null,
    children: null,
    className: null,
    onClick: null,
};

const contextTypes = {
    theme: AppPropTypes.theme,
};

const Button = (
    {
        type,
        active,
        color,
        shadowColor,
        icon,
        iconPosition,
        customThemeIcon,
        children,
        className,
        onClick,
        ...otherProps
    },
    { theme },
) => {
    const themeId = get(theme, 'id', null);
    const style = {};
    if (!active) {
        if (color) {
            style.backgroundColor = color;
        }
        if (shadowColor) {
            style.borderBottomColor = shadowColor;
        }
    } else if (shadowColor) {
        style.backgroundColor = shadowColor;
        style.borderBottomColor = 'transparent';
    }

    const rightIcon = customThemeIcon && themeId ? (
        <span
            key="icon-custom"
            className={classNames(['icon', `icon-${customThemeIcon}`, `icon-${themeId}`])}
        />
    ) : null;

    const content = icon !== null
        ? [
            <span
                key="icon"
                className={classNames(['icon', `icon-${icon}`, `icon-${themeId}`])}
            />,
            <span key="label" className="btn-label">
                {children}
            </span>,
            rightIcon,
        ]
        : children;

    if (icon !== null && iconPosition !== 'left') {
        content.reverse();
    }

    return (
        <button
            type={type}
            {...otherProps}
            {...Utils.onClick((e) => {
                e.preventDefault();

                if (onClick !== null) {
                    onClick(e);
                }
            }, 'end')}
            className={classNames({
                [className]: className !== null,
                btn: className === null,
                'btn-active': active,
            })}
            style={style}
        >
            {content}
        </button>
    );
};

Button.propTypes = propTypes;
Button.defaultProps = defaultProps;
Button.contextTypes = contextTypes;

export default Button;
