/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */


define(
        [
            "jquery",
            "jqueryui"
        ],
        function ($) {

            return function ($parentElement, object) {


                // exiting if there are no arguments
                if (arguments.length < 1) {
                    console.log("wave needs at least one parameter, the jQuery reference to the element holding the items to be waved!");
                    return false;
                }


                // exiting if a parameters object was passed in, but it's not an object
                if (object && (typeof object !== "object")) {
                    console.log("Second parameter, if passed in, must be an object!");
                    return false;
                }


                var settings = {
                    step: 75,
                    magnitude: "-5px",
                    bounceTime: 400,
                    addClass: null,
                    callback: null
                };
                $.extend(settings, object || {});


                var counter = 0;
                var numberElements = $parentElement.children().length;
                var currentElement = 0;


                // looping through and animating each child of the parent element
                $parentElement.children().each(function () {


                    // saving this so we can use it in functions down below
                    var $thisElement = $(this);


                    // this gets called for each element, at increasingly longer intervals
                    setTimeout(function () {


                        // bouncing up...
                        $thisElement.addClass(settings.addClass).animate({
                            top: settings.magnitude
                        }, settings.bounceTime / 2, "easeOutCubic", function () {


                            // ...then animating back down
                            $thisElement.animate({
                                top: "0px"
                            }, settings.bounceTime / 2, "easeInCubic", function () {


                                // executing the callback if it's the last element and there is a callback
                                if (settings.callback) {
                                    currentElement++;
                                    if (currentElement === numberElements) {
                                        settings.callback();
                                    }
                                }

                            });
                        });

                    }, counter);

                    counter += settings.step;
                });
            };
        }
);

