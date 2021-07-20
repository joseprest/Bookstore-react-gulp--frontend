/* eslint-disable react/no-array-index-key */
import React from 'react';
import PropTypes from 'prop-types';

const propTypes = {
    code: PropTypes.string,
};

const defaultProps = {
    code: '1234',
};

const AuthCode = ({ code }) => (
    <div className="auth-code">
        {code.split('').map((char, index) => (
            <div key={`char${index}`} className="char">
                <span>{char}</span>
            </div>
        ))}
        <div className="message">
            Pour continuer, saisissez ce code d’autorisation
            <br />
            dans votre tableau de bord Manivelle.
        </div>
    </div>
);

AuthCode.propTypes = propTypes;
AuthCode.defaultProps = defaultProps;

export default AuthCode;
