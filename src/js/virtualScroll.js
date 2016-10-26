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
var DEFAULT_LAYOUT_HEIGHT = 400;
var PUBLIC_EVENT_MAP = {
    scroll: 'scroll',
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
     *      @param {?Number} options.defaultItemHeight - item height
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
     * Whether plus number or not.
     * @param {Number} value - value
     * @returns {boolean}
     */
    isPlusNumber: function(value) {
        return tui.util.isNumber(value) && (value > 0);
    },

    /**
     * Initialize data.
     * @param {object} options - virtual scroll component options
     *      @param {?Array.<String>} options.items - items
     *      @param {?Number} options.spareItemCount - spare item count for rendering margin of wrapper area
     *      @param {?Number} options.defaultItemHeight - item height
     *      @param {?Number} options.layoutHeight - layout height
     *      @param {?Number} options.scrollPosition - scroll position
     * @private
     */
    _initData: function(options) {
        var spareItemCount = options.spareItemCount;
        var defaultItemHeight = options.defaultItemHeight;
        var layoutHeight = options.layoutHeight;
        var threshold = options.threshold;

        /**
         * items for rendering contents.
         * @type {Array.<String>}
         */
        this.items = options.items || [];

        /**
         * item height list.
         * @type {Array.<Number>}
         */
        this.itemHeights = tui.util.pluck(this.items, 'height');

        /**
         * item height for rendering item.
         * @type {Number}
         */
        this.defaultItemHeight = this.isPlusNumber(defaultItemHeight) ? defaultItemHeight : DEFAULT_CONTENT_HEIGHT;

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
         * layout height for rendering layout
         * @type {Number}
         */
        this.layoutHeight = this.isPlusNumber(layoutHeight) ? layoutHeight : DEFAULT_LAYOUT_HEIGHT;

        /**
         * limit scroll value for rerender
         * @type {number}
         */
        this.limitScrollValueForRerender = (this.spareItemCount / 2 * this.defaultItemHeight);
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
     * Make item position list.
     * @param {Number} itemHeights - item heights
     * @returns {Array}
     * @private
     */
    _makeItemPositionList: function(itemHeights) {
        var startPosition = 0;

        return tui.util.map(itemHeights, function(itemHeight) {
            var itemPosition = {
                start: startPosition,
                end: startPosition + (itemHeight || this.defaultItemHeight)
            };

            startPosition = itemPosition.end;

            return itemPosition;
        }, this);
    },

    /**
     * Find actual start index in itemPositionList by scrollPosition.
     * @param {Array.<{start: number, end: number}>} itemPositionList - item position list
     * @param {Number} scrollPosition - scroll position
     * @returns {Number | null}
     * @private
     */
    _findActualStartIndex: function(itemPositionList, scrollPosition) {
        var foundIndex = null;

        scrollPosition = scrollPosition || 0;
        tui.util.forEachArray(itemPositionList, function(itemPosition, index) {
            if (itemPosition.start <= scrollPosition && itemPosition.end > scrollPosition) {
                foundIndex = index;
            }

            return tui.util.isEmpty(foundIndex);
        });

        if (itemPositionList.length && tui.util.isNull(foundIndex)) {
            foundIndex = itemPositionList.length - 1;
        }

        return foundIndex;
    },

    /**
     * Calculate display count.
     * @param {Array.<Number>} displayItemHeights - item height list for display;
     * @returns {number}
     * @private
     */
    _calculateDisplayCount: function(displayItemHeights) {
        var layoutHeight = this.layoutHeight;
        var cumulativeHeight = 0;
        var displayCount = 0;

        tui.util.forEachArray(displayItemHeights, function(height) {
            cumulativeHeight += height;
            displayCount += 1;

            return cumulativeHeight < layoutHeight;
        });

        return displayCount;
    },

    /**
     * Update index range.
     * @param {Number} scrollPosition - scrollPosition for scroll
     * @returns {{start: Number, end: Number}}
     * @private
     */
    _createIndexRange: function(scrollPosition) {
        var itemHeights = this.itemHeights;
        var maximumEndIndex = itemHeights.length;
        var spareItemCount = this.spareItemCount;
        var itemPositionList = this._makeItemPositionList(itemHeights);
        var actualStartIndex = this._findActualStartIndex(itemPositionList, scrollPosition);
        var displayCount = this._calculateDisplayCount(itemHeights.slice(actualStartIndex));
        var startIndex = Math.max(actualStartIndex - spareItemCount, 0);
        var endIndex = Math.min(actualStartIndex + displayCount + spareItemCount, maximumEndIndex);

        return {
            start: startIndex,
            end: endIndex
        };
    },

    /**
     * Create items html.
     * @param {Number} startIndex - start index
     * @param {Number} endIndex - end index
     * @returns {String}
     * @private
     */
    _createItemsHtml: function(startIndex, endIndex) {
        var renderItems = this.items.slice(startIndex, endIndex);
        var baseCssTextMap = {
            'width': '100%',
            'overflow-y': 'hidden'
        };

        return tui.util.map(renderItems, function(item) {
            baseCssTextMap.height = item.height || this.defaultItemHeight;

            return this._createDivHtml({
                'style': this._createCssText(baseCssTextMap)
            }, item.contents);
        }, this).join('');
    },

    /**
     * Sum values.
     * @param {Array.<Number>} values - values
     * @returns {number}
     * @private
     */
    _sum: function(values) {
        var copyValues = values.slice();

        copyValues.unshift(0);
        return tui.util.reduce(copyValues, function(base, add) {
            return base + add;
        });
    },

    /**
     * Create cssText for item wrapper element.
     * @param {Number} startIndex - start index
     * @returns {String}
     * @private
     */
    _createItemWrapperCssText: function(startIndex) {
        var itemHeights = this.itemHeights;
        var marginTop = this._sum(itemHeights.slice(0, startIndex));
        var height = this._sum(itemHeights) - marginTop;

        return this._createCssText({
            'width': '100%',
            'height': height,
            'margin-top': marginTop,
            'overflow-y': 'hidden'
        });
    },

    /**
     * Create html for item wrapper element
     * @param {Number} scrollPosition - scroll position
     * @returns {String}
     * @private
     */
    _createItemWrapperHtml: function(scrollPosition) {
        var indexRange = this._createIndexRange(scrollPosition);
        var innerHtml = this._createItemsHtml(indexRange.start, indexRange.end);
        var cssText = this._createItemWrapperCssText(indexRange.start);

        return this._createDivHtml({'style': cssText}, innerHtml);
    },

    /**
     * Render contents.
     * @param {?Number} scrollPosition - scroll position
     * @private
     */
    _renderContents: function(scrollPosition) {
        var layout = this.layout;

        layout.innerHTML = this._createItemWrapperHtml(scrollPosition || this.layout.scrollTop);

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

        this.fire(PUBLIC_EVENT_MAP.scroll, tui.util.extend({
            movedPosition: this.prevScrollPosition - scrollPosition
        }, eventData));

        this.prevScrollPosition = scrollPosition;

        if (scrollPosition >= (scrollHeight - this.threshold)) {
            this._firePublicEvent(PUBLIC_EVENT_MAP.scrollBottom, eventData);
        } else if (scrollPosition <= this.threshold) {
            this._firePublicEvent(PUBLIC_EVENT_MAP.scrollTop, eventData);
        } else {
            this.publicEventMode = false;
        }

        if (Math.abs(this.lastRenderedScrollPosition - scrollPosition) < this.limitScrollValueForRerender) {
            return;
        }

        this.lastRenderedScrollPosition = scrollPosition;

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
        this.itemHeights = tui.util.pluck(this.items, 'height');
        this._renderContents();
    },

    /**
     * Prepend items.
     * @param {?Array.<String>} items - items
     * @api
     */
    prepend: function(items) {
        var scrollPosition = this.layout.scrollTop + this._sum(tui.util.pluck(items, 'height'));

        this.items = items.concat(this.items);
        this.itemHeights = tui.util.pluck(this.items, 'height');
        this._renderContents(scrollPosition);
    },

    /**
     * Remove item.
     * @param {number} index - index
     * @returns {?{height: Number, contents: String}}
     * @api
     */
    removeItem: function(index) {
        var removedItem;

        if (tui.util.isNumber(index)) {
            removedItem = this.items.splice(index, 1);
            this.itemHeights.splice(index, 1);
            this._renderContents();
        }

        return removedItem;
    },

    /**
     * Remove items.
     * @param {Array.<Number>} removeItemIndexList - list of item index for remove
     * @returns {Array.<?{height: Number, contents: String}>}
     * @api
     */
    removeItems: function(removeItemIndexList) {
        var newItems = [];
        var removedItems = [];

        if (tui.util.isArray(removeItemIndexList)) {
            tui.util.forEachArray(this.items, function(item, index) {
                if (tui.util.inArray(index, removeItemIndexList) === -1) {
                    newItems.push(item);
                } else {
                    removedItems.push(item);
                }
            }, this);

            this.items = newItems;
            this.itemHeights = tui.util.pluck(newItems, 'height');
            this._renderContents();
        }

        return removedItems;
    },

    /**
     * Remove first item.
     * @returns {{height: Number, contents: String}}
     */
    removeFirstItem: function() {
        var removedItem = this.items.shift();

        this.itemHeights.shift();
        this._renderContents();

        return removedItem;
    },

    /**
     * Remove last item.
     * @returns {{height: Number, contents: String}}
     */
    removeLastItem: function() {
        var removedItem = this.items.pop();

        this.itemHeights.pop();
        this._renderContents();

        return removedItem;
    },

    /**
     * Clear items.
     * @api
     */
    clear: function() {
        this.items = [];
        this.itemHeights = [];
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
