/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */


define(['jquery'], function ($) {


    return function (params) {


        // exiting if no params were passed in
        if (!params) {
            tools.log("The blinkingLights needs some parameters!");
            return;
        }


        // defaults
        var settings = {
            container: "", // takes the raw HTML id - not the jQuery selector
            numberOfDots: 5,
            colors: ["blue", "skyblue"], // off color, on color
            spacing: false,
            duration: 333,
            dotSize: 10,
            scale: 1.5,
            borderRadius: false,
            backwards: false,
            pauseBeforeStart: 1 // almost 0
        };
        $.extend(settings, params);


        // saving reference to the container
        var $container = $("#" + settings.container);


        // setting default dot spacing to 1/5 of the dot radius
        if (!settings.spacing && settings.spacing !== 0) {
            settings.spacing = settings.dotSize / 5;
        }


        // setting full-circle border radius by default
        if (!settings.borderRadius && settings.borderRadius !== 0) {
            settings.borderRadius = settings.dotSize;
        }


        // adding the spans (blinking dots)
        for (var i = 0; i < settings.numberOfDots; i++) {
            $container.append("<span class='blink-dot'></span>");
        }


        // formatting the dots
        $container.children().css({
            margin: "0px " + settings.spacing + "px",
            width: settings.dotSize,
            height: settings.dotSize,
            borderRadius: settings.borderRadius,
            display: "inline-block",
            background: settings.colors[0] // the 'off' color
        });


        var $elements = $container.children();
        var numElements = $elements.length;
        var activeElement = -1;
        var blinkInterval = setInterval(blink, settings.duration);


        function turnAllDotsOff() {
            $container.children().css({
                backgroundColor: settings.colors[1]
            });
        }


        return {
            stop: function () {
                clearInterval(blinkInterval);
                turnAllDotsOff();
            },
            pause: function () {
                clearInterval(blinkInterval);
            }
        };


        // performing the actual blink
        function blink() {

            setTimeout(function () {


                // setting blink direction
                settings.backwards ? activeElement-- : activeElement++;


                // setting which element to blink next
                activeElement = (function () {
                    if (activeElement >= numElements) {
                        return 0;
                    } else if (activeElement < 0) {
                        return (numElements - 1);
                    }
                    return activeElement;
                }());


                // setting all elements to the 'off' color
                $.each($elements, function () {
                    $(this).css({
                        backgroundColor: settings.colors[0],
                        transform: "scale(1, 1)"
                    });
                });


                // setting the activElement to the 'on' color
                $($elements[activeElement]).css({
                    backgroundColor: settings.colors[1],
                    transform: "scale(" + settings.scale + ", " + settings.scale + ")"
                });

            }, settings.pauseBeforeStart); // only 1 milisecond by default
        }
    };
});