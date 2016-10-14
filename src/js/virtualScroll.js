/**
 * @fileoverview Virtual scroll component.
 * @author NHN Ent.
 *         FE Development Lab <dl_javascript@nhnent.com>
 */

'use strict';

var eventListener = require('./eventListener');

var DEFAULT_CONTENT_HEIGHT = 50;
var DEFAULT_SPARE_ITEM_COUNT = 5;
var DEFAULT_THRESHOLD = 300;
var DEFAULT_DISPLAY_COUNT = 10;
var PUBLIC_EVENT_MAP = {
    scrollTop: 'scrollTop',
    scrollBottom: 'scrollBottom'
};
var CSS_PX_PROP_MAP = {
    'height': true,
    'margin-top': true
};

var VirtualScroll = tui.util.defineClass(/** @lends VirtualScroll.prototype */{
    /**
     * Virtual scroll component.
     * @constructs VirtualScroll
     * @param {HTMLElement|String} container - container element or id
     * @param {object} options - virtual scroll component  options
     *      @param {?Array.<String>} options.items - items
     *      @param {?Number} options.spareItemCount - spare item count for calculating margin of wrapper area
     *      @param {?Number} options.itemHeight - item height
     *      @param {?Number} options.displayCount - display item count
     *      @param {?Number} options.layoutHeight - layout height
     *      @param {?Number} options.scrollPosition - scroll position
     */
    init: function(container, options) {
        options = options || {};
        options.scrollPosition = options.scrollPosition || 0;

        /**
         * last rendered scroll position
         * @type {Number}
         */
        this.lastRenderedScrollPosition = options.scrollPosition;

        /**
         * previous scroll position
         * @type {?Number}
         */
        this.prevScrollPosition = options.scrollPosition;

        /**
         * the state being a public event occurs
         * @type {boolean}
         */
        this.publicEventMode = false;

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
        var actualStartIndex = parseInt(scrollPosition / this.itemHeight, 10);

        this.startIndex = Math.max(actualStartIndex - this.spareItemCount, 0);
        this.endIndex = Math.min(actualStartIndex + this.displayCount + this.spareItemCount, maximumEndIndex);
    },

    /**
     * Whether plus number or not.
     * @param {Number} value - value
     * @returns {boolean}
     */
    isPlusNumber: function(value) {
        return tui.util.isNumber(value) && (value > 0);
    },

    /**
     * Set display count.
     * @param {?Number} displayCount - displayCount option
     * @param {?Number} layoutHeight - layerHeight option
     * @private
     */
    _setDisplayCount: function(displayCount, layoutHeight) {
        var additionalCount;
        var isValidDisplayCount = this.isPlusNumber(displayCount);

        if (!isValidDisplayCount && this.isPlusNumber(layoutHeight)) {
            additionalCount = (layoutHeight % this.itemHeight) ? 1 : 0;
            this.displayCount = parseInt(layoutHeight / this.itemHeight, 10) + additionalCount;
        } else if (isValidDisplayCount) {
            this.displayCount = displayCount;
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
        var itemHeight = options.itemHeight;
        var layoutHeight = options.layoutHeight;
        var threshold = options.threshold;

        /**
         * items for rendering contents.
         * @type {Array.<String>}
         */
        this.items = options.items || [];

        /**
         * item height for rendering item.
         * @type {Number}
         */
        this.itemHeight = this.isPlusNumber(itemHeight) ? itemHeight : DEFAULT_CONTENT_HEIGHT;

        /**
         * spare item count for rendering margin of wrapper area
         * @type {Number}
         */
        this.spareItemCount = this.isPlusNumber(spareItemCount) ? spareItemCount : DEFAULT_SPARE_ITEM_COUNT;

        /**
         * size for checking to reach the terminal, when scroll event
         * @type {number}
         */
        this.threshold = this.isPlusNumber(threshold) ? threshold : DEFAULT_THRESHOLD;

        /**
         * display item count.
         * @type {Number}
         */
        this.displayCount = DEFAULT_DISPLAY_COUNT;

        this._setDisplayCount(options.displayCount, options.layoutHeight);

        /**
         * layout height for rendering layout
         * @type {Number}
         */
        this.layoutHeight = this.isPlusNumber(layoutHeight) ? layoutHeight : (this.itemHeight * this.displayCount);

        /**
         * limit scroll value for rerender
         * @type {number}
         */
        this.limitScrollValueForRerender = (this.spareItemCount / 2 * this.itemHeight);

        /**
         * start index for picking item from total items, when rendering contents
         * @type {Number}
         */
        this.startIndex = 0;

        /**
         * end index for picking item from total items, when rendering contents
         * @type {Number}
         */
        this.endIndex = 0;

        this._updateIndexRange(options.scrollPosition);
    },

    /**
     * Create cssText.
     * @param {Object.<String, Number>} cssMap - css map
     * @returns {String}
     * @private
     */
    _createCssText: function(cssMap) {
        return tui.util.map(cssMap, function(value, property) {
            var surffix = CSS_PX_PROP_MAP[property] ? 'px' : '';

            return property + ':' + value + surffix;
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
     * Render layout.
     * @param {HTMLElement} container - container element
     * @returns {HTMLElement}
     * @private
     */
    _renderLayout: function(container) {
        var cssText;

        if (!container) {
            throw new Error('Not exist HTML container');
        }

        if (!tui.util.isHTMLTag(container)) {
            throw new Error('This container is not a HTML element');
        }

        cssText = this._createCssText({
            'width': '100%',
            'height': this.layoutHeight,
            'overflow-y': 'auto',
            '-webkit-overflow-scrolling': 'touch'
        });

        container.innerHTML = this._createDivHtml({
            'style': cssText
        });

        return container.firstChild;
    },

    /**
     * Create items html.
     * @param {Array.<String>} items - items
     * @returns {String}
     * @private
     */
    _createItemsHtml: function() {
        var items = this.items.slice(this.startIndex, this.endIndex);
        var itemCssText = this._createCssText({
            'width': '100%',
            'height': this.itemHeight,
            'overflow': 'hidden'
        });

        return tui.util.map(items, function(item) {
            return this._createDivHtml({
                'style': itemCssText
            }, item);
        }, this).join('');
    },

    /**
     * Create cssText for item wrapper element.
     * @param {Number} itemCount - total item count
     * @returns {String}
     * @private
     */
    _createItemWrapperCssText: function(itemCount) {
        var itemHeight = this.itemHeight;
        var marginTop = this.startIndex * itemHeight;
        var height = (itemCount * itemHeight) - marginTop;

        return this._createCssText({
            'width': '100%',
            'height': height,
            'margin-top': marginTop,
            'overflow-y': 'hidden'
        });
    },

    /**
     * Create html for item wrapper element
     * @returns {String}
     * @private
     */
    _createItemWrapperHtml: function() {
        var itemsHtml = this._createItemsHtml();
        var cssText = this._createItemWrapperCssText(this.items.length);

        return this._createDivHtml({'style': cssText}, itemsHtml);
    },

    /**
     * Render contents.
     * @param {?Number} scrollPosition - scroll position
     * @private
     */
    _renderContents: function(scrollPosition) {
        var layout = this.layout;

        layout.innerHTML = this._createItemWrapperHtml();

        if (!tui.util.isExisty(scrollPosition)) {
            return;
        }

        setTimeout(function() {
            layout.scrollTop = scrollPosition;
        });
    },

    /**
     * Fire public event.
     * @param {String} eventName - event name
     * @param {{scrollPosition: Number, scrollHeight: number}} eventData - event data
     * @private
     */
    _firePublicEvent: function(eventName, eventData) {
        if (this.publicEventMode) {
            return;
        }

        this.fire(eventName, eventData);
        this.publicEventMode = true;
    },

    /**
     * Handler for scroll event.
     * @private
     */
    _onScroll: function() {
        var scrollPosition = this.layout.scrollTop;
        var scrollHeight = this.layout.scrollHeight - this.layout.offsetHeight;
        var eventData = {
            scrollPosition: scrollPosition,
            scrollHeight: scrollHeight
        };

        if (scrollPosition >= (scrollHeight - this.threshold)) {
            this._firePublicEvent(PUBLIC_EVENT_MAP.scrollBottom, eventData);
        } else if (scrollPosition <= this.threshold) {
            this._firePublicEvent(PUBLIC_EVENT_MAP.scrollTop, eventData);
        } else {
            this.publicEventMode = false;
        }

        this.prevScrollPosition = scrollPosition;

        if (Math.abs(this.lastRenderedScrollPosition - scrollPosition) < this.limitScrollValueForRerender) {
            return;
        }

        this.lastRenderedScrollPosition = scrollPosition;

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
            throw new Error('The scroll position value should be a number type');
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
        this.container = null;
    }
});

tui.util.CustomEvents.mixin(VirtualScroll);

/**
 * NHN Entertainment Toast UI Chart.
 * @namespace tui.chart
 */
tui.util.defineNamespace('tui.component');
tui.component.VirtualScroll = VirtualScroll;
