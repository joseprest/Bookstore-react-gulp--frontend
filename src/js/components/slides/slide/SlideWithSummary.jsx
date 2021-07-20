import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import get from 'lodash/get';
import { connect } from 'react-redux';

import SlideSlideshow from './SlideSlideshow';
import SlideSummary from '../summaries/Summary';

import * as AppPropTypes from '../../../lib/PropTypes';
import NavigationActions from '../../../actions/NavigationActions';

const propTypes = {
    data: AppPropTypes.bubble.isRequired,
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
    current: PropTypes.bool.isRequired,
    horizontal: PropTypes.bool,
    summaryRatioWidth: PropTypes.number,
    updateBrowser: PropTypes.func.isRequired,
};

const defaultProps = {
    summaryRatioWidth: 0.5,
    horizontal: false,
};

const contextTypes = {
    data: AppPropTypes.dataRepository,
    browser: AppPropTypes.browser,
};

class SlideWithSummary extends Component {
    constructor(props) {
        super(props);

        this.onButtonClick = this.onButtonClick.bind(this);
    }

    onButtonClick() {
        const {
            data: { id: bubbleId, channel_id: channelId = null },
            updateBrowser,
        } = this.props;
        const {
            browser: { id: browserId },
            data: dataRepository,
        } = this.context;
        const bubbleChannel = dataRepository.findChannelByID(channelId);
        const browserView = get(bubbleChannel, 'fields.settings.slideMenuDestinationView', null)
            || 'channel:bubbles';

        updateBrowser(browserId, {
            view: browserView,
            channelId,
            bubbleId,
        });
    }

    render() {
        const {
            width,
            height,
            current,
            summaryRatioWidth,
            data: { channel_id: channelId = null, snippet: { summary: description = '' } = {} },
        } = this.props;
        let summaryWidth = width;
        let coverWidth = width;
        const summaryContainerStyle = {};

        if (current) {
            summaryWidth *= summaryRatioWidth;
            coverWidth -= summaryWidth;
            summaryContainerStyle.transform = `translateX(${coverWidth}px)`;
        }

        summaryContainerStyle.width = summaryWidth;

        const summary = (
            <div
                className={classNames(['slide-summary-container', `channel-theme-${channelId}`])}
                style={summaryContainerStyle}
            >
                <SlideSummary
                    width={summaryWidth}
                    height={height}
                    description={description}
                    onButtonClick={this.onButtonClick}
                />
            </div>
        );

        return (
            <SlideSlideshow {...this.props} coverWidth={coverWidth} coverUsesThumbnail={false}>
                {summary}
            </SlideSlideshow>
        );
    }
}

SlideWithSummary.propTypes = propTypes;
SlideWithSummary.defaultProps = defaultProps;
SlideWithSummary.contextTypes = contextTypes;

const WithStateContainer = connect(
    null,
    dispatch => ({
        // prettier-ignore
        updateBrowser: (browserId, props) => (
            dispatch(NavigationActions.updateBrowser(browserId, props))
        ),
    }),
)(SlideWithSummary);
export default WithStateContainer;
