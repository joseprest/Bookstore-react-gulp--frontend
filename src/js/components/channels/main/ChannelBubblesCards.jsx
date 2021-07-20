/* eslint-disable react/jsx-props-no-spreading, react/no-did-update-set-state */
import detectPointerEvents from 'detect-pointer-events';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { connect } from 'react-redux';
import _ from 'lodash';
import random from 'lodash/random';
import isEmpty from 'lodash/isEmpty';
import $ from 'jquery';
import { TweenMax, TimelineMax, Power1, Expo } from 'gsap/TweenMax';

import * as ManivellePropTypes from '../../../lib/PropTypes';
import Button from '../../partials/Button';
import NavigationActions from '../../../actions/NavigationActions';
import ModalsActions from '../../../actions/ModalsActions';
import Text from '../../../lib/text';
import Utils from '../../../lib/utils';

const propTypes = {
    bubbles: ManivellePropTypes.bubbles.isRequired,
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
    topBarHeight: PropTypes.number.isRequired,
    active: PropTypes.bool.isRequired,
    ready: PropTypes.bool.isRequired,
    bubbleId: PropTypes.string,
    animationDuration: PropTypes.number,
    dragAnimationDuration: PropTypes.number,
    dragReleaseAnimationDuration: PropTypes.number,
    pageAnimationDuration: PropTypes.number,
    cardPadding: PropTypes.number,
    safeOpacity: PropTypes.number,
    animateCards: PropTypes.bool,
    floatingCards: PropTypes.bool,
    cardWidthRatio: PropTypes.number,
    cardSelectedWidthRatio: PropTypes.number,
    randomPosition: PropTypes.bool,
    openModal: PropTypes.func.isRequired,
    updateBrowser: PropTypes.func.isRequired,
};

const defaultProps = {
    bubbleId: null,
    animationDuration: 0.4,
    dragAnimationDuration: 0.05,
    dragReleaseAnimationDuration: 0.6,
    pageAnimationDuration: 0.4,
    cardPadding: 40,
    safeOpacity: 0.7,
    cardWidthRatio: 0.4,
    cardSelectedWidthRatio: 0.6,
    animateCards: true,
    floatingCards: false,
    randomPosition: true,
};

/* eslint-disable react/forbid-prop-types */
const contextTypes = {
    browser: PropTypes.object,
    channel: PropTypes.object,
    data: PropTypes.object,
    store: PropTypes.object,
};
/* eslint-enable react/forbid-prop-types */

class ChannelBubblesCards extends Component {
    constructor(props) {
        super(props);

        this.onDragTransitionComplete = this.onDragTransitionComplete.bind(this);
        this.onSelectCardTransitionComplete = this.onSelectCardTransitionComplete.bind(this);
        this.onUnselectCardTransitionComplete = this.onUnselectCardTransitionComplete.bind(this);
        this.onCardsDroppedTransitionComplete = this.onCardsDroppedTransitionComplete.bind(this);
        this.onTouchStart = this.onTouchStart.bind(this);
        this.onTouchMove = this.onTouchMove.bind(this);
        this.onTouchEnd = this.onTouchEnd.bind(this);
        this.onMouseDown = this.onMouseDown.bind(this);
        this.onMouseMove = this.onMouseMove.bind(this);
        this.onMouseUp = this.onMouseUp.bind(this);
        this.onCardClick = this.onCardClick.bind(this);
        this.onCardCloseClick = this.onCardCloseClick.bind(this);
        this.onSafeClick = this.onSafeClick.bind(this);
        this.onSendBubbleClick = this.onSendBubbleClick.bind(this);
        this.onNextPageClick = this.onNextPageClick.bind(this);

        this.selectionTimeline = null;
        this.dropCardsTimeline = null;
        this.dragTimeline = null;

        this.refCardsList = null;
        this.refSafe = null;
        this.refBottomBar = null;
        this.refCards = [];

        const shuffledBubbles = _.sortBy(props.bubbles, (bubble) => {
            return _.get(bubble, 'fields.published_at.date', _.get(bubble, 'id'));
        }).reverse();
        const currentBubbleId = props.bubbleId;
        const matchingIndex = _.findIndex(shuffledBubbles, bubble => bubble.id === currentBubbleId);
        if (matchingIndex !== -1) {
            shuffledBubbles.splice(0, 0, shuffledBubbles.splice(matchingIndex, 1)[0]);
        }

        this.state = {
            shuffledBubbles,
            selectTransitioning: false,
            cardsListHeight: null,
            cardsPositions: null,
            maxDragX: null,
            cardsDropped: false,
            cardDragging: null,
            selectedCardIndex: null,
            currentClientX: null,
            totalDragDeltaX: 0,
            highestDragDeltaX: 0,
        };
    }

    componentDidMount() {
        const { cardsListHeight } = this.state;
        const state = {};

        if (cardsListHeight) {
            state.cardsPositions = this.getCardsPositions();
            state.maxDragX = this.getMaxDragX(state.cardsPositions);
        } else if (cardsListHeight === null) {
            state.cardsListHeight = this.getCardsListHeight();
        }

        if (_.values(state).length) {
            this.setState(state);
        }

        if (detectPointerEvents.hasApi) {
            const cardsList = this.refCardsList;
            cardsList.addEventListener('pointerdown', this.onMouseDown);
        }
    }

    componentWillReceiveProps({ width: nextWidth, height: nextHeight }) {
        const { width, height } = this.props;
        const sizeChanged = width !== nextWidth || height !== nextHeight;
        if (sizeChanged) {
            this.setState(
                {
                    cardsListHeight: null,
                    selectedCardIndex: null,
                    cardsPositions: null,
                    maxDragX: null,
                    cardsDropped: false,
                },
                () => {
                    const { bubbleId } = this.props;
                    if (bubbleId !== null) {
                        this.unselectBubble();
                    }
                },
            );
        }
    }

    componentDidUpdate(
        { width: prevWidth, height: prevHeight, ready: prevReady, bubbleId: prevBubbleId },
        {
            cardsPositions: prevCardsPositions,
            cardsDropped: prevCardsDropped,
            currentClientX: prevCurrentClientX,
        },
    ) {
        const {
            width,
            height,
            ready,
            bubbleId,
            // bubbles,
            dragAnimationDuration,
            dragReleaseAnimationDuration,
        } = this.props;
        const {
            shuffledBubbles: bubbles,
            cardsListHeight,
            cardsPositions,
            cardsDropped,
            currentClientX,
            selectTransitioning,
            highestDragDeltaX,
        } = this.state;
        const sizeChanged = prevWidth !== width || prevHeight !== height;
        const cardsPositionsReadyToBeSet = cardsListHeight !== null && cardsPositions === null;
        const cardsPositionsNowSet = prevCardsPositions === null && cardsPositions !== null;
        const cardsNowDropped = !prevCardsDropped && cardsDropped;
        const nowReady = !prevReady && ready;
        const bubbleIdChanged = prevBubbleId !== bubbleId;
        const currentClientXChanged = prevCurrentClientX !== currentClientX;
        const dragReady = bubbleId === null && !selectTransitioning;

        if (sizeChanged) {
            const newCardsListHeight = this.getCardsListHeight();

            this.setState({
                cardsListHeight: newCardsListHeight,
            });
        } else if (cardsPositionsReadyToBeSet) {
            const newCardsPositions = this.getCardsPositions();
            const maxDragX = this.getMaxDragX(newCardsPositions);
            this.setState({
                cardsPositions: newCardsPositions,
                maxDragX,
            });
        } else if ((cardsPositionsNowSet && ready) || (cardsPositions !== null && nowReady)) {
            this.dropCards();
        } else if (cardsNowDropped) {
            if (bubbleId !== null) {
                this.selectCard(0);
            }
        } else if (bubbleIdChanged) {
            if (bubbleId === null) {
                this.unselectCard();
            } else {
                const cardIndex = bubbles.findIndex(bubble => bubble.id === bubbleId);
                this.selectCard(cardIndex);
            }
        }

        if (dragReady && currentClientXChanged && prevCurrentClientX !== null) {
            const deltaX =
                currentClientX !== null ? currentClientX - prevCurrentClientX : highestDragDeltaX;
            const duration =
                currentClientX !== null ? dragAnimationDuration : dragReleaseAnimationDuration;
            this.translateCards(deltaX, duration);
        }
    }

    componentWillUnmount() {
        this.killTimelines();

        if (detectPointerEvents.hasApi) {
            const cardsList = this.refCardsList;
            cardsList.removeEventListener('pointerdown', this.onMouseDown);
        }
    }

    onDragTransitionComplete() {
        const { dragging, totalDragDeltaX, maxDragX } = this.state;
        const state = {
            dragTransitioning: false,
        };
        if (!dragging) {
            state.currentClientX = null;
            if (totalDragDeltaX >= 0 || totalDragDeltaX <= -maxDragX) {
                state.highestDragDeltaX = 0;
            }
        }

        this.setState(state);
    }

    onSelectCardTransitionComplete() {
        this.setState({
            selectTransitioning: false,
        });
    }

    onUnselectCardTransitionComplete() {
        const { selectedCardIndex } = this.state;
        this.setState(
            {
                selectTransitioning: false,
                selectedCardIndex: null,
            },
            () => {
                const { floatingCards } = this.props;
                if (floatingCards) {
                    this.addFloatCardTransition(selectedCardIndex);
                }
            },
        );
    }

    onCardsDroppedTransitionComplete() {
        this.setState({
            cardsDropped: true,
        });
    }

    onTouchStart(e) {
        const touch = e.targetTouches[0];
        this.startDrag(touch.clientX);
    }

    onTouchMove(e) {
        const touch = e.targetTouches[0];
        this.drag(touch.clientX);
    }

    onTouchEnd() {
        this.stopDrag();
    }

    onMouseDown(e) {
        this.startDrag(e.clientX);
        $(window).on('mousemove', this.onMouseMove);
        $(window).on('mouseup', this.onMouseUp);
    }

    onMouseMove(e) {
        this.drag(e.clientX);
    }

    onMouseUp() {
        this.stopDrag();
        $(window).off('mousemove', this.onMouseMove);
        $(window).off('mouseup', this.onMouseUp);
    }

    onCardClick(e, bubble, index) {
        const { dragging, dragTransitioning, selectedCardIndex, cardsPositions } = this.state;
        if (dragging || dragTransitioning) {
            return;
        }

        // Do nothing if clicking on the currently selected card
        if (selectedCardIndex === index) {
            return;
        }

        this.setState(
            {
                cardsPositions: this.updateCardsPositionsZindexes(cardsPositions, index),
            },
            () => {
                this.updateCurrentBubble(bubble);
            },
        );
    }

    onCardCloseClick() {
        this.unselectBubble();
    }

    onSafeClick() {
        this.unselectBubble();
    }

    onSendBubbleClick(e, bubble) {
        const { openModal } = this.props;
        const {
            browser: { id: browserId },
        } = this.context;
        const bubbleId = _.get(bubble, 'id');

        openModal('SendBubble', {
            element: e.currentTarget,
            group: `${browserId}:channelMain`,
            bubbleID: bubbleId,
            offsetY: 30,
        });
    }

    onNextPageClick() {
        const { width: containerWidth, pageAnimationDuration } = this.props;
        const { cardsDropped, dragTransitioning, maxDragX, totalDragDeltaX } = this.state;
        if (!cardsDropped || dragTransitioning) {
            return;
        }
        let deltaX = -containerWidth;
        if (totalDragDeltaX - containerWidth < -maxDragX) {
            if (totalDragDeltaX > -maxDragX) {
                deltaX = -maxDragX - totalDragDeltaX;
            } else {
                deltaX = maxDragX;
            }
        }

        this.translateCards(deltaX, pageAnimationDuration);
    }

    getCardWidth(index = null) {
        const { width, cardWidthRatio, cardSelectedWidthRatio } = this.props;
        const { selectedCardIndex } = this.state;
        const widthRatio =
            index !== null && index === selectedCardIndex ? cardSelectedWidthRatio : cardWidthRatio;
        return widthRatio * width;
    }

    getCardsListHeight() {
        const { height } = this.props;
        const bottomBar = this.refBottomBar;
        const cardsListHeight = height - bottomBar.offsetHeight;

        return cardsListHeight;
    }

    getCardsPositions() {
        const {
            // width: containerWidth,
            cardPadding: padding,
            randomPosition,
        } = this.props;
        const {
            // shuffledBubbles: bubbles,
            cardsListHeight: containerHeight,
        } = this.state;
        const cardWidth = this.getCardWidth();
        const cardsList = this.refCardsList;
        const cards = $(cardsList).find('.bubble-card');
        let cardsPositions = [];
        const maxOffsetRotation = 5;
        const minScale = 0.8;
        const maxScale = 1.2;
        const offsetX = 40;
        const offsetY = 30;
        let currentX = padding;
        let currentY = padding;
        let maxX = 0;
        let lastRowCardsCount = 0;
        let cardHeight;
        let i;
        let il;
        let ii;

        // initial positionning - on a grid from top to bottom going right
        for (i = 0, il = cards.length; i < il; i += 1) {
            cardHeight = cards[i].offsetHeight;

            // if card overflows containerHeight, new column
            if (currentY + cardHeight >= containerHeight) {
                // align middle previous row
                for (ii = i - 1; ii >= i - lastRowCardsCount; ii -= 1) {
                    cardsPositions[ii].y += (containerHeight - currentY) / 2;
                }

                currentY = padding;
                currentX = maxX + padding;
                lastRowCardsCount = 0;
            }

            cardsPositions.push({
                width: cardWidth,
                height: cardHeight,
                x: randomPosition ? random(currentX - offsetX, currentX + offsetX) : currentX,
                y: randomPosition ? random(currentY - offsetY, currentY + offsetY) : currentY,
                rotation: randomPosition ? random(-maxOffsetRotation, maxOffsetRotation, true) : 0,
                scale: randomPosition ? random(minScale, maxScale, true) : 1,
                index: i,
                zIndex: i,
            });

            maxX = Math.max(maxX, currentX + cardWidth);
            currentY += cardHeight + padding;
            lastRowCardsCount += 1;
        }

        // align middle last row
        for (ii = i - 1; ii >= i - lastRowCardsCount; ii -= 1) {
            cardsPositions[ii].y += (containerHeight - currentY) / 2;
        }

        cardsPositions = this.updateCardsPositionsZindexes(cardsPositions, 0);

        return cardsPositions;
    }

    getMaxDragX(cardsPositions) {
        const { width: stageWidth, cardPadding: paddingX } = this.props;
        let maxX = 0;
        let cardPosition;

        for (let i = 0, il = cardsPositions.length; i < il; i += 1) {
            cardPosition = cardsPositions[i];
            maxX = Math.max(cardPosition.x + cardPosition.width + paddingX - stageWidth, maxX);
        }

        return Math.max(0, maxX);
    }

    selectCard(index) {
        const {
            selectedCardIndex,
            selectTransitioning,
            cardsDropped,
            dragTransitioning,
        } = this.state;
        if (
            selectedCardIndex === index ||
            selectTransitioning ||
            !cardsDropped ||
            dragTransitioning
        ) {
            return;
        }

        this.setState(
            {
                selectedCardIndex: index,
                selectTransitioning: true,
            },
            () => {
                const { width, animationDuration, safeOpacity } = this.props;
                const { cardsPositions, cardsListHeight } = this.state;
                const card = this.refCards[index];
                const cardDetails = $(card).find('.bubble-card-details')[0];
                const cardCloseButton = $(card).find('.btn-close')[0];
                const safe = this.refSafe;

                const cardPosition = cardsPositions[index];

                // const originalCardWidth = cardPosition.width;
                const originalCardHeight = cardPosition.height;
                const cardWidth = this.getCardWidth(index);
                const cardHeight = card.offsetHeight;
                // const openedCardHeight = cardHeight + cardDetails.offsetHeight;
                const containerWidth = width;
                const containerHeight = cardsListHeight;

                this.killSelectionTimeline();

                this.selectionTimeline = new TimelineMax({
                    onComplete: this.onSelectCardTransitionComplete,
                });

                this.selectionTimeline.to(
                    card,
                    animationDuration,
                    {
                        x: containerWidth / 2 - cardWidth / 2,
                        y: containerHeight / 2 - cardHeight / 2,
                        rotation: 0,
                        scale: Math.max(1, cardPosition.scale),
                        ease: Power1.easeInOut,
                    },
                    0,
                );

                this.selectionTimeline.fromTo(
                    card,
                    animationDuration,
                    {
                        height: originalCardHeight,
                    },
                    {
                        height: cardHeight,
                        onComplete() {
                            TweenMax.set(card, {
                                height: 'auto',
                            });
                        },
                        ease: Power1.easeInOut,
                    },
                    0,
                );

                this.selectionTimeline.fromTo(
                    cardDetails,
                    animationDuration,
                    {
                        alpha: 0,
                    },
                    {
                        alpha: 1,
                        ease: Power1.easeInOut,
                    },
                    0,
                );

                this.selectionTimeline.fromTo(
                    cardCloseButton,
                    animationDuration,
                    {
                        alpha: 0,
                    },
                    {
                        alpha: 1,
                        ease: Power1.easeInOut,
                    },
                    0,
                );

                this.selectionTimeline.fromTo(
                    safe,
                    animationDuration,
                    {
                        alpha: 0,
                    },
                    {
                        alpha: safeOpacity,
                    },
                    0,
                );
            },
        );
    }

    unselectCard() {
        const { selectedCardIndex: index, selectTransitioning } = this.state;
        if (index === null || selectTransitioning) {
            return;
        }

        this.setState(
            {
                selectTransitioning: true,
            },
            () => {
                const { animationDuration } = this.props;
                const { totalDragDeltaX, cardsPositions } = this.state;
                const card = this.refCards[index];
                const cardDetails = $(card).find('.bubble-card-details')[0];
                const cardCloseButton = $(card).find('.btn-close')[0];
                const safe = this.refSafe;
                const cardPosition = cardsPositions[index];

                this.killSelectionTimeline();

                this.selectionTimeline = new TimelineMax({
                    onComplete: this.onUnselectCardTransitionComplete,
                });

                this.selectionTimeline.to(
                    card,
                    animationDuration,
                    {
                        x: cardPosition.x + totalDragDeltaX,
                        y: cardPosition.y,
                        height: cardPosition.height,
                        rotation: cardPosition.rotation,
                        scale: cardPosition.scale,
                        onComplete() {
                            TweenMax.set(card, {
                                height: 'auto',
                            });
                        },
                        ease: Power1.easeInOut,
                    },
                    0,
                );

                this.selectionTimeline.to(
                    cardDetails,
                    animationDuration,
                    {
                        alpha: 0,
                        ease: Power1.easeInOut,
                    },
                    0,
                );

                this.selectionTimeline.to(
                    cardCloseButton,
                    animationDuration,
                    {
                        alpha: 0,
                        ease: Power1.easeInOut,
                    },
                    0,
                );

                this.selectionTimeline.to(
                    safe,
                    animationDuration,
                    {
                        alpha: 0,
                        ease: Power1.easeInOut,
                    },
                    0,
                );
            },
        );
    }

    dropCards() {
        const { animateCards } = this.props;
        const { totalDragDeltaX, cardsPositions } = this.state;
        this.killDropCardsTimeline();
        const cardWidth = this.getCardWidth();

        this.dropCardsTimeline = new TimelineMax({
            onComplete: this.onCardsDroppedTransitionComplete,
        });
        const maxOffsetX = cardWidth * 0.1;
        const maxOffsetY = cardWidth * 0.1;
        const maxOffsetRotation = 6;
        const maxScaleFactor = 0.6;
        const maxDelayFactor = 0.2;
        const droppingDuration = 0.3;
        let position;
        // let index;
        let card;
        let cardX;
        let cardY;
        let cardRotation;
        let cardScale;

        for (let i = 0, il = cardsPositions.length; i < il; i += 1) {
            position = cardsPositions[i];
            card = this.refCards[i];

            cardX = position.x + totalDragDeltaX;
            cardY = position.y;
            cardRotation = position.rotation;
            cardScale = position.scale;

            this.dropCardsTimeline.fromTo(
                card,
                animateCards ? droppingDuration : 0,
                {
                    x: random(cardX - maxOffsetX, cardX + maxOffsetX),
                    y: random(cardY - maxOffsetY, cardY + maxOffsetY),
                    rotation: random(
                        cardRotation - maxOffsetRotation,
                        cardRotation + maxOffsetRotation,
                        true,
                    ),
                    scale: random(cardScale, cardScale + maxScaleFactor, true),
                    opacity: 0,
                },
                {
                    x: cardX,
                    y: cardY,
                    rotation: cardRotation,
                    scale: cardScale,
                    opacity: 1,
                    delay: animateCards ? random(0, maxDelayFactor, true) : 0,
                    ease: Expo.easeOut,
                },
                0,
            );
        }
    }

    killTimelines() {
        this.killSelectionTimeline();
        this.killDropCardsTimeline();
        this.killDragTimeline();
    }

    killSelectionTimeline() {
        if (this.selectionTimeline) {
            this.selectionTimeline.kill();
            this.selectionTimeline = null;
        }
    }

    killDragTimeline() {
        if (this.dragTimeline) {
            this.dragTimeline.kill();
            this.dragTimeline = null;
        }
    }

    killDropCardsTimeline() {
        if (this.dropCardsTimeline === null) {
            return;
        }

        this.dropCardsTimeline.kill();
        this.dropCardsTimeline = null;
    }

    unselectBubble() {
        const { updateBrowser } = this.props;
        const {
            browser: { id: browserId },
        } = this.context;
        updateBrowser(browserId, {
            bubbleId: null,
        });
    }

    // eslint-disable-next-line class-methods-use-this
    updateCardsPositionsZindexes(cardsPositions, currentIndex) {
        let zIndexSorteredCardsPositions = cardsPositions.concat();
        zIndexSorteredCardsPositions.splice(currentIndex, 1);
        zIndexSorteredCardsPositions = _.sortBy(zIndexSorteredCardsPositions, 'zIndex');
        // cardsPositions[currentIndex].zIndex = cardsPositions.length + 1;

        const lastZIndex = cardsPositions.length + 1;
        return cardsPositions.map((cardPosition, i) => {
            if (i === currentIndex) {
                return {
                    ...cardPosition,
                    zIndex: lastZIndex,
                };
            }
            const foundIndex = zIndexSorteredCardsPositions.findIndex(
                position => position.index === i,
            );
            return {
                ...cardPosition,
                zIndex: foundIndex !== -1 ? foundIndex : 0,
            };
        });

        // let cardPosition;
        // let foundIndex;
        // for (let i = 0, il = cardsPositions.length; i < il; i += 1) {
        //     cardPosition = cardsPositions[i];
        //
        //     if (i !== currentIndex) {
        //
        //     }
        // }
        // return cardsPositions;
    }

    updateCurrentBubble(bubble) {
        const { updateBrowser } = this.props;
        const {
            browser: { id: browserId },
        } = this.context;
        const bubbleId = _.get(bubble, 'id');
        updateBrowser(browserId, {
            bubbleId,
        });
    }

    translateCards(deltaX, duration = null) {
        if (deltaX === 0) {
            return;
        }
        const { dragAnimationDuration } = this.props;
        const finalDuration = duration || dragAnimationDuration;

        this.setState(
            ({ totalDragDeltaX, dragging, highestDragDeltaX }) => {
                let newTotalDragDeltaX = totalDragDeltaX + deltaX;
                newTotalDragDeltaX = dragging
                    ? Math.min(totalDragDeltaX + deltaX, 0)
                    : Math.min(totalDragDeltaX + deltaX, 0);
                return {
                    dragTransitioning: true,
                    totalDragDeltaX: newTotalDragDeltaX,
                    highestDragDeltaX:
                        deltaX > 0
                            ? Math.max(highestDragDeltaX, deltaX)
                            : Math.min(highestDragDeltaX, deltaX),
                };
            },
            () => {
                const { totalDragDeltaX: updatedTotalDragDeltaX } = this.state;
                this.killDragTimeline();

                this.dragTimeline = new TimelineMax({
                    onComplete: this.onDragTransitionComplete,
                });
                const { cardsPositions } = this.state;
                let position;
                let card;
                let cardX;

                for (let i = 0, il = cardsPositions.length; i < il; i += 1) {
                    position = cardsPositions[i];
                    card = this.refCards[i];
                    cardX = position.x + updatedTotalDragDeltaX;

                    this.dragTimeline.to(
                        card,
                        finalDuration,
                        {
                            x: cardX,
                        },
                        0,
                    );
                }
            },
        );
    }

    startDrag(clientX) {
        this.setState({
            dragging: false,
            currentClientX: clientX,
            highestDragDeltaX: 0,
        });
    }

    drag(clientX) {
        this.setState({
            currentClientX: clientX,
            dragging: true,
        });
    }

    stopDrag() {
        const { totalDragDeltaX, currentClientX, maxDragX } = this.state;
        const state = {
            dragging: false,
            currentClientX: null,
        };
        if (totalDragDeltaX > 0) {
            state.currentClientX = currentClientX - totalDragDeltaX;
        } else if (totalDragDeltaX < -maxDragX) {
            state.currentClientX = -totalDragDeltaX - maxDragX + currentClientX;
        }
        this.setState(state);
    }

    renderCard(bubble, index, position) {
        const { width: stageWidth } = this.props;
        const { selectedCardIndex, cardWidth, totalDragDeltaX } = this.state;
        const image = this.renderCardImage(bubble, index, position);
        const infos = this.renderCardInfos(bubble, index);
        let closeButton;

        if (selectedCardIndex === index) {
            closeButton = (
                <button
                    type="button"
                    className="btn btn-close"
                    {...Utils.onClick(this.onCardCloseClick)}
                />
            );
        }

        const style = {
            width: this.getCardWidth(index),
        };

        if (position !== null) {
            style.zIndex = position.zIndex;

            if (cardWidth === null) {
                style.height = 'auto';
            } else {
                const dragX = totalDragDeltaX;
                const cardX = position.x;
                const outOfBoundsLeft = dragX + cardWidth + stageWidth < -cardX;
                const outOfBoundsRight = dragX > -cardX + stageWidth * 2;

                if (outOfBoundsLeft || outOfBoundsRight) {
                    return (
                        <div
                            key={`card-${index}`}
                            ref={ref => {
                                this.refCards[index] = ref;
                            }}
                            className={classNames([
                                'bubble-card',
                                'out-of-bounds',
                                {
                                    selected: selectedCardIndex === index,
                                },
                            ])}
                            style={style}
                        />
                    );
                }
            }
        }

        const onCardClick = e => this.onCardClick(e, bubble, index);

        return (
            <div
                key={`card-${index}`}
                {...Utils.onClick(onCardClick, 'end')}
                ref={ref => {
                    this.refCards[index] = ref;
                }}
                className={classNames([
                    'bubble-card',
                    {
                        selected: selectedCardIndex === index,
                    },
                ])}
                style={style}
            >
                <div className="bubble-card-content">
                    {image}
                    {infos}
                </div>
                {closeButton}
            </div>
        );
    }

    // eslint-disable-next-line class-methods-use-this
    renderCardImage(bubble) {
        const picture = _.get(bubble, 'snippet.picture', null);
        const title = _.get(bubble, 'snippet.title', null);

        if (picture === null) {
            return null;
        }

        const style = {
            height: 0,
            paddingBottom: `${(picture.height / picture.width) * 100}%`,
        };

        return (
            <div className="bubble-card-image" style={style}>
                <img src={picture.link} className="bubble-card-image" alt={title} />
            </div>
        );
    }

    renderCardInfos(bubble, index) {
        const { selectedCardIndex } = this.state;
        let details;

        if (selectedCardIndex === index) {
            details = this.renderCardDetails(bubble);
        }

        const title = _.get(bubble, 'snippet.title');
        const subtitle = _.get(bubble, 'snippet.subtitle');

        return (
            <div className="bubble-card-infos">
                <div className="bubble-card-infos-inner">
                    <div className="bubble-card-title">{title}</div>
                    {!isEmpty(subtitle) ? (
                        <div className="bubble-card-subtitle">{subtitle}</div>
                    ) : null}
                    {details}
                </div>
            </div>
        );
    }

    renderCardDetails(bubble) {
        const description = _.get(bubble, 'fields.description.value', _.get(bubble, 'snippet.description', null));

        const onButtonClick = e => this.onSendBubbleClick(e, bubble);

        const image = _.get(bubble, 'snippet.picture', null);
        let credits = _.get(bubble, 'fields.credits.value', '');
        if (image && credits && credits.length) {
            credits = <div className="bubble-card-credits">{credits}</div>;
        } else {
            credits = null;
        }

        return (
            <div className="bubble-card-details">
                <div
                    className="bubble-card-description"
                    dangerouslySetInnerHTML={{ __html: description }}
                />
                {credits}
                <div className="bubble-card-button-container">
                    <Button icon="send-bubble" onClick={onButtonClick}>
                        {Text.t('btn_send_bubble')}
                    </Button>
                </div>
            </div>
        );
    }

    renderBottomBar() {
        const { cardsPositions, selectedCardIndex } = this.state;
        const { channel } = this.context;
        let zIndex = null;
        if (cardsPositions !== null) {
            zIndex =
                selectedCardIndex !== null ? cardsPositions.length - 1 : cardsPositions.length + 2;
        }

        const style = {
            zIndex,
        };

        return (
            <div
                ref={ref => {
                    this.refBottomBar = ref;
                }}
                className="bubbles-cards-bottom-bar"
                style={style}
            >
                <Button icon="refresh" onClick={this.onNextPageClick}>
                    {Text.t('btn_see_other_types', {
                        types: _.get(channel, 'snippet.title', '').toLowerCase(),
                    })}
                </Button>
            </div>
        );
    }

    renderSafe() {
        const { height, topBarHeight } = this.props;
        const { selectedCardIndex } = this.state;
        if (selectedCardIndex === null) {
            return null;
        }

        const { cardsPositions } = this.state;

        const style = {
            height: height + topBarHeight,
            zIndex: cardsPositions ? cardsPositions.length : null,
        };

        return (
            <div
                ref={ref => {
                    this.refSafe = ref;
                }}
                className="bubbles-cards-safe"
                style={style}
                {...Utils.onClick(this.onSafeClick, 'end')}
            />
        );
    }

    renderCards() {
        const { shuffledBubbles, cardsListHeight, cardsPositions } = this.state;
        const cards = [];
        const bubbles = shuffledBubbles;

        for (let i = 0, il = bubbles.length; i < il; i += 1) {
            const bubble = bubbles[i];
            if (!bubble) {
                break;
            }
            const position = cardsPositions ? cardsPositions[i] : null;
            cards.push(this.renderCard(bubble, i, position));
        }

        const style = {
            height: cardsListHeight,
        };

        const events = {
            onTouchStart: this.onTouchStart,
            onTouchMove: this.onTouchMove,
            onTouchEnd: this.onTouchEnd,
            onTouchCancel: this.onTouchEnd,
            onMouseDown: this.onMouseDown,
        };

        // if (!detectPointerEvents.hasApi && Modernizr.touchevents) {
        //     events = {
        //         onTouchStart: this.onTouchStart,
        //         onTouchMove: this.onTouchMove,
        //         onTouchEnd: this.onTouchEnd,
        //         onTouchCancel: this.onTouchEnd,
        //     };
        // } else if (!detectPointerEvents.hasApi) {
        //     events = {
        //         onMouseDown: this.onMouseDown,
        //     };
        // }

        return (
            <div
                ref={ref => {
                    this.refCardsList = ref;
                }}
                className="bubbles-cards-list"
                style={style}
                {...events}
            >
                {cards}
            </div>
        );
    }

    render() {
        const { ready } = this.props;

        return (
            <div
                className={classNames([
                    'channel-bubbles-cards',
                    {
                        ready,
                    },
                ])}
            >
                {this.renderCards()}
                {this.renderBottomBar()}
                {this.renderSafe()}
            </div>
        );
    }
}

ChannelBubblesCards.propTypes = propTypes;
ChannelBubblesCards.defaultProps = defaultProps;
ChannelBubblesCards.contextTypes = contextTypes;

export default connect(
    null,
    dispatch => ({
        openModal: (name, props) => dispatch(ModalsActions.open(name, props)),
        updateBrowser: (id, props) => dispatch(NavigationActions.updateBrowser(id, props)),
    }),
)(ChannelBubblesCards);
