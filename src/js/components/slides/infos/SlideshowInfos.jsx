/* eslint-disable react/no-danger */
import React, { PureComponent } from 'react';
// import PropTypes from 'prop-types';
import get from 'lodash/get';

import Utils from '../../../lib/utils';
import * as AppPropTypes from '../../../lib/PropTypes';

const propTypes = {
    data: AppPropTypes.bubble.isRequired,
};

const defaultProps = {};

class SlideshowInfos extends PureComponent {
    static getSubtitle(data) {
        const startDate = get(data, 'fields.date.moment.start', null);
        const endDate = get(data, 'fields.date.moment.end', null);
        let subtitle;
        if ((startDate !== null && startDate.isValid()) || (endDate !== null && endDate.isValid())) {
            const dateHours = Utils.getDateHours(startDate, endDate);
            subtitle =
                startDate.format('dddd D MMMM') + (dateHours !== null ? `, ${dateHours}` : '');
        } else {
            subtitle = (get(data, 'snippet.subtitle', null) || '').replace('/', '/&#8203;');
        }
        return subtitle;
    }

    constructor(props) {
        super(props);

        this.state = {
            subtitle: SlideshowInfos.getSubtitle(props.data),
        };
    }

    componentWillReceiveProps({ data: nextData }) {
        const { data } = this.props;
        if (data !== nextData) {
            this.setState({
                subtitle: SlideshowInfos.getSubtitle(nextData),
            });
        }
    }

    render() {
        const { data } = this.props;
        const { subtitle } = this.state;
        const typeLabel = (get(data, 'type_name', null) || '').replace('/', '/&#8203;');
        const title = (get(data, 'snippet.title', null) || '').replace('/', '/&#8203;');

        return (
            <div className="slide-cover-infos">
                <div className="slide-cover-type" dangerouslySetInnerHTML={{ __html: typeLabel }} />
                <div className="slide-cover-title" dangerouslySetInnerHTML={{ __html: title }} />
                <div
                    className="slide-cover-subtitle"
                    dangerouslySetInnerHTML={{ __html: subtitle }}
                />
            </div>
        );
    }
}

SlideshowInfos.propTypes = propTypes;
SlideshowInfos.defaultProps = defaultProps;

export default SlideshowInfos;
