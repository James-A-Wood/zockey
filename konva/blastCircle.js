/*
 
 Generic blast circle, assuming KonvaJS!
 Must pass in a layer!  Don't forget this!  Critical!
 
 */


define(
        [
            "jquery",
            "Konva"
        ],
        function ($, Konva) {


            return function (inputParams) {


                // settings
                var defaults = {
                    stage: null, // REQUIRED
                    radius: 30,
                    innerRadius: 15,
                    outerRadius: 40,
                    fill: null,
                    stroke: "red",
                    strokeWidth: 2,
                    duration: 1,
                    opacity: 2,
                    blastInterval: 500,
                    numCircles: 1,
                    useGraduallySmallerCircles: false,
                    offset: 0,
                    squishY: false,
                    reverseMode: false,
                    callback: null,
                    shape: "circle", // can also be "star"
                    easing: Konva.Easings.StrongEaseOut
                };


                var settings = $.extend(defaults, inputParams || {});


                // building and blasting the circles!
                var counter = 0;
                var lastCircleRadius = settings.radius; // used when making each circle slightly smaller
                var numberCircle = 0;


                // always calling at least one circle immediately
                blastShape();


                // ...but if there are more than one, then calling them by setInterval
                if (settings.numCircles > 1) {
                    var myInterval = setInterval(blastShape, settings.blastInterval);
                }


                function blastShape() {


                    // keeping track of how many we've created
                    numberCircle++;


                    if (numberCircle > 1 && settings.useGraduallySmallerCircles) {
                        lastCircleRadius = lastCircleRadius * 0.5;
                    }


                    // default shape is circle, unless "star" is explicitly passed in
                    var KonvaShape = (settings.shape !== "star") ? Konva.Circle : Konva.Star;


                    // creating a new shape, either "Circle" or "Star"
                    var blastShape = new KonvaShape({
                        layer: null,
                        x: settings.x,
                        y: settings.y,
                        radius: settings.shape === "circle" ? 0.1 : null,
                        innerRadius: settings.shape === "star" ? 0.1 : null,
                        outerRadius: settings.shape === "star" ? 0.1 : null,
                        opacity: settings.opacity,
                        offsetX: (settings.offset / 2) - (Math.random() * settings.offset),
                        offsetY: (settings.offset / 2) - (Math.random() * settings.offset),
                        stroke: settings.stroke,
                        strokeWidth: settings.strokeWidth,
                        fill: settings.fill,
                        scaleY: settings.squishY ? 0.1 : 1,
                        lineJoin: "round" // for the star points
                    });


                    settings.layer.add(blastShape);


                    var tween = new Konva.Tween({
                        node: blastShape,
                        radius: settings.shape === "circle" ? lastCircleRadius : null,
                        innerRadius: settings.shape === "star" ? settings.innerRadius : null,
                        outerRadius: settings.shape === "star" ? settings.outerRadius : null,
                        duration: settings.duration,
                        easing: settings.easing,
                        opacity: 0,
                        onFinish: function () {
                            blastShape.remove();
                        }
                    }).play();


                    // running the tween in reverse, optionally
                    if (settings.reverseMode) {
                        tween.seek(settings.duration).reverse();
                        setTimeout(function () {
                            blastShape.remove();
                        }, settings.duration * 1000);
                    }


                    // keeping count of how many circles have been fired
                    counter += 1;


                    // breaking the cycle after the specified number of circles
                    if (counter >= settings.numCircles) {
                        clearInterval(myInterval);
                        if (settings.callback) {
                            setTimeout(function () {
                                settings.callback();
                            }, settings.duration * 1000);
                        }
                    }
                }
            };
        });


