import React from 'react';
import PropTypes from 'prop-types';
import get from 'lodash/get';

import ModalsActions from '../../../actions/ModalsActions';
import NavigationActions from '../../../actions/NavigationActions';
import Circles from '../../partials/Circles';

const TabCircles = React.createClass({
    propTypes: {
        filteredBubbles: PropTypes.array.isRequired,
        topSpaceHeight: PropTypes.number.isRequired,
        width: PropTypes.number.isRequired,
        height: PropTypes.number.isRequired,
        active: PropTypes.bool.isRequired,
        ready: PropTypes.bool.isRequired,
        filterLabel: PropTypes.string.isRequired,

        modalMargin: PropTypes.number,
    },

    contextTypes: {
        browser: PropTypes.object,
        store: PropTypes.object,
        channel: PropTypes.object,
    },

    getDefaultProps() {
        return {
            modalMargin: 100,
        };
    },

    getInitialState() {
        return {
            circleSelected: false,
        };
    },

    render() {
        const items = this.props.filteredBubbles;
        const props = _.omit(this.props, ['filteredBubbles', 'modalMargin', 'filterLabel']);

        return (
            <div className="tab tab-circles">
                <Circles
                    items={items}
                    selected={this.state.circleSelected}
                    onCircleSelected={this.onCircleSelected}
                    typeName={this.props.filterLabel}
                    {...props}
                />
            </div>
        );
    },

    /*
        Events handlers
    */

    onModalItemClick(e, it, index) {
        const browserId = _.get(this.context.browser, 'id');
        this.context.store.dispatch(
            NavigationActions.updateBrowser(browserId, {
                view: 'channel:bubbles',
                bubbleId: it.id,
            }),
        );
    },

    onCircleSelected(circle, shape, index) {
        // open modal
        this.setState(
            {
                circleSelected: true,
            },
            () => {
                const positionPoint = () => ({
                    x: shape.x + shape.width / 2,
                    y: shape.y + shape.height / 2 + shape.label.height / 2 + 20,
                });

                const modalWidth = () => this.props.width - this.props.modalMargin * 2;

                const modalHeight = () => this.props.height
                    + this.props.topSpaceHeight
                    - positionPoint().y
                    - this.props.modalMargin;

                const browserId = get(this.context.browser, 'id');

                this.context.store.dispatch(
                    ModalsActions.open('BubblesList', {
                        group: `${browserId}:channelMain`,
                        bubbles: circle.bubbles,
                        placement: 'bottom',
                        width: modalWidth,
                        height: modalHeight,
                        point: positionPoint,
                        btnClose: true,
                        onClosed: this.onModalClosed,
                        onItemClick: this.onModalItemClick,
                    }),
                );
            },
        );

        const channelId = get(this.context, 'channel.id');
        const channelTitle = get(this.context, 'channel.snippet.title');
        this.context.browser.tracker.screenEvent(
            'Tab circle click',
            `${channelTitle} - ${get(circle, 'label', '')}`,
            channelId,
        );
    },

    onModalClosed() {
        this.setState({
            circleSelected: false,
        });
    },
});

export default TabCircles;
