import React, { Component } from 'react';
import PropTypes from 'prop-types';
import get from 'lodash/get';
import { connect } from 'react-redux';

import Button from '../../partials/Button';
import NavigationActions from '../../../actions/NavigationActions';
import * as ManivellePropTypes from '../../../lib/PropTypes';
import Text from '../../../lib/text';
import Utils from '../../../lib/utils';
import Colors from '../../../lib/colors';

import Scrollable from '../../helpers/Scrollable';

const propTypes = {
    // bubbles: ManivellePropTypes.bubbles.isRequired,
    // width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
    // topBarHeight: PropTypes.number.isRequired,
    // active: PropTypes.bool.isRequired,
    // ready: PropTypes.bool.isRequired,
    showAllFiltersCard: PropTypes.bool,
    allFiltersCardLabel: PropTypes.string,
    updateBrowser: PropTypes.func.isRequired,
};

const defaultProps = {
    showAllFiltersCard: true,
    allFiltersCardLabel: 'all_categories',
};

const contextTypes = {
    browser: ManivellePropTypes.browser,
    channel: ManivellePropTypes.channel,
    data: ManivellePropTypes.dataRepository,
};

class ChannelFiltersCards extends Component {
    constructor(props) {
        super(props);

        this.onButtonClick = this.onButtonClick.bind(this);
        this.renderCard = this.renderCard.bind(this);
    }

    onButtonClick(e, card) {
        const { updateBrowser } = this.props;
        const {
            browser: { id: browserId },
        } = this.context;
        const { bubbles = [], label } = card;
        const bubbleId = bubbles.length > 0 ? bubbles[0].id : null;
        if (bubbleId === null) {
            console.warn('No bubbles associated with:', label);
            return;
        }

        updateBrowser(browserId, {
            view: 'channel:bubbles',
            bubbleId,
            bubblesIds: bubbles.map(bubble => bubble.id),
        });
    }

    getChannelFilter() {
        const { channel } = this.context;
        const filters = get(channel, 'filters', []);
        const filterName = get(channel, 'fields.settings.channelFilterName', null);

        let filter;

        if (filterName === null) {
            // get first filter
            filter = filters.length ? filters[0] : null;
        } else {
            filter = filters.find(it => it.name === filterName);
        }

        return filter;
    }

    getCardsFromFilter({ name: filterName }) {
        const { showAllFiltersCard, allFiltersCardLabel } = this.props;
        const {
            channel: {
                id: channelId,
                fields: { settings: channelSettings = {} },
            },
            data,
        } = this.context;
        const colorType = `card-${filterName}`;
        const colorPalette = get(channelSettings, 'colorPalette', null);

        const channelFilterValues = data.getChannelFilter(channelId, filterName);

        let totalBubbles = [];

        const cards = channelFilterValues.map(
            ({ value = 'value', label = 'Label', bubbles = [] }) => {
                const color = Colors.get(colorType, value, colorPalette);
                totalBubbles = totalBubbles.concat(bubbles);
                return {
                    label,
                    color,
                    bubbles,
                };
            },
        );

        if (showAllFiltersCard) {
            cards.push({
                label: Text.t(allFiltersCardLabel),
                color: Colors.get(colorType, 'all-cards', colorPalette),
                bubbles: totalBubbles,
            });
        }

        return cards;
    }

    renderCard(card, index) {
        const { label: title = 'Label', bubbles = [], color } = card;
        const onClick = e => this.onButtonClick(e, card, index);
        const count = bubbles.length;
        const shadowColor = Utils.getShadeColor(color, -30);
        const textColor = Utils.colorIsDark(color) ? '#FFF' : '#000';
        return (
            <Button
                className="btn btn-card"
                key={`btn-${index}`}
                onClick={onClick}
                color={color}
                shadowColor={shadowColor}
            >
                <div
                    className="card-inner"
                    style={{
                        color: textColor,
                    }}
                >
                    <div className="filter-label">{title}</div>
                    <div className="bubbles-count-label">{`${count} question${
                        count > 1 ? 's' : ''
                    }`}</div>
                </div>
            </Button>
        );
    }

    render() {
        const { height } = this.props;

        const filter = this.getChannelFilter();
        const cards = this.getCardsFromFilter(filter);

        return (
            <Scrollable>
                <div
                    className="channel-filters-cards"
                    style={{
                        height,
                    }}
                >
                    <div className="cards-container">
                        <div className="cards-list">{cards.map(this.renderCard)}</div>
                    </div>
                </div>
            </Scrollable>
        );
    }
}

ChannelFiltersCards.propTypes = propTypes;
ChannelFiltersCards.contextTypes = contextTypes;
ChannelFiltersCards.defaultProps = defaultProps;

const WithStateContainer = connect(
    null,
    dispatch => ({
        updateBrowser: (id, props) => dispatch(NavigationActions.updateBrowser(id, props)),
    }),
)(ChannelFiltersCards);
export default WithStateContainer;
