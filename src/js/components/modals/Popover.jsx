import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import isFunction from 'lodash/isFunction';
import classNames from 'classnames';

const propTypes = {
    width: PropTypes.oneOfType([PropTypes.number, PropTypes.func]),
    height: PropTypes.oneOfType([PropTypes.number, PropTypes.func]),
    point: PropTypes.oneOfType([
        PropTypes.shape({
            x: PropTypes.number,
            y: PropTypes.number,
        }),
        PropTypes.func,
    ]),
    className: PropTypes.string,
    title: PropTypes.string,
    element: PropTypes.any, // eslint-disable-line react/forbid-prop-types
    placement: PropTypes.oneOf(['auto', 'top', 'bottom', 'left', 'right']),
    children: PropTypes.node,
    offsetX: PropTypes.number,
    offsetY: PropTypes.number,
    btnClose: PropTypes.bool,
    closeModal: PropTypes.func,
};

const defaultProps = {
    width: null,
    height: null,
    className: '',
    placement: 'auto',
    title: null,
    element: null,
    point: null,
    children: null,
    offsetX: 0,
    offsetY: 0,
    btnClose: false,
    closeModal: null,
};

class Popover extends PureComponent {
    // eslint-disable-next-line no-unused-vars
    static getPlacementFromPoint(point) {
        // @TODO Incomplete
        // const { innerWidth: windowWidth, innerHeight: windowHeight } = window;
        //
        // const spaceLeft = point.x;
        // const spaceRight = windowWidth - spaceLeft;
        // const spaceTop = point.y;
        // const spaceBottom = windowHeight - spaceTop;

        return 'bottom';
    }

    constructor(props) {
        super(props);

        this.onResize = this.onResize.bind(this);
        this.onClickClose = this.onClickClose.bind(this);
        this.onOpen = this.onOpen.bind(this);

        this.popoverHeight = null;
        this.refContainer = null;
        this.refPopover = null;

        this.state = {
            position: null,
        };
    }

    componentDidMount() {
        window.addEventListener('resize', this.onResize, false);
        this.updatePosition();
    }

    componentDidUpdate() {
        if (this.sizeChanged()) {
            this.updatePosition();
        }
    }

    componentWillUnmount() {
        window.removeEventListener('resize', this.onResize);
    }

    onClickClose() {
        const { closeModal } = this.props;
        if (closeModal !== null) {
            closeModal();
        }
    }

    onResize() {
        this.updatePosition();
    }

    onOpen() {
        this.updatePosition();
    }

    getPositionFromPoint(point, opts) {
        const options = {
            placement: 'auto',
            offsetY: 0,
            offsetX: 0,
            ...opts,
        };

        const finalPoint = isFunction(point) ? point() : point;

        const {
            width: containerWidth,
            // height: containerHeight,
        } = this.refContainer.getBoundingClientRect();
        const {
            width: popoverWidth,
            height: popoverHeight,
        } = this.refPopover.getBoundingClientRect();
        // const maxTop = containerHeight - popoverHeight - options.offsetY;
        const maxLeft = containerWidth - popoverWidth - options.offsetX;

        const placement =
            options.placement === 'auto'
                ? Popover.getPlacementFromPoint(finalPoint)
                : options.placement;

        const position = {
            placement,
        };

        if (placement === 'top') {
            position.top = finalPoint.y - popoverHeight - options.offsetY;
            position.left = finalPoint.x - popoverWidth / 2 - options.offsetX;
            position.left = Math.min(position.left, maxLeft);
        } else if (placement === 'bottom') {
            position.top = finalPoint.y + options.offsetY;
            position.left = finalPoint.x - popoverWidth / 2 - options.offsetX;
            position.left = Math.min(position.left, maxLeft);
        } else if (placement === 'left') {
            position.top = finalPoint.y - popoverHeight / 2 - options.offsetY;
            position.left = finalPoint.x - popoverWidth - options.offsetX;
        } else if (placement === 'right') {
            position.top = finalPoint.y - popoverHeight / 2 - options.offsetY;
            position.left = finalPoint.x + options.offsetX;
        }

        return position;
    }

    getPositionFromElement(element, opts) {
        const options = {
            placement: 'auto',
            offsetY: 0,
            offsetX: 0,
            ...opts,
        };

        const {
            width: containerWidth,
            // height: containerHeight,
            top: containerTop,
            left: containerLeft,
        } = this.refContainer.getBoundingClientRect();
        const {
            width: popoverWidth,
            height: popoverHeight,
        } = this.refPopover.getBoundingClientRect();
        const {
            width: elementWidth,
            height: elementHeight,
            top: elementTop,
            left: elementLeft,
        } = element.getBoundingClientRect();
        const elementOffset = {
            top: elementTop - containerTop,
            left: elementLeft - containerLeft,
        };

        // const maxTop = containerHeight - popoverHeight - options.offsetY;
        const maxLeft = containerWidth - popoverWidth - options.offsetX;

        const placement =
            options.placement === 'auto'
                ? this.getPlacementFromElement(element)
                : options.placement;

        const position = {
            placement,
        };

        if (placement === 'top') {
            position.top = elementOffset.top - popoverHeight - options.offsetY;
            // prettier-ignore
            position.left = (
                elementOffset.left - (popoverWidth - elementWidth) / 2 - options.offsetX
            );
            position.left = Math.min(position.left, maxLeft);
        } else if (placement === 'bottom') {
            position.top = elementOffset.top + elementHeight + options.offsetY;
            // prettier-ignore
            position.left = (
                elementOffset.left - (popoverWidth - elementWidth) / 2 - options.offsetX
            );
            position.left = Math.min(position.left, maxLeft);
        } else if (placement === 'left') {
            // prettier-ignore
            position.top = (
                elementOffset.top - (popoverHeight - elementHeight) / 2 - options.offsetY
            );
            position.left = elementOffset.left - popoverWidth - options.offsetX;
        } else if (placement === 'right') {
            // prettier-ignore
            position.top = (
                elementOffset.top - (popoverHeight - elementHeight) / 2 - options.offsetY
            );
            position.left = elementOffset.left + elementWidth + options.offsetX;
        }

        return position;
    }

    getPlacementFromElement(element) {
        const {
            width: popoverWidth,
            height: popoverHeight,
        } = this.refPopover.getBoundingClientRect();
        const elementOffset = element.getBoundingClientRect();

        const { innerWidth: windowWidth, innerHeight: windowHeight } = window;

        const spaceBottom = windowHeight - elementOffset.bottom;
        const spaceLeft = elementOffset.left;
        const spaceTop = elementOffset.top;
        const spaceRight = windowWidth - elementOffset.right;

        if (spaceRight >= popoverWidth) {
            return 'right';
        }
        if (spaceLeft >= popoverWidth) {
            return 'left';
        }
        if (spaceTop >= popoverHeight) {
            return 'top';
        }
        if (spaceBottom >= popoverHeight) {
            return 'bottom';
        }

        return 'bottom';
    }

    updatePosition() {
        const { point, element, placement, offsetX, offsetY } = this.props;
        const { position: currentPosition } = this.state;
        const popover = this.refPopover;
        if (popover === null) {
            return;
        }

        const opts = {
            placement,
            offsetX,
            offsetY,
        };
        let position;
        if (point !== null) {
            position = this.getPositionFromPoint(point, opts);
        } else if (element !== null) {
            position = this.getPositionFromElement(element, opts);
        }

        const newPosition = {
            ...currentPosition,
            ...position,
        };

        if (newPosition !== currentPosition) {
            this.setState({
                position,
            });
        }
    }

    sizeChanged() {
        const height = this.refContainer.offsetHeight;
        if (this.popoverHeight !== height) {
            this.popoverHeight = height;
            return true;
        }

        return false;
    }

    render() {
        const {
            width: getWidth,
            height: getHeight,
            className,
            btnClose,
            title,
            children,
        } = this.props;
        const { position } = this.state;
        const { placement = null } = position || {};

        const popoverStyle = {
            width: isFunction(getWidth) ? getWidth() : getWidth,
            height: isFunction(getHeight) ? getHeight() : getHeight,
            ...position,
        };

        return (
            <div
                className="popover-container"
                ref={ref => {
                    this.refContainer = ref;
                }}
            >
                <button type="button" className="popover-safe" onClick={this.onClickClose} />
                <div
                    ref={ref => {
                        this.refPopover = ref;
                    }}
                    className={classNames([
                        'popover',
                        {
                            [className]: className !== null,
                            [placement]: placement !== null,
                        },
                    ])}
                    style={popoverStyle}
                >
                    <div className="arrow" />
                    <h3 className="popover-title">{title}</h3>
                    <div className="popover-content">{children}</div>
                    {btnClose ? (
                        <button type="button" className="btn-close" onClick={this.onClickClose} />
                    ) : null}
                </div>
            </div>
        );
    }
}

Popover.propTypes = propTypes;
Popover.defaultProps = defaultProps;

export default Popover;
