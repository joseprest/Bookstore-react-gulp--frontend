import React, { Component } from 'react';
import PropTypes from 'prop-types';
import get from 'lodash/get';
import $ from 'jquery';
import { TimelineMax, TweenMax, Power1 } from 'gsap/TweenMax';
import { connect } from 'react-redux';

import Slides from '../slides/Slides';
import * as SlideComponents from '../slides/slide';
import BubbleDetails from './bubbles/BubbleDetails';
import BubbleSuggestions from './bubbles/BubbleSuggestions';
import Transitionable from '../helpers/Transitionable';
// import Transitionable from 'react-transitionable';
import Modals from '../modals/Modals';
import Button from '../partials/Button';
import ModalsActions from '../../actions/ModalsActions';
import NavigationActions from '../../actions/NavigationActions';
import * as AppPropTypes from '../../lib/PropTypes';
import Utils from '../../lib/utils';
import Text from '../../lib/text';
import CacheManager from '../../lib/cache';

const Cache = CacheManager.create('sizes.channel-bubbles');

const propTypes = {
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
    channel: AppPropTypes.channel.isRequired,
    bubbles: AppPropTypes.bubbles.isRequired,
    bubbleId: PropTypes.string,
    active: PropTypes.bool.isRequired, // eslint-disable-line react/no-unused-prop-types
    ready: PropTypes.bool.isRequired, // eslint-disable-line react/no-unused-prop-types
    backButtonLabel: PropTypes.string.isRequired,
    modals: AppPropTypes.modals,
    refContainer: PropTypes.func,
    updateBrowser: PropTypes.func.isRequired,
    closeBrowserModals: PropTypes.func.isRequired,

    minDetailsHeight: PropTypes.number, // eslint-disable-line react/no-unused-prop-types
    animationDuration: PropTypes.number,
    onBackButtonClick: PropTypes.func,
};

const defaultProps = {
    refContainer: null,
    bubbleId: null,
    minDetailsHeight: 400,
    animationDuration: 0.4,
    modals: [],
    onBackButtonClick: null,
};

const contextTypes = {
    browser: AppPropTypes.browser,
    data: AppPropTypes.dataRepository,
    channel: AppPropTypes.channel,
};

class ChannelBubbles extends Component {
    constructor(props) {
        super(props);

        this.onBackButtonClick = this.onBackButtonClick.bind(this);
        this.onSuggestionClick = this.onSuggestionClick.bind(this);
        this.onSlideIndexChange = this.onSlideIndexChange.bind(this);
        this.onSlideOffsetChange = this.onSlideOffsetChange.bind(this);
        this.onPrevious = this.onPrevious.bind(this);
        this.onNext = this.onNext.bind(this);
        this.suggestionsTransitionIn = this.suggestionsTransitionIn.bind(this);
        this.suggestionsTransitionOut = this.suggestionsTransitionOut.bind(this);
        this.detailsTransitionIn = this.detailsTransitionIn.bind(this);
        this.detailsTransitionOut = this.detailsTransitionOut.bind(this);

        this.refContainer = null;
        this.refSuggestionsContainer = null;
        this.refSuggestionsContent = {};
        this.refDetails = {};
        this.refTopBar = null;

        const {
            channel, bubbleId, width, height,
        } = props;
        const cacheKey = `${channel.id}_${bubbleId}_${width}_${height}`;
        const size = Cache.get(cacheKey, {
            slidesHeight: null,
            detailsHeight: null,
            suggestionsContainerHeight: null,
            topBarHeight: null,
            suggestionsHeight: null, // l'espace sous le "Suggestions reliées"
        });
        this.state = {
            lastBubbleId: null,
            offset: 0,
            cacheKey,
            ...size,
        };
    }

    componentDidMount() {
        const { channel } = this.props;
        const { cacheKey } = this.state;
        const { browser } = this.context;

        browser.tracker.channelPageview(channel, '/bubbles');

        if (!Cache.has(cacheKey)) {
            this.updateSize(cacheKey);
        }
    }

    componentWillReceiveProps({ bubbleId: nextBubbleId, bubbles: nextBubbles }) {
        const {
            width, height, bubbleId, channel, bubbles,
        } = this.props;
        const { cacheKey } = this.state;
        const bubbleChanged = bubbleId !== nextBubbleId;
        const bubblesChanged = bubbles !== nextBubbles;
        if (bubbleChanged || bubblesChanged) {
            const elementsHeights = this.getElementsHeightsFromBubbleId(nextBubbleId);
            this.setState({
                lastBubbleId: bubbleId || this.getBubbleByIdWithIndex(bubbleId).id,
                ...elementsHeights,
            });
        }
        let newCacheKey = `${channel.id}_${bubbleId}_${width}_${height}`;
        if (newCacheKey !== cacheKey || bubblesChanged || bubbleChanged) {
            const bubble = bubbles.find(({ id }) => id === bubbleId) || null;
            newCacheKey = `${channel.id}_${bubble !== null ? bubble.id : null}_${width}_${height}`;
            this.setState({
                cacheKey: newCacheKey,
            });
        }
    }

    componentDidUpdate(prevProps, { cacheKey: prevCacheKey }) {
        const { cacheKey } = this.state;
        if (cacheKey !== prevCacheKey) {
            Cache.clear(prevCacheKey);
            this.updateSize(cacheKey);
        }
    }

    onBackButtonClick(e) {
        const { onBackButtonClick } = this.props;
        e.preventDefault();

        if (onBackButtonClick !== null) {
            onBackButtonClick(e);
        }
    }

    onSuggestionClick(bubble) {
        const {
            channel: { id: currentChannelId },
            bubbles,
            closeBrowserModals,
            updateBrowser,
        } = this.props;
        const {
            browser: { id: browserId },
        } = this.context;
        const { id: bubbleId, channel_id: bubbleChannelId } = bubble;

        const index = bubbles.findIndex(({ id }) => id === bubbleId);

        if (bubbleChannelId === currentChannelId) {
            this.updateIndex(index);
        } else {
            closeBrowserModals(browserId);
            updateBrowser(browserId, {
                channelId: bubbleChannelId,
                bubbleId,
            });
        }
    }

    onSlideIndexChange(index /* , offset */) {
        this.updateIndex(index);
    }

    // eslint-disable-next-line
    onSlideOffsetChange(offset) {
        // console.log('offset change', offset)
        /* this.setState({
            offset: offset
        }); */
    }

    onPrevious() {
        const { bubbleId, bubbles } = this.props;
        let index = bubbles.findIndex(({ id }) => id === bubbleId);
        index = index === -1 ? 0 : index;
        this.updateIndex(index - 1);
    }

    onNext() {
        const { bubbleId, bubbles } = this.props;
        let index = bubbles.findIndex(({ id }) => id === bubbleId);
        index = index === -1 ? 0 : index;
        this.updateIndex(index + 1);
    }

    getBubbleByIdWithIndex(bubbleId) {
        const { bubbles } = this.props;
        let bubbleIndex = bubbles.findIndex(({ id }) => id === bubbleId);
        bubbleIndex = bubbleIndex === -1 ? 0 : bubbleIndex;
        return bubbles[bubbleIndex] || null;
    }

    getElementsHeightsFromBubbleId(bubbleId) {
        const {
            height, bubbleId: propsBubbleId, channel, bubbles,
        } = this.props;
        const {
            slidesHeight: lastSlidesHeight,
            detailsHeight: lastDetailsHeight,
            suggestionsHeight: lastSuggestionsHeight,
            suggestionsContainerHeight: lastSuggestionsContainerHeight,
        } = this.state;
        const renderedBubble = this.getBubbleByIdWithIndex(propsBubbleId);
        if (renderedBubble === null) {
            return null;
        }

        const topBar = this.refTopBar;
        const suggestionsContainerElement = this.refSuggestionsContainer;
        const suggestionsContentElement = this.refSuggestionsContent[renderedBubble.id];
        const suggestionsContentInnerElement = $(suggestionsContentElement).find(
            '.bubble-suggestions-content-inner',
        )[0];
        const suggestionsTitleElement = $(suggestionsContentElement).find(
            '.bubble-suggestions-title',
        )[0];

        const topBarHeight = topBar.offsetHeight;

        let suggestionsContainerHeight = suggestionsContainerElement.offsetHeight;
        // prettier-ignore
        const suggestionsHeight = (
            suggestionsContentInnerElement.offsetHeight
            - suggestionsTitleElement.offsetHeight
        );

        const slidesHeightRatio = get(channel, 'fields.settings.slidesHeightRatio', 0.3);
        const slidesHeight = (height - topBarHeight) * slidesHeightRatio;

        const bubble = bubbles.find(({ id }) => id === bubbleId);
        const { suggestions: bubbleSuggestions = [] } = bubble;
        if (!bubbleSuggestions.length) {
            suggestionsContainerHeight = 0;
        }

        const detailsHeight = height - topBarHeight - suggestionsContainerHeight - slidesHeight;

        return {
            topBarHeight,
            slidesHeight,
            detailsHeight,
            suggestionsContainerHeight: suggestionsContainerElement.offsetHeight,
            suggestionsHeight,
            lastSlidesHeight,
            lastDetailsHeight,
            lastSuggestionsHeight,
            lastSuggestionsContainerHeight,
        };
    }

    detailsTransitionIn(transitionable, opts, done) {
        const { bubbleId: currentBubbleId, animationDuration } = this.props;
        const { lastBubbleId } = this.state;
        // current
        const currentBubble = this.getBubbleByIdWithIndex(currentBubbleId);
        const lastBubble = lastBubbleId ? this.getBubbleByIdWithIndex(lastBubbleId) : null;

        const lastDetails = this.refDetails[lastBubbleId];
        const currentDetails = this.refDetails[currentBubbleId];
        const $lastContent = $(lastDetails).find('.bubble-content-container');
        const $currentTypeName = $(currentDetails).find('.bubble-type-name-container');
        const $currentTitle = $(currentDetails).find('.bubble-title-container');
        const $currentContent = $(currentDetails).find('.bubble-content-container');
        const $currentContentInner = $currentContent.find('.bubble-content-inner');

        const duration = opts.mounting ? 0 : animationDuration;

        const timeline = new TimelineMax({
            onComplete: done,
        });

        // main height
        if (lastDetails && lastDetails.offsetHeight !== currentDetails.offsetHeight) {
            timeline.from(currentDetails, duration, {
                height: lastDetails.offsetHeight,
                ease: Power1.easeInOut,
            });
        }

        // typeName alpha
        const typeNameChanged = get(lastBubble, 'type_name') !== get(currentBubble, 'type_name');
        if (typeNameChanged && $currentTypeName.length) {
            timeline.fromTo(
                $currentTypeName[0],
                duration / 2,
                {
                    opacity: 0,
                },
                {
                    delay: duration / 2,
                    opacity: 1,
                },
                0,
            );
        }

        // title alpha
        if (
            $currentTitle.length
            && get(lastBubble, 'snippet.title') !== get(currentBubble, 'snippet.title')
        ) {
            timeline.fromTo(
                $currentTitle[0],
                duration / 2,
                {
                    opacity: 0,
                },
                {
                    delay: duration / 2,
                    opacity: 1,
                },
                0,
            );
        }

        // content alpha
        timeline.fromTo(
            $currentContentInner[0],
            duration / 2,
            {
                opacity: 0,
            },
            {
                delay: duration / 2,
                opacity: 1,
            },
            0,
        );

        if ($lastContent.length) {
            // content height
            const lastContentHeight = $lastContent.height();
            const currentContentHeight = $currentContent.height();

            if (lastContentHeight !== currentContentHeight) {
                timeline.from(
                    $currentContent[0],
                    duration,
                    {
                        height: lastContentHeight,
                        ease: Power1.easeInOut,
                    },
                    0,
                );
            }
        }
    }

    detailsTransitionOut(transitionable, opts, done) {
        const { bubbleId: currentBubbleId, animationDuration } = this.props;
        // last
        const { lastBubbleId } = this.state;
        const currentBubble = this.getBubbleByIdWithIndex(currentBubbleId);
        const lastBubble = lastBubbleId ? this.getBubbleByIdWithIndex(lastBubbleId) : null;

        const lastDetails = this.refDetails[lastBubbleId];
        const currentDetails = this.refDetails[currentBubbleId];
        const $currentContent = $(currentDetails).find('.bubble-content-container');
        const $lastTypeName = $(lastDetails).find('.bubble-type-name-container');
        const $lastTitle = $(lastDetails).find('.bubble-title-container');
        const $lastContent = $(lastDetails).find('.bubble-content-container');
        const $lastContentInner = $lastContent.find('.bubble-content-inner');

        const duration = opts.mounting ? 0 : animationDuration;

        const timeline = new TimelineMax({
            onComplete: done,
        });

        timeline.set(lastDetails, {
            zIndex: 1,
        });

        // main height
        if (lastDetails.offsetHeight !== currentDetails.offsetHeight) {
            timeline.to(lastDetails, duration, {
                height: currentDetails.offsetHeight,
                ease: Power1.easeInOut,
            });
        }

        // typeName alpha
        const typeNameChanged = get(lastBubble, 'type_name') !== get(currentBubble, 'type_name');
        if ($lastTypeName.length) {
            timeline.to(
                $lastTypeName[0],
                typeNameChanged ? duration / 2 : 0,
                {
                    opacity: 0,
                },
                0,
            );
        }

        // title alpha
        if ($lastTitle.length) {
            const titleChanged = get(lastBubble, 'snippet.title') !== get(currentBubble, 'snippet.title');
            timeline.to(
                $lastTitle[0],
                titleChanged ? duration / 2 : 0,
                {
                    opacity: 0,
                },
                0,
            );
        }

        // content alpha
        timeline.to(
            $lastContentInner[0],
            duration / 2,
            {
                opacity: 0,
                onComplete() {
                    TweenMax.set(lastDetails, {
                        zIndex: 'auto',
                    });
                },
            },
            0,
        );

        if ($currentContent.length) {
            // content height
            const lastContentHeight = $lastContent.height();
            const currentContentHeight = $currentContent.height();

            if (lastContentHeight !== currentContentHeight) {
                timeline.to(
                    $lastContent[0],
                    duration,
                    {
                        height: currentContentHeight,
                        ease: Power1.easeInOut,
                    },
                    0,
                );
            }
        }
    }

    suggestionsTransitionIn(transitionable, opts, done) {
        const { bubbleId: currentBubbleId, animationDuration } = this.props;
        const { lastBubbleId } = this.state;
        // const currentBubble = this.getBubbleByIdWithIndex(currentBubbleId);
        // const lastBubble = lastBubbleId ? this.getBubbleByIdWithIndex(lastBubbleId) : null;

        const lastSuggestions = this.refSuggestionsContent[lastBubbleId];
        const currentSuggestions = this.refSuggestionsContent[currentBubbleId];
        const currentSuggestionsComponent = $(currentSuggestions).find('.bubble-suggestions')[0];

        const currentSuggestionsTop = currentSuggestions ? currentSuggestions.offsetTop : 0;
        const lastSuggestionsTop = lastSuggestions
            ? lastSuggestions.offsetTop
            : currentSuggestionsTop;

        const fromY = lastSuggestionsTop - currentSuggestionsTop;

        const timeline = new TimelineMax({
            onComplete: done,
        });

        const duration = opts.mounting ? 0 : animationDuration;

        timeline.from(currentSuggestions, duration, {
            y: fromY,
            ease: Power1.easeInOut,
        });

        timeline.fromTo(
            currentSuggestionsComponent,
            duration / 2,
            {
                opacity: 0,
            },
            {
                delay: duration / 2,
                opacity: 1,
            },
            0,
        );
    }

    suggestionsTransitionOut(transitionable, opts, done) {
        const { bubbleId: currentBubbleId, animationDuration } = this.props;
        const { lastBubbleId } = this.state;

        // const currentBubble = this.getBubbleByIdWithIndex(currentBubbleId);
        // const lastBubble = lastBubbleId ? this.getBubbleByIdWithIndex(lastBubbleId) : null;

        const lastSuggestions = this.refSuggestionsContent[lastBubbleId];
        const currentSuggestions = this.refSuggestionsContent[currentBubbleId];
        const lastSuggestionsComponent = $(lastSuggestions).find('.bubble-suggestions')[0];
        // const lastSuggestionsTitle = $(lastSuggestions).find('.bubble-suggestions-title')[0];

        const duration = opts.mounting ? 0 : animationDuration;

        const timeline = new TimelineMax({
            onComplete: done,
        });

        timeline.set(lastSuggestions, {
            zIndex: 1,
        });

        timeline.to(lastSuggestions, duration, {
            y: currentSuggestions.offsetTop - lastSuggestions.offsetTop,
            ease: Power1.easeInOut,
        });

        timeline.to(
            lastSuggestionsComponent,
            duration / 2,
            {
                opacity: 0,
                onComplete() {
                    TweenMax.set(lastSuggestions, {
                        zIndex: 'auto',
                    });
                },
            },
            0,
        );
    }

    updateIndex(index) {
        const { updateBrowser, bubbles } = this.props;
        const {
            browser: { id: browserId, tracker: browserTracker },
        } = this.context;
        const finalIndex = Utils.getLoopNumber(index, 0, bubbles.length - 1);

        const bubble = bubbles[finalIndex];
        const { id: bubbleId } = bubble;

        updateBrowser(browserId, {
            bubbleId,
        });

        if (bubble) {
            browserTracker.bubbleEvent(bubble, 'Channel bubbles slide change');
        }
    }

    updateSize(cacheKey) {
        const { bubbleId } = this.props;
        const size = this.getElementsHeightsFromBubbleId(bubbleId);

        if (size !== null) {
            Cache.set(cacheKey, size);
            this.setState(size);
        }
    }

    renderTitleSpace() {
        const { backButtonLabel } = this.props;
        return (
            <div
                className="title-space"
                ref={(ref) => {
                    this.refTopBar = ref;
                }}
            >
                <div className="btn-container">
                    <Button icon="left" customThemeIcon="home" onClick={this.onBackButtonClick}>
                        {backButtonLabel}
                    </Button>
                </div>
            </div>
        );
    }

    renderContent() {
        const { height } = this.props;
        const { topBarHeight } = this.state;
        const style = {
            top: topBarHeight,
            height: height - topBarHeight,
        };

        const { bubbleId } = this.props;
        const { bubbles } = this.props;
        let bubbleIndex = bubbles.findIndex(({ id }) => id === bubbleId);
        bubbleIndex = bubbleIndex === -1 ? 0 : bubbleIndex;
        const bubble = bubbles[bubbleIndex] || null;
        const slides = bubble !== null ? this.renderSlides(bubbleIndex) : null;
        const bubbleDetails = bubble !== null ? this.renderBubbleDetails(bubble) : null;
        const bubbleSuggestions = bubble !== null ? this.renderBubbleSuggestions(bubble) : null;

        return (
            <div className="channel-bubbles-content" style={style}>
                {slides}
                {bubbleDetails}
                {bubbleSuggestions}
            </div>
        );
    }

    renderSlides(bubbleIndex) {
        const {
            width, channel, modals, bubbles,
        } = this.props;
        const { slidesHeight } = this.state;
        if (!slidesHeight) {
            return null;
        }

        const style = {
            width,
            height: slidesHeight,
        };

        const channelSettings = get(channel, 'fields.settings');
        const slideMargin = style.width * (get(channelSettings, 'slidesMarginRatio') || 0.01);
        const SlideComponent = Utils.getComponentFromType(
            SlideComponents,
            get(channelSettings, 'slidesSlideView'),
        );
        const slideProps = {
            // useThumbnail: true,
            ...get(channelSettings, 'slidesSlideParams', {}),
        };

        const slideWidthRatio = get(channelSettings, 'slidesWidthRatio', null);
        let slideSize;
        if (slideWidthRatio) {
            slideSize = (slide, index, current, opts) => ({
                width: opts.width * slideWidthRatio,
                height: slidesHeight,
            });
        }

        const userControl = !modals.length;

        return (
            <div
                ref={(ref) => {
                    this.refSlidesContainer = ref;
                }}
                className="slides-container"
                style={style}
            >
                <Slides
                    userControl={userControl}
                    slides={bubbles}
                    index={bubbleIndex}
                    width={width}
                    height={slidesHeight}
                    SlideComponent={SlideComponent}
                    slideMargin={slideMargin}
                    slideProps={slideProps}
                    slideSize={slideSize}
                    onIndexChange={this.onSlideIndexChange}
                    onOffsetChange={this.onSlideOffsetChange}
                />
            </div>
        );
    }

    renderBubbleDetails(bubble) {
        const { width } = this.props;
        const { detailsHeight, slidesHeight } = this.state;
        if (!detailsHeight) {
            return null;
        }

        const style = {
            top: slidesHeight,
            width,
            height: detailsHeight,
        };

        const element = (
            <BubbleDetails
                refContainer={(ref) => {
                    this.refDetails[bubble.id] = ref;
                }}
                key={`d-${bubble.id}`}
                width={style.width}
                height={style.height}
                bubble={bubble}
                onPrevious={this.onPrevious}
                onNext={this.onNext}
            />
        );

        return (
            <div className="bubble-details-container" style={style}>
                <Transitionable
                    transitionIn={this.detailsTransitionIn}
                    transitionOut={this.detailsTransitionOut}
                >
                    {element}
                </Transitionable>
            </div>
        );
    }

    renderBubbleSuggestions(bubble) {
        const { height } = this.props;
        const {
            topBarHeight,
            slidesHeight,
            detailsHeight,
            suggestionsContainerHeight,
            suggestionsHeight,
        } = this.state;
        const { data: dataRepository } = this.context;
        // prettier-ignore
        const suggestionsTop = (
            topBarHeight
            + slidesHeight
            + detailsHeight
            + suggestionsContainerHeight
            - height
        );

        const contentStyle = {};

        let suggestionsElement;
        if (suggestionsHeight) {
            contentStyle.top = Math.max(0, suggestionsTop);
            const { suggestions: suggestionsIDs = [] } = bubble;
            const suggestionsBubbles = [];
            // eslint-disable-next-line no-plusplus
            for (let i = 0, il = suggestionsIDs.length; i < il; ++i) {
                const suggestionID = suggestionsIDs[i];
                const suggestionBubble = dataRepository.findBubbleByID(suggestionID);
                suggestionsBubbles.push(suggestionBubble);
            }

            suggestionsElement = (
                <BubbleSuggestions
                    bubbles={suggestionsBubbles}
                    height={suggestionsHeight}
                    onSuggestionClick={this.onSuggestionClick}
                />
            );
        } else {
            contentStyle.top = suggestionsContainerHeight;
        }

        const element = (
            <div
                ref={(ref) => {
                    this.refSuggestionsContent[bubble.id] = ref;
                }}
                key={`s-${bubble.id}`}
                className="bubble-suggestions-content"
                style={contentStyle}
            >
                <div className="bubble-suggestions-content-inner">
                    <div className="bubble-suggestions-title">{Text.t('related_suggestions')}</div>
                    {suggestionsElement}
                </div>
            </div>
        );

        let containerClassName = 'bubble-suggestions-container';

        if (contentStyle.top > 0) {
            containerClassName += ' hidden';
        }

        return (
            <Transitionable
                forwardRef={(ref) => {
                    this.refSuggestionsContainer = ref;
                }}
                className={containerClassName}
                transitionIn={this.suggestionsTransitionIn}
                transitionOut={this.suggestionsTransitionOut}
            >
                {element}
            </Transitionable>
        );
    }

    render() {
        const { refContainer, modals } = this.props;
        return (
            <div
                className="channel-bubbles"
                ref={(ref) => {
                    this.refContainer = ref;
                    if (refContainer !== null) {
                        refContainer(ref);
                    }
                }}
            >
                {this.renderTitleSpace()}
                {this.renderContent()}
                <Modals modals={modals} />
            </div>
        );
    }
}

ChannelBubbles.propTypes = propTypes;
ChannelBubbles.defaultProps = defaultProps;
ChannelBubbles.contextTypes = contextTypes;

const WithStateContainer = connect(
    null,
    dispatch => ({
        updateBrowser: (id, props) => dispatch(NavigationActions.updateBrowser(id, props)),
        closeBrowserModals: id => dispatch(ModalsActions.closeBrowserModals(id)),
    }),
)(ChannelBubbles);

export default WithStateContainer;
