;(function($, window, document, undefined) {
  'use strict';

var Swipy = function(options) {
  this.defaults = {
    master: '#wrapper',
    page: '#page',
    path: {
      swipylib: '/scripts/swipy/lib',
      hammer: true, // '/scripts/swipy/lib/jquery.hammer.min.js',
      showtouches: true, // '/scripts/swipy/lib/hammer.showtouches.min.js',
      transit: true, // '/scripts/swipy/lib/jquery.transit.min.js',
      waypoints: true, // '/scripts/swipy/lib/waypoints.min.js',
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
  $.extend(true, this.defaults, options);
}

Swipy.prototype = {

  swipynav: function(options) {
    var swipynav = $('\
      <div id="swipy-nav">\
        <a href="#" id="swipy-left" class="swipy-icon"><i class="icon-chevron-left"></i></a>\
        <a href="#" id="swipy-right" class="swipy-icon"><i class="icon-chevron-right"></i></a>\
        <a href="#" id="swipy-clear" class="swipy-icon"><i class="icon-remove"></i></a>\
        <a href="#" id="swipy-refresh" class="swipy-icon"><i class="icon-repeat"></i></a>\
        <span id="swipy-secure" class="swipy-icon"><i class="icon-lock"></i></span>\
      </div>').css({'padding-top': '22px'}).prependTo($('body')).show();

      $('#swipy-right').on('click', function (e) {
        e.preventDefault(); e.stopPropagation();
        $('#swipy-refresh i').addClass('icon-spin');
        window.history.forward();
      });

      $('#swipy-left').on('click', function (e) {
        e.preventDefault(); e.stopPropagation();
        window.history.back();
        $('#swipy-refresh i').addClass('icon-spin');
      });

      // $('#swipy-clear').on('click', function (e) {
      //   e.preventDefault(); e.stopPropagation();
      //   $('#swipy-refresh i').addClass('icon-spin');
      //   Waypoints.clear();
      //   window.location.reload();
      // });

      $('#swipy-refresh').on('click', function (e) {
        e.preventDefault(); e.stopPropagation();
        $('#swipy-refresh i').addClass('icon-spin');
        window.location.reload();
      });

      if (window.location.protocol == 'https:') {
        $('#swipy-secure i').css({
          color: '#fff',
          'text-shadow': '0 0 5px #fff'
        });
      }

    return swipynav;
  },

  waypoints: function(options) {
    Waypoints
      // .clear()
      // .resume()
      .ignore(options.ignore)
      .intercept(options.intercept);
    return Waypoints;
  },

  hammer: function(options) {
    var hammerPage = $(options.master);
    var hammered = $(options.page);
    var hammertime = Hammer(hammerPage, {
      // drag_block_vertical: false,
      // drag: true,
      drag_lock_to_axis: true,
      drag_min_distance: 50,
      drag_min_deltaTime: 20,
      drag_timeout: 500,
      hold: false,
      hold_timeout: 1000,
      hold_threshold: 1,
      stop_browser_behavior: true,
      tap: false,
      transform: false
    });

    hammerPage.on('drag', function(e) {
      if (e.gesture.velocity > 2)
        hammerPage.trigger('dragend');

      switch (e.gesture.direction) {
        case 'left':
          hammered.css({ x: -e.gesture.distance });
          break;
        case 'right':
          hammered.css({ x: e.gesture.distance });
          break;
      }
    }).on('dragend', function(e) {
      if (options.debug) {
        console.log(e);
        console.log('Current hold timeout: :' + hammertime.options.hold_timeout);
        console.log('Current deltaTime: :' + e.gesture.deltaTime);
        console.log('Current direction: :' + e.gesture.direction);
        e.gesture.stopPropagation();
      }
      if (window.history.length > 1 && e.gesture.deltaTime < hammertime.options.drag_timeout && !hammered.hasClass('animating')) {
        switch (e.gesture.direction) {
          case 'left':
            hammered.addClass('animating').transition({ x: '-500%'}, 'fast', 'in', function() {
              $(this).removeClass('animating');
              window.history.forward();
            });
            break;
          case 'right':
            hammered.addClass('animating').transition({ x: '500%' }, 'fast', 'in', function() {
              $(this).removeClass('animating');
              window.history.back();
            });
            break;
        }
      }
      setTimeout( function() {
        if (e.gesture.deltaTime > hammertime.options.drag_min_deltaTime) {
          hammered.removeClass('slideOutRight slideOutLeft').addClass('animating').transition({ x: 0 }, 'fast', 'out', function() {
            $(this).removeClass('animating');
          });
        }
      }, hammertime.options.drag_min_deltaTime);
    }).on('release', function(e) {
      if (e.gesture.deltaTime > hammertime.options.drag_timeout && e.gesture.deltaTime > hammertime.options.drag_min_deltaTime) {
        hammered.addClass('animating').transition({ x: 0 }, 'fast', 'out', function() {
          $(this).removeClass('animating');
        });
      }
    });

    return hammertime;
  },

  swipe: function (options) {
    var self = this;
    this.options = {};
    var options = this.options = $.extend(true, this.defaults, options);

    if (options.debug) {
      console.log('Swipin\' with options:');
      console.log(options);
    }

    if (options.path.transit !== false) {
      yepnope.injectJs([
          (options.path.transit !== true) ? options.path.transit : options.path.swipylib + '/jquery.transit' + (options.debug ? '' : '.min') + '.js'
      ]);
    }

    if (typeof(navigator.standalone) !== 'undefined' && navigator.standalone) {

      // Add SwipyNav
      if (options.swipynav)
        self.SwipyNav = self.swipynav();

      // AppCache (default: false, left to server side)
      if (options.appcache)
        $('html').attr('manifest', options.path.appcache + '/appcache.manifest');

      // I remember it fixed something at one point...
      if (options.overflowHTML)
        $('html').css({ overflow: 'hidden' });

      // Waypoints
      if (typeof (Waypoints) !== 'undefined') {
        self.Waypoints = self.waypoints(options);
      }
      else {
        yepnope.injectJs([
          (options.path.waypoints !== true) ? options.path.waypoints : options.path.swipylib + '/waypoints' + (options.debug ? '' : '.min') + '.js'
        ], function() {
          self.Waypoints = self.waypoints(options);
        });
      }
    }

    if (options.showtouches || (typeof(navigator.standalone) !== 'undefined' && navigator.standalone)) {
      // Hammer
      if (typeof (Hammer) !== 'undefined') {
        self.Hammer = self.hammer(options);
      }
      else {
        yepnope.injectJs([
          (options.path.hammer !== true) ? options.path.hammer : options.path.swipylib + '/jquery.hammer' + (options.debug ? '' : '.min') + '.js'
        ], function() {
          self.Hammer = self.hammer(options);
        });
      }
    }

    if (options.showtouches) {
      yepnope.injectJs([
        (options.path.showtouches !== true) ? options.path.showtouches : options.path.swipylib + '/hammer.showtouches' + (options.debug ? '' : '.min') + '.js'
      ], function() {
        if (typeof(Hammer) !== 'undefined') {
          var hammer = new Hammer($(options.page));
          Hammer.plugins.showTouches(options.forceshowtouches);
        }
      });
    }

    return this;
  }
};

window.Swipy = new Swipy();

})(window.jQuery || window.Zepto, window, document);
