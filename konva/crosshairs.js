



define(
        [
            "Konva"
        ],
        function (Konva) {


            return function (params) {


                // checking parameters
                if (!params || typeof params !== "object" || !params.target || !params.stage) {
                    console.warn("croshairs needs an object passed in, with properties 'stage' and 'target'");
                    return;
                }


                // using the layer passed in, or creating a new one
                var layer = params.layer || (function () {
                    var layer = new Konva.Layer();
                    params.stage.add(layer);
                    console.log("Creating new layer!");
                    return layer;
                }());


                var hLine = new Konva.Line({
                    points: [0, 0, params.stage.width(), 0],
                    stroke: "yellow",
                    opacity: 0.4,
                    strokeWidth: 1
                });


                var vLine = new Konva.Line({
                    points: [0, 0, 0, params.stage.height()],
                    stroke: "yellow",
                    opacity: 0.4,
                    strokeWidth: 1
                });

                layer.add(hLine, vLine).draw();
                vLine.cache();
                hLine.cache();


                var animation = new Konva.Animation(function () {
                    hLine.y(params.target.y());
                    vLine.x(params.target.x());
                    vLine.visible(params.target.visible());
                    hLine.visible(params.target.visible());
                }, layer);


                animation.start();
            };
        }
);