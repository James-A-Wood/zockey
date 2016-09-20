/* 
 * 
 *      JavaScript for Slingshot_blanks thing!
 * 
 */


define(
        [
            "jquery",
            "tools",
            "helpers/processSentence",
            "Konva",
            "konva/fireworks",
            "konva/WordBlock",
            "konva/slingshotBall",
            "konva/targetingMark",
            "libraries/transit"
        ],
        function ($, tools, processSentence, Konva, fireworksFactory, wordBlockFactory, slingshotBallFactory, targetingMark) {


            // keeping screen at least 320px wide, for mobile - and disabling scaling!  Cool!
            tools.setMobileScreenWidth(320);


            var score = tools.score();
            var wordBlocksArray = [];
            var goalPostSpread = 75;
            var $slingshotMain = $("#slingshotMain");


            // creating the stage
            var stage = new Konva.Stage({
                container: "slingshotMain",
                width: $slingshotMain.width(),
                height: $slingshotMain.height()
            });


            // setting up the fireworks display at the end
            var fireworks = fireworksFactory(stage);


            // setting up the glowing red dots above targeted words
            var myTargetingMark = targetingMark({
                stage: stage
            });


            var textLayer = new Konva.Layer({
                listening: false
            });
            var wordBlocksLayer = new Konva.Layer({
                listening: false
            });

            stage.add(textLayer).add(wordBlocksLayer);


            var ballHome = {
                x: stage.width() / 2,
                y: stage.height() * 0.7
            };


            var getTextWithBlanks = function (input) {


                // breaking the sentence up into its parts
                var sentence = processSentence(input);


                // displaying the English part, with a blank
                $("#english-holder").empty().append(sentence.stuffBeforeSentakushi + "<span id='my-blank-holder'>________</span>" + sentence.stuffAfterSentakushi);


                // NEW TEST shrinking so it fits on one line, if necessary
                tools.fitOnOneLine($("#english-holder"));


                // returning some methods...
                return {
                    isCorrect: function (checkThis) {
                        return (checkThis === sentence.correctAnswer); // returning true or false
                    },
                    showAnswer: function () {

                        $("#my-blank-holder")
                                .css({opacity: 0})
                                .addClass("answered")
                                .empty()
                                .append("<span class='glyphicon glyphicon-ok'></span>" + sentence.correctAnswer);

                        tools.fitOnOneLine($("#english-holder"));

                        $("#my-blank-holder").transition({
                            opacity: 1
                        }, 1000);
                    },
                    sentakushi: sentence.sentakushi
                };
            };


            // adding a scoreBar, with public function "update"
            var scoreBar = (function () {


                // adding a new layer just for the scorebar
                var scoreBarLayer = new Konva.Layer({
                    listening: false
                });
                stage.add(scoreBarLayer);


                // starting the problem number at 0
                var problemNumber = 0;
                var scoreText = new Konva.Text({
                    fontSize: stage.width() / 30,
                    fill: "gray"
                });
                scoreBarLayer.add(scoreText).draw();


                return {
                    update: function () {
                        problemNumber += 1;
                        scoreText.text(problemNumber + "  of  " + problem.numberProblems());
                        scoreText.x((stage.width() - scoreText.width()) / 2);
                        scoreText.y(stage.height() - scoreText.height() - 3);
                        scoreBarLayer.draw();
                    }
                };
            }());


            var problem = (function () {

                /*
                 *  Public methods:
                 * 
                 *  'nextProblem' -> prepares the next problem
                 *  'numberProblems' -> returns the total number of problems
                 *  'checkAnswer' -> takes input from the SlingshotBall object and checks if the wordBlock is right or not
                 *  
                 */


                // local variables
                var sentences = [];
                var englishText;
                var numberOfProblems;
                var textDefaultFontSize = $("#english-holder").css("font-size");


                // retrieving the data before kicking off the cycle
                tools.getProblemData(function (data) {
                    if (data.problems) {

                        // FINALLY fading in the #mainProblemsHolder
                        $("#mainProblemsHolder").fadeTo(200, 1);

                        problem.nextProblem(data.problems);
                    } else {

                        // FINALLY fading in the #mainProblemsHolder
                        $("#mainProblemsHolder").fadeTo(200, 1);

                        problem.nextProblem(data.problem);
                    }
                });


                return {
                    nextProblem: function (ajaxData) {


                        wordBlocksLayer.opacity(0);
                        textLayer.opacity(0);


                        // setting the problems, if passed in as a parameter (from ajax)
                        if (ajaxData) {
                            sentences = ajaxData;
                            numberOfProblems = sentences.length;
                        }


                        // updating the score
                        scoreBar.update();


                        // picking out the first sentence in the array
                        var sentence = sentences.shift();


                        // restoring the previous font size
                        $(".text-holder").css({
                            opacity: 0,
                            fontSize: textDefaultFontSize
                        });


                        // showing the Japanese sentence
                        $("#japanese-holder").text(sentence[0]);


                        // forcing the Japanese to fit on one line
                        tools.fitOnOneLine($("#japanese-holder"));


                        // removing any old English sentence
                        englishText = getTextWithBlanks(sentence[1]);


                        // dropping the textLayer and wordBLocksLayer from the top
                        (function () {

                            var dropDuration = 0.75;

                            textLayer.opacity(1);
                            wordBlocksLayer.opacity(0);
                            stage.draw();


                            // fading in the sentences
                            $(".text-holder").transition({
                                opacity: 1
                            }, 1000);


                            setTimeout(function () {

                                var tween2 = new Konva.Tween({
                                    node: wordBlocksLayer,
                                    y: 0,
                                    opacity: 1,
                                    duration: dropDuration,
                                    easing: Konva.Easings.EaseOut
                                }).play();

                            }, 500);
                        }());


                        // breaking the sentence into separate words
                        var words = englishText.sentakushi;
                        var combinedWidth = 0;


                        // choosing a random color for the wordBlocks
                        var color = tools.pickDarkColor();


                        // calculating the combinedWidth of all the words, and also removing underscores
                        for (var i = 0; i < words.length; i++) {

                            // removing underscores
                            while (words[i].indexOf("_") !== -1) {
                                words[i] = words[i].replace("_", " ");
                            }

                            var word = wordBlock(words[i], color);

                            wordBlocksArray.push(word);
                            combinedWidth += word.width;
                            wordBlocksLayer.add(word);
                        }


                        // calculating amount of space to put between wordBlocks
                        var spaceBetweenWordBlocks = (stage.width() - combinedWidth) / (wordBlocksArray.length + 1);
                        var arrangedWordsArray = [];

                        // mixing up the words!
                        var dummyArray = wordBlocksArray.concat();
                        while (dummyArray.length > 0) {


                            // choosing a random element
                            var rand = tools.pickIntFrom(dummyArray);


                            // if it's the first element, then starting at the very left
                            if (arrangedWordsArray.length === 0) {
                                dummyArray[rand].x(spaceBetweenWordBlocks);
                            } else {

                                // if there IS a previous word
                                var lastWord = arrangedWordsArray[arrangedWordsArray.length - 1];
                                dummyArray[rand].x(lastWord.x() + lastWord.width + spaceBetweenWordBlocks);
                            }
                            arrangedWordsArray.push(dummyArray[rand]);
                            dummyArray[rand].x();
                            dummyArray[rand].y(50);

                            dummyArray.splice(rand, 1);
                        }


                        wordBlocksLayer.draw();
                    },
                    numberProblems: function () {
                        return numberOfProblems;
                    },
                    checkAnswer: function (targetHit) {


                        // if the correct word was hit...
                        if (englishText.isCorrect(targetHit.text)) {


                            // showing the correct answer up in the English sentence
                            englishText.showAnswer();


                            // adding a scoreDot
                            scoreDot(true);


                            // marking this answer CORRECT by subtracting one 'number_mistake' that was assigned when the ball was fired
                            score.number_mistakes--;


                            // removing the wordBlock that was hit
                            wordBlocksArray.splice(wordBlocksArray.indexOf(targetHit), 1);


                            // 'true' means 'yes, remove the wordBlock'
                            targetHit.knockAway(true);


                            // removing all the wordBlocks from the layer, and redrawing
                            for (var i = 0; i < wordBlocksArray.length; i++) {
                                wordBlocksArray[i].remove();
                            }
                            wordBlocksLayer.draw();


                            // if all problems have also been finished...
                            if (sentences.length === 0) {


                                endSequence();


                                // if there are more sentences left, but there's still no nextButton...
                            } else if (stage.find(".nextButton").length === 0) {


                                // putting up the NextButton
                                var nextButton = wordBlock("Next", "darkgreen", true);
                                nextButton.x(stage.width() / 2 - nextButton.width / 2);
                                nextButton.y(stage.height() / 3);


                                // moving textLayer to top of stack, and setting 'listening' to true...
                                textLayer.listening(true).setZIndex(stage.getChildren().length + 1);
                                nextButton.opacity(0);
                                textLayer.add(nextButton).draw();


                                // clearing the wordBlocksArray, but then adding the nextButton (so the ball can hit it)
                                wordBlocksArray.length = 0;
                                wordBlocksArray.push(nextButton);


                                // making the nextButton respond to clicks and touches, as well as being shot
                                nextButton.on("click touchstart", function () {
                                    nextButton.off("click touchstart").remove();
                                    textLayer.listening(false).draw();
                                    wordBlocksArray.splice(0, 1);
                                    problem.nextProblem();
                                });


                                // showing the nextButton
                                setTimeout(function () {
                                    var tween = new Konva.Tween({
                                        node: nextButton,
                                        opacity: 1,
                                        duration: 0.25
                                    }).play();
                                }, 500);
                            }

                            // return whether it's the right answer or not
                            return true;

                            // checking if we're hitting the "nextButton"
                        } else if (targetHit.id() === "nextButton") {
                            targetHit.knockAway(true);
                            problem.nextProblem();

                            return true;

                            // finally, if it's a wrong hit...
                        } else {

                            // adding a scoreDot
                            scoreDot(false);

                            // if it's neither the correct answer nor the nextButton
                            targetHit.knockAway(false); // 'false' means 'bounce, but don't the wordBlock'
                            return false; // returning false so 
                        }
                    }
                };
            }());


            var wordBlock = (function () {

                // local variable
                var wordBlock = wordBlockFactory({
                    stroke: "transparent",
                    textSize: stage.width() / 30, //(tools.isMobile() ? 25 : 30),
                    textFill: "white",
                    fill: "navy",
                    paddingY: 5
                });


                return function (word, color, isNextButton) {

                    var textFillColor = (function () {
                        if (isNextButton) {
                            return "white";
                        } else if (tools.isMobile()) {
                            return color;
                        }
                        return "white";
                    }());

                    var fillColor = (function () {
                        if (isNextButton) {
                            return "green";
                        } else if (tools.isMobile()) {
                            return "rgba(255, 255, 255, 0.5)";
                        }
                        return color;
                    }());

                    // an instance of the wordBlockFactory, instantiated (once!) above
                    var group = wordBlock({
                        stroke: "transparent",
                        cornerRadius: isNextButton ? 0 : 4,
                        textFill: textFillColor,
                        fill: fillColor,
                        text: word,
                        paddingY: tools.isMobile() ? 3 : 5,
                        paddingX: isNextButton ? 45 : 15,
                        id: isNextButton ? "nextButton" : null
                    });


                    group.text = word;
                    group.listening(isNextButton ? true : false);


                    group.knockAway = function (isCorrectHit) {


                        // exiting here (without any knockaway tween) if it's the next button
                        if (this.text === "Next") {
                            this.remove();
                            wordBlocksLayer.draw();
                            wordBlocksArray.length = 0;
                            return true;
                        }


                        var xDiff = (this.x() - ballHome.x) / 5;
                        var yDiff = (this.y() - ballHome.y) / 5;
                        var rotation = this.x() / stage.width() * 40 - 20;


                        var tween = new Konva.Tween({
                            node: group,
                            y: group.y() + (isCorrectHit ? yDiff : yDiff / 4),
                            x: group.x() + (isCorrectHit ? xDiff : 0),
                            rotation: (isCorrectHit ? rotation : 0),
                            opacity: (isCorrectHit ? 0 : 1),
                            duration: (isCorrectHit ? 0.5 : 0.3),
                            easing: (isCorrectHit ? Konva.Easings.StrongEaseOut : Konva.Easings.EaseOut),
                            onFinish: function () {
                                if (isCorrectHit) {
                                    group.remove();
                                } else {
                                    tween.reverse();
                                }
                            }
                        }).play();
                    };


                    return group;
                };
            }());


            // backroundLayer
            (function () {
                var layer = new Konva.Layer();
                stage.add(layer);
                var numbToTouchCircle = new Konva.Circle({
                    x: ballHome.x,
                    y: ballHome.y,
                    radius: goalPostSpread * 2 // making the 'numbToTouchCircle' twice the radius of the goalPostSpread
                });
                layer.add(numbToTouchCircle).draw();
                layer.moveToBottom();
                numbToTouchCircle.on("touchstart", function (e) {
                    if (e.touches) {
                        e = e.touches[0];
                    }
                    return false;
                });
                return layer;
            }());


            // always removing the ball instantiating a new one (this is to avoid weird bugs)
            try {
                ball.remove();
            } catch (e) {
                // nothing to report...
            }


            var ball = slingshotBallFactory({
                stage: stage,
                ballHome: {
                    x: stage.width() / 2,
                    y: stage.height() * 0.7
                },
                goalPostColor: "navy",
                rubberBandColor: "#444",
                goalPostRadius: 4,
                shootSoundSource: tools.isMobile() ? "/sounds/slingshot/hit.mp3" : "/sounds/slingshot/shoot.mp3",
                targets: wordBlocksArray,
                highlightTargeted: myTargetingMark,
                onHit: problem.checkAnswer,
                onShoot: function () {
                    score.number_mistakes++;
                }
            });


            // hint, for the uninitiated
            var hint = (function () {

                var text = new Konva.Text({
                    text: "ボールを飛ばして、単語を正しい順番に当てましょう！",
                    fontSize: stage.width() / (tools.isMobile() ? 30 : 45),
                    fill: "gray",
                    width: 180,
                    align: "center",
                    x: 10,
                    y: 5
                });

                var background = new Konva.Rect({
                    width: text.width() + 20,
                    height: text.height() + 10,
                    fill: "#EEE",
                    cornerRadius: 3
                });

                var group = new Konva.Group({
                    opacity: 0,
                    width: background.width()
                });

                group.add(background).add(text);

                group.x(stage.width() / 2 - group.width() / 2);
                group.y(ball.y() + ball.radius() + 10);

                textLayer.add(group).draw();

                // fading in the hint
                var myTimeout = setTimeout(function () {
                    if (typeof group !== "undefined") {
                        var fadeIn = new Konva.Tween({
                            node: group,
                            opacity: 1,
                            duration: 0.5
                        }).play();
                    }
                }, 4000);

                // clearing the hint when the ball is dragged
                ball.off("dragstart", clearHint).on("dragstart", clearHint);

                function clearHint() {
                    ball.off("dragstart", clearHint);
                    clearTimeout(myTimeout);
                    if (typeof group !== "undefined") {
                        var quickFadeout = new Konva.Tween({
                            node: group,
                            duration: 0.2,
                            opacity: 0,
                            onFinish: function endSequencey() {
                                group.remove();
                            }
                        }).play();
                    }
                }
            }());


            var scoreDot = (function () {

                var scoreDotLayer = new Konva.Layer();
                stage.add(scoreDotLayer);

                var spacing = 15;
                var score = {right: 0, wrong: 0};
                var radius = 5;

                return function (isCorrect) {

                    // incrementing score
                    if (isCorrect) {
                        score.right++;
                        var x = stage.width() - (score.right * spacing);
                    } else {
                        score.wrong++;
                        var x = score.wrong * spacing;
                    }

                    var dot = new Konva.Circle({
                        fill: isCorrect ? "green" : "red",
                        radius: radius,
                        x: x,
                        y: stage.height() - spacing,
                        opacity: 0
                    });
                    scoreDotLayer.add(dot);
                    var tween = new Konva.Tween({
                        node: dot,
                        opacity: 1,
                        duration: 0.25
                    }).play();
                };
            }());




            function endSequence() {


                // preparing the results
                var results = {
                    time_taken: score.time_taken,
                    number_problems: problem.numberProblems(),
                    number_mistakes: score.number_mistakes
                };


                fireworks({
                    messageText: "Very nice!",
                    numberOfFireworks: 20,
                    onFinish: function () {

                        tools.send_results(results, backFromSendResults);
                        function backFromSendResults() {


                            // adding the 'assignment_results' div after a slight pause
                            setTimeout(function () {

                                $slingshotMain.css({
                                    background: "none",
                                    border: "none"
                                });

                                // passing in the object to put the assignment_results stuff into, and the data to display
                                tools.showAssignmentResults({
                                    container: $slingshotMain,
                                    data: {
                                        時間: score.time_taken + " 秒",
                                        問題数: results.number_problems + " 問",
                                        間違い: score.number_mistakes
                                    }
                                });

                            }, 1000);
                        }
                    }
                });
            }


        });