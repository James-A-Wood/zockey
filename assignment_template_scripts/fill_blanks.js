

define(
        [
            "jquery",
            "tools",
            "helpers/adjustTextInputWidth",
            "helpers/shakeElement",
            "helpers/myAudio",
            "helpers/floatingScoreBox",
            "helpers/SoundEffects"
        ],
        function ($, tools, adjustTextInputWidth, shake, MyAudio, FloatingScoreBox, SoundEffects) {


            // for mobile, keeping screen at least 320px wide and turning off scaling
            tools.setMobileScreenWidth(320);


            // making sure Enter key triggers change event (necessary in IE)
            tools.enterKeyTriggersChangeEvent();


            // loading the sound effects
            var sounds = new SoundEffects({
                container: $("#audioControlsHolder"),
                playThisOnCheckboxCheck: "tick",
                sounds: {
                    correct: "/sounds/fill_blanks/correctSound.mp3",
                    tick: "/sounds/fill_blanks/tick.mp3"
                }
            });


            // various variables
            var score = tools.score();
            var myJSON;
            var floatingScoreBox;
            var clock = tools.clock({
                container: $("#clock-holder"),
                pauseStart: true
            });


            // wiring up the text-input width adjustment
            var textInputWidthAdjuster = adjustTextInputWidth(40, 10);


            // retrieving and parsing the JSON object
            tools.getProblemData(setUpProblems);
            function setUpProblems(data) {


                // saving the data returned from the server
                myJSON = data;


                // removing extra elements, if there are too many
                if (myJSON.number_problems && myJSON.number_problems > 2) {
                    tools.whittleDownArray(myJSON.problem, myJSON.number_problems);
                }


                // removing any problems that have no ¥ signs (this shouldn't be necessary)
                myJSON.problem.forEach(function (problem) {
                    if (problem[1].indexOf("¥") === -1) {
                        console.log("This sentence has no blanks specified: \"" + problem[1] + "\"");
                        myJSON.problem.splice(myJSON.problem.indexOf(problem), 1);
                    }
                });


                // various variables
                var answer;
                var $inputHolderMaster = $(".my-template.input-and-hint-holder").detach().removeClass("my-template");
                var $tableRow = $(".my-template.table-row").detach().removeClass("my-template");


                // instantiating the floatingScoreBox
                floatingScoreBox = FloatingScoreBox({
                    numberProblems: myJSON.problem.length,
                    backgroundColor: "blue",
                    fontSize: "14px",
                    showOnLoad: true
                });


                // cycling through all the sentences, building the problems...
                myJSON.problem.forEach(function (thisProblem) {


                    // splitting the sentence into an array of its words (including words containing a '¥', at this point)
                    var wordsInCurrentSentence = thisProblem[1].split(" ");
                    var $newRow = $tableRow.clone();
                    var $playButton = $newRow.find(".playButtonHolder");
                    var $wordsHolder = $newRow.find(".words-holder");


                    // appending the words, or, if there's a ¥, the text inputs
                    wordsInCurrentSentence.forEach(function (thisWord) {


                        // if the word contains a '¥' and thus gets turned into a text input...
                        if (thisWord.indexOf("¥") !== -1) {


                            // stripping the '¥' from the word
                            answer = thisWord.replace("¥", "");


                            // adding the text input, with a unique id
                            var $newHintHolder = $inputHolderMaster.clone();
                            $newHintHolder.find(".blank").data("answer", answer).keydown(function () {
                                textInputWidthAdjuster($(this));
                                $(this).removeClass("wrong-answer");
                            });


                            $wordsHolder.append($newHintHolder);

                        } else {
                            $wordsHolder.append("<span class='word'>" + thisWord + "</span>");
                        }
                    });


                    // appending the row
                    $("#allProblemsTable").append($newRow);


                    var audio = MyAudio.new({
                        container: $playButton,
                        file: myJSON.audioFiles[thisProblem[0]], // the answer, without blanks or ¥-signs
                        buttonWidth: "50px",
                        class: "playButton"
                    });


                    // appending the "audio" functionality as the "audio" property.  Cool!
                    $playButton.data("audio", audio).click(function () {


                        // being' anal
                        var $activeInput = $newRow.find(".active");
                        var $hintButton = $newRow.find(".inline-hint");


                        // starting the clock, if it's not already running
                        clock.start();


                        // emptying and disabling all active blanks everywhere
                        $(".active").val("").attr({disabled: true});


                        // enabling and marking active all active text inputs in the current problem
                        $activeInput.attr({disabled: false});


                        // making ALL .inline-hint buttons inactive, then activating the current one
                        $(".inline-hint").addClass("hint-inactive");


                        $hintButton.removeClass("hint-inactive").off("click").click(function () {
                            hintButton.clicked($(this));
                        });


                        // setting focus on the first of (possibly) multiple text inputs
                        $activeInput.first().focus();
                    });
                });


                // checking content of all 'active' elements when something is typed
                $(".active").change(sendChange);
                function sendChange() {
                    // Weird!  Need to do it this way to prevent change event from firing twice in Chrome!
                    $(this).off("change").blur().focus().on("change", sendChange);
                    checkAnswer($(this));
                }


                // FINALLY fading in the #mainProblemsHolder
                $("#mainProblemsHolder").fadeTo(200, 1);
            }


            var hintButton = (function () {

                var myShowHintsTimeout;
                var hintButtonUsed = 0;
                var hintButtonSleepTime = 10;
                var timeToShowHint = 1000;
                var hintNowShowing = false;
                var numberTimesClicked = 0;

                return {
                    numberTimesClicked: function () {
                        return numberTimesClicked;
                    },
                    hintNowShowing: function () {
                        return hintNowShowing;
                    },
                    clicked: function ($thisButton) {


                        // exiting if the button is disabled
                        if ($thisButton.hasClass("hint-disabled")) {
                            return;
                        }


                        // keeping track of how many times the hint button has been used
                        numberTimesClicked += 1;
                        $("#hint-button-clicked-holder").html("ヒントボタン使用:　" + numberTimesClicked + " 回");


                        // saving reference to the original text (probably "hint")
                        var originalText = $thisButton.text();


                        // temporarily deactivating and 'sleeping' the hint button
                        $thisButton.addClass("hint-disabled");
                        $thisButton.text(originalText + " (" + hintButtonSleepTime + ") ");


                        // incrementing the hint button counter
                        hintButtonUsed += 1;


                        // counting down to removing the disabled class from the button
                        (function () {
                            var counter = hintButtonSleepTime;
                            var delayInterval = setInterval(function () {
                                counter--;
                                $thisButton.text(originalText + " (" + counter + ")");
                                if (counter === 0) {
                                    clearInterval(delayInterval);
                                    $thisButton.removeClass("hint-disabled");
                                    $thisButton.text(originalText);
                                }
                            }, 1000);
                        }());


                        // emptying and putting focus on the first active blank
                        $thisButton.closest(".table-row").find(".active").eq(0).val("").focus();


                        // showing the word itself in each box in the current problem
                        $thisButton.closest(".table-row").find(".active").each(function () {


                            // saving a reference to the current blank
                            var $thisInput = $(this);
                            var answerToShow = $thisInput.data("answer");


                            // marking the hint as now showing, so the problem can't be answered
                            hintNowShowing = true;


                            $thisInput.siblings(".hint-holder").text(answerToShow).off("click").click(function () {
                                $(this).empty();
                            });


                            // clearing the hint after a set time
                            myShowHintsTimeout = setTimeout(function () {


                                hintNowShowing = false;


                                // fading out and removing the .hint-holders
                                $(".hint-holder").fadeTo(2000, 0, function () {
                                    $(this).empty().css({opacity: 1});
                                });

                            }, timeToShowHint);
                        });
                    }
                };
            }());


            // called every time anything is input into the text input field
            function checkAnswer($currentInput) { // $currentInput is a reference to the current text input


                // saving reference to the parent, 'cause we may be deleting $currentInput
                var $parent = $currentInput.closest(".table-row");


                // exiting if the hint is now showing (that would be cheating!)
                if (hintButton.hintNowShowing()) {
                    return;
                }


                // saving some stuff in variables
                var wordThatStudentTyped = $currentInput.prop("value");
                var correctAnswer = $currentInput.data("answer");


                // removing any blank spaces from the word - beginning, middle, or end
                wordThatStudentTyped = wordThatStudentTyped.replace(/\s/g, "");


                // restoring the word that the student typed, not stripped of spaces
                $currentInput.val(wordThatStudentTyped);


                // if what the student typed is different than the correct answer...
                if (wordThatStudentTyped !== correctAnswer) {


                    // coloring the box red
                    $currentInput.addClass("wrong-answer");


                    // keeping score
                    score.number_mistakes += 1;


                    // showing the score in the floatingScoreBox
                    floatingScoreBox.markMistake(score.number_mistakes);


                    // shaking the box on incorrect input
                    shake($currentInput, {
                        duration: 250,
                        amplitude: 3
                    });

                    return true;
                }



                /*  If we've gotten this far, then the answer is CORRECT! */



                // removing the text input, and showing the answer
                $currentInput.siblings(".hint-holder").remove();
                $currentInput.replaceWith("<span class='input-answered'>" + correctAnswer + "</span>");


                // if there are still active (= unanswered) boxes in this particular problem, then exiting here 
                if ($parent.find(".active").length > 0) {

                    //putting focus on the next active text input (if any)
                    $parent.find(".active").eq(0).focus();

                    return;
                }



                /* If we've got this far, then this problem has been completely answered! */


                // disabling the button and replacing the play-button with a check
                $parent.find(".playButtonHolder").data("audio").disablePlay().addSuccessCheckMark().stop();


                // playing the correct sound
                sounds.play("correct");


                // updating the scorebox, too.
                floatingScoreBox.markCorrect();


                // removing the "now-playing" formatting from the button
                $(".playButton").addClass("notPlaying");


                // removing the hintButton
                $parent.addClass("answered").find(".inline-hint").remove();


                // sleeping the hint button when the current question has been answered
                $("#hintButton").removeClass("hintButtonActive").addClass("hintButtonSleep");


                // checking if this problem was the last problem
                if ($(".answered").length === myJSON.problem.length) {


                    var results = {
                        time_taken: score.time_taken,
                        number_problems: $(".input-answered").length,
                        number_mistakes: score.number_mistakes
                    };


                    // sending the results object, and also a reference to the function to call when returned from the
                    tools.send_results(results, backFromSendResults);
                    function backFromSendResults() {


                        // adding the 'assignment_results' div after a slight pause
                        setTimeout(function () {

                            // passing in the object to put the assignment_results stuff into, and the data to display
                            tools.showAssignmentResults({
                                container: $("#fillBlanksMain"),
                                data: {
                                    時間: score.time_taken + " 秒",
                                    問題数: results.number_problems + " 問",
                                    間違い: score.number_mistakes,
                                    ヒント利用数: hintButton.numberTimesClicked() + " 回"
                                }
                            });

                        }, 1000);
                    }
                }
            }
        });
