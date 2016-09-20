

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
        ['jquery', 'Konva'],
        function ($, Konva) {


            // adding a glowing dot above any word that the slingshot is now targeting
            return function (inputs) {


                // exiting gracefully if the inputs are screwed up
                if (!inputs || typeof inputs !== "object") {
                    console.log("showTaretingMarks requires some parameters!");
                    return;
                }

                if (!(inputs.hasOwnProperty("stage"))) {
                    console.log("showTargetingMarks requires a reference to Konva.Stage as an element in the parameters!");
                }


                // overriding any default settings with the input parameters
                var settings = {
                    glowRadius: 10,
                    glowFadeInDuration: 0.5,
                    dotColor: "red",
                    dotPosition: "over" // set to "below" to place the dot below the targeted word (default is "over")
                };
                $.extend(settings, inputs || {});


                // local variables
                var currentlyTargetedWord = null;
                var fadeInTween;


                // creating a new layer, just for the targeting dots
                var targetLayer = new Konva.Layer();
                settings.stage.add(targetLayer);
                targetLayer.moveToBottom(); // keeping the target glow behind the words (necessary?)


                // adding a glowing dot that highlights whatever word is targeted when the slingshot is stretched
                var targetGlow = new Konva.Circle({
                    opacity: 0,
                    radius: settings.glowRadius,
                    fillRadialGradientStartPoint: {x: 0, y: 0},
                    fillRadialGradientStartRadius: settings.glowRadius / 3,
                    fillRadialGradientEndRadius: settings.glowRadius,
                    fillRadialGradientColorStops: [0, settings.dotColor, 1, "rgba(255, 255, 255, 0)"]
                });
                targetLayer.add(targetGlow);



                /* * * * * * * * * * * * * * * * * * * * * * * * * */



                return function (targetedWord) {


                    // doing nothing if this word is already targeted
                    if (targetedWord === currentlyTargetedWord) {
                        return;
                    }


                    // marking the current word as targeted, if it's the first time
                    currentlyTargetedWord = targetedWord;


                    // if any word is currently targeted
                    if (targetedWord) {


                        // horizontally centering the dot with respect to the target
                        var xPosition = targetedWord.x() + (targetedWord.width / 2);


                        // placing the dot OVER the word (default) or under it (settings: "below")
                        var yPosition = (function () {
                            if (settings.dotPosition === "below") {
                                return targetedWord.y() + targetedWord.height + settings.glowRadius;
                            }
                            return targetedWord.y() - settings.glowRadius * 1.5;
                        }());

                        targetGlow.x(xPosition);
                        targetGlow.y(yPosition);

                        fadeInTween = new Konva.Tween({
                            node: targetGlow,
                            opacity: 1,
                            duration: settings.glowFadeInDuration
                        }).play();
                        return;
                    }


                    // If we're here, then no word is targeted, so hiding the targeting mark
                    targetGlow.opacity(0);


                    // stopping any tweens still in progress
                    if (fadeInTween) {
                        fadeInTween.destroy();
                    }
                    targetLayer.draw();
                };
            };
        });
