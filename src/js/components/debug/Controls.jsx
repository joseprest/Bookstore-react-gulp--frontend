import React from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import $ from 'jquery';

import Utils from '../../lib/utils';
import NavigationActions from '../../actions/NavigationActions';
import ManivelleActions from '../../actions/ManivelleActions';
import DataActions from '../../actions/DataActions';
import Manivelle from '../../lib/manivelle';

var DebugControls = React.createClass({

    contextTypes: {
        store: PropTypes.object,
        hasManivelle: PropTypes.bool
    },

    propTypes: {
        browsers: PropTypes.array.isRequired,
        mouseSentivity: PropTypes.number
    },

    getDefaultProps: function()
    {
        return {
            mouseSentivity: 2,
            autoManivelleFactor: 1,
            manivelleMoveIntervalDelay: 10// in ms
        };
    },

    getInitialState: function()
    {
        return {
            manivelleMovementType: 'manual',
            manivelleValue: 0,
            manivellePercent: 0
        };
    },

    oldDeltaX: null,
    autoManivelleInterval: null,

    render: function()
    {
        var manivelleButtons;
        if (this.context.hasManivelle)
        {
            manivelleButtons = this.renderManivelleButtons();
        }
        var slideshowButtons = this.renderSlideshowButtons();

        return (
            <div className="debug-controls">
                { manivelleButtons }
                { slideshowButtons }
            </div>
        );
    },

    renderManivelleButtons: function()
    {
        var manivellePercent = this.state.manivellePercent.toFixed(3);
        var manivelleButtonEvents;

        if (this.state.manivelleMovementType === 'manual'){
            manivelleButtonEvents = {
                onMouseDown: this.onManivelleButtonDown
            };
        }

        return (
            <div className="manivelle-buttons">
                <button type="button" className="manivelle-percent" {...manivelleButtonEvents} >{'Manivelle: '+manivellePercent}</button>
                <input id="manivelle-type-stop" type="radio" name="manivelle-type" value="manual" checked={this.state.manivelleMovementType === 'manual'} onChange={this.onManivelleMovementTypeChange} />
                <label htmlFor="manivelle-type-stop">Stop</label>
                <input id="manivelle-type-left" type="radio" name="manivelle-type" value="left" checked={this.state.manivelleMovementType === 'left'} onChange={this.onManivelleMovementTypeChange} />
                <label htmlFor="manivelle-type-left">Rotate left</label>
                <input id="manivelle-type-right" type="radio" name="manivelle-type" value="right" checked={this.state.manivelleMovementType === 'right'} onChange={this.onManivelleMovementTypeChange} />
                <label htmlFor="manivelle-type-right">Rotate right</label>
            </div>
        );
    },

    renderSlideshowButtons: function()
    {
        //checked={this.state.usingCustomTimeline}
        return (
            <div className="slideshow-buttons">
                <input type="checkbox" id="controls-update-timeline" onChange={this.onUpdateTimeline} />
                <label htmlFor="controls-update-timeline"> Custom timeline</label>
            </div>
        );
    },

    componentDidMount: function()
    {
        $(document).on('manivelle:rotation', this.onManivelleRotation);
    },

    componentWillUnmount: function()
    {
        $(document).off('manivelle:rotation', this.onManivelleRotation);
    },

    componentDidUpdate: function(prevProps, prevState)
    {
        var manivelleMovementType = this.state.manivelleMovementType;
        if (prevState.manivelleMovementType !== manivelleMovementType)
        {
            clearInterval(this.autoManivelleInterval);
            this.autoManivelleInterval = null;

            var autoManivelleFactor = this.props.autoManivelleFactor;

            if (manivelleMovementType !== 'manual')
            {
                this.autoManivelleInterval = setInterval(this.onManivelleMove, this.props.manivelleMoveIntervalDelay, manivelleMovementType === 'left' ? -autoManivelleFactor:autoManivelleFactor);
            }
        }
    },

    onManivelleRotation: function(e)
    {
        var manivelle = e.manivelle;

        this.setState({
            manivellePercent: manivelle.percent,
            manivelleValue: manivelle.value
        });
    },

    onClickOpenBrowser: function(e)
    {
        e.preventDefault();

        this.context.store.dispatch(NavigationActions.openBrowser());
    },

    onClickCloseBrowser: function(e)
    {
        e.preventDefault();

        var id = _.get(this.props.browsers, '0.id');
        if(id)
        {
            this.context.store.dispatch(NavigationActions.closeBrowser(id));
        }
    },

    onManivelleMovementTypeChange: function(e)
    {
        this.setState({
            manivelleMovementType: e.currentTarget.value
        });
    },

    onManivelleButtonDown: function(e)
    {
        this.oldDeltaX = e.clientX;
        this.addWindowMouseEvents();
    },

    onManivelleButtonUp: function()
    {
        this.removeWindowMouseEvents();
    },

    onManivelleButtonMove: function(e)
    {
        var clientX = e.clientX;
        var deltaX = this.oldDeltaX - clientX;

        if (deltaX === 0)
        {
            return;
        }

        this.oldDeltaX = clientX;

        this.onManivelleMove(deltaX);
    },

    onManivelleMove: function(deltaX)
    {
        var manivelleValue = this.state.manivelleValue;

        var nextManivelleValue = manivelleValue + (deltaX * this.props.mouseSentivity);

        var direction = manivelleValue < nextManivelleValue? 'clockwise':'counterclockwise';
        var end = false;
        var min = 0;
        var max = 1024;

        if (nextManivelleValue <= min)
        {
            nextManivelleValue += max;
            end = true;
        }
        if (nextManivelleValue >= max)
        {
            nextManivelleValue -= max;
            end = true;
        }
        var percent = nextManivelleValue / max;

        Manivelle.updateData({
            direction: direction,
            value: nextManivelleValue,
            percent: percent,
            end: end
        });
    },

    onUpdateTimeline: function(e)
    {
        var checked = e.target.checked;

        var timeline = checked ? [
            {
                'start': new Date().getTime()/1000-1,
                'end': new Date().getTime()/1000-1+100,
                'id': '0',
                'items':[
                    {
                        'bubble_id':'question1',
                        'duration':60
                    },
                    {
                        'bubble_id':'question2',
                        'duration':60
                    },
                    {
                        'bubble_id':'service10',
                        'duration':60
                    },
                    {
                        'bubble_id':'2',
                        'duration':60
                    }
                ]
            },
            {
                'start': new Date().getTime()/1000-1+100,
                'end': new Date().getTime()/1000-1+150,
                'id': '1',
                'items':[
                    {
                        'bubble_id':'3',
                        'duration':10
                    },
                    {
                        'bubble_id':'4',
                        'duration':10
                    }
                ]
            }
        ]:[];
        this.context.store.dispatch(DataActions.setTimeline(timeline));
    },

    addWindowMouseEvents: function()
    {
        $(window).on('mouseup', this.onManivelleButtonUp);
        $(window).on('mousemove', this.onManivelleButtonMove);
    },

    removeWindowMouseEvents: function()
    {
        $(window).off('mouseup', this.onManivelleButtonUp);
        $(window).off('mousemove', this.onManivelleButtonMove);
    }

});

export default DebugControls;
