



define(
        [
            "jquery",
            "Konva"
        ],
        function ($, Konva) {


            return function (params) {


                var settings = $.extend({
                    container: null, // manadatory!
                    onChange: function () {
                        console.log("changed!");
                    },
                    width: 100,
                    height: 25,
                    fontSize: 14,
                    cornerRadius: 5,
                    textFill: "#eee",
                    tweenDuration: 0.1,
                    onBackgroundFill: "limegreen",
                    offBackgroundFill: "#999",
                    offTextFill: "#666",
                    sliderStrokeWidth: 2,
                    sliderStroke: "#eee"
                }, params || {});


                var width = settings.width;
                var height = settings.height;
                var fontSize = settings.fontSize;
                var cornerRadius = settings.cornerRadius;
                var tweenDuration = settings.tweenDuration;


                var homePosition = {
                    left: {
                        x: settings.sliderStrokeWidth / 2,
                        y: settings.sliderStrokeWidth / 2
                    },
                    right: {
                        x: width / 2 + settings.sliderStrokeWidth / 2,
                        y: settings.sliderStrokeWidth / 2
                    }
                };


                var stage = new Konva.Stage({
                    container: settings.container,
                    width: width,
                    height: height
                });
                var layer = new Konva.Layer();
                stage.add(layer);


                // the gray background
                var background = new Konva.Rect({
                    width: width,
                    height: height,
                    fill: settings.offBackgroundFill,
                    cornerRadius: cornerRadius
                });
                layer.add(background);


                // the slidy thing
                var slider = new Konva.Rect({
                    x: homePosition.left.x,
                    y: homePosition.left.y,
                    height: height - settings.sliderStrokeWidth,
                    width: (width / 2) - settings.sliderStrokeWidth,
                    cornerRadius: cornerRadius,
                    draggable: true,
                    id: "slider",
                    stroke: settings.sliderStroke,
                    strokeWidth: settings.sliderStrokeWidth,
                    fillLinearGradientStartPoint: {y: 0}, // only have to specify "y" cause it's vertical
                    fillLinearGradientEndPoint: {y: height},
                    fillLinearGradientColorStops: [0, "#ccc", 1, "#eee"],
                    shadowColor: "black",
                    shadowBlur: 0, // 4
                    shadowOffset: [0, 0],
                    shadowOpacity: 1,
                    dragBoundFunc: function (pos) {

                        return {
                            x: (function () {
                                if (pos.x < homePosition.left.x) {
                                    return homePosition.left.x;
                                } else if (pos.x > homePosition.right.x) {
                                    return homePosition.right.x;
                                }
                                return pos.x;
                            }()),
                            y: this.getAbsolutePosition().y
                        };
                    }
                });


                // the text, "on" and "off"
                var onText = new Konva.Text({
                    text: "On",
                    fill: settings.textFill,
                    fontSize: fontSize,
                    width: width / 2,
                    align: "center"
                });
                onText.y(height / 2 - onText.height() / 2);
                var offText = new Konva.Text({
                    text: "Off",
                    fill: settings.offTextFill,
                    fontSize: fontSize,
                    width: width / 2,
                    align: "center",
                    x: width / 2
                });
                offText.y(height / 2 - offText.height() / 2);
                layer.add(onText, offText);


                // moving the switch when clicked (but not only the slider itself)
                layer.on("click", function (e) {
                    if (e.target === slider) {
                        return;
                    }
                    slider.to({
                        x: (slider.x() === homePosition.left.x) ? homePosition.right.x : homePosition.left.x,
                        duration: tweenDuration,
                        onFinish: settings.onChange()
                    });
                    background.to({
                        fill: (slider.x() === homePosition.left.x) ? settings.onBackgroundFill : settings.offBackgroundFill,
                        duration: tweenDuration
                    });
                });


                slider.on("dragstart", function () {
                    background.fill(settings.offBackgroundFill);
                    layer.draw(9);
                });


                // tweening the slider to one end or the other when released
                slider.on("dragend", function () {

                    var switchedOff = this.x() < width / 4;
                    var newX = switchedOff ? homePosition.left.x : homePosition.right.x;
                    var newBackgroundFill = switchedOff ? settings.offBackgroundFill : settings.onBackgroundFill;

                    console.log(switchedOff);

                    this.to({
                        duration: tweenDuration,
                        x: newX,
                        onFinish: settings.onChange()
                    });

                    background.to({
                        fill: newBackgroundFill,
                        duration: tweenDuration
                    });
                });


                layer.add(slider).draw();



                this.getValue = function () {
                    if (slider.x() === homePosition.left.x) {
                        return "on";
                    }
                    return "off";
                };


                this.setValue = function (onOrOff) {
                    slider.to({
                        duration: tweenDuration,
                        x: (onOrOff === "on") ? homePosition.right.x : homePosition.left.x
                    });
                    background.to({
                        fill: (onOrOff === "on") ? settings.onBackgroundFill : settings.offBackgroundFill,
                        duration: tweenDuration
                    });
                };

                this.onChange = function (func) {
                    settings.onChange = func;
                };
            };

        });