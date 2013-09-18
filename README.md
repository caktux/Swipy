Swipy.js
========

Forward / back swiping for your iOS web app and responsive website


### The recipe ###

* [Modernizr](http://modernizr.com/download/#-applicationcache-inputtypes-touch-shiv-mq-cssclasses-teststyles-prefixes-load)
* [jquery.transit](http://ricostacruz.com/jquery.transit/)
* [Hammer.js](https://github.com/EightMedia/hammer.js)
* [Waypoints.js](https://github.com/Skookum/waypoints) (not the one for scrolling)
* [FontAwesome](http://fortawesome.github.io/Font-Awesome/)


### Installation ###

1. The first ingredient is Modernizr with yepnope. If you already have it included then you're covered. You need <code>touch</code> and <code>load</code>. Otherwise include <code>lib/modernizr.custom.js</code>

  ```
  <script type="text/javascript" src="/scripts/swipy/lib/modernizr.custom.js"></script>
  ```

2. Include Swipy.js

  ```
  <script type="text/javascript" src="/scripts/swipy/swipy.min.js"></script>
  ```

3. Swipe away

  ```
    Swipy.swipe({
      master: 'html',
      page: 'body',
      path: {
        swipylib: '/scripts/swipy/lib'
      },
      showtouches: true,
      forceshowtouches: true,
      debug: true
    });
  ```


### Options ###
```
Swipy.defaults = {
  master: '#wrapper',
  page: '#page',
  path: {
    swipylib: '/scripts/swipy/lib',
    css: true,
    hammer: true,
    showtouches: true,
    transit: true,
    waypoints: true,
    appcache: '/appcache.manifest'
  },
  intercept: 'a',
  ignore: 'a[rel=external], a[rel=nofollow], a[href$=".pdf"], a[id^=fancybox]',
  swipynav: true,
  showtouches: false,
  forceshowtouches: false,
  waypoints: true,
  hammer: true,
  overflowHTML: true,
  appcache: false,
  debug: false
};
```


### CSS ###

Swipy includes it's own CSS when launched, if you prefer loading it before or throwing it in your compressor go ahead. Just set <code>options.path.css</code> to <code>false</code>. You should also be able to style this as you like. Swipy includes a navigation bar that uses FontAwesome icons, make sure you add that for full awesomeness out of the box.

```
<link type="text/css" rel="stylesheet" media="all" href="/scripts/swipy/swipy.css" />
```