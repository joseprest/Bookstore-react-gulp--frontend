import React from 'react';
import PropTypes from 'prop-types';
import * as MarkerComponents from './markers';
import Utils from '../../lib/utils';

const PreviewWithLabelCountClusterIcon = React.createClass({
    propTypes: {
        type: PropTypes.string,
        typeKey: PropTypes.string,
        markers: PropTypes.array,
    },

    getDefaultProps() {
        return {};
    },

    getInitialState() {
        return {
            mergedMarkersData: this.getMergedMarkersData(this.props.markers),
        };
    },

    render() {
        const MarkerComponent = Utils.getComponentFromType(MarkerComponents, this.props.type);
        const props = {
            data: this.state.mergedMarkersData,
        };

        return (
            <div className="cluster-icon">
                <MarkerComponent {...props} />
            </div>
        );
    },

    componentWillReceivePrps(nextProps) {
        if (this.props.markers !== nextProps.markers) {
            this.setState({
                mergedMarkersData: this.getMergedMarkersData(nextProps.markers),
            });
        }
    },

    getMergedMarkersData(markers) {
        const labelsMap = {};
        let labelHighestCount = 0;
        let label = null;
        let count = 0;
        let bubbles = [];
        const { typeKey } = this.props;

        for (let i = 0, il = markers.length; i < il; i++) {
            const marker = markers[i];

            let markerLabel = _.get(marker, `data.${typeKey}`, null);
            markerLabel = markerLabel === null ? _.get(marker, 'data.label') : markerLabel;
            if (markerLabel) {
                let markerLabelCount = labelsMap[markerLabel];
                if (typeof markerLabelCount === 'undefined') {
                    markerLabelCount = 0;
                }
                markerLabelCount++;

                if (labelHighestCount < markerLabelCount) {
                    labelHighestCount = markerLabelCount;
                    label = markerLabel;
                }
            }

            count += _.get(marker, 'data.count', 0);
            bubbles = bubbles.concat(_.get(marker, 'data.bubbles', []));
        }

        return {
            label,
            count,
            bubbles,
        };
    },
});

export default PreviewWithLabelCountClusterIcon;
