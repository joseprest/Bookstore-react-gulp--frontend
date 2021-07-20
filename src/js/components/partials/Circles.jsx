import detectPointerEvents from 'detect-pointer-events';
import React from 'react';
import PropTypes from 'prop-types';
import ReactDOM from 'react-dom';
import _ from 'lodash';
import $ from 'jquery';
import {
    autoDetectRenderer, Container, Graphics, Text as PIXIText,
} from 'pixi.js';
import { TweenMax, TimelineMax } from 'gsap/TweenMax';

import Button from './Button';
import Boids from '../../lib/boids';
import Utils from '../../lib/utils';
import Text from '../../lib/text';
import Colors from '../../lib/colors';

const Circles = React.createClass({
    propTypes: {
        width: PropTypes.number.isRequired,
        height: PropTypes.number.isRequired,
        items: PropTypes.array,
        selected: PropTypes.bool,
        topSpaceHeight: PropTypes.number,

        active: PropTypes.bool,
        ready: PropTypes.bool,
        typeName: PropTypes.string,

        minShapeRatio: PropTypes.number,
        maxShapeRatio: PropTypes.number,
        fontSizeFactor: PropTypes.number,
        colorPalette: PropTypes.string,
        selectedShapeMargin: PropTypes.number,
        manivelleOffsetFactor: PropTypes.number,
        appearAnimationDuration: PropTypes.number,
        updateCurrentCircleAnimationDuration: PropTypes.number,
        selectionAnimationDuration: PropTypes.number,
        pageLoop: PropTypes.bool,
    },

    contextTypes: {
        browser: PropTypes.object,
        channel: PropTypes.object,
        theme: PropTypes.object,
        hasManivelle: PropTypes.bool,
    },

    getDefaultProps() {
        return {
            items: [
                /*
                {
                    value: 'family',
                    label: 'Famille et maternité',
                    bubbles: [...{}],
                    hasBubbles: true
                }
                */
            ],
            selected: false,

            active: true,
            ready: true,
            typeName: Text.t('categories'),
            topSpaceHeight: 0,

            maxRenderedCircles: 30,
            pageLength: 7,
            shuffleInitialItems: true,

            maxBubblesForfixedCirclesSize: 100,
            minShapeRatio: 0.16,
            maxShapeRatio: 0.3,
            shapeMarginRatio: 0.012,
            fontSizeFactor: 14,
            colorPalette: null,
            selectedShapeMargin: 30,
            manivelleOffsetFactor: 15,

            appearAnimationDuration: 0.75,
            shapeFadeAnimationDuration: 0.25,
            updateCurrentCircleAnimationDuration: 0.4,
            selectionAnimationDuration: 0.5,

            pageLoop: true,
        };
    },

    renderer: null,
    stage: null,
    pixiShapes: null,
    flock: null,
    timeline: null,
    fadeOutTween: null,

    getInitialState() {
        const items = this.getItems(this.props.items);
        const index = 0;
        return {
            items, // in a state just to preserve shuffled positions
            index, // index of items, not shapes
            shapes: this.getShapes(items, index), // selection of rendered items
            selected: this.props.selected,
            manivellePageDirection: null, // string 'left' || 'right'
            manivelleIndex: 0,
            fontFamily: $('.manivelle')
                .css('font-family')
                .split(',')[0],
        };
    },

    render() {
        /* console.log('------------------------------');
        console.table(this.state.items);
        console.table(this.state.shapes);
        console.log(this.state.index, this.state.selected); */
        const content = this.renderContent();
        const bottomBar = this.renderBottomBar();

        return (
            <div className="circles">
                {content}
                {bottomBar}
            </div>
        );
    },

    renderContent() {
        const style = {
            height: this.props.height + this.props.topSpaceHeight,
        };

        const userEvents = {
            onTouchStart: this.onTouchStart,
            onMouseDown: this.onMouseDown,
        };

        // if (!detectPointerEvents.hasApi && Modernizr.touchevents) {
        //     userEvents.onTouchStart = this.onTouchStart;
        // } else if (!detectPointerEvents.hasApi) {
        //     userEvents.onMouseDown = this.onMouseDown;
        // }

        return (
            <div ref="content" className="circles-content" style={style} {...userEvents}>
                <div ref="pixiContainer" className="pixi-container" />
                <div className="circles-gradient gradient-top" />
            </div>
        );
    },

    renderBottomBar() {
        let content;
        let className = 'bottom-bar';
        if (this.context.hasManivelle) {
            className += ' has-manivelle';
            content = (
                <div className="bottom-bar-infos">
                    <div className="icon top" />
                    <div className="label">
                        {Text.t('banner_see_other_types', {
                            types: this.props.typeName.toLowerCase(),
                        })}
                    </div>
                    <div className="icon bottom" />
                </div>
            );
        } else {
            content = (
                <Button icon="refresh" onClick={this.onButtonClick}>
                    {Text.t('btn_see_other_types', { types: this.props.typeName.toLowerCase() })}
                </Button>
            );
        }

        return (
            <div ref="bottomBar" className={className}>
                {content}
            </div>
        );
    },

    /*
        Life cycles
    */

    componentWillReceiveProps(nextProps) {
        const state = {};

        const itemsChanged = this.props.items !== nextProps.items;
        if (itemsChanged) {
            state.items = this.getItems(nextProps.items);
            const shapeIndex = this.getShapeIndex(this.state.index);
            const prevCurrentShapeId = this.state.shapes[shapeIndex].id;
            state.index = 0;
            state.shapes = this.getShapes(state.items, state.index);
            state.manivellePageDirection = null;

            // if the new items set contains the last current item, move it at the first position of the array
            const matchingCurrentItemIndex = _.findIndex(
                state.items,
                it => it.value === prevCurrentShapeId,
            );
            const matchingCurrentShapeIndex = _.findIndex(
                state.shapes,
                it => _.get(it, 'item.value') === prevCurrentShapeId,
            );

            if (matchingCurrentItemIndex >= 0 && matchingCurrentShapeIndex >= 0) {
                state.items.splice(0, 0, state.items.splice(matchingCurrentItemIndex, 1)[0]);
                state.shapes.splice(0, 0, state.shapes.splice(matchingCurrentShapeIndex, 1)[0]);
            }
            state.selected = false;
        }

        if (_.values(state).length) {
            this.setState(state);
        }
    },

    componentDidMount() {
        this.pixiShapes = {};
        _.bindAll(this, 'onTick');
        if (this.props.active && this.props.ready) {
            this.playAnimation();
        }
        $(document).on('manivelle:rotation', this.onManivelleRotation);
        if (detectPointerEvents.hasApi) {
            ReactDOM.findDOMNode(this.refs.content).addEventListener(
                'pointerdown',
                this.onPointerDown,
            );
        }
    },

    componentDidUpdate(prevProps, prevState) {
        const sizeChanged = prevProps.width !== this.props.width || prevProps.height !== this.props.height;

        if (sizeChanged && this.renderer) {
            this.onResize(this.props.width, this.props.height);
        }

        if (this.props.active && this.props.ready) {
            if (this.renderer) {
                const itemsChanged = prevState.items !== this.state.items;
                const shapesChanged = prevState.shapes !== this.state.shapes;
                const indexChanged = prevState.index !== this.state.index;
                const circleSelected = !prevState.selected && this.state.selected;
                const circleUnselected = prevProps.selected && !this.props.selected;

                if (!prevProps.active) {
                    this.resumeAnimation();
                }

                if (shapesChanged) {
                    const boids = this.getBoids();
                    this.flock.updateBoids(boids);
                    this.onIndexChange();
                    this.updatePixiShapes();
                    this.updateCurrentCircle(null, this.state.index);
                } else if (indexChanged) {
                    this.onIndexChange();
                    if (!circleSelected) {
                        this.updateCurrentCircle(prevState.index, this.state.index);
                    }
                }

                if (circleSelected) {
                    this.selectCircle();
                } else if (circleUnselected || itemsChanged) {
                    this.unselectCircle();
                }
            } else {
                this.playAnimation();
            }
        } else if (this.renderer) {
            this.pauseAnimation();
        }
    },

    componentWillUnmount() {
        this.stopAnimation();
        $(document).off('manivelle:rotation', this.onManivelleRotation);
        ReactDOM.findDOMNode(this.refs.content).removeEventListener(
            'pointerdown',
            this.onPointerDown,
        );
    },

    onManivelleRotation(e) {
        const manivelleReady = this.renderer && this.props.ready && this.props.active && !this.state.selected;
        const { manivelle } = e;
        const manivellePercent = manivelle.percent;
        const manivelleDeltaPercent = manivelle.deltaPercent;

        if (!manivelleReady || manivelleDeltaPercent === 0) {
            return;
        }

        let manivelleIndex = manivelleDeltaPercent * this.props.manivelleOffsetFactor;
        manivelleIndex += this.state.manivelleIndex;

        let deltaIndex = 0;

        if (manivelleIndex > 1 || manivelleIndex < -1) {
            deltaIndex = manivelleIndex > 1 ? Math.floor(manivelleIndex) : Math.ceil(manivelleIndex);
            manivelleIndex -= deltaIndex;
        }

        const state = {
            manivelleIndex,
        };

        if (deltaIndex !== 0) {
            const currentIndex = this.state.index;
            let nextIndex = Utils.getLoopNumber(
                currentIndex + deltaIndex,
                0,
                this.props.items.length - 1,
            );
            const { pageLength } = this.props;
            const lastPageIndex = Math.floor(currentIndex / pageLength);

            const { manivellePageDirection } = this.state;
            if (manivellePageDirection === null) {
                state.manivellePageDirection = deltaIndex > 0 ? 'right' : 'left';
                if (state.manivellePageDirection === 'left') {
                    nextIndex = Math.min(
                        currentIndex + pageLength - 1,
                        this.props.items.length - 1,
                    );
                }
            } else if (lastPageIndex !== Math.floor(nextIndex / pageLength) && deltaIndex < 0) {
                nextIndex = currentIndex + pageLength;
                if (nextIndex >= this.props.items.length) {
                    nextIndex = 0;
                }
            }

            const currentPageIndex = Math.floor(nextIndex / pageLength);
            const pageChanged = lastPageIndex !== currentPageIndex;

            if (pageChanged) {
                // console.log('SHOULD CHANGE SHAPES')
                state.manivellePageDirection = null;
                state.shapes = this.getShapes(this.state.items, nextIndex);
            }
            state.index = nextIndex;
        }

        this.setState(state);
    },

    /*
        Animation controls
    */

    playAnimation() {
        if (!this.props.items.length) {
            return;
        }

        this.createPixiStage();
        this.updatePixiShapes();
        this.createFlock();
        this.resumeAnimation();
    },

    pauseAnimation() {
        TweenMax.ticker.removeEventListener('tick', this.onTick);
    },

    resumeAnimation() {
        TweenMax.ticker.addEventListener('tick', this.onTick);
    },

    stopAnimation() {
        this.pauseAnimation();

        while (this.stage && this.stage.children.length) {
            this.stage.removeChildAt(0);
        }

        const pixiContainer = ReactDOM.findDOMNode(this.refs.pixiContainer);
        if (this.renderer) {
            if (this.renderer.view) {
                pixiContainer.removeChild(this.renderer.view);
            }
            this.renderer.destroy(true);
        }
        this.pixiShapes = null;
        this.stage = null;
        this.renderer = null;
        this.flock = null;

        if (this.timeline) {
            this.timeline.kill();
            this.timeline = null;
        }
    },

    /*
        PIXI
    */

    createPixiStage() {
        const pixiContainer = ReactDOM.findDOMNode(this.refs.pixiContainer);
        this.renderer = autoDetectRenderer({
            width: pixiContainer.offsetWidth,
            height: pixiContainer.offsetHeight,
            transparent: true,
            antialias: true,
        });
        pixiContainer.appendChild(this.renderer.view);
        this.stage = new Container();

        this.createPixiSafeFrame('safeFrame');
        this.createPixiSafeFrame('fadeIn');
        this.createPixiSafeFrame('fadeOut');
    },

    createPixiSafeFrame(name) {
        const pixiSafeFrame = new Graphics();
        pixiSafeFrame.name = name;
        const bgColor = Utils.colorStringToInt(
            _.get(this.context.theme, 'channel_list_background_color', _.get(this.context.channel, 'fields.theme.color_dark', 'transparent')),
        );
        pixiSafeFrame.beginFill(bgColor);
        pixiSafeFrame.drawRect(0, 0, this.renderer.width, this.renderer.height);
        pixiSafeFrame.endFill();
        this.stage.addChild(pixiSafeFrame);
        pixiSafeFrame.visible = false;
        pixiSafeFrame.opacity = 0;
    },

    updatePixiShapes() {
        let shape;
        var shapeId;
        let pixiShape;
        const { shapes } = this.state;
        const shapesToRemove = [];
        const shapesToKeep = [];
        const currentIndex = this.state.index;
        const currentPage = Math.floor(currentIndex / this.props.pageLength);

        // console.table(shapes);

        // get last currentPage shapes, remove them, re-add them outside stage if they are on another page

        // get shapes to remove
        for (var shapeId in this.pixiShapes) {
            const matchingShape = _.find(shapes, it => it.id === shapeId);
            if (typeof matchingShape === 'undefined' || matchingShape.looped) {
                shapesToRemove.push(this.pixiShapes[shapeId]);
                this.pixiShapes[shapeId] = null;
                delete this.pixiShapes[shapeId];
            }
        }

        // add new shapes
        for (var i = 0, il = shapes.length; i < il; i++) {
            shape = shapes[i];
            shapeId = _.get(shape, 'id');
            pixiShape = this.pixiShapes[shapeId];

            if (typeof pixiShape === 'undefined') {
                // console.log('to add', shapeId);
                pixiShape = this.createPixiShape(shape);
                this.pixiShapes[shapeId] = pixiShape;
                this.stage.addChild(pixiShape);
            } else {
                shapesToKeep.push(pixiShape);
            }
        }

        // reset z-index order

        const shapeIndex = this.getShapeIndex(currentIndex);
        // console.log(shapeIndex)
        const currentShapeId = _.get(shapes, `${shapeIndex}.id`);
        this.stage.addChild(this.pixiShapes[currentShapeId]);

        const fadeInSafeFrame = this.stage.getChildByName('fadeIn');
        this.stage.addChild(fadeInSafeFrame);

        for (i = 0, il = shapesToRemove.length; i < il; i++) {
            this.stage.addChild(shapesToRemove[i]);
        }

        const fadeOutSafeFrame = this.stage.getChildByName('fadeOut');
        this.stage.addChild(fadeOutSafeFrame);

        for (i = 0, il = shapesToKeep.length; i < il; i++) {
            this.stage.addChild(shapesToKeep[i]);
        }

        // fadeIn new shapes
        const addingShapes = shapesToKeep.length !== shapes.length;
        if (addingShapes) {
            fadeInSafeFrame.visible = true;
            TweenMax.fromTo(
                fadeInSafeFrame,
                this.props.appearAnimationDuration,
                {
                    alpha: 1,
                },
                {
                    ease: Power1.easeIn,
                    alpha: 0,
                    onComplete() {
                        fadeInSafeFrame.visible = false;
                    },
                },
            );
        }

        // fadeout old shapes
        if (shapesToRemove.length) {
            if (this.fadeOutTween) {
                this.fadeOutTween.progress(1);
            }
            fadeOutSafeFrame.visible = true;
            this.fadeOutTween = TweenMax.fromTo(
                fadeOutSafeFrame,
                this.props.shapeFadeAnimationDuration,
                {
                    alpha: 0,
                },
                {
                    ease: Power1.easeInOut,
                    alpha: 1,
                    onComplete: _.bind(function () {
                        this.fadeOutTween = null;
                        fadeOutSafeFrame.visible = false;
                        this.removePixiShapes(shapesToRemove);
                    }, this),
                },
            );
        }
    },

    removePixiShapes(pixiShapes) {
        let pixiShape;
        for (let i = 0, il = pixiShapes.length; i < il; i++) {
            pixiShape = pixiShapes[i];
            this.stage.removeChild(pixiShape);
            pixiShape.destroy(true);
            pixiShape = null;
        }
    },

    createPixiShape(shape) {
        const { it } = shape;
        const { size } = shape;
        const radius = Math.round(size / 2);

        const pixiShape = new Container();
        pixiShape.name = it.value;
        pixiShape.buttonMode = true;
        pixiShape.interactive = true;

        let { color } = it;
        if (typeof color === 'undefined') {
            color = Colors.get('circles', it.value, this.props.colorPalette);
        }
        const colorInt = Utils.colorStringToInt(color);
        const textColor = Utils.colorIsDark(color) ? '#FFF' : '#000';

        const pixiCircle = this.createPixiCircle(colorInt, radius);
        const labelOpts = {
            fontSize: size / this.props.fontSizeFactor,
            textColor,
        };
        const pixiLabel = this.createPixiLabel(it.label, radius * 2, labelOpts);
        pixiShape.label = pixiLabel;
        const shapeContent = new Container();
        shapeContent.addChild(pixiCircle);
        shapeContent.addChild(pixiLabel);
        shapeContent.cacheAsBitmap = true;
        pixiShape.addChild(shapeContent);

        return pixiShape;
    },

    createPixiCircle(color, radius) {
        const pixiCircle = new Graphics();
        pixiCircle.beginFill(color);
        pixiCircle.drawCircle(radius, radius, radius);
        pixiCircle.endFill();
        return pixiCircle;

        // // antialiasing fix
        // const texture = pixiCircle.generateTexture(this.renderer);
        // const sprite = new Sprite(texture);
        // return sprite;
    },

    createPixiLabel(label, size, opts = {}) {
        const options = {
            fontSize: 20,
            textColor: 0,
            paddingX: 20,
            ...opts,
        };

        const pixiLabel = new PIXIText(label, {
            font: `${options.fontSize}px ${this.state.fontFamily}`,
            fill: options.textColor,
            align: 'center',
            wordWrap: true,
            wordWrapWidth: size - options.paddingX * 2,
        });
        pixiLabel.x = size / 2 - pixiLabel.width / 2;
        pixiLabel.y = size / 2 - pixiLabel.height / 2;
        return pixiLabel;
    },

    /*
        Methods
    */

    createFlock() {
        const stageWidth = this.renderer.width;
        const stageHeight = this.renderer.height;
        const centerX = Math.round(stageWidth / 2);
        const centerY = Math.round((stageHeight - this.props.topSpaceHeight) / 2);
        // create flock
        this.flock = new Boids({
            width: stageWidth,
            height: stageHeight,
            boids: this.getBoids(),
            stageMarginY: null,
            stageMarginX: null,
            radiusMargin: Math.max(stageWidth, stageHeight) * this.props.shapeMarginRatio,
            attractors: [
                {
                    x: centerX,
                    y: centerY,
                },
            ],
        });
    },

    updateCurrentCircle(prevIndex, currentIndex) {
        if (this.timeline) {
            this.timeline.kill();
        }
        this.timeline = new TimelineMax();

        // update current zIndex
        const shapeIndex = this.getShapeIndex(currentIndex);
        const currentShapeId = _.get(this.state.shapes, `${shapeIndex}.id`);
        const currentPixiShape = this.pixiShapes[currentShapeId];
        this.stage.addChild(currentPixiShape);

        const currentBoid = _.find(this.flock.boids, it => it.id === currentShapeId);

        // console.log('update current', prevIndex, currentIndex)
        const duration = this.props.updateCurrentCircleAnimationDuration;
        if (prevIndex !== null) {
            const prevShapeIndex = this.getShapeIndex(prevIndex);
            const prevShapeId = _.get(this.state.shapes, `${prevShapeIndex}.id`);
            const prevBoid = _.find(this.flock.boids, it => it.id === prevShapeId);
            this.timeline.to(
                prevBoid,
                duration,
                {
                    ease: Power1.easeInOut,
                    x: currentBoid.x,
                    y: currentBoid.y,
                },
                0,
            );
        } else {
            // duration *= 1.25;
        }

        this.timeline.to(
            currentBoid,
            duration,
            {
                ease: prevIndex !== null ? Back.easeOut : Power1.easeInOut,
                x: this.renderer.width / 2,
                y: (this.renderer.height - this.props.topSpaceHeight) / 2,
            },
            0,
        );
    },

    selectCircle() {
        const currentIndex = this.state.index;
        const shapeIndex = this.getShapeIndex(currentIndex);
        const content = ReactDOM.findDOMNode(this.refs.content);
        const bottomBar = ReactDOM.findDOMNode(this.refs.bottomBar);
        const currentBoid = _.get(this.flock, `boids.${shapeIndex}`);
        const currentShapeId = _.get(this.state.shapes, `${shapeIndex}.id`);
        const currentPixiShape = this.pixiShapes[currentShapeId];
        const safeFrame = this.stage.getChildByName('safeFrame');

        if (this.timeline) {
            this.timeline.kill();
        }

        this.stage.addChild(safeFrame);
        this.stage.addChild(currentPixiShape);

        this.timeline = new TimelineMax({
            onComplete: this.onCircleSelected,
            onCompleteScope: this,
        });

        this.timeline.to(
            content,
            this.props.selectionAnimationDuration,
            {
                ease: Power1.easeInOut,
                y: -this.props.topSpaceHeight,
            },
            0,
        );

        safeFrame.visible = true;
        this.timeline.fromTo(
            safeFrame,
            this.props.selectionAnimationDuration,
            {
                alpha: 0,
            },
            {
                alpha: 0.8,
            },
            0,
        );

        this.timeline.to(
            bottomBar,
            this.props.selectionAnimationDuration,
            {
                alpha: 0,
            },
            0,
        );

        this.timeline.to(
            currentBoid,
            this.props.selectionAnimationDuration,
            {
                ease: Power1.easeInOut,
                x: this.props.width / 2,
                y: currentBoid.radius + this.props.topSpaceHeight + this.props.selectedShapeMargin,
            },
            0,
        );
    },

    unselectCircle() {
        const content = ReactDOM.findDOMNode(this.refs.content);
        const bottomBar = ReactDOM.findDOMNode(this.refs.bottomBar);
        const shapeIndex = this.getShapeIndex(this.state.index);
        const currentBoid = _.get(this.flock, `boids.${shapeIndex}`);

        if (this.timeline) {
            this.timeline.kill();
        }

        this.timeline = new TimelineMax({
            onComplete: this.onCircleUnselected,
        });

        this.timeline.to(
            currentBoid,
            this.props.selectionAnimationDuration,
            {
                x: this.props.width / 2,
                y: this.props.height / 2,
            },
            0,
        );

        const safeFrame = this.stage.getChildByName('safeFrame');

        this.timeline.to(
            safeFrame,
            this.props.selectionAnimationDuration,
            {
                alpha: 0,
                onComplete: _.bind(function () {
                    if (this.stage) {
                        safeFrame.visible = false;
                    }
                }, this),
            },
            0,
        );

        this.timeline.to(
            bottomBar,
            this.props.selectionAnimationDuration,
            {
                alpha: 1,
            },
            0,
        );

        this.timeline.to(
            content,
            this.props.selectionAnimationDuration,
            {
                y: 0,
            },
            0,
        );
    },

    /*
        Data getters
    */

    getItems(items) {
        const shuffledItems = this.props.shuffleInitialItems ? _.shuffle(items) : items.concat();
        return shuffledItems;
    },

    getShapes(items, index) {
        items = typeof items !== 'undefined' ? items : [];
        index = typeof index !== 'undefined' ? index : 0;

        const circlesBubblesMinMaxRatio = this.getCirclesBubblesMinMaxRatio();
        const averageSize = (this.props.width + this.props.height) / 2;
        const minShapeSize = averageSize * this.props.minShapeRatio;
        const maxShapeSize = averageSize * this.props.maxShapeRatio;
        const { pageLength } = this.props;

        const { maxBubblesForfixedCirclesSize } = this.props;

        // loop, render max 50, loop, sans répéter
        const shapes = [];

        // console.log('GET SHAPES', index)
        let shapeIndex = index - (index % pageLength);
        const initialIndex = shapeIndex;
        let looped = false;

        const lastShapes = _.get(this.state, 'shapes', []);

        for (let i = 0, il = this.props.maxRenderedCircles; i < il; i++) {
            if (shapeIndex >= items.length) {
                shapeIndex = 0;
                looped = true;
                if (!this.props.pageLoop) {
                    break;
                }
            }
            if (looped) {
                if (this.props.pageLoop && shapeIndex >= initialIndex) {
                    break;
                }
            }
            const it = items[shapeIndex];
            var id = it.value;
            var sizeRatio;
            const bubblesLength = _.get(it, 'bubbles.length', 1);
            const pageIndex = Math.floor(i / pageLength);

            if (maxBubblesForfixedCirclesSize > 0) {
                sizeRatio = (1 / maxBubblesForfixedCirclesSize)
                    * Math.min(bubblesLength, maxBubblesForfixedCirclesSize);
            } else {
                sizeRatio = circlesBubblesMinMaxRatio * bubblesLength;
            }
            const size = sizeRatio * (maxShapeSize - minShapeSize) + minShapeSize;
            const matchingLastShape = _.find(lastShapes, it => it.id === id);
            const shapeLooped = _.get(matchingLastShape, 'pageIndex', false) === 0 && pageIndex > 0;
            shapes.push({
                id,
                it,
                size,
                looped: shapeLooped,
                pageIndex,
            });
            shapeIndex++;
        }

        return shapes;
    },

    getBoids() {
        const { shapes } = this.state;
        const currentIndex = this.state.index;
        const currentShapeIndex = this.getShapeIndex(currentIndex);
        const stageWidth = this.renderer.width;
        const stageHeight = this.renderer.height;
        const centerX = Math.round(stageWidth / 2);
        const centerY = Math.round((stageHeight - this.props.topSpaceHeight) / 2);

        const { pageLength } = this.props;

        // var currentPageIndex = Math.floor(currentIndex / pageLength);
        // var nextPageIndex = currentPageIndex+1 >= totalPages ? 0:currentPageIndex+1;

        // console.log(currentIndex)

        const prevBoids = _.get(this.flock, 'boids', []);
        const { flock } = this;
        const boids = shapes.map((shape, index) => {
            const { size } = shape;
            const { id } = shape;

            const radius = size / 2;
            let attractionFactor = 1;

            if (shape.pageIndex === 0) {
                attractionFactor = 10;
            } else {
                attractionFactor = 5;
            }

            const boid = {
                current: index === currentShapeIndex,
                id,
                radius: size / 2,
                attractionFactor,
            };

            const matchingPrevBoid = _.find(prevBoids, it => it.id === id);

            if (typeof matchingPrevBoid !== 'undefined' && !shape.looped) {
                boid.initialDistance = 0;
                boid.x = matchingPrevBoid.x;
                boid.y = matchingPrevBoid.y;
                boid.velocity = matchingPrevBoid.velocity;
                boid.oldVelocity = matchingPrevBoid.oldVelocity;
            } else {
                boid.x = centerX;
                boid.y = centerY;
                // update birth angle
                if (shape.pageIndex === 0) {
                    boid.initialDistance = 1;
                } else {
                    boid.initialDistance = (radius + size) * (shape.pageIndex + 1); // Math.max(stageWidth, stageHeight)+radius;
                    // boid.x = _.random() ? -radius:stageWidth+radius;
                    // boid.y = _.random() ? -radius:stageHeight+radius;
                }
            }

            return boid;
        });

        // console.log(boids)

        return boids;
    },

    getShapeIndex(index) {
        const { pageLength } = this.props;
        const pageIndex = Math.floor(index / pageLength);
        // pageIndex -= pageLength % index;
        const shapeIndex = index - pageIndex * pageLength;
        // console.log('SHAPE INDEX', shapeIndex)
        return shapeIndex;
    },

    getCirclesBubblesMinMaxRatio() {
        let minBubbles = 1;
        let maxBubbles = 1;
        const averageBubbles = 0;

        for (let i = 0, il = this.props.items.length; i < il; i++) {
            const it = this.props.items[i];
            const bubblesLength = _.get(it, 'bubbles.length', 0);
            if (bubblesLength > maxBubbles) {
                maxBubbles = bubblesLength;
            }

            if (minBubbles === 0 || bubblesLength < minBubbles) {
                minBubbles = bubblesLength;
            }
            // averageBubbles += bubblesLength;
        }

        // averageBubbles /= this.props.items.length;

        const minMaxRatio = maxBubbles > 0 ? minBubbles / maxBubbles : 0;

        return minMaxRatio;
    },

    getItemUnderPoint(point) {
        const el = ReactDOM.findDOMNode(this);

        const elBounds = el.getBoundingClientRect();
        const x = point.x - elBounds.left;
        const y = point.y - elBounds.top;
        const relativePoint = {
            x,
            y,
        };

        let it = null;

        for (let i = this.flock.boids.length - 1, il = 0; i >= il; i--) {
            var boid = this.flock.boids[i];
            const boidRadius = boid.radius;
            const boidX = boid.x;
            const boidY = boid.y;

            const pointInsideHorizontal = relativePoint.x > boidX - boidRadius && relativePoint.x < boidX + boidRadius;
            const pointInsideVertical = relativePoint.y > boidY - boidRadius && relativePoint.y < boidY + boidRadius;
            if (pointInsideHorizontal && pointInsideVertical) {
                it = _.find(this.state.items, it => it.value === boid.id);
            }
        }

        return it;
    },

    setCircle(it) {
        if (it === null || typeof it === 'undefined') {
            return;
        }
        const currentIndex = this.state.index;
        const currentValue = it.value;
        const nextIndex = _.findIndex(this.state.items, it => it.value === currentValue);

        if (nextIndex === -1) {
            return;
        }

        const { pageLength } = this.props;
        const lastPageIndex = Math.floor(currentIndex / pageLength);
        const currentPageIndex = Math.floor(nextIndex / pageLength);

        const state = {};
        if (lastPageIndex !== currentPageIndex) {
            state.shapes = this.getShapes(this.state.items, nextIndex);
            // console.log('NEW SET');
            // console.table(state.shapes);
        }
        // console.table(this.state.shapes);
        // console.log(it.value, currentIndex, nextIndex, lastPageIndex, currentPageIndex);

        state.index = nextIndex;
        state.selected = true;
        state.manivellePageDirection = null;

        if (_.values(state).length) {
            this.setState(state);
        }
    },

    /*
        Events handlers
    */

    onCircleSelected() {
        if (this.props.onCircleSelected) {
            const { index } = this.state;
            const it = this.state.items[index];
            const shapeIndex = this.getShapeIndex(index);
            const currentShapeId = _.get(this.state.shapes, `${shapeIndex}.id`);
            const currentPixiShape = this.pixiShapes[currentShapeId];
            this.props.onCircleSelected(it, currentPixiShape, index);
        }
    },

    onResize(width, height) {
        this.renderer.resize(width, height + this.props.topSpaceHeight);
        this.flock.width = width;
        this.flock.height = height;

        const itemId = _.get(this.state.items[this.state.index], 'value');
        const currentBoid = _.find(this.flock.boids, it => it.id === itemId);

        currentBoid.x = width / 2;
        currentBoid.y = height / 2;

        if (this.state.selected) {
            currentBoid.y = currentBoid.radius + this.props.topSpaceHeight + this.props.selectedShapeMargin;
        }

        const safeFrame = this.stage.getChildByName('safeFrame');
        const fadeInSafeFrame = this.stage.getChildByName('fadeIn');
        const fadeOutSafeFrame = this.stage.getChildByName('fadeOut');

        safeFrame.width = fadeInSafeFrame.width = fadeOutSafeFrame.width = width;
        safeFrame.height = fadeInSafeFrame.height = fadeOutSafeFrame.height = this.renderer.height;
    },

    onIndexChange() {
        const currentIndex = this.state.index;
        const { boids } = this.flock;

        const prevCurrentBoid = _.find(boids, it => it.current === true);
        const shapeIndex = this.getShapeIndex(currentIndex);
        const shapeId = this.state.shapes[shapeIndex].id;
        const currentBoid = _.find(boids, it => it.id === shapeId);

        prevCurrentBoid.current = false;
        currentBoid.current = true;

        if (this.props.onIndexChanged) {
            this.props.onIndexChanged(currentIndex);
        }
    },

    onCircleUnselected() {
        this.setState({
            selected: false,
        });
    },

    onTick() {
        this.flock.tick();
        const { boids } = this.flock;
        for (let i = 0, il = boids.length; i < il; ++i) {
            const boid = boids[i];
            const pixiShape = this.pixiShapes[boid.id];
            if (pixiShape && pixiShape.parent) {
                const radius = pixiShape.width / 2;
                pixiShape.x = boid.x - radius;
                pixiShape.y = boid.y - radius;
            }
        }
        this.renderer.render(this.stage);
    },

    onTouchStart(e) {
        if (this.state.selected) {
            return;
        }

        e.preventDefault();
        const touches = e.targetTouches;
        const lastTouch = touches[touches.length - 1];

        const it = this.getItemUnderPoint({
            x: lastTouch.clientX,
            y: lastTouch.clientY,
        });

        this.setCircle(it);
    },

    onPointerDown(e) {
        this.onMouseDown(e);
    },

    onMouseDown(e) {
        if (this.state.selected) {
            return;
        }

        const it = this.getItemUnderPoint({
            x: e.clientX,
            y: e.clientY,
        });

        this.setCircle(it);
    },

    onButtonClick(e) {
        // get index of next page
        const { pageLength } = this.props;
        const currentIndex = this.state.index;
        let nextIndex = currentIndex + pageLength - this.getShapeIndex(currentIndex);
        nextIndex = nextIndex < this.state.items.length ? nextIndex : 0;

        const lastPageIndex = Math.floor(currentIndex / pageLength);
        const currentPageIndex = Math.floor(nextIndex / pageLength);
        const { shapes } = this.state;

        // console.log(currentIndex, nextIndex, lastPageIndex, currentPageIndex);

        const state = {};
        if (lastPageIndex !== currentPageIndex) {
            state.shapes = this.getShapes(this.state.items, nextIndex);
        }

        state.index = nextIndex;
        state.manivellePageDirection = null;

        if (_.values(state).length) {
            this.setState(state);
        }

        // console.log('nextIndex', nextIndex, shapePageIndex);
    },
});

export default Circles;
