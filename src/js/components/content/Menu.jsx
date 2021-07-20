import React, { Component } from 'react';
import PropTypes from 'prop-types';
import get from 'lodash/get';
import { connect } from 'react-redux';
// import createDebug from 'debug';

import CacheManager from '../../lib/cache';
import Text from '../../lib/text';
import * as AppPropTypes from '../../lib/PropTypes';
import ChannelsMenu from '../menu/ChannelsMenu';
import Slides from '../slides/Slides';
import SlidesWithSummary from '../slides/SlidesWithSummary';
import SlideMenu from '../slides/slide/SlideMenu';
import NavigationActions from '../../actions/NavigationActions';

const Cache = CacheManager.create('sizes.menu');
// const debugMenu = createDebug('app:components:menu');

const propTypes = {
    active: PropTypes.bool.isRequired,
    bubbles: AppPropTypes.bubbles.isRequired,
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
    index: PropTypes.number,
    slideWidth: PropTypes.number,
    slideHeight: PropTypes.number,
    scale: PropTypes.number,
    maxSlideWidthRatio: PropTypes.number,
    slidesMarginRatio: PropTypes.number,
    withSummary: PropTypes.bool,
    withoutChannelsMenu: PropTypes.bool,

    updateBrowser: PropTypes.func.isRequired,
    closeBrowser: PropTypes.func.isRequired,
};

const defaultProps = {
    index: 0,
    slideWidth: 0,
    slideHeight: 0,
    scale: 1,
    maxSlideWidthRatio: 0.6,
    slidesMarginRatio: 0.03,
    withSummary: false,
    withoutChannelsMenu: true,
};

const contextTypes = {
    browser: AppPropTypes.browserContext,
    data: AppPropTypes.dataRepository,
};

class Menu extends Component {
    constructor(props) {
        super(props);

        this.onChannelClick = this.onChannelClick.bind(this);
        this.onSlideClick = this.onSlideClick.bind(this);
        this.onSlideIndexChange = this.onSlideIndexChange.bind(this);
        this.getSlideSize = this.getSlideSize.bind(this);

        this.refSlideshowTitle = null;
        this.refChannelsMenu = null;

        this.state = {
            // slidesHeight: Cache.get('slidesHeight', 0),
            // slidesTop: Cache.get('slidesTop', 0)
            slidesHeight: 0,
            slidesTop: 0,
        };
    }

    componentDidMount() {
        const { slidesHeight } = this.state;
        const { browser } = this.context;
        if (slidesHeight === 0) {
            this.updateSlidesHeight();
        }

        browser.tracker.screenPageview('/menu');
    }

    shouldComponentUpdate({ width: nextWidth, height: nextHeight, active }) {
        const { width, height } = this.props;
        const sizeChanged = width !== nextWidth || height !== nextHeight;
        return active || sizeChanged;
    }

    componentDidUpdate({ width: prevWidth, height: prevHeight }) {
        const { width, height } = this.props;
        const sizeChanged = prevWidth !== width || prevHeight !== height;

        if (sizeChanged || !Cache.has('slidesHeight') || !Cache.has('slidesTop')) {
            this.updateSlidesHeight();
        }
    }

    // eslint-disable-next-line
    onChannelClick(e, channel) {
        // this.context.browser.tracker.channelEvent(channel, 'Menu channel click');
    }

    onSlideClick(e, bubble, position) {
        if (!position.current) {
            return;
        }

        const { updateBrowser } = this.props;
        const { browser, data } = this.context;
        const { id: browserId } = browser;
        const { id: bubbleId, channel_id: channelId } = bubble;

        const bubbleChannel = data.findChannelByID(channelId);
        let browserView = get(
            bubbleChannel,
            'fields.settings.slideMenuDestinationView',
            'channel:bubbles',
        );
        if (!browserView || !browserView.length) {
            browserView = 'channel:bubbles';
        }

        updateBrowser(browserId, {
            view: browserView,
            channelId,
            bubbleId,
        });

        // this.context.browser.tracker.bubbleEvent(bubble, 'Menu slide click');
    }

    onSlideIndexChange(index) {
        const { updateBrowser, bubbles } = this.props;
        const { browser } = this.context;
        const { id: browserId } = browser;

        updateBrowser(browserId, {
            menuBubbleIndex: index,
        });

        const bubble = bubbles[index] || null;
        if (bubble !== null) {
            browser.tracker.bubbleEvent(bubble, 'Menu slide change');
        }
    }

    getSlideSize(slide, index, current) {
        const { withSummary } = this.props;
        const { slidesHeight } = this.state;

        const slideRatio = withSummary ? 2 / 4 : 3 / 5;
        let newSlideWidth = slidesHeight * slideRatio;
        const newSlideHeight = slidesHeight;

        if (current && withSummary) {
            newSlideWidth *= 2;
        }

        return {
            width: newSlideWidth,
            height: newSlideHeight,
        };
    }

    updateSlidesHeight() {
        // const {
        //     width,
        //     height,
        //     slideWidth,
        //     slideHeight,
        //     withSummary,
        //     maxSlideWidthRatio,
        // } = this.props;
        // const channelsMenuHeight = this.refChannelsMenu.offsetHeight;
        // const slideshowTitleHeight = this.refSlideshowTitle.offsetHeight;
        // let slidesHeight = Math.max(2, height - channelsMenuHeight - slideshowTitleHeight);
        // const slideRatio = slideWidth / slideHeight;
        // let newSlideWidth = slidesHeight * slideRatio;
        //
        // if (withSummary) {
        //     newSlideWidth *= 2;
        // }
        //
        // let deltaSlidesHeight = 0;
        // if (newSlideWidth > width * maxSlideWidthRatio) {
        //     newSlideWidth = width * maxSlideWidthRatio;
        //     if (withSummary) {
        //         newSlideWidth /= 2;
        //     }
        //     const newSlidesHeight = newSlideWidth / slideRatio;
        //     deltaSlidesHeight = Math.round((slidesHeight - newSlidesHeight) / 2);
        //     slidesHeight = Math.round(newSlidesHeight);
        // }
        //
        // // prevent odd numbers
        // if (slidesHeight % 2) {
        //     slidesHeight -= 1;
        // }
        //
        // if (deltaSlidesHeight % 2) {
        //     deltaSlidesHeight -= 1;
        // }
        //
        // Cache.set('slidesHeight', slidesHeight);
        // Cache.set('slidesTop', deltaSlidesHeight);
        //
        // this.setState({
        //     slidesHeight,
        //     slidesTop: deltaSlidesHeight,
        // });

        const {
            width, slideWidth, slideHeight, height, withSummary,
        } = this.props;

        const slideRatio = slideWidth / slideHeight;
        const channelsMenuHeight = this.refChannelsMenu.offsetHeight;
        const slideshowTitleHeight = this.refSlideshowTitle.offsetHeight;
        const contentHeight = height - channelsMenuHeight - slideshowTitleHeight;
        const slidesHeight = withSummary
            ? Math.min((width - 50) * slideRatio, (contentHeight * 0.7))
            : (contentHeight * 0.7);
        const slidesTop = (contentHeight - slidesHeight) / 2;
        Cache.set('slidesHeight', slidesHeight);
        Cache.set('slidesTop', slidesTop);

        this.setState({
            slidesHeight,
            slidesTop,
        });
    }

    closeBrowser() {
        const { closeBrowser } = this.props;
        const { browser } = this.context;
        const { id: browserId } = browser;
        closeBrowser(browserId);
    }

    renderSlides() {
        const {
            width,
            slideWidth,
            slideHeight,
            scale,
            slidesMarginRatio,
            bubbles,
            index,
            withSummary,
        } = this.props;
        const { slidesHeight } = this.state;

        if (slidesHeight === 0) {
            return null;
        }

        const style = {
            width,
            height: slidesHeight,
        };

        const SlidesComponent = withSummary ? SlidesWithSummary : Slides;
        let SlideComponent;
        if (!withSummary) {
            SlideComponent = SlideMenu;
        }
        const slideMargin = slidesMarginRatio * style.width;

        const realScreenHeight = slideHeight / scale;
        const browserScale = slidesHeight / realScreenHeight;

        const slideProps = {
            coverScale: browserScale,
            // coverScale: this.state.slidesHeight/this.props.height,
            horizontal: slideWidth > slideHeight,
            context: 'menu',
        };

        return (
            <div className="slides-container" style={style}>
                <SlidesComponent
                    userControl
                    slides={bubbles}
                    index={index}
                    SlideComponent={SlideComponent}
                    slideSize={this.getSlideSize}
                    slideMargin={slideMargin}
                    slideProps={slideProps}
                    width={style.width}
                    height={style.height}
                    onSlideClick={this.onSlideClick}
                    onIndexChange={this.onSlideIndexChange}
                />
            </div>
        );
    }

    renderChannelsMenu() {
        const { width, height } = this.props;
        const { data } = this.context;
        const channels = data.getChannels();
        return (
            <ChannelsMenu
                channels={channels}
                width={width}
                containerHeight={height}
                onChannelClick={this.onChannelClick}
            />
        );
    }

    render() {
        const { withoutChannelsMenu } = this.props;
        const { slidesTop } = this.state;
        const slides = this.renderSlides();
        const channelsMenu = this.renderChannelsMenu();

        const slidesStyle = {
            top: slidesTop,
        };

        return (
            <div className="menu" onChannelClick={this.onChannelClick}>
                <div className="menu-slides-container" style={slidesStyle}>
                    <div
                        className="title-space top-title-space"
                        ref={(ref) => {
                            this.refSlideshowTitle = ref;
                        }}
                        style={{
                            display: 'none',
                        }}
                    >
                        <span>{Text.t('menu_title_featured')}</span>
                    </div>

                    {slides}
                </div>

                <div
                    className="channels-menu-container"
                    ref={(ref) => {
                        this.refChannelsMenu = ref;
                    }}
                    style={{
                        display: withoutChannelsMenu ? 'none' : null,
                    }}
                >
                    {channelsMenu}
                </div>
            </div>
        );
    }
}

Menu.propTypes = propTypes;
Menu.defaultProps = defaultProps;
Menu.contextTypes = contextTypes;

const WithStateContainer = connect(
    null,
    dispatch => ({
        updateBrowser: (id, props) => dispatch(NavigationActions.updateBrowser(id, props)),
        closeBrowser: id => dispatch(NavigationActions.closeBrowser(id)),
    }),
)(Menu);

export default WithStateContainer;
