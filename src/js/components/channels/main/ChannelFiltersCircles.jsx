import React from 'react';
import PropTypes from 'prop-types';
import ReactDOM from 'react-dom';
import _ from 'lodash';

import Button from '../../partials/Button';
import Circles from '../../partials/Circles';
import Utils from '../../../lib/utils';
import Text from '../../../lib/text';
import Colors from '../../../lib/colors';

import ModalsActions from '../../../actions/ModalsActions';
import NavigationActions from '../../../actions/NavigationActions';

const ChannelFiltersCircles = React.createClass({
    propTypes: {
        bubbles: PropTypes.array.isRequired,
        width: PropTypes.number.isRequired,
        height: PropTypes.number.isRequired,
        topBarHeight: PropTypes.number.isRequired,
        active: PropTypes.bool.isRequired,
        ready: PropTypes.bool.isRequired,

        modalMargin: PropTypes.number,
        maxCirclesWithoutFilters: PropTypes.number,
    },

    contextTypes: {
        browser: PropTypes.object,
        channel: PropTypes.object,
        data: PropTypes.object,
        store: PropTypes.object,
    },

    getDefaultProps() {
        return {
            modalMargin: 100,
            maxCirclesWithoutFilters: 50,
        };
    },

    getInitialState() {
        const selectedFilters = []; // pourrait partir d'une prop
        return {
            selectedFilters,
            circlesItems: this.getCirclesItems(selectedFilters),
            circleSelected: false,
            circlesHeight: null,
        };
    },

    render() {
        const filters = this.renderFilters();
        const circles = this.renderCircles();

        return (
            <div className="channel-filters-circles">
                {filters}
                {circles}
            </div>
        );
    },

    renderFilters() {
        const filters = this.context.channel.filters.map(this.renderFilter);

        return (
            <div ref="filtersContainer" className="filters-container">
                <ul className="filters">{filters}</ul>
            </div>
        );
    },

    renderFilter(filter, index) {
        const selected = this.state.selectedFilters.indexOf(index) >= 0;

        const label = _.get(filter, 'label');
        const name = _.get(filter, 'name');
        const color = Colors.get('filter-circles', name, this.props.colorPalette);
        const shadowColor = Utils.getShadeColor(color, -30);

        const onClick = _.bind(function (e) {
            this.onFilterClick(e, filter, index);
        }, this);

        let backgroundStyle;

        let className = 'filter';
        if (selected) {
            className += ' selected';
            backgroundStyle = {
                backgroundColor: color,
            };
        }

        const btnContentStyle = {
            color: Utils.colorIsDark(color) ? '#FFF' : '#000',
        };

        return (
            <li key={`filter-${index}`} className={className} {...Utils.onClick(onClick, 'end')}>
                <div className="background" style={backgroundStyle} />
                <Button color={color} shadowColor={shadowColor}>
                    <span className="btn-content" style={btnContentStyle}>
                        X
                    </span>
                </Button>
                <div className="label">{label}</div>
            </li>
        );
    },

    renderCircles() {
        const height = this.state.circlesHeight;

        if (height === null) {
            return;
        }

        const top = this.props.height - height;

        const style = {
            top,
            height,
        };

        const props = _.omit(this.props, ['height', 'bubbles', 'modalMargin', 'topBarHeight']); // tmp
        const selected = this.state.circleSelected;
        const items = this.state.circlesItems;

        return (
            <div className="circles-container" style={style}>
                <Circles
                    shuffleInitialItems={(this.state.selectedFilters || []).length === 0}
                    items={items}
                    selected={selected}
                    typeName={Text.t('propositions')}
                    height={height}
                    topSpaceHeight={top + this.props.topBarHeight}
                    onCircleSelected={this.onCircleSelected}
                    {...props}
                />
            </div>
        );
    },

    componentDidMount() {
        this.setState({
            circlesHeight: this.getCirclesHeight(),
        });
    },

    componentDidUpdate(prevProps, prevState) {
        const sizeChanged = prevProps.width !== this.props.width || prevProps.height !== this.props.height;

        const state = {};

        if (sizeChanged) {
            state.circlesHeight = this.getCirclesHeight();
        }

        if (_.values(state).length) {
            this.setState(state);
        }
    },

    getCirclesHeight() {
        const filtersContainer = ReactDOM.findDOMNode(this.refs.filtersContainer);
        const circlesHeight = this.props.height - filtersContainer.offsetHeight;

        return circlesHeight;
    },

    getCirclesItems(selectedFilters) {
        const { maxCirclesWithoutFilters } = this.props;
        selectedFilters = typeof selectedFilters !== 'undefined' ? selectedFilters : [];

        const { channel } = this.context;
        const channelId = channel.id;
        const channelFilters = _.get(this.context.channel, 'filters', []);

        const hasFilters = selectedFilters.length;
        const maxByFilters = maxCirclesWithoutFilters / channelFilters.length;

        const circlesItems = channelFilters.reduce((items, { name: filterName }, index) => {
            if (hasFilters && selectedFilters.indexOf(index) === -1) {
                return items;
            }

            const filterColor = Colors.get('filter-circles', filterName, this.props.colorPalette);

            const values = this.context.data
                .getChannelFilter(channelId, filterName)
                .sort((a, b) => {
                    const aBubbles = a.bubbles.length;
                    const bBubbles = b.bubbles.length;
                    if (aBubbles === bBubbles) {
                        return 0;
                    }
                    return aBubbles > bBubbles ? -1 : 1;
                });
            return values.slice(0, !hasFilters ? maxByFilters : values.length).reduce(
                (subItems, filterValue) => [
                    ...subItems,
                    {
                        color: filterColor,
                        value: filterValue.value,
                        label: filterValue.label,
                        bubbles: filterValue.bubbles,
                    },
                ],
                items,
            );
        }, []);

        return circlesItems;
    },

    /*
    Events handlers
    */

    onFilterClick(e, category, index) {
        const filterIndexPosition = this.state.selectedFilters.indexOf(index);

        const nextSelectedFilters = this.state.selectedFilters.concat();

        if (filterIndexPosition >= 0) {
            nextSelectedFilters.splice(filterIndexPosition, 1);
        } else {
            nextSelectedFilters.push(index);
        }

        this.setState({
            selectedFilters: nextSelectedFilters,
            circlesItems: this.getCirclesItems(nextSelectedFilters),
        });
    },

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
            function () {
                const positionPoint = _.bind(() => ({
                    x: shape.x + shape.width / 2,
                    y: shape.y + shape.height / 2 + shape.label.height / 2 + 20,
                }), this);

                const modalWidth = _.bind(function () {
                    return this.props.width - this.props.modalMargin * 2;
                }, this);

                const modalHeight = _.bind(function () {
                    return (
                        this.props.topBarHeight
                        + this.props.height
                        - positionPoint().y
                        - this.props.modalMargin
                    );
                }, this);

                const browserId = _.get(this.context.browser, 'id');

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
    },

    onModalClosed() {
        this.setState({
            circleSelected: false,
        });
    },
});

export default ChannelFiltersCircles;
