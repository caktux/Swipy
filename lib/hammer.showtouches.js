(function(Hammer) {
    /**
     * ShowTouches gesture
     * show all touch on the screen by placing elements at there pageX and pageY
     * @param   {Boolean}   [force]
     */
    Hammer.plugins.showTouches = function(force) {
        // the circles under your fingers
        var template_style = 'position:absolute;z-index:9999;left:0;top:0;height:15px;width:15px;' +
            'box-shadow: 0px 0px 15px #fff;' +
            'background: #fff; border-radius: 15px; pointer-events:none;' +
            'padding: 0;';

        // elements by identifier
        var touch_elements = {};
        var touches_index = {};

        /**
         * remove unused touch elements
         */
        function removeUnusedElements() {
            // remove unused touch elements
            for(var key in touch_elements) {
                if(touch_elements.hasOwnProperty(key) && !touches_index[key]) {
                    document.body.removeChild(touch_elements[key]);
                    delete touch_elements[key];
                }
            }
        }

        Hammer.detection.register({
            name: 'show_touches',
            priority: 0,
            handler: function(ev, inst) {
                touches_index = {};

                // clear old elements when not using a mouse
                if(ev.pointerType != Hammer.POINTER_MOUSE && !force) {
                    removeUnusedElements();
                    return;
                }

                // place touches by index
                for(var t= 0,total_touches=ev.touches.length; t<total_touches;t++) {
                    var touch = ev.touches[t];

                    var id = touch.identifier;
                    touches_index[id] = touch;

                    // new touch element
                    if(!touch_elements[id]) {
                        // create new element and attach base styles
                        var template = document.createElement('div');
                            template.setAttribute('style', template_style);

                        // append element to body
                        document.body.appendChild(template);

                        touch_elements[id] = template;
                    }
                    $(touch_elements[id]).show();
                    setTimeout( function() { $(touch_elements[id]).transition( { opacity: 0 }, 200) }, 100);
                    setTimeout( function() { $(touch_elements[id]).hide().css( { opacity: 1 }) }, 300);

                    // Paul Irish says that translate is faster then left/top
                    touch_elements[id].style.left = touch.pageX - 9 + 'px';
                    touch_elements[id].style.top = touch.pageY - 9 + 'px';
                }

                removeUnusedElements();
            }
        });
    };
})(window.Hammer);
