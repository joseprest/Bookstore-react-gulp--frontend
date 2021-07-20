import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import debounce from 'lodash/debounce';
import $ from 'jquery';
import ItemBubbleCover from './ItemBubbleCover';

const propTypes = {
    data: PropTypes.array, // eslint-disable-line react/forbid-prop-types
    showImage: PropTypes.bool,
    scroll: PropTypes.number,
};

const defaultProps = {
    showImage: false,
    scroll: 0,
    data: [],
};

class ItemBubbleCoverRow extends PureComponent {
    constructor(props) {
        super(props);

        this.renderCover = this.renderCover.bind(this);
        this.updateShowImage = this.updateShowImage.bind(this);
        this.updateShowImageDebounced = debounce(this.updateShowImage, 200);

        this.refContainer = null;

        this.state = {
            showImage: false,
        };
    }

    componentDidMount() {
        const { showImage } = this.props;
        if (showImage) {
            this.updateShowImageDebounced();
        }
    }

    componentDidUpdate({ scroll: prevScroll, showImage: prevShowImage }) {
        const { scroll, showImage } = this.props;
        const scrollChanged = prevScroll !== scroll;
        const showImageChanged = prevShowImage !== showImage;
        if (scrollChanged || showImageChanged) {
            this.updateShowImageDebounced();
        }
    }

    componentWillUnmount() {
        if (this.updateShowImageDebounced !== null) {
            this.updateShowImageDebounced.cancel();
        }
    }

    updateShowImage() {
        const { showImage } = this.state;
        if (showImage) {
            return;
        }

        this.setState({
            showImage: this.checkIfVisible(),
        });
    }

    checkIfVisible() {
        const $el = $(this.refContainer);
        // const $parent = $el.parents('.react-list-list').eq(0);
        const $container = $el.parents('.list-container').eq(0);
        const rowTop = $el.offset().top;
        const containerTop = $container.offset().top;
        const y = rowTop;
        const minY = 0 - containerTop;
        const maxY = window.innerHeight + containerTop;
        if (y > minY && y < maxY) {
            return true;
        }
        return false;
    }

    renderCover(item, index) {
        const { data, showImage, ...props } = this.props;
        const { showImage: realShowImage } = this.state;
        return (
            <ItemBubbleCover
                key={`item-${index}`}
                data={item}
                {...props}
                showImage={!(!showImage || !realShowImage)}
                index={index}
            />
        );
    }

    render() {
        const { data } = this.props;

        const style = {
            // backgroundColor: this.state.showImage ? '#ffcc00':'transparent'
        };

        return (
            <div
                className="list-item list-item-bubble-cover-row"
                ref={(ref) => {
                    this.refContainer = ref;
                }}
                style={style}
            >
                {data.map(this.renderCover)}
            </div>
        );
    }
}

ItemBubbleCoverRow.propTypes = propTypes;
ItemBubbleCoverRow.defaultProps = defaultProps;

export default ItemBubbleCoverRow;
