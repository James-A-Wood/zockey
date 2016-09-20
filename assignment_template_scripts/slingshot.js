/* 
 * 
 * 
 *      JavaScript for Slingshot
 *      
 * 
 */


define(
        [
            "jquery",
            "Konva",
            "tools",
            "helpers/splitIntoWords",
//            "helpers/fixedProblemHolder",
            "konva/WordBlock",
            "konva/slingshotBall",
            "konva/targetingMark",
            "helpers/SoundEffects"
        ],
        function ($, Konva, tools, splitIntoWords, WordBlockFactory, slingshotBall, targetingMark) { //, fixedProblemHolder


            // keeping screen at least 320px wide, for mobile - and disabling scaling!  Cool!
            tools.setMobileScreenWidth(320);


            var score = tools.score();
            var isMobile = tools.isMobile();
            var wordBlocksArray = [];
            var goalPostSpread = $("#slingshotMain").width() / 10;
            var ball = null;
            var problemNumber = 0;
            var clock = tools.clock({
                container: $("#clock-holder"),
                pauseStart: true
            });


            // adjusting the height of $("#slingshotMain") on mobile
            tools.fixedProblemHolder();


            // adjusting the #slingshotMain height for mobile
            if (window.innerWidth < 600) {
                $("#slingshotMain").css({height: window.innerHeight * 0.5});
            }


            // creating the stage
            var stage = new Konva.Stage({
                container: "slingshotMain",
                width: $("#slingshotMain").width(),
                height: $("#slingshotMain").height()
            });


            // importing the "targetingMark" module, passing in a reference to the stage
            var showTargetingMark = targetingMark({
                stage: stage
            });


            var wordBlocksLayer = new Konva.Layer();
            wordBlocksLayer.listening(false);
            stage.add(wordBlocksLayer);


            var ballHome = {
                x: stage.width() / 2,
                y: stage.height() - goalPostSpread - 25
            };


            var wordBlock = (function () {


                // wordBlockFactory as a local variable
                var wordBlockFactory = WordBlockFactory({
                    parentLayer: wordBlocksLayer,
                    stroke: "transparent",
                    textSize: stage.width() / 30,
                    textFill: "white",
                    rotate: null,
                    paddingY: 1,
                    paddingX: 1
                });


                return function (word, color, isNextButton) {


                    // an instance of the wordBlockFactory, instantiated (once!) above
                    var group = wordBlockFactory({
                        fill: color,
                        text: word,
                        paddingX: isNextButton ? 45 : 5,
                        name: "wordBlock",
                        rotate: null, //isNextButton ? null : 10,
                        id: isNextButton ? "nextButton" : null
                    });
                    group.setOpacity(isNextButton ? 1 : 0);
                    group.text = word;
                    group.listening(isNextButton ? true : false);


                    // causes the wordBlock, which has been hit, either to disappear or spring back to it starting position
                    group.knockAway = function (correctHit) {


                        // doing nothing if the ball is not in its original position
                        if (this.x() !== this.originalX && this.id() !== "nextButton") {
                            return;
                        }


                        var yDiff = (this.y() - ballHome.y) / 4 * ball.impactForce;


                        var tween = new Konva.Tween({
                            node: group,
                            y: (function () {
                                if (ball.hitFromDirection === "top") {
                                    return group.y() - yDiff / 6;
                                } else if (ball.hitFromDirection === "bottom") {
                                    return group.y() + yDiff / 6;
                                }
                                return group.y();
                            }()),
                            x: (function () {
                                if (ball.hitFromDirection === "right") {
                                    return group.x() + yDiff / 6;
                                } else if (ball.hitFromDirection === "left") {
                                    return group.x() - yDiff / 6;
                                }
                                return group.x();
                            }()),
                            opacity: (correctHit ? 0 : 1),
                            duration: (correctHit ? 0.5 : 0.3),
                            easing: (correctHit ? Konva.Easings.StrongEaseOut : Konva.Easings.EaseOut),
                            onFinish: function () {
                                if (correctHit) {
                                    group.remove();
                                } else {
                                    // tween.reverse(); // DOESN'T SEEM to work well here, so tweening back manually
                                    var backTween = new Konva.Tween({
                                        node: group,
                                        y: group.originalY,
                                        x: group.originalX,
                                        opacity: 1,
                                        duration: (correctHit ? 0.5 : 0.3),
                                        easing: (correctHit ? Konva.Easings.StrongEaseIn : Konva.Easings.EaseIn)
                                    }).play();
                                }
                            }
                        }).play();
                    };


                    return group;
                };
            }());


//            var problem = (function () {


            /*
             *  Methods:
             * 
             *  "nextProblem" -> prepares the next problem
             *  "answers" -> returns the answers array
             *  "checkAnswer" -> takes input from the slingshotBall object and checks if the wordBlock is right or not
             *  
             */


            // local variables
            var sentences = [];
            var answers = [];
            var numberOfProblems;
            var blankText = " _______ ";


            // retrieving the data before kicking off the cycle
            tools.getProblemData(function (data) {


                // NEW TEST!
                if (tools.addFixedProblemHolder) {
                    tools.addFixedProblemHolder();
                }


                // NEW TEST removing extraneous problems
                if (data.number_problems && data.number_problems > 1) {
                    data.problem = tools.whittleDownArray(data.problem, data.number_problems);
                }


                nextProblem(data.problem);
            });


            // private function
            function appendWordToSentence(newWord, isTheLastWord) {


                // taking everything before the blankText
                var thingText = $("#englishTextHolder").text().split(blankText)[0];


                // appending the new word and then the blankedText (or nothing, if it's the last word)
                $("#englishTextHolder").text(thingText + " " + newWord + (isTheLastWord ? "" : blankText));
            }


            // saving the standard font size, so we can restore it to its original value after it has been changed
            var standardFontSize = $("#textHolder").css("font-size");


            function nextProblem(problemSet) {


                // setting the problems, if passed in as a parameter (from ajax)
                if (problemSet) {
                    sentences = problemSet;
                    numberOfProblems = sentences.length;
                }


                problemNumber += 1;
                $("#problem-number-holder").text(problemNumber + "  of  " + numberOfProblems);


                // emptying the answers array
                answers.length = 0; // emptying the array by setting its length to 0!


                // plucking off the first sentence in the array
                var sentence = sentences.shift();


                // adjusting font size so the whole sentence fits on one line
                $("#japaneseTextHolder").empty().css({fontSize: standardFontSize}).append("「" + sentence[0] + "」");


                tools.shrinkFont($("#japaneseTextHolder"));


                $("#englishTextHolder").empty().css({fontSize: standardFontSize}).append(sentence[1]);
                tools.shrinkFont($("#englishTextHolder"));
                $("#englishTextHolder").empty();


                // breaking the sentence into separate words
                var combinedWidth = 0;
                var color = tools.pickDarkColor();


                // calculating the combinedWidth of all the words, and also removing underscores
                var words = splitIntoWords(sentence[1]);
                words.forEach(function (thisWord) {
                    answers.push(thisWord);
                    var word = wordBlock(thisWord, color);
                    wordBlocksArray.push(word);
                    combinedWidth += word.width;
                    wordBlocksLayer.add(word);
                });


                // calculating amount of space to put between wordBlocks
                var spaceBetweenWordBlocks = (stage.width() - combinedWidth) / (wordBlocksArray.length + 1);
                var arrangedWordsArray = [];


                // putting up the words randomly on the screen
                var dummyArray = wordBlocksArray.slice();
                while (dummyArray.length > 0) {


                    // picking a random element from the array of glocks
                    var block = tools.pickOneFrom(dummyArray, true);


                    // if it's the first element, then starting at the very left
                    if (arrangedWordsArray.length === 0) {
                        block.x(spaceBetweenWordBlocks);
                    } else {


                        // if there IS a previous word, then positioning this word AFTER it (leaving an appropriate space)
                        var lastWord = arrangedWordsArray[arrangedWordsArray.length - 1];
                        block.x(lastWord.x() + lastWord.width + spaceBetweenWordBlocks);
                    }


                    arrangedWordsArray.push(block);
                    block.y(40);


                    // keeping track of their original positions
                    block.originalX = block.x();
                    block.originalY = block.y();
                }


                wordBlocksLayer.draw();


                // fading in the blocks
                var dropDelay = 1000;
                var dropDistance = 20;
                var dropDuration = 0.5;


                wordBlocksLayer.find(".wordBlock").each(function (thisBlock) {
                    setTimeout(function () {
                        thisBlock.y(thisBlock.y() - dropDistance);
                        var tween = new Konva.Tween({
                            duration: dropDuration,
                            node: thisBlock,
                            y: thisBlock.y() + dropDistance,
                            opacity: 1,
                            easing: Konva.Easings.EaseOut
                        }).play();
                    }, dropDelay);
                });


                // removing the ball, and instantiating a new one
                try {
                    ball.remove();
                } catch (e) {
                    // nothing to report...
                }

                // instantiating a new ball (with layer, etc.)
                ball = slingshotBall({
                    stage: stage,
                    radius: 10,
                    sounds: true,
                    hitSoundSource: "/sounds/slingshot/hit.mp3",
                    shootSoundSource: "/sounds/slingshot/shoot.mp3",
                    ballHome: {
                        x: stage.width() / 2,
                        y: stage.height() * 0.7
                    },
                    rubberbandColor: "#666",
                    rubberbandWidth: 1.5,
                    speed: 15,
                    goalPostRadius: isMobile ? 3 : 4,
                    goalPostSpread: isMobile ? stage.width() / 4 : stage.width() / 8,
                    goalPostColor: "navy",
                    targets: wordBlocksArray,
                    highlightTargeted: showTargetingMark,
                    onHit: checkAnswer,
                    onShoot: function () {
                        clock.start();
                    },
                    blastCircleShape: "star",
                    blastCircleOuterRadius: 50,
                    blastCircleInnerRadius: 30,
                    blastCircleStroke: "red",
                    blastCircleStrokeWidth: 3,
                    blastCircleFill: "transparent",
                });
            }


            function checkAnswer(targetHit) { // called from slingshotBall.js (the ball class)


                // if the correct word was hit...
                if (targetHit.text === answers[0]) {


                    answers.shift(); // removing the first element of the answers array
                    wordBlocksArray.shift(); // removing the wordBlock that was hit from the wordBlocksArray
                    targetHit.knockAway(true); // 'true' means 'yes, remove the wordBlock'


                    // checking if the wordBlocksArray has been whittled down to 0
                    if (wordBlocksArray.length === 0) {


                        // adding word to the sentence at the top...
                        appendWordToSentence(targetHit.text, true); // 'true' means it's NOT the last word of the sentence, so add parens after it


                        // if all problems have also been finished...
                        if (sentences.length === 0) {


                            // preparing the results
                            var results = {
                                time_taken: score.time_taken,
                                number_problems: numberOfProblems,
                                number_mistakes: score.number_mistakes
                            };


                            tools.send_results(results, backFromSendResults);
                            function backFromSendResults() {

                                // adding the 'assignment_results' div after a slight pause
                                setTimeout(function () {

                                    // passing in the object to put the assignment_results stuff into, and the data to display
                                    tools.showAssignmentResults({
                                        container: $("#cloudsHolder"),
                                        data: {
                                            時間: score.time_taken + " 秒",
                                            問題数: results.number_problems + " 組",
                                            間違い: score.number_mistakes
                                        }
                                    });
                                }, 1000);
                            }


                            // if there are still some sentences left...
                        } else if (wordBlocksLayer.find(".nextButton").length === 0) {


                            var nextButton = wordBlock("Next", "darkgreen", true);
                            nextButton.x(stage.width() / 2 - nextButton.width / 2);
                            nextButton.y(stage.height() / 3);
                            wordBlocksLayer.listening(true);
                            wordBlocksLayer.add(nextButton).draw();
                            wordBlocksArray.push(nextButton);


                            // lightening the text
                            wordBlocksLayer.find(".problemText").opacity(0);
                            wordBlocksLayer.draw();


                            // making the nextButton respond to clicks and touches, as well as being shot
                            nextButton.on(tools.click0rTouch, function () {
                                nextButton.off(tools.click0rTouch).remove();
                                wordBlocksLayer.listening(false);
                                wordBlocksLayer.draw();
                                wordBlocksArray.splice(0, 1);
                                nextProblem();
                            });
                        }


                        // if there are more words left (the problem isn't finished)
                    } else {
                        appendWordToSentence(targetHit.text);
                    }


                    // return whether it's the right answer or not
                    return true;


                    // checking if we're hitting the "nextButton"
                } else if (targetHit.id() === "nextButton") {

                    targetHit.knockAway(true);
                    wordBlocksArray.shift();
                    nextProblem();

                    return true;

                    // finally, if it's a wrong hit...
                } else {

                    targetHit.knockAway(false); // 'false' means 'jostle the block, but return it to its place'
                    registerMiss();

                    score.number_mistakes++;

                    // if it's neither the correct answer nor the nextButton
                    return false;
                }
            }


            // adding a layer with a circle, centered at ballHome, that is 
            // numb to touch events, 3 times the radius of the ball,
            // so that dragging the ball doesn't inadvertently drag the whole screen
            var noTouchLayer = (function () {
                var layer = new Konva.Layer();
                stage.add(layer);
                var numbToTouchCircle = new Konva.Circle({
                    x: ballHome.x,
                    y: ballHome.y,
                    radius: goalPostSpread * 3 // making the 'numbToTouchCircle' three times the radius of the goalPostSpread
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


            var registerMiss = (function () {


                var $scoreHolder = $("#score-holder");
                var originalText = $scoreHolder.text();
                var numberMisses = 0;


                // hiding the $scoreHolder at first, and setting its default text
                $scoreHolder.css({opacity: 0}).text(originalText + numberMisses);


                return function () {

                    numberMisses += 1;
                    $scoreHolder.text(originalText + numberMisses);

                    // fading in the thing, if it's not already visible
                    if ($scoreHolder.css("opacity") !== 1) {
                        $scoreHolder.fadeTo(200, 1);
                    }
                };
            }());

        });