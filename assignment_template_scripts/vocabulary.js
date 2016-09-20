

define(
        [
            "jquery",
            "tools",
            "helpers/problemsAndChoicesList",
            "helpers/AudioLoader",
            "helpers/SoundEffects",
            "helpers/shakeElement",
            "TweenMax",
            "TweenMax_CSSPlugin",
            "TweenMax_EasePack"
        ],
        function ($, tools, myVocabList, audioLoader, SoundEffects, shakeElement, TweenMax) {


            // keeping screen at least 320px wide, on mobile
            tools.setMobileScreenWidth(320);


            // various variables
            var mistakenVocabList = {};
            var problemNowActive = false;
            var clock;
            var vocabList = {};
            var myJSON;
            var audio;
            var $choiceMaster = $(".choice-holder.my-template").detach().removeClass("my-template");
            var $dropZone = $("#drop-zone");
            var $startButton = $("#start-button");
            var score = tools.score({
                number_guesses: 0
            });
            var scoreBar = tools.scoreBar();


            // other options - differentiating "vocabulary" from "sentences"
            var sentencesMode = false;
            var autoShowHint = false;
            var autoAdvance = false;


            var dropZone = (function () {


                var $textHolder = $("#drop-here-message");
                var textHolderFontSize = $textHolder.css("fontSize");
                var originalText = $textHolder.text();
                var nextButtonActive = false;


                // wiring up the dropZone to trigger play button click
                $dropZone.click(function () {
                    $("#play-button").click();
                });


                function showHint() {
                    var hintText = vocabList.getTargetEnglish();
                    $textHolder.text(hintText).addClass("hint-showing");
                    tools.shrinkToFit($textHolder, $dropZone);
                }


                function restore() {
                    nextButtonActive = false;
                    $dropZone.removeClass("next-button-mode");
                    $dropZone.off("click").on("click", function () {
                        $("#play-button").click();
                    });
                    $textHolder.text(originalText).removeClass("hint-showing");
                    $textHolder.css({
                        fontSize: textHolderFontSize
                    });
                }


                function nextButtonMode(d) {
                    nextButtonActive = true;
                    d = d || {};
                    setTimeout(function () {
                        $dropZone.addClass("next-button-mode");
                        $dropZone.off("click").on("click", function () {
                            nextProblem();
                        });
                    }, d.delay);
                }


                function isNextButtonMode() {
                    return nextButtonActive;
                }


                return {
                    showHint: showHint,
                    restore: restore,
                    nextButtonMode: nextButtonMode,
                    isNextButtonMode: isNextButtonMode
                };
            }());


            var sounds = new SoundEffects({
                container: $("#sounds-stuff"),
                checkBoxTextAlign: "left",
                sounds: {
                    correct: "/sounds/vocabulary/tick.mp3",
                    wrong: "/sounds/vocabulary/wrongSound.mp3",
                    tick: "/sounds/vocabulary/tick.mp3"
                },
                playThisOnCheckboxCheck: "tick"
            });


            // retrieving and parsing the JSON object
            tools.getProblemData(function (d) {


                // saving reference to dataReturnedFromServer
                myJSON = d;


                // myJSON.number_sentakushi defaults to 3
                myJSON.number_sentakushi = myJSON.number_sentakushi || 3;


                // setting the directions here
                $("#directions").html("英語を聞いて、正しいものをスライドしてドロプ・ゾーンに落としましょう！");


                // different directions if we're doing a time-trial
                if (myJSON.misc.timeTrial) {
                    $("#directions").text("時間と勝負！ " + myJSON.misc.timeTrial + "秒以内に、何個解けるかな？");
                }


                // setting the number of scoreBar
                var numProblems = (function () {
                    if (!myJSON.number_problems) {
                        return myJSON.problem.length;
                    }
                    return Math.min(myJSON.number_problems, myJSON.problem.length);
                }());
                scoreBar.setNumberProblems(numProblems);


                // instantiating the clock
                clock = tools.clock({
                    container: $("#clock-holder"),
                    pauseStart: true,
                    countdownFrom: myJSON.misc.timeTrial ? myJSON.misc.timeTrial : null,
                    onFinish: endSequence
                });


                // putting the words list in the vocabList variable
                vocabList = myVocabList({
                    problems: myJSON.problem,
                    number_problems: myJSON.number_problems,
                    numberSentakushi: myJSON.number_sentakushi || 3,
                    recycleProblems: myJSON.misc.timeTrial ? true : false // optionally recycling words, so they never run outs
                });


                // setting whether we're doing "sentencesMode" or not
                if (myJSON.misc.hasOwnProperty("sentencesMode")) {
                    sentencesMode = myJSON.misc.sentencesMode;
                } else {
                    sentencesMode = vocabList.isSentences;
                }


                // setting autoAdvance to "true" for vocabulary and "false" for sentencesMode,
                // or whatever is in myJSON.misc.autoAdvance
                if (myJSON.misc.hasOwnProperty("autoAdvance")) {
                    autoAdvance = myJSON.misc.autoAdvance;
                } else {
                    autoAdvance = sentencesMode ? false : true;
                }


                // setting autoAdvance to "true" for vocabulary and "false" for sentencesMode,
                // or whatever is in myJSON.misc.autoAdvance
                if (myJSON.misc.autoShowHint) {
                    autoShowHint = myJSON.misc.autoShowHint;
                }


                // creating an audio loader and player
                audio = audioLoader({
                    audioFiles: myJSON.audioFiles,
                    wordsList: vocabList.getRemainingWords(), // REQUIRED,
                    getWordToPlay: function () { // (optional) function to retrieve which word to play next, so we don't have to spoon-feed the word in
                        return vocabList.getTargetEnglish();
                    },
                    onPlay: function () {
                        $(".play-button-icon").addClass("now-playing");
                        problemNowActive = true;
                    },
                    onAllLoaded: function () {
                        $("body").addClass("all-audio-loaded"); // shows the #my-form element 
                    },
                    onEnded: function () {
                        $(".play-button-icon").removeClass("now-playing");
                    },
                    playButton: "playIcon" // passing in the button on which to show "play" and "pause" symbols
                });


                // applying fixedProblemHolder, for mobile
                tools.fixedProblemHolder({
                    onSlideUp: function () {
                        $("#directions").hide();
                    },
                    onSlideDown: function () {
                        $("#directions").show();
                    }
                });


                // wiring up the start-button
                $startButton.click("startButtonClickHandler");
            });


            var hintButton = (function () {


                var $hintButton = $("#hint-button");
                var originalText = $hintButton.text();
                var numTimesUsed = 0;
                var isDisabled = false;


                if (autoShowHint) {
                    $hintButton.remove();
                }


                $hintButton.click(function () {
                    if (problemNowActive && !isDisabled) {
                        numTimesUsed++;
                        dropZone.showHint();
                        $hintButton.addClass("hint-showing");
                    }
                });


                function enable() {

                    if (autoShowHint) {
                        return null;
                    }

                    $hintButton.text(originalText).removeClass("hint-showing");
                    dropZone.restore();
                    isDisabled = false;
                }


                return {
                    enable: enable
                };
            }());


            // adding the radio buttons & labels
            function nextProblem() {


                // creating a .carriage.old to carry out the old choices
                $(".carriage.old").remove();
                var $carriageOld = $("<div class='carriage old'/>").appendTo("#choices-holder");
                $(".choice-holder").removeClass("active-choice").appendTo($carriageOld);
                var problem = vocabList.pickRandomProblem();


                // enabling the hintButton
                hintButton.enable();


                TweenMax.to($carriageOld, 0.75, {
                    left: "110%",
                    onComplete: function () {
                        $carriageOld.remove();
                    }
                });


                // creating and adding a new carriage
                $(".carriage.new").remove();
                var $carriageNew = $("<div class='carriage new'/>").appendTo("#choices-holder");


                // appending the rows & cells for the table
                problem.choices.forEach(function (choice, index) {


                    var japaneseWord = choice;
                    var englishWord = vocabList.getEnglishFor(choice);


                    var $choiceHolder = $choiceMaster.clone().draggable({
                        revert: true,
                        revertDuration: 100,
                        stack: ".choice-holder",
                        axis: "y",
                        containment: "#choices-bounds",
                        start: function () {
                            $(this).addClass("now-dragging mousedown");
                        },
                        stop: function () {
                            $(this).removeClass("now-dragging mousedown");
                        }
                    }).css({
                        height: (90 / problem.choices.length) + "%"
                    }).data({
                        japanese: japaneseWord,
                        english: englishWord,
                        isCorrect: !!(index === problem.indexOfCorrectAnswer)
                    });


                    // NEW TEST text-align left for sentences
                    if (sentencesMode) {
                        $choiceHolder.addClass("align-left");
                    }


                    // putting the word in the .text-holder
                    $choiceHolder.find(".text-holder").text(japaneseWord);


                    // appending the choice
                    $carriageNew.append($choiceHolder);


                    // NEW TEST using jQuery animate instead of CSS transitions
                    TweenMax.to($carriageNew, 0.75, {
                        left: "0%"
                    });
                });


                // adjusting the drop-zone height
                dropZone.restore();
                $dropZone.css({height: $(".choice-holder").height()});


                // showing the hint automatically, if set
                if (autoShowHint) {
                    dropZone.showHint();
                }


                // playing the sound after a slight pause
                setTimeout(function () {
                    problemNowActive = true;
                    audio.play();
                }, 500);
            }


            function checkAnswer($droppedObject) {


                // returning here if we're between problems
                if (!problemNowActive) {
                    return false;
                }


                // keeping track of the number of guesses, both right and wrong
                score.number_guesses++;


                // adding a divider - an equals sign for vocabulary, or a line break for sentences
                var divider = sentencesMode ? "<br>" : " = ";


                // adding the Engish text to the choice-holder
                var $textHolder = $droppedObject.find(".text-holder");
                $textHolder.html($droppedObject.data("japanese") + divider + $droppedObject.data("english"));
                tools.shrinkToFit($textHolder, $droppedObject);


                // handling correct and incorrect answers
                if ($droppedObject.data("isCorrect")) {
                    rightAnswerHandler($droppedObject);
                } else {
                    wrongAnswerHandler($droppedObject);
                }
            }


            function rightAnswerHandler($droppedObject) {


                // adding a score-dot
                scoreBar.increment();


                // stopping any audio playing
                audio.stopAll();


                // marking the problem as not active, so we don't play the wrong
                // sound by mistake
                problemNowActive = false;


                // playing the correctSound
                sounds.play("correct");


                // styling the card
                $droppedObject.addClass("answered-correct");


                // splicing the correctly answered word from the remainWordsArray
                vocabList.removeCurrentProblem();


                // disabling draggability on all choices (temporarily)
                $(".choice-holder").draggable("disable");


                // if all the problems are finished, then ending
                if (vocabList.getNumberRemaining() <= 0) {
                    $("html").off("keydown", vocabularyKeydownHandler);
                    endSequence();
                    return;
                }


                // advancing automatically if autoAdvance; otherwise, using the next button
                if (!autoAdvance) {
                    dropZone.nextButtonMode({delay: 0});
                } else {
                    setTimeout(function () {


                        // marking choices as inactive
                        $(".active-choice").each(function () {
                            var $thisChoice = $(this);
                            $thisChoice.removeClass("active-choice");
                        });


                        // moving on to the next problem
                        nextProblem();
                    }, 500);
                }
            }


            function wrongAnswerHandler($droppedObject) {


                // playing the wrong sound, and incrementing score.number_mistakes
                sounds.play("wrong");


                // shaking the thing
                shakeElement($("#choices-bounds"));


                // scoring
                score.number_mistakes += 1;


                // adding the MISTAKEN pair
                var englishWord1 = $droppedObject.data("english");
                var japaneseWord1 = $droppedObject.data("japanese");
                var englishWord2 = vocabList.getTargetEnglish();
                var japaneseWord2 = vocabList.getJapaneseFor(englishWord2);


                // adding the eng/jap pair that the use clicked
                mistakenVocabList[englishWord1] = japaneseWord1;
                mistakenVocabList[englishWord2] = japaneseWord2;


                // styling the wrong choice
                $droppedObject.addClass("answered-wrong");
            }



            /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */



            function endSequence() {


                // sending mistaken vocab words if we're NOT in sentences mode
                var myMistakenVocab = sentencesMode ? null : {
                    words: mistakenVocabList,
                    audio: myJSON.audioFolder
                };


                // sending off the results
                var results = {
                    time_taken: score.time_taken,
                    number_problems: vocabList.numberOfProblems,
                    number_mistakes: score.number_mistakes,
                    mistaken_vocab: myMistakenVocab
                };


                // adding the 'endScreenHolder' div after a momentary pause
                // sending the results object, and a callback
                tools.send_results(results, backFromSendResults);
                function backFromSendResults(d) {


                    // adding the "assignment_results div after a slight pause
                    setTimeout(function () {


                        // passing in the object to put the assignment_results stuff into, and the data to display
                        var data = {
                            時間: score.time_taken + " 秒",
                            間違い: score.number_mistakes + " 問"
                        };


                        // different data depending on whether it's a time-trial type or not
                        if (myJSON.misc.timeTrial) {
//                            data["クリアした問題"] = "<span style='color: red; font-weight: bold;'>" + scoreBar.getScore() + " 問</span>";
                        } else {
                            data["問題数"] = results.number_problems + " 問";
                        }


                        var wordsToReview = tools.showMistakenVocab(results.mistaken_vocab.words);
                        if (wordsToReview) {
                            data["復習しよう！"] = wordsToReview;
                        }


                        tools.showAssignmentResults({
                            container: $("#mainProblemsHolder"),
                            data: data
                        });


                        // calculating the percent correct
                        var percentCorrect = results.number_problems / score.number_guesses;


                        // keeping it between 0 and 1
                        percentCorrect = Math.min(percentCorrect, 1);
                        percentCorrect = Math.max(percentCorrect, 0);

                    }, 1000);
                }


                return true;
            }



            // key-down handlers - space bar & right arrow
            var vocabularyKeydownHandler = (function () {


                // using this to keep track of the time, so the key can only be pressed once a second
                var lastTimePressed = (new Date()).getTime();
                var minTimeBetweenKeyPresses = 500;


                return function (e) {


                    if (e.keyCode === 13) {
                        if (dropZone.isNextButtonMode()) {
                            $("#next-button").click();
                            return;
                        }
                    }


                    // spacebar plays sound, or starts the problem
                    if (e.keyCode === 32) {
                        e.preventDefault();
                        $startButton.click();
                        $("#play-button").click();
                        $("#drop-zone").click();
                        return;
                    }


                    // keys 1 ~ 6 trigger "checkAnswer" on the appropriate .choice-holder
                    if (e.keyCode >= 49 && e.keyCode <= 54) {


                        // getting the choice
                        var $choice = $(".active-choice").eq(e.keyCode - 49);


                        // exiting here if there is no such .choice-holder
                        if ($choice.length < 1) {
                            return;
                        }


                        // calculating whether enough time has passed since the last key press
                        var currentTime = (new Date()).getTime();
                        var milisecondsPassed = currentTime - lastTimePressed;
                        var enoughTimeHasPassed = !!(milisecondsPassed > minTimeBetweenKeyPresses);

                        if (enoughTimeHasPassed) {
                            lastTimePressed = currentTime;
                            checkAnswer($choice);
                        }
                    }


                    // "H" triggers hint button click
                    if (e.keyCode === 72) {
                        $("#hint-button").click();
                    }
                };
            }());
            $("html").keydown(vocabularyKeydownHandler);


            $("#play-button").click(function () {
                if (problemNowActive) {
                    audio.play();
                }
            });


            // wiring up the frame so clicking it triggers #start-button click
            $("#frame").on("click", function () {
                if ($startButton.length) {
                    $("#frame").off("click");
                    startButtonClickHandler($startButton);
                }
            });


            // wiring up the drop zone
            $dropZone.droppable({
                accept: ".active-choice",
                drop: function (event, ui) {
                    var $droppedObject = $(ui.draggable);
                    checkAnswer($droppedObject);
                }
            });


            // setting drop-zone default height to be 1/4 the height of the $choice-bounds
            var height = parseInt($("#choices-bounds").height() / 4);
            $dropZone.css({height: height * 0.9});


            function startButtonClickHandler($button) {
                var $this = $button || $(this);
                $this.off("click");
                clock.start();
                TweenMax.to($this, 0.75, {
                    left: "110%",
                    onComplete: function () {
                        $this.remove();
                    }
                });
                nextProblem();
            }
        });