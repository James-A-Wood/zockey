

define(
        [
            "jquery",
            "Konva",
            "konva/blastCircle",
            "howler"
        ],
        function ($, Konva, BlastCircle) {


            // pre-loading the movement sound
            var movementSound = new Howl({
                urls: ["/sounds/pac_man/movementSound.mp3"],
                loop: true
            });
            movementSound.playing = false;
            
            
            var pacManDie = new Howl({
                urls: ["/sounds/pac_man/pacManDie.mp3"]
            });


            var startText;


            return function (inputs) {


                // settings
                var settings = $.extend({
                    parentLayer: null, // Necessary!
                    blastCircleOnDie: true,
                    bodyColors: ["#339", "green", "orange", "red"],
                    boundaries: null, // can set to "stage"
                    disableOnStartup: false,
                    fill: "#090",
                    frameRate: 30, // has no effect on actual speed
                    growOnBirth: true,
                    hittables: [], // [array-of-objects-to-check, callback-on-hit ]
                    id: "pacMan",
                    mouthOpenDegrees: 90,
                    obstacles: [], // array of thing pacMan will stop at, but no callbacks
                    pakuInterval: 0.15,
                    playBirthSound: true,
                    radius: 20,
                    speed: 200, // pixels per second, the higher the faster
                    useBlastCircleBeforeBirth: false,
                    // by default, using soundEffects.  But pass in a function that may return False, if we want to mute soundEffects
                    useSoundEffects: function () {
                        return true;
                    }
                }, inputs || {});


                settings.soundEffects.addSounds({
                    birthSound: "/sounds/pac_man/birthSound.mp3"
                });


                // private variables
                var pakuModeOn = false;
                var keysDown = {};


                // calculating the dimensions of the obstacles, which must be STATIC, not moving
                var obstacles = (function () {


                    var array = [];
                    settings.obstacles.forEach(function (thisObstacle) {
                        var object = {
                            left: thisObstacle.x(),
                            right: thisObstacle.x() + thisObstacle.width || thisObstacle.width(),
                            top: thisObstacle.y(),
                            bottom: thisObstacle.y() + thisObstacle.height || thisObstacle.height()
                        };
                        array.push(object);
                    });


                    return array;
                }());


                // the pacMan wedge itself
                var pacManBody = new Konva.Wedge({
                    radius: settings.radius,
                    rotation: 30, // mouth slightly open at start
                    angle: 300
                });
                pacManBody.width = pacManBody.radius() * 2;
                pacManBody.height = pacManBody.radius() * 2;


                // filling the body with teh specified color, in a complelling gradient pattern
                fillBody(settings.fill);


                // the group, necessary for rotating pacMan
                var pacMan = new Konva.Group({
                    id: settings.id
                });


                // adding width & height properties, because the group doeesn't support them directly
                pacMan.width = pacManBody.radius() * 2;
                pacMan.height = pacManBody.radius() * 2;


                /*
                 * 
                 *  pacMan methods!
                 * 
                 */


                pacMan.disable = function disable() {
                    pacMan.moveWithArrowKeys = false;
                };


                pacMan.enable = function enable() {
                    if (startText) {
                        startText.remove();

                    }
                    pacMan.moveWithArrowKeys = true;
                };


                pacMan.add(pacManBody);


                if (settings.disableOnStartup) {
                    pacMan.moveWithArrowKeys = false;
                } else {
                    pacMan.moveWithArrowKeys = true;
                }


                // keyup & keydown listeners - to move pacMan, and to control mouth pakuing
                $("html").on("keydown", keyDownhandler);
                $("html").on("keyup", keyUpHandler);


                function keyDownhandler(e) {


                    // only doing anything if it's an arrow key, between keyCodes 37 and 40, inclusive
                    if (e.keyCode >= 37 && e.keyCode <= 40) {


                        // prevents the screen from scrolling by array key
                        e.preventDefault();


                        // exiting if we're not moving with arrow keys
                        if (!pacMan.moveWithArrowKeys) {
                            return;
                        }


                        keysDown[e.keyCode] = true;
                        if (!pakuModeOn) {
                            pakuModeOn = true;
                            startPakuing();
                        }
                    }
                }


                function keyUpHandler(e) {
                    delete keysDown[e.keyCode];
                    var turnOnPakuMode = false;
                    for (var i = 37; i <= 40; i++) {
                        e.preventDefault();
                        if (keysDown[i] === true) {
                            turnOnPakuMode = true;
                        }
                    }
                    pakuModeOn = turnOnPakuMode;
                }


                // checking for arrow presses 30 times per second (default frame rate)
                (function () {

                    // local variables
                    var previousOrientation = null;
                    var directions = {
                        37: {
                            x: -1,
                            y: 0,
                            rotation: 180
                        },
                        38: {
                            x: 0,
                            y: -1,
                            rotation: 270
                        },
                        39: {
                            x: 1,
                            y: 0,
                            rotation: 0
                        },
                        40: {
                            x: 0,
                            y: 1,
                            rotation: 90
                        }
                    };


                    pacMan.checkInterval = setInterval(slidePacMan, 1000 / settings.frameRate); // default frameRate is 30, so 33.3 milliseconds
                    function slidePacMan() {


                        if (!pacMan.moveWithArrowKeys) {
                            return;
                        }


                        // exiting (& stopping movement sound) if no arrow keys are pressed
                        if (Object.keys(keysDown).length === 0) {
                            
                            try {
                                movementSound.pause();
                                movementSound.playing = false;
                            } catch (e) {
                                //
                            }
                            return;
                        }


                        try {
                            if (!movementSound.playing) {


                                // only playing 
                                if (settings.useSoundEffects()) {
                                    movementSound.play();
                                    movementSound.playing = true;
                                }
                            }
                        } catch (e) {
                            //
                        }


                        // slowing speed to x0.7 if 2 or more keys are pressed
                        var adjustedSpeed = (Object.keys(keysDown).length > 1) ? (settings.speed * 0.8) / settings.frameRate : settings.speed / settings.frameRate;
                        var newOrientation = 0;


                        // setting newX & newY to pacMan's current coordinates to start with
                        var newX = pacMan.x();
                        var newY = pacMan.y();


                        // calculating pacMan's boundaries
                        var pm = {
                            top: newY - settings.radius,
                            bottom: newY + settings.radius,
                            right: newX + settings.radius,
                            left: newX - settings.radius
                        };


                        // cycling through the arrow keys, calculating newX & newY and sliding pacMan
                        for (var i = 37; i <= 40; i++) {
                            if (keysDown[i] === true) {
                                newX += adjustedSpeed * directions[i].x;
                                newY += adjustedSpeed * directions[i].y;
                                newOrientation += directions[i].rotation;
                            }
                        }


                        // stopping pacMan at boundaries, if defined
                        if (settings.boundaries) {

                            var radius = settings.radius;
                            var box = settings.boundaries;

                            if (newX - radius < box.x()) {
                                newX = radius + box.x();
                            }
                            if (newX + radius > box.x() + box.width()) {
                                newX = box.x() + box.width() - radius;
                            }
                            if (newY - radius < box.y()) {
                                newY = radius + box.y();
                            }
                            if (newY + radius > box.y() + box.height()) {
                                newY = box.y() + box.height() - radius;
                            }
                        }


                        // stopping pacMan at obstacles, if any
                        if (settings.obstacles) {

                            obstacles.forEach(function (ob) {

                                var radius = settings.radius;

                                if ((newX < ob.left) && (newX + radius > ob.left) && (newY + radius > ob.top) && (newY - radius < ob.bottom)) {
                                    newX = ob.left - radius;
                                }

                                if ((newX > ob.right) && (newX - radius < ob.right) && (newY + radius > ob.top) && (newY - radius < ob.bottom)) {
                                    newX = ob.right + radius;
                                }

                                if ((newY > ob.bottom) && (newY - radius < ob.bottom) && (newX + radius > ob.left) && (newX - radius < ob.right)) {
                                    newY = ob.bottom + radius;
                                }

                                if ((newY < ob.top) && (newY + radius > ob.top) && (newX + radius > ob.left) && (newX - radius < ob.right)) {
                                    newY = ob.top - radius;
                                }
                            });
                        }


                        // sliding the pacMan (not the body itself) to the new X & Y coordinates
                        pacMan.x(newX);
                        pacMan.y(newY);



                        // calcuating new rotation
                        newOrientation = newOrientation / Object.keys(keysDown).length;
                        if (keysDown[38] && keysDown[39]) {
                            newOrientation = 315;
                        }


                        // initiating the turning tween, if one isn't already in process
                        if ((newOrientation !== previousOrientation)) {
                            previousOrientation = newOrientation;
                            var rotate = new Konva.Tween({
                                node: pacMan,
                                rotation: newOrientation,
                                duration: 0.1
                            }).play();
                        }


                        // cycling through the 'hittables' stuff, checking for hits, and executing the appropriate callback in that event
                        settings.hittables.forEach(function (hittable) {

                            var array = hittable[0];
                            var callback = hittable[1];

                            checkForHit(array, callback);
                        });


                        function checkForHit(array, callback) {


                            // exiting if there is no array or valid callback function
                            if (!array || !callback) {
                                return;
                            }


                            // cycling through the settings.hittables array backwards, to make splicing easier
                            array.forEach(function (wordBlock) {


                                // calculating the boundaries of each word
                                var target = {
                                    left: wordBlock.x(),
                                    right: wordBlock.x() + wordBlock.width || wordBlock.width(),
                                    top: wordBlock.y(),
                                    bottom: wordBlock.y() + wordBlock.height || wordBlock.height()
                                };


                                // checking for any overlap (or, technically, LACK of overlap)
                                if (!(pm.right < target.left || pm.left > target.right || pm.bottom < target.top || pm.top > target.bottom)) {
                                    callback(wordBlock);
                                }
                            });
                        }
                    }
                }());


                pacMan.startText = function (inputs) {


                    var startTextSettings = $.extend({
                        text: "Click to\nStart",
                        fill: "green",
                        fontSize: 12,
                        onClick: null,
                        align: "center",
                        showDelay: 0,
                        useBlastCircle: true
                    }, inputs || {});


                    startText = new Konva.Text({
                        text: startTextSettings.text,
                        align: startTextSettings.align,
                        fontSize: startTextSettings.fontSize,
                        fill: startTextSettings.fill
                    });


                    var showDelay = setTimeout(function () {
                        pacMan.add(startText);
                        startText.y(pacManBody.radius());
                        startText.offsetX(startText.width() / 2);
                        settings.parentLayer.draw();
                    }, startTextSettings.showDelay);


                    pacMan.on("click tap", removeStartText);
                    function removeStartText() {


                        pacMan.off("click", removeStartText);
                        startText.remove();
                        clearTimeout(showDelay);
                        settings.parentLayer.draw();


                        if (startTextSettings.onClick) {
                            startTextSettings.onClick();
                        }
                    }
                };


                pacMan.die = function () {


                    // turning off listeners
                    pacMan.moveWithArrowKeys = false;
                    pakuModeOn = false;
                    keysDown = {};
                    pacManBody.angle(360);

                    movementSound.pause();
                    movementSound.playing = false;

                    setTimeout(function () {
                        // clearing the setInterval (necessary for audio reasons...)
                        clearInterval(pacMan.checkInterval);


                        settings.soundEffects.play("pacManDie");
                        var dieTween = new Konva.Tween({
                            node: pacManBody,
                            duration: pacManDie._duration,
                            angle: 0,
                            rotation: 180,
                            onFinish: function () {


                                if (settings.blastCircleOnDie) {
                                    try {
                                        var blastCircle = BlastCircle({
                                            layer: settings.parentLayer,
                                            x: pacMan.x(),
                                            y: pacMan.y(),
                                            strokeWidth: 3
                                        });
                                    } catch (e) {
                                    }
                                }
                            }
                        }).play();
                    }, 1000);
                };


                // increasing pacMan's speed
                pacMan.speedUp = (function () {


                    var speedLevel = 0;


                    return function (speedUpAmount) {


                        if (!speedUpAmount || isNaN(speedUpAmount)) {
                            speedUpAmount = 50;
                        }


                        if (speedLevel < settings.bodyColors.length) {
                            speedLevel += 1;
                        }


                        settings.speed += speedUpAmount;
                        fillBody(settings.bodyColors[speedLevel]);
                    };
                }());


                pacMan.stop = function () {


                    keysDown = {};
                    clearInterval(pacMan.checkInterval);
                    pacMan.moveWithArrowKeys = false;


                    if (movementSound) {
                        movementSound.pause();
                        movementSound.playing = false;
                    }
                };


                // scaling pacMan...
                pacMan.scale = (function () {


                    // local variable
                    var currentScale;


                    return function (scale, duration, bounce) {


                        // setting to OFF first, until we're sure we're expanding and not contracting
                        pacMan.moveWithArrowKeys = false;


                        if (!scale || isNaN(scale)) {
                            return currentScale;
                        }


                        // if pacMan is just appearing, without growing from nothing
                        if (!duration) { // was duration === 0


                            pacManBody.scaleX(scale);
                            pacManBody.scaleY(scale);
                            currentScale = scale;
                            settings.parentLayer.draw();


                            return true;
                        }


                        currentScale = scale;
                        var tween = new Konva.Tween({
                            node: pacManBody,
                            duration: duration || 1, // one second by default
                            scaleX: scale,
                            scaleY: scale,
                            easing: bounce ? Konva.Easings.BounceEaseOut : Konva.Easings.EaseOut,
                            onFinish: function () {
                                settings.radius = settings.radius * scale;
                            }
                        }).play();

                        // playing the birthSound, maybe...
                        if (settings.playBirthSound) {
                            settings.soundEffects.play("birthSound")
                        }
                    };
                }());


                pacMan.flash = function () {
                    var circle = new Konva.Circle({
                        fill: "white",
                        opacity: 1,
                        radius: pacManBody.radius()
                    });
                    pacMan.add(circle);
                    var tween = new Konva.Tween({
                        node: circle,
                        opacity: 0,
                        duration: 0.5,
                        onFinish: function () {
                            circle.remove();
                        }
                    }).play();
                };


                pacMan.shrinkAway = function (callback) {
                    pacMan.moveWithArrowKeys = false;
                    clearInterval(pacMan.checkInterval);
                    var tween = new Konva.Tween({
                        node: pacManBody,
                        radius: 0.01,
                        duration: 1,
                        onFinish: function () {
                            pacMan.remove();
                            if (callback) {
                                setTimeout(callback, 1000);
                            }
                        }
                    }).play();
                };


                pacMan.removeMe = function () {
                    pacMan.moveWithArrowKeys = false;
                    clearInterval(pacMan.checkInterval);
                    pacMan.remove();
                };



                // finally, displaying pacMan
                if (settings.growOnBirth) {


                    // making pacMan really tiny to start with
                    pacMan.scale(0.01, 0);


                    // if we're not using a reverse blastCircle before pacMan's birth, then just increasing scale
                    if (!settings.useBlastCircleBeforeBirth) {
                        setTimeout(function () {
                            pacMan.scale(1, 0.5);
                        }, 1000);
                    } else {


                        // ... or, if we ARE using a reverse blastCircle to herald the impending birth... 
                        setTimeout(function () {
                            var blastCircle = BlastCircle({
                                layer: settings.parentLayer,
                                x: pacMan.x(),
                                y: pacMan.y(),
                                strokeWidth: 1,
                                radius: pacMan.width,
                                duration: 1.5,
                                numCircles: 1,
                                stroke: "green",
                                reverseMode: true,
                                callback: function () {
                                    pacMan.scale(1, 0.5);
                                }
                            });
                        }, 1000);
                    }
                }


                function fillBody(color) {
                    pacManBody.fillRadialGradientEndRadius(pacManBody.radius());
                    pacManBody.fillRadialGradientColorStops([0, "white", 1, color]);
                    settings.parentLayer.draw();
                }


                function startPakuing() {


                    pakuModeOn = true;


                    // closing the mouth before starting pakuing
                    pacManBody.angle(360);
                    pacManBody.rotation(0);


                    // tweens the mouth open from a close state
                    var tween = new Konva.Tween({
                        node: pacManBody,
                        rotation: settings.mouthOpenDegrees * 0.5,
                        angle: 360 - settings.mouthOpenDegrees,
                        duration: settings.pakuInterval,
                        onFinish: function () {
                            this.reverse();
                            setTimeout(function () {
                                if (pakuModeOn) {
                                    tween.reset().play();
                                }
                            }, settings.pakuInterval * 1000);
                        }
                    }).play();
                }


                // returning a kinetic wedge with the above properties and methods
                return pacMan;
            };

        });
