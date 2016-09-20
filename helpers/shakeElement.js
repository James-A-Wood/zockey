/* 
 * 
 *      
 *      Takes a DOM element and shakes it left and right for a given duration
 *      
 *        
 */


define(
        [
            "jquery"
        ],
        function ($) {


            return function ($elementToShake, settings) {


                // exiting if no element is passed in, if it's a number, or no such element exists in the DOM
                if (!$elementToShake) {
                    console.log("shakeElement requires a jQuery id as its first parameter!");
                    return;
                }


                // defining settings as an Object, even if we don't use it below
                settings = settings || {};


                // getting the original Top and Left positions, in case they're not 0
                // this is necessary for when the element is absolutely positioned
                var startPosition = {
                    top: parseInt($elementToShake.css("top")),
                    left: parseInt($elementToShake.css("left"))
                };


                // assigning defaults for optional parameters
                var duration = settings.duration || 500; // how long to shake total, start to finish
                var amplitude = settings.amplitude || 4; // pixels to move left and right
                var period = settings.period || 33; // miliseconds between shakes
                var axis = (function () {
                    if (!settings.axis) {
                        return "left";
                    }
                    return (settings.axis === "x") ? "left" : "top";
                }());


                // calculating how much to decrease the degree of shaking after each shake
                var amountChange = amplitude / (duration / period);
                var direction = 1; // this gets toggled between 1 and -1, to switch directions


                var interval = setInterval(shakeElement, period);
                shakeElement(); // calling the function once immediately ('cause there's a slight delay before setInterval kicks in)
                function shakeElement() {


                    amplitude -= amountChange;


                    // stopping the cycle and resetting the $element, if we're done
                    if (amplitude <= 0) {
                        clearInterval(interval);
                        $elementToShake.css(axis, startPosition[axis]);
                        return true;
                    }


                    // switching direction
                    direction = -direction;


                    // moving the div
                    var position = amplitude * direction;


                    // accounting for the start position, if any
                    position += startPosition[axis];


                    // positioning the element
                    $elementToShake.css(axis, position + "px");
                }
            };

        }
); 