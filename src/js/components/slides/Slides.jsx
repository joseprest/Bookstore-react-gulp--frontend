import React, { Component } from 'react';
import PropTypes from 'prop-types';
// import detectPointerEvents from 'detect-pointer-events';
import _ from 'lodash';
import isObject from 'lodash/isObject';
import isFunction from 'lodash/isFunction';
import debounce from 'lodash/debounce';
import $ from 'jquery';
import createDebug from 'debug';
import classNames from 'classnames';
import {
    TweenMax, Power1, TimelineMax, Linear,
} from 'gsap/TweenMax';

import DefaultSlide from './slide/Slide';
import Transitionable from '../helpers/Transitionable';
import Utils from '../../lib/utils';

const debug = createDebug('manivelle:components:slides');

const hashesIds = {};

const propTypes = {
    // Taille du conteneur, les slides s'affichent à l'horizontale, chaque slide
    // prends donc toute la hauteur du conteneur
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
    // bubbles
    slides: PropTypes.array, // eslint-disable-line react/forbid-prop-types
    SlideComponent: PropTypes.func,
    slideProps: PropTypes.oneOfType([PropTypes.func, PropTypes.object]),
    // bubbles index
    index: PropTypes.number,
    slideMargin: PropTypes.oneOfType([PropTypes.func, PropTypes.number]), // marge entre les slides
    // va remplacer slideWidth/slideHeight/maxSlideWidth/maxSlideHeight, si null,
    // prends les tailles de l'image de la bubble
    slideSize: PropTypes.func,
    // combien de pixels pour considérer comme un swipe
    swipeThreshold: PropTypes.number,
    // En secondes
    animationDuration: PropTypes.number,
    // type d'animation de transition 'swipe' ou 'fade'
    transitionType: PropTypes.string,
    // lorsqu'on reçoit un nouveau set de slides, direction par défault
    // (pour le transitionType 'slide')
    defaultAnimationDirection: PropTypes.string,
    // opacité des slides autres que celle courrante
    otherSlidesOpacity: PropTypes.number,
    // number of slides outside stage to render (buffer)
    renderableSlidesOutsideStage: PropTypes.number,
    // pas testé à false depuis le changement de slides, false empêche de
    // boucler le début et la fin de l'array de slides
    loop: PropTypes.bool,
    // empêche le mouvement de slides
    userControl: PropTypes.bool,
    // facteur -> pourcentage du delta d'un tour de la manivelle
    // (distance en pixels entre la courante et prochaine slide)
    manivelleOffsetFactor: PropTypes.number,
    createOffsetTimeline: PropTypes.func,
    refContainer: PropTypes.func,
    usePointerEvents: PropTypes.bool,

    onIndexChange: PropTypes.func,
    onOffsetChange: PropTypes.func,
    onSlideClick: PropTypes.func,
    onUpdateSlidesPositions: PropTypes.func,
    onSlideTransitionIn: PropTypes.func,
    onSlideTransitionOut: PropTypes.func,
    onSlideTransitionOther: PropTypes.func,
};

const defaultProps = {
    slides: [],
    SlideComponent: DefaultSlide,
    slideProps: {},
    index: 0,
    slideMargin: 0,
    slideSize(slide, index, current, opts) {
        const pictureWidth = _.get(slide, 'snippet.picture.width', 1);
        const pictureHeight = _.get(slide, 'snippet.picture.height', 1);
        const containerWidth = opts.width || 1;
        const containerHeight = opts.height || 1;

        const slideRatioSize = Utils.getMaxSize(
            pictureWidth,
            pictureHeight,
            containerWidth,
            containerHeight,
        );
        return {
            width: slideRatioSize.width,
            height: slideRatioSize.height,
        };
    },
    swipeThreshold: 10,
    animationDuration: 0.4,
    transitionType: 'slide', // slide || fade
    defaultAnimationDirection: 'right', // left || right
    otherSlidesOpacity: 0.2,
    renderableSlidesOutsideStage: 2,
    loop: true,
    userControl: false,
    manivelleOffsetFactor: 1000,
    createOffsetTimeline: null,
    refContainer: null,
    usePointerEvents: false, // detectPointerEvents.hasApi

    onIndexChange: null,
    onOffsetChange: null,
    onSlideClick: null,
    onUpdateSlidesPositions: null,
    onSlideTransitionIn: null,
    onSlideTransitionOut: null,
    onSlideTransitionOther: null,
};

class Slides extends Component {
    static getHashFromSlides(slides) {
        const ids = [];
        _.each(slides, (slide) => {
            ids.push(_.get(slide, 'id', ''));
        });
        const slidesHash = Utils.getMD5FromString(ids.join('-'));
        let hashID;
        if (typeof hashesIds[slidesHash] === 'undefined') {
            hashID = `${_.size(hashesIds)}`;
            hashesIds[slidesHash] = hashID;
        } else {
            hashID = hashesIds[slidesHash];
        }

        return hashID;
    }

    static getLoopIndex(fromIndex, toIndex, allSlides, direction) {
        const startIndex = allSlides.findIndex(slide => slide.current === true);

        if (direction === 'right') {
            for (let i = startIndex, il = allSlides.length; i < il; i += 1) {
                const slide = allSlides[i];
                if (slide.index === toIndex) {
                    return slide.loopIndex;
                }
            }
        } else {
            for (let i = startIndex, il = 0; i >= il; i -= 1) {
                const slide = allSlides[i];
                if (slide.index === toIndex) {
                    return slide.loopIndex;
                }
            }
        }

        return 0;
    }

    static getAllSlides(lastBatch, currentBatch, direction) {
        let slides = [];
        if (direction === 'right') {
            const { slides: lastSlides } = lastBatch;
            const { slides: nextSlides } = currentBatch;
            const lastSlidesCount = lastSlides.length;
            const nextSlidesCount = nextSlides.length;
            let currentNextIndex = 0;
            for (let i = 0; i < lastSlidesCount; i += 1) {
                const lastSlide = lastSlides[i];
                const { key: lastKey } = lastSlide;
                let found = false;
                for (let ii = currentNextIndex; ii < nextSlidesCount; ii += 1) {
                    const nextSlide = nextSlides[ii];
                    const { key: nextKey } = nextSlide;
                    if (nextKey === lastKey) {
                        currentNextIndex = ii + 1;
                        found = true;
                        slides.push(nextSlide);
                    }
                }

                if (!found) {
                    slides.push(lastSlide);
                }
            }

            for (let i = currentNextIndex; i < nextSlidesCount; i += 1) {
                slides.push(nextSlides[i]);
            }
        } else if (lastBatch && currentBatch) {
            const { slides: lastSlides } = lastBatch;
            const { slides: nextSlides } = currentBatch;
            const nextSlidesCount = nextSlides.length;
            const lastSlidesCount = lastSlides.length;
            let currentLastIndex = 0;
            for (let i = 0; i < nextSlidesCount; i += 1) {
                const nextSlide = nextSlides[i];
                const { key: nextKey } = nextSlide;
                let found = false;
                for (let ii = currentLastIndex; ii < lastSlidesCount; ii += 1) {
                    const lastSlide = lastSlides[ii];
                    const { key: lastKey } = lastSlide;
                    if (lastKey === nextKey) {
                        currentLastIndex = ii + 1;
                        found = true;
                        slides.push(nextSlide);
                    }
                }

                if (!found) {
                    slides.push(nextSlide);
                }
            }

            for (let i = currentLastIndex; i < lastSlidesCount; i += 1) {
                slides.push(lastSlides[i]);
            }
        } else {
            const { slides: currentSlides } = currentBatch;
            slides = currentSlides;
        }

        return slides;
    }

    constructor(props) {
        super(props);

        this.slideTransitionIn = this.slideTransitionIn.bind(this);
        this.slideTransitionOut = this.slideTransitionOut.bind(this);
        this.slideTransitionOther = this.slideTransitionOther.bind(this);
        this.onSlidesTransitionsStart = this.onSlidesTransitionsStart.bind(this);
        this.onSlidesTransitionComplete = this.onSlidesTransitionComplete.bind(this);
        this.onManivelleRotation = this.onManivelleRotation.bind(this);
        this.onSlideClick = this.onSlideClick.bind(this);
        this.onMouseDown = this.onMouseDown.bind(this);
        this.onMouseMove = this.onMouseMove.bind(this);
        this.onMouseOut = this.onMouseOut.bind(this);
        this.onMouseUp = this.onMouseUp.bind(this);
        this.onTouchStart = this.onTouchStart.bind(this);
        this.onTouchMove = this.onTouchMove.bind(this);
        this.onTouchEnd = this.onTouchEnd.bind(this);
        this.stopOffset = this.stopOffset.bind(this);
        this.stopOffsetDebounced = debounce(this.stopOffset, 500);
        this.offsetTimeline = null;
        this.waitForTransitionComplete = false;
        this.refContainer = null;

        const { slides, index } = this.props;
        const slidesHash = Slides.getHashFromSlides(slides);
        const currentBatch = this.getBatch(index, slides, {
            hashID: slidesHash,
        });

        this.state = {
            index,
            offset: 0,
            slidesHash,
            lastBatch: null,
            currentBatch,
            allSlides: currentBatch.slides,
            slidesTranslations: this.getSlidesTranslations(
                currentBatch.slides,
                null,
                currentBatch,
                null,
            ),
            direction: null,
            loopIndex: 0,

            mouseDown: false,
            panning: false,
            swipe: null,
            clientX: null,
            transitioning: false,
        };
    }

    componentDidMount() {
        const { userControl, usePointerEvents } = this.props;
        $(document).on('manivelle:rotation', this.onManivelleRotation);
        if (userControl && usePointerEvents) {
            this.refContainer.addEventListener('pointerdown', this.onMouseDown);
            this.refContainer.addEventListener('pointermove', this.onMouseMove);
            this.refContainer.addEventListener('pointerleave', this.onMouseOut);
            this.refContainer.addEventListener('pointerup', this.onMouseUp);
        }
    }

    componentWillReceiveProps(nextProps) {
        const {
            width, height, defaultAnimationDirection, index, slides,
        } = this.props;
        const { index: currentIndex, allSlides, slidesHash } = this.state;
        const sizeChanged = width !== nextProps.width || height !== nextProps.height;
        const indexChanged = index !== nextProps.index && currentIndex !== nextProps.index;
        const slidesChanged = slides !== nextProps.slides;

        const state = {};

        if (indexChanged || slidesChanged || sizeChanged) {
            let nextIndex = currentIndex;
            if (indexChanged) {
                nextIndex = Math.max(0, Math.min(nextProps.index, nextProps.slides.length - 1));
                state.index = nextIndex;
            }

            if (slidesChanged) {
                if (!nextProps.slides.length) {
                    return;
                }
                state.direction = defaultAnimationDirection;
                state.loopIndex = 0;
                state.slidesHash = Slides.getHashFromSlides(nextProps.slides);
            } else if (indexChanged) {
                state.direction = this.getDirection(currentIndex, nextIndex);
                state.loopIndex = Slides.getLoopIndex(
                    currentIndex,
                    nextIndex,
                    allSlides,
                    state.direction,
                );
            }

            const batchState = this.getBatchState(
                nextProps.slides,
                currentIndex,
                nextIndex,
                state.direction,
                state.loopIndex,
                {
                    hashID: slidesChanged ? state.slidesHash : slidesHash,
                    width: sizeChanged ? nextProps.width : width,
                    height: sizeChanged ? nextProps.height : height,
                },
            );

            this.setState({
                ...state,
                ...batchState,
            });
        }
    }

    shouldComponentUpdate({ slides }) {
        return slides.length > 0;
    }

    componentDidUpdate(prevProps, prevState) {
        const { width, height, onIndexChange } = this.props;
        const { index, offset, panning } = this.state;
        const sizeChanged = prevProps.width !== width || prevProps.height !== height;

        const indexChanged = prevState.index !== index;
        const offsetChanged = prevState.offset !== offset;
        const offsetDirectionChanged = offsetChanged
            && ((prevState.offset > 0 && offset < 0) || (prevState.offset < 0 && offset > 0));

        if (sizeChanged) {
            this.updateSlidesPositions();
        }

        if (indexChanged && onIndexChange !== null) {
            onIndexChange(index, offset);
        }

        if (this.offsetTimeline && (offsetDirectionChanged || indexChanged || !panning)) {
            this.offsetTimeline.progress(indexChanged ? 1 : 0, true);
            TweenMax.killTweensOf(this.offsetTimeline);
            this.offsetTimeline.kill();
            this.offsetTimeline = null;

            if (indexChanged) {
                this.waitForTransitionComplete = true;
            }
        }

        if (panning && !this.offsetTimeline && !this.waitForTransitionComplete) {
            this.offsetTimeline = this.createOffsetTimeline();
        }

        if (offsetChanged && panning && this.offsetTimeline) {
            this.updateSlidesOffset(offset);
        }
    }

    componentWillUnmount() {
        const { userControl, usePointerEvents } = this.props;
        $(document).off('manivelle:rotation', this.onManivelleRotation);

        if (this.offsetTimeline) {
            this.offsetTimeline.kill();
            this.offsetTimeline = null;
        }

        if (userControl && usePointerEvents) {
            this.refContainer.removeEventListener('pointerdown', this.onMouseDown);
            this.refContainer.removeEventListener('pointermove', this.onMouseMove);
            this.refContainer.removeEventListener('pointerleave', this.onMouseOut);
            this.refContainer.removeEventListener('pointerup', this.onMouseUp);
        }
    }

    onManivelleRotation(e) {
        const { userControl, slides, manivelleOffsetFactor } = this.props;
        const { transitioning } = this.state;
        const manivelleReady = userControl && !transitioning && slides.length > 1;

        const { manivelle } = e;

        if (!manivelleReady || manivelle.deltaPercent === 0) {
            return;
        }

        const distance = this.getDistanceBetweenCurrentAndNextSlide();

        const deltaOffset = (manivelle.deltaPercent * manivelleOffsetFactor) / distance;
        const state = this.getOffsetState(deltaOffset);

        this.setState(state, this.stopOffsetDebounced);
    }

    onSlidesTransitionsStart() {
        this.setState({
            transitioning: true,
        });
    }

    onSlidesTransitionComplete() {
        this.setState({
            transitioning: false,
        });

        if (this.waitForTransitionComplete) {
            this.offsetTimeline = this.createOffsetTimeline();
            this.waitForTransitionComplete = false;
        }
    }

    onSlideClick(e, slide, position) {
        const { userControl, onSlideClick } = this.props;
        const {
            transitioning, panning, index, currentBatch,
        } = this.state;
        if (transitioning || panning) {
            return;
        }

        const nextIndex = position.index;

        if (userControl && index !== nextIndex) {
            const currentSlide = currentBatch.slides.find(it => it.current === true);
            const direction = position.x < currentSlide.x ? 'left' : 'right';
            const state = this.getStateForIndex(nextIndex, direction);
            this.setState(state);
        }

        if (onSlideClick !== null) {
            onSlideClick(e, slide, position);
        }
    }

    // eslint-disable-next-line
    onTouchStart(e) {}

    onTouchMove(e) {
        const { clientX } = this.state;
        const touch = e.changedTouches[e.changedTouches.length - 1];

        if (!clientX) {
            this.setState({
                clientX: touch.clientX,
            });
            return;
        }

        this.onPan(touch.clientX);
    }

    onTouchEnd() {
        this.setState(
            {
                clientX: 0,
            },
            () => {
                this.stopOffset();
            },
        );
    }

    onMouseDown(e) {
        if (e.button === 2) {
            this.setState({
                mouseDown: false,
                clientX: 0,
            });
            return;
        }

        this.setState({
            mouseDown: true,
        });
    }

    onMouseMove(e) {
        const { mouseDown, clientX } = this.state;
        if (!mouseDown) {
            return;
        }

        if (!clientX) {
            this.setState({
                clientX: e.clientX,
            });
            return;
        }

        this.onPan(e.clientX);
    }

    onMouseOut() {
        this.setState(
            {
                mouseDown: false,
                clientX: 0,
            },
            () => {
                this.stopOffset();
            },
        );
    }

    onMouseUp() {
        this.setState(
            {
                mouseDown: false,
                clientX: 0,
            },
            () => {
                this.stopOffset();
            },
        );
    }

    onPan(clientX) {
        const { slides, swipeThreshold } = this.props;
        const { clientX: currentClientX, transitioning, swipe } = this.state;
        const deltaX = currentClientX - clientX;
        if (!deltaX || slides.length <= 1 || transitioning) {
            return;
        }

        // get la distance entre slideCourante et next
        const direction = deltaX > 0 ? 1 : -1;
        const distance = this.getDistanceBetweenCurrentAndNextSlide();

        const deltaOffset = deltaX / distance;

        const state = this.getOffsetState(deltaOffset);
        state.clientX = clientX;

        const diffX = clientX - currentClientX;

        if ((swipe === 'right' && direction === -1) || (swipe === 'left' && direction === 1)) {
            state.swipe = null;
        }

        if (diffX < -swipeThreshold) {
            state.swipe = 'right';
        } else if (diffX > swipeThreshold) {
            state.swipe = 'left';
        }

        this.setState(state);
    }

    getDirection(lastIndex, currentIndex) {
        const { slides, defaultAnimationDirection } = this.props;
        const isIndexGreater = lastIndex < currentIndex;
        const distanceLeft = isIndexGreater
            ? lastIndex - 0 + (slides.length - currentIndex)
            : lastIndex - currentIndex;
        const distanceRight = isIndexGreater
            ? currentIndex - lastIndex
            : slides.length - lastIndex + (currentIndex - 0);
        let direction;

        if (distanceLeft < distanceRight) {
            direction = 'left';
        } else if (distanceLeft > distanceRight) {
            direction = 'right';
        } else {
            direction = defaultAnimationDirection;
        }

        return direction;
    }

    getBatchState(slides, fromIndex, toIndex, direction, loopIndex, opts) {
        const { width, height } = this.props;
        const { slidesHash, currentBatch } = this.state;
        const newOpts = {
            width,
            height,
            hashID: slidesHash,
            ...opts,
        };

        const data = {};
        data.lastBatch = currentBatch;
        data.currentBatch = this.getBatch(toIndex, slides, {
            containerWidth: newOpts.width,
            containerHeight: newOpts.height,
            loopIndex,
            hashID: newOpts.hashID,
        });
        data.allSlides = Slides.getAllSlides(data.lastBatch, data.currentBatch, direction);
        data.slidesTranslations = this.getSlidesTranslations(
            data.allSlides,
            data.lastBatch,
            data.currentBatch,
            direction,
            newOpts,
        );

        return data;
    }

    getBatch(index, slides, opts = {}) {
        const { hashID } = opts;
        const slidesPositions = this.getRenderableSlidesPositions(index, slides, opts);

        let x = 0;
        let y = 0;
        let width = 0;
        if (slidesPositions.length) {
            const firstSlide = slidesPositions[0];
            const lastSlide = slidesPositions[slidesPositions.length - 1];
            const { x: firstSlideX, y: firstSlideY } = firstSlide;
            const { x: lastSlideX } = lastSlide;
            x = firstSlideX;
            y = firstSlideY;
            width = lastSlideX - firstSlideX + lastSlide.width;

            let currentLeft = 0;
            for (let i = 0, sl = slidesPositions.length; i < sl; i += 1) {
                const slidePosition = slidesPositions[i];
                slidePosition.x = currentLeft;
                currentLeft += slidePosition.width;
            }
        }

        return {
            id: `${index}-${hashID}`,
            x,
            y,
            width,
            slides: slidesPositions,
        };
    }

    getRenderableSlidesPositions(index, slides, opts = {}) {
        if (!slides.length) {
            return [];
        }

        const {
            width, height, loop, renderableSlidesOutsideStage,
        } = this.props;
        const { loopIndex: currentLoopIndex = null } = this.state || {};

        const newOpts = {
            containerWidth: width,
            containerHeight: height,
            ...opts,
            loopIndex:
                typeof opts.loopIndex !== 'undefined' && opts.loopIndex !== null
                    ? opts.loopIndex
                    : currentLoopIndex || 0,
        };

        // utiliser le meme array
        const { containerWidth } = newOpts;
        let leftIndex = index;
        let rightIndex = index;
        const slidesPositions = [];
        let currentX;
        let slidePosition;

        const slidesCount = slides.length;

        // current
        const currentSlidePosition = this.getSlidePosition(slides[index], index, newOpts);
        slidesPositions.push(currentSlidePosition);

        // left
        slidePosition = currentSlidePosition;
        currentX = slidePosition.x;
        while (currentX > -slidePosition.width * renderableSlidesOutsideStage) {
            if (loop) {
                // eslint-disable-next-line no-plusplus
                leftIndex = --leftIndex < 0 ? slidesCount - 1 : leftIndex;
            } else {
                leftIndex -= 1;
                if (leftIndex < 0) {
                    break;
                }
            }

            slidePosition = this.getSlidePosition(slides[leftIndex], leftIndex, currentX, newOpts);
            slidePosition.x -= slidePosition.width;
            slidesPositions.unshift(slidePosition);
            currentX = slidePosition.x;
        }

        // right
        slidePosition = currentSlidePosition;
        currentX = slidePosition.x + slidePosition.width;
        while (currentX < containerWidth + slidePosition.width * renderableSlidesOutsideStage) {
            if (loop) {
                // eslint-disable-next-line no-plusplus
                rightIndex = ++rightIndex >= slidesCount ? 0 : rightIndex;
            } else {
                rightIndex += 1;
                if (rightIndex >= slidesCount) {
                    break;
                }
            }

            slidePosition = this.getSlidePosition(
                slides[rightIndex],
                rightIndex,
                currentX,
                newOpts,
            );
            slidesPositions.push(slidePosition);
            currentX += slidePosition.width;
        }

        // add loopIndex prop + update key prop
        const slidesPositionsCount = slidesPositions.length;
        const currentIndex = slidesPositions.findIndex(slide => slide.current === true);
        let { loopIndex: leftLoopIndex } = newOpts;
        for (let i = currentIndex; i >= 0; i -= 1) {
            slidePosition = slidesPositions[i];
            if (!slidePosition.current && slidePosition.index === slidesCount - 1) {
                leftLoopIndex -= 1;
            }
            slidePosition.key += `-${leftLoopIndex}`;
            slidePosition.loopIndex = leftLoopIndex;
        }

        let { loopIndex: rightLoopIndex } = newOpts;
        for (let i = currentIndex + 1; i < slidesPositionsCount; i += 1) {
            slidePosition = slidesPositions[i];
            if (slidePosition.index === 0) {
                rightLoopIndex += 1;
            }
            slidePosition.key += `-${rightLoopIndex}`;
            slidePosition.loopIndex = rightLoopIndex;
        }

        return slidesPositions;
    }

    getSlidePosition(slide, index, fromX, opts = {}) {
        const {
            width, height, slideSize: getSlideSize, slideMargin: getSlideMargin,
        } = this.props;
        const finalOpts = isObject(fromX) ? fromX : opts;
        let finalFromX = isObject(fromX) ? null : fromX;

        const containerWidth = finalOpts.containerWidth || width;
        const containerHeight = finalOpts.containerHeight || height;
        const current = finalFromX === null;
        const slideSize = getSlideSize(slide, index, current, {
            width: containerWidth,
            height: containerHeight,
        });
        const slideMargin = isFunction(getSlideMargin)
            ? getSlideMargin(slide, index)
            : getSlideMargin;
        const slideTotalWidth = slideSize.width + slideMargin * 2;
        const slideTotalHeight = slideSize.height;

        if (current) {
            finalFromX = (containerWidth - slideTotalWidth) / 2;
        }

        const hashID = typeof finalOpts.hashID !== 'undefined' ? finalOpts.hashID : '';
        return {
            current,
            key: `slide-${hashID}-${slide.id}-${index}`,
            index,
            width: slideTotalWidth,
            height: slideTotalHeight,
            margin: slideMargin,
            x: finalFromX,
            y: 0,
        };
    }

    getSlidesTranslations(slides, lastBatch, currentBatch, direction, opts) {
        const translations = [];
        let slide;
        let translation;
        for (let i = 0, sl = slides.length; i < sl; i += 1) {
            slide = slides[i];
            translation = this.getSlideTranslation(
                slide.key,
                lastBatch,
                currentBatch,
                slides,
                direction,
                opts,
            );
            translations.push(translation);
        }

        return translations;
    }

    getSlideTranslation(slideKey, lastBatch, currentBatch, allSlides, direction, opts = {}) {
        const { width, otherSlidesOpacity } = this.props;
        const {
            lastBatch: defaultLastBatch,
            currentBatch: defaultCurrentBatch,
            // direction: defaultDirection,
            allSlides: defaultAllSlides,
        } = this.state || {};

        const finalLastBatch = typeof lastBatch !== 'undefined' ? lastBatch : defaultLastBatch;
        const finalCurrentBatch = typeof currentBatch !== 'undefined' ? currentBatch : defaultCurrentBatch;
        // const finalDirection = typeof direction !== 'undefined' ? direction : defaultDirection;
        const finalAllSlides = typeof allSlides !== 'undefined' ? allSlides : defaultAllSlides;

        const lastCurrent = (finalLastBatch ? finalLastBatch.slides : []).find(
            slide => slide.current === true,
        );
        const nextCurrent = finalCurrentBatch.slides.find(slide => slide.current === true);

        let totalWidth = 0;
        let lastCenterX = 0;
        let nextCenterX = 0;
        let slideX = 0;
        for (let i = 0, sl = finalAllSlides.length; i < sl; i += 1) {
            const slidePosition = finalAllSlides[i];

            if (lastCurrent && slidePosition.key === lastCurrent.key) {
                lastCenterX += totalWidth + slidePosition.width / 2;
            }
            if (slidePosition.key === nextCurrent.key) {
                nextCenterX += totalWidth + slidePosition.width / 2;
                if (!lastCurrent) {
                    lastCenterX = nextCenterX;
                }
            }

            if (slidePosition.key === slideKey) {
                slideX = totalWidth;
            }

            totalWidth += slidePosition.width;
        }

        const containerWidth = opts.width || width;
        const lastOffsetX = -(lastCenterX - containerWidth / 2);
        const nextOffsetX = -(nextCenterX - containerWidth / 2);

        const isCurrent = nextCurrent.key === slideKey;
        const isLastCurrent = !!(lastCurrent && lastCurrent.key === slideKey);

        return {
            key: slideKey,
            current: isCurrent,
            lastCurrent: isLastCurrent,
            from: {
                x: slideX + lastOffsetX, // TOUJOURS DÉCALÉ D'UNE SLIDE VERS LA DROITE
                alpha: isCurrent || !isLastCurrent ? otherSlidesOpacity : 1,
            },
            to: {
                x: slideX + nextOffsetX,
                alpha: !isCurrent ? otherSlidesOpacity : 1,
                ease: Power1.easeInOut,
            },
        };
    }

    getStateForIndex(nextIndex, direction) {
        const { slides } = this.props;
        const { index: currentIndex, allSlides } = this.state;
        const finalDirection = typeof direction !== 'undefined'
            ? direction
            : this.getDirection(currentIndex, nextIndex);
        const loopIndex = Slides.getLoopIndex(currentIndex, nextIndex, allSlides, finalDirection);
        const state = this.getBatchState(
            slides,
            currentIndex,
            nextIndex,
            finalDirection,
            loopIndex,
        );
        state.index = nextIndex;
        state.direction = finalDirection;
        state.loopIndex = loopIndex;

        return state;
    }

    getDistanceBetweenCurrentAndNextSlide() {
        const { offset, currentBatch } = this.state;
        const direction = offset > 0 ? 1 : -1;
        const currentSlides = currentBatch.slides;
        const currentIndex = _.findIndex(currentSlides, slide => slide.current === true);
        const nextIndex = Utils.getLoopNumber(
            currentIndex + direction,
            0,
            currentSlides.length - 1,
        );
        const currentSlide = currentSlides[currentIndex];
        const nextSlide = currentSlides[nextIndex];

        const distance = Math.abs(
            nextSlide.x + nextSlide.width / 2 - (currentSlide.x + currentSlide.width / 2),
        );

        return distance;
    }

    getOffsetState(deltaOffset) {
        const { slides } = this.props;
        const { index: currentIndex, offset } = this.state;
        let { index } = this.state;
        let newOffset = offset + deltaOffset;
        const offsetFloor = Math.floor(newOffset);
        const offsetCeil = Math.ceil(newOffset);
        const slidesCount = slides.length;

        const min = 0;
        const max = slidesCount - 1;

        if (newOffset > 1) {
            index = Utils.getLoopNumber(index + 1, min, max);
            newOffset -= offsetFloor;
        } else if (newOffset < -1) {
            index = Utils.getLoopNumber(index - 1, min, max);
            newOffset -= offsetCeil;
        }

        // let newIndex = index;
        // if (newOffset > 0) {
        //     newIndex += 1;
        // } else {
        //     newIndex -= 1;
        // }
        // newIndex = Utils.getLoopNumber(newIndex, min, max);

        // const offsetSameDirection = (newOffset > 0 && offset > 0)
        // || (newOffset < 0 && offset < 0);

        let state;
        if (index !== currentIndex) {
            const direction = deltaOffset >= 0 ? 'right' : 'left';
            state = this.getStateForIndex(index, direction);
        } else {
            state = {};
        }

        const offsetIndexDelta = newOffset >= 0 ? 1 : -1;
        const offsetDirection = offsetIndexDelta === 1 ? 'right' : 'left';

        let nextIndex = index + offsetIndexDelta;
        if (nextIndex === -1) {
            nextIndex = slidesCount - 1;
        } else if (nextIndex === slidesCount) {
            nextIndex = 0;
        }

        state.panning = true;
        state.index = index;
        state.offsetIndex = nextIndex;
        state.offsetDirection = offsetDirection;
        state.offset = newOffset;

        return state;
    }

    createOffsetTimeline() {
        const { slides, animationDuration, createOffsetTimeline } = this.props;
        const { offset, index, allSlides } = this.state;
        const offsetIndexDelta = offset >= 0 ? 1 : -1;
        const offsetDirection = offsetIndexDelta === 1 ? 'right' : 'left';
        let nextIndex = index + offsetIndexDelta;
        const slidesCount = slides.length;
        if (nextIndex === -1) {
            nextIndex = slidesCount - 1;
        } else if (nextIndex === slidesCount) {
            nextIndex = 0;
        }

        const loopIndex = Slides.getLoopIndex(index, nextIndex, allSlides, offsetDirection);
        const batchState = this.getBatchState(slides, index, nextIndex, offsetDirection, loopIndex);

        const offsetTimeline = new TimelineMax({
            paused: true,
        });

        const $slides = $(this.refContainer).find(' > .transitionable-views');
        const transitionsCount = batchState.slidesTranslations.length;
        for (let i = 0; i < transitionsCount; i += 1) {
            const translation = batchState.slidesTranslations[i];
            const $slide = $slides.find(`[data-key="${translation.key}"]`).parent();
            if ($slide.length) {
                /* offsetTimeline.fromTo($slide[0], this.props.animationDuration, {
                    x: translation.from.x,
                    alpha: translation.from.alpha
                }, {
                    ease: Linear.easeNone,
                    x: translation.to.x,
                    alpha: translation.to.alpha
                }, 0); */

                offsetTimeline.to(
                    $slide[0],
                    animationDuration,
                    {
                        ease: Linear.easeNone,
                        x: translation.to.x,
                        alpha: translation.to.alpha,
                    },
                    0,
                );
            }
        }

        if (createOffsetTimeline) {
            const offsetProps = {
                offset,
                currentIndex: index,
                nextIndex,
                direction: offsetDirection,
                indexDelta: offsetIndexDelta,
            };
            createOffsetTimeline(offsetTimeline, offsetProps, batchState);
        }

        return offsetTimeline;
    }

    updateSlidesPositions() {
        const { onUpdateSlidesPositions, transitionType } = this.props;
        const { slidesTranslations } = this.state;
        const $slides = $(this.refContainer).find('> .transitionable-views');
        let translation;
        let $slide;
        for (let i = 0, sl = slidesTranslations.length; i < sl; i += 1) {
            translation = slidesTranslations[i];
            $slide = $slides.find(`[data-key="${translation.key}"]`).parent();
            if ($slide.length) {
                TweenMax.killTweensOf($slide[0]);
                const tweenProps = {
                    x: translation.to.x,
                };
                if (transitionType === 'fade') {
                    tweenProps.alpha = 1;
                } else {
                    tweenProps.alpha = translation.to.alpha;
                }
                TweenMax.set($slide[0], tweenProps);
            }
        }

        if (onUpdateSlidesPositions !== null) {
            onUpdateSlidesPositions(slidesTranslations);
        }
    }

    updateSlidesOffset(offset) {
        const { onOffsetChange } = this.props;
        TweenMax.to(this.offsetTimeline, 0.15, {
            progress: Math.abs(offset),
            ease: Power1.easeOut,
        });

        if (onOffsetChange !== null) {
            onOffsetChange(offset);
        }
    }

    stopOffset() {
        const { animationDuration } = this.props;
        const { offsetDirection: direction } = this.state;
        this.waitForTransitionComplete = false;

        if (this.offsetTimeline) {
            const progress = this.offsetTimeline.progress();

            if (progress) {
                const { swipe } = this.state;
                let newProgress;
                if (swipe) {
                    newProgress = direction === swipe ? 1 : 0;
                } else {
                    newProgress = progress > 0.5 ? 1 : 0;
                }

                TweenMax.to(this.offsetTimeline, animationDuration, {
                    progress: newProgress,
                    ease: Power1.easeOut,
                    onCompleteParams: ['{self}'],
                    onComplete: (tween) => {
                        const { offsetIndex } = this.state;
                        if (tween.target.progress()) {
                            const state = this.getStateForIndex(offsetIndex, direction);
                            this.setState(state, this.resetPanning);
                        } else {
                            this.resetPanning();
                        }
                    },
                });
            } else {
                this.resetPanning();
            }
        }
    }

    resetPanning() {
        this.setState({
            swipe: null,
            panning: false,
            offset: 0,
            clientX: null,
        });
    }

    /**
     *
      Transitionable batch callback
     */
    slideTransitionIn(transitionable, opts, done) {
        const { onSlideTransitionIn } = this.props;
        debug('Transition in', transitionable.key);

        const newOpts = this.slideTransition(
            transitionable,
            {
                transitionMethod: 'fromTo',
                ...opts,
            },
            done,
        );

        if (onSlideTransitionIn !== null) {
            onSlideTransitionIn(transitionable, newOpts);
        }
    }

    slideTransitionOut(transitionable, opts, done) {
        const { onSlideTransitionOut } = this.props;
        debug('Transition out', transitionable.key);

        const newOpts = this.slideTransition(transitionable, opts, done);

        if (onSlideTransitionOut !== null) {
            onSlideTransitionOut(transitionable, newOpts);
        }
    }

    slideTransitionOther(transitionable, opts, done) {
        const { onSlideTransitionOther } = this.props;
        debug('Transition other', transitionable.key);

        const newOpts = this.slideTransition(transitionable, opts, done);

        if (onSlideTransitionOther !== null) {
            onSlideTransitionOther(transitionable, newOpts);
        }
    }

    slideTransition(transitionable, opts, done) {
        const { animationDuration } = this.props;
        const {
            lastBatch,
            currentBatch,
            direction,
            allSlides,
            panning,
            slidesTranslations,
        } = this.state;
        const finalAnimationDuration = opts.mounting || panning ? 0 : animationDuration;

        const transitionMethod = opts.transitionMethod || 'to';

        const translation = slidesTranslations.find(it => it.key === transitionable.key) || null;
        const { transitionType } = this.props;

        let timeline = null;

        if (!translation) {
            debug('Translation not found', transitionable.key, slidesTranslations);
        }

        if (translation && transitionable.el) {
            timeline = new TimelineMax({
                onReverseComplete: done,
                onComplete: done,
            });

            if (transitionType === 'slide') {
                if (transitionMethod === 'fromTo') {
                    timeline.fromTo(
                        transitionable.el,
                        finalAnimationDuration,
                        translation.from,
                        translation.to,
                        0,
                    );
                } else {
                    timeline[transitionMethod](
                        transitionable.el,
                        finalAnimationDuration,
                        translation[transitionMethod],
                        0,
                    );
                }
            } else if (transitionType === 'fade') {
                timeline.set(
                    transitionable.el,
                    {
                        x: translation.lastCurrent ? translation.from.x : translation.to.x,
                    },
                    0,
                );

                if (translation.current) {
                    timeline.fromTo(
                        transitionable.el,
                        finalAnimationDuration,
                        {
                            alpha: 0,
                        },
                        {
                            alpha: 1,
                            ease: Power1.easeInOut,
                        },
                        0,
                    );
                }
            }
        } else {
            done();
        }

        return {
            animationDuration: finalAnimationDuration,
            lastBatch,
            currentBatch,
            allSlides,
            translation,
            direction,
            timeline,
            ...opts,
        };
    }

    renderSlide(slide, slidePosition, index) {
        const { SlideComponent, slideProps: getSlideProps, slides } = this.props;
        const slideContainerWidth = slidePosition.width;
        const slideContainerHeight = slidePosition.height;

        const containerStyle = {
            width: slideContainerWidth,
            height: slideContainerHeight,
        };

        const slideWidth = slidePosition.width - slidePosition.margin * 2;
        const slideHeight = slidePosition.height;
        const slideTransform = `translateX(${slidePosition.margin}px)`;
        const containerInnerStyle = {
            width: slideWidth,
            height: slideHeight,
            transform: slideTransform,
        };

        const { key, current } = slidePosition;

        const onSlideClick = e => this.onSlideClick(e, slide, slidePosition);

        if (slides.length === 1 && !slidePosition.current) {
            containerStyle.display = 'none';
        }

        const slideProps = isFunction(getSlideProps)
            ? getSlideProps(slide, slidePosition, index)
            : getSlideProps;

        return (
            <div
                className={classNames([
                    'slide-container',
                    {
                        current,
                    },
                ])}
                data-key={key}
                key={key}
                style={containerStyle}
            >
                <div className="slide-container-inner" style={containerInnerStyle}>
                    <SlideComponent
                        data={slide}
                        width={slideWidth}
                        height={slideHeight}
                        current={current}
                        onClick={onSlideClick}
                        {...slideProps}
                    />
                </div>
            </div>
        );
    }

    renderSlides(slidesPositions) {
        const { slides } = this.props;
        // prettier-ignore
        return slidesPositions.map(slidePosition => (
            this.renderSlide(
                slides[slidePosition.index],
                slidePosition,
                slidePosition.index,
            )
        ));
    }

    render() {
        const { userControl, usePointerEvents, refContainer } = this.props;
        const { currentBatch } = this.state;
        const slides = this.renderSlides(currentBatch.slides);

        const panEvents = userControl && !usePointerEvents
            ? {
                onTouchStart: this.onTouchStart,
                onTouchMove: this.onTouchMove,
                onTouchEnd: this.onTouchEnd,
                onTouchCancel: this.onTouchEnd,
                onMouseDown: this.onMouseDown,
                onMouseMove: this.onMouseMove,
                onMouseLeave: this.onMouseOut,
                onMouseUp: this.onMouseUp,
            }
            : null;

        return (
            <div
                className="slides"
                ref={(ref) => {
                    this.refContainer = ref;
                    if (refContainer !== null) {
                        refContainer(ref);
                    }
                }}
                {...panEvents}
            >
                <Transitionable
                    transitionIn={this.slideTransitionIn}
                    transitionOut={this.slideTransitionOut}
                    transitionOther={this.slideTransitionOther}
                    onTransitionsStart={this.onSlidesTransitionsStart}
                    onTransitionsComplete={this.onSlidesTransitionComplete}
                >
                    {slides}
                </Transitionable>
            </div>
        );
    }
}

Slides.propTypes = propTypes;
Slides.defaultProps = defaultProps;

export default Slides;
