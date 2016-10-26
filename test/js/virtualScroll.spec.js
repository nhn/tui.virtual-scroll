'use strict';

describe('tui.component.VirtualScroll', function() {
    var virtualScroll;

    beforeEach(function() {
        var container = document.createElement('DIV');

        document.body.appendChild(container);
        virtualScroll = new tui.component.VirtualScroll(container, {});
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
        });
    });

    describe('_makeItemPositionList()', function() {
        it('make item position list', function() {
            var itemHeights = [50, 100, 200];
            var actual = virtualScroll._makeItemPositionList(itemHeights);

            expect(actual.length).toBe(3);
            expect(actual[0]).toEqual({
                start: 0,
                end: 50
            });
            expect(actual[1]).toEqual({
                start: 50,
                end: 150
            });
            expect(actual[2]).toEqual({
                start: 150,
                end: 350
            });
        });
    });

    describe('_findActualStartIndex()', function() {
        it('find actual start index in itemPositionList by scrollPosition', function() {
            var itemPositionList = [
                {
                    start: 1,
                    end: 50
                }, {
                    start: 51,
                    end: 150
                }, {
                    start: 151,
                    end: 350
                }
            ];
            var scrollPosition = 75;
            var actual = virtualScroll._findActualStartIndex(itemPositionList, scrollPosition);

            expect(actual).toBe(1);
        });

        it('find actual start index in itemPositionList by scrollPosition,' +
            ' when scrollPosition is greater max position of itemPositionList', function() {
            var itemPositionList = [
                {
                    start: 1,
                    end: 50
                }, {
                    start: 51,
                    end: 150
                }, {
                    start: 151,
                    end: 350
                }
            ];
            var scrollPosition = 400;
            var actual = virtualScroll._findActualStartIndex(itemPositionList, scrollPosition);

            expect(actual).toBe(2);
        });

        it('find actual start index in itemPositionList by scrollPosition,' +
            ' when itemPositionList is empty array', function() {
            var itemPositionList = [];
            var scrollPosition = 75;
            var actual = virtualScroll._findActualStartIndex(itemPositionList, scrollPosition);

            expect(actual).toBe(null);
        });
    });

    describe('_calculateDisplayCount()', function() {
        it('calculate display count', function() {
            var displayItemHeights = [50, 100, 100, 100, 100, 100, 80];
            var actual;

            virtualScroll.layoutHeight = 300;

            actual = virtualScroll._calculateDisplayCount(displayItemHeights);

            expect(actual).toBe(4);
        });
    });

    describe('_createIndexRange()', function() {
        it('create index range', function() {
            var scrollPosition = 170;
            var actual;

            virtualScroll.layoutHeight = 300;
            virtualScroll.itemHeights = [50, 100, 100, 100, 100, 100, 80];
            virtualScroll.spareItemCount = 1;

            actual = virtualScroll._createIndexRange(scrollPosition);

            expect(actual.start).toBe(1);
            expect(actual.end).toBe(6);
        });

        it('create index range, when scroll position is zero', function() {
            var scrollPosition = 0;
            var actual;

            virtualScroll.layoutHeight = 300;
            virtualScroll.itemHeights = [50, 100, 100, 100, 100, 100, 80];
            virtualScroll.spareItemCount = 1;

            actual = virtualScroll._createIndexRange(scrollPosition);

            expect(actual.start).toBe(0);
            expect(actual.end).toBe(5);
        });

        it('create index range, when has not after spare', function() {
            var scrollPosition = 600;
            var actual;

            virtualScroll.layoutHeight = 300;
            virtualScroll.itemHeights = [50, 100, 100, 100, 100, 100, 80];
            virtualScroll.spareItemCount = 1;

            actual = virtualScroll._createIndexRange(scrollPosition);

            expect(actual.start).toBe(5);
            expect(actual.end).toBe(7);
        });
    });

    describe('_createItemsHtml()', function() {
        it('create items html', function() {
            var startIndex = 1;
            var endIndex = 4;
            var actual, expected;

            virtualScroll.items = [
                {height: 50, contents: 'A'},
                {height: 100, contents: 'B'},
                {height: 100, contents: 'C'},
                {height: 100, contents: 'D'},
                {height: 80, contents: 'E'}
            ];

            actual = virtualScroll._createItemsHtml(startIndex, endIndex);
            expected = '<div style="width:100%;overflow-y:hidden;height:100px">B</div>' +
                '<div style="width:100%;overflow-y:hidden;height:100px">C</div>' +
                '<div style="width:100%;overflow-y:hidden;height:100px">D</div>';

            expect(actual).toBe(expected);
        });
    });

    describe('_sum()', function() {
        it('sum values', function() {
            var values = [10, 20, 30];
            var actual = virtualScroll._sum(values);

            expect(actual).toBe(60);
        });
    });

    describe('_createItemWrapperCssText()', function() {
        it('create cssText for item wrapper element', function() {
            var startIndex = 3;
            var actual;

            virtualScroll.itemHeights = [50, 100, 100, 100, 100, 100, 80];

            actual = virtualScroll._createItemWrapperCssText(startIndex);

            expect(actual).toBe('width:100%;height:380px;margin-top:250px;overflow-y:hidden');
        });
    });

    describe('_createItemWrapperHtml()', function() {
        it('create html for item wrapper element', function() {
            var scrollPosition = 170;
            var actual, expected;

            virtualScroll.items = [
                {height: 50, contents: 'A'},
                {height: 100, contents: 'B'},
                {height: 100, contents: 'C'},
                {height: 100, contents: 'D'},
                {height: 80, contents: 'E'}
            ];
            virtualScroll.itemHeights = [50, 100, 100, 100, 80];
            virtualScroll.spareItemCount = 1;

            actual = virtualScroll._createItemWrapperHtml(scrollPosition);
            expected = '<div style="width:100%;height:380px;margin-top:50px;overflow-y:hidden">' +
                    '<div style="width:100%;overflow-y:hidden;height:100px">B</div>' +
                    '<div style="width:100%;overflow-y:hidden;height:100px">C</div>' +
                    '<div style="width:100%;overflow-y:hidden;height:100px">D</div>' +
                    '<div style="width:100%;overflow-y:hidden;height:80px">E</div>' +
                '</div>';

            expect(actual).toBe(expected);
        });
    });

    describe('append()', function() {
        it('append items', function() {
            var wrapperElement;

            virtualScroll.append([
                {height: 100, contents: 'A'},
                {height: 100, contents: 'B'}
            ]);
            virtualScroll.append([
                {height: 100, contents: 'C'},
                {height: 100, contents: 'D'}
            ]);

            wrapperElement = virtualScroll.layout.firstChild;

            expect(virtualScroll.items).toEqual([
                {height: 100, contents: 'A'},
                {height: 100, contents: 'B'},
                {height: 100, contents: 'C'},
                {height: 100, contents: 'D'}
            ]);
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

            virtualScroll.prepend([
                {height: 100, contents: 'A'},
                {height: 100, contents: 'B'}
            ]);
            virtualScroll.prepend([
                {height: 100, contents: 'C'},
                {height: 100, contents: 'D'}
            ]);

            wrapperElement = virtualScroll.layout.firstChild;

            expect(virtualScroll.items).toEqual([
                {height: 100, contents: 'C'},
                {height: 100, contents: 'D'},
                {height: 100, contents: 'A'},
                {height: 100, contents: 'B'}
            ]);
            expect(wrapperElement.childNodes.length).toBe(4);
            expect(wrapperElement.childNodes[0].innerHTML).toBe('C');
            expect(wrapperElement.childNodes[1].innerHTML).toBe('D');
            expect(wrapperElement.childNodes[2].innerHTML).toBe('A');
            expect(wrapperElement.childNodes[3].innerHTML).toBe('B');
        });
    });

    describe('removeItem()', function() {
        it('remove item', function() {
            var wrapperElement;

            virtualScroll.append([
                {height: 100, contents: 'A'},
                {height: 100, contents: 'B'},
                {height: 100, contents: 'C'},
                {height: 100, contents: 'D'}
            ]);

            virtualScroll.removeItem(1);

            wrapperElement = virtualScroll.layout.firstChild;

            expect(virtualScroll.items).toEqual([
                {height: 100, contents: 'A'},
                {height: 100, contents: 'C'},
                {height: 100, contents: 'D'}
            ]);
            expect(wrapperElement.childNodes.length).toBe(3);
            expect(wrapperElement.childNodes[0].innerHTML).toBe('A');
            expect(wrapperElement.childNodes[1].innerHTML).toBe('C');
            expect(wrapperElement.childNodes[2].innerHTML).toBe('D');
        });
    });

    describe('removeItems()', function() {
        it('remove items', function() {
            var wrapperElement;

            virtualScroll.append([
                {height: 100, contents: 'A'},
                {height: 100, contents: 'B'},
                {height: 100, contents: 'C'},
                {height: 100, contents: 'D'}
            ]);

            virtualScroll.removeItems([1, 3]);

            wrapperElement = virtualScroll.layout.firstChild;

            expect(virtualScroll.items).toEqual([
                {height: 100, contents: 'A'},
                {height: 100, contents: 'C'}
            ]);
            expect(wrapperElement.childNodes.length).toBe(2);
            expect(wrapperElement.childNodes[0].innerHTML).toBe('A');
            expect(wrapperElement.childNodes[1].innerHTML).toBe('C');
        });
    });

    describe('removeFirstItem()', function() {
        it('remove first item', function() {
            var wrapperElement;

            virtualScroll.append([
                {height: 100, contents: 'A'},
                {height: 100, contents: 'B'},
                {height: 100, contents: 'C'},
                {height: 100, contents: 'D'}
            ]);

            virtualScroll.removeFirstItem();

            wrapperElement = virtualScroll.layout.firstChild;

            expect(virtualScroll.items).toEqual([
                {height: 100, contents: 'B'},
                {height: 100, contents: 'C'},
                {height: 100, contents: 'D'}
            ]);
            expect(wrapperElement.childNodes.length).toBe(3);
            expect(wrapperElement.childNodes[0].innerHTML).toBe('B');
            expect(wrapperElement.childNodes[1].innerHTML).toBe('C');
            expect(wrapperElement.childNodes[2].innerHTML).toBe('D');
        });
    });

    describe('removeLastItem()', function() {
        it('remove item', function() {
            var wrapperElement;

            virtualScroll.append([
                {height: 100, contents: 'A'},
                {height: 100, contents: 'B'},
                {height: 100, contents: 'C'},
                {height: 100, contents: 'D'}
            ]);

            virtualScroll.removeLastItem();

            wrapperElement = virtualScroll.layout.firstChild;

            expect(virtualScroll.items).toEqual([
                {height: 100, contents: 'A'},
                {height: 100, contents: 'B'},
                {height: 100, contents: 'C'}
            ]);
            expect(wrapperElement.childNodes.length).toBe(3);
            expect(wrapperElement.childNodes[0].innerHTML).toBe('A');
            expect(wrapperElement.childNodes[1].innerHTML).toBe('B');
            expect(wrapperElement.childNodes[2].innerHTML).toBe('C');
        });
    });

    describe('clear()', function() {
        it('clear items', function() {
            var wrapperElement;

            virtualScroll.append([
                {height: 100, contents: 'A'},
                {height: 100, contents: 'B'}
            ]);

            wrapperElement = virtualScroll.layout.firstChild;
            expect(virtualScroll.items).toEqual([
                {height: 100, contents: 'A'},
                {height: 100, contents: 'B'}
            ]);
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
