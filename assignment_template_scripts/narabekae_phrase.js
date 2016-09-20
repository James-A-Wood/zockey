

define(
        [
            "jquery",
            "tools",
            "helpers/shakeElement",
            "helpers/SoundEffects",
            "howler",
            "jqueryui",
            "bootstrap"
        ],
        function ($, tools, shakeElement, SoundEffects) {


            var score = tools.score();
            var myJSON;


            var hintHandler = (function () {


                var hintButtonEnabled = true;
                var timesUsed = 0;


                return {
                    removeOldHints: function () {
                        $(".hint-text").remove();
                    },
                    enabled: function (onOrOff) {
                        if (onOrOff) {
                            hintButtonEnabled = true;
                        } else {
                            hintButtonEnabled = false;
                        }
                    },
                    numTimesUsed: function () {
                        return timesUsed;
                    },
                    showAnswer: function () {

                        if (!hintButtonEnabled) {
                            return;
                        }

                        hintButtonEnabled = false;
                        timesUsed++;


                        var $this = $(this);
                        var $active = $(".sentences-holder").find(".active");
                        var answersArray = $active.data("answersArray");
                        var answers = "";


                        answersArray.forEach(function (word) {
                            answers += (word + " ");
                        });
                        answers = answers.trim();


                        var $answersSpan = $("<span/>").addClass("hint-text").text(answers).click(function () {
                            $(this).remove();
                        });


                        $(".active").append($answersSpan);


                        $answersSpan.delay(3000).fadeTo(3000, 0);


                        var defaultText = $this.eq(0).text();


                        var counter = 11;


                        $(".hint-button").css({opacity: 0.5});


                        countdown();
                        var interval = setInterval(countdown, 1000);
                        function countdown() {


                            counter--;


                            $(".hint-button").text(defaultText + " (" + counter + ")");


                            if (counter <= 0) {
                                clearInterval(interval);
                                $(".hint-button").text(defaultText).css({opacity: 1});
                                hintButtonEnabled = true;
                            }
                        }
                    }
                };
            }());


            var soundEffects = new SoundEffects({
                container: $("#buttons-holder"),
//                checkByDefault: true,
                playThisOnCheckboxCheck: "tick",
                sounds: {
                    tick: "/sounds/narabekae_phrase/tick.mp3",
                    wrong: "/sounds/wrongSound.mp3",
                    correct: "/sounds/narabekae_phrase/balloon.mp3"
                }
            });


            var button = (function () {

                var $button = $("#check-button");

                return {
                    setForCheck: function () {
                        $button.off("click").on("click", checkAnswer).removeClass("btn-success").addClass("btn-primary").text("チェック");
                    },
                    setForNext: function () {
                        $button.off("click").on("click", nextProblem).removeClass("btn-primary").addClass("btn-success").text("次");
                    },
                    click: function () {
                        $button.click();
                    }
                };
            }());


            var scoreDisplay = (function () {

                var totalNumberProblems = 0;
                var currentProblem = 1;

                function updateScoreText() {
                    $("#score-text-holder").text(currentProblem + " / " + totalNumberProblems);
                }

                return {
                    addScoreDot: function () {
                        totalNumberProblems++;
                        var $scoreDot = $("<div/>").addClass("score-dot unanswered");
                        $("#score-dot-holder").prepend($scoreDot);
                        updateScoreText();
                    },
                    markAnswered: function () {

                        // making sure the currentProblem doesn't exceed the actual number of problems
                        currentProblem = Math.min(currentProblem + 1, totalNumberProblems);

                        $(".unanswered").eq(0).removeClass("unanswered").addClass("answered");
                        updateScoreText();
                    }
                };
            }());


            var clock = tools.clock({
                container: $("#clock-holder"),
                pauseStart: true
            });


            tools.getProblemData(function (d) {


                myJSON = d;


                // shuffling problems, if specified
                if (myJSON.misc && myJSON.misc.shuffleProblems) {
                    myJSON.problem = tools.shuffle(myJSON.problem);
                }


                // removing extra problems, if specified
                if (myJSON.number_problems && myJSON.number_problems > 0) {
                    myJSON.problem = tools.whittleDownArray(myJSON.problem, myJSON.number_problems);
                }


                // building the markup for each problem
                myJSON.problem.forEach(buildNewProblem);


                // showing only the first problem
                $(".problem-holder").eq(0).show().fadeTo(500, 1);


                // styling the button to be a "チェック" button
                button.setForCheck();


                // pre-selecting the first .sentakushis-holder of the problem (if there are more than one)
                $(".sentakushis-holder").eq(0).addClass("active");


                $(".sentakushis-holder").disableSelection().sortable({
                    forceHelperSize: true,
                    forcePlaceholderSize: true,
                    revert: 100,
                    items: ".sentakushi",
                    appendTo: "body", // necessary to prevent the helper from jumping sideways on mousedown
                    placeholder: "placeholder",
                    axis: "x",
                    change: function () {
                        soundEffects.play("tick");
                    },
                    start: function (event, ui) {


                        var $this = $(this);


                        $this.addClass("now-being-dragged");


                        // starting the clock, if not started already
                        clock.start();


                        // adding the "active" class to the .sentakushis-holder
                        if (!$this.hasClass("active")) {


                            // clearing .active on any other .sentakushis-holder, and adding .active to this one
                            $(".active").removeClass("active");
                            $(this).addClass("active");


                            // setting the button to check the problem
                            button.setForCheck();
                        }


                        // manually setting the placeholder size
                        ui.placeholder.width(ui.helper.outerWidth(true)); // subtracting 2 to account for the .placeholder's border width
                        ui.placeholder.height(ui.helper.outerHeight()); // subtracting 2 to account for the .placeholder's border width
                    },
                    stop: function () {
                        $(this).removeClass("now-being-dragged");
                    }
                });
            });


            function buildNewProblem(p) {


                var english, japanese;


                // if there is only one sentence, then setting it to English, and leaving Japanese empty
                // otherwise, setting Japanese to the [0] sentence (if present) and English to the [1] sentence
                if (p.length === 1) {
                    japanese = "";
                    english = p[0];
                } else {
                    japanese = p[0] ? p[0] : "";
                    english = p[1];
                }


                // adding a score block
                scoreDisplay.addScoreDot();


                var japaneseSentenceHolder = "<div class='sentence-holder japanese-sentence'>" + japanese + "</div>";
                var englishSentenceHolder = "<div class='sentence-holder english-sentence'></div>";


                var $problemHolder = $("<div class='problem-holder'><div class='sentences-holder'>" + japaneseSentenceHolder + englishSentenceHolder + "</div></div>");

                var $hintButton = $("<div/>")
                        .addClass("hint-button btn btn-default btn-xs")
                        .text("Hintを表示")
                        .click(hintHandler.showAnswer);


                $problemHolder.append($hintButton);


                $("#all-problems-holder").append($problemHolder);


                var $lastEnglishHolder = $(".english-sentence").last();


                // breaking the sentence into strings and arrays, with the words mixed up inside of them
                english = processSentence(english);
                english.forEach(function (thisPiece) {


                    // if it's a string...
                    if (typeof thisPiece === "string") {


                        // breaking it into individual words, putting each in its own span
                        thisPiece.split(" ").forEach(function (thisWord) {
                            var $span = $("<span/>").addClass("word-holder").text(thisWord);
                            $lastEnglishHolder.append($span);
                        });

                    } else {


                        // ...and if it's an object
                        $lastEnglishHolder.append("<span class='sentakushis-holder set-height'></span>");
                        var $lastSentakushisHolder = $(".sentakushis-holder").last();


                        // appending the .sentakushi divs to the last .sentakushi-holder
                        thisPiece.sentakushiArray.forEach(function (thisSentakushi) {
                            $lastSentakushisHolder.append("<div class='sentakushi min-height'>" + thisSentakushi + "</div>");
                        });


                        // appending the data, to be used in checking the answer
                        $lastSentakushisHolder.data({answersArray: thisPiece.answersArray});
                    }
                });
            }


            function processSentence(sentence) {


                /*
                 * 
                 *      Returns an array of elements, each of which is either
                 *      1) a string, or
                 *      2) an object, with properties:
                 *      
                 *          object.sentakushiArray - a randomly mixed array of words, and
                 *          object.answersArray - the original array of the words in their correct order
                 *                                      
                 *                                      
                 */



                /*
                 *      
                 *      Param checking!
                 *      
                 */
                var numOpeningParens = sentence.match(/\[/g) ? sentence.match(/\[/g).length : 0;
                var numClosingParens = sentence.match(/\]/g) ? sentence.match(/\]/g).length : 0;


                if (numOpeningParens < 1 || numClosingParens < 1) {
                    console.log("Problem seems to have 0 opening and/or closing parens!");
                    return false;
                }


                if (numOpeningParens !== numClosingParens) {
                    console.log("Different number of opening and closing parens!");
                    return false;
                }


                /*
                 * 
                 *      Beyond this point, params are clean!
                 * 
                 */


                var returnArray = [];
                var pieces = sentence.split("[");


                pieces.forEach(function (thisPiece) {


                    // adding the STRING to the returnArray if it contains no closing paren, meaning there are no sentakushi
                    if (thisPiece.indexOf("]") === -1) {
                        returnArray.push(thisPiece);
                        return;
                    }


                    // beyong this point, there is a closing paren - so it has sentakushi!
                    var sentakushiArray = thisPiece.split("]")[0].trim().split(" ");
                    var partAfterSentakushi = thisPiece.split("]")[1];


                    // trimming white space
                    sentakushiArray = tools.trimAllElements(sentakushiArray, {removeUnderscores: true});


                    // making a copy of the sentakushiArray BEFORE it gets shuffled
                    var answersArray = sentakushiArray.concat();


                    // shuffling the sentakushiArray (but not the answersArray);
                    sentakushiArray = tools.shuffle(sentakushiArray, true);


                    var object = {
                        sentakushiArray: sentakushiArray,
                        answersArray: answersArray
                    };


                    // finally, adding the object to the array, along with anything after the sentakushi
                    returnArray.push(object, partAfterSentakushi);
                });


                return returnArray;
            }


            function checkAnswer() {


                // if no problem is active yet, then selecting the first and exiting
                if ($(".active").length === 0) {
                    $(".sentakushis-holder").eq(0).addClass("active");
                    return;
                }


                // a reference to the currently-active ".sentakushis-holder"
                var $active = $(".active");


                // retrieving the correct answers for this .sentakushis-holder
                var answersArray = $active.data("answersArray");


                // building an array of the words in the .sentakushi spans
                var currentWordsArray = [];
                $active.find(".sentakushi").each(function (thisWord, item) {
                    var word = $(item).text();
                    currentWordsArray.push(word);
                });


                // comparing the two arrays, item by item, and returning TRUE if all words are in order, otherwise FALSE
                var answerIsCorrect = currentWordsArray.every(function (thisWord, index) {
                    return thisWord === answersArray[index];
                });


                if (answerIsCorrect) {


                    // removing any hints currently showing
                    hintHandler.removeOldHints();


                    $active.addClass("answered-correctly set-height").removeClass("active").sortable("destroy");


                    if (!tools.isMobile()) {
//                        $("#myCorrectSound")[0].play();
                        soundEffects.play("correct");
                    }

                    // checking if all .sentakushis-holders in the current problem have been answered
                    var numHolders = $(".problem-holder").eq(0).find(".sentakushis-holder").length;
                    var numAnswered = $(".problem-holder").eq(0).find(".sentakushis-holder.answered-correctly").length;


                    // if all problem-holders have been solved for this problem...
                    if (numHolders === numAnswered) {


                        // coloring the score-dot
                        scoreDisplay.markAnswered();


                        // wiring the button to move to the next problem
                        button.setForNext();
                    } else {

                        // if there are still unanswered .sentakushis-holder's in this problem
                        $(".problem-holder").eq(0).find(".sentakushis-holder").not(".answered-correctly").eq(0).addClass("active");
                    }


                } else {
                    shakeElement($active, {
                        amplitude: 3,
                        duration: 750
                    });
                    soundEffects.play("wrong");
                    score.number_mistakes++;
                }
            }


            function nextProblem() {


                // switching the button mode
                button.setForCheck();


                checkForFinish();


                // fading out the old problem, and fading in the new.  Eye candy!
                $(".problem-holder").eq(0).animate({
                    top: "-5px",
                    opacity: 0
                }, 300, function () {

                    // removing the old problem, after it's been rendered transparent
                    $(".problem-holder").eq(0).remove();

                    // making the new "first" .problem-holder transparent, and then sliding it in
                    $(".problem-holder").eq(0).show().css({
                        top: "5px",
                        opacity: 0
                    }).delay(100).animate({
                        top: "0px",
                        opacity: 1
                    }, 300, function () {
                        $(".sentakushis-holder").eq(0).addClass("active");
                    });

                });
            }


            function checkForFinish() {


                // exiting here if any problems remain
                var numLeft = $(".sentakushis-holder").not(".answered-correctly").length;
                if (numLeft > 0) {
                    return;
                }


                // sending off the results
                var results = {
                    time_taken: score.time_taken,
                    number_problems: myJSON.problem.length,
                    number_mistakes: score.number_mistakes
                };


                tools.send_results(results, backFromSendResults);
                function backFromSendResults() {


                    // adding the 'assignment_results' div after a slight pause
                    setTimeout(function () {


                        // passing in the object to put the assignment_results stuff into, and the data to display
                        tools.showAssignmentResults({
                            container: $("#mainProblemsHolder"),
                            data: {
                                時間: score.time_taken + " 秒",
                                問題数: results.number_problems + " 問",
                                ヒント使用回数: hintHandler.numTimesUsed()
                            }
                        });


                    }, 1000);
                }
            }


            $("html").on("keydown", clickControlButton);
            function clickControlButton(e) {

                if (e.keyCode === 13) {

                    e.preventDefault();

                    // clicking whichever of the buttons is not disabled
                    button.click();
                }
            }

        }
);