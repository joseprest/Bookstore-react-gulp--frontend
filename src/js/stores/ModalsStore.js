import ActionTypes from '../constants/ActionTypes';

/**
 * Initial data
 */
const initialState = [];

/**
 * Open modal
 */
const openModal = (modals, type, props = {}) => {
    const { id = modals.length + 1, group = null, closeOtherModals = false, ...otherProps } = props;
    return [
        ...(closeOtherModals ? [] : modals),
        {
            id,
            type,
            group: group !== null ? `${group}` : null,
            props: otherProps,
        },
    ];
};

/**
 * Update modal
 */
const updateModal = (modals, modalId, props) => {
    const { id = null, group = null, ...otherProps } = props;
    return modals.map(modal => (`${modal.id}` === `${modalId}`
        ? {
            ...modal,
            id: id !== null ? id : modal.id,
            group: group !== null ? `${group}` : modal.group,
            props: otherProps,
        }
        : modal));
};

/**
 * Close modal
 */
const closeModal = (modals, modalId) => modals.filter(modal => `${modal.id}` !== `${modalId}`);

/**
 * Close browser modals
 */
const closeBrowserModals = (modals, browserId) => modals.filter(modal => (modal.group || '').split(':')[0] !== `${browserId}`);

/**
 * Navigation store
 */
const ModalsStore = (state = initialState, action) => {
    switch (action.type) {
    case ActionTypes.MODALS_OPEN: {
        const { modal, props } = action.payload;
        return openModal(state, modal, props);
    }
    case ActionTypes.MODALS_UPDATE: {
        const { id, props } = action.payload;
        return updateModal(state, id, props);
    }
    case ActionTypes.MODALS_CLOSE:
        return closeModal(state, action.payload);
    case ActionTypes.MODALS_BROWSER_CLOSE:
        return closeBrowserModals(state, action.payload);
    case ActionTypes.NAVIGATION_CLOSE_BROWSER:
        return closeBrowserModals(state, action.payload);

    default:
        return state;
    }
};

export default ModalsStore;
