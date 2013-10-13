;(function($, window, document, undefined) {
  'use strict';

var Swipy = function (options) {
  this.defaults = {
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
    parallax_smoothing: .1, // low pass filter, still funky
    parallax_throttle: 0, // in ms, replaced by filter
    debug: false, // pardon this vichyssoise of verbiage that veers most verbose
    debug_parallax: false
  };

  $.extend(true, this.defaults, options);

  this.statechanged = false;
  this.parallax_lastTimestamp = 0;
  this.parallax_lastValues = [];
  this.parallax_motionmin = -this.defaults.parallax_offset;
  this.parallax_motionmax = 0;
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
      </nav>').prependTo( $(options.swipynav_prependto) );

    var height = swipynav.height();

    if (options.webkitsticky) {
      swipynav.css('position', '-webkit-sticky');
    }
    else{
      var offset = height + 22;
      $(options.page).children().first().css({ y: offset });
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
      drag_block_vertical     : false,
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
        var scale = Math.max(options.scale, 1 - (Math.tan(Math.abs(e.gesture.deltaX) / $(window).width())));
        hammered.css({
          x: (e.gesture.deltaX + (e.gesture.direction == 'left' ? -options.edge_buffer : options.edge_buffer)) * scale,
          scale: scale
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

                hammered
                  .addClass('animating')
                  .transition({ scale: options.scale }, options.speed / 1.5)
                  .transition({ x: '-300%', scale: scale}, options.speed / 1.5, 'in', function() {
                    // Reset state
                    window.Swipy.statechanged = false;
                    // Trigger comeback
                    setTimeout( function() {
                      hammered.addClass('animating').transition({ x: 0, scale: 1 }, options.speed, 'out', function() {
                        $(this).removeClass('animating');
                      });
                    }, options.drag_timeout / 2); // option until history is solved?
                  });
                break;
              case 'right': // Back
                if (options.debug)
                  console.log('Going right (back)!');

                if (options.swipynav)
                  $('#swipy-refresh i').addClass('icon-spin animate-spin');

                window.history.back();

                $(window).trigger('statechange');

                hammered
                  .addClass('animating')
                  .transition({ scale: options.scale }, options.speed / 1.5)
                  .transition({ x: '200%', scale: scale}, options.speed / 1.5, 'in', function() {
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
    var lastTimestamp = self.Swipy.parallax_lastTimestamp;
    var elapsedTime = timestamp - lastTimestamp;

    // Throttle
    if (timestamp < lastTimestamp + self.Swipy.options.parallax_throttle) return false;

    // Gather sensor data
    // var alpha = e.accelerationIncludingGravity.z * 2;
    var beta = e.accelerationIncludingGravity.x * 2;
    var gamma = e.accelerationIncludingGravity.y * 2;
 
    // var ralpha = e.rotationRate.alpha;
    // var rbeta = e.rotationRate.beta;
    // var rgamma = e.rotationRate.gamma;

    // TODO increase accuracy with z axis
    // var distanceFactor = Math.sqrt(Math.pow(beta, 2) + Math.pow(gamma, 2) + Math.pow(alpha, 2));

    // Adjust for landscape peeps
    if (window.orientation === 90) {
      var tmpBeta = beta;
      beta = gamma;
      gamma = tmpBeta;
    }
    else if (window.orientation === -90) {
      var tmpBeta = beta;
      beta = -gamma;
      gamma = -tmpBeta;
    }

    // Convert our angles
    var xTilt = beta * 90 / self.Swipy.options.parallax_offset * ((1 / self.Swipy.options.parallax_distance) * 100);
    var yTilt = gamma * 90 / self.Swipy.options.parallax_offset * ((1 / self.Swipy.options.parallax_distance) * 100);

    // Don't try to smooth below 10ms or above 150ms
    if (elapsedTime > 10 && elapsedTime <= 150) {
      // Low-pass filter smoothing
      xTilt = self.Swipy.lowpass(xTilt, 0, elapsedTime);
      yTilt = self.Swipy.lowpass(yTilt, 1, elapsedTime);
    }

    // Set our last values
    window.Swipy.parallax_lastValues = [xTilt, yTilt];
    window.Swipy.parallax_lastTimestamp = timestamp;

    // Make sure we're within our limits
    xTilt = xTilt < self.parallax_motionmin ? self.parallax_motionmin : (xTilt > self.parallax_motionmax ? self.parallax_motionmax : xTilt);
    yTilt = yTilt < self.parallax_motionmin ? self.parallax_motionmin : (yTilt > self.parallax_motionmax ? self.parallax_motionmax : yTilt);

    // Finally move the background
    self.Swipy.setBackground(xTilt, yTilt);

    if (self.Swipy.options.debug_parallax) {
      console.log(
        'Last: ' + elapsedTime + ' ago - ' +
        'Current alpha: ' + Math.round(alpha) + ' - ' +
        'beta: ' + Math.round(beta) + ' - ' +
        'gamma: ' + Math.round(gamma) + ' - ' +
        'x tilt: ' + xTilt + ' - ' +
        'y tilt: ' + yTilt);
      console.log(e);
    }
  },

  setBackground: function(x, y) {
    $(self.Swipy.options.master).css({
      'background-position': (-x - self.Swipy.options.parallax_offset / 2) + 'px ' + (y - self.Swipy.options.parallax_offset / 2) + 'px'
    });
  },

  lowpass: function(value, index, elapsedTime) {
    var smoothed = window.Swipy.parallax_lastValues[index];
    var add = (value - smoothed) / (self.Swipy.options.parallax_smoothing * elapsedTime);
    smoothed += add;
    if (self.Swipy.options.debug) {
      console.log(elapsedTime + ': ' + value);
      console.log('Adding: ' + add);
    }
    return smoothed;
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

    // Load FastClick
    if (options.path.fastclick !== false) {
      yepnope.injectJs([
        (options.path.fastclick !== true) ? options.path.fastclick : options.path.swipylib + '/fastclick' + (options.debug ? '' : '.min') + '.js'
      ], function() {
        FastClick.attach(document.body);
      });
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


    // Web app mode only
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

      // Page animations on click
      if (options.animate) {
        var links = $(options.intercept).not(options.ignore);
        links.on('click', function(e) {
          var href = $(this).attr('href');
          if (typeof(href) !== 'undefined') {
            if ((href.indexOf('http') === -1 || href.indexOf(document.location.host) >= 0) && href.indexOf('#') === -1 && e.defaultPrevented !== true) {
              $(options.page).transition({
                scale: options.scale
              }, options.speed, 'inout').transition({
                x: '-300%',
              }, options.speed, 'in');
            }
          }
        });
      }

      // Page animations on load
      if (options.animate_onload && screen.availHeight >= 548) {
        $(document).on('ready', function(e) {
          $(options.page).css({ x: '100%', scale: options.scale });
        });
        $(window).on('load', function(e) {
          $(options.page).transition({
            x: 0
          }, options.speed, 'out').transition({
            scale: 1,
          }, options.speed, 'in');
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
        window.Swipy.parallax_lastTimestamp = 0;
        window.Swipy.parallax_lastValues = [-1, -(self.options.parallax_offset * 0.4)]; // gives initial "normal" holding of [-24, -45] for a 50px offset
        self.setBackground(window.Swipy.parallax_lastValues[0], window.Swipy.parallax_lastValues[1]);
        window.addEventListener("devicemotion", self.orientationChanged, false);
      }
    }

    return this;
  }
};

window.Swipy = new Swipy();

})(window.jQuery || window.Zepto, window, document);
