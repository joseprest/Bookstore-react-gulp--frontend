import React from 'react';
import PropTypes from 'prop-types';

import * as ManivellePropTypes from '../../lib/PropTypes';
import MarkerVaudreuil from '../icons/MarkerVaudreuil';

const propTypes = {
    width: PropTypes.number,
    height: PropTypes.number,
    top: PropTypes.number,
    bubbles: ManivellePropTypes.bubbles.isRequired,
    closeModal: PropTypes.func.isRequired,
};

const defaultProps = {
    width: null,
    height: null,
    top: null,
};

const ModalLocation = ({ width, height, top, bubbles, closeModal }) => {
    return (
        <div className="modal modal-location" style={{ width: width / 2, height, top }}>
            <div className="modal-location-top">
                <button type="button" onClick={closeModal} className="modal-location-close">
                    X
                </button>
            </div>
            <div className="modal-location-content">
                {bubbles.map(bubble => {
                    const {
                        id,
                        snippet: { picture = null, title = null, link = null, description = null },
                        fields: { location: { address = null } = {}, phone = null, email = null },
                    } = bubble;
                    return (
                        <div className="modal-location-bubble" key={`bubble-${id}`}>
                            {picture !== null ? (
                                <div className="modal-location-image-container">
                                    <img
                                        src={picture.link}
                                        className="modal-location-image"
                                        alt={title}
                                    />
                                </div>
                            ) : null}

                            <div className="modal-location-icon-container">
                                <MarkerVaudreuil className="modal-location-icon" />
                            </div>

                            {title !== null || link !== null ? (
                                <div className="modal-location-title-container">
                                    {title !== null ? (
                                        <h4 className="modal-location-title">{title}</h4>
                                    ) : null}
                                    {link !== null ? (
                                        <div className="modal-location-link">{link}</div>
                                    ) : null}
                                </div>
                            ) : null}

                            {address !== null || phone !== null || email !== null ? (
                                <div className="modal-location-address-container">
                                    {address !== null ? <p>{address}</p> : null}
                                    {phone !== null ? <p>{phone.value}</p> : null}
                                    {email !== null ? <p>{email.value}</p> : null}
                                </div>
                            ) : null}

                            {description !== null ? (
                                <div className="modal-location-description-container">
                                    <p>{description}</p>
                                </div>
                            ) : null}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

ModalLocation.propTypes = propTypes;
ModalLocation.defaultProps = defaultProps;

export default ModalLocation;
