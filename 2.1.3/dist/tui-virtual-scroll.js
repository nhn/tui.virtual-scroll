/*!
 * tui-virtual-scroll.js
 * @version 2.1.3
 * @author NHN FE Development Lab <dl_javascript@nhn.com>
 * @license MIT
 */
(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory(require("tui-code-snippet"));
	else if(typeof define === 'function' && define.amd)
		define(["tui-code-snippet"], factory);
	else if(typeof exports === 'object')
		exports["VirtualScroll"] = factory(require("tui-code-snippet"));
	else
		root["tui"] = root["tui"] || {}, root["tui"]["VirtualScroll"] = factory((root["tui"] && root["tui"]["util"]));
})(this, function(__WEBPACK_EXTERNAL_MODULE_1__) {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "dist";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

	/**
	 * @fileoverview Virtual scroll component.
	 * @author NHN. FE Development Lab <dl_javascript@nhn.com>
	 */

	'use strict';

	var snippet = __webpack_require__(1);
	var eventListener = __webpack_require__(2);

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

	/**
	 * Virtual scroll component.
	 * @class
	 * @param {HTMLElement|String} container - container element or id
	 * @param {object} options - virtual scroll component  options
	 *      @param {?Array.<String>} options.items - items
	 *      @param {?Number} options.spareItemCount - count of spare items for display items
	 *      @param {?Number} options.itemHeight - item height
	 *      @param {?Number} options.threshold - pixel height from edge(start, end) of content
	 *                                           for determining need emit scrollTop, scrollBottom event
	 *      @param {?Number} options.containerHeight - container height
	 *      @param {?Number} options.scrollPosition - scroll position
	 *      @param {Boolean} [options.usageStatistics=true|false] send hostname to google analytics [default value is true]
	 * @example
	 * var VirtualScroll = tui.VirtualScroll; // require('tui-virtual-scroll');
	 * var container = document.getElementById('virtual-scroll-container');
	 * var instance = new VirtualScroll(container, {
	 *     scrollPosition: 0,
	 *     itemHeight: 150,
	 *     spareItemCount: 5,
	 *     layoutHeight: 400,
	 *     items: items
	 * });
	 */
	var VirtualScroll = snippet.defineClass(/** @lends VirtualScroll.prototype */{
	    init: function(container, options) {
	        var scrollPosition;

	        options = snippet.extend({
	            usageStatistics: true
	        }, options);

	        scrollPosition = options.scrollPosition;
	        scrollPosition = snippet.isNumber(scrollPosition) ? Math.max(scrollPosition, 0) : 0;

	        /**
	         * last rendered scroll position
	         * @type {Number}
	         * @private
	         */
	        this.lastRenderedScrollPosition = scrollPosition;

	        /**
	         * previous scroll position
	         * @type {?Number}
	         * @private
	         */
	        this.prevScrollPosition = scrollPosition;

	        /**
	         * the state being a public event occurs
	         * @type {Boolean}
	         * @private
	         */
	        this.publicEventMode = false;

	        this._initData(options);

	        /**
	         * container element
	         * @type {HTMLElement}
	         * @private
	         */
	        this.container = snippet.isString(container) ? document.getElementById(container) : container;

	        /**
	         * layout element
	         * @type {HTMLElement}
	         * @private
	         */
	        this.layout = this._renderLayout(this.container);

	        this._renderContents(scrollPosition);
	        this._attachEvent();

	        if (options.usageStatistics) {
	            snippet.sendHostname('virtual-scroll', 'UA-129987462-1');
	        }
	    },

	    /**
	     * Make item position list.
	     * @param {Number} itemHeightList - item height list
	     * @returns {Array}
	     * @private
	     */
	    _makeItemPositionList: function(itemHeightList) {
	        var startPosition = 0;

	        return snippet.map(itemHeightList, function(itemHeight) {
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
	        this.itemHeightList = snippet.pluck(this.items, 'height');
	        this.itemPositionList = this._makeItemPositionList(this.itemHeightList);
	    },

	    /**
	     * Whether plus number or not.
	     * @param {Number} value - value
	     * @returns {Boolean}
	     * @private
	     */
	    _isPlusNumber: function(value) {
	        return snippet.isNumber(value) && !isNaN(value) && (value >= 0);
	    },

	    /**
	     * Initialize data.
	     * @param {object} options - virtual scroll component options
	     *      @param {?Array.<String>} options.items - items
	     *      @param {?Number} options.spareItemCount - count of spare items for display items
	     *      @param {?Number} options.itemHeight - default item height
	     *      @param {?Number} options.threshold - pixel height from edge(start, end) of content
	     *                                           for determining need emit scrollTop, scrollBottom event
	     *      @param {?Number} options.containerHeight - container height
	     *      @param {?Number} options.scrollPosition - scroll position
	     * @private
	     */
	    _initData: function(options) {
	        var spareItemCount = options.spareItemCount;
	        var itemHeight = options.itemHeight;
	        var threshold = options.threshold;
	        var containerHeight = options.containerHeight;

	        /**
	         * items for rendering contents.
	         * @type {Array.<{height: Number, contents: String}>}
	         * @private
	         */
	        this.items = [];

	        /**
	         * item height list.
	         * @type {Array.<Number>}
	         * @private
	         */
	        this.itemHeightList = [];

	        /**
	         * item position list.
	         * @type {Array.<Number>}
	         * @private
	         */
	        this.itemPositionList = [];

	        /**
	         * item height for rendering item.
	         * @type {Number}
	         * @private
	         */
	        this.itemHeight = this._isPlusNumber(itemHeight) ? itemHeight : DEFAULT_CONTENT_HEIGHT;

	        /**
	         * spare item count for rendering margin of wrapper area
	         * @type {Number}
	         * @private
	         */
	        this.spareItemCount = this._isPlusNumber(spareItemCount) ? spareItemCount : DEFAULT_SPARE_ITEM_COUNT;

	        /**
	         * pixel height from edge(start, end) of content for determining need emit scrollTop, scrollBottom event
	         * @type {number}
	         * @private
	         */
	        this.threshold = this._isPlusNumber(threshold) ? threshold : DEFAULT_THRESHOLD;

	        /**
	         * layout height for rendering layout
	         * @type {Number}
	         * @private
	         */
	        this.layoutHeight = this._isPlusNumber(containerHeight) ? containerHeight : DEFAULT_LAYOUT_HEIGHT;

	        /**
	         * limit scroll value for rerender
	         * @type {number}
	         * @private
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
	        return snippet.map(cssMap, function(value, property) {
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
	        var attrString = snippet.map(attrMap, function(value, property) {
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

	        if (!snippet.isHTMLTag(container)) {
	            throw new Error('This container is not a HTML element');
	        }

	        cssText = this._createCssText({
	            'width': '100%',
	            'height': this.layoutHeight,
	            'overflow-y': 'auto',
	            '-webkit-overflow-scrolling': 'touch',
	            '-webkit-transform': 'translateZ(0)',
	            '-moz-transform': 'translateZ(0)',
	            '-ms-transform': 'translateZ(0)',
	            '-o-transform': 'translateZ(0)',
	            'transform': 'translateZ(0)'
	        });
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
	        snippet.forEachArray(itemPositionList, function(itemPosition, index) {
	            if (itemPosition.start <= scrollPosition && itemPosition.end > scrollPosition) {
	                foundIndex = index;
	            }

	            return snippet.isEmpty(foundIndex);
	        });

	        if (itemPositionList.length && snippet.isNull(foundIndex)) {
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

	        snippet.forEachArray(displayItemHeights, function(height) {
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

	        return snippet.map(renderItems, function(item) {
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

	        return snippet.reduce(copyValues, function(base, add) {
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
	     * @private
	     */
	    _renderContents: function(scrollPosition) {
	        var layout = this.layout;
	        var renderScrollPosition = scrollPosition || Math.max(this.layout.scrollTop, 0);

	        layout.innerHTML = this._createItemWrapperHtml(renderScrollPosition);

	        if (!snippet.isExisty(scrollPosition)) {
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

	        /**
	         * Occurs when the scroll event.
	         * @event VirtualScroll#scroll
	         * @property {object} eventData - event data
	         *      @property {number} eventData.scrollPosition - current scroll position
	         *      @property {number} eventData.scrollHeight - scroll height
	         *      @property {number} eventData.movedPosition - moved position
	         */
	        this.fire(PUBLIC_EVENT_SCROLL, snippet.extend({
	            movedPosition: this.prevScrollPosition - scrollPosition
	        }, eventData));

	        this.prevScrollPosition = scrollPosition;

	        if (scrollPosition >= (scrollHeight - this.threshold)) {
	            /**
	             * Occurs when the scroll position is arrived bottom.
	             * @event VirtualScroll#scrollBottom
	             * @property {object} eventData - event data
	             *      @property {number} eventData.scrollPosition - current scroll position
	             *      @property {number} eventData.scrollHeight - scroll height
	             */
	            this._firePublicEvent(PUBLIC_EVENT_SCROLL_BOTTOM, eventData);
	        } else if (scrollPosition <= this.threshold) {
	            /**
	             * Occurs when the scroll position is arrived top.
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
	     * @private
	     */
	    _attachEvent: function() {
	        eventListener.on(this.layout, 'scroll', this._onScroll, this);
	    },

	    /**
	     * Correct items.
	     * @param {Array.<Object | String>} items - items
	     * @returns {Array.<{height: number, contents: String}>}
	     * @private
	     */
	    _correctItems: function(items) {
	        var correctedItems = [];

	        snippet.forEachArray(items, function(item) {
	            if (snippet.isObject(item)) {
	                item.height = snippet.isNumber(item.height) ? item.height : this.itemHeight;
	                correctedItems.push(item);
	            } else if (snippet.isExisty(item)) {
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
	     */
	    append: function(items) {
	        this._insertItems(items, this.items.length);
	        this._updateItemData();
	        this._renderContents();
	    },

	    /**
	     * Prepend items.
	     * @param {Array.<{height: ?Number, contents: String}>} items - items
	     */
	    prepend: function(items) {
	        var scrollPosition = this.layout.scrollTop + this._sum(snippet.pluck(items, 'height'));

	        this._insertItems(items, 0);
	        this._updateItemData();
	        this._renderContents(scrollPosition);
	    },

	    /**
	     * Insert items.
	     * @param {Array.<{height: ?Number, contents: String}>} items - items
	     * @param {number} index - index
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

	        if (snippet.isArray(removeItemIndexList)) {
	            snippet.forEachArray(this.items, function(item, index) {
	                if (snippet.inArray(index, removeItemIndexList) === -1) {
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
	     */
	    remove: function(index, shouldRerender) {
	        var removed;

	        if (snippet.isArray(index)) {
	            removed = this._removeItems(index);
	        } else {
	            removed = this._removeItem(index);
	        }

	        this._updateItemData();
	        shouldRerender = shouldRerender !== false;

	        if (shouldRerender && removed && (!snippet.isArray(removed) || removed.length)) {
	            this._renderContents();
	        }

	        return removed;
	    },

	    /**
	     * Clear items.
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
	     */
	    getItems: function() {
	        return this.items.slice();
	    },

	    /**
	     * Get item count.
	     * @returns {Number}
	     */
	    getItemCount: function() {
	        return this.items.length;
	    },

	    /**
	     * Get current scroll position value.
	     * @returns {Number}
	     */
	    getScrollPosition: function() {
	        return this.layout.scrollTop;
	    },

	    /**
	     * Destroy.
	     */
	    destroy: function() {
	        eventListener.off(this.layout, 'scroll', this._onScroll, this);
	        this.container.innerHTML = '';
	        this.container = null;
	    }
	});

	snippet.CustomEvents.mixin(VirtualScroll);

	module.exports = VirtualScroll;


/***/ }),
/* 1 */
/***/ (function(module, exports) {

	module.exports = __WEBPACK_EXTERNAL_MODULE_1__;

/***/ }),
/* 2 */
/***/ (function(module, exports, __webpack_require__) {

	/**
	 * @fileoverview Event listener.
	 * @author NHN. FE Development Lab <dl_javascript@nhn.com>
	 */

	'use strict';

	var snippet = __webpack_require__(1);

	var bindHandlerMap = {};

	/**
	 * Event listener.
	 * @ignore
	 */
	var eventListener = {
	    /**
	     * Add event listener for IE.
	     * @memberOf module:eventListener
	     * @param {HTMLElement} target - target element
	     * @param {string} type - event type
	     * @param {function} handler - callback function
	     * @param {?object} context - context for callback
	     * @private
	     */
	    _attachEvent: function(target, type, handler, context) {
	        var bindHandler;

	        if (context) {
	            bindHandler = snippet.bind(handler, context);
	        } else {
	            bindHandler = handler;
	        }

	        bindHandlerMap[type + handler] = bindHandler;
	        target.attachEvent('on' + type, bindHandler);
	    },

	    /**
	     * Add event listener for other browsers.
	     * @memberOf module:eventListener
	     * @param {HTMLElement} target - target element
	     * @param {string} type - event type
	     * @param {function} handler - handler
	     * @param {object} [context] - context for handler
	     * @private
	     */
	    _addEventListener: function(target, type, handler, context) {
	        var bindHandler;

	        if (context) {
	            bindHandler = snippet.bind(handler, context);
	        } else {
	            bindHandler = handler;
	        }

	        bindHandlerMap[type + handler] = bindHandler;
	        target.addEventListener(type, bindHandler);
	    },

	    /**
	     * Bind DOM event.
	     * @memberOf module:eventListener
	     * @param {HTMLElement} target - target element
	     * @param {string} type - event type
	     * @param {function} handler handler function
	     * @param {object} [context] - context for handler
	     * @private
	     */
	    _bindEvent: function(target, type, handler, context) {
	        var bindEvent;

	        if ('addEventListener' in target) {
	            bindEvent = this._addEventListener;
	        } else if ('attachEvent' in target) {
	            bindEvent = this._attachEvent;
	        }
	        eventListener._bindEvent = bindEvent;

	        bindEvent(target, type, handler, context);
	    },

	    /**
	     * Bind DOM events.
	     * @memberOf module:eventListener
	     * @param {HTMLElement} target - target element
	     * @param {string | object} types - type or map of type and handler
	     * @param {function | object} [handler] - handler or context
	     * @param {object} [context] - context
	     */
	    on: function(target, types, handler, context) {
	        var handlerMap = {};
	        if (snippet.isString(types)) {
	            handlerMap[types] = handler;
	        } else {
	            handlerMap = types;
	            context = handler;
	        }

	        snippet.forEach(handlerMap, function(_handler, type) {
	            eventListener._bindEvent(target, type, _handler, context);
	        });
	    },

	    /**
	     * Remove event listener for IE.
	     * @memberOf module:eventListener
	     * @param {HTMLElement} target - target element
	     * @param {string} type - event type
	     * @param {function} handler - handler
	     * @private
	     */
	    _detachEvent: function(target, type, handler) {
	        if (bindHandlerMap[type + handler]) {
	            target.detachEvent('on' + type, bindHandlerMap[type + handler]);
	            delete bindHandlerMap[type + handler];
	        }
	    },

	    /**
	     * Add event listener for other browsers.
	     * @memberOf module:eventListener
	     * @param {HTMLElement} target - target element
	     * @param {string} type - event type
	     * @param {function} handler - handler
	     * @private
	     */
	    _removeEventListener: function(target, type, handler) {
	        target.removeEventListener(type, bindHandlerMap[type + handler]);
	        delete bindHandlerMap[type + handler];
	    },

	    /**
	     * Unbind DOM event.
	     * @memberOf module:eventListener
	     * @param {HTMLElement} target - target element
	     * @param {string} type - event type
	     * @param {function} handler - handler
	     * @private
	     */
	    _unbindEvent: function(target, type, handler) {
	        var unbindEvent;
	        if ('removeEventListener' in target) {
	            unbindEvent = eventListener._removeEventListener;
	        } else if ('detachEvent' in target) {
	            unbindEvent = eventListener._detachEvent;
	        }
	        eventListener._unbindEvent = unbindEvent;

	        unbindEvent(target, type, handler);
	    },

	    /**
	     * Unbind DOM events.
	     * @memberOf module:eventListener
	     * @param {HTMLElement} target - target element
	     * @param {string | object} types - type or map of type and handler
	     * @param {function} [handler] - handler
	     */
	    off: function(target, types, handler) {
	        var handlerMap = {};
	        if (snippet.isString(types)) {
	            handlerMap[types] = handler;
	        } else {
	            handlerMap = types;
	        }

	        snippet.forEach(handlerMap, function(_handler, type) {
	            eventListener._unbindEvent(target, type, _handler);
	        });
	    }
	};

	module.exports = eventListener;


/***/ })
/******/ ])
});
;