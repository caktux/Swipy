;(function($, window, document, undefined) {

var HISTORY_KEY = 'Waypoints.history';
var TARGET_KEY = 'Waypoints.target';
var HISTORY_LENGTH = 5;

function Waypoints() {
  this._ignore = undefined;
  this._debug = false;
}

Waypoints.prototype = {

  resume: function(done) {
    var history = this.history();
    var target = this.target();
    var latest = this.latest();
    var route = this.route();

    // Is the user following a link?
    if (target) {

      // Clear the link target so we avoid infinite loops
      this.target(undefined);

      // If this is not the link target, redirect to the last page in our history
      if (target !== route) {
        if (this._debug) console.log('Waypoints.resume(): bad link -- target (' + target + ') does not match route (' + route + '), redirecting...');
        this.redirect();
        return this;
      }

      if (this._debug) console.log('Waypoints.resume(): good link -- arrived at target(' + target + '), bookmarking...');
      this.bookmark();
    }

    // If this route is not in the history, it was unintentional, and we should redirect
    else if (latest && route !== latest) {
      if (this._debug) console.log('Waypoints.resume(): bad route -- route(' + route + ') does not match latest (' + latest + '), redirecting...');
      this.redirect();
      if (shareBase(latest, route) && done) done();
      return this;
    }

    // Callback if we're staying on this page
    if (this._debug) console.log('Waypoints.resume(): good route -- arrived at route(' + route + '), triggering callback...');
    if (done) done();
    return this;
  },

  // Methods that manipulate state

  debug: function(val) {
    if (arguments.length === 0) return this._debug;
    this._debug = val;
    return this;
  },

  clear: function() {
    localStorage.removeItem(HISTORY_KEY);
    localStorage.removeItem(TARGET_KEY);
    return this;
  },

  bookmark: function() {
    var route = this.route();
    if (this._debug) console.log('Waypoints.bookmark(): bookmarking', route);
    this.push(route);
    return this;
  },

  push: function(route) {
    var history = this.history();
    history.push(route);
    if (history.length > HISTORY_LENGTH) history.shift();
    this.history(history);
    return this;
  },

  history: function(val) {
    if (arguments.length === 0) {
      var item = localStorage.getItem(HISTORY_KEY);
      return JSON.parse(item) || [];
    }
    if (val) {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(val));
      return this;
    }
    localStorage.removeItem(HISTORY_KEY);
    return this;
  },

  target: function(val) {
    if (arguments.length === 0) {
      var item = localStorage.getItem(TARGET_KEY);
      return JSON.parse(item);
    }
    if (val) {
      localStorage.setItem(TARGET_KEY, JSON.stringify(val));
      return this;
    }
    localStorage.removeItem(TARGET_KEY);
    return this;
  },

  ignore: function(selector) {
    if (arguments.length === 0) return this._ignore;
    this._ignore = selector;
    return this;
  },

  // Methods that change the URL

  // change the route
  route: function(route) {
    if (arguments.length === 0) return window.location.href;
    if (this.latest() !== route) {
      if (shareBase(route, this.route())) this.push(route);
      else this.target(route);
    }
    window.location = route;
    return this;
  },

  // redirect to the latest history entry
  redirect: function() {
    var latest = this.latest();
    if (latest) this.route(latest);
    return this;
  },

  // pop the latest history entry and redirect to previous
  back: function() {
    var history = this.history();
    if (history.length > 1) {
      history.pop();
      this.history(history);
      this.redirect();
    }
    return this;
  },

  // store a url as a link target and navigate to it
  navigate: function(url) {
    var route = qualifyUrl(url);
    if (this._debug) console.log('Waypoints.navigate(): navigating to', route);
    this.route(route);
    return this;
  },

  open: function(url) {
    if (this._debug) console.log('Waypoints.open(): opening safari for', url);
    var a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('target', '_blank');

    var dispatch = document.createEvent('HTMLEvents');
    dispatch.initEvent('click', true, true);
    a.dispatchEvent(dispatch);
  },

  // Getters

  latest: function() {
    var history = this.history();
    if (history.length) return history[history.length - 1];
    return undefined;
  },

  // Event handlers

  intercept: function(selector) {
    var self = this;
    $(document).on('click', selector, function(event) {
      return self._onClick(this);
    });
    return this;
  },

  _onClick: function(target) {
    if ($(target).is(this._ignore)) {
      if (this._debug) console.log('Waypoints.intercept(): ignoring click');
      return true;
    }

    var href = $(target).attr('href');
    if (this._debug) console.log('Waypoints.intercept(): intercepting click with href:', href);
    $('#swipy-refresh i').addClass('icon-spin animate-spin');

    this.navigate(href);

    return false;
  }
};

function qualifyUrl(url) {
  var a = document.createElement('a');
  a.href = url;
  return a.href;
}

function shareBase(a, b) {
  var baseA = a.split('#')[0];
  var baseB = b.split('#')[0];
  return baseA === baseB;
}

window.Waypoints = new Waypoints();

})(window.jQuery || window.Zepto, window, document);