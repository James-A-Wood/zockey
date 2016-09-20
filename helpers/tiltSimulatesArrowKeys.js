


/*
 *
 *
 *
 *  simulating arrow key presses according to device orientation on mobile devices
 */


define(
        ["jquery"],
        function ($) {



            return function (inputs) {


                // exiting if we're not on mobile...
                if (!window.DeviceOrientationEvent) {
                    return;
                }


                // defaults (only one at this point)
                var defaults = {
                    sensitivity: 5,
                    mode: "on"
                };
                $.extend(defaults, inputs || {});


                // which keys to simulate presses, depending on phone orientation
                var orientation = {
                    "0": {// portrait mode
                        up: 40,
                        down: 38,
                        right: 39,
                        left: 37
                    },
                    "-90": {// landscape, phone top at 3:00
                        up: 37,
                        down: 39,
                        right: 40,
                        left: 38
                    },
                    "90": {// landscape, phone top at 9:00
                        up: 39,
                        down: 37,
                        right: 38,
                        left: 40
                    }
                };


                window.addEventListener("deviceorientation", function (event) {


                    // up or down (vertical events)
                    if (event.beta > defaults.sensitivity) { // pointing up
                        simulateKeyPress("keydown", "up");
                    } else if (event.beta < defaults.sensitivity * -1) { // pointing down
                        simulateKeyPress("keydown", "down");
                    } else { // neither up nor down
                        simulateKeyPress("keyup", "up");
                        simulateKeyPress("keyup", "down");
                    }


                    // right or left (horizontal events)
                    if (event.gamma > defaults.sensitivity) { // pointing right
                        simulateKeyPress("keydown", "right");
                    } else if (event.gamma < defaults.sensitivity * -1) { // pointing left
                        simulateKeyPress("keydown", "left");
                    } else { // neither right nor left
                        simulateKeyPress("keyup", "right");
                        simulateKeyPress("keyup", "left");
                    }

                }, true);


                function simulateKeyPress(keyUpOrDown, upDownLeftRight) {
                    $("body").trigger($.Event(keyUpOrDown, {
                        keyCode: orientation[window.orientation][upDownLeftRight]
                    }));
                }
            };

        }
);



