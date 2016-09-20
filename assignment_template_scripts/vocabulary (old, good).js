

define(
        [
            "jquery",
            "tools",
            "helpers/vocabList",
            "helpers/AudioLoader",
//            "helpers/fixedProblemHolder",
            "helpers/SoundEffects"
        ],
        function ($, tools, myVocabList, audioLoader, SoundEffects) { //, fixedProblemHolder


            // keeping screen at least 320px wide, on mobile
            tools.setMobileScreenWidth(320);


            var mistakenVocabList = {};


            // various variables
            var score = tools.score();
            score.number_guesses = 0;
            var clock;
            var vocabList = {};
            var choices = [];
            var firstTimeThrough = true;
            var myJSON;
            var correctAnswer = "";
            var $playButton = $("#playButton");
            var $choicesHolder = $("#choicesHolder");
            var minHeight;
            var audio;
            var choicesAreClickable = false;
            var scoreBar;
            var firstProblemHasPlayed = false;


            var scoreBarFactory = function (options) {


                options = options || {};


                var $innerBar = options.innerBar || $("#scorebar-inner");


                function extend(done, total) {
                    var percentage = (done / total) * 100;
                    $innerBar.width(percentage + "%");
                }


                return {
                    extend: extend
                };
            };


            var scoreBar = scoreBarFactory();


            scoreBar.extend(8, 10);


//            var scoreDotsFactory = function (object) {
//
//
//                // checking the arguments
//                if (!object || typeof object !== "object" || !object.holder || object.holder.length < 1) {
//                    console.log("scoreDotsFactory got some messed up parameters!");
//                    return false;
//                }
//
//
//                // setting the defaults
//                var $holder = object.holder;
//                var scoreDotClass = object.scoreDotClass || "score-dot";
//                var scoreDotDoneClass = object.scoreDotDoneClass || "done";
//
//
//                var $scoreDot = $("<span />").addClass(scoreDotClass);
//
//
//                function addScoreDots(number) {
//                    for (var i = 0; i < number; i++) {
//                        $holder.append($scoreDot.clone());
//                    }
//                }
//
//
//                function increment() {
//                    $holder.find("." + scoreDotClass).not("." + scoreDotDoneClass).eq(0).addClass(scoreDotDoneClass);
//                }
//
//
//                return {
//                    addScoreDots: addScoreDots,
//                    increment: increment
//                };
//            };


//            var scoreDots = scoreDotsFactory({
//                holder: $("#score-dots-holder")
//            });


            var hintButton = (function () {


                var defaultText = $("#hint-button").text();
                var nowClickable = true;
                var numTimesUsed = 0;


                $("#hint-button").click(function () {
                    if (nowClickable) {
                        showHint();
                    }
                });


                function restore() {
                    var textToShow = defaultText;
                    if (numTimesUsed > 0) {
                        textToShow += " (" + numTimesUsed + ")";
                    }
                    $("#hint-button").text(textToShow).removeClass("now-showing-hint");
                    nowClickable = true;
                }


                function setEnableTo(value) {
                    nowClickable = value;
                }


                function showHint() {
                    if (nowClickable) {
                        numTimesUsed++;
                        var english = vocabList.getTargetEnglish();
                        $("#hint-button").text(english).addClass("now-showing-hint");
                        nowClickable = false;
                    }
                }


                return {
                    restore: restore,
                    showHint: showHint,
                    enable: function () {
                        setEnableTo(true);
                    },
                    disable: function () {
                        setEnableTo(false);
                    }
                };
            }());


            var wrongSound = new Howl({
                urls: ["/sounds/vocabulary/wrongSound.mp3"]
            });


            var sounds = new SoundEffects({
                container: $("#sound-controls-holder"),
                sounds: {
                    correct: "/sounds/vocabulary/correctSound.mp3"
                },
                playThisOnCheckboxCheck: "correct"
            });




            // retrieving and parsing the JSON object
            tools.getProblemData(prepareProblems);





            /* * * * * * * * * * * * * * * * * * * * * * * */





            function prepareProblems(d) {


                // wiring up the mouse, keyboard, or touch events to check whether the user is interacting with the program
//                userInputChecker = tools.beCheckingForUserInteraction({
//                    interval: 15,
//                    callback: function () {
//                        console.log("No user interactivity!");
//                    }
//                });


//                console.log(userInputChecker);


                // saving reference to dataReturnedFromServer
                myJSON = d;


                // myJSON.number_sentakushi defaults to 3
                myJSON.number_sentakushi = parseInt(myJSON.number_sentakushi) || 3;


                if (myJSON.misc.timeTrial) {
                    $("#directions").text("時間と勝負！ " + myJSON.misc.timeTrial + "秒以内に、何個解けるかな？");
                }


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


                scoreBar = (function () {


                    // score starts at 0
                    var score = 0;


                    // slightly different display, depending on whether we're doing a timeTrial or not
                    if (myJSON.misc.timeTrial) {
                        $("#score-holder").text("0");
                    } else {

                        var numProblems = vocabList.getTotalNumberProblems();
                        $("#score-holder").text("0 / " + numProblems);


                        // adding score-dots
//                        scoreDots.addScoreDots(numProblems);
                    }


                    function increment() {

                        score++;

                        if (myJSON.misc.timeTrial) {
                            $("#score-holder").text(score);
                        } else {
                            $("#score-holder").text(score + " / " + myJSON.problem.length);
                        }
                    }

                    return {
                        increment: increment,
                        getScore: function () {
                            return score;
                        }
                    };
                }());


                // creating an audio loader and player
                audio = audioLoader({
                    audioFiles: myJSON.audioFiles,
                    wordsList: vocabList.getRemainingWords(), // REQUIRED,
                    getWordToPlay: function () { // (optional) function to retrieve which word to play next, so we don't have to spoon-feed the word in
                        return vocabList.getTargetEnglish();
                    },
                    onPlay: function () {
                        choicesAreClickable = true; // makes the choices CLICKABLE once the sound has finished playing
                    },
                    onAllLoaded: function () {
                        $("body").addClass("all-audio-loaded"); // shows the #myForm element 
                    },
                    onEnded: function () {
                        //
                    },
                    playButton: "playIcon" // passing in the button on which to show "play" and "pause" symbols
                });


                // displaying the choices
                buildChoices(myJSON.number_sentakushi);


                // NEW TEST!
                fixedProblemHolder({
                    onSlideUp: function() {
                        $("#directions").hide();
                    },
                    onSlideDown: function() {
                        $("#directions").show();
                    }
                });


                // setting the choices and audio here, not in nextProblem
                setChoices();


                // placing the choices in the labels
                placeWords();


                // fading in the #mainProblemsHolder
                $("#mainProblemsHolder").fadeTo(200, 1);


                // starting off by clicking the playButton (which says 'Start' at this point)
                $playButton.on("click", function () {


                    firstProblemHasPlayed = true;


                    // playing the sound immediately
                    audio.play();


                    // disabling the 'kickOff' behavior
                    $playButton.removeClass("btn-danger")
                            .addClass("btn-primary")
                            .empty()
                            .append("<span id='playIcon' class='glyphicon glyphicon-pause'></span>")
                            .off("click")
                            .on("click", function () {
                                audio.play();
                            });


                    // adding the clock
                    clock.start();


                    // showing the problems and kicking off everything
                    $(".startHidden").fadeTo("fast", 1); // showing the problems...


                    nextProblem();
                });

            }




            /* * * * * * * * * * * * * * * * * * * * * * * */





            function nextProblem() {


                hintButton.restore();


                $choicesHolder.removeClass("answered");


                // exiting here if it's the first time through
                if (firstTimeThrough) {
                    firstTimeThrough = false;
                    return;
                }


                setChoices();


                // playing the sound after a slight pause
                setTimeout(function () {
                    audio.play();
                }, 250);


                choicesAreClickable = true;


                // momentarily hiding the whole choices things
                $("#fadeThing").css({opacity: 0});


                // showing the choices
                buildChoices(myJSON.number_sentakushi);


                // placing the choices in the labels
                placeWords();


                // fading in the choices
                $("#fadeThing").fadeTo("slow", 1, function () {
                    if (!minHeight) {
                        minHeight = $("#fadeThing").height();
                        $("#fadeThing").height(minHeight);
                    }
                });
            }


            function placeWords() {


                choices.forEach(function (word, index) {


                    // adding a problem number, if we're not on mobile
                    var problemNumber = index + 1 + ". ";
                    var $problemNumberHolder = $("<span class='problem-number-holder hidden-xs'/>").text(problemNumber);


                    $(".myRadioLabel").eq(index)
                            .append($problemNumberHolder, vocabList.getWordFor(word))
                            .data({
                                englishWord: word,
                                japaneseWord: vocabList.getWordFor(word)
                            });


                    if (index === correctAnswer) {
                        $(".myRadioLabel").eq(index).closest(".choice-holder").data({isCorrect: true});
                    }
                });
            }






            /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */



            function checkAnswer() {


                hintButton.disable();


                $choicesHolder.addClass("answered");


                // turning off clickability on the check-buttons
                choicesAreClickable = false;


                // keeping score
                score.number_guesses++;


                var $selected = $(".selected").eq(0);


                // if the student's answer was right...
                if ($selected.data("isCorrect")) {


                    // playing the correctSound
                    sounds.play("correct");


                    // coloring a score-dot
//                    scoreDots.increment();


                    // incrementing the scoreBar
                    scoreBar.increment();


                    // marking that we're between problems
                    audio.isNowBetweenProblems(true);


                    // adding the word to the box
                    $selected.addClass("answeredRight");


                    var $thisRadioLabel = $selected.find(".myRadioLabel");


                    $thisRadioLabel.append("<span class='word-holder'>" + $thisRadioLabel.data("englishWord") + "</span>");
//                    shrinkTextToFit();



                    // splicing the correctly answered word from the remainWordsArray
                    vocabList.removeAnsweredWord();


                    // if all the problems are finished, then ending
                    if (vocabList.getRemainingWords().length <= 0) {
                        endSequence();
                    }


                    choicesAreClickable = true;


                    // and if the answer is wrong...
                } else {


                    // playing the wrong sound, and incrementing score.number_mistakes
                    wrongSound.play();


                    // adding the MISTAKEN pair
                    var englishWord1 = $selected.find(".myRadioLabel").data("englishWord");
                    var japaneseWord1 = vocabList.getWordFor(englishWord1);
                    var englishWord2 = vocabList.getTargetEnglish();
                    var japaneseWord2 = vocabList.getWordFor(vocabList.getTargetEnglish())


                    // adding the eng/jap pair that the use clicked
                    mistakenVocabList[englishWord1] = japaneseWord1;
                    mistakenVocabList[englishWord2] = japaneseWord2;


                    // scoring
                    score.number_mistakes += 1;


                    // hiding the check-button
                    $(".check-button").hide();


                    // coloring the wrong answer red
                    $selected.addClass("answeredWrong");


                    // adding the word to the clicked div
                    var engWord = $selected.find(".myRadioLabel").data("englishWord");
                    $selected.find(".myRadioLabel").append("<span class='word-holder'>" + engWord + "</span>");
//                    shrinkTextToFit();



                    // showing the CORRECT answer, after a moment's pause
                    setTimeout(function () {


                        // highligting the correct choice, and appending the correct text
                        var $wordHolderSpan = $("<span/>").addClass("word-holder").text(vocabList.getTargetEnglish());
//                        shrinkTextToFit();


                        // slightly fading all choices (unfading the correct one below
                        $(".choice-holder").addClass("faded");


                        // formatting the CORRECT choice-holder (which wasn't selected...)
                        $(".choice-holder").filter(function () {
                            return $(this).data("isCorrect");
                        }).addClass("answeredRight").removeClass("faded").find(".myRadioLabel").append($wordHolderSpan);


                        // switching the check-button to the correct answer
                        $(".selected").removeClass("selected");
                        $(".answeredRight").addClass("selected");
                        $(".check-button").show();


                        // moving on to the next problem
                        choicesAreClickable = true;

                    }, tools.isMobile() ? 1500 : 1000);
                }
            }



            /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */



            function endSequence() {


                // turing off some listeners
                $("html").off("keydown", vocabularyKeydownHandler);


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
                            data["クリアした問題"] = "<span style='color: red; font-weight: bold;'>" + scoreBar.getScore() + " 問</span>";
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
            $("html").keydown(vocabularyKeydownHandler);
            function vocabularyKeydownHandler(e) {

                // exiting if student is typing in the studentMessageInput
                if ($("#studentMessageInput").is(":focus")) {
                    return;
                }

                // spacebar plays sound
                if (e.keyCode === 32) {
                    $playButton.click();
                    e.preventDefault();
                    return false;
                }

                // number keys 1 ~ *8* -> choice1 ~ choice8! (Probably overkill...)
                if (e.keyCode >= 49 && e.keyCode <= 56) {
                    var keycode = e.keyCode - 48;
                    $("#choice" + keycode).click();
                }

                // right arrow -> 'next'
                if (e.keyCode === 39 || e.keyCode === 13) {
                    e.preventDefault();
                    $(".selected").find(".check-button").click();
                }
            }


            // adding the radio buttons & labels
            function buildChoices(numberOfChoices) {


                // deleting all the previous radio buttons & labels, and building new ones from scratch
                $("#fadeThing").empty();


                // appending the rows & cells for the table
                for (var i = 1; i <= numberOfChoices; i++) {


                    // building the holder for the radio button and the label
                    var $choiceHolder = $("<div/>").addClass("choice-holder").attr({id: "choice" + i});


                    // building the label, which hodls the word itself
                    var $text = $("<span/>").addClass("myRadioLabel");


                    // the circle inside the choice to indicate "selected" state
//                    var $circle = $("<div/>").addClass("selected-circle");


                    // creating the inline-checkButton
                    var $checkButton = $("<div/>").addClass("check-button").append("<span>決定</span>");


                    // wiring up the clickButton
                    $checkButton.click(function () {


                        // returning if the checkButton isn't clickable
                        if (!choicesAreClickable) {
                            return;
                        }


                        // doing nothing if the corresponding problem 
                        if (($(this).closest(".choice-holder").hasClass("selected"))) {

                            if ($choicesHolder.hasClass("answered")) {


                                audio.isNowBetweenProblems(false);
                                nextProblem();
                            } else {


                                checkAnswer();


                                // appending the two little right-pointing arrows to the check-button
                                $(".check-button").find("span").empty().append("<span class='glyphicon glyphicon-forward'></span>");
                            }
                        }
                    });


                    // finally, adding the choice to the #fadeThing, with a float-clearing break
                    $("#fadeThing").append($choiceHolder);


                    // adding the radio input and the label to the holder
                    $choiceHolder.append($text, $checkButton); //$circle, 


                    // wiring up the choice-holder
                    $choiceHolder.click(function () {


                        if (!choicesAreClickable) {
                            return;
                        }


                        if (!$choicesHolder.hasClass("answered")) {
                            $(".choice-holder").removeClass("selected");
                            $(this).addClass("selected");
                        }
                    });

                }
            }


//            function shrinkTextToFit() {
//
//
//                // calculating the SMALLEST height 
//                var minHeight = $(".myRadioLabel").outerHeight(true); // getting the height of the first one, to start with
//                $(".myRadioLabel").each(function () {
//                    minHeight = Math.min(minHeight, $(this).outerHeight(true));
//                });
//
//
//                // calculating the maxWidth
//                var maxWidth = parseInt($("#choicesHolderBorder").outerWidth(true)) * 0.7; // was 0.8
//
//
//                // shrinking the text
//                $(".myRadioLabel").each(function () {
//
//
//                    var safetyCounter = 0;
//
//
//                    while ((parseInt($(this).outerHeight(true)) > minHeight || parseInt($(this).outerWidth(true)) > maxWidth) && safetyCounter < 20) {
//
//
//                        safetyCounter++;
//
//
//                        // calculating a slightly-smaller font size
//                        var currentFontSize = parseInt($(this).css("font-size"));
//                        var newFontSize = currentFontSize - 2;
//
//
//                        // applying the new font size
//                        $(this).css({fontSize: newFontSize});
//                    }
//                });
//            }


            function setChoices() {


                // getting the choices, and remembering the right one
                choices = vocabList.getChoices(myJSON.number_sentakushi);
                var correctChoice = choices[0];
                choices = tools.shuffle(choices);
                correctAnswer = choices.indexOf(correctChoice);

                audio.isNowBetweenProblems(false);
            }


            $("#choicesHolderBorder").click(function () {
                if (!firstProblemHasPlayed) {
                    firstProblemHasPlayed = true;
                    $("#playButton").click();
                }
            });


//            function checkForInteractivity(callback, interval) {
//
//
//                interval = interval || 2;
//
//
//                callback = callback || function () {
//                    $("body").append("<span style='position: fixed; top: 0; left: 0; background: black; color: white;'>Triggered!</span>");
//                };
//
//
//                var checkInterval;
//
//
//                restartInterval();
//                function restartInterval() {
//                    clearTimeout(checkInterval);
//                    checkInterval = setTimeout(callback, interval * 1000);
//                }
//
//
//                $("html").mousemove(restartInterval);
//                $("body").on("touchstart touchmove touchend", restartInterval);
//                $(window).scroll(restartInterval);
//                $("html").keydown(restartInterval);
//            }

        });