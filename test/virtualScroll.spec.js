'use strict';

var snippet = require('tui-code-snippet');
var VirtualScroll = require('../src/js/virtualScroll');

describe('tui.component.VirtualScroll', function() {
    var virtualScroll;

    beforeEach(function() {
        var container = document.createElement('DIV');

        document.body.appendChild(container);
        virtualScroll = new VirtualScroll(container, {});
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
            var mock = function() {
                virtualScroll._renderLayout(container);
            };

            expect(mock).toThrowError('Not exist HTML container');
        });

        it('if container is not HTML element, throw error message', function() {
            var container = 'container';
            var mock = function() {
                virtualScroll._renderLayout(container);
            };

            expect(mock).toThrowError('This container is not a HTML element');
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

    describe('_findActualStartIndex()', function() {
        it('find actual start index in itemPositionList by scrollPosition', function() {
            var itemPositionList = [{
                start: 1,
                end: 50
            }, {
                start: 51,
                end: 150
            }, {
                start: 151,
                end: 350
            }];
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
                },
                {
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
        beforeEach(function() {
            virtualScroll.layoutHeight = 300;
            virtualScroll.spareItemCount = 1;
            virtualScroll.itemHeightList = [50, 100, 100, 100, 100, 100, 80];
            virtualScroll.itemPositionList = [
                {
                    start: 0,
                    end: 50
                },
                {
                    start: 50,
                    end: 150
                },
                {
                    start: 150,
                    end: 250
                },
                {
                    start: 250,
                    end: 350
                },
                {
                    start: 350,
                    end: 450
                },
                {
                    start: 450,
                    end: 550
                },
                {
                    start: 550,
                    end: 600
                }
            ];
        });

        it('create index range', function() {
            var scrollPosition = 170;
            var actual = virtualScroll._createIndexRange(scrollPosition);

            expect(actual.start).toBe(1);
            expect(actual.end).toBe(6);
        });

        it('create index range, when scroll position is zero', function() {
            var scrollPosition = 0;
            var actual = virtualScroll._createIndexRange(scrollPosition);

            expect(actual.start).toBe(0);
            expect(actual.end).toBe(5);
        });

        it('create index range, when has not after spare', function() {
            var scrollPosition = 600;
            var actual = virtualScroll._createIndexRange(scrollPosition);

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
                {
                    height: 50,
                    contents: 'A'
                },
                {
                    height: 100,
                    contents: 'B'
                },
                {
                    height: 100,
                    contents: 'C'
                },
                {
                    height: 100,
                    contents: 'D'
                },
                {
                    height: 80,
                    contents: 'E'
                }
            ];

            actual = virtualScroll._createItemsHtml(startIndex, endIndex);
            expected =
                '<div style="width:100%;overflow-y:hidden;position:absolute;left:0px;height:100px;top:0px">B</div>' +
                '<div style="width:100%;overflow-y:hidden;position:absolute;left:0px;height:100px;top:100px">C</div>' +
                '<div style="width:100%;overflow-y:hidden;position:absolute;left:0px;height:100px;top:200px">D</div>';

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

            virtualScroll.itemHeightList = [50, 100, 100, 100, 100, 100, 80];

            actual = virtualScroll._createItemWrapperCssText(startIndex);

            expect(actual).toBe('width:100%;height:380px;margin-top:250px;position:relative;overflow-y:hidden');
        });
    });

    describe('_createItemWrapperHtml()', function() {
        it('create html for item wrapper element', function() {
            var scrollPosition = 170;
            var actual, expected;

            virtualScroll.items = [
                {
                    height: 50,
                    contents: 'A'
                },
                {
                    height: 100,
                    contents: 'B'
                },
                {
                    height: 100,
                    contents: 'C'
                },
                {
                    height: 100,
                    contents: 'D'
                },
                {
                    height: 80,
                    contents: 'E'
                }
            ];
            virtualScroll.itemHeightList = [50, 100, 100, 100, 80];
            virtualScroll.itemPositionList = [
                {
                    start: 0,
                    end: 50
                },
                {
                    start: 50,
                    end: 150
                },
                {
                    start: 150,
                    end: 250
                },
                {
                    start: 250,
                    end: 350
                },
                {
                    start: 350,
                    end: 430
                }
            ];
            virtualScroll.spareItemCount = 1;

            actual = virtualScroll._createItemWrapperHtml(scrollPosition);
            expected = '<div style="width:100%;height:380px;margin-top:50px;position:relative;overflow-y:hidden">' +
                '<div style="width:100%;overflow-y:hidden;position:absolute;left:0px;height:100px;top:0px">B</div>' +
                '<div style="width:100%;overflow-y:hidden;position:absolute;left:0px;height:100px;top:100px">C</div>' +
                '<div style="width:100%;overflow-y:hidden;position:absolute;left:0px;height:100px;top:200px">D</div>' +
                '<div style="width:100%;overflow-y:hidden;position:absolute;left:0px;height:80px;top:300px">E</div>' +
                '</div>';

            expect(actual).toBe(expected);
        });
    });

    describe('_correctItems()', function() {
        it('correct items, when item of items is string type', function() {
            var items = ['A', 'B'];
            var actual;

            virtualScroll.itemHeight = 100;

            actual = virtualScroll._correctItems(items);

            expect(actual[0]).toEqual({
                height: 100,
                contents: 'A'
            });
            expect(actual[1]).toEqual({
                height: 100,
                contents: 'B'
            });
        });

        it('correct items, when item of items has not height', function() {
            var items = [{
                contents: 'A'
            }];
            var actual;

            virtualScroll.itemHeight = 100;

            actual = virtualScroll._correctItems(items);

            expect(actual[0]).toEqual({
                height: 100,
                contents: 'A'
            });
        });

        it('correct items, when item of items is null or undefined', function() {
            var foo;
            var items = [null, foo];
            var actual;

            virtualScroll.itemHeight = 100;

            actual = virtualScroll._correctItems(items);

            expect(actual.length).toBe(0);
        });
    });

    describe('_insertItems()', function() {
        it('insert items, when start index is zero', function() {
            var items = ['C', 'D'];

            virtualScroll.items = [
                {
                    height: 100,
                    contents: 'A'
                },
                {
                    height: 100,
                    contents: 'B'
                }
            ];
            virtualScroll.itemHeight = 100;
            virtualScroll._insertItems(items, 0);

            expect(virtualScroll.items).toEqual([
                {
                    height: 100,
                    contents: 'C'
                },
                {
                    height: 100,
                    contents: 'D'
                },
                {
                    height: 100,
                    contents: 'A'
                },
                {
                    height: 100,
                    contents: 'B'
                }
            ]);
        });

        it('insert items, when start index is 1', function() {
            var items = ['C', 'D'];

            virtualScroll.items = [
                {
                    height: 100,
                    contents: 'A'
                },
                {
                    height: 100,
                    contents: 'B'
                }
            ];
            virtualScroll.itemHeight = 100;
            virtualScroll._insertItems(items, 1);

            expect(virtualScroll.items).toEqual([
                {
                    height: 100,
                    contents: 'A'
                },
                {
                    height: 100,
                    contents: 'C'
                },
                {
                    height: 100,
                    contents: 'D'
                },
                {
                    height: 100,
                    contents: 'B'
                }
            ]);
        });

        it('insert items, when start index is 2', function() {
            var items = ['C', 'D'];

            virtualScroll.items = [
                {
                    height: 100,
                    contents: 'A'
                },
                {
                    height: 100,
                    contents: 'B'
                }
            ];
            virtualScroll.itemHeight = 100;
            virtualScroll._insertItems(items, 2);

            expect(virtualScroll.items).toEqual([
                {
                    height: 100,
                    contents: 'A'
                },
                {
                    height: 100,
                    contents: 'B'
                },
                {
                    height: 100,
                    contents: 'C'
                },
                {
                    height: 100,
                    contents: 'D'
                }
            ]);
        });
    });

    describe('append()', function() {
        it('append items', function() {
            var wrapperElement;

            virtualScroll.items = [
                {
                    height: 100,
                    contents: 'A'
                },
                {
                    height: 100,
                    contents: 'B'
                }
            ];

            virtualScroll.append([
                {
                    height: 100,
                    contents: 'C'
                },
                {
                    height: 100,
                    contents: 'D'
                }
            ]);

            wrapperElement = virtualScroll.layout.firstChild;

            expect(virtualScroll.items).toEqual([
                {
                    height: 100,
                    contents: 'A'
                },
                {
                    height: 100,
                    contents: 'B'
                },
                {
                    height: 100,
                    contents: 'C'
                },
                {
                    height: 100,
                    contents: 'D'
                }
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

            virtualScroll.items = [
                {
                    height: 100,
                    contents: 'A'
                },
                {
                    height: 100,
                    contents: 'B'
                }
            ];

            virtualScroll.prepend([
                {
                    height: 100,
                    contents: 'C'
                },
                {
                    height: 100,
                    contents: 'D'
                }
            ]);

            wrapperElement = virtualScroll.layout.firstChild;

            expect(virtualScroll.items).toEqual([
                {
                    height: 100,
                    contents: 'C'
                },
                {
                    height: 100,
                    contents: 'D'
                },
                {
                    height: 100,
                    contents: 'A'
                },
                {
                    height: 100,
                    contents: 'B'
                }
            ]);
            expect(wrapperElement.childNodes.length).toBe(4);
            expect(wrapperElement.childNodes[0].innerHTML).toBe('C');
            expect(wrapperElement.childNodes[1].innerHTML).toBe('D');
            expect(wrapperElement.childNodes[2].innerHTML).toBe('A');
            expect(wrapperElement.childNodes[3].innerHTML).toBe('B');
        });
    });

    describe('insert()', function() {
        it('insert items', function() {
            var wrapperElement;

            virtualScroll.items = [
                {
                    height: 100,
                    contents: 'A'
                },
                {
                    height: 100,
                    contents: 'B'
                }
            ];

            virtualScroll.insert([
                {
                    height: 100,
                    contents: 'C'
                },
                {
                    height: 100,
                    contents: 'D'
                }
            ], 1);

            wrapperElement = virtualScroll.layout.firstChild;

            expect(virtualScroll.items).toEqual([
                {
                    height: 100,
                    contents: 'A'
                },
                {
                    height: 100,
                    contents: 'C'
                },
                {
                    height: 100,
                    contents: 'D'
                },
                {
                    height: 100,
                    contents: 'B'
                }
            ]);
            expect(wrapperElement.childNodes.length).toBe(4);
            expect(wrapperElement.childNodes[0].innerHTML).toBe('A');
            expect(wrapperElement.childNodes[1].innerHTML).toBe('C');
            expect(wrapperElement.childNodes[2].innerHTML).toBe('D');
            expect(wrapperElement.childNodes[3].innerHTML).toBe('B');
        });
    });

    describe('_removeItem()', function() {
        beforeEach(function() {
            virtualScroll.append([
                {
                    height: 100,
                    contents: 'A'
                },
                {
                    height: 100,
                    contents: 'B'
                },
                {
                    height: 100,
                    contents: 'C'
                },
                {
                    height: 100,
                    contents: 'D'
                }
            ]);
        });

        it('remove item', function() {
            virtualScroll._removeItem(1);

            expect(virtualScroll.items).toEqual([
                {
                    height: 100,
                    contents: 'A'
                },
                {
                    height: 100,
                    contents: 'C'
                },
                {
                    height: 100,
                    contents: 'D'
                }
            ]);
        });

        it('if index is string, throw error message', function() {
            expect(function() {
                virtualScroll._removeItem('1');
            }).toThrowError('The index should be a plus number');
        });

        it('if index is minus value, throw error message', function() {
            expect(function() {
                virtualScroll._removeItem(-1);
            }).toThrowError('The index should be a plus number');
        });

        it('remove item, when shouldRerender is false', function() {
            virtualScroll._removeItem(1, false);

            expect(virtualScroll.items).toEqual([
                {
                    height: 100,
                    contents: 'A'
                },
                {
                    height: 100,
                    contents: 'C'
                },
                {
                    height: 100,
                    contents: 'D'
                }
            ]);
        });
    });

    describe('removeItems()', function() {
        it('remove items', function() {
            virtualScroll.append([
                {
                    height: 100,
                    contents: 'A'
                },
                {
                    height: 100,
                    contents: 'B'
                },
                {
                    height: 100,
                    contents: 'C'
                },
                {
                    height: 100,
                    contents: 'D'
                }
            ]);

            virtualScroll._removeItems([1, 3]);

            expect(virtualScroll.items).toEqual([
                {
                    height: 100,
                    contents: 'A'
                },
                {
                    height: 100,
                    contents: 'C'
                }
            ]);
        });
    });

    describe('remove()', function() {
        beforeEach(function() {
            virtualScroll.append([
                {
                    height: 100,
                    contents: 'A'
                },
                {
                    height: 100,
                    contents: 'B'
                },
                {
                    height: 100,
                    contents: 'C'
                },
                {
                    height: 100,
                    contents: 'D'
                }
            ]);
        });

        it('remove items, when index is array type', function() {
            var actual, wrapperElement;

            actual = virtualScroll.remove([1, 3]);
            wrapperElement = virtualScroll.layout.firstChild;

            expect(actual).toEqual([
                {
                    height: 100,
                    contents: 'B'
                },
                {
                    height: 100,
                    contents: 'D'
                }
            ]);
            expect(virtualScroll.items).toEqual([
                {
                    height: 100,
                    contents: 'A'
                },
                {
                    height: 100,
                    contents: 'C'
                }
            ]);

            expect(wrapperElement.childNodes.length).toBe(2);
            expect(wrapperElement.childNodes[0].innerHTML).toBe('A');
            expect(wrapperElement.childNodes[1].innerHTML).toBe('C');
        });

        it('remove item, when index is not array', function() {
            var actual, wrapperElement;

            actual = virtualScroll.remove(1);
            wrapperElement = virtualScroll.layout.firstChild;

            expect(actual).toEqual({
                height: 100,
                contents: 'B'
            });
            expect(virtualScroll.items).toEqual([
                {
                    height: 100,
                    contents: 'A'
                },
                {
                    height: 100,
                    contents: 'C'
                },
                {
                    height: 100,
                    contents: 'D'
                }
            ]);
            expect(wrapperElement.childNodes.length).toBe(3);
            expect(wrapperElement.childNodes[0].innerHTML).toBe('A');
            expect(wrapperElement.childNodes[1].innerHTML).toBe('C');
            expect(wrapperElement.childNodes[2].innerHTML).toBe('D');
        });
    });

    describe('clear()', function() {
        it('clear items', function() {
            var wrapperElement;

            virtualScroll.append([
                {
                    height: 100,
                    contents: 'A'
                },
                {
                    height: 100,
                    contents: 'B'
                }
            ]);

            wrapperElement = virtualScroll.layout.firstChild;
            expect(virtualScroll.items).toEqual([
                {
                    height: 100,
                    contents: 'A'
                },
                {
                    height: 100,
                    contents: 'B'
                }
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
        it('if scroll position value is not plus number, throw error message', function() {
            var scrollPosition = 'abc';

            expect(function() {
                virtualScroll.moveScroll(scrollPosition);
            }).toThrowError('The scroll position value should be a plus number');
        });
    });

    describe('resizeHeight()', function() {
        it('resize height', function() {
            var height = 700;

            virtualScroll.resizeHeight(height);

            expect(virtualScroll.layoutHeight).toBe(700);
            expect(virtualScroll.layout.style.height).toBe('700px');
        });
    });
    describe('usageStatistics', function() {
        beforeEach(function() {
            this.virtualScroll = null;
            spyOn(snippet, 'imagePing');
        });

        it('should send hostname by default', function() {
            this.virtualScroll = new VirtualScroll(document.createElement('div'));

            expect(snippet.imagePing).toHaveBeenCalled();
        });

        it('should not send hostname on usageStatistics option false', function() {
            this.virtualScroll = new VirtualScroll(document.createElement('div'), {usageStatistics: false});

            expect(snippet.imagePing).not.toHaveBeenCalled();
        });
    });
});
