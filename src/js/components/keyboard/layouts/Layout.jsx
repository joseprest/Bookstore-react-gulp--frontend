/* globals Modernizr: true */
import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import isArray from 'lodash/isArray';
import isObject from 'lodash/isObject';
import isEmpty from 'lodash/isEmpty';
import get from 'lodash/get';
import $ from 'jquery';
import { TweenMax } from 'gsap/TweenMax';
import classNames from 'classnames';

const propTypes = {
    keys: PropTypes.oneOfType([PropTypes.array, PropTypes.objectOf(PropTypes.array)]),
    alternative: PropTypes.string,
    shift: PropTypes.bool,
    holdKeyTimerDuration: PropTypes.number,
    animationDuration: PropTypes.number,

    onKeyUp: PropTypes.func,
    onKeyDown: PropTypes.func,
    onKeyPress: PropTypes.func,
};

const defaultProps = {
    keys: [],
    alternative: null,
    shift: false,
    holdKeyTimerDuration: 0.3,
    animationDuration: 0.15,

    onKeyUp: null,
    onKeyDown: null,
    onKeyPress: null,
};

class KeyboardLayout extends PureComponent {
    static getKeys(keys, alternative) {
        if (isArray(keys)) {
            return keys;
        }
        const alternativeName = alternative || 'default';
        return keys[alternativeName] || keys.default;
    }

    static getKeyObjectFromKey(key, rowIndex, keyIndex) {
        const keyObject = !isObject(key)
            ? {
                label: key,
            }
            : key;
        const { label = '', icon = null, key: keyName = null } = keyObject;
        const { code = keyName !== null ? keyName.charCodeAt(0) : null } = keyObject;
        const labelString = `${label}`;
        const spacerMatches = (keyName || labelString).match(/^spacer-([0-9]+)/);

        return {
            id: `${code || label || icon}-${rowIndex}-${keyIndex}`,
            type: 'key',
            code,
            shift: labelString.toUpperCase(),
            spacer: spacerMatches ? parseInt(spacerMatches[1], 10) : false,
            icon,
            ...keyObject,
            label: labelString,
        };
    }

    static buildKeysFromArray(keysArray) {
        const rows = keysArray.map((row, rowIndex) => {
            const rowKeys = isArray(row) ? row : row.keys;
            return {
                id: rowIndex,
                ...(isObject(row) ? row : null),
                keys: rowKeys.map((key, keyIndex) => {
                    const { alternates = [], ...keyObject } = KeyboardLayout.getKeyObjectFromKey(
                        key,
                        rowIndex,
                        keyIndex,
                    );
                    return {
                        ...keyObject,
                        alternates,
                        alternatesObject: {
                            // prettier-ignore
                            keys: alternates.map((alternate, alternateIndex) => (
                                KeyboardLayout.getKeyObjectFromKey(alternate, 0, alternateIndex)
                            )),
                        },
                    };
                }),
            };
        });

        return rows;
    }

    constructor(props) {
        super(props);

        this.renderRow = this.renderRow.bind(this);
        this.onKeyMouseDown = this.onKeyMouseDown.bind(this);
        this.onKeyMouseUp = this.onKeyMouseUp.bind(this);
        this.onKeyHolded = this.onKeyHolded.bind(this);
        this.onContextMenu = this.onContextMenu.bind(this);
        this.onMouseUp = this.onMouseUp.bind(this);

        this.holdKeyTimer = null;
        this.refAlternateKeys = null;
        this.holdKeyTween = null;

        this.state = {
            keys: KeyboardLayout.buildKeysFromArray(
                KeyboardLayout.getKeys(props.keys, props.alternative),
            ),
            holdingKey: null,
        };
    }

    componentDidMount() {
        window.addEventListener('contextmenu', this.onContextMenu);
        window.addEventListener('mouseup', this.onMouseUp);
    }

    componentWillUnmount() {
        window.removeEventListener('contextmenu', this.onContextMenu);
        window.removeEventListener('mouseup', this.onMouseUp);
        this.clearHoldTimer();
        if (this.holdKeyTween !== null) {
            this.holdKeyTween.kill();
            this.holdKeyTween = null;
        }
    }

    onMouseUp() {
        this.clearHoldedKey();
    }

    // eslint-disable-next-line class-methods-use-this
    onContextMenu(e) {
        e.preventDefault();
    }

    onKeyMouseDown(e, key) {
        const { holdKeyTimerDuration, onKeyDown, onKeyPress } = this.props;
        this.clearHoldTimer();
        const { alternates = [] } = key;

        if (alternates.length) {
            this.holdKeyTimer = setTimeout(this.onKeyHolded, holdKeyTimerDuration * 1000, key);
        }

        if (onKeyDown !== null) {
            const ev = this.createKeyboardEvent('keydown', key);
            onKeyDown(ev);
        }

        if (onKeyPress !== null) {
            const ev = this.createKeyboardEvent('keypress', key);
            onKeyPress(ev);
        }
    }

    onKeyMouseUp(e, key) {
        const { onKeyUp } = this.props;
        const { keys } = this.state;
        this.clearHoldedKey();

        let finalKey = key;
        if (typeof e.changedTouches !== 'undefined') {
            // since touchEnd is tied to the touchStarted element, we need to
            // manually check what is the element where the finger was released
            const changedTouch = e.changedTouches[0];
            const elem = document.elementFromPoint(changedTouch.clientX, changedTouch.clientY);
            if (!$(elem).is('.btn-keyboard-key')) {
                return;
            }

            // the element is a valid keyboard button key, we need to retrieve
            // it's key object from the state
            const $parent = $(elem).parent();
            const index = $parent.index();
            const rowIndex = $parent.parent().index();
            const $keyParent = $parent.parents('.keyboard-key');
            const isAlternate = $keyParent.length === 1;

            let keyString;

            if (isAlternate) {
                const parentIndex = $keyParent.index();
                const parentRowIndex = $keyParent.parent().index();
                keyString = `${parentRowIndex}.keys.${parentIndex}.alternatesObject.keys.${index}`;
            } else {
                keyString = `${rowIndex}.keys.${index}`;
            }

            finalKey = get(keys, keyString);
        }

        if (onKeyUp !== null) {
            const ev = this.createKeyboardEvent('keyup', finalKey);
            onKeyUp(ev);
        }
    }

    onKeyHolded(key) {
        const { animationDuration } = this.props;
        this.setState(
            {
                holdingKey: key,
            },
            () => {
                this.holdKeyTween = TweenMax.from(this.refAlternateKeys, animationDuration, {
                    scale: 0,
                });
            },
        );
    }

    createKeyboardEvent(type, key) {
        const { shift } = this.props;
        const e = $.Event(type);
        e.which = key.code;
        e.key = key.key || (shift ? key.shift : key.label);
        e.keyboardKey = key;

        return e;
    }

    clearHoldTimer() {
        if (this.holdKeyTimer) {
            clearTimeout(this.holdKeyTimer);
            this.holdKeyTimer = null;
        }
    }

    clearHoldedKey() {
        const { holdingKey, animationDuration } = this.state;
        this.clearHoldTimer();
        if (holdingKey !== null) {
            this.holdKeyTween = TweenMax.to(this.refAlternateKeys, animationDuration, {
                scale: 0,
                onComplete: () => this.setState({
                    holdingKey: null,
                }),
            });
        }
    }

    renderAlternateKeys(alternatesObject) {
        const row = this.renderRow(alternatesObject, 0);
        return (
            <div
                ref={(ref) => {
                    this.refAlternateKeys = ref;
                }}
                className="keyboard-alternate-keys"
            >
                {row}
                <div className="arrow-down" />
            </div>
        );
    }

    renderKey(key) {
        const { shift } = this.props;
        const { holdingKey } = this.state;

        if (key.spacer) {
            return (
                <div
                    key={`key-${key.id}`}
                    className={classNames(['keyboard-spacer', `keyboard-spacer-${key.spacer}`])}
                />
            );
        }

        const mouseEvents = Modernizr.touchevents ? {
            onTouchStart: e => this.onKeyMouseDown(e, key),
            onTouchEnd: e => this.onKeyMouseUp(e, key),
        } : {
            onMouseDown: e => this.onKeyMouseDown(e, key),
            onMouseUp: e => this.onKeyMouseUp(e, key),
        };

        const label = shift ? key.shift : key.label;

        return (
            <div
                key={`key-${key.id}`}
                className={classNames([
                    'keyboard-key',
                    {
                        [`key-${key.key}`]: key.key !== null,
                    },
                ])}
            >
                <button
                    type="button"
                    className={classNames([
                        'btn',
                        'btn-keyboard-key',
                        {
                            'btn-active': key.key === 'shift' && shift,
                        },
                    ])}
                    {...mouseEvents}
                >
                    {!isEmpty(label) ? <span className="label">{label}</span> : null}
                    {key.icon !== null ? (
                        <span className={classNames(['icon', `icon-${key.icon}`])} />
                    ) : null}
                </button>
                {key === holdingKey ? this.renderAlternateKeys(key.alternatesObject) : null}
            </div>
        );
    }

    renderRow(row, index) {
        const keys = row.keys.map((key, keyIndex) => this.renderKey(key, keyIndex, index));

        const rowStyle = {};
        if (row.align) {
            rowStyle.textAlign = row.align;
        }

        return (
            <div key={`row-${index}`} className="keyboard-row" style={rowStyle}>
                {keys}
            </div>
        );
    }

    render() {
        const { keys } = this.state;

        return (
            <div className="keyboard-layout">
                <div className="keyboard-keys">{keys.map(this.renderRow)}</div>
            </div>
        );
    }
}

KeyboardLayout.propTypes = propTypes;
KeyboardLayout.defaultProps = defaultProps;

export default KeyboardLayout;
