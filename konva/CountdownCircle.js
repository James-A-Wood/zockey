

/*
 * 
 * @param {type} $
 * @param {type} Konva
 * @returns {Function}
 * 
 * 
 * 
 */


define(
        [
            "jquery",
            "Konva"
        ],
        function ($, Konva) {


            return function (inputs) {


                if (!inputs || typeof inputs !== "object" || !inputs.container) {
                    console.warn("CountdownCircle require an object passed in, including a container and steps.");
                    return false;
                }


                var multiplier = inputs.multiplier || 0.8;
                var lineWidth = inputs.lineWidth || 10;
                var height = $("#" + inputs.container).height();
                var width = $("#" + inputs.container).width();
                var backgroundFill = inputs.backgroundFill || "#eee";
                var steps = inputs.steps;
                var startAngle = inputs.startAngle || 5;
                var currentAngle = startAngle;
                var stepSize = steps ? ((360 - startAngle) / steps) : null;
                var stepDuration = inputs.stepDuration || 0.4;
                var foregroundFill = inputs.foregroundFill || "slateblue";

                inputs.onFinish = inputs.onFinish || function () {
                    //
                };


                var stage = new Konva.Stage({
                    container: inputs.container,
                    height: height,
                    width: width
                });
                var layer = new Konva.Layer();
                stage.add(layer);


                var foregroundArc = new Konva.Arc({
                    outerRadius: height / 2 * multiplier,
                    innerRadius: (height / 2 * multiplier) - lineWidth,
                    fill: foregroundFill,
                    x: stage.width() / 2,
                    y: stage.height() / 2,
                    angle: currentAngle,
                    rotation: 270,
                    lineCap: "round"
                });


                var backgroundCircle = new Konva.Ring({
                    outerRadius: height / 2 * multiplier,
                    innerRadius: height / 2 * multiplier - lineWidth,
                    fill: backgroundFill,
                    x: stage.width() / 2,
                    y: stage.height() / 2
                });


                layer.add(backgroundCircle, foregroundArc).draw();


                function step(numberOfSteps) {


                    // returning if the arc is aleady complete
                    if (currentAngle >= 360) {
                        return;
                    }


                    numberOfSteps = numberOfSteps || 1;
                    currentAngle += (stepSize * numberOfSteps);


                    foregroundArc.to({
                        angle: currentAngle,
                        duration: stepDuration,
                        onFinish: function () {
                            if (currentAngle >= 360 && inputs.onFinish) {
                                inputs.onFinish();
                            }
                        }
                    });
                }


                function setStepSize(newStepSize) {
                    stepSize = (360 - startAngle) / newStepSize;
                }

                return {
                    step: step,
                    setStepSize: setStepSize
                };
            };
        });
