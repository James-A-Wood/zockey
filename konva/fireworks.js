/*
 The ball for the fireworks display
 REQUIRES blastCircle - so make sure that's imported first!
 */



define(['jquery', 'Konva', 'konva/blastCircle'], function ($, Konva, blastCircle) {


    return function (stage) {


        // exiting if no stage reference was passed in
        if (!stage) {
            return false;
        }


        // creating a separate layer for fireworks
        var fireworksLayer = new Konva.Layer({
            id: "fireworksLayer"
        });
        stage.add(fireworksLayer);


        return function (inputs) {
            var defaults = {
                numberOfFireworks: 20,
                strokeWidth: 2,
                fill: "yellow",
                onFinish: null,
                messageText: null
            };
            $.extend(defaults, inputs || {});

            var linesArray = [];
            var colorsArray = ["red", "orange", "green", "yellow", "lightblue"];
            var tail = {
                height: 75,
                width: 2,
                color: "orange"
            };

            for (var i = 0; i < defaults.numberOfFireworks; i++) {

                var randomX = (Math.random() * (stage.width() - 200)) + 100;
                var randomY = (Math.random() * (stage.height() - 200)) + 50;

                var line = new Konva.Rect({
                    width: tail.width,
                    height: tail.height,
                    x: randomX,
                    y: randomY + stage.height(), // positioning it below the stage
                    fillLinearGradientStartPoint: {
                        x: 0,
                        y: 0
                    },
                    fillLinearGradientEndPoint: {
                        x: 0,
                        y: 100
                    },
                    fillLinearGradientColorStops: [0, tail.color, 1, "rgba(255, 255, 255, 0)"]
                });

                linesArray.push(line);
                fireworksLayer.add(line);
                line.cache({
                    width: 3,
                    height: 100,
                    x: 0,
                    y: 0
                });
            }
            fireworksLayer.draw();

            // NEW TEST!
            var messageText = (function () {
                var messageText = "";
                if (defaults.messageText) {
                    messageText = new Konva.Text({
                        text: defaults.messageText,
                        width: stage.width(),
                        fontSize: 48,
                        fill: "red",
                        align: "center"
                    });
                    messageText.y(stage.height() / 2 - messageText.height() / 2);
                    fireworksLayer.add(messageText).draw();
                    messageText.cache({
                        x: 0,
                        y: 0,
                        width: messageText.width(),
                        height: messageText.height() + 3
                    });
                }
                return messageText;
            }());

            // firing off one firework at a time
            var fireworksInterval = setInterval(function () {

                // exiting if there are no more fireworks
                if (linesArray.length === 0) {
                    clearInterval(fireworksInterval);
                    return;
                }

                // picking off the first line in the linesArray
                var thisFirework = linesArray.shift();

                shootFirework(thisFirework);

                function shootFirework(thing) {

                    // shooting the firework (line only)
                    var tween = new Konva.Tween({
                        node: thing,
                        duration: 1,
                        y: thing.y() - stage.height(),
                        onFinish: function () {

                            // picking a random color for the firework head
                            var randomColor = colorsArray[Math.floor(Math.random() * colorsArray.length)];

                            // firing off a blastCircle for the firework head
                            blastCircle({
                                x: thing.x(),
                                y: thing.y(),
                                strokeWidth: defaults.strokeWidth,
                                layer: fireworksLayer,
                                radius: 70,
                                stroke: randomColor,
                                fill: defaults.fill
                            });

                            thisFirework.remove();

                            defaults.numberOfFireworks--;

                            // if the last firework has finished...
                            if (defaults.numberOfFireworks === 0) {

                                // removing the messageText, if present
                                if (messageText) {
                                    messageText.clearCache();
                                    var fadeTween = new Konva.Tween({
                                        node: messageText,
                                        duration: 0.5,
                                        opacity: 0,
                                        onFinish: function () {
                                            messageText.remove();
                                            fireworksLayer.draw();
                                        }
                                    }).play();
                                }

                                // performing the callback, if present
                                if (defaults.onFinish) {
                                    defaults.onFinish();
                                }
                            }
                        }
                    }).play();
                }
            }, 50);
        };
    };



});

// constructor
