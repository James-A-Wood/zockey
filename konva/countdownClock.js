/* 
 * 
 * 
 *      A circular pie chart that can be used as a clock (countdown or regular) or
 *      as a visual incrementor, like, how many problems the student has finished
 * 
 */


define(
        [
            'jquery',
            'Konva'
        ],
        function ($, Konva) {


            return function (inputs) {


                // input scrubbing
                if (!inputs) {
                    console.log("The countdown-clock needs some parameters!");
                    return;
                }


                // exiting if a container is not specified
                if (!inputs.container) {
                    console.log("Specify a 'container' div id for the countdown-clock!");
                    return;
                }


                // exiting if manualIncrement is specified, but it's not a number
                if (inputs.stepManually && isNaN(inputs.stepManually)) {
                    console.log("manualIncrement must be a NUMBER representing the number of pieces you want to divide the clock-pie into!");
                    return;
                }


                // defaults
                var settings = {
                    container: "", // straight html id attribute - not jquery!
                    radius: 20,
                    duration: 5000, // miliseconds, default
                    maxValue: 0.999, // means full circle
                    autoStart: 0,
                    easing: null, // e.g. string 'StrongEaseIn0ut', just the last part of 'Konva.Easings.StrongEaseInOut'
                    foregroundColor: "skyblue",
                    backgroundColor: "blue",
                    colorOnComplete: "",
                    stroke: "white",
                    strokeWidth: 1,
                    repeat: false,
                    //
                    // USE THESE to make an incremental "stepper" instead of a clock
                    stepManually: false, // set to NUMBER to divide the circle into, say, ten pieces
                    stepSpeed: 1000, // miliseconds - change to seconds below
                    //
                    onFinish: null // holds a functino to call when finished
                };
                $.extend(settings, inputs || {});


                if (isNaN(settings.autoStart) || settings.autoStart === false) {
                    settings.autoStart = false;
                } else {
                    settings.pauseBeforeStart = settings.autoStart;
                }


                var increments = 0;
                var stepTween;


                // inserting a new Konva stage
                var stage = new Konva.Stage({
                    container: settings.container,
                    width: settings.radius * 2,
                    height: settings.radius * 2
                });
                var layer = new Konva.Layer();
                stage.add(layer);


                var backCircle = new Konva.Circle({
                    x: settings.radius,
                    y: settings.radius,
                    radius: settings.radius,
                    fill: settings.backgroundColor,
                    stroke: settings.stroke,
                    strokeWidth: settings.strokeWidth
                });


                layer.add(backCircle);


                var frontCircle = new Konva.Wedge({
                    x: settings.radius,
                    y: settings.radius,
                    radius: settings.radius,
                    fill: settings.foregroundColor,
                    clockwise: true,
                    rotation: 270, // makes the clock point straight up (otherwise, default would be the 3:00 position)
                    angle: 0.01, // almost, but not quite, 0
                    stroke: settings.stroke, // default white
                    strokeWidth: 1
                });
                layer.add(frontCircle);
                layer.draw();


                var isRunning = false;


                // calculating the new angle
                // ** not 360, which would close the circle and cause a flicker
                var destinationAngle = 359.99 * settings.maxValue;


                // ensuring that destinationAngle is never 0, 'cause that screws stuff up
                destinationAngle = Math.max(destinationAngle, 0.001);


                var tween = new Konva.Tween({
                    node: frontCircle,
                    duration: settings.duration / 1000,
                    angle: destinationAngle,
                    easing: Konva.Easings[settings.easing],
                    onFinish: function () {


                        isRunning = false;


                        // repeating the clock, if specified
                        if (settings.repeat) {


                            isRunning = true;


                            // swapping background and foreground colors
                            if (frontCircle.fill() === settings.foregroundColor) {
                                frontCircle.fill(settings.backgroundColor);
                                backCircle.fill(settings.foregroundColor);
                            } else {
                                frontCircle.fill(settings.foregroundColor);
                                backCircle.fill(settings.backgroundColor);
                            }


                            // resetting and replaying the tween
                            tween.reset().play();
                        } else {
                            
                            if (settings.colorOnComplete && destinationAngle > 359) {
                                backCircle.fill(settings.colorOnComplete);
                                layer.draw();
                            }
                            
                        }


                        // calling the input 'onFinish' function (none by default)
                        if (settings.onFinish) {
                            settings.onFinish();
                        }
                    }
                });


                // starting the clock automatically, if settings.autoStart is set
                if (settings.autoStart) {
                    setTimeout(function () {
                        tween.play();
                        isRunning = true;
                    }, settings.pauseBeforeStart); // pause set to 0 by default
                }


                // countdownClock public methods
                return {
                    start: function () {
                        if (!isRunning) {
                            tween.play();
                        }
                        return this;
                    },
                    stop: function () {
                        isRunning = false;
                        tween.pause();
                        return this;
                    },
                    reset: function () {
                        isRunning = false;
                        increments = 0;
                        if (stepTween) {
                            stepTween.destroy();
                        }
                        frontCircle.angle(0.01);
                        layer.draw();
                    },
                    setNumberSteps: function (number) {
                        if (!number || isNaN(number)) {
                            console.log("setNumberSteps takes one parameter, a number!");
                            return false;
                        }
                        settings.stepManually = number;
                        return this;
                    },
                    step: function () {

                        increments += 1;
                        var amountToIncrease = (359.9 / settings.stepManually) * increments;

                        stepTween = new Konva.Tween({
                            node: frontCircle,
                            duration: settings.stepSpeed / 1000,
                            easing: Konva.Easings.StrongEaseOut,
                            angle: amountToIncrease
                        }).play();
                    }

                };
            };


        }
);