Swipy.js
========

Forward / back swiping, smooth CSS3 transitions and even iOS 7 style parallax for your iOS web app and responsive website.

<img align="right" src="/lib/swipy.png" />

**Demo:** Add caktux.ca to your Home screen.

### The recipe

* ![Modernizr](http://modernizr.com/download/#-applicationcache-inputtypes-touch-shiv-mq-cssclasses-teststyles-prefixes-load)
* ![jquery.transit](http://ricostacruz.com/jquery.transit/)
* ![Hammer.js](https://github.com/EightMedia/hammer.js)
* ![FastClick](https://github.com/ftlabs/fastclick)
* ![Waypoints.js](https://github.com/Skookum/waypoints) (not the one for scrolling)
* ![FontAwesome](http://fortawesome.github.io/Font-Awesome/) (see [Fonts](#fonts) section below)


### Installation

Before anything else, you need the meta tag.
```html
<meta name="apple-mobile-web-app-capable" content="yes" />
```

Now we can start.

1. The first ingredient is Modernizr with yepnope. If you already have it included then you're covered. You need `touch` and `load`. Otherwise include `lib/modernizr.custom.js`

  ```html
  <script type="text/javascript" src="/scripts/swipy/lib/modernizr.custom.js"></script>
  ```

2. Include Swipy.js

  ```html
  <script type="text/javascript" src="/scripts/swipy/swipy.min.js"></script>
  ```

3. Swipe away

  ```javascript
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


## Options

```javascript
Swipy.defaults = {
  master: 'html',
  page: 'body',
  path: {
    swipylib: '/scripts/swipy/lib',
    css: true, // or ex.: '/scripts/swipy/lib/swipy.css',
    fastclick: true,
    hammer: true,
    showtouches: true,
    transit: true,
    waypoints: true,
    appcache: '/appcache.manifest'
  },
  animate: true, // page animations on internal clicks
  animate_onload: true, // page animations on load
  speed: 200, // speed of animations
  scale: 0.85, // scale of page during dragging
  drag_timeout: 3000, // in ms, cancels page switch if drag is more than that
  drag_distance: 0.5, // drag at least half the width of master to trigger page switch
  drag_min_distance: 20, // in px, Hammer.js option to trigger drag
  drag_min_deltaTime: 20, // in ms, cancels page switch if drag is less than that
  edge_buffer: 10, // in px, drag doesn't kick in before drag_min_distance of the edge so we need a "grab" buffer (could be drag_min_distance * 2)
  intercept: 'a', // web app mode only, we need all links and then exclude a lot
  ignore: 'a[rel=external], a[rel=nofollow], a[href$=".pdf"], a[id^=fancybox]', // example exclude list, needs updating because of iOS 7
  swipynav: true,
  swiypynav_prependto: 'body',
  showtouches: false, // desktop demo
  forceshowtouches: false,
  overflowHTML: false,
  velocity: false, // experimental
  velocity_trigger: 0.65,
  webkitsticky: false, // experimental
  appcache: false, // experimental
  parallax: false, // experimental
  parallax_distance: 150,
  parallax_offset: 50, // in px, set this to how much overflow you have
  parallax_smoothing: .1, // low pass filter, still funky, should be above 10 or something, not .1... timestamps?
  parallax_throttle: 0, // in ms, replaced by filter
  debug: false, // pardon this vichyssoise of verbiage that veers most verbose
  debug_parallax: false
};
```

## CSS

Swipy includes it's own CSS when launched, if you prefer loading it before or throwing it in your compressor go ahead. Just set `options.path.css` to `false`. You should also be able to style this as you like.

```html
<link type="text/css" rel="stylesheet" media="all" href="/scripts/swipy/lib/swipy.css" />
```

<a name="fonts" />
## Fonts
Swipy includes a navigation bar that uses FontAwesome icons, make sure you add that for full awesomeness out of the box. Otherwise just include `lib/fontello/css/swipy.css` and `lib/fontello/css/animation.css` which contain the necessary font icons, thanks to [Fontello](http://fontello.com/).

```html
<link type="text/css" rel="stylesheet" media="all" href="/scripts/swipy/lib/fontello/css/swipy.css" />
<link type="text/css" rel="stylesheet" media="all" href="/scripts/swipy/lib/fontello/css/animation.css" />
```

## Drupal installation tips

1. Install Swipy in your `sites/all/libraries` folder. Libraries module needed.

2. Add this to your `THEME_preprocess_page`

  ```php
    $path = libraries_get_path('swipy');

    $swipy = array(
      $path . '/lib/modernizr.custom.js',
      $path . '/lib/jquery.transit.js', // I recommend you load transit.js from here or directly in your theme
      $path . '/swipy.js',
    );

    foreach ($swipy as $path) {
      drupal_add_js($path, 'theme', 'header');
    }

    drupal_add_css($path . '/lib/swipy.css');
  ```

  And a very important part if you don't already have something like this:

  ```php
    drupal_add_js(array('themePath' => path_to_theme()), 'setting');
  ```

3. Load Swipy from your favorite `Drupal.behaviors` function

  ```javascript
    var swipy = Swipy.swipe({
      master: 'html',
      page: '#wrapper',
      path: {
        swipylib: Drupal.settings.basePath + '/sites/all/libraries/swipy/lib',
        transit: false,
        css: false
      },
      swipynav_prependto: 'body',
      intercept: 'a',
      ignore: '\
        a.external,\
        a.imagecache-imagelink,\
        a[rel=external],\
        a[rel=blank],\
        a[rel=nofollow]:not(".block-uc_cart a[rel=nofollow], .date-nav a[rel=nofollow], .calendar a[rel=nofollow]"),\
        a[href$=".pdf"],\
        a[href$=".jpg"]:not(".imagecache-imagelink"),\
        a[href$=".png"]:not(".imagecache-imagelink"),\
        #mobile-sidebar-title,\
        a[id^=fancybox]',
      parallax: true
      // debug: true,
      // debug_parallax: true,
      // showtouches: false,
      // forceshowtouches: false,
    });
  ```
