



define(
        [
            "jquery",
            "tools",
            "Konva",
            "konva/Laser",
            "konva/explosion",
            "konva/blastCircle",
            "helpers/vocabList",
            "helpers/AudioLoader",
            "konva/starsBackground",
            "howler"
        ],
        function ($, tools, Konva, Laser, ExplosionFactory, BlastCircle, myVocabList, audioLoader, myStarsBackground) { //, fixedProblemHolder


            var isMobile = tools.isMobile();
            var audio;
            var clickOrTouchstart = tools.click0rTouch;


            // removing the startButton on desktop; else, showing it
            if (!isMobile) {
                $("#shoot-button").remove();
            } else {
                $("#shoot-button").css({display: "block"});
            }


            // the "soundEffect" class is loaded in automatically!
            var laserSound = new Howl({
                urls: ["/sounds/space/laser.mp3"]
            });


            var explosionSound = new Howl({
                urls: ["/sounds/space/explosion.mp3"]
            });


            var spaceBackgroundNoise = new Howl({
                urls: ["/sounds/space/spaceBackgroundNoise.mp3"],
                autoplay: true,
                loop: true
            });


            // keeping screen at least 450px wide, for mobile - and disabling scaling!  Cool!
            if (isMobile) {
                $("#viewport").prop("content", "width=420, maximum-scale=1.0, user-scalable=no");
            }


            // keeping score with the score object
            var score = tools.score();


            var defaults = {
                wordFlyTime: 10, // seconds, not miliseconds!
                starFlyTime: 12,
                bulletFlyTime: 0.5,
                number_sentakushi: 4,
                numberStars: 150
            };


            var flyingWordsArray = [];


            var problem = {
                unanswered: true,
                hittableOn: false,
                isPaused: false,
                data: [],
                allWords: [],
                remainingWords: [],
                directions: [],
                wordToPlay: ""
            };


            // variables
            var myJSON;
            var $canvasHolder = $("#canvas_holder");


            // defining stage
            var stage = new Konva.Stage({
                container: "canvas_holder",
                width: $canvasHolder.width(),
                height: $canvasHolder.height()
            });
            var layer = new Konva.Layer({
                name: "paralax"
            });
            stage.add(layer);


            var stageWidth = stage.width();
            var stageHeight = stage.height();


            var startButton = (function () {


                var image = new Image();
                var group = new Konva.Group({
                    id: "startButton"
                });
                var ufo;


                // wiring up the onload listener FIRST before actually loading it
                image.onload = function () {


                    ufo = new Konva.Image({
                        image: image,
                        width: 120,
                        height: 60,
                        offset: {x: 60, y: 30}
                    });


                    var startText = new Konva.Text({
                        text: "ここをクリックして\nLet's Start!",
                        fill: "yellow",
                        fontSize: 14,
                        align: "center"
                    });


                    var transparentCircle = new Konva.Circle({
                        radius: 80,
                        fill: "transparent"
                    });


                    group.add(ufo, startText, transparentCircle);
                    startText.offset({x: startText.width() / 2, y: -40});
                    group.x(stageWidth / 2).y(stageHeight / 2);
                    layer.add(group);
                };


                // finally, setting the .src attribute so itloads
                image.src = "/images/space/UFO.png";
            }());


            var crosshairs = (function () {


                var strokeWidth = 2;
                var lineLength = isMobile ? 16 : 10;
                var strokeColor = "yellow";


                var group = new Konva.Group({
                    listening: false
                });


                // the line template, to be cloned below
                var lineTemplate = new Konva.Line({
                    stroke: strokeColor,
                    strokeWidth: strokeWidth
                });


                // 
                var verticalLine = lineTemplate.clone().points([lineLength, 0, lineLength, lineLength * 2]);
                var horizontalLine = lineTemplate.clone().points([0, lineLength, lineLength * 2, lineLength]);


                group.add(verticalLine, horizontalLine);
                layer.add(group);


                // positioning and caching the group
                group.offset({x: lineLength / 2, y: lineLength / 2});
                group.x(stageWidth / 2);
                group.y(stageHeight / 2);
                group.cache();


                // DESKTOP moving the crosshairs with the (invisible) mouse pointer
                if (!isMobile) {

                    $(window).on("mousemove", function () {


                        var pos = stage.getPointerPosition();
                        if (pos) {
                            group.setAttrs({
                                x: pos.x,
                                y: pos.y,
                                visible: true
                            }).moveToTop();
                        } else {


                            // hiding the crosshairs when the mouse pointer is off the stage
                            group.visible(false);
                        }
                    });
                }


                return group;
            }());


            // adding device tilt detector
            var deviceTilt = (function () {


                var sensitivity = {x: 10, y: 10}; // tilt of 10 brings it to the edge
                var lag = 0.1;
                var deviceOrientation = 0; // 90 = 9:00, 0 = 12:00, -90 = 3:00
                var stageCenterX = stageWidth / 2;
                var stageCenterY = stageHeight / 2;
                var currentX = 0;
                var currentY = 0;
                var lastTilt = {x: 0, y: 0};
                var tiltOffset = {x: 0, y: 0};
                var leftToRight, upDown;
                var justInstantiated = true;


                // wiring up the window to report the device orientation when it changes
                $(window).on("orientationchange", function () {
                    deviceOrientation = window.orientation; // 0 = 12:00, 90 = 9:00, -90 = 3:00
                });


                // triggering the orientationchange event once manually
                $(window).trigger("orientationchange");


                function changeHandler(event) {


                    // saving the current tilt, so we can refer to it later
                    lastTilt.x = event.gamma; // tilt left/right
                    lastTilt.y = event.beta; // tilt up/down


                    // calculating the raw tilt from the device, plus any tilt compensation
                    var adjustedTiltX = event.gamma - tiltOffset.x;
                    var adjustedTiltY = event.beta - tiltOffset.y;


                    // accounting for device orientation -- landscape-right, landscape-left, or portrait
                    if (deviceOrientation === 0) {
                        leftToRight = adjustedTiltX;
                        upDown = adjustedTiltY;
                    } else if (deviceOrientation === 90) {
                        leftToRight = adjustedTiltY;
                        upDown = -adjustedTiltX;
                    } else if (deviceOrientation === -90) {
                        leftToRight = -adjustedTiltY;
                        upDown = adjustedTiltX;
                    }


                    var tiltX = Math.max(Math.min(leftToRight, sensitivity.x), -sensitivity.x);
                    var tiltY = Math.max(Math.min(upDown, sensitivity.y), -sensitivity.y);
                    var targetX = stageCenterX + tiltX * (stageWidth / sensitivity.x) / 2;
                    var targetY = stageCenterY + tiltY * (stageHeight / sensitivity.y) / 2;
                    var diffX = targetX - currentX;
                    var diffY = targetY - currentY;
                    var newX = currentX + (diffX * lag);
                    var newY = currentY + (diffY * lag);


                    crosshairs.x(newX).y(newY).moveToTop(); // always keeping the cursor in front of other elements


                    // remembering the current X & Y
                    currentX = newX;
                    currentY = newY;


                    // calling the "resetToCenter" function once at the beginning
                    if (justInstantiated) {
                        justInstantiated = false;
                        resetToCenter();
                    }
                }


                function resetToCenter() {
                    tiltOffset.x = lastTilt.x;
                    tiltOffset.y = lastTilt.y;
                }


                return {
                    changeHandler: changeHandler,
                    resetToCenter: resetToCenter
                };
            }());


            // wiring up the deviceTilt.changeHandler IF we're on mobile
            if (isMobile) {
                window.addEventListener("deviceorientation", deviceTilt.changeHandler);
            }


            // taking advantage of the tools stuff
            var vocabList;


            // loading the JSON data
            tools.getProblemData(function (data) {


                myJSON = data;
                problem.data = tools.objectToArray(data.problem);
                vocabList = myVocabList({
                    words: data.problem
                });


                setUpArrays();
            });




            /*  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  */




            function setUpArrays() {


                // setting number of choices, or 4 if unspecified
                defaults.number_sentakushi = myJSON.number_sentakushi || 4;


                // using the number_problems, if specified
                if (myJSON.number_problems && !isNaN(myJSON.number_problems)) {
                    tools.whittleDownArray(problem.data, myJSON.number_problems);
                }


                // preloading all the vocabulary audio
                audio = audioLoader({
                    audioFiles: myJSON.audioFiles,
                    wordsList: vocabList.getRemainingWords(), // REQUIRED
                    getWordToPlay: function () { // (optional) function to retrieve which word to play next, so we don't have to spoon-feed the word in
                        return vocabList.getTargetEnglish();
                    },
                    onPlay: function () {

                        // showing/hiding the right glyphicon in the playButton
                        $("#playButton").addClass("playButtonClicked");
                    },
                    onEnded: function () {

                        // showing/hiding the right glyphicon in the playButton
                        $("#playButton").removeClass("playButtonClicked");
                    },
                    onAllLoaded: function () {
                        //
                    },
                    playButton: "playIcon" // passing in the button on which to show "play" and "pause" symbols
                });


                // adding the scoreDots
                problem.data.forEach(function () {
                    $("#scorebar").prepend("<div class='dot dotBlank'></div>");
                });


                // firing bullets on mouse clicks
                $("#spaceMain").on("touchstart click", function (e) {


                    // stopping the touch from spreading
                    e.stopPropagation();


                    // firing, if we're not paused
                    if (!problem.isPaused) {
                        laser.fire(e);
                    }
                });


                // wiring up the #shoot-button
                $("#shoot-button").click(function () {
                    laser.fire();
                });


                // playing the vocabList.getTargetEnglish again by the space bar
                $("html").on("keydown", keyPressed);


                // pausing the action (=plugin)
                $("#pauseButton").on(clickOrTouchstart, toggleTweenPause);
                $("#playButton").on(clickOrTouchstart, function (event) {
                    event.stopPropagation();
                    audio.play();
                });


                // for mobile
                tools.fixedProblemHolder({
                    onSlideUp: function () {
                        $("#directions").hide();
                    },
                    onSlideDown: function () {
                        $("#directions").show();
                    }
                });
            }






            /*  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  */





            function nextProblem() {


                // hiding any hints that are still up
                hint.hide();


                // NEW TEST
                setTimeout(hint.show, hint.pauseBeforeShow);


                // clearing the flyingWordsArray
                flyingWordsArray.length = 0;


                // used in checking if all words have flown off stage unscathed
                problem.unanswered = true;


                // letting bullets now hit the words
                problem.hittableOn = true;


                // unpausing the problem, if paused
                $("#pauseButton").removeClass("pauseButtonClicked").text("ポーズ");


                // removing any answerDivs
                $(".answerDiv").fadeOut("slow");


                // populating an array from which to pick the incorrect choices
                var choicesArray = vocabList.getChoices(defaults.number_sentakushi);


                // Filling the directions array with numbers representing top, right, bottom and left
                problem.directions = [0, 1, 2, 3];


                // playing the sound
                audio.play();


                // shuffling the choices
                choicesArray = tools.shuffle(choicesArray);


                // creating the flying words
                for (var i = 0; i < defaults.number_sentakushi; i++) {
                    var japaneseWord = vocabList.getWordFor(choicesArray[i]);
                    var flyingWord;
                    if (choicesArray[i] === vocabList.getTargetEnglish()) {
                        flyingWord = flyingWords.create(japaneseWord, true); // TRUE means "it's the answer!"
                    } else {
                        flyingWord = flyingWords.create(japaneseWord, false);
                    }
                }
            }






            /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */






            var flyingWords = (function () {


                // variables
                var fontSize = stageWidth / 5, // just arbitrary
                        textBufferY = 10,
                        textBufferX = 20,
                        flyingWordsTweens = [];


                function clearFlyingTweens() {
                    flyingWordsTweens.forEach(function (thisTween) {
                        thisTween.destroy();
                    });
                    flyingWordsTweens.length = 0;
                }


                function getFlyingWordsTweens() {
                    return flyingWordsTweens;
                }


                function create(wordText, isCorrectAnswer) {

                    // building the text part of the flyingWord
                    var text = new Konva.Text({
                        listening: false,
                        text: wordText,
                        fontSize: fontSize,
                        fill: "darkblue",
                        offsetX: textBufferX * -1,
                        offsetY: textBufferY * -1,
                        shadowColor: "white",
                        shadowBlur: 3,
                        shadowOffset: {
                            x: 4,
                            y: 4
                        }
                    });


                    // building the colored background of the flyingWord
                    var background = new Konva.Rect({
                        listening: false,
                        fillLinearGradientStartPoint: {y: 0},
                        fillLinearGradientEndPoint: {y: text.height() + (textBufferY * 2)},
                        fillLinearGradientColorStops: [0, "#AAF", 1, "#CCF"],
                        stroke: "white",
                        strokeWidth: 5,
                        cornerRadius: 10,
                        width: text.width() + (textBufferX * 2),
                        height: text.height() + (textBufferY * 2)
                    });


                    // building the container for the text & background
                    var flyingWord = new Konva.Group();
                    flyingWord.add(background);
                    flyingWord.add(text);


                    // saving original (full) width, height, and other stuff as properties
                    flyingWord.width = background.width();
                    flyingWord.height = background.height();
                    flyingWord.isCorrectAnswer = isCorrectAnswer;
                    flyingWord.text = wordText;


                    // setting the registration part in the middle of the word
                    flyingWord.offsetX(flyingWord.width / 2);
                    flyingWord.offsetY(flyingWord.height / 2);


                    // adding the word to the canvas
                    layer.add(flyingWord);


                    // caching the word
                    flyingWord.cache();


                    // shrinking flyingWords down initially
                    flyingWord.scale({
                        x: 0.01,
                        y: 0.01
                    });


                    // choosing a random direction (0, 1, 2 or 3) to multiply by half of PI, and then calculating the coordinates
                    var direction = problem.directions[Math.floor(Math.random() * problem.directions.length)];
                    var slightOffset = Math.PI * 0.10 - (Math.random() * Math.PI * 0.20);
                    var endX = (stageWidth / 2) + (stageWidth / 2 + 100) * Math.sin(Math.PI * 0.5 * direction + slightOffset);
                    var endY = (stageHeight / 2) + (stageHeight / 2 + 100) * Math.cos(Math.PI * 0.5 * direction + slightOffset);


                    // keeping track of which directions have already been used
                    problem.directions.splice(problem.directions.indexOf(direction), 1);


                    // starting the flyingWords slightly off-center
                    var startX = stageWidth / 2 + (endX - stageWidth / 2) * 0.05;
                    var startY = stageHeight / 2 + (endY - stageHeight) * 0.05;
                    flyingWord.x(startX);
                    flyingWord.y(startY);


                    // adding the flyingWord to an array, so we can remove it later
                    flyingWordsArray.push(flyingWord);


                    // tweening the flyingWord
                    var flyTween = new Konva.Tween({
                        node: flyingWord,
                        scaleX: 1,
                        scaleY: 1,
                        x: endX,
                        y: endY,
                        duration: defaults.wordFlyTime,
                        easing: Konva.Easings.EaseIn,
                        onFinish: function () {


                            // if the tweens run to the end, then counting it as a miss
                            clearFlyingTweens();
                            answeredWrong();
                        }
                    }).play();


                    // also adding it to the flyingWordsTweens
                    flyingWordsTweens.push(flyTween);
                }


                ////////////////////////////

                return {
                    create: create,
                    clearFlyingTweens: clearFlyingTweens,
                    getFlyingWordsTweens: getFlyingWordsTweens
                };
            }());


            var laser = Laser({
                stage: stage,
                layer: layer,
                parentContainer: $canvasHolder,
                onFire: function () {
                    laserSound.play();
                },
                onFinish: checkForHit,
                bulletSolidColor: isMobile ? "yellow" : null,
                targetDot: isMobile ? crosshairs : null
            });


            function checkForHit(x, y) {


                if (stage.findOne("#startButton")) {


                    // doing the explosion after removing the spaceStartButton
                    explosionSequence(stageWidth / 2, stageHeight / 2);


                    // removing the startButton
                    stage.findOne("#startButton").remove();


                    // starting the first problem
                    setTimeout(nextProblem, 2000);


                    return true;
                }


                // cycling through all the flyingWords
                flyingWordsArray.forEach(function (thisWord) {


                    // exiting if problem.hittableOn is false
                    if (!problem.hittableOn) {
                        return;
                    }


                    // calculating 
                    var isHit = (function () {


                        // saving reference to the current word
                        var word = thisWord;


                        // setting conditions in separate, easy-to-understand variables
                        var overTop = y < word.y() - (word.height / 2) * word.scaleY() * 2; // adding '*2' to make it easier to hit
                        var underBottom = y > word.y() + (word.height / 2) * word.scaleY() * 2; // adding '*2' to make it easier to hit
                        var toRight = x > word.x() + (word.width / 2) * word.scaleX();
                        var toLeft = x < word.x() - (word.width / 2) * word.scaleX();


                        // returning false if we're over the top, or to the right, etc.
                        if (toRight || toLeft || overTop || underBottom) {
                            return false;
                        }


                        // otherwise, returning true
                        return true;
                    }());


                    // doing nothing if it's not a hit...
                    if (!isHit) {
                        return;
                    }


                    // ...but if it IS a hit...
                    // hiding any hints still up
                    hint.hide();


                    // clearing any old flyingWordsTweens
                    flyingWords.clearFlyingTweens();


                    // making sure we can't hit the same word twice
                    problem.hittableOn = false;


                    // forking off, depending on whether answer is right or wrong
                    if (thisWord.isCorrectAnswer) {
                        explosionSequence(x, y, thisWord);
                        answeredRight();
                    } else if (problem.unanswered) {
                        answeredWrong();
                    }


                    // removing all the flyingWords
                    flyingWordsArray.forEach(function (thisFlyingWord) {
                        thisFlyingWord.destroy();
                    });
                });
            }




            function explosionSequence(x, y, flyingWord) {


                // showing the correct word in floating text, if specified
                if (flyingWord) {


                    // getting the two words
                    var jap = flyingWord.text;
                    var eng = vocabList.getTargetEnglish();


                    // creating the text itself
                    var text = new Konva.Text({
                        text: jap + "\n" + eng,
                        fontSize: 18,
                        fill: "yellow",
                        x: x,
                        y: y,
                        align: "center",
                        opacity: 0
                    });


                    // positioning the text
                    text.x(text.x() - text.width() / 2);
                    text.y(text.y() - text.height() / 2);


                    // keeping the text on-screen if it would otherwise be too high
                    if (text.y() < 40) {
                        text.y(40);
                    }
                    layer.add(text);


                    // Tween 1 of 2: moving the word up the screen
                    var tween = new Konva.Tween({
                        node: text,
                        y: text.y() - 40,
                        duration: 3,
                        onFinish: function () {
                            text.remove();
                        }
                    }).play();


                    // Tween 2 of 2: fading the word in (quickly) and then out (more slowly)
                    var fadeInTween = new Konva.Tween({
                        node: text,
                        opacity: 1,
                        duration: 0.5,
                        onFinish: function () {
                            setTimeout(function () {
                                var fadeOutTween = new Konva.Tween({
                                    node: text,
                                    opacity: 0,
                                    duration: 1
                                }).play();
                            }, 1500);
                        }
                    }).play();
                }


                // playing the explosion sound
                explosionSound.play();


                // calculating the explosion size, based on distance from center
                var explosionSize = (function () {
                    if (x && y && flyingWord) {
                        var distanceX = $canvasHolder.width() / 2 - x;
                        var distanceY = $canvasHolder.height() / 2 - y;
                        return (Math.sqrt(Math.pow(distanceX, 2) + Math.pow(distanceY, 2)) * 3) / 200;
                    }
                    return 1;
                }());


                // showing the explosion image, at the x & y coordinates if input, or in dead center, if not
                if (x && y) {
                    explosion.show(x, y, explosionSize);
                } else {
                    var myExplosion = ExplosionFactory({
                        layer: layer,
                        x: x || stageWidth / 2,
                        y: y || stageHeight / 2,
                        fill: "orange"
                    });
                    var myBlast = BlastCircle({
                        layer: layer,
                        radius: stageHeight / 4,
                        duration: 2,
                        blastInterval: 100,
                        strokeWidth: 4,
                        opacity: 1,
                        x: stageWidth / 2,
                        y: stageHeight / 2,
                        stroke: "red"
                    });

                }
            }


            var answeredRight = (function () {


                var totalRight = 0;


                return function () {


                    // record keeping
                    problem.unanswered = false;
                    totalRight++;


                    // playing the sound, if it's not the last problem
                    explosionSound.play();


                    // removing the word from the problem.remainingWords
                    vocabList.removeAnsweredWord();


                    // coloring the dot
                    $(".dotBlank:first").removeClass("dotBlank").addClass("dotGreen");


                    // if we're not finished yet...
                    if (totalRight < problem.data.length) {
                        setTimeout(nextProblem, 1000); // was 2000


                        // ... but if we ARE finished...
                    } else {


                        // finishing up the problem and sending the results
                        var results = {
                            time_taken: score.time_taken,
                            number_problems: problem.data.length,
                            number_mistakes: score.number_mistakes
                        };


                        // removing html mousemove listeners
                        $("html").off("mousemove");


                        // sending the results object, and also a reference to the function to call when returned from the
                        tools.send_results(results, backFromSendResults);
                        function backFromSendResults() {


                            // stopping the background noise
                            spaceBackgroundNoise.pause();


                            // adding the 'assignment_results' div after a slight pause
                            setTimeout(function () {

                                // passing in the object to put the assignment_results stuff into, and the data to display
                                tools.showAssignmentResults({
                                    container: $("#mainProblemsHolder"),
                                    data: {
                                        時間: score.time_taken + " 秒",
                                        問題数: results.number_problems + " 問",
                                        間違い: score.number_mistakes
                                    }
                                });

                            }, 1000);
                        }


                        $("html").off("keydown", keyPressed);
                        $("#pauseButton").off(clickOrTouchstart, toggleTweenPause);
                        $("#playButton").off(clickOrTouchstart);
                        $("#spaceStartButton").off(clickOrTouchstart);
                        $("#spaceMain").off(clickOrTouchstart);
                    }
                };
            }());


            function answeredWrong() {


                // hiding the hint
                hint.hide();


                // stopping this function from being called twice
                problem.unanswered = false;


                // playing the explosion sound
                explosionSound.play();


                // removing all the flyingWords
                while (flyingWordsArray.length > 0) {
                    flyingWordsArray[0].remove();
                    flyingWordsArray.splice(0, 1);
                }


                // showing the answer at the top
                showAnswer(false);


                // incrementing total number of wrong answers
                score.number_mistakes++;


                // flashing the spaceShake div before going on to the answeredWrong function!
                var hidden = true;
                var spaceShakeCounter = 0;
                var spaceShakeLimit = 10;
                var flashInterval = setInterval(function () {
                    if (hidden) {
                        spaceShakeCounter++;
                        $("#spaceShake").css("visibility", "visible");
                        hidden = false;
                        if (spaceShakeCounter > spaceShakeLimit) {
                            $("#spaceShake").css("visibility", "hidden");
                            clearInterval(flashInterval);
                        }
                    } else {
                        $("#spaceShake").css("visibility", "hidden");
                        hidden = true;
                    }
                }, 50);
            }


            // div that shows the answer, or other messages
            function showAnswer(answeredCorrectly) {


                // retrieving the words to display
                var engWord = vocabList.getTargetEnglish();
                var japWord = vocabList.getTargetJapanese();


                // showing the answerDiv div, in all cases
                $(".answerDiv").html("<p>" + engWord + " = " + japWord + "</p>")
                        .off(clickOrTouchstart)
                        .css({
                            color: "lightgreen",
                            display: "block"
                        });


                // adding clickability if the problem was not answered correctly
                if (!answeredCorrectly) {


                    // coloring the text red	
                    $(".answerDiv").css({color: "red"});


                    // adding a continue button, after a moment's pause
                    setTimeout(function () {


                        // appending the closeButton to the div, and coloring it red
                        $(".answerDiv").append("<br class='clearFloat'><div class='spaceControls' id='closeButton'>Next <span class='glyphicon glyphicon-play'></span><span class='glyphicon glyphicon-play'></span></div>");


                        // wiring up the closeButton
                        $("#closeButton").on(clickOrTouchstart, function (event) {


                            // stopping clicking the button from firing a bullet
                            event.stopPropagation();


                            // deactivating the button once it's been clicked
                            $(this).off(clickOrTouchstart);


                            // moving on to the next problem
                            nextProblem();
                        });
                    }, 3000);
                }
            }


            // creating the Stars background...
            var starsBackground = myStarsBackground({
                stage: stage,
                layer: layer,
                numberStars: defaults.numberStars,
                starFlyTime: defaults.starFlyTime
            });


            function keyPressed(event) { // *** Use 'keydown' event for space bar to override page-down behavior


                // checking for spacebar press
                if (event.keyCode === 32) {


                    // keeping the page from scrolling
                    event.preventDefault();


                    // playing audio if there is any audio to play
                    audio.play();
                }


                // pausing with the 'p' key...
                if (event.keyCode === 80) {
                    $("#pauseButton").click();
                }
            }


            function toggleTweenPause(event) {


                // preventing a bullet from firing
                event.stopPropagation();


                // combining the startweens and the flyingWordsTweens into one...
                var allTweens = starsBackground.allStarMovements().concat(flyingWords.getFlyingWordsTweens());


                // if we're paused, unpausing
                if (problem.isPaused) {


                    // hiding the filter & making words visible
                    $("#spaceGrayFilter").css("display", "none");


                    spaceBackgroundNoise.play();


                    // changing the pauseButton coloring and text
                    $("#pauseButton").removeClass("pauseButtonClicked").text("ポーズ");


                    // playing the sound again after pause is released
                    $("#playButton").click();


                    // hiding the pausedText
                    pausedText.hideText();


                    // restarting all tweens
                    allTweens.forEach(function (thisTween) {
                        thisTween.play();
                    });


                    // or else, if it's NOT paused, then we pause it
                } else {


                    spaceBackgroundNoise.pause();


                    // showing the filter, thus obscuring the words
                    $("#spaceGrayFilter").css("display", "block");


                    // changing the pauseButton coloring and text
                    $("#pauseButton").addClass("pauseButtonClicked").text("再開");


                    // showing the pausedText
                    pausedText.showText();


                    // restarting all tweens
                    allTweens.forEach(function (thisTween) {
                        thisTween.pause();
                    });
                }

                // toggling problem.isPaused
                problem.isPaused = !problem.isPaused;
            }




            /*  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  */




            // creating the pausedText
            var pausedText = {
                hideText: function () {
                    $("#paused").removeClass("showing");
                },
                showText: function () {
                    $("#paused").addClass("showing");
                }
            };


            var explosion = (function () {


                // keeping trackof whether an explosion is now taking place
                var nowExploding = false;


                return {
                    show: function (x, y, explosionSize) {


                        // doing nothing if a previous explosion is still under way
                        if (nowExploding) {
                            return;
                        }


                        nowExploding = true;


                        // the glowy, half-transparent explosion thing
                        var myExplosion = ExplosionFactory({
                            layer: layer,
                            x: x,
                            y: y,
                            radius: explosionSize * 100,
                            fill: "limegreen",
                            callback: function () {
                                nowExploding = false;
                            }
                        });


                        // the expanding ring
                        var myBlast = BlastCircle({
                            layer: layer,
                            radius: explosionSize * 100,
                            duration: 2,
                            blastInterval: 330,
                            strokeWidth: 5 * explosionSize,
                            opacity: 0.8,
                            easing: Konva.Easings.EaseOut,
                            x: x,
                            y: y,
                            stroke: "yellow",
                            callback: function () {
                                nowExploding = false;
                            }
                        });
                    }
                };
            }());


            var hint = {
                show: function () {


                    // exiting if no wordToPlay is not defined
                    if (!vocabList.getTargetEnglish) {
                        return;
                    }


                    // hiding the hint instead if it is already showing
                    if ($("#hint-holder").css("top") === "0px") {
                        hint.hide();
                        return;
                    }


                    // setting the hint text to the wordToPlay, and positioning it accordingly
                    $("#hint-holder").text(vocabList.getTargetEnglish())
                            .css({top: "-34px", opacity: "1"})
                            .animate({top: "0px"}, 400);
                },
                hide: function () {
                    $("#hint-holder").css({top: "0px"}).fadeTo(400, 0, function () {
                        $("#hint-holder").empty().css({top: "-34px"});
                    });
                },
                pauseBeforeShow: 500
            };


            // wiring up the hint-button
            $("#hintButton").on("click", function () {
                hint.show();
            });

        });
