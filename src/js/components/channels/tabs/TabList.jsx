import React, { Component } from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import $ from 'jquery';
import { connect } from 'react-redux';

import Utils from '../../../lib/utils';
import * as AppPropTypes from '../../../lib/PropTypes';

import ModalsActions from '../../../actions/ModalsActions';
import NavigationActions from '../../../actions/NavigationActions';
import * as ListComponents from '../../lists';

const propTypes = {
    filteredBubbles: PropTypes.array.isRequired, // eslint-disable-line react/forbid-prop-types
    topSpaceHeight: PropTypes.number.isRequired,
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
    active: PropTypes.bool.isRequired,
    ready: PropTypes.bool.isRequired,
    layout: PropTypes.string,
    updateBrowser: PropTypes.func.isRequired,
    openModal: PropTypes.func.isRequired,

    modalMargin: PropTypes.number,
};

const defaultProps = {
    layout: null,
    modalMargin: 100,
};

const contextTypes = {
    browser: AppPropTypes.browser,
    channel: AppPropTypes.channel,
};

class TabList extends Component {
    constructor(props) {
        super(props);

        this.onItemClick = this.onItemClick.bind(this);
        this.onItemSelected = this.onItemSelected.bind(this);
        this.onModalClose = this.onModalClose.bind(this);
        this.onModalClosed = this.onModalClosed.bind(this);
        this.onModalItemClick = this.onModalItemClick.bind(this);

        this.refContainer = this.refContainer;

        this.state = {
            selectedItemIndex: null,
        };
    }

    onItemClick(e, it) {
        if (it.bubbles) {
            return;
        }
        const { updateBrowser } = this.props;
        const {
            browser: { id: browserId },
        } = this.context;
        updateBrowser(browserId, {
            view: 'channel:bubbles',
            bubbleId: it.id,
        });
    }

    onItemSelected(it, index) {
        this.setState(
            {
                selectedItemIndex: index,
            },
            () => {
                const {
                    width, height, topSpaceHeight, modalMargin, openModal,
                } = this.props;
                const {
                    browser: { id: browserId },
                } = this.context;
                const el = this.refContainer;
                const $list = $(el).find('.list-alphabetic');
                const $target = $list.find(`[data-list-item-index="${index}"]`);
                const target = $target[0];

                let targetPos = target.getBoundingClientRect().top - el.getBoundingClientRect().top;

                let placement;
                if (targetPos < topSpaceHeight + height / 2) {
                    placement = 'bottom';
                    targetPos += $target.height();
                } else {
                    placement = 'top';
                }

                const modalWidth = () => width - modalMargin * 2;

                const modalHeight = () => (placement === 'bottom'
                    ? height - modalMargin - targetPos
                    : targetPos - modalMargin);

                const bubbles = it.bubbles || [];

                openModal('BubblesList', {
                    group: `${browserId}:channelMain`,
                    btnClose: true,
                    onClose: this.onModalClose,
                    onClosed: this.onModalClosed,
                    element: target,
                    bubbles,
                    placement,
                    width: modalWidth,
                    height: modalHeight,
                    onItemClick: this.onModalItemClick,
                });
            },
        );

        const {
            browser: { tracker },
            channel: { id: channelId, snippet: { title: channelTitle = '' } = {} },
        } = this.context;

        tracker.screenEvent(
            'Tab list item click',
            `${channelTitle} - ${_.get(it, 'label', '')}`,
            channelId,
        );
    }

    onModalClose() {
        this.setState({
            selectedItemIndex: null,
        });
    }

    // eslint-disable-next-line
    onModalClosed() {}

    onModalItemClick(e, it) {
        const { updateBrowser } = this.props;
        const {
            browser: { id: browserId },
        } = this.context;
        updateBrowser(browserId, {
            view: 'channel:bubbles',
            bubbleId: it.id,
        });
    }

    render() {
        const {
            width, height, layout, ready, active, filteredBubbles,
        } = this.props;
        const { selectedItemIndex } = this.state;
        const ListComponent = Utils.getComponentFromType(ListComponents, layout || 'list');

        return (
            <div
                className="tab tab-list"
                ref={(ref) => {
                    this.refContainer = ref;
                }}
            >
                <ListComponent
                    active={ready && active}
                    width={width}
                    height={height}
                    items={filteredBubbles}
                    onItemClick={this.onItemClick}
                    onItemSelected={this.onItemSelected}
                    selectedItemIndex={selectedItemIndex}
                />
            </div>
        );
    }
}

TabList.propTypes = propTypes;
TabList.defaultProps = defaultProps;
TabList.contextTypes = contextTypes;

const WithStateContainer = connect(
    null,
    dispatch => ({
        updateBrowser: (id, props) => dispatch(NavigationActions.updateBrowser(id, props)),
        openModal: (name, props) => dispatch(ModalsActions.open(name, props)),
    }),
)(TabList);

export default WithStateContainer;
