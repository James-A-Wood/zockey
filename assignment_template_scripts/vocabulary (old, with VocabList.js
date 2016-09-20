

define(
        [
            "jquery",
            "tools",
            "helpers/vocabList",
            "helpers/AudioLoader",
            "helpers/SoundEffects",
            "helpers/shakeElement",
            "TweenMax",
            "TweenMax_CSSPlugin",
            "TweenMax_EasePack"
        ],
        function ($, tools, myVocabList, audioLoader, SoundEffects, shakeElement, TweenMax) { //, fixedProblemHolder


            // keeping screen at least 320px wide, on mobile
            tools.setMobileScreenWidth(320);


            // various variables
            var mistakenVocabList = {};
            var problemNowActive = false;
            var clock;
            var vocabList = {};
            var myJSON;
            var correctAnswer = "";
            var audio;
            var $choiceMaster = $(".choice-holder.my-template").detach().removeClass("my-template");
            var $dropZone = $("#drop-zone");
            var score = tools.score({
                number_guesses: 0
            });


            function ScoreBar(object) {


                object = object || {};


                var numProblems = 0;
                var numDone = 0;
                var $bar = object.foreground || $("#scorebar-foreground");
                var $scoreBarTextHolder = object.scoreBarTextHolder || $("#scorebar-text-holder");
                var animationDuration = (function () {
                    // automatically converting second to miliseconds, if it's less than 2...
                    var duration = object.animationDuration || 0.2;
                    if (duration > 1) {
                        duration = duration / 1000;
                    }
                    return duration;
                }());


                function setNumberProblems(number) {
                    numProblems = number;
                    setScoreText();
                }


                function increment() {


                    numDone += 1;


                    var percentDone = 100 * (numDone / numProblems) + "%";


                    TweenMax.to($bar, animationDuration, {
                        width: percentDone
                    });


                    setScoreText();
                }


                function setScoreText() {
                    var scoreText = numDone + " of " + numProblems;
                    $scoreBarTextHolder.text(scoreText);
                }


                this.setNumberProblems = setNumberProblems;
                this.increment = increment;
            }


            var scoreBar = new ScoreBar();


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
            tools.getProblemData(prepareProblems);





            /* * * * * * * * * * * * * * * * * * * * * * * */





            function prepareProblems(d) {


                // saving reference to dataReturnedFromServer
                myJSON = d;


                // myJSON.number_sentakushi defaults to 3
                myJSON.number_sentakushi = parseInt(myJSON.number_sentakushi) || 3;


                $("#directions").html("英語を聞いて、正しいものをスライドしてドロプ・ゾーンに落としましょう！");


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
                    words: myJSON.problem,
                    number_problems: myJSON.number_problems,
                    recycleProblems: myJSON.misc.timeTrial ? true : false // optionally recycling words, so they never run outs
                });


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
                $("#start-button").click(function () {


                    var $this = $(this);


                    clock.start();


                    $this.off("click");


                    TweenMax.to($this, 0.75, {
                        left: "110%",
                        onComplete: function () {
                            $this.remove();
                        }
                    });


                    nextProblem();
                });
            }


            // adding the radio buttons & labels
            function nextProblem() {


                // enabling the hintButton
                hintButton.enable();


                // getting the choices, and remembering the right one
                var choices = vocabList.getChoices(myJSON.number_sentakushi);
                var correctChoice = choices[0];
                choices = tools.shuffle(choices);
                correctAnswer = choices.indexOf(correctChoice);


                // creating a .carriage.old to carry out the old choices
                $(".carriage.old").remove();
                var $carriageOld = $("<div class='carriage old'/>").appendTo("#choices-holder");
                $(".choice-holder").removeClass("active-choice").appendTo($carriageOld);


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
                choices.forEach(function (choice, index) {


                    var japaneseWord = vocabList.getJapaneseFor(choice);
                    var englishWord = vocabList.getEnglishFor(japaneseWord);


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
                        height: (90 / choices.length) + "%"
                    }).data({
                        japanese: japaneseWord,
                        english: englishWord,
                        isCorrect: index === correctAnswer
                    });


                    // putting the word in the .text-holder
                    $choiceHolder.find(".text-holder").text(japaneseWord);


                    // appending the choice
                    $carriageNew.append($choiceHolder);


                    // NEW TEST using jQuery animate instead of CSS transitions
                    TweenMax.to($carriageNew, 0.75, {
                        left: "0%"
                    });
                });


                $dropZone.css({height: $(".choice-holder").height()});


                // playing the sound after a slight pause
                setTimeout(function () {
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


                // adding the Engish text to the choice-holder
                var $textHolder = $droppedObject.find(".text-holder");
                $textHolder.text($droppedObject.data("japanese") + " = " + $droppedObject.data("english"));
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


                // marking the problem as not active, so we don't play the wrong
                // sound by mistake
                problemNowActive = false;


                // playing the correctSound
                sounds.play("correct");


                // styling the card
                $droppedObject.addClass("answered-correct");


                // splicing the correctly answered word from the remainWordsArray
                vocabList.removeAnsweredWord();


                // disabling draggability on all choices (temporarily)
                $(".choice-holder").draggable("disable");


                // if all the problems are finished, then ending
                if (vocabList.getRemainingWords().length <= 0) {
                    $("html").off("keydown", vocabularyKeydownHandler);
                    endSequence();
                    return;
                }


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
                var japaneseWord2 = vocabList.getWordFor(vocabList.getTargetEnglish());


                // adding the eng/jap pair that the use clicked
                mistakenVocabList[englishWord1] = japaneseWord1;
                mistakenVocabList[englishWord2] = japaneseWord2;


                // styling the wrong choice
                $droppedObject.addClass("answered-wrong");
            }



            /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */



            function endSequence() {


                // sending off the results
                var results = {
                    time_taken: score.time_taken,
                    number_problems: vocabList.getTotalNumberProblems(),
                    number_mistakes: score.number_mistakes,
                    mistaken_vocab: {
                        words: mistakenVocabList,
                        audio: myJSON.audioFolder
                    }
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


                    // spacebar plays sound, or starts the problem
                    if (e.keyCode === 32) {
                        e.preventDefault();
                        $("#start-button").click();
                        $("#play-button").click();
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


            var hintButton = (function () {


                var $hintButton = $("#hint-button");
                var originalText = $hintButton.text();
                var numTimesUsed = 0;
                var isDisabled = false;


                $hintButton.click(function () {
                    if (problemNowActive && !isDisabled) {
                        numTimesUsed++;
                        showHint();
                    }
                });


                function enable() {
                    $hintButton.text(originalText).removeClass("hint-showing");
                    isDisabled = false;
                }


                function showHint() {
                    $hintButton.text(vocabList.getTargetEnglish()).addClass("hint-showing");
                    isDisabled = true;
                }


                return {
                    enable: enable
                };
            }());


            $("#play-button").click(function () {
                if (problemNowActive) {
                    audio.play();
                }
            });


            // wiring up the dropZone to trigger play button click
            $dropZone.click(function () {
                $("#play-button").click();
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
        });