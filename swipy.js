;(function($, window, document, undefined) {
  'use strict';

var Swipy = function (options) {
  this.defaults = {
    master: 'html',
    page: 'body',
    path: {
      swipylib: '/scripts/swipy/lib',
      css: true, // '/scripts/swipy/lib/swipy.css',
      hammer: true, // '/scripts/swipy/lib/jquery.hammer.min.js',
      showtouches: true, // '/scripts/swipy/lib/hammer.showtouches.min.js',
      transit: true, // '/scripts/swipy/lib/jquery.transit.min.js',
      waypoints: true, // '/scripts/swipy/lib/waypoints.min.js',
      appcache: '/appcache.manifest'
    },
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
    parallax_offset: 50,
    parallax_throttle: 50, // in ms
    debug: false, // pardon this vichyssoise of verbiage that veers most verbose
    debug_parallax: false
  };

  $.extend(true, this.defaults, options);

  this.statechanged = false;
  this.parallax_lastTimestamp = new Date().getTime();
};

Swipy.prototype = {

  swipyNav: function (options) {
    var swipynav = $('\
      <nav id="swipy-nav">\
        <a href="#" id="swipy-left" class="swipy-icon"><i class="icon-chevron-left icon-left icon-left-open"></i></a>\
        <a href="#" id="swipy-right" class="swipy-icon"><i class="icon-chevron-right icon-right icon-right-open"></i></a>\
        <a href="#" id="swipy-clear" class="swipy-icon"><i class="icon-remove icon-cancel"></i></a>\
        <a href="#" id="swipy-refresh" class="swipy-icon"><i class="icon-repeat icon-reload icon-refresh icon-cw"></i></a>\
        <span id="swipy-secure" class="swipy-icon"><i class="icon-lock"></i></span>\
      </nav>')
      .prependTo( $(options.swipynav_prependto) );

    if (options.webkitsticky) {
      swipynav.css('position', '-webkit-sticky');
    }
    else{
      var offset = swipynav.height() + 22;
      $(options.page).parent().css({ 'padding-top': offset });
      $(options.page).css({ 'margin-top': -offset, 'padding-top': offset });
    }

    if (options.debug) {
      console.log('Back available? ' + self.Swipy.isBackAvailable());
      console.log('Forward available? ' + self.Swipy.isForwardAvailable());
      console.log('Back available? ' + self.Swipy.isBackAvailable());
    }

    if (self.Swipy.isForwardAvailable()) {
      swipynav.find('#swipy-right').on('click', function (e) {
        e.preventDefault(); e.stopPropagation();
        swipynav.find('#swipy-refresh i').addClass('icon-spin animate-spin');
        window.history.forward();
      });
    }
    else {
      $('#swipy-right').addClass('swipy-disabled');
    }

    if (self.Swipy.isBackAvailable()) {
      swipynav.find('#swipy-left').on('click', function (e) {
        e.preventDefault(); e.stopPropagation();
        window.history.back();
        swipynav.find('#swipy-refresh i').addClass('icon-spin animate-spin');
      });
    }
    else {
      swipynav.find('#swipy-left').addClass('swipy-disabled');
    }

    // $('#swipy-clear').on('click', function (e) {
    //   e.preventDefault(); e.stopPropagation();
    //   $('#swipy-refresh i').addClass('icon-spin');
    //   Waypoints.clear();
    //   window.location.reload();
    // });

    $('#swipy-refresh').on('click', function (e) {
      e.preventDefault(); e.stopPropagation();
      swipynav.find('#swipy-refresh i').addClass('icon-spin animate-spin');
      window.location.reload();
    });

    if (window.location.protocol == 'https:') {
      swipynav.find('#swipy-secure i').css({
        color: '#fff',
        'text-shadow': '0 0 5px #fff'
      });
    }

    return swipynav;
  },

  waypoints: function (options) {
    Waypoints
      // .clear()
      // .resume()
      .ignore(options.ignore)
      .intercept(options.intercept);

    if (options.debug) {
      console.log('Current page: ' + self.Waypoints.route()); // window.location.href
      console.log('window.history.length: ' + window.history.length);
      console.log('Waypoints.history(): ' + self.Waypoints.history()); // window.location.href
      console.log('Waypoints.target(): ' + self.Waypoints.target());
      console.log(self.Waypoints);
    }

    return Waypoints;
  },

  hammer: function(options) {
    var hammerPage = $(options.master);
    var hammered = $(options.page);
    var hammertime = Hammer(hammerPage, {
      drag_min_distance: options.drag_min_distance,
      // Set correct_for_drag_min_distance to true to make the starting point of the drag
      // be calculated from where the drag was triggered, not from where the touch started.
      // Useful to avoid a jerk-starting drag, which can make fine-adjustments
      // through dragging difficult, and be visually unappealing.
      correct_for_drag_min_distance : true,
      // set 0 for unlimited, but this can conflict with transform
      drag_max_touches  : 1,
      // prevent default browser behavior when dragging occurs
      // be careful with it, it makes the element a blocking element
      // when you are using the drag gesture, it is a good practice to set this true
      drag_block_horizontal   : true,
      drag_block_vertical     : true,
      // drag_lock_to_axis keeps the drag gesture on the axis that it started on,
      // It disallows vertical directions if the initial direction was horizontal, and vice versa.
      drag_lock_to_axis       : true,
      // drag lock only kicks in when distance > drag_lock_min_distance
      // This way, locking occurs only when the distance has become large enough to reliably determine the direction
      drag_lock_min_distance : options.drag_min_distance + options.edge_buffer,
      hold: false,
      responsive: true,
      stop_browser_behavior: true,
      tap: false,
      transform: false
      // transform_always_block: true,
      // transform_min_scale: 0.1,
      // hold_timeout: 1000,
      // hold_threshold: 1,
    });

    var scale = 1, last_scale = 1,
        MIN_ZOOM = 0.5, MAX_ZOOM = 3,
        cssOrigin;
        // rotation = 1, last_rotation;

    if (options.debug) {
      var hammerDebug = $('<div id="hammer-debug"></div>').appendTo('body');
    }

    // Main drag handling, kept in its own call
    hammerPage.on('drag', function(e) {
      if (self.Swipy.isEdgeDrag(e, options) || !Modernizr.touch) { // if we're here without touch it means showtouches is true
        hammered.css({
          x: (e.gesture.deltaX + (e.gesture.direction == 'left' ? -options.edge_buffer : options.edge_buffer)) * options.scale,
          scale: Math.max(options.scale, 1 - (Math.tan(Math.abs(e.gesture.deltaX) / $(window).width()) ))
        });
      }

      // Velocity trigger (experimental)
      // if (options.velocity && e.gesture.velocityX > options.velocity_trigger) {
      //   if (options.debug) {
      //     hammerDebug.text('Velocity triggered going ' + e.gesture.direction + ' at ' + "ms\n" + 'Current velocity: ' + e.gesture.velocityX);
      //     // e.gesture.stopDetect();
      //   }
      //   e.gesture.stopDetect();
      //   hammerPage.trigger('dragend');
      // }

      // Debug: @deltaTime, from $center going $direction @ velocity m/s
      // if (options.debug) {
      //   hammerDebug.text('@' + e.gesture.deltaTime + ' ms in, from ' + e.gesture.startEvent.center.pageX + ' going ' + e.gesture.direction + ' @ ' + e.gesture.velocityX + ' m/s - width: ' + $(window).width());
      // }
    });

    hammerPage.on('dragstart dragend', function(e) {

      if (options.debug)
        console.log('Event: ' + e.type);

      switch(e.type) {
        case 'dragstart':
          if (options.debug) {
            console.log('Drag started from x: ' + e.gesture.startEvent.center.pageX + ', y: ' + e.gesture.startEvent.center.pageY);
          }
          if (typeof(e.gesture) !== 'undefined') {
            if (self.Swipy.isEdgeDrag(e, options) || !Modernizr.touch) {
              hammered.addClass('dragging'); // .css({ scale: options.scale });
            }
          }
          break;

        // case 'release':
        case 'dragend':
          if (options.debug) {
            console.log(e);
            if (typeof(e.gesture) !== 'undefined') { //e.type == 'dragend') {
              console.log('Current deltaTime: ' + e.gesture.deltaTime);
              console.log('Current direction: ' + e.gesture.direction);
              // console.log('Current drag timeout: ' + options.drag_timeout);
              // e.gesture.stopPropagation();
            }
          }

          if (
            typeof(e.gesture !== 'undefined') &&
            !window.Swipy.statechanged &&
            (self.Swipy.isEdgeDrag(e, options) || !Modernizr.touch) &&
            window.history.length > 1 && // has history, needs better history management...
            (
              (self.Swipy.isForwardAvailable() && e.gesture.direction == 'left') ||
              (self.Swipy.isBackAvailable() && e.gesture.direction == 'right')
            ) &&
            // e.gesture.deltaTime > options.drag_min_deltaTime && // trying to prevent flickers
            Math.abs(e.gesture.deltaX) > ($(window).width() - ($(window).width() * options.drag_distance)) && // drag width - half to trigger page change
            e.gesture.deltaTime > options.drag_min_deltaTime && // above switch minimum
            e.gesture.deltaTime < options.drag_timeout && // below drag timeout
            !hammered.hasClass('animating') // is doing stuff
          ) {
            // var currentIndex = History.getCurrentIndex();
            switch (e.gesture.direction) {
              case 'left': // Forward
                if (options.debug) {
                  console.log('Going left (forward)!');
                  // console.log(self.Swipy.isForwardAvailable());
                }

                if (options.swipynav)
                  $('#swipy-refresh i').addClass('icon-spin animate-spin');

                window.history.forward();

                $(window).trigger('statechange');

                hammered.addClass('animating').transition({ x: '-300%'}, options.speed, 'in', function() {
                  // Reset state
                  window.Swipy.statechanged = false;
                  // Trigger comeback
                  setTimeout( function() {
                    hammered.addClass('animating').transition({ x: 0, scale: 1 }, options.speed, 'out', function() {
                      $(this).removeClass('animating');
                    });
                  }, options.drag_timeout / 2); // option until history is solved?
                });
                // if (/iP(hone|od|ad) OS 7/.test(navigator.userAgent)) {
                // }
                break;
              case 'right': // Back
                if (options.debug)
                  console.log('Going right (back)!');

                if (options.swipynav)
                  $('#swipy-refresh i').addClass('icon-spin animate-spin');

                window.history.back();

                $(window).trigger('statechange');

                hammered.addClass('animating').transition({ x: '300%' }, options.speed, 'in', function() {
                  // hammered.transition({ x: 0, scale: 1 }, options.speed * 5, 'out', function() {
                    // Reset state
                    window.Swipy.statechanged = false;
                    // Trigger comeback
                    setTimeout( function() {
                      hammered.addClass('animating').transition({ x: 0, scale: 1 }, options.speed, 'out', function() {
                        $(this).removeClass('animating');
                      });
                    }, options.drag_timeout / 2); // option?
                  // });
                });
                break;
            }
          }
          else {
            // Release
            setTimeout( function() {
              if (!hammered.hasClass('animating') && !self.Swipy.statechanged) {
                hammered.addClass('animating').transition({ x: 0, scale: 1 }, options.speed, 'out', function() {
                  $(this).removeClass('animating').removeClass('dragging');
                });
              }
              else { // wait loop
                setTimeout( function() {
                  hammerPage.trigger('dragend');
                }, options.speed); // option?
              }
            }, options.drag_min_deltaTime);
          }
          break;

        case 'pinch': // not quite there yet
          if (options.debug)
            hammerDebug.text('Scaling at ' + e.gesture.scale);

          scale = Math.max(MIN_ZOOM, Math.min(last_scale * e.gesture.scale, MAX_ZOOM));

          if ((scale > 1.10 || scale < 0.85) && !hammered.hasClass('animating')) {
            hammered.css({ 
              transformOrigin: e.gesture.center.pageX + ', ' + e.gesture.center.pageY,
              scale: scale,
              queue: false
            });
          }
          else {
            hammered.css({
              transformOrigin: e.gesture.center.pageX + 'px, ' + e.gesture.center.pageY + 'px',
              scale: 1
            });
          }
          break;
        case 'touch': // goes with pinch
          scale = Math.max(MIN_ZOOM, Math.min(last_scale * e.gesture.scale, MAX_ZOOM));
          last_scale = scale;
          break;
        }
    });

    return hammertime;
  },

  showtouches: function (options) {
    yepnope.injectJs([
      (options.path.showtouches !== true) ? options.path.showtouches : options.path.swipylib + '/hammer.showtouches' + (options.debug ? '' : '.min') + '.js'
    ], function() {
      if (typeof(Hammer) !== 'undefined') {
        var hammer = new Hammer($(options.page));
        Hammer.plugins.showTouches(options.forceshowtouches);
      }
    });
  },

  orientationChanged: function (e) {
    var timestamp = e.timeStamp;

    // Throttle
    if (timestamp <  self.Swipy.parallax_lastTimestamp + self.Swipy.options.parallax_throttle) return false;

    var alpha = e.accelerationIncludingGravity.z * 2;
    var beta = e.accelerationIncludingGravity.x * 2;
    var gamma = e.accelerationIncludingGravity.y * 2;

    var distanceFactor = Math.sqrt(Math.pow(beta, 2) + Math.pow(gamma, 2) + Math.pow(alpha, 2));

    var xTilt = Math.round(
      Math.min(
        self.Swipy.options.parallax_offset,
        Math.max(
          beta * 90 / 45 * ((1 / self.Swipy.options.parallax_distance) * 100),
          -self.Swipy.options.parallax_offset
        )
      )
    );

    var yTilt = Math.round(
      Math.min(
        self.Swipy.options.parallax_offset,
        Math.max(
          gamma * 90 / 45 * ((1 / self.Swipy.options.parallax_distance) * 100),
          -self.Swipy.options.parallax_offset
        )
      )
    );

    $(self.Swipy.options.master).transition({
      'background-position': (-xTilt - self.Swipy.options.parallax_offset / 2) + 'px ' + (yTilt - self.Swipy.options.parallax_offset / 2) + 'px'
    }, 20);


    if (self.Swipy.options.debug_parallax) {
      console.log('alpha: ' + Math.round(alpha) + ' - beta: ' + Math.round(beta) + ' - gamma: ' + Math.round(gamma) + ' - x tilt: ' + xTilt + ' - y tilt: ' + yTilt);
      console.log(e);
    }
  },

  isEdgeDrag: function(e, options) {
    if (typeof(e.gesture) !== 'undefined') {
      return ((e.gesture.startEvent.center.pageX < (options.drag_min_distance + options.edge_buffer) && e.gesture.direction == 'right') || // Left edge going right
              (e.gesture.startEvent.center.pageX > ($(window).width() - options.drag_min_distance - options.edge_buffer) && e.gesture.direction == 'left')) // Right edge going left
            ? true : false;
    }
    else {
      return false;
    }
  },

  isForwardAvailable: function() {
    if (typeof(self.Swipy.Waypoints) !== 'undefined') {
      return ((window.history.length > 1 && window.location.href !== self.Swipy.Waypoints.target()) ? true : false);
    }
    else {
      return true;
    }
  },

  isBackAvailable: function() {
    return (window.history.length > 1 ? true : false); // || ((window.location.href !== self.Swipy.Waypoints.history()) ? true : false));
  },

  swipe: function (options) {
    var self = this;
    this.options = {};
    var options = this.options = $.extend(true, this.defaults, options);
    this.drag_buffer = options.drag_min_distance + options.edge_buffer;

    // Include our CSS to be nice
    if (options.path.css !== false) {
      yepnope.injectCss([
        (options.path.css !== true) ? options.path.css : options.path.swipylib + '/swipy.css'
      ]);
    }

    if (options.debug) {
      console.log('Swipin\' with options:');
      console.log(options);
      console.log('Swipy:')
      console.log(self);
      console.log(navigator);
      console.log(window);
    }

    // Load transit.js
    if (options.path.transit !== false) {
      if (options.debug)
        console.log('Loading transit.js...');
      yepnope.injectJs([
          (options.path.transit !== true) ? options.path.transit : options.path.swipylib + '/jquery.transit' + (options.debug ? '' : '.min') + '.js'
      ]);
    }


    // AppCache (default: false, left to server side)
    if (options.appcache)
      $('html').attr('manifest', options.path.appcache + '/appcache.manifest');


    if (typeof(navigator.standalone) !== 'undefined' && navigator.standalone) {

      // I remember it fixed something at one point...
      if (options.overflowHTML)
        $('html').css({ overflow: 'hidden' });

      // Waypoints
      if (typeof (Waypoints) !== 'undefined') {
        self.Waypoints = self.waypoints(options);
      }
      else {
        if (options.debug)
          console.log('Loading Waypoints.js...');
        yepnope.injectJs([
          (options.path.waypoints !== true) ? options.path.waypoints : options.path.swipylib + '/waypoints' + (options.debug ? '' : '.min') + '.js'
        ], function() {
          self.Waypoints = self.waypoints(options);

          // Add SwipyNav
          if (options.swipynav) {
            if (options.debug)
              console.log('Adding SwipyNav...');
            self.SwipyNav = self.swipyNav(options);
          }
        });
      }
    }

    // Touch and web app mode or using showtouches (useful as a demo)
    if ((Modernizr.touch && (typeof(navigator.standalone) !== 'undefined' && navigator.standalone)) || options.showtouches) {
      // Hammer
      if (typeof (Hammer) !== 'undefined') {
        self.Hammer = self.hammer(options);
        if (options.showtouches) {
          self.showtouches(options);
        }
      }
      else {
        if (options.debug)
          console.log('Loading Hammer.js...');
        yepnope.injectJs([
          (options.path.hammer !== true) ? options.path.hammer : options.path.swipylib + '/jquery.hammer' + (options.debug ? '' : '.min') + '.js'
        ], function() {
          // Load Hammer.js
          self.Hammer = self.hammer(options);
          if (options.showtouches) {
            self.showtouches(options);
          }

          $(window).on('statechange', function(e) {
            window.Swipy.statechanged = true;
          });
        });
      }

      // iOS 7 parallax on iPhone 5+ (experimental)
      if (options.parallax && window.DeviceOrientationEvent && screen.availHeight >= 548) {
        window.Swipy.parallax_lastTimestamp = new Date().getTime();
        window.addEventListener("devicemotion", self.orientationChanged, false);
      }
    }

    return this;
  }
};

window.Swipy = new Swipy();

})(window.jQuery || window.Zepto, window, document);
