import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

const propTypes = {
    animate: PropTypes.bool,
};

const defaultProps = {
    animate: true,
};

const Hand = ({ animate }) => (
    <div
        className={classNames([
            'hand-container',
            {
                animating: animate,
            },
        ])}
    >
        <div className="hand">
            <span className="icon-frame">
                <span className="frame-border frame-border-bottom-left" />
                <span className="frame-border frame-border-bottom-right" />
            </span>
            <span className="icon-hand-container">
                <span className="icon-hand" />
            </span>
        </div>
    </div>
);

Hand.propTypes = propTypes;
Hand.defaultProps = defaultProps;

export default Hand;
