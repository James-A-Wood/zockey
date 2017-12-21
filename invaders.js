



define(
        [
            "assignment",
            "jquery",
            "Konva",
            "tools",
            "helpers/AudioLoader",
            "helpers/SoundEffects",
            "helpers/Timer",
            "konva/blastCircle",
            "konva/invaderBase",
            "konva/shakeStage",
            "konva/starryBackground",
            "konva/ufo"
//            "konva/sheepAttack"
        ],
        function (assignment, $, Konva, tools, myAudio, SoundEffects, Timer, blastCircle, invaderBase, shakeStage, myStarryBackground, ufo) { //sheepAttack


            var myJSON, problem, allProblemsArray, remainingProblemsArray, currentProblemIndex,
                    indexOfJapanese, indexOfSentakushi, theCurrentProblem,
                    mistakesLine, timeLimit, recycle, timer, wordsFactory;
            var audio = null;


            var isMobile = tools.isMobile();
            var score = tools.score();
            var deviceTilt = new tools.DeviceTiltDetector();


            var stage = new Konva.Stage({
                height: (function () {
                    if (!isMobile) {
                        return parseInt($("#konva-holder").parent().height());
                    }
                    return Math.min(window.innerHeight * 0.7, 400);
                }()),
                width: parseInt($("#konva-holder").parent().width()),
                container: "konva-holder"
            });


            var backgroundLayer = new Konva.Layer({listening: false});
            var animLayer = new Konva.Layer({listening: false});
            var touchLayer = new Konva.Layer();


            var stageWidth = stage.width();
            var stageHeight = stage.height();


            var touchRect = new Konva.Rect({
                x: 0,
                y: 0,
                width: stageWidth,
                height: stageHeight,
                fill: "transparent"
            });


            stage.add(backgroundLayer, animLayer, touchLayer);
            touchLayer.add(touchRect).draw();


            var actionArea = new Konva.Rect({
                x: 0,
                y: 0,
                width: stageWidth,
                height: stageHeight - 10,
                fill: "transparent"
            });


            var targets = (function () {


                var targetClass = "target";
                var targetDirection = 1;
                var basePPS = isMobile ? 60 : 80; // slower on mobile


                function addTargets(targets, fly) {
                    targets = Array.isArray(targets) ? targets : [targets];
                    targets.forEach(function (target) {
                        target.name(targetClass);
                        targetDirection *= -1; // flipping the direction on each iteration of the loop
                        var speed = fly ? (basePPS * 0.5) + (Math.random() * basePPS) : 0;
                        var vector = (Math.PI / 2) + (Math.random() * (Math.PI / 8)) - (Math.random() * (Math.PI / 4));
                        target.vector = vector;
                        target.vectorX = Math.sin(vector) * targetDirection;
                        target.vectorY = Math.cos(vector);
                        target.speed = speed;
                    });
                }


                function getTargets() {
                    return stage.find("." + targetClass);
                }


                function flipDirection() {
                    getTargets().forEach(function (target) {
                        target.vectorX *= -1;
                    });
                }


                function removeRemaining(callback) {

                    getTargets().forEach(function (target) {
                        target.name(null);
                        target.to({
                            duration: 0.2,
                            opacity: 0.3,
                            onFinish: function () {
                                target.removeMe(); // removes the corresponding bullets, etc.
                                target.remove(); // removes the actual thing
                            }
                        });
                    });

                    setTimeout(callback, 200);
                }


                return {
                    addTargets: addTargets,
                    getTargets: getTargets,
                    flipDirection: flipDirection,
                    removeRemaining: removeRemaining
                };
            }());


            var yarikata = (function () {


                var mobileText = "1. デバイスを軽く傾けて基地を動かします。\n2. 画面をタップして打ちます。";
                var desktopText = "1. 右左のアロー・キーを使って基地を動かします。\n2. マウスをクリックして（またはスペース・バーを押して）打ちます。";


                var yarikataText = new Konva.Text({
                    fill: "white",
                    fontSize: 16,
                    fontFamily: "Meiryo",
                    width: stageWidth * 0.8,
                    x: stageWidth * 0.1,
                    y: 20,
                    lineHeight: 1.5,
                    wrap: "char",
                    text: isMobile ? mobileText : desktopText
                });


                function remove() {
                    yarikataText.to({
                        duration: 0.4,
                        opacity: 0,
                        onFinish: function () {
                            yarikataText.destroy();
                        }
                    });
                }


                return {
                    remove: remove,
                    yarikataText: yarikataText
                };
            }());


            var startButton = (function () {


                var sb = new Konva.Text({
                    x: stageWidth / 2,
                    y: stageHeight / 3,
                    text: "スタート",
                    fill: "lawngreen",
                    fontSize: 24,
                    padding: 20,
                    textDecoration: "underline"
                });
                sb.offsetX(sb.width() / 2);
                sb.offsetY(sb.height() / 2);


                sb.on("click touchend", startButtonHandler);
                sb.onHit = startButtonHandler;


                $(document).on("keydown", enterTriggersStart);
                function enterTriggersStart(e) {
                    e.which === 13 && startButtonHandler();
                }


                targets.addTargets(sb);


                function startButtonHandler(bullet) {
                    $(document).off("keydown", enterTriggersStart);
                    var sbLayer = sb.getLayer();
                    bullet && blastCircle({
                        layer: touchLayer,
                        duration: 1.5,
                        x: sb.x(),
                        y: sb.y(),
                        stroke: "lawngreen",
                        strokeWidth: 3,
                        shape: "star",
                        innerRadius: 30,
                        outerRadius: 50
                    });
                    sb.onHit = null;
                    yarikata && yarikata.remove();
                    base.active = true;
                    sb.destroy();
                    sbLayer && sbLayer.draw();

                    setTimeout(nextProblem, bullet ? 1000 : 0);
                }


                return sb;
            }());


            var pauser = tools.pauser({
                onPause: function () {
                    stage.opacity(0.7).draw();
                    starryBackground.pause();
                },
                onResume: function () {
                    stage.opacity(1).draw();
                    starryBackground.resume();
                }
            });


            function getEdges(shape) {
                return {
                    top: shape.y() - shape.offsetY(),
                    bottom: shape.y() + shape.height() - shape.offsetY(),
                    left: shape.x() - shape.offsetX(),
                    right: shape.x() + shape.width() - shape.offsetX()
                };
            }


            var backgroundRect = new Konva.Rect({
                x: 0,
                y: 0,
                width: stageWidth,
                height: stageHeight,
                fillLinearGradientStartPoint: {x: 0, y: 0},
                fillLinearGradientEndPoint: {x: 0, y: stageHeight},
                fillLinearGradientColorStops: [0, "#002", 1, "#ccc"]
            });


            var playButton = (function () {


                var group = new Konva.Group({
                    width: 50,
                    height: 50
                });


                var playButtonBackground = new Konva.Rect({
                    fill: "transparent",
                    width: 50,
                    height: 50
                });


                var buttonIcon = new Konva.Line({
                    x: 15,
                    y: 15,
                    points: [0, 0, 0, 20, 15, 10],
                    stroke: "white",
                    strokeWidth: 6,
                    lineJoin: "round",
                    fill: "white",
                    closed: true
                });
                group.add(playButtonBackground, buttonIcon);


                group.x(stageWidth - group.width());


                group.on("click touchend", function () {
                    audio && audio.play(theCurrentProblem[0]);
                });


                function remove() {
                    var layer = group.getLayer();
                    group.off("click");
                    group.destroy();
                    layer.batchDraw();
                }


                function nowPlaying() {
                    buttonIcon.fill("#aaa").stroke("#aaa");
                    touchLayer.draw();
                }


                function nowPaused() {
                    buttonIcon.fill("white").stroke("white");
                    touchLayer.draw();
                }


                return {
                    remove: remove,
                    icon: group,
                    nowPlaying: nowPlaying,
                    nowPaused: nowPaused
                };
            }());


            backgroundLayer.add(backgroundRect).draw();
            animLayer.add(actionArea).draw();
            touchLayer.add(startButton, playButton.icon, yarikata.yarikataText).draw();


            var starryBackground = myStarryBackground({
                layer: backgroundLayer,
                pauser: pauser
            });


            var sounds = new SoundEffects({
                checkbox: $("#sounds-stuff"),
                container: $("#sounds-stuff"),
                sounds: {
                    shoot: "/sounds/invaders/shoot.mp3",
                    wrong: "/sounds/invaders/wrongSound.mp3",
                    correct: "/sounds/invaders/correctSound.mp3",
                    base_hit: "/sounds/invaders/base_hit.mp3",
                    ufo_fire: "/sounds/invaders/ufo_fire.mp3",
                    tick: "/sounds/tick.mp3"
                },
                playThisOnCheckboxCheck: "tick"
            });


            var textHolder = (function () {


                var japText, engText;
                var buffer = 5;
                var englishSentence = "";
                var tag = " ...";
                var fontSize = stageWidth < 400 ? 14 : 24;
                var japaneseFill = "rgb(154,252,30)"; // lawngreen = (124,252,0)
                var englishFill = "yellow";


                function clearText() {
                    japText && japText.destroy();
                    engText && engText.destroy();
                    englishSentence = "";
                    animLayer.draw();
                }


                function appendTag() {
                    appendWord(tag);
                }


                function setJapanese(text) {
                    clearText();
                    japText = new Konva.Text({
                        width: stageWidth * 0.9,
                        x: stageWidth * 0.05,
                        y: buffer,
                        text: text,
                        align: "center",
                        fontSize: fontSize,
                        fill: japaneseFill
                    });
                    backgroundLayer.add(japText).draw();
                }


                function appendWord(text) {
                    englishSentence = englishSentence.replace(tag, "");
                    englishSentence += text;
                    engText && engText.destroy();
                    var japTextHeight = japText ? japText.y() + japText.height() : null;
                    engText = new Konva.Text({
                        y: japTextHeight + buffer,
                        width: stageWidth * 0.9,
                        x: stageWidth * 0.05,
                        align: "center",
                        fontSize: fontSize,
                        fill: englishFill,
                        text: englishSentence
                    });
                    backgroundLayer.add(engText).draw();
                }


                return {
                    setJapanese: setJapanese,
                    appendWord: appendWord,
                    clearText: clearText,
                    appendTag: appendTag
                };
            }());


            function WordsFactory(params) {


                var targetAnimation = {};
                var threshhold = {
                    top: 75,
                    bottom: (stageHeight * 0.66)
                };


                function spaceEvenly(arrayOfObjects) {


                    var blockSize = stageWidth / arrayOfObjects.length;
                    var buffer = blockSize / 2;


                    arrayOfObjects.forEach(function (item, index) {
                        var startingY = threshhold.top + (Math.random() * (threshhold.bottom - threshhold.top));
                        item.y(startingY).x(buffer + (blockSize * index));
                    });


                    animLayer.draw();
                }


                function makeNew(params) {


                    var makeNewSettings = $.extend({
                        words: [],
                        spaceEvenly: true,
                        randomize: true
                    }, params);


                    var arrayOfTextObjects = [];
                    var realAnswersArray = [], dummyAnswersArray = [];
                    var textArray = makeNewSettings.words;
                    var ufoBodyColor = tools.pickLightColor();


                    // splitting the array at the ¥, if any
                    if (textArray.indexOf("¥") !== -1) {
                        realAnswersArray = textArray.splice(0, textArray.indexOf("¥"));
                        dummyAnswersArray = textArray.splice(textArray.indexOf("¥") + 1);
                    } else {
                        realAnswersArray = textArray;
                        dummyAnswersArray = [];
                    }


                    textArray = realAnswersArray.concat(dummyAnswersArray);


                    textArray.forEach(function (text) {

                        var newUFO = ufo({
                            layer: animLayer,
                            text: text.replace(/\_/g, " "),
                            fontSize: 12,
                            ufoBodyColor: ufoBodyColor,
                            pauser: pauser,
                            sounds: sounds
                        });

                        newUFO.dummy = dummyAnswersArray.indexOf(text) === -1 ? false : true;
                        newUFO.badHit = function () {
                            blastCircle({
                                layer: animLayer,
                                x: this.x(),
                                y: this.y() + this.height(),
                                duration: 2,
                                stroke: "white",
                                radius: 100,
                                strokeWidth: 6,
                                squishY: true
                            });
                            this.ufoFire(this, base);
                        };

                        arrayOfTextObjects.push(newUFO);
                    });


                    problem.choices.length = 0;
                    problem.choices = arrayOfTextObjects.slice();
                    arrayOfTextObjects = tools.shuffle(arrayOfTextObjects);


                    if (makeNewSettings.spaceEvenly) {
                        spaceEvenly(arrayOfTextObjects);
                    }



                    arrayOfTextObjects.forEach(function (thisWord, index) {

                        thisWord.opacity(0).scale({x: 2, y: 2}).cache();
                        animLayer.add(thisWord);

                        // fading in the UFOs one by one
                        setTimeout(function () {
                            thisWord.to({
                                duration: 0.3,
                                scaleX: 1,
                                scaleY: 1,
                                opacity: 1}
                            );
                        }, index * 100);

                        targets.addTargets(thisWord, true);
                    });


                    animLayer.draw();


                    return arrayOfTextObjects;
                }


                function flyAnimation(startOrStop) {


                    if (startOrStop === "stop") {
                        targetAnimation && targetAnimation.stop && targetAnimation.stop();
                        return;
                    }


                    targetAnimation = new Konva.Animation(moveTargets, animLayer);
                    function moveTargets(frame) {


                        var allTargets = targets.getTargets();
                        if (pauser.isPaused() || allTargets.length === 0) {
                            return false;
                        }


                        allTargets.each(function (target) {


                            var amountChange = (frame.timeDiff / 1000) * target.speed;
                            var newX = target.x() + target.vectorX * amountChange;
                            var newY = target.y() + target.vectorY * amountChange;


                            // bouncing off top, bottom and sides
                            if (newY < threshhold.top || newY > threshhold.bottom) {
                                target.vectorY *= -1;
                            }
                            if (newX < 0 || newX > stageWidth) {
                                target.vectorX *= -1;
                            }


                            newX = (newX < 0) ? 0 : (newX > stageWidth ? stageWidth : newX);
                            newY = (newY < threshhold.top) ? threshhold.top : (newY > threshhold.bottom ? threshhold.bottom : newY);


                            target.x(newX);
                            target.y(newY);
                        });
                    }
                    targetAnimation.start();
                }


                this.makeNew = makeNew;
                this.spaceEvenly = spaceEvenly;
                this.flyAnimation = flyAnimation;
            }


            var bulletFactory = (function () {


                var bulletIdentifier = "bullet";
                var clippingRegion = new Konva.Group({
                    clip: {
                        x: 0,
                        y: 0,
                        width: stageWidth,
                        height: stageHeight - 30 // base height
                    }
                });
                animLayer.add(clippingRegion);


                function destroyAllBullets() {
                    stage.find("." + bulletIdentifier).each(function (bullet) {
                        bullet.removeBullet();
                    });
                }


                function removeBullet(bullet) {
                    bullet.flyAnim && bullet.flyAnim.stop();
                    bullet.remove();
                }


                var newBullet = (function () {


                    var bulletPrototype = null;


                    return function (x, y, params) {


                        params = $.extend({
                            armed: true,
                            pixelsPerSecond: 500,
                            bulletLength: 60,
                            bulletWidth: 2
                        }, params || {});


                        sounds.play("shoot");


                        var pps = params.pixelsPerSecond;
                        var bulletLength = params.bulletLength;


                        // using the "cached" bullet, if it exists
                        if (bulletPrototype) {
                            var bullet = bulletPrototype.clone();
                        } else {


                            // ... or creating new bullet and "caching" it
                            var bullet = new Konva.Rect({
                                fillLinearGradientStartPoint: {x: 0, y: 0},
                                fillLinearGradientEndPoint: {x: 0, y: bulletLength},
                                fillLinearGradientColorStops: [
                                    0, "yellow",
                                    0.05, "yellow",
                                    0.05, "rgba(255, 153, 0, 1)",
                                    1, "rgba(255, 153, 0, 0)"
                                ], //rgba(255, 153, 0, 1)
                                width: params.bulletWidth,
                                height: bulletLength,
                                cornerRadius: 100,
                                name: bulletIdentifier
                            });
                            bulletPrototype = bullet.clone();
                        }


                        // setting new X & Y properties for each new bullet
                        bullet.x(x - 1).y(y);


                        clippingRegion.add(bullet);
                        bullet.cache();


                        bullet.flyAnim = new Konva.Animation(moveBullet, animLayer);
                        bullet.flyAnim.start();


                        function moveBullet(frame) {
                            if (pauser.isPaused()) {
                                return false;
                            }
                            var totalDistance = (frame.timeDiff / 1000) * pps;
                            bullet.y(bullet.y() - totalDistance);
                            params.armed && checkForBulletHit({
                                bullet: bullet,
                                onHit: problem ? problem.checkAnswer : null
                            });
                            if (bullet.y() + bulletLength < 0) {
                                bullet.destroy();
                                bullet.flyAnim.stop();
                            }
                        }
                    };
                }());


                return {
                    newBullet: newBullet,
                    destroyAllBullets: destroyAllBullets,
                    removeBullet: removeBullet
                };
            }());


            function Problem(params) {


                params = params || {};


                var that = this;
                var correctChoice = params.correctChoice ? params.correctChoice : null;


                function getCorrectAnswer() {
                    if (that.answerMethod === "firstInLine") {
                        return that.choices[0];
                    } else {
                        return correctChoice;
                    }
                }


                function checkAnswer(bullet, hitTarget) {
                    if (hitTarget.onHit) {
                        hitTarget.onHit(bullet, hitTarget);
                    } else if (hitTarget === getCorrectAnswer()) {
                        correctHandler(hitTarget);
                    } else {
                        wrongHandler(hitTarget);
                    }
                }


                this.answerMethod = params.answerMethod || "firstInLine";
                this.checkAnswer = checkAnswer;
                this.choices = (function () {
                    if (Array.isArray(params.choiceArray)) {
                        return params.choices;
                    }
                    return params.choices.split(" ");
                }());
            }
            // end Problem


            function correctHandler(hitTarget) {


                hitTarget.removeMe && hitTarget.removeMe();
                problem.choices.shift();
                sounds.play("correct");
                textHolder.appendWord(" " + hitTarget.text);
                blastCircle({
                    layer: animLayer,
                    x: hitTarget.x(),
                    y: hitTarget.y(),
                    shape: "star",
                    outerRadius: 50,
                    innerRadius: 30,
                    stroke: "yellow"
                });


                var numberDummies = problem.choices.filter(function (thing) {
                    return thing.dummy === true;
                }).length;


                if (problem.choices.length === numberDummies) {


                    targets.removeRemaining(function () {


                        remainingProblemsArray.splice(currentProblemIndex, 1);
                        score.number_correct++;
                        wordsFactory.flyAnimation("stop");


                        // exiting here if this was the last problem
                        if (!remainingProblemsArray.length) {
                            endSequence("allAnswered");
                            return;
                        }


                        // NEW TEST adding "autoAdvance" to automatically proceed to
                        // the next problem (no "nextButton")
                        if (myJSON.misc.autoAdvance) {
                            setTimeout(nextProblem, 1000);
                            return;
                        }


                        var nextButton = new Konva.Text({
                            text: "Next",
                            fontSize: 36,
                            fill: "yellow",
                            x: stageWidth / 2,
                            y: stageHeight / 3,
                            opacity: 0
                        });
                        nextButton.offsetX(nextButton.width() / 2);
                        nextButton.offsetY(nextButton.height() / 2);
                        nextButton.onHit = nextButtonHandler;


                        $(document).on("keydown", enterTriggersNext);
                        function enterTriggersNext(e) {
                            e.which === 13 && nextButtonHandler();
                        }


                        function nextButtonHandler(bullet) {
                            $(document).off("keydown", enterTriggersNext);
                            nextButton.onHit = null;
                            bullet && blastCircle({
                                layer: touchLayer,
                                duration: 1.5,
                                x: nextButton.x(),
                                y: nextButton.y(),
                                stroke: "lawngreen",
                                strokeWidth: 3,
                                shape: "star",
                                innerRadius: 30,
                                outerRadius: 50
                            });
                            nextButton.destroy();
                            setTimeout(nextProblem, bullet ? 1000 : 0);
                        }


                        nextButton.on("click touchend", nextButtonHandler);
                        targets.addTargets(nextButton);
                        touchLayer.add(nextButton);
                        nextButton.to({duration: 0.6, opacity: 1});
                    });
                    return true;
                } else {
                    textHolder.appendTag();
                }
            }


            function wrongHandler(hitTarget) {
                shakeStage({stage: stage, shakeAmplitude: 4});
                hitTarget.badHit && hitTarget.badHit();
                score.number_mistakes += 1;
                sounds.play("wrong");
                targets.flipDirection();


                if (mistakesLine && score.number_mistakes > mistakesLine) {
                    endSequence("tooManyMistakes");
                }
            }


            function checkForBulletHit(obj) {


                var bullet = obj.bullet;
                var x = bullet.x();
                var y = bullet.y();


                targets.getTargets().some(function (target) {


                    var edge = getEdges(target);
                    if (x < edge.left || x > edge.right || y < edge.top || y > edge.bottom) {
                        return false; // return false to continue the loop
                    }


                    // if we're here, it must be a hit
                    obj.onHit && obj.onHit(bullet, target);
                    target.onHit && target.onHit(bullet, target);
                    bullet.flyAnim.stop();
                    bullet.destroy();


                    // return true to exit the loop
                    return true;
                });
            }


            var problemNumber = (function () {
                var joiner = " of ";
                var text = new Konva.Text({
                    fontSize: 16,
                    fill: "yellow",
                    fontFamily: "Arial",
                    text: "0",
                    listening: false
                });
                center(text);
                text.x(10).y(stageHeight - 5);
                backgroundLayer.add(text).draw();
                function center(obj) {
                    obj.offsetY(obj.height());
                }
                function increment(current, total) {
                    text.text((current) + joiner + (total)); // parens necessary on iOS!
                    center(text);
                    text.getLayer().draw();
                }
                return {
                    increment: increment
                };
            }());


            var clock = (function () {

                var text = new Konva.Text({
                    fontSize: 16,
                    fill: "white",
                    fontFamily: "Arial",
                    text: "0m 0s",
                    listening: false
                });

                function centerText(text) {
                    text.offsetX(text.width());
                    text.offsetY(text.height());
                    text.x(stageWidth - 10);
                    text.y(stageHeight - 5);
                    text.cache();
                    text.getLayer().draw();
                }
                backgroundLayer.add(text).draw();
                centerText(text);

                function update(seconds) {
                    if (pauser.isPaused()) {
                        return false;
                    }
                    var formattedTime = tools.secondsToHMS(seconds, {
                        hoursTag: "h ",
                        minutesTag: "m ",
                        secondsTag: "s",
                        useLeadingZeroes: false
                    });
                    text.text(formattedTime);
                    centerText(text);
                }

                return {
                    update: update
                };
            }());


            var base = invaderBase({
                layer: animLayer,
                actionArea: actionArea,
                touchRect: touchRect,
                pauser: pauser,
                isMobile: isMobile,
                deviceTilt: deviceTilt,
                bulletFactory: bulletFactory,
                sounds: sounds
            });


            // needed because the 
            animLayer.draw();




            /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * */




            tools.getProblemData(function (d) {


                myJSON = d;


                timeLimit = myJSON.assignment.time_limit;
                recycle = myJSON.assignment.recycle;
                mistakesLine = myJSON.assignment.mistakes_limit;


                if (myJSON.number_problems && myJSON.number_problems > 1) {
                    tools.whittleDownArray(myJSON.problem, myJSON.number_problems);
                }


                if (myJSON.assignment.shuffle) {
                    myJSON.problem = tools.shuffle(myJSON.problem);
                }


                // instantiating the timer
                timer = new Timer({
                    pauseStart: true,
                    countdownFrom: timeLimit,
                    warnAt: timeLimit,
                    onWarn: function () {
                        //
                    },
                    eachSecond: function () {
                        clock.update(timer.time());
                    },
                    onFinish: function () {
                        endSequence(recycle ? "timeTrial" : "timeUp");
                    }
                });


                // getting the index of the Japanese, or -1, if no Japanese present
                indexOfJapanese = tools.getArrayIndex({
                    array: myJSON.problem[0],
                    searchFrom: "start",
                    condition: function (thing) {
                        return tools.languageOf(thing) === "Japanese";
                    }
                });


                // getting the index of sentakushi, the LAST English in the array
                // NOTE that this may in fact be the English audio itself
                indexOfSentakushi = tools.getArrayIndex({
                    array: myJSON.problem[0],
                    searchFrom: "end",
                    condition: function (thing) {
                        return tools.languageOf(thing) === "English";
                    }
                });


                // setting whether to play the English audio or not
                var useAudio = (function () {


                    // getting the checkbox value from the myJSON.assignment property
                    if (myJSON.assignment && parseInt(myJSON.assignment.use_audio)) {
                        return true;
                    }


                    // using "misc.useAudio", if specified, as JSON (THIS IS RETRO)
                    if (myJSON.misc && myJSON.misc.hasOwnProperty("useAudio")) {
                        return myJSON.misc.useAudio;
                    }


                    // or, returning FALSE if ANY of the elements are Japanese
                    if (indexOfJapanese >= 0) { // will be -1 if there is Japanese
                        return false;
                    }


                    // OR returning true as default
                    return true;
                }());


                // showing directions and various options for this particular assignment
                tools.directions.show(useAudio ? "invaders_spoken" : "invaders_written", {
                    directions: myJSON.assignment.directions,
                    mistakes: mistakesLine,
                    numProblems: myJSON.problem.length,
                    time: myJSON.assignment.time_limit,
                    timeTrial: false //recycle ? true : false
                });


                if (useAudio) {
                    audio = myAudio({
                        audioFiles: myJSON.audioFiles, // required
                        wordsList: (function () { // required, an ARRAY of english words/sentences
                            var array = [];
                            myJSON.problem.forEach(function (theCurrentProblem) {
                                var englishSentence = theCurrentProblem[0];
                                array.push(englishSentence);
                            });
                            return array; // an array of all the ENGLISH words/sentences
                        }()),
                        onAllLoaded: prepareProblems,
                        onPlay: function () {
                            playButton && playButton.nowPlaying();
                        },
                        onEnded: function () {
                            playButton && playButton.nowPaused();
                        },
                        onLoadError: function () {
                            console.log("Failed to load sounds!");
                        }
                    });
                } else {
                    playButton && playButton.remove();
                    stage.draw();
                    prepareProblems();
                }
            });


            function prepareProblems() {
                allProblemsArray = myJSON.problem.concat();
                remainingProblemsArray = allProblemsArray.concat();
                wordsFactory = new WordsFactory();
            }


            function nextProblem() {


                currentProblemIndex = tools.pickIntFrom(remainingProblemsArray);
                theCurrentProblem = remainingProblemsArray[currentProblemIndex];
                audio && audio.stopAll();
                playButton.nowPaused();


                timer.start();
                score.startTimer();
                textHolder.clearText();


                var japanese = theCurrentProblem[indexOfJapanese];
                problemNumber.increment((score.number_correct + 1), allProblemsArray.length);
                japanese && textHolder.setJapanese(japanese);
                audio && audio.play(theCurrentProblem[0]);
                problem = new Problem({
                    choices: theCurrentProblem[1]
                });


                wordsFactory.makeNew({
                    words: theCurrentProblem[indexOfSentakushi].split(" ")
                });


                wordsFactory.flyAnimation("start");
            }



            var endSequence = (function () {


                var hasBeenCalled = false;


                var passConditions = {
                    tooManyMistakes: false,
                    timeUp: false,
                    allAnswered: true,
                    timeTrial: true
                };


                return function (result) {


                    if (hasBeenCalled) {
                        return;
                    }


                    hasBeenCalled = true;
                    timer && timer.stop();
                    score && score.stopTimer();
                    assignment.gambariTimeStop();
                    audio && audio.disable().stopAll();


                    // sending off the results
                    var results = {
                        time_taken: score.time_taken,
                        number_problems: myJSON.problem.length,
                        number_mistakes: score.number_mistakes,
                        passed: passConditions[result]
                    };


                    // adding the 'endScreenHolder' div after a momentary pause
                    // sending the results object, and a callback
                    tools.send_results(results, function () {
                        setTimeout(function () {


                            // passing in the object to put the assignment_results stuff into, and the data to display
                            var data = [
                                {label: "時間", value: score.time_taken + " 秒"},
                                {label: "問題数", value: results.number_problems ? results.number_problems + " 問" : "-"},
                                {label: "正解", value: score.number_correct + " 問"},
                                {label: "間違い", value: score.number_mistakes + " 問"}
                            ];


                            tools.showAssignmentResults({
                                container: $("#mainProblemsHolder"),
                                result: result,
                                data: data
                            });


                            // calculating the percent correct
                            var percentCorrect = results.number_problems / score.number_guesses;


                            // keeping it between 0 and 1
                            percentCorrect = Math.min(percentCorrect, 1);
                            percentCorrect = Math.max(percentCorrect, 0);
                        }, 1000);
                    });


                    return true;
                };
            }());
            // end endSequence


            // setting the fixed problem holder
            tools.fixedProblemHolder({
                onSlideUp: function () {
                    $("#directions").hide();
                },
                onSlideDown: function () {
                    $("#directions").show();
                }
            });


            (function () {
                if (isMobile) {
                    $("#shoot-button").css("display", "block")
                            .on("touchstart", base.fire.startShooting)
                            .on("touchend", base.fire.stopShooting);
                }
            }());

        }
);