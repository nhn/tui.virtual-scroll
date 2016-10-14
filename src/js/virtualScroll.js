/**
 * @fileoverview Virtual scroll component.
 * @author NHN Ent.
 *         FE Development Lab <dl_javascript@nhnent.com>
 */

'use strict';

var eventListener = require('./eventListener');

var CSS_CLASS_LAYOUT = 'tui-component-virtual-scroll';
var CSS_CLASS_ITEM_WRAPPER = CSS_CLASS_LAYOUT + '-wrapper';
var CSS_CLASS_ITEM = CSS_CLASS_LAYOUT + '-item';
var DEFAULT_CONTENT_HEIGHT = 50;
var DEFAULT_DISPLAY_COUNT = 10;
var DEFAULT_SPARE_ITEM_COUNT = 5;
var PUBLIC_EVENT_MAP = {
    scroll: 'scroll',
    scrollTop: 'scrollTop',
    scrollBottom: 'scrollBottom'
};

var VirtualScroll;

require('../css/style.css');

VirtualScroll = tui.util.defineClass(/** @lends VirtualScroll.prototype */{
    /**
     * Virtual scroll component.
     * @constructs VirtualScroll
     * @param {HTMLElement|String} container - container element or id
     * @param {object} options - virtual scroll component  options
     *      @param {?Array.<String>} options.items - items
     *      @param {?Number} options.spareItemCount - spare item count for rendering margin of wrapper area
     *      @param {?Number} options.itemHeight - item height
     *      @param {?Number} options.displayCount - display item count
     *      @param {?Number} options.layoutHeight - layout height
     *      @param {?Number} options.scrollPosition - scroll position
     */
    init: function(container, options) {
        options = options || {};
        options.scrollPosition = options.scrollPosition || 0;

        this._initData(options);

        /**
         * container element
         * @type {HTMLElement}
         */
        this.container = tui.util.isString(container) ? document.getElementById(container) : container;

        /**
         * layout element
         * @type {HTMLElement}
         */
        this.layout = this._renderLayout(this.container);

        this._renderContents(options.scrollPosition);
        this._attachEvent();
    },

    /**
     * Update index range.
     * @param {Number} scrollPosition - scrollPosition for scroll
     * @private
     */
    _updateIndexRange: function(scrollPosition) {
        var maximumEndIndex = this.items.length;
        var realStartIndex;

        realStartIndex = parseInt(scrollPosition / this.itemHeight, 0);

        /**
         * start index for picking item from total items, when rendering contents
         * @type {Number}
         */
        this.startIndex = Math.max(realStartIndex - this.spareItemCount, 0);

        /**
         * end index for picking item from total items, when rendering contents
         * @type {Number}
         */
        this.endIndex = Math.min(realStartIndex + this.displayCount + this.spareItemCount, maximumEndIndex);
    },

    /**
     * Set display count.
     * @param {?Number} displayCount - displayCount option
     * @param {?Number} layoutHeight - layerHeight option
     * @private
     */
    _setDisplayCount: function(displayCount, layoutHeight) {
        var remainHeight;

        /**
         * display item count.
         * @type {Number}
         */
        if (!displayCount && layoutHeight) {
            remainHeight = layoutHeight % this.itemHeight;
            this.displayCount = parseInt(layoutHeight / this.itemHeight, 0) + (remainHeight ? 1 : 0);
        } else {
            this.displayCount = displayCount || DEFAULT_DISPLAY_COUNT;
        }
    },

    /**
     * Initialize data.
     * @param {object} options - virtual scroll component options
     *      @param {?Array.<String>} options.items - items
     *      @param {?Number} options.spareItemCount - spare item count for rendering margin of wrapper area
     *      @param {?Number} options.itemHeight - item height
     *      @param {?Number} options.displayCount - display item count
     *      @param {?Number} options.layoutHeight - layout height
     *      @param {?Number} options.scrollPosition - scroll position
     * @private
     */
    _initData: function(options) {
        var spareItemCount = options.spareItemCount;

        /**
         * items for rendering contents.
         * @type {Array.<String>}
         */
        this.items = options.items || [];

        /**
         * spare item count for rendering margin of wrapper area
         * @type {Number}
         */
        this.spareItemCount = tui.util.isExisty(spareItemCount) ? spareItemCount : DEFAULT_SPARE_ITEM_COUNT;

        /**
         * item height for rendering item.
         * @type {Number}
         */
        this.itemHeight = options.itemHeight || DEFAULT_CONTENT_HEIGHT;

        this._setDisplayCount(options.displayCount, options.layoutHeight);

        /**
         * layout height for rendering layout
         * @type {Number}
         */
        this.layoutHeight = options.layoutHeight || (this.itemHeight * this.displayCount);

        this.limitForRerender = (this.spareItemCount / 2 * this.itemHeight);
        /**
         * previous scroll position
         * @type {Number}
         */
        this.prevScrollPosition = options.scrollPosition;

        this._updateIndexRange(options.scrollPosition);
    },

    /**
     * Render layout.
     * @param {HTMLElement} container - container element
     * @returns {HTMLElement}
     * @private
     */
    _renderLayout: function(container) {
        var layout;

        if (!container) {
            throw new Error('Not exist HTML container');
        }

        if (!tui.util.isHTMLTag(container)) {
            throw new Error('This container is not HTML element');
        }

        layout = document.createElement('DIV');
        layout.className = CSS_CLASS_LAYOUT;
        layout.style.height = this.layoutHeight + 'px';
        container.appendChild(layout);

        return layout;
    },

    /**
     * Create cssText.
     * @param {Object.<String, Number>} cssMap - css map
     * @returns {String}
     * @private
     */
    _createCssText: function(cssMap) {
        return tui.util.map(cssMap, function(value, property) {
            return property + ':' + value + 'px';
        }).join(';');
    },

    /**
     * Create div html.
     * @param {Object.<String, String>} attrMap - attribute map
     * @param {String} innerHtml - html string
     * @returns {String}
     * @private
     */
    _createDivHtml: function(attrMap, innerHtml) {
        var attrString = tui.util.map(attrMap, function(value, property) {
            return property + '="' + value + '"';
        }).join(' ');

        return '<div ' + attrString + '>' + innerHtml + '</div>';
    },

    /**
     * Create items html.
     * @param {Array.<String>} items - items
     * @returns {String}
     * @private
     */
    _createItemsHtml: function(items) {
        var itemCssText = this._createCssText({
            height: this.itemHeight
        });

        return tui.util.map(items, function(item) {
            return this._createDivHtml({
                'class': CSS_CLASS_ITEM,
                style: itemCssText
            }, item);
        }, this).join('');
    },

    /**
     * Create cssText for item wrapper element.
     * @param {Number} renderingItemCount - item count for rendering
     * @param {Number} itemCount - total item count
     * @returns {String}
     * @private
     */
    _createItemWrapperCssText: function(renderingItemCount, itemCount) {
        var itemHeight = this.itemHeight;
        var height = itemHeight * renderingItemCount;
        var marginTop = this.startIndex * itemHeight;
        var marginBottom = (itemCount - this.endIndex) * itemHeight;

        return this._createCssText({
            height: height,
            'margin-top': marginTop,
            'margin-bottom': marginBottom
        });
    },

    /**
     * Create html for item wrapper element
     * @returns {String}
     * @private
     */
    _createItemWrapperHtml: function() {
        var items = this.items.slice(this.startIndex, this.endIndex);
        var itemsHtml = this._createItemsHtml(items);
        var cssText = this._createItemWrapperCssText(items.length, this.items.length);

        return this._createDivHtml({
            'class': CSS_CLASS_ITEM_WRAPPER,
            style: cssText
        }, itemsHtml);
    },

    /**
     * Render contents.
     * @param {?Number} scrollPosition - scroll position
     * @private
     */
    _renderContents: function(scrollPosition) {
        this.layout.innerHTML = this._createItemWrapperHtml();

        if (tui.util.isExisty(scrollPosition)) {
            this.layout.scrollTop = scrollPosition;
        }
    },

    /**
     * Handler for scroll event.
     * @private
     */
    _onScroll: function() {
        var scrollPosition = this.layout.scrollTop;
        var scrollHeight = this.layout.scrollHeight - this.layout.offsetHeight;

        this.fire(PUBLIC_EVENT_MAP.scroll, scrollPosition, scrollHeight);

        if (scrollPosition === scrollHeight) {
            this.fire(PUBLIC_EVENT_MAP.scrollBottom, scrollPosition, scrollHeight);
        } else if (scrollPosition === 0) {
            this.fire(PUBLIC_EVENT_MAP.scrollTop, scrollPosition, scrollHeight);
        }

        if (Math.abs(this.prevScrollPosition - scrollPosition) < this.limitForRerender) {
            return;
        }

        this.prevScrollPosition = scrollPosition;

        this._updateIndexRange(scrollPosition);
        this._renderContents();
    },

    /**
     * Attach event.
     * @private
     */
    _attachEvent: function() {
        eventListener.on(this.layout, 'scroll', this._onScroll, this);
    },

    /**
     * Append items.
     * @param {?Array.<String>} items - items
     * @api
     */
    append: function(items) {
        this.items = this.items.concat(items);
        this._updateIndexRange(this.layout.scrollTop);
        this._renderContents();
    },

    /**
     * Prepend items.
     * @param {?Array.<String>} items - items
     * @api
     */
    prepend: function(items) {
        var scrollPosition = this.layout.scrollTop + (items.length * this.itemHeight);

        this.items = items.concat(this.items);
        this._updateIndexRange(scrollPosition);
        this._renderContents(scrollPosition);
    },

    /**
     * Clear items.
     * @api
     */
    clear: function() {
        this.items = [];
        this.layout.innerHTML = '';
    },

    /**
     * Move scroll.
     * @param {Number} scrollPosition - scroll position
     * @api
     */
    moveScroll: function(scrollPosition) {
        if (!tui.util.isNumber(scrollPosition)) {
            throw new Error('This scroll position value is not number type');
        }

        this._updateIndexRange(scrollPosition);
        this._renderContents(scrollPosition);
    },

    /**
     * Get items.
     * @returns {Array.<String>}
     * @api
     */
    getItems: function() {
        return this.items.slice();
    },

    /**
     * Get scroll position value.
     * @returns {Number}
     * @api
     */
    getScrollPosition: function() {
        return this.layout.scrollTop;
    },

    /**
     * Destroy.
     * @api
     */
    destroy: function() {
        eventListener.off(this.layout, 'scroll', this._onScroll, this);
        this.container.innerHTML = '';
    }
});

tui.util.CustomEvents.mixin(VirtualScroll);

/**
 * NHN Entertainment Toast UI Chart.
 * @namespace tui.chart
 */
tui.util.defineNamespace('tui.component');
tui.component.VirtualScroll = VirtualScroll;
