import React from 'react';
import ReactDOM from 'react-dom';
import _ from 'lodash';
import $ from 'jquery';
import { TweenMax, TimelineMax } from 'gsap/TweenMax';

import Slides from '../slides/Slides';
import * as SlideComponents from '../slides/slide';
import BubbleDetails from './bubbles/BubbleDetails.TMP.withSuggestions';
import Transitionable from '../helpers/Transitionable';
//import Transitionable from 'react-transitionable';
import Modals from '../modals/Modals';
import Button from '../partials/Button';
import ModalsActions from '../../actions/ModalsActions';
import NavigationActions from '../../actions/NavigationActions';
import Utils from '../../lib/utils';
import CacheManager from '../../lib/cache';

const Cache = CacheManager.create('sizes.channel-bubbles');

var ChannelBubbles = React.createClass({

    propTypes: {
        width: PropTypes.number.isRequired,
        height: PropTypes.number.isRequired,
        bubbles: PropTypes.array.isRequired,
        startingIndex: PropTypes.number.isRequired,
        active: PropTypes.bool.isRequired,
        backButtonLabel: PropTypes.string.isRequired,
        modals: PropTypes.array,

        minDetailsHeight: PropTypes.number,
        onBackButtonClick: PropTypes.func
    },

    contextTypes: {
        browser: PropTypes.object,
        data: PropTypes.object,
        channel: PropTypes.object,
        store: PropTypes.object
    },

    getDefaultProps: function()
    {
        return {
            minDetailsHeight: 400,
            animationDuration: 0.4
        };
    },

    getInitialState: function()
    {
        var cacheKey = this.context.channel.id + '_' + this.props.width + '_' + this.props.height;
        var size = Cache.get(cacheKey, {
            topBarHeight: null,
            slidesHeight: null,
            detailsHeight: null
        });
        return _.extend({
            lastIndex: null,
            index: this.props.startingIndex,
            offset: 0,
            loopIndex: 0
        }, size);

        currentHeights: {
            slidesTitle: null,
            slidesDetails: null,
            suggestions: null
        },
        previousHeights: {},
        nextHeights: {}
    },

    render: function()
    {
        var titleSpace = this.renderTitleSpace();
        var slides = this.renderSlides();
        var bubblesDetails = this.renderBubblesDetails();

        return (
            <div className="channel-bubbles">
                { titleSpace }
                { slides }
                { bubblesDetails }
                <Modals modals={this.props.modals} />
            </div>
        );
    },

    renderTitleSpace: function()
    {
        var backButtonLabel = this.props.backButtonLabel;

        return (
            <div className="title-space" ref="topBar">
                <div className="btn-container">
                    <Button
                        icon = 'left'
                        onClick = { this.onBackButtonClick }
                    >{ backButtonLabel }</Button>
                </div>
            </div>
        );
    },

    renderSlides: function()
    {
        if (!this.state.slidesHeight)
        {
            return;
        }

        var style = {
            top: this.state.topBarHeight,
            width: this.props.width,
            height: this.state.slidesHeight
        };

        var channelSettings = _.get(this.context.channel, 'fields.settings');
        var slideMargin = this.props.width * _.get(channelSettings, 'slidesMarginRatio', 0.01);
        var SlideComponent = Utils.getComponentFromType(SlideComponents, _.get(channelSettings, 'slidesSlideView'));
        var slideProps = _.extend({
            //useThumbnail: true
        },_.get(channelSettings, 'slidesSlideParams'));

        var slideWidthRatio = _.get(channelSettings, 'slidesWidthRatio', null);
        var slideSize;
        if (slideWidthRatio)
        {
            slideSize = _.bind(function(slide, index, current, opts)
            {
                return {
                    width: opts.width * slideWidthRatio,
                    height: this.state.slidesHeight
                };
            }, this)
        }

        var disablePan = this.props.modals.length;

        return(
            <div ref="slidesContainer" className="slides-container" style={style}>
                <Slides
                    disablePan={disablePan}
                    slides={this.props.bubbles}
                    index={this.state.index}
                    width={this.props.width}
                    height={this.state.slidesHeight}
                    SlideComponent={SlideComponent}
                    slideMargin={slideMargin}
                    slideProps={slideProps}
                    slideSize={slideSize}
                    onIndexChange={this.onSlideIndexChange}
                    onOffsetChange={this.onSlideOffsetChange}
                />
            </div>
        );
    },

    renderBubblesDetails: function(bubble)
    {
        if (!this.state.detailsHeight)
        {
            return;
        }

        var style = {
            top: this.state.topBarHeight + this.state.slidesHeight,
            width: this.props.width,
            height: this.state.detailsHeight
        };

        var min = 0;
        var max = this.props.bubbles.length - 1;
        var currentIndex = this.state.index;
        //var previousIndex = Utils.getLoopNumber(currentIndex - 1, min, max);
        //var nextIndex = Utils.getLoopNumber(currentIndex + 1, min, max);

        //console.log(currentIndex, previousIndex, nextIndex);

        var detailsElements = this.renderBubbleDetails(currentIndex);

        /*if (currentIndex !== previousIndex)
        {
            detailsElements.unshift(this.renderBubbleDetails(previousIndex, false));
        }

        if (currentIndex !== nextIndex)
        {
            detailsElements.push(this.renderBubbleDetails(nextIndex, false));
        }*/

        return(
            <div className="bubble-details-container" style={style}>
                <Transitionable transitionIn={this.detailsTransitionIn} transitionOut={this.detailsTransitionOut} transitionOther={this.detailsTransitionsOther}>
                    { detailsElements }
                </Transitionable>
            </div>
        );
    },

    renderBubbleDetails: function(index)
    {
        var bubble = this.props.bubbles[index];
        return (
            <BubbleDetails
                key={'d-'+bubble.id}
                ref={'details-'+bubble.id}
                width={this.props.width}
                height={this.state.detailsHeight}
                bubble={bubble}
                onPrevious={this.onPrevious}
                onNext={this.onNext}
                onSuggestionClick={this.onSuggestionClick}
            />
        )
    },

    componentWillReceiveProps: function(nextProps)
    {
        if (this.props.startingIndex !== nextProps.startingIndex)
        {
            this.setState({
                slideIndex: nextProps.startingIndex
            });
        }
    },

    componentDidMount: function()
    {
        var cacheKey = this.context.channel.id + '_' + this.props.width + '_' + this.props.height;
        if(!Cache.has(cacheKey))
        {
            this.updateSize();
        }
    },

    componentDidUpdate: function(prevProps, prevState)
    {
        var cacheKey = this.context.channel.id + '_' + this.props.width + '_' + this.props.height;
        if(this.state.cacheKey !== cacheKey)
        {
            Cache.clear(this.state.cacheKey);
            this.setState({
                cacheKey: cacheKey
            }, function()
            {
                this.updateSize();
            });
        }
    },

    updateSize: function()
    {
        var size = this.getElementsHeights();

        Cache.set(this.state.cacheKey, size);
        this.setState(size);
    },

    getElementsHeights: function()
    {
        var topBar = ReactDOM.findDOMNode(this.refs.topBar);
        var slidesHeightRatio = _.get(this.context.channel, 'fields.settings.slidesHeightRatio', 0.3);

        var topBarHeight = topBar.offsetHeight;
        var slidesHeight = (this.props.height - topBarHeight) * slidesHeightRatio;
        var detailsHeight = this.props.height - topBarHeight - slidesHeight;

        return {
            topBarHeight: topBarHeight,
            slidesHeight: slidesHeight,
            detailsHeight: detailsHeight
        };
    },

    detailsTransitionIn: function(transitionable, opts, done)
    {
        // current
        var currentBubble = this.props.bubbles[this.state.index];
        var lastBubble = this.props.bubbles[this.state.lastIndex];

        var currentBubbleID = _.get(currentBubble, 'id');
        var lastBubbleID = _.get(lastBubble, 'id');

        var lastDetails = ReactDOM.findDOMNode(this.refs['details-'+lastBubbleID]);
        var currentDetails = ReactDOM.findDOMNode(this.refs['details-'+currentBubbleID]);
        var $lastContent = $(lastDetails).find('.bubble-content-container');
        var $currentTypeName = $(currentDetails).find('.bubble-type-name-container');
        var $currentTitle = $(currentDetails).find('.bubble-title-container');
        var $currentContent = $(currentDetails).find('.bubble-content-container');
        var $currentContentInner = $currentContent.find('.bubble-content-inner');

        var duration = opts.mounting ? 0:this.props.animationDuration;

        var timeline = new TimelineMax({
            onComplete: done
        });

        // main height
        if(lastDetails && lastDetails.offsetHeight !== currentDetails.offsetHeight)
        {
            timeline.from(currentDetails, duration, {
                height: lastDetails.offsetHeight,
                ease: Power1.easeInOut
            });
        }

        // typeName alpha
        if ($currentTypeName.length && _.get(lastBubble, 'type_name') !== _.get(currentBubble, 'type_name'))
        {
            timeline.fromTo($currentTypeName[0], duration/2, {
                opacity: 0
            }, {
                delay: duration/2,
                opacity: 1
            }, 0);
        }

        // title alpha
        if ($currentTitle.length && _.get(lastBubble, 'snippet.title') !== _.get(currentBubble, 'snippet.title'))
        {
            timeline.fromTo($currentTitle[0], duration/2, {
                opacity: 0
            }, {
                delay: duration/2,
                opacity: 1
            }, 0);
        }

        // content alpha
        timeline.fromTo($currentContentInner[0], duration/2, {
            opacity: 0
        }, {
            delay: duration/2,
            opacity: 1
        }, 0);

        if ($lastContent.length)
        {
            // content height
            var lastContentHeight = $lastContent.height();
            var currentContentHeight = $currentContent.height();

            if (lastContentHeight !== currentContentHeight)
            {
                timeline.from($currentContent[0], duration, {
                    height: lastContentHeight,
                    ease: Power1.easeInOut
                }, 0);
            }
        }
    },

    detailsTransitionOut: function(transitionable, opts, done)
    {
        // last
        var lastBubble = this.props.bubbles[this.state.lastIndex];
        var currentBubble = this.props.bubbles[this.state.index];

        var lastBubbleID = _.get(lastBubble, 'id');
        var currentBubbleID = _.get(currentBubble, 'id');

        var currentDetails = ReactDOM.findDOMNode(this.refs['details-'+currentBubbleID]);
        var lastDetails = ReactDOM.findDOMNode(this.refs['details-'+lastBubbleID]);
        var $currentContent = $(currentDetails).find('.bubble-content-container');
        var $lastTypeName = $(lastDetails).find('.bubble-type-name-container');
        var $lastTitle = $(lastDetails).find('.bubble-title-container');
        var $lastContent = $(lastDetails).find('.bubble-content-container');
        var $lastContentInner = $lastContent.find('.bubble-content-inner');

        var duration = opts.mounting ? 0:this.props.animationDuration;

        var timeline = new TimelineMax({
            onComplete: done
        });

        timeline.set(lastDetails, {
            zIndex: 1
        });

        // main height
        if(lastDetails.offsetHeight !== currentDetails.offsetHeight)
        {
            timeline.to(lastDetails, duration, {
                height: currentDetails.offsetHeight,
                ease: Power1.easeInOut
            });
        }

        // typeName alpha
        if ($lastTypeName.length)
        {
            var typeNameChanged = _.get(lastBubble, 'type_name') !== _.get(currentBubble, 'type_name');
            timeline.to($lastTypeName[0], typeNameChanged ? duration/2:0, {
                opacity: 0
            }, 0);
        }

        // title alpha
        if ($lastTitle.length)
        {
            var titleChanged = _.get(lastBubble, 'snippet.title') !== _.get(currentBubble, 'snippet.title');
            timeline.to($lastTitle[0], titleChanged ? duration/2:0, {
                opacity: 0
            }, 0);
        }

        // content alpha
        timeline.to($lastContentInner[0], duration/2, {
            opacity: 0,
            onComplete: function()
            {
                TweenMax.set(lastDetails, {
                    zIndex: 'auto'
                });
            }
        }, 0);

        if ($currentContent.length)
        {
            // content height
            var lastContentHeight = $lastContent.height();
            var currentContentHeight = $currentContent.height();

            if (lastContentHeight !== currentContentHeight)
            {
                timeline.to($lastContent[0], duration, {
                    height: currentContentHeight,
                    ease: Power1.easeInOut
                }, 0);
            }
        }
    },

    detailsTransitionsOther: function(transitionable, opts, done)
    {
        done();
    },

    suggestionsTransitionIn: function(transitionable, opts, done)
    {
        // current
        var currentBubble = this.props.bubbles[this.state.index];
        var lastBubble = this.props.bubbles[this.state.lastIndex];

        var currentBubbleID = _.get(currentBubble, 'id');
        var lastBubbleID = _.get(lastBubble, 'id');

        var lastSuggestions = ReactDOM.findDOMNode(this.refs['suggestionsContent-'+lastBubbleID]);
        var currentSuggestions = ReactDOM.findDOMNode(this.refs['suggestionsContent-'+currentBubbleID]);
        var currentSuggestionsComponent = $(currentSuggestions).find('.bubble-suggestions')[0];

        var currentSuggestionsTop = currentSuggestions ? currentSuggestions.offsetTop:0;
        var lastSuggestionsTop = lastSuggestions ? lastSuggestions.offsetTop:currentSuggestionsTop;

        var fromY = lastSuggestionsTop - currentSuggestionsTop;

        var timeline = new TimelineMax({
            onComplete: done
        });

        var duration = opts.mounting ? 0:this.props.animationDuration;

        timeline.from(currentSuggestions, duration, {
            y: fromY,
            ease: Power1.easeInOut
        });

        timeline.fromTo(currentSuggestionsComponent, duration/2, {
            opacity: 0
        }, {
            delay: duration/2,
            opacity: 1
        }, 0);
    },

    suggestionsTransitionOut: function(transitionable, opts, done)
    {
        // last
        var currentBubble = this.props.bubbles[this.state.index];
        var lastBubble = this.props.bubbles[this.state.lastIndex];

        var currentBubbleID = _.get(currentBubble, 'id');
        var lastBubbleID = _.get(lastBubble, 'id');

        var lastSuggestions = ReactDOM.findDOMNode(this.refs['suggestionsContent-'+lastBubbleID]);
        var currentSuggestions = ReactDOM.findDOMNode(this.refs['suggestionsContent-'+currentBubbleID]);
        var lastSuggestionsComponent = $(lastSuggestions).find('.bubble-suggestions')[0];
        var lastSuggestionsTitle = $(lastSuggestions).find('.bubble-suggestions-title')[0];

        var duration = opts.mounting ? 0:this.props.animationDuration;

        var timeline = new TimelineMax({
            onComplete: done
        });

        timeline.set(lastSuggestions, {
            zIndex: 1
        });

        timeline.to(lastSuggestions, duration, {
            y: currentSuggestions.offsetTop - lastSuggestions.offsetTop,
            ease: Power1.easeInOut
        });

        timeline.to(lastSuggestionsComponent, duration/2, {
            opacity: 0,
            onComplete: function()
            {
                TweenMax.set(lastSuggestions, {
                    zIndex: 'auto'
                });
            }
        }, 0);
    },

    updateIndex: function(index, offset)
    {
        var state = {
            lastIndex: this.state.index,
            index: index
        };

        if (typeof offset !== 'undefined')
        {
            state.offset = offset;
        }

        this.setState(state);
    },

    /*
        Events handlers
    */

    onBackButtonClick: function(e)
    {
        e.preventDefault();

        if (this.props.onBackButtonClick)
        {
            this.props.onBackButtonClick(e);
        }
    },

    onSuggestionClick: function(bubble)
    {
        var bubbleId = _.get(bubble, 'id');
        var bubbleChannelId = _.get(bubble, 'channel_id');
        var browserId = _.get(this.context.browser, 'id');

        var currentChannelId = _.get(this.context.channel,'id');

        var index = _.findIndex(this.props.bubbles, 'id', bubbleId);

        if (bubbleChannelId === currentChannelId)
        {
            this.updateIndex(index);
        } else {
            this.context.store.dispatch(ModalsActions.closeBrowserModals(browserId));
            this.context.store.dispatch(NavigationActions.updateBrowser(browserId, {
                channelId: bubbleChannelId,
                bubbleId: bubbleId
            }));
        }

    },

    onSlideIndexChange: function(index, offset)
    {
        console.log('index change', index, offset)
        if (index !== this.state.index)
        {
            this.updateIndex(index);
        }
    },

    onSlideOffsetChange: function(offset)
    {
        console.log('offset change', offset)
        this.setState({
            offset: offset
        });
    },

    onPrevious: function()
    {
        this.updateIndex(this.state.index - 1);
    },

    onNext: function()
    {
        this.updateIndex(this.state.index + 1);
    }


});

export default ChannelBubbles;
