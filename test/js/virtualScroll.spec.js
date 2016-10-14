'use strict';

describe('tui.component.VirtualScroll', function() {
    var virtualScroll;

    beforeEach(function() {
        var container = document.createElement('DIV');

        document.body.appendChild(container);
        virtualScroll = new tui.component.VirtualScroll(container, {});
    });

    describe('_updateIndexRange()', function() {
        it('update index range', function() {
            var scrollPosition = 120;

            virtualScroll.items = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
            virtualScroll.itemHeight = 50;
            virtualScroll.spareItemCount = 1;
            virtualScroll.displayCount = 3;

            virtualScroll._updateIndexRange(scrollPosition);

            expect(virtualScroll.startIndex).toBe(1);
            expect(virtualScroll.endIndex).toBe(6);
        });

        it('update index range, when scroll position is zero', function() {
            var scrollPosition = 0;

            virtualScroll.items = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
            virtualScroll.itemHeight = 50;
            virtualScroll.spareItemCount = 1;
            virtualScroll.displayCount = 3;

            virtualScroll._updateIndexRange(scrollPosition);

            expect(virtualScroll.startIndex).toBe(0);
            expect(virtualScroll.endIndex).toBe(4);
        });

        it('update index range, when has not after spare', function() {
            var scrollPosition = 320;

            virtualScroll.items = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
            virtualScroll.itemHeight = 50;
            virtualScroll.spareItemCount = 1;
            virtualScroll.displayCount = 3;

            virtualScroll._updateIndexRange(scrollPosition);

            expect(virtualScroll.startIndex).toBe(5);
            expect(virtualScroll.endIndex).toBe(7);
        });
    });

    describe('_setDisplayCount()', function() {
        it('set display count, when has displayCount option', function() {
            var displayCount = 20;

            virtualScroll._setDisplayCount(displayCount);

            expect(virtualScroll.displayCount).toBe(20);
        });

        it('set display count, when has not displayCount option and has layoutHeight option', function() {
            var displayCount;
            var layoutHeight = 300;

            virtualScroll.itemHeight = 50;
            virtualScroll._setDisplayCount(displayCount, layoutHeight);

            expect(virtualScroll.displayCount).toBe(6);
        });

        it('set display count, when has not both displayCount option and layoutHeight option', function() {
            var displayCount, layoutHeight;

            virtualScroll._setDisplayCount(displayCount, layoutHeight);

            expect(virtualScroll.displayCount).toBe(10);
        });
    });

    describe('_renderLayout()', function() {
        it('if container is not exist, throw error message', function() {
            var container;

            expect(function() {
                virtualScroll._renderLayout(container);
            }).toThrowError('Not exist HTML container');
        });

        it('if container is not HTML element, throw error message', function() {
            var container = 'container';

            expect(function() {
                virtualScroll._renderLayout(container);
            }).toThrowError('This container is not a HTML element');
        });

        it('render layout', function() {
            var container = document.createElement('DIV');
            var actual;

            virtualScroll.layoutHeight = 700;
            actual = virtualScroll._renderLayout(container);

            expect(actual).toBe(container.firstChild);
            expect(actual.style.width).toBe('100%');
            expect(actual.style.height).toBe('700px');
            expect(actual.style['overflow-y']).toBe('auto');
        });
    });

    describe('_createCssText()', function() {
        it('create cssText by css map', function() {
            var cssMap = {
                height: 600,
                'margin-top': 100,
                overflow: 'hidden'
            };
            var actual = virtualScroll._createCssText(cssMap);

            expect(actual).toBe('height:600px;margin-top:100px;overflow:hidden');
        });
    });

    describe('_createDivHtml()', function() {
        it('create div html', function() {
            var attrMap = {
                'class': 'className',
                style: 'height:500px'
            };
            var innerHtml = 'inner html';
            var actual = virtualScroll._createDivHtml(attrMap, innerHtml);

            expect(actual).toBe('<div class="className" style="height:500px">inner html</div>');
        });
    });

    describe('_createItemsHtml()', function() {
        it('create items html', function() {
            var actual, expected;

            virtualScroll.items = ['A', 'B', 'C', 'D', 'E'];
            virtualScroll.itemHeight = 50;
            virtualScroll.startIndex = 1;
            virtualScroll.endIndex = 4;

            actual = virtualScroll._createItemsHtml();
            expected = '<div style="width:100%;height:50px;overflow:hidden">B</div>' +
                '<div style="width:100%;height:50px;overflow:hidden">C</div>' +
                '<div style="width:100%;height:50px;overflow:hidden">D</div>';

            expect(actual).toBe(expected);
        });
    });

    describe('_createItemWrapperCssText()', function() {
        it('create cssText for item wrapper element', function() {
            var itemCount = 20;
            var actual;

            virtualScroll.itemHeight = 50;
            virtualScroll.startIndex = 5;
            virtualScroll.endIndex = 15;

            actual = virtualScroll._createItemWrapperCssText(itemCount);

            expect(actual).toBe('width:100%;height:750px;margin-top:250px;overflow-y:hidden');
        });
    });

    describe('_createItemWrapperHtml()', function() {
        it('create html for item wrapper element', function() {
            var actual, expected;

            virtualScroll.items = ['A', 'B', 'C', 'D', 'E'];
            virtualScroll.itemHeight = 50;
            virtualScroll.startIndex = 1;
            virtualScroll.endIndex = 4;

            actual = virtualScroll._createItemWrapperHtml();
            expected = '<div style="width:100%;height:200px;margin-top:50px;overflow-y:hidden">' +
                    '<div style="width:100%;height:50px;overflow:hidden">B</div>' +
                    '<div style="width:100%;height:50px;overflow:hidden">C</div>' +
                    '<div style="width:100%;height:50px;overflow:hidden">D</div>' +
                '</div>';

            expect(actual).toBe(expected);
        });
    });

    describe('append()', function() {
        it('append items', function() {
            var wrapperElement;

            virtualScroll.append(['A', 'B']);
            virtualScroll.append(['C', 'D']);

            wrapperElement = virtualScroll.layout.firstChild;
            expect(virtualScroll.items).toEqual(['A', 'B', 'C', 'D']);
            expect(wrapperElement.childNodes.length).toBe(4);
            expect(wrapperElement.childNodes[0].innerHTML).toBe('A');
            expect(wrapperElement.childNodes[1].innerHTML).toBe('B');
            expect(wrapperElement.childNodes[2].innerHTML).toBe('C');
            expect(wrapperElement.childNodes[3].innerHTML).toBe('D');
        });
    });

    describe('prepend()', function() {
        it('prepend items', function() {
            var wrapperElement;

            virtualScroll.prepend(['A', 'B']);
            virtualScroll.prepend(['C', 'D']);

            wrapperElement = virtualScroll.layout.firstChild;
            expect(virtualScroll.items).toEqual(['C', 'D', 'A', 'B']);
            expect(wrapperElement.childNodes.length).toBe(4);
            expect(wrapperElement.childNodes[0].innerHTML).toBe('C');
            expect(wrapperElement.childNodes[1].innerHTML).toBe('D');
            expect(wrapperElement.childNodes[2].innerHTML).toBe('A');
            expect(wrapperElement.childNodes[3].innerHTML).toBe('B');
        });
    });

    describe('clear()', function() {
        it('clear items', function() {
            var wrapperElement;

            virtualScroll.append(['A', 'B']);

            wrapperElement = virtualScroll.layout.firstChild;
            expect(virtualScroll.items).toEqual(['A', 'B']);
            expect(wrapperElement.childNodes.length).toBe(2);
            expect(wrapperElement.childNodes[0].innerHTML).toBe('A');
            expect(wrapperElement.childNodes[1].innerHTML).toBe('B');

            virtualScroll.clear();
            expect(virtualScroll.items.length).toBe(0);
            expect(virtualScroll.layout.innerHTML).toBe('');
        });
    });

    describe('moveScroll()', function() {
        it('if scroll position value is not number type, throw error message', function() {
            var scrollPosition = '700';

            expect(function() {
                virtualScroll.moveScroll(scrollPosition);
            }).toThrowError('The scroll position value should be a number type');
        });
    });
});
