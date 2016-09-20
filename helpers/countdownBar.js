/*      
 * 
 *      Creates a horizontal moving bar used for countdown timers, etc.
 *      Assumes a Konva.Stage already in place!
 *      
 *      
 */


var CountdownBar = (function() {


    return function(inputParams) {

        // avoiding errors in case no inputParams were passed in
        if (!inputParams) {
            inputParams = {};
        }

        // defaults
        var params = {
            x: inputParams.x || 0,
            y: inputParams.y || 0,
            stage: inputParams.stage,
            layer: inputParams.layer, // reference to layer is REQUIRED!
            width: inputParams.width || 500,
            height: inputParams.height || 20,
            directionsText: inputParams.directionsText || "",
            backgroundFill: inputParams.backgroundFill || "lightblue",
            foregroundFill: inputParams.foregroundFill || "darkblue",
            cornerRadius: inputParams.cornerRadius || 0,
            seconds: inputParams.seconds || 10,
            sparks: inputParams.sparks || false,
            removeOnFinish: true,
            onFinish: inputParams.onFinish || null
        };

        // merging the inputParams-object into the params
        $.extend(params, inputParams || {});

        // setting the maximum cornerRadius to be half the height of the scorebar
        if (params.cornerRadius > params.height / 2) {
            params.cornerRadius = params.height / 2;
        }

        // creating the new layer, and adding it to the stage
        var group = new Konva.Group({
            x: params.x,
            y: params.y
        });
        params.layer.add(group);
        params.layer.draw();

        // the background (static) retangle
        var background = new Konva.Rect({
            y: 24,
            width: params.width,
            height: params.height,
            fill: params.backgroundFill,
            cornerRadius: params.cornerRadius
        });

        // the foreground (moving) rectangle
        var foreground = new Konva.Rect({
            y: 24,
            width: params.height,
            height: params.height,
            fill: params.foregroundFill,
            cornerRadius: params.cornerRadius
        });


        // adding both rectangles to the layer
        group.add(background);
        group.add(foreground);

        if (params.directionsText) {

            // the text
            var directionsText = new Konva.Text({
                y: 0,
                text: params.directionsText,
                fontSize: 18,
                fill: "#EEE"
            });

            // adding the text to the layer
            group.add(directionsText);

            // centering the text horizontally
            directionsText.x((params.width - directionsText.width()) / 2);

        }


        // defining the timer, but not playing it yet!
        var timerTween = new Konva.Tween({
            node: foreground,
            width: background.width(),
            duration: params.seconds,
            onFinish: function() {

                if (params.removeOnFinish) {

                    // centering the text horizontally
                    if (directionsText) {
                        directionsText.text("").text("Go!").fontSize(20);
                        directionsText.x((params.width - directionsText.width()) / 2);
                        params.layer.draw();
                    }


                    // fading out the tween, and removing it
                    var tween = new Konva.Tween({
                        node: group,
                        opacity: 0,
                        duration: 1,
                        onFinish: function() {

                            group.destroy();

                            // calling the 'onFinish' function in the parent (if specified)
                            if (params.onFinish) {
                                params.onFinish();
                            }

                        }

                    });


                    // playing the fade-out tween after a slight pause
                    setTimeout(function() {
                        tween.play();
                    }, 1000);

                } else {

                    // calling the 'onFinish' function in the parent (if specified)
                    if (params.onFinish) {
                        params.onFinish();
                    }
                }
            }
        });


        // starting the timer using the 'startTimer' method!
        return {
            startTimer: function(delay) {

                if (!delay || isNaN(delay)) {
                    delay = 0;
                }

                if (params.directionsText) {

                    var remainingSeconds = params.seconds;
                    var timer = setInterval(updateText, 1000);

                    function updateText() {

                        // exiting if we're past the limit
                        if (remainingSeconds <= 0) {
                            clearInterval(timer);
                        }

                        // refreshing the text...
                        if (remainingSeconds > 0) {
                            directionsText.text(params.directionsText + " ( " + remainingSeconds + " )");
                            group.draw();
                        }

                        // incrementing the remainingSeconds
                        remainingSeconds -= 1;
                    }
                }


                // adding fusey-sparky things, if called for
                if (params.sparks) {

                    var sparks = new Konva.Star({
                        y: params.height / 2,
                        numPoints: 12,
                        innerRadius: 2,
                        outerRadius: 10,
                        stroke: "yellow",
                        strokeWidth: 1,
                        fill: "yellow"
                    });

                    group.add(sparks);

                    var sparksTween = new Konva.Tween({
                        node: sparks,
                        duration: params.seconds,
                        rotation: 360 * -40,
                        x: sparks.x() + background.width()
                    }).play();

                }

                // executing the tween, after a delay (input parameter)
                setTimeout(function() {
                    timerTween.play();
                }, delay);
            }
        };
    };
}());




    