import React, { Component } from 'react';
import PropTypes from 'prop-types';

import Text from '../../../lib/text';
import Button from '../../partials/Button';

const propTypes = {
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,

    title: PropTypes.string,
    description: PropTypes.string,

    onButtonClick: PropTypes.func,
};

const defaultProps = {
    title: null,
    description: null,

    onButtonClick: null,
};

class SlideSummary extends Component {
    constructor(props) {
        super(props);

        this.refContainer = null;
        this.refTitle = null;
        this.refButton = null;

        this.state = {
            descriptionHeight: null,
        };
    }

    componentDidMount() {
        this.updateDescriptionHeight();
    }

    componentDidUpdate({ width: prevWidth, height: prevHeight }) {
        const { width, height } = this.props;
        const sizeChanged = prevWidth !== width || prevHeight !== height;

        if (sizeChanged) {
            this.updateDescriptionHeight();
        }
    }

    getDescriptionHeight() {
        let height = this.refContainer.offsetHeight - this.refButton.offsetHeight;

        if (this.refTitle !== null) {
            height -= this.refTitle.offsetHeight;
        }

        return height;
    }

    updateDescriptionHeight() {
        this.setState({
            descriptionHeight: this.getDescriptionHeight(),
        });
    }

    renderTitle() {
        const { title } = this.props;

        if (title === null) {
            return null;
        }

        return (
            <div
                className="slide-summary-title"
                ref={(ref) => {
                    this.refTitle = ref;
                }}
            >
                {title}
            </div>
        );
    }

    renderDescription() {
        const { description } = this.props;
        const { descriptionHeight } = this.state;

        if (description === null) {
            return null;
        }

        const style = {
            height: descriptionHeight,
        };

        return (
            <div className="slide-summary-description" style={style}>
                {description}
            </div>
        );
    }

    renderButton() {
        const { onButtonClick } = this.props;
        return (
            <div
                className="slide-summary-button"
                ref={(ref) => {
                    this.refButton = ref;
                }}
            >
                <Button icon="right" iconPosition="right" onClick={onButtonClick}>
                    {Text.t('btn_summary')}
                </Button>
            </div>
        );
    }

    render() {
        const title = this.renderTitle();
        const description = this.renderDescription();
        const button = this.renderButton();

        return (
            <div
                className="slide-summary"
                ref={(ref) => {
                    this.refContainer = ref;
                }}
            >
                <div className="slide-summary-content">
                    {title}
                    {description}
                    {button}
                </div>
            </div>
        );
    }
}

SlideSummary.propTypes = propTypes;
SlideSummary.defaultProps = defaultProps;

export default SlideSummary;
