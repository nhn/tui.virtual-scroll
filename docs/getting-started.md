### Installation

Include js manually when using `bower`.

```html
<script src="tui-code-snippet.js"></script>
<script src="tui-virtual-scroll.js"></script>
```

### Create Virtual Scroll Component.
```html
<!-- ... -->
<body>
<!-- ... -->
<div id="virtual-scroll-container"></div>
<!-- ... include js ... -->
<script>
var virutalScroll = new tui.VirtualScroll('virtual-scroll-container', {
    scrollPosition: 100,
    itemHeight: 150, // default item height (default value : 50)
    layoutHeight: 500,
    spareItemCount: 4, // count of spare items for display items (default value: 5)
    threshold: 400, // pixel height from edge(start, end) of content for determining need emit scrollTop, scrollBottom event
    items: [
        {height: 100, contents: '<div>Item A</div>'},
        {height: 120, contents: '<div>Item B</div>'},
        {height: 110, contents: '<div>Item C</div>'},
    ]]
});
</script>
</body>
<!-- ... -->
```
