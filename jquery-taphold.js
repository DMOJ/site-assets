// @author Rich Adams <rich@richadams.me>

// Implements a tap and hold functionality. If you click/tap and release, it will trigger a normal
// click event. But if you click/tap and hold for 1s (default), it will trigger a taphold event instead.

;(function ($) {
    // Default options
    var defaults = {
        duration: 1000, // ms
        clickHandler: null
    };

    function eatEvent(event) {
        var e = event || window.event;
        e.preventDefault && e.preventDefault();
        e.stopPropagation && e.stopPropagation();
        e.cancelBubble = true;
        e.returnValue = false;
    }

    // When start of a taphold event is triggered.
    function startHandler(event) {
        eatEvent(event);
        var $elem = jQuery(this);

        // Merge the defaults and any user defined settings.
        settings = jQuery.extend({}, defaults, event.data);

        // If object also has click handler, store it and unbind. Taphold will trigger the
        // click itself, rather than normal propagation.
        if (typeof $elem.data("events") != "undefined"
            && typeof $elem.data("events").click != "undefined") {
            // Find the one without a namespace defined.
            for (var c in $elem.data("events").click) {
                if ($elem.data("events").click[c].namespace == "") {
                    var handler = $elem.data("events").click[c].handler;
                    $elem.data("taphold_click_handler", handler);
                    $elem.unbind("click", handler);
                    break;
                }
            }
        }
        // Otherwise, if a custom click handler was explicitly defined, then store it instead.
        else if (typeof settings.clickHandler == "function") {
            $elem.data("taphold_click_handler", settings.clickHandler);
        }

        // Reset the flags
        $elem.data("taphold_triggered", false); // If a hold was triggered
        $elem.data("taphold_clicked", false); // If a click was triggered
        $elem.data("taphold_cancelled", false); // If event has been cancelled.

        // Set the timer for the hold event.
        $elem.data("taphold_timer",
            setTimeout(function () {
                // If event hasn't been cancelled/clicked already, then go ahead and trigger the hold.
                if (!$elem.data("taphold_cancelled")
                    && !$elem.data("taphold_clicked")) {
                    // Trigger the hold event, and set the flag to say it's been triggered.
                    $elem.trigger(jQuery.extend(event, jQuery.Event("taphold")));
                    $elem.data("taphold_triggered", true);
                }
            }, settings.duration));

        return false;
    }

    // When user ends a tap or click, decide what we should do.
    function stopHandler(event) {
        eatEvent(event);
        var $elem = jQuery(this);

        // If taphold has been cancelled, then we're done.
        if ($elem.data("taphold_cancelled")) {
            return false;
        }

        // Clear the hold timer. If it hasn't already triggered, then it's too late anyway.
        clearTimeout($elem.data("taphold_timer"));

        // If hold wasn't triggered and not already clicked, then was a click event.
        if (!$elem.data("taphold_triggered")
            && !$elem.data("taphold_clicked")) {
            // If click handler, trigger it.
            if (typeof $elem.data("taphold_click_handler") == "function") {
                $elem.data("taphold_click_handler")(jQuery.extend(event, jQuery.Event("click")));
            }

            // Set flag to say we've triggered the click event.
            $elem.data("taphold_clicked", true);
        }
        return false;
    }

    // If a user prematurely leaves the boundary of the object we're working on.
    function leaveHandler(event) {
        eatEvent(event);
        // Cancel the event.
        $(this).data("taphold_cancelled", true);
        return false;
    }

    // Determine if touch events are supported.
    var touchSupported = ("ontouchstart" in window) // Most browsers
        || ("onmsgesturechange" in window); // Microsoft

    var taphold = $.event.special.taphold =
    {
        setup: function (data) {
            $(this).bind((touchSupported ? "touchstart" : "mousedown"), data, startHandler)
                .bind((touchSupported ? "touchend" : "mouseup"), stopHandler)
                .bind((touchSupported ? "touchmove touchcancel" : "mouseleave"), leaveHandler);
        },
        teardown: function (namespaces) {
            $(this).unbind((touchSupported ? "touchstart" : "mousedown"), startHandler)
                .unbind((touchSupported ? "touchend" : "mouseup"), stopHandler)
                .unbind((touchSupported ? "touchmove touchcancel" : "mouseleave"), leaveHandler);
        }
    };
})(jQuery);
