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
var PUBLIC_EVENT_SCROLL = 'scroll';
var PUBLIC_EVENT_SCROLL_TOP = 'scrollTop';
var PUBLIC_EVENT_SCROLL_BOTTOM = 'scrollBottom';
var CSS_PX_PROP_MAP = {
    'top': true,
    'left': true,
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
     *      @param {?Number} options.spareItemCount - count of spare items for display items
     *      @param {?Number} options.itemHeight - item height
     *      @param {?Number} options.threshold - pixel height from edge(start, end) of content
     *                                           for determining need emit scrollTop, scrollBottom event
     *      @param {?Number} options.layoutHeight - layout height
     *      @param {?Number} options.scrollPosition - scroll position
     *
     */
    init: function(container, options) {
        var windowScrollMode = (options.layoutHeight === 'auto');
        var scrollPosition = options.scrollPosition;

        options = options || {};
        scrollPosition = tui.util.isNumber(scrollPosition) ? Math.max(scrollPosition, 0) : 0;

        /**
         * last rendered scroll position
         * @type {Number}
         */
        this.lastRenderedScrollPosition = scrollPosition;

        /**
         * previous scroll position
         * @type {?Number}
         */
        this.prevScrollPosition = scrollPosition;

        /**
         * the state being a public event occurs
         * @type {Boolean}
         */
        this.publicEventMode = false;

        this._initData(options, windowScrollMode);

        /**
         * container element
         * @type {HTMLElement}
         */
        this.container = tui.util.isString(container) ? document.getElementById(container) : container;

        /**
         * layout element
         * @type {HTMLElement}
         */
        this.layout = this._renderLayout(this.container, windowScrollMode);

        this._renderContents(scrollPosition, windowScrollMode);
        this._attachEvent(windowScrollMode);
    },

    /**
     * Make item position list.
     * @param {Number} itemHeightList - item height list
     * @returns {Array}
     * @private
     */
    _makeItemPositionList: function(itemHeightList) {
        var startPosition = 0;

        return tui.util.map(itemHeightList, function(itemHeight) {
            var itemPosition = {
                start: startPosition,
                end: startPosition + itemHeight
            };

            startPosition = itemPosition.end;

            return itemPosition;
        });
    },

    /**
     * Update item data.
     * @private
     */
    _updateItemData: function() {
        this.itemHeightList = tui.util.pluck(this.items, 'height');
        this.itemPositionList = this._makeItemPositionList(this.itemHeightList);
    },

    /**
     * Whether plus number or not.
     * @param {Number} value - value
     * @returns {Boolean}
     * @private
     */
    _isPlusNumber: function(value) {
        return tui.util.isNumber(value) && !isNaN(value) && (value >= 0);
    },

    /**
     * Get layout height.
     * @param {Boolean} windowScrollMode - whether use window scroll or not
     * @param {?Number} layoutHeightOption - layout height option
     * @returns {*}
     * @private
     */
    _getLayoutHeight: function(windowScrollMode, layoutHeightOption) {
        var layoutHeight;

        if (windowScrollMode) {
            layoutHeight = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
        } else {
            layoutHeight = this._isPlusNumber(layoutHeightOption) ? layoutHeightOption : DEFAULT_LAYOUT_HEIGHT;
        }

        return layoutHeight;
    },

    /**
     * Initialize data.
     * @param {object} options - virtual scroll component options
     *      @param {?Array.<String>} options.items - items
     *      @param {?Number} options.spareItemCount - count of spare items for display items
     *      @param {?Number} options.itemHeight - default item height
     *      @param {?Number} options.threshold - pixel height from edge(start, end) of content
     *                                           for determining need emit scrollTop, scrollBottom event
     *      @param {?Number} options.layoutHeight - layout height
     *      @param {?Number} options.scrollPosition - scroll position
     * @param {Boolean} windowScrollMode - whether use window scroll or not
     * @private
     */
    _initData: function(options, windowScrollMode) {
        var spareItemCount = options.spareItemCount;
        var itemHeight = options.itemHeight;
        var threshold = options.threshold;

        /**
         * items for rendering contents.
         * @type {Array.<{height: Number, contents: String}>}
         */
        this.items = [];

        /**
         * item height list.
         * @type {Array.<Number>}
         */
        this.itemHeightList = [];

        /**
         * item position list.
         * @type {Array.<Number>}
         */
        this.itemPositionList = [];

        /**
         * item height for rendering item.
         * @type {Number}
         */
        this.itemHeight = this._isPlusNumber(itemHeight) ? itemHeight : DEFAULT_CONTENT_HEIGHT;

        /**
         * spare item count for rendering margin of wrapper area
         * @type {Number}
         */
        this.spareItemCount = this._isPlusNumber(spareItemCount) ? spareItemCount : DEFAULT_SPARE_ITEM_COUNT;

        /**
         * pixel height from edge(start, end) of content for determining need emit scrollTop, scrollBottom event
         * @type {number}
         */
        this.threshold = this._isPlusNumber(threshold) ? threshold : DEFAULT_THRESHOLD;

        /**
         * layout height for rendering layout
         * @type {Number}
         */
        this.layoutHeight = this._getLayoutHeight(windowScrollMode, options.layoutHeight);

        /**
         * limit scroll value for rerender
         * @type {number}
         */
        this.limitScrollValueForRerender = (this.spareItemCount / 2 * this.itemHeight);

        this._insertItems(options.items || [], 0);
        this._updateItemData();
    },

    /**
     * Create cssText.
     * @param {Object.<String, Number>} cssMap - css map
     * @returns {String}
     * @private
     */
    _createCssText: function(cssMap) {
        return tui.util.map(cssMap, function(value, property) {
            var suffix = CSS_PX_PROP_MAP[property] ? 'px' : '';

            return property + ':' + value + suffix;
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
     * @param {Boolean} windowScrollMode - whether use window scroll or not
     * @returns {HTMLElement}
     * @private
     */
    _renderLayout: function(container, windowScrollMode) {
        var cssObj, cssText;

        if (!container) {
            throw new Error('Not exist HTML container');
        }

        if (!tui.util.isHTMLTag(container)) {
            throw new Error('This container is not a HTML element');
        }

        cssObj = {
            'width': '100%',
            '-webkit-overflow-scrolling': 'touch'
        };

        if (!windowScrollMode) {
            cssObj.height = this.layoutHeight;
            cssObj['overflow-y'] = 'auto';
        }

        cssText = this._createCssText(cssObj);
        container.innerHTML = this._createDivHtml({
            'style': cssText
        });

        return container.firstChild;
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
     * Create index range.
     * @param {Number} scrollPosition - scrollPosition for scroll
     * @returns {{start: Number, end: Number}}
     * @private
     */
    _createIndexRange: function(scrollPosition) {
        var itemHeightList = this.itemHeightList;
        var maximumEndIndex = itemHeightList.length;
        var spareItemCount = this.spareItemCount;
        var actualStartIndex = this._findActualStartIndex(this.itemPositionList, scrollPosition);
        var displayCount = this._calculateDisplayCount(itemHeightList.slice(actualStartIndex));
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
            'overflow-y': 'hidden',
            'position': 'absolute',
            'left': 0
        };
        var stackedTop = 0;

        return tui.util.map(renderItems, function(item) {
            baseCssTextMap.height = item.height || this.itemHeight;
            baseCssTextMap.top = stackedTop;

            stackedTop += baseCssTextMap.height;

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
        var itemHeightList = this.itemHeightList;
        var marginTop = this._sum(itemHeightList.slice(0, startIndex));
        var height = this._sum(itemHeightList) - marginTop;

        return this._createCssText({
            'width': '100%',
            'height': height,
            'margin-top': marginTop,
            'position': 'relative',
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
     * @param {?Boolean} windowScrollMode - whether use window scroll or not
     * @private
     */
    _renderContents: function(scrollPosition, windowScrollMode) {
        var layout = this.layout;
        var renderScrollPosition = scrollPosition || Math.max(this._getScrollPosition(windowScrollMode), 0);

        layout.innerHTML = this._createItemWrapperHtml(renderScrollPosition);

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
     * Get scroll position.
     * @param {Boolean} windowScrollMode - whether use window scroll or not
     * @returns {Number}
     * @private
     */
    _getScrollPosition: function(windowScrollMode) {
        var layout = this.layout;
        var getScrollPosition;

        if (!windowScrollMode) {
            getScrollPosition = function() {
                return layout.scrollTop;
            };
        } else if (!tui.util.isUndefined(window.scrollY)) {
            getScrollPosition = function() {
                return window.scrollY;
            };
        } else if (!tui.util.isUndefined(window.pageXOffset)) {
            getScrollPosition = function() {
                return window.pageYOffset;
            };
        } else if (document.compatMode === 'CSS1Compat') {
            getScrollPosition = function() {
                return document.documentElement.scrollTop;
            };
        } else {
            getScrollPosition = function() {
                return document.body.scrollTop;
            };
        }

        this._getScrollPosition = getScrollPosition;

        return getScrollPosition();
    },

    /**
     * Get scroll height.
     * @param {Boolean} windowScrollMode - whether use window scroll or not
     * @returns {Number}
     * @private
     */
    _getScrollHeight: function(windowScrollMode) {
        var layout = this.layout;
        var getScrollHeight;

        if (windowScrollMode) {
            getScrollHeight = function() {
                return document.documentElement.scrollHeight - document.documentElement.offsetHeight;
            };
        } else {
            getScrollHeight = function() {
                return layout.scrollHeight - layout.offsetHeight;
            };
        }

        this._getScrollHeight = getScrollHeight;

        return getScrollHeight();
    },

    /**
     * Handler for scroll event.
     * @param {Boolean} windowScrollMode - whether use window scroll or not
     * @private
     */
    _onScroll: function(windowScrollMode) {
        var scrollPosition = this._getScrollPosition(windowScrollMode);
        var scrollHeight = this._getScrollHeight(windowScrollMode);
        var eventData = {
            scrollPosition: scrollPosition,
            scrollHeight: scrollHeight
        };

        /**
         * Occurs when the scroll event.
         * @api
         * @event VirtualScroll#scroll
         * @property {object} eventData - event data
         *      @property {number} eventData.scrollPosition - current scroll position
         *      @property {number} eventData.scrollHeight - scroll height
         *      @property {number} eventData.movedPosition - moved position
         */
        this.fire(PUBLIC_EVENT_SCROLL, tui.util.extend({
            movedPosition: this.prevScrollPosition - scrollPosition
        }, eventData));

        this.prevScrollPosition = scrollPosition;

        if (scrollPosition >= (scrollHeight - this.threshold)) {
            /**
             * Occurs when the scroll position is arrived bottom.
             * @api
             * @event VirtualScroll#scrollBottom
             * @property {object} eventData - event data
             *      @property {number} eventData.scrollPosition - current scroll position
             *      @property {number} eventData.scrollHeight - scroll height
             */
            this._firePublicEvent(PUBLIC_EVENT_SCROLL_BOTTOM, eventData);
        } else if (scrollPosition <= this.threshold) {
            /**
             * Occurs when the scroll position is arrived top.
             * @api
             * @event VirtualScroll#scrollTop
             * @property {object} eventData - event data
             *      @property {number} eventData.scrollPosition - current scroll position
             *      @property {number} eventData.scrollHeight - scroll height
             */
            this._firePublicEvent(PUBLIC_EVENT_SCROLL_TOP, eventData);
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
     * @param {Boolean} windowScrollMode - whether use window scroll or not
     * @private
     */
    _attachEvent: function(windowScrollMode) {
        var onScroll = tui.util.bind(this._onScroll, this, windowScrollMode);

        if (windowScrollMode) {
            eventListener.on(window, 'scroll', onScroll);
        } else {
            eventListener.on(this.layout, 'scroll', onScroll);
        }
    },

    /**
     * Correct items.
     * @param {Array.<Object | String>} items - items
     * @returns {Array.<{height: number, contents: String}>}
     * @private
     */
    _correctItems: function(items) {
        var correctedItems = [];

        tui.util.forEachArray(items, function(item) {
            if (tui.util.isObject(item)) {
                item.height = tui.util.isNumber(item.height) ? item.height : this.itemHeight;
                correctedItems.push(item);
            } else if (tui.util.isExisty(item)) {
                correctedItems.push({
                    height: this.itemHeight,
                    contents: String(item)
                });
            }
        }, this);

        return correctedItems;
    },

    /**
     * Insert items.
     * @param {Array.<Object | String>} items - items
     * @param {?Number} startIndex - start index for append
     * @private
     */
    _insertItems: function(items, startIndex) {
        items = this._correctItems(items);
        this.items.splice.apply(this.items, [startIndex, 0].concat(items));
    },

    /**
     * Append items.
     * @param {Array.<{height: ?Number, contents: String}>} items - items
     * @api
     */
    append: function(items) {
        this._insertItems(items, this.items.length);
        this._updateItemData();
        this._renderContents();
    },

    /**
     * Prepend items.
     * @param {Array.<{height: ?Number, contents: String}>} items - items
     * @api
     */
    prepend: function(items) {
        var scrollPosition = this.layout.scrollTop + this._sum(tui.util.pluck(items, 'height'));

        this._insertItems(items, 0);
        this._updateItemData();
        this._renderContents(scrollPosition);
    },

    /**
     * Insert items.
     * @param {Array.<{height: ?Number, contents: String}>} items - items
     * @param {number} index - index
     * @api
     */
    insert: function(items, index) {
        var lastIndex = this.items.length - 1;

        index = Math.max(Math.min(index, lastIndex), 0);
        this._insertItems(items, index);
        this._updateItemData();
        this._renderContents();
    },

    /**
     * Remove item.
     * @param {number} index - index
     * @returns {?{height: Number, contents: String}}
     * @private
     */
    _removeItem: function(index) {
        var removedItem;

        if (!this._isPlusNumber(index)) {
            throw new Error('The index should be a plus number');
        }

        removedItem = this.items.splice(index, 1);

        return removedItem[0];
    },

    /**
     * Remove items.
     * @param {Array.<Number>} removeItemIndexList - list of item index for remove
     * @returns {Array.<?{height: Number, contents: String}>}
     * @private
     */
    _removeItems: function(removeItemIndexList) {
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
        }

        return removedItems;
    },

    /**
     * Remove item or items by index.
     *  - If index type is number, remove one item.
     *  - If index type is array of number, remove items.
     *  - If second parameter is false, not rerendering.
     * @param {Array.<Number> | Number} index - remove item index or index list
     * @param {Boolean} shouldRerender - whether should rerender or not
     * @returns {Array.<{height: Number, contents: String}> | {height: Number, contents: String}}
     * @api
     */
    remove: function(index, shouldRerender) {
        var removed;

        if (tui.util.isArray(index)) {
            removed = this._removeItems(index);
        } else {
            removed = this._removeItem(index);
        }

        this._updateItemData();
        shouldRerender = shouldRerender !== false;

        if (shouldRerender && removed && (!tui.util.isArray(removed) || removed.length)) {
            this._renderContents();
        }

        return removed;
    },

    /**
     * Clear items.
     * @api
     */
    clear: function() {
        this.items = [];
        this.itemHeightList = [];
        this.itemPositionList = [];
        this.layout.innerHTML = '';
    },

    /**
     * Move scroll position.
     * @param {Number} scrollPosition - scroll position
     * @api
     */
    moveScroll: function(scrollPosition) {
        scrollPosition = parseInt(scrollPosition, 10);

        if (!this._isPlusNumber(scrollPosition)) {
            throw new Error('The scroll position value should be a plus number');
        }

        this._renderContents(scrollPosition);
    },

    /**
     * Resize layout height.
     * @param {Number} height - layout height
     * @api
     */
    resizeHeight: function(height) {
        var prevScrollPosition;

        height = parseInt(height, 10);

        if (!this._isPlusNumber(height)) {
            throw new Error('The height value should be a plus number');
        }

        prevScrollPosition = this.layout.scrollTop;

        this.layoutHeight = height;
        this.layout.style.height = height + 'px';
        this._renderContents(prevScrollPosition);
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
     * Get item count.
     * @returns {Number}
     * @api
     */
    getItemCount: function() {
        return this.items.length;
    },

    /**
     * Get current scroll position value.
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
