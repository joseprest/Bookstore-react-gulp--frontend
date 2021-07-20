import React from 'react';
import PropTypes from 'prop-types';
import Button from '../../../partials/Button';
import * as Fields from '../fields';
import Text from '../../../../lib/text';
import Scrollable from '../../../helpers/Scrollable';
import Utils from '../../../../lib/utils';

const BubbleDetailsColumns = React.createClass({
    propTypes: {
        bubble: PropTypes.object.isRequired,
        buttons: PropTypes.array,
        onButtonClick: PropTypes.func,
    },

    contextTypes: {
        data: PropTypes.object,
    },

    getDefaultProps() {
        return {};
    },

    render() {
        const bubbleChannelId = _.get(this.props.bubble, 'channel_id');
        const channel = this.context.data.findChannelByID(bubbleChannelId);

        let columnsArray = _.get(channel, 'fields.settings.bubbleDetailsContentColumns', null);
        if (!columnsArray) {
            columnsArray = [];
        }
        const columns = [];
        let column;
        for (let i = 0, cl = columnsArray.length; i < cl; i++) {
            column = columnsArray[i];
            if (!columns[column.column]) {
                columns[column.column] = [];
            }
            columns[column.column].push(column);
        }

        const columnsContent = this.renderColumns(columns);

        return <div className="bubble-details-columns">{columnsContent}</div>;
    },

    renderColumns(columns) {
        const count = columns.length;
        return columns.map(
            _.bind(function (column, index) {
                return this.renderColumn(column, index, count);
            }, this),
        );
    },

    renderColumn(column, index, count) {
        const content = [];
        let it;
        for (let i = 0, cl = column.length; i < cl; i++) {
            it = column[i];
            switch (it.type) {
            case 'title':
                var title = _.get(this.props.bubble, it.value, null);
                if (title) {
                    content.push(<div className="bubble-subtitle">{title}</div>);
                }
                break;
            case 'description':
                var description = _.get(this.props.bubble, it.value);
                if (description) {
                    content.push(
                        <div
                            className="bubble-description"
                            dangerouslySetInnerHTML={{ __html: description }}
                        />,
                    );
                }
                break;
            case 'fields':
                var fields = it.value.split(',');
                content.push(this.renderFields(fields));
                break;
            case 'buttons':
                var buttons = it.value.split(',');
                content.push(this.renderButtons(buttons));
                break;
            }
        }

        let columnClassName = 'bubble-column';
        if (index === 0 && count === 1) {
            columnClassName += ' bubble-column-center';
        }
        if (index === 0 && count === 2) {
            columnClassName += ' bubble-column-left';
        } else if (index === 1 && count === 2) {
            columnClassName += ' bubble-column-right';
        }

        const columnContent = content.map((it, i) => {
            const key = `col-item-${index}-${i}`;
            return <div key={key}>{it}</div>;
        });

        return (
            <Scrollable key={`col-${index}`}>
                <div className={columnClassName}>
                    <div className="bubble-column-content">{columnContent}</div>
                </div>
            </Scrollable>
        );
    },

    renderFields(fields) {
        const leftFields = [];
        const rightFields = [];
        let i = 0;

        _.each(
            fields,
            _.bind(function (field, key, index) {
                const currentColumn = i % 2 === 0 ? leftFields : rightFields;
                const value = _.get(this.props.bubble, field);
                if (value) {
                    const column = this.renderField(value, i);
                    if (column) {
                        currentColumn.push(column);
                        i++;
                    }
                }
            }, this),
        );

        return (
            <div className="bubble-fields">
                <div className="bubble-fields-column column-left">{leftFields}</div>
                <div className="bubble-fields-column column-right">{rightFields}</div>
            </div>
        );
    },

    renderField(field, index) {
        if (!field || !field.value) {
            return null;
        }

        const Field = Utils.getComponentFromType(Fields, field.type);

        return <Field key={index} data={field} />;
    },

    renderButtons(buttonTypes) {
        const bubbleChannelId = _.get(this.props.bubble, 'channel_id');
        const channel = this.context.data.findChannelByID(bubbleChannelId);
        let excludedButtons = _.get(channel, 'fields.settings.bubbleDetailsButtons', []);
        if (_.isString(excludedButtons)) {
            excludedButtons = excludedButtons.length > 0 ? excludedButtons.split(',') : [];
        }
        const selectedButtons = [];
        let button;
        for (var i = 0, bl = buttonTypes.length; i < bl; i++) {
            button = _.find(this.props.buttons, btn => btn.type === buttonTypes[i] && _.indexOf(excludedButtons, btn.type) === -1);
            if (button) {
                selectedButtons.push(button);
            }
        }
        const buttons = selectedButtons.map(this.renderButton);

        return <div className="bubble-buttons">{buttons}</div>;
    },

    renderButton(button, index) {
        const type = _.get(button, 'type');
        const label = _.get(button, 'label');
        const iconPosition = _.get(button, 'iconPosition');

        const onClick = _.bind(function (e) {
            this.onButtonClick(e, button);
        }, this);

        return (
            <Button key={`b${index}`} icon={type} iconPosition={iconPosition} onClick={onClick}>
                {Text.t(label)}
            </Button>
        );
    },

    onButtonClick(e, button) {
        if (this.props.onButtonClick) {
            this.props.onButtonClick(e, button);
        }
    },
});

export default BubbleDetailsColumns;
