import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import * as AppPropTypes from '../lib/PropTypes';
import Manivelle from '../components/Manivelle';

const propTypes = {
    navigation: AppPropTypes.navigationStore.isRequired,
    modals: AppPropTypes.modals.isRequired,
    setup: AppPropTypes.setup.isRequired,
    data: PropTypes.shape({
        repository: AppPropTypes.dataRepository,
    }).isRequired,
};

const AppContainer = ({
    navigation,
    modals,
    setup,
    data,
    ...otherProps
}) => {
    const { repository } = data;
    const { ready: setupReady = false, screen = null } = setup;

    return (
        <Manivelle
            {...otherProps}
            {...navigation}
            ready={setupReady && screen !== null && repository.isReady()}
            setup={setup}
            screen={screen}
            modals={modals}
            data={repository}
        />
    );
};

AppContainer.propTypes = propTypes;

export default connect(({
    navigation, data, modals, setup,
}) => ({
    navigation,
    data,
    modals,
    // manivelle: manivelle,
    setup,
}))(AppContainer);
