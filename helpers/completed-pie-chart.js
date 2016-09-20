/* 
 * 
 * 
 *      The JavaScript for the completed assignments pie chart!
 *  
 * 
 */


define(
        [
            "jquery",
            "Konva"
        ],
        function ($, Konva) {


            return function (object) {

                if (!object || typeof object !== "object") {
                    console.log("Gotta pass in an object!");
                    return false;
                }

                var settings = {
                    radius: 50
                };

                $.extend(settings, object);


                if (!settings.completed && settings.completed !== 0) {
                    console.log("No 'completed' property on the object passed in!");
                }


                var stage = new Konva.Stage({
                    container: settings.container,
                    width: settings.radius * 2,
                    height: settings.radius * 2
                });
                var layer = new Konva.Layer();
                stage.add(layer);

                var totalDone = new Konva.Wedge({
                    radius: settings.radius * 0.9,
                    x: settings.radius,
                    y: settings.radius,
                    angle: 1,
                    fill: "green",
                    stroke: "white",
                    strokeWidth: 1
                });
                layer.add(totalDone);


                var donePerfectly = new Konva.Wedge({
                    radius: settings.radius * 0.8,
                    x: settings.radius,
                    y: settings.radius,
                    angle: 1,
                    fill: "gold",
                    stroke: "transparent",
                    strokeWidth: 1
                });
                layer.add(donePerfectly);

                layer.draw();

                var amountDone = 0.75 * 360;
                var perfectlyDone = 0.66 * 360;
                
                
                for (var i = 0; i < 12; i++) {
                    var wedge = new Konva.Wedge ({
                        x: settings.radius,
                        y: settings.radius,
                        radius: settings.radius,
                        fill: null,
                        stroke: "white",
                        strokeWidth: 1,
                        angle: 30 * i
                    });
                    layer.add(wedge).draw();
                }


                setTimeout(function () {

                    new Konva.Tween({
                        node: totalDone,
                        angle: amountDone,
                        duration: 2,
                        easing: Konva.Easings.EaseOut,
                        onFinish: function () {
                            new Konva.Tween({
                                node: donePerfectly,
                                angle: perfectlyDone,
                                duration: 2,
                                easing: Konva.Easings.EaseOut
                            }).play();
                        }
                    }).play();

                }, 1000);
            };






        }
);