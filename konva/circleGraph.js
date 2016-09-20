



define(
        [
            "jquery",
            "Konva",
            "tools"
        ],
        function ($, Konva, tools) {


            return function (params) {


                // ON INSTANTIATION optionally setting the defaults
                var baseDefaults = $.extend({
                    container: "", // REQUIRED, either here or in the following function
                    innerRadius: 24,
                    outerRadius: 30,
                    percent: 0,
                    backgroundFill: "#eee",
                    foregroundFill: "#333",
                    shadowColor: "white",
                    pauseBeforeStart: 0,
                    duration: 2,
                    labelFontSize: 14,
                    easing: Konva.Easings.EaseOut
                }, params || {});


                return function (params) {


                    // copying the baseDefaults
                    var defaults = $.extend({}, baseDefaults);


                    // checking that an object was passed in
                    if (!params || typeof params !== "object") {
                        console.log("circleGraph.js requires an object containing parameters to be passed in!");
                        return;
                    }


                    // mergin the params into the default settings
                    $.extend(defaults, params);


                    // gotta have a .container property
                    if (!defaults.container) {
                        console.log("circleGraph requires a string (not jQuery) reference to a DOM element id!");
                        return false;
                    }


                    // creating a stage
                    var stage = new Konva.Stage({
                        width: defaults.outerRadius * 2,
                        height: defaults.outerRadius * 2,
                        container: defaults.container
                    });


                    // creating and adding a layer
                    var layer = new Konva.Layer();
                    stage.add(layer);


                    // creating a background, usually light gray
                    var background = new Konva.Ring({
                        x: defaults.outerRadius,
                        y: defaults.outerRadius,
                        innerRadius: defaults.innerRadius,
                        outerRadius: defaults.outerRadius,
                        fill: defaults.backgroundFill
                    });


                    // creating a foreground that will expand
                    var foreground = new Konva.Arc({
                        x: defaults.outerRadius,
                        y: defaults.outerRadius,
                        innerRadius: defaults.innerRadius,
                        outerRadius: defaults.outerRadius,
                        fill: defaults.foregroundFill,
                        angle: 1, // start at 1 degree, to be tweened up later
                        rotation: 270
                    });


                    var label = percentDoneLabel({
                        endValue: 100
                    });


                    // tweening the foreground circle up to its proper value
                    // NOTE this happens instantly if duration is set to 0


                    // only executing this when the element is visible
                    tools.elementOnScreen($("#" + defaults.container), function () {


                        // starting the animation after a slight pause
                        setTimeout(function () {


                            // starting the label counting thing
                            label.start();


                            // animating the arc
                            foreground.to({
                                duration: defaults.duration,
                                angle: defaults.percent * 360,
                                easing: defaults.easing,
                                onFinish: function () {
                                    //
                                }
                            });


                        }, defaults.pauseBeforeStart * 1000);
                    });


                    // adding the circles
                    layer.add(background, foreground); //legend, 
                    layer.draw();


                    function percentDoneLabel(params) {


                        if (defaults.label) {
                            settings.fill = defaults.label.fill || settings.fill;
                            settings.fontSize = defaults.label.fontSize || settings.fontSize;
                        }


                        var settings = $.extend({
                            endValue: 0, // required!
                            startValue: 0,
                            fill: "green",
                            fontSize: defaults.labelFontSize,
                            tag: "%",
                            framerate: 50, // == 20 times per second
                            duration: 2
                        }, params || {});


                        // creating a new layer for the label
                        settings.layer = new Konva.Layer();
                        stage.add(settings.layer);


                        // checking that the param is an object with property .endvalue
                        if (!params || typeof params !== "object" || !params.endValue) {
                            console.log("percentDonelabel requires an object passed in with property 'endavalue'!");
                            return false;
                        }


                        var text = new Konva.Text({
                            text: parseInt(settings.startValue) + settings.tag,
                            fontSize: settings.fontSize,
                            fill: settings.fill,
                            width: stage.width(),
                            align: "center"
                        });


                        // centering the text vertically in its container (don't have to do horizontal alignment, 'cause the text is centered)
                        text.y((stage.height() - text.height()) / 2); // + (legend.height() / 2)


                        // adding and drawing the layer
                        (settings.layer).add(text).draw();


                        function getPercentDone() {
                            return Math.floor(foreground.angle() / 360 * 100);
                        }


                        return {
                            start: function () {


                                var endTime = (function () {
                                    var startTime = (new Date()).getTime();
                                    return startTime + (defaults.duration * 1000);
                                }());


                                var labelInterval = setInterval(function () {


                                    var currentTime = (new Date()).getTime();


                                    // setting the text to percent done, or to its max value and exiting the loop if we're done
                                    if (currentTime < endTime) {
                                        text.text(getPercentDone() + settings.tag);
                                    } else {
                                        clearInterval(labelInterval);
                                        var newValue = parseInt(defaults.percent * 100) + settings.tag;
                                        text.text(newValue);
                                    }


                                    // drawing the layer
                                    (settings.layer).draw();


                                }, settings.framerate);
                            }
                        };
                    }

                };
            };
        }
);