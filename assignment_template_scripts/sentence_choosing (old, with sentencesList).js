

/*
 * 
 * 
 * 
 *      True-False is automatically detected based on the choices; or, add JSON {"trueFalse": true} to the "misc" thing
 *      
 *      Optionally specify {"terms": [trueTerm, falseTerm]} in the JSON (they default to 正しい and 正しくない)
 *      
 *      To mix choices from all problems, not just the current problem, either make sure there's only one choice for each problem, 
 *      or specify {"globalSentakushi":true} in the JSON
 *      
 * 
 * 
 * 
 */


define(
        [
            "jquery",
            "tools",
            "helpers/sentencesList",
            "helpers/AudioLoader",
            "howler"
        ],
        function ($, tools, sentencesList, audioLoader) { //, fixedProblemHolder


            // keeping screen at least 320px wide, for mobile - and disabling scaling!  Cool!
            tools.setMobileScreenWidth(320);


            // various variables
            var currentProblem = "",
                    audio,
                    problemHasBeenAnswered = false,
                    problems = {},
                    serverData,
                    $nextButton = $("#nextButton"),
                    $playButton = $("#playButton"),
                    score = tools.score();


            // adding the "hintButtonUsed" property to "score"
            score.hintButtonUsed = 0;


            // retrieving and parsing the JSON object
            tools.getProblemData(function (d) {


                // saving reference to dataBack
                serverData = d;


                // loading the audio files
                audio = audioLoader({
                    audioFiles: serverData.audioFiles, // required
                    wordsList: (function () { // required
                        // building an array of all the ENGLISH words/sentences
                        var array = [];
                        serverData.problem.forEach(function (thisProblem) {
                            var englishSentence = thisProblem[0];
                            array.push(englishSentence);
                        });
                        return array;
                    }()),
                    playButton: "playIcon",
                    onAllLoaded: prepareProblems,
                    onLoadError: function () {
                        //
                    }
                });
            });


            function prepareProblems() {


                // putting the words list in the problems variable
                // NEW TEST add object {recycleProblems: true} as second parameter to recycle problems, timeTrial-style!
                problems = sentencesList(serverData, {
                    recycleProblems: serverData.misc.timeTrial ? true : false
                });


                // for trueFalse, hardcoding the directions!  Change this later...
                if (problems.isTrueFalse()) {
                    setTimeout(function () {
                        $("#directions").text("教科書の内容についての英語を聞いて、「正しい」か「正しくない」を選びましょう。");
                    }, 0);
                }


                // setting the choices and audio here, not in nextProblem
                currentProblem = problems.pickRandomProblem();


                // displaying the choices
                displayChoices();


                // adding fixed-problem holder functionality for mobile
                tools.fixedProblemHolder({
                    onSlideUp: function () {
                        $("#directions").hide();
                    },
                    onSlideDown: function () {
                        $("#directions").show();
                    }
                });


                // FINALLY fading in the #mainProblemsHolder
                $("#mainProblemsHolder").fadeTo(200, 1);


                // starting off by clicking the playButton (which says "Start" at this point)
                $playButton.on("click", kickOff);
                function kickOff() {


                    // playing the sound, after a slight pause
                    setTimeout(function () {
                        audio.play(currentProblem.question);
                    }, 500);


                    // reformatting the button from "start" to "play"
                    $playButton.off("click", kickOff)
                            .removeClass("btn-danger")
                            .addClass("btn-primary")
                            .empty()
                            .append("<span id='playIcon' class='glyphicon glyphicon-play'></span><img id='soundLoading' src='/images/loading_small.gif'>")
                            .on("click", function () {


                                // simulating the nextButton click if the problem has been answered...
                                if (problemHasBeenAnswered) {
                                    $nextButton.click();
                                } else {


                                    // ... or playing the sound, if it hasn't been answered
                                    audio.play(currentProblem.question);
                                }
                            });


                    // adding the clock
                    tools.clock({
                        container: $("#clock")
                    });


                    // showing the problems and kicking off everything
                    $(".startHidden").fadeTo("fast", 1); // showing the problems...


                    nextProblem();
                }
            }


            var nextProblem = (function () {


                // local variable
                var firstTimeThrough = true;


                return function () {


                    // marking that the current problem has NOT been answered
                    problemHasBeenAnswered = false;


                    // activating the hint button
                    hint.activate();


                    // NEW TEST moved this here
                    setTimeout(function () {
                        audio.play(currentProblem.question);
                    }, 500);


                    // unchecking all radios
                    $("#myForm input[type='radio']:checked").prop("checked", false); // was ".attr"


                    // wiring up the nextButton
                    $nextButton.off("click", checkAnswer).on("click", checkAnswer);


                    // updating the score
                    updateScoreboard();


                    // because, the first time through only, the problems are already set...
                    if (firstTimeThrough) {
                        firstTimeThrough = false;
                        return;
                    }


                    // showing the choices
                    displayChoices();


                    // momentarily hiding the whole choices things
                    $("#fadeThing").hide();


                    // placing the choices in the labels
                    currentProblem.choices.forEach(function (english, index) {
                        $("#myRadioLabel" + (index + 1)).text(english);
                    });


                    // fading in the choices
                    $("#fadeThing").fadeIn("slow");
                    $("#questionHolder").hide();
                    hint.reset();
                };
            }());


            function checkAnswer() {


                // warning user if no choice was made
                if ($("#myForm input[name='choice']:checked").length === 0) {
                    $("#messageBox").text("答えを選択しましょう！");
                    return;
                }


                // marking that the current problem HAS been answered
                problemHasBeenAnswered = true;


                // temporarily disabling all choices, once the current question has been answered
                $("#myForm input[name='choice']").prop({disabled: "true"});


                // temporarily disabling the nextButton
                $nextButton.off("click", checkAnswer);


                // clearing the hint stuff
                $("#hintContent").text("");
                hint.deactivate();


                // saving reference to which radio was checked
                var $checkedRadio = $(".myRadio:checked");
                var $correctAnswer = $(".myRadio[id='choice" + currentProblem.indexOfCorrectAnswer + "']");


                // if the checked answer is correct...
                if ($checkedRadio.is($correctAnswer)) {


                    // playing the correctSound
                    $("#myCorrectSound")[0].play();


                    // showing the question
                    $("#questionHolder").empty().append(currentProblem.question).show();


                    // adding the word to the box
                    $checkedRadio.closest("tr").addClass("answeredRight").end().replaceWith("<span class='glyphicon glyphicon-ok'></span>");
                    $(".myRadioLabel").not("#myForm label[for='choice" + currentProblem.indexOfCorrectAnswer + "']").closest("tr").addClass("faded");


                    // splicing the correctly answered word from the remainWordsArray
                    problems.removeCurrentProblem();


                    // if we haven't finished all the problems
                    if (problems.getNumberRemaining() <= 0) {


                        // turing off some listeners
                        $("html").off("keydown", vocabularyKeydownHandler);


                        // sending off the results
                        var results = {
                            time_taken: score.time_taken,
                            number_problems: serverData.problem.length,
                            number_mistakes: score.number_mistakes
                        };


                        // adding the 'endScreenHolder' div after a momentary pause
                        // NEW TEST sending the results object, and also a reference to the function to call when returned from the
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
                                        間違い: score.number_mistakes
                                    }
                                });
                            }, 1000);
                        }


                        return;
                    }


                    // preparing for the next problem
                    prepareForNextProblem(true);


                    // and if it's wrong...
                } else {


                    // playing the wrong sound, and incrementing score.number_mistakes
                    $("#myWrongSound")[0].play();


                    // scoring
                    score.number_mistakes += 1;


                    // coloring the wrong answer red
                    $checkedRadio.closest("tr").addClass("answeredWrong").end().replaceWith("<span class='glyphicon glyphicon-remove'></span>");


                    // highlighting the correct choice, after a pause
                    setTimeout(function () {


                        // displaying the question
                        $("#questionHolder").empty().append(currentProblem.question).show();


                        // highligting the correct choice, and appending the correct text
                        $correctAnswer.closest("tr").addClass("answeredRight");
                        $correctAnswer.replaceWith("<span class='glyphicon glyphicon-ok'></span>");


                        // slightly fading all choices but the correct one
                        $(".myRadioLabel").not("#myForm label[for='choice" + currentProblem.indexOfCorrectAnswer + "']").closest("tr").addClass("faded");


                        // removing any checks from boxes, and checking the correct one
                        $(".myRadio").prop({checked: false}); // have to use 'prop', not 'attr'
                        $correctAnswer.prop("checked", true);


                        prepareForNextProblem(false);

                    }, 1000);
                }
            } // end checkAnswer



            // key-down handlers - space bar & right arrow
            $("html").on("keydown", vocabularyKeydownHandler);
            function vocabularyKeydownHandler(e) {


                // spacebar plays sound
                if (e.keyCode === 32) {
                    $playButton.click();
                    e.preventDefault();
                    return false;
                }


                // number keys 1 ~ 4 -> choice1 ~ choice4!
                if (e.keyCode >= 49 && e.keyCode <= 52) {
                    $("#choice" + (e.keyCode - 48)).click();
                }


                // right arrow -> 'next'
                if (e.keyCode === 39 || e.keyCode === 13) {
                    $nextButton.click();
                    e.preventDefault();
                }
            }


            function updateScoreboard() {

                var numberRemaining = problems.getNumberRemaining();
                var numberProblems = problems.numberOfProblems;
                $("#scoreText").text((numberProblems - numberRemaining + 1) + " / " + numberProblems);
            }


            // wiring up the hintButton
            var hint = (function () {


                // local variables
                var originalText = $("#hintButton").text();
                var tsukattaKaisuu = 0;
                var hasBeenUsed = false;
                var buttonActive = true;


                $("#hintButton").on("click", function () {

                    if (buttonActive && !hasBeenUsed) {
                        hasBeenUsed = true;
                        score.hintButtonUsed += 1;
                        tsukattaKaisuu += 1;
                        $("#hintLabel").css("opacity", 0.5).text(originalText + " (" + tsukattaKaisuu + ")");
                        if (currentProblem.question) {
                            $("#questionHolder").text(currentProblem.question).show();
                        }
                    }
                });


                return {
                    reset: function () {
                        hasBeenUsed = false;
                        $("#hintLabel").css("opacity", 1);
                        $("#questionHolder").removeClass("faded").text("").hide();
                    },
                    deactivate: function () {
                        buttonActive = false;
                    },
                    activate: function () {
                        buttonActive = true;
                    }
                };
            }());


            function displayChoices() {


                // adding the radio buttons & labels
                $("#fadeThing").empty().append("<table id='myTable'></table>");


                // appending the rows & cells for the table
                for (var i = 1; i <= currentProblem.numberOfSentakushi; i++) {


                    // building the radio input
                    var $radioHolderTD = $("<td class='radioHolder'></td>");
                    var $myRadio = $("<input class='myRadio'>").val("choice" + i)
                            .prop({
                                type: "radio",
                                id: "choice" + i,
                                name: "choice"
                            })
                            .click(function () {


                                // removing 'disabled' styling from the #nextButton
                                $nextButton.removeClass("controlButtonDisabled");


                                // clearing the messageBox
                                $("#messageBox").text("");
                            });

                    $radioHolderTD.append($myRadio);


                    // preparing the label and adding the value (the Japanese choice)
                    var $labelTD = $("<td></td>");
                    var $label = $("<label class='myRadioLabel'></label>").prop({
                        id: "myRadioLabel" + i,
                        for : "choice" + i
                    }).text(currentProblem.choices[i - 1]);
                    $labelTD.append($label);


                    // finally, appending the radioHolder and the labelTD to the table row
                    // appending the table row
                    var $tr = $("<tr></tr>");
                    $tr.append($radioHolderTD).append($labelTD);
                    $("#myTable").append($tr);

                }
            }


            var prepareForNextProblem = (function () {


                // saving whatever text was there on page load
                var originalText = $nextButton.text();


                return function (doAddSmileyFace) {


                    // setting the next problem here
                    currentProblem = problems.pickRandomProblem();


                    // changing the button text
                    $nextButton.text("次の問題").off("click", moveOnToNextProblem).on("click", moveOnToNextProblem);


                    // adding a smiley face, if true
                    if (doAddSmileyFace) {
                        $("#smiley").css({visibility: "visible"});
                    }


                    function moveOnToNextProblem() {


                        // removing the smiley, if present
                        $("#smiley").css({visibility: "hidden"});


                        // removing listener
                        $nextButton.off("click", moveOnToNextProblem);


                        // NEW TEST stopping all audios
                        audio.stopAll();


                        // resetting the nextButton text to whatever it originally was
                        $nextButton.text(originalText);


                        // going to the next problem
                        nextProblem();
                    }
                };
            }());
            // end prepareForNextProblem

        }
);