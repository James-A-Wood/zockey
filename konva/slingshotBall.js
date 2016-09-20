/*
 The ball for Slingshot
 */


define(
        [
            "jquery",
            "Konva",
            "konva/blastCircle",
            "helpers/lineIntersectsRectangle",
            "helpers/SoundEffects",
            "konva/slingshotBallRubberband",
            "tools"
        ],
        function ($, Konva, blastCircleFactory, lineIntersectsRectangle, SoundEffects, slingshotBallRubberband, tools) {


            // adding a sound effect for the hit
            var soundEffects;


            return function (inputs) {


                // settings
                var settings = $.extend({
                    stage: null, // required
                    layer: null, // optional - one is created if not passed in
                    radius: 10,
                    speed: 5,
                    targets: [], // array of things to hit (or avoid...)
                    ballHome: {
                        x: 100,
                        y: 100
                    },
                    shootTweenDuration: 750,
                    highlightTargeted: null, // holds a function that does something when a word is targeted
                    sounds: true,
                    hitSoundSource: "/sounds/slingshot/hit.mp3",
                    shootSoundSource: "/sounds/slingshot/shoot.mp3",
                    gravity: 9,
                    goalPostSpread: 75,
                    goalPostColor: "gray",
                    goalPostRadius: 3,
                    blastCircleStroke: "gray",
                    blastCircleRadius: 50,
                    blastCircleStrokeWidth: 2,
                    rubberbandColor: "lightgray",
                    rubberbandWidth: 1,
                    onShoot: function () {
                        // callback executed when the ball is shot
                    },
                    onHit: function () {
                        // callback executed on target hit
                    }
                }, inputs || {});


                if (!settings.stage) {
                    console.log("tools.slingshotBall requires a reference to the stage!");
                    return false;
                }


                // adding sound effects, if they haven't been added already (on last instantiation of the slingshotBall)
                if (!soundEffects) {
                    soundEffects = new SoundEffects({
                        container: $("#sound-effects-checkbox-stuff"),
                        playThisOnCheckboxCheck: "hitSound",
                        sounds: {
                            hitSound: settings.hitSoundSource,
                            shootSound: settings.shootSoundSource
                        }
                    });
                }


                // adding an array to hold all setIntervals
                var intervals = {};


                // saving variables to make our code cleaner below
                var radius = settings.radius;
                var stageWidth = settings.stage.width();
                var stageHeight = settings.stage.height();
                var animation;
                var isMobile = tools.isMobile();


                // setting lines that denote the borders
                var border = {
                    left: {
                        x: radius, // accounting for the circle edge, not just the center point
                        y: -radius * 2,
                        height: stageHeight + (radius * 4),
                        width: 0
                    },
                    right: {
                        x: stageWidth - radius, // accounting for the circle edge, not just the center point
                        y: -radius * 2,
                        height: stageHeight + (radius * 4),
                        width: 0
                    },
                    top: {
                        x: -radius * 2, // accounting for the circle edge, not just the center point
                        y: radius,
                        height: 0,
                        width: stageWidth + (radius * 4)
                    },
                    bottom: {
                        x: -radius * 2, // accounting for the circle edge, not just the center point
                        y: stageHeight + (radius * 6),
                        height: 0,
                        width: stageWidth + (radius * 4)
                    }
                };


                // instantiating a layer for the ball, and adding it to the stage referenced above
                var ballLayer = settings.layer || (function () {
                    var layer = new Konva.Layer();
                    (settings.stage).add(layer);
                    return layer;
                }());


                var newBall = (function () {


                    var masterBall = new Konva.Circle({
                        radius: radius,
                        // leaving a wider white "donut" in the center (actually slightly offset)
                        fillRadialGradientStartRadius: 2,
                        fillRadialGradientEndRadius: radius,
                        // radial start point is off-center, making a directional lighting effect
                        fillRadialGradientStartPoint: {
                            x: -1,
                            y: -1
                        },
                        fillRadialGradientColorStops: [0, "#DDD", 1, "#44A"],
                        x: settings.ballHome.x,
                        y: settings.ballHome.y,
                        draggable: true,
                        shadowColor: "rgba(0, 0, 0, 0.2)",
                        shadowOffset: {
                            x: 4,
                            y: 4
                        },
                        shadowBlur: 3,
                        // keeping the ball's upper drag limit to 50 pixels below the words (to avoid cheating)
                        dragBoundFunc: function (pos) {


                            if (settings.targets.length === 0) {
                                return pos;
                            }


                            return {
                                x: pos.x,
                                y: (function () {

                                    // stopping 50 pixels before the targets
                                    var lineBelowTargets = settings.targets[0].y() + 50;
                                    if (pos.y < lineBelowTargets) {
                                        return lineBelowTargets;
                                    }

                                    // stopping at the bottom edge
                                    if (isMobile && pos.y > (stageHeight - radius)) {
                                        return stageHeight - radius;
                                    }

                                    return pos.y;
                                }())
                            };
                        },
                        // making the 'draggable' region around the circle wider than the circle radius itself
                        // also, making the 'draggable' region even wider when we're on a mobile device
                        hitFunc: function (context) {
                            context.beginPath();
                            context.arc(0, 0, this.radius() + (tools.isMobile() ? 75 : 30), 0, Math.PI * 2, true); // was '100' for mobile
                            context.closePath();
                            context.fillStrokeShape(this);
                        }
                    });


                    // setting the master ball 
                    masterBall.x((settings.stage).width() + radius); // offstage
                    ballLayer.add(masterBall);
                    masterBall.cache();


                    // returning a CLONE of the masterBall
                    return function () {

                        var thisBall = masterBall.clone();

                        thisBall.setAttrs({
                            x: settings.ballHome.x,
                            y: settings.ballHome.y,
                            opacity: 0,
//                            inertia: [],
                            layer: ballLayer
                        });

                        return  thisBall;
                    };
                }());
                var ball = newBall();


                ball.returnHomeAndFadeIn = function (object) {


                    // if no object is passed in, then setting it to an empty object
                    object = object || {};


                    // setting object's properties (delay, fadeInTime) to default values
                    object.delay = object.delay || 0;
                    object.fadeInTime = object.fadeInTime || 0.3;
                    object.onFinish = object.onFinish || null;
                    object.easing = object.easing ? Konva.Easings[object.easing] : Konva.Easings.EaseOut;


                    // returning the ball home, scaling it to 0, and turning on listening
                    ball.x(settings.ballHome.x);
                    ball.y(settings.ballHome.y);
                    ball.scale({
                        x: 0,
                        y: 0
                    });
                    ball.opacity(1);
                    ball.listening(true);


                    // fading in the ball
                    var fadeInTween = new Konva.Tween({
                        node: ball,
                        scaleX: 1,
                        scaleY: 1,
                        duration: object.fadeInTime,
                        easing: object.easing,
                        onFinish: function () {
                            if (object.onFinish) {
                                object.onFinish();
                            }
                        }
                    });


                    // fading in the ball, after a delay, if specified
                    setTimeout(function () {
                        fadeInTween.play();
                    }, object.delay);


                    // returning the Tween object, so we can cancel it later
                    return fadeInTween;
                };


                // adding the ball AFTER adding the rubberband
                ballLayer.add(ball);


                // caching - have to cache AROUND the ball for hitFunc to work right
                ball.cache({
                    x: -(tools.isMobile() ? 75 : 30),
                    y: -(tools.isMobile() ? 75 : 30),
                    height: 2 * (tools.isMobile() ? 75 : 30),
                    width: 2 * (tools.isMobile() ? 75 : 30)
                });


                ball.returnHomeAndFadeIn({
                    delay: 0,
                    fadeInTime: 1
                });


                // adding a rubberband & goalposts, unless specifically set not to
                var rubberband = (settings.rubberband === false) ? null : slingshotBallRubberband({
                    settings: settings,
                    ball: ball,
                    layer: ballLayer
                });


                // shooting the ball when it's released
                ball.on("dragend", shootBall);
                function shootBall() {


                    // erasing any highlighting on the targeted word
                    if (settings.highlightTargeted) {
                        settings.highlightTargeted(false);
                    }


                    // turning off listening for slightly better performance
                    ball.listening(false);


                    // performing any on-shoot functionality, if specified (usually, doing 'score.number_mistakes++')
                    settings.onShoot();


                    // playing the sound, if set and loaded
                    soundEffects.play("shootSound");


                    // setting the distance pulled away from ballHome as the base distance
                    // the ball should travel per second
                    ball.inertia = {
                        x: ball.x() - settings.ballHome.x,
                        y: ball.y() - settings.ballHome.y
                    };


                    // calculating how fast the ball was traveling when it was released
                    var initialVelocity = (function () {
                        var x2 = Math.pow(ball.inertia.x, 2);
                        var y2 = Math.pow(ball.inertia.y, 2);
                        return Math.sqrt(x2 + y2);
                    }());


                    var gravity = settings.gravity * settings.speed; // pixels per second to decelerate Y


                    // returns the strength of the hit
                    ball.currentX = ball.x();
                    ball.currentY = ball.y();


                    // checking for hits, etc., using the Konva Animation.  Cool!
                    animation = new Konva.Animation(animateBallLayer, ballLayer);
                    animation.start();


                    function animateBallLayer(frame) {


                        // keeping track of the old ball position
                        ball.currentX = ball.x();
                        ball.currentY = ball.y();


                        // calculating the new position
                        var newX = ball.currentX - ball.inertia.x * settings.speed * frame.timeDiff / 1000;
                        var newY = ball.currentY - ball.inertia.y * settings.speed * frame.timeDiff / 1000;


                        // returns how fast the ball is traveling, relative to its initialVelocity
                        ball.impactForce = (function () {
                            var travelX = Math.pow(ball.currentX - newX, 2);
                            var travelY = Math.pow(ball.currentY - newY, 2);
                            var impactForce = Math.sqrt(travelX + travelY) / initialVelocity;
                            return impactForce * settings.speed;
                        }());


                        // calculating a line from the current XY to the new XY, to see if it intersects with anything
                        var line = {
                            x1: ball.currentX,
                            y1: ball.currentY,
                            x2: newX,
                            y2: newY
                        };


                        // applying gravity to drag the ball slowly down
                        ball.inertia.y -= (frame.timeDiff / 1000) * gravity;


                        // noting which direction the ball is moving, 
                        // so we can avoid unnecessary checks
                        ball.goingUp = ball.inertia.y > 0;
                        ball.goingDown = ball.inertia.y < 0;
                        ball.goingRight = ball.inertia.x > 0;
                        ball.goingLeft = ball.inertia.x < 0;


                        // checking for out-of-bounds - crossing the border, or actually over the border (for whatever reason)
                        if ((ball.goingUp && lineIntersectsRectangle(line, border.top)) || newY < radius) {
                            ricochet({direction: "bottom", XY: "y", value: (radius + 1)});
                            return;
                        }


                        // checking for left border hit
                        if ((ball.goingLeft && lineIntersectsRectangle(line, border.left)) || newX < radius) {
                            ricochet({direction: "right", XY: "x", value: (radius + 1)});
                            return;
                        }


                        // checking for right border hit
                        if ((ball.goingRight && lineIntersectsRectangle(line, border.right)) || newX > (stageWidth - radius)) { // newX was: ball.currentX
                            ricochet({direction: "left", XY: "x", value: (stageWidth - radius - 1)});
                            return;
                        }


                        // checking for off-the-bottom -- use ball.currentY, not newY, 
                        // because we're testing for where the ball REALLY IS, not where it WILL be
                        if (ball.goingDown && ball.currentY > (stageHeight + radius * 3)) {
                            returnHome();
                            return;
                        }


                        // catch-all scenario, if the ball has somehow gotten completely off screen
//                        if (ball.x() < -(radius * 2) ||
//                                ball.x() > stageWidth + (radius * 2) ||
//                                ball.y() < -(radius * 2) ||
//                                ball.y() > stageHeight + 500) {
//                            returnHome();
//                            return;
//                        }


                        // simply redrawing the ball, if there are no targets (unlikely...)
                        if (settings.targets.length === 0) {
                            ball.x(newX).y(newY);
                            return true;
                        }


                        // checking for target hit (returning once any block is hit)
                        settings.targets.some(function (thisBlock) {


                            // NEW TEST thisBlock.width may be a property or function, so handling that!
                            thisBlock.width = (typeof thisBlock.width === "function" ? thisBlock.width() : thisBlock.width);
                            thisBlock.height = (typeof thisBlock.height === "function" ? thisBlock.height() : thisBlock.height);


                            var ballLeft = newX - radius;
                            var ballRight = newX + radius;
                            var ballTop = newY - radius;
                            var ballBottom = newY + radius;


                            var blockLeft = thisBlock.x();
                            var blockRight = blockLeft + thisBlock.width; // NEW TEST removed parentheses
                            var blockTop = thisBlock.y();
                            var blockBottom = blockTop + thisBlock.height; // NEW TEST removed parentheses


                            var rect = {
                                x: blockLeft - radius, // accounting for the circle edge, not just the center point
                                y: blockTop - radius,
                                height: thisBlock.height + (radius * 2),
                                width: thisBlock.width + (radius * 2)
                            };


                            // testing for intersection
                            if (lineIntersectsRectangle(line, rect)) {


                                var overlapT = ballBottom - blockTop;
                                var overlapB = blockBottom - ballTop;
                                var overlapL = ballRight - blockLeft;
                                var overlapR = blockRight - ballLeft;


                                if (overlapT === Math.min.apply(null, [overlapT, overlapB, overlapL, overlapR])) {
                                    ball.hitFromDirection = "top";
                                    ball.y(rect.y - 2); // setting ball.x() slightly away from the border
                                }

                                if (overlapB === Math.min.apply(null, [overlapT, overlapB, overlapL, overlapR])) {
                                    ball.hitFromDirection = "bottom";
                                    ball.y(rect.y + rect.height + 2); // setting ball.x() slightly away from the border
                                }

                                if (overlapL === Math.min.apply(null, [overlapT, overlapB, overlapL, overlapR])) {
                                    ball.hitFromDirection = "left";
                                    ball.x(rect.x - 2); // setting ball.x() slightly away from the border
                                }

                                if (overlapR === Math.min.apply(null, [overlapT, overlapB, overlapL, overlapR])) {
                                    ball.hitFromDirection = "right";
                                    ball.x(rect.x + rect.width + 2); // setting ball.x() slightly away from the border
                                }


                                // saving the currentX and currentY values
                                ball.currentX = ball.x();
                                ball.currentY = ball.y();


                                // checking whether it's the right word or not from the main class
                                var isCorrect = settings.onHit(thisBlock);


                                // if we've hit the correct target...
                                if (isCorrect) {
                                    soundEffects.play("hitSound");
                                    ball.opacity(0); // hiding, but not (yet) removing the ball
                                    makeBlastCircle(thisBlock.x() + thisBlock.width / 2, thisBlock.y() + thisBlock.height / 2);
                                    returnHome();
                                } else {
                                    ricochet({direction: ball.hitFromDirection});
                                }

                                return true;
                            } else {
                                ball.x(newX).y(newY);
                            }
                        });
                    }
                }


                function returnHome() {


                    // stopping the animation
                    animation.stop();


                    // setting any remaining inertia to 0
                    ball.inertia = {
                        x: 0,
                        y: 0
                    };


                    // fading out the ball quickly (opacity only, not radius) before returning it home
                    ball.to({
                        duration: 0.2,
                        opacity: 0,
                        easing: Konva.Easings.EaseIn,
                        onFinish: function () {


                            // expanding the ball from 0 to its full radius, once it's back in its home position
                            var thisTween = ball.returnHomeAndFadeIn();


                            // if the ball is dragged while still tweening, then jumping to the end of the tween (so the ball is fully enlarged)
                            ball.off("dragstart").on("dragstart", function () {
                                ball.off("dragstart");
                                thisTween.finish();
                            });
                        }
                    });
                }


                function makeBlastCircle(x, y) {


                    blastCircleFactory({
                        stage: settings.stage,
                        layer: ballLayer,
                        x: x,
                        y: y,
                        duration: 1,
                        radius: settings.blastCircleRadius,
                        strokeWidth: settings.blastCircleStrokeWidth,
                        stroke: settings.blastCircleStroke,
                        squishY: false,
                        shape: settings.blastCircleShape || "circle",
                        // FOLLOWING LINES are new, because we're making a star
                        innerRadius: settings.blastCircleInnerRadius || 30, // NEW TEST
                        outerRadius: settings.blastCircleOuterRadius || 50, // NEW TEST
                        fill: settings.blastCircleFill ? settings.blastCircleFill : null
                    });
                }


                var ricochet = (function () {


                    var ricochetSoundLastPlayed = (new Date()).getTime();


                    return function (p) {


                        // checking parameters
                        if (!p || typeof p !== "object" || !p.direction) {
                            console.log("Ricochet didn't recieve the right parameters!");
                            return false;
                        }


                        var direction = p.direction;
                        var XY = p.XY;
                        var value = p.value;


                        // ensuring we don't play the ricochet sound twice in a row (particularly for the same ricochet event)
                        var currentTime = (new Date()).getTime();
                        if (currentTime - ricochetSoundLastPlayed > 50) {
                            soundEffects.play("hitSound");
                            ricochetSoundLastPlayed = currentTime;
                        }


                        if (direction === "bottom") {
                            // making ball's Y interia NEGATIVE
                            ball.inertia.y = -Math.abs(ball.inertia.y);
                        } else if (direction === "top") {
                            // making ball's Y interia POSITIVE
                            ball.inertia.y = Math.abs(ball.inertia.y);
                        } else if (direction === "right") {
                            // making ball's X interia NEGATIVE
                            ball.inertia.x = -Math.abs(ball.inertia.x);
                        } else if (direction === "left") {
                            // making ball's X interia POSITIVE
                            ball.inertia.x = Math.abs(ball.inertia.x);
                        }


                        // forcing the x or y value, if passed in
                        if (XY && value !== "undefined") {
                            ball[XY](value);
                            ball.currentX = ball.x();
                            ball.currentY = ball.y();
//                            ballLayer.draw();
                        }
                    };
                }());


                // handling when targets are targeted
                if (settings.highlightTargeted) {


                    ball.on("dragmove", function () {

                        var accelerationFactor = stageHeight / (stageHeight - settings.ballHome.y);
                        var destination = {
                            x: settings.ballHome.x - (this.x() - settings.ballHome.x) * accelerationFactor,
                            y: settings.ballHome.y - (this.y() - settings.ballHome.y) * accelerationFactor
                        };


                        // checking for hit trajectory on ball release
                        var line = {
                            x1: this.x(),
                            y1: this.y(),
                            x2: destination.x,
                            y2: destination.y
                        };


                        // looping through all the targets, and finding if there is a hit
                        for (var i = 0; i < settings.targets.length; i++) {


                            var thisRect = settings.targets[i];
                            var rect = {
                                x: thisRect.x() - radius, // accounting for the circle edge, not just the center point
                                y: thisRect.y() - radius,
                                height: thisRect.height + radius * 2,
                                width: thisRect.width + radius * 2
                            };


                            // testing for intersection -- THIS FUCKING WORKS!
                            var doesIntersect = lineIntersectsRectangle(line, rect);
                            if (doesIntersect) {


                                // reporting that thisRect is now highlighted, and returning
                                settings.highlightTargeted(thisRect);
                                return;
                            }
                        }


                        // reporting that no target is highlighted now
                        settings.highlightTargeted(false);
                    });
                }


                // Adding a "remove" function that removes the whole ballLayer, 
                // so we can insert a new ball and layer from scratch
                ball.remove = function () {


                    animation.stop();


                    // clearing all the intervals, saved in the 'intervals' object
                    for (var interval in intervals) {
                        clearInterval(interval);
                    }


                    // removing the rubberband, if being used
                    if (rubberband) {
                        rubberband.remove();
                    }


                    // removing the layer
                    ballLayer.remove();
                };


                // NEW TEST setting new targets
                ball.targets = function (array) {
                    settings.targets = array;
                };


                // NEW TEST telling the ball which element is the correct target
//                ball.markCorrectTarget = function (konvaElement) {
//                    konvaElement.isCorrectTarget = true;
//                };


                // returning the completed ball
                return ball;
            };

        });
