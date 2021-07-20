import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import isEmpty from 'lodash/isEmpty';

import Utils from '../../lib/utils';
import Text from '../../lib/text';
import * as KeyboardLayouts from './layouts';

const propTypes = {
    layout: PropTypes.string,
    alternativeLayout: PropTypes.string,
    value: PropTypes.string,
    hasInput: PropTypes.bool,
    safeClickClose: PropTypes.bool,
    children: PropTypes.node,

    onClose: PropTypes.func,
    onChange: PropTypes.func,
    onEnter: PropTypes.func,
    onKeyPress: PropTypes.func,
    onKeyUp: PropTypes.func,
    onKeyDown: PropTypes.func,
};

const defaultProps = {
    layout: 'normal',
    alternativeLayout: null,
    value: null,
    hasInput: false,
    safeClickClose: true,
    children: null,

    onClose: null,
    onChange: null,
    onEnter: null,
    onKeyPress: null,
    onKeyUp: null,
    onKeyDown: null,
};

class Keyboard extends PureComponent {
    constructor(props) {
        super(props);

        this.onClickSafe = this.onClickSafe.bind(this);
        this.onClickClose = this.onClickClose.bind(this);
        this.onLayoutKeyDown = this.onLayoutKeyDown.bind(this);
        this.onLayoutKeyPress = this.onLayoutKeyPress.bind(this);
        this.onLayoutKeyUp = this.onLayoutKeyUp.bind(this);

        this.state = {
            value: null,
            shift: false,
        };
    }

    onClickSafe(e) {
        const { safeClickClose, onClose } = this.props;
        e.preventDefault();

        if (safeClickClose && onClose !== null) {
            onClose(e);
        }
    }

    onClickClose(e) {
        const { onClose } = this.props;
        e.preventDefault();

        if (onClose !== null) {
            onClose(e);
        }
    }

    onLayoutKeyDown(e) {
        const { onKeyDown } = this.props;
        if (onKeyDown !== null) {
            onKeyDown(e);
        }
    }

    onLayoutKeyPress(e) {
        const { onKeyPress } = this.props;
        if (onKeyPress !== null) {
            onKeyPress(e);
        }
    }

    onLayoutKeyUp(e) {
        const { onKeyUp, onEnter } = this.props;
        const { value: currentValue } = this.state;
        if (onKeyUp !== null) {
            onKeyUp(e);
        }

        let value = currentValue || '';

        if (e.key === 'shift') {
            this.setState(({ shift }) => ({
                shift: !shift,
            }));
        } else if (e.key === 'backspace') {
            value = !value.length ? '' : value.substr(0, value.length - 1);
            this.updateValue(value);
        } else if (e.key === 'return') {
            value += '\n';
            this.updateValue(value);
        } else if (e.key === 'enter') {
            if (onEnter !== null) {
                onEnter(e);
            }
        } else if (e.key === 'space') {
            value += ' ';
            this.updateValue(value);
        } else if (e.key.length) {
            value += (`${e.key}`);
            this.updateValue(value);
        }
    }

    updateValue(value) {
        this.setState(
            {
                value,
            },
            () => {
                const { onChange } = this.props;
                const { value: newValue } = this.state;
                if (onChange !== null) {
                    onChange(newValue);
                }
            },
        );
    }

    renderLayout() {
        const { alternativeLayout, layout, ...layoutProps } = this.props;
        const { shift } = this.state;
        const LayoutComponent = Utils.getComponentFromType(KeyboardLayouts, layout);
        const alternative = alternativeLayout || Text.locale.toLowerCase(0);

        return (
            <LayoutComponent
                {...layoutProps}
                onKeyDown={this.onLayoutKeyDown}
                onKeyPress={this.onLayoutKeyPress}
                onKeyUp={this.onLayoutKeyUp}
                shift={shift}
                alternative={!isEmpty(alternative) ? alternative : null}
            />
        );
    }

    render() {
        const { hasInput, value, children } = this.props;
        let input = null;
        if (children) {
            input = <div className="keyboard-input">{children}</div>;
        } else if (hasInput) {
            input = (
                <div className="keyboard-input">
                    <input
                        type="text"
                        className="input-text"
                        value={value}
                        disabled="disabled"
                    />
                </div>
            );
        }

        const layout = this.renderLayout();

        return (
            <div className="keyboard-container">
                <div className="keyboard-safe" {...Utils.onClick(this.onClickSafe)} />
                <div className="keyboard">
                    <div className="keyboard-inner">
                        <button
                            type="button"
                            className="btn btn-close"
                            {...Utils.onClick(this.onClickClose)}
                        />

                        {input}

                        <div className="keyboard-layout-container">{layout}</div>
                    </div>
                </div>
            </div>
        );
    }
}

Keyboard.propTypes = propTypes;
Keyboard.defaultProps = defaultProps;

export default Keyboard;
