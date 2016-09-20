




define(
        [
            "jquery",
            "tools",
            "helpers/wave",
            "helpers/floatingScoreBox",
            "helpers/SoundEffects",
            "jqueryui"
        ],
        function ($, tools, wave, FloatingScoreBox, SoundEffects) {


            // keeping screen at least 320px wide, for mobile
            tools.setMobileScreenWidth(320);


            $(function () {


                var myJSON = {};
                var floatingScoreBox;
                var score = tools.score();


                // removing the fixedProblemHolder 'cause the thing is too tall
                tools.fixedProblemHolder({
                    remove: true
                });


                var soundEffects = new SoundEffects({
                    container: $("#sound-controls-holder"),
                    sounds: {
                        tick: "/sounds/spelling_narabekae/tick.mp3",
                        correctSound: "/sounds/spelling_narabekae/correctSound.mp3"
                    },
                    playThisOnCheckboxCheck: "tick"
                });


                // detaching the master .problemHolder from the HTML
                var $problemHolderMaster = $(".problem-holder.my-template").detach().removeClass("my-template");


                // getting the problem data from the server, and building the problems
                tools.getProblemData(function (data) {


                    // exiting if no data was returned
                    if (!data) {
                        console.log("No data returned to tools.getProblemData()!");
                        return false;
                    }


                    // saving the returned data in the myJSON semi-global
                    myJSON = data;


                    // shuffling the problems, if specified
                    if (myJSON.misc.shuffleProblems) {
                        myJSON.problem = tools.shuffle(myJSON.problem);
                    }


                    // removing words with spaces (i.e.,that are two words) or that are only one letter in length
                    myJSON.problem = myJSON.problem.filter(function (element) {


                        var englishWord = element[0];
                        var hasNoSpaces = englishWord.indexOf(" ") === -1;
                        var isTwoOrMoreLetters = englishWord.length > 1;


                        return (hasNoSpaces && isTwoOrMoreLetters);
                    });


                    // whittling down the number of problems, if specified
                    if (myJSON.number_problems > 0) {
                        tools.whittleDownArray(myJSON.problem, myJSON.number_problems);
                    }


                    // instantiating the floatingScoreBox here, now that we know the number of problems
                    floatingScoreBox = FloatingScoreBox({
                        numberProblems: myJSON.problem.length,
                        backgroundColor: "blue",
                        fontSize: "14px",
                        showOnLoad: true
                    });


                    // building the problems
                    myJSON.problem.forEach(buildProblem);
                });



                function buildProblem(array, index) {


                    var $problemHolder = $problemHolderMaster.clone();
                    var english = array[0];
                    var japanese = array[1];
                    var problemNumber = index + 1;


                    // mixing the letters, putting each in its own span, and returning that string of html markup
                    var mixedLetters = (function () {


                        var array = tools.shuffle(english.split(""), true); // adding true to gurantee that the [0] element is always moved
                        var letterSpan = "";


                        array.forEach(function (letter) {
                            letterSpan += "<span class='letter'>" + letter + "</span>";
                        });


                        return letterSpan;
                    }());


                    // appending various data to the .problemHolder
                    // wiring up the hintButton
                    var $buttonsHolder = $problemHolder.find(".buttons-holder");
                    var $hintButton = $problemHolder.find(".hint-button");
                    var $lettersHolder = $problemHolder.find(".letters-holder");
                    $problemHolder.find(".problem-number").text(problemNumber + ". ");
                    $problemHolder.find(".japanese-holder").prepend(japanese);
                    $lettersHolder.append(mixedLetters);


                    // appending the newly-cloned $problemHolder to the #all-problems-holder
                    $("#all-problems-holder").append($problemHolder);


                    // wiring up the hintButton
                    var hintButton = new HintButton({
                        button: $hintButton,
                        word: english,
                        buttonLabel: "Hint",
                        lettersHolder: $lettersHolder
                    });


                    // making the letters sortable
                    $lettersHolder.sortable({
                        forceHelperSize: true,
                        forcePlaceholderSize: true,
                        revert: 100,
                        items: ".letter",
                        helper: "clone",
                        placeholder: "letter-placeholder",
                        start: function (event, ui) {


                            // hiding all hint button, and showing the local one
                            $(".buttons-holder").addClass("buttons-holder-hidden");
                            $buttonsHolder.removeClass("buttons-holder-hidden");


                            var width = $(ui.item).outerWidth(true);
                            var height = $(ui.item).height();


                            $(".letter-placeholder").css({
                                width: width,
                                height: height
                            });

                        },
                        change: function () {
                            soundEffects.play("tick");
                        },
                        stop: function () {
                            checkAnswer({
                                lettersHolder: $lettersHolder,
                                problemHolder: $problemHolder,
                                answer: english,
                                buttonsHolder: $buttonsHolder,
                                hintButton: $hintButton
                            });
                        }
                    });
                }


                function endSequence() {


                    // sending off the results
                    var results = {
                        time_taken: score.time_taken,
                        number_problems: myJSON.problem.length,
                        number_mistakes: score.number_mistakes
                    };


                    // sending the results object, and also a reference to the function to call when returned from the
                    tools.send_results(results, function () {


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
                    });
                }


                function HintButton(input) {


                    if (!input || !input.button || !input.word) {
                        console.log("HintButton needs 'button' and 'word' properties passed in!");
                        return false;
                    }


                    var $button = input.button;
                    var $lettersHolder = input.lettersHolder;
                    var word = input.word;
                    var hintShowTime = input.hintShowTime || 2000;
                    var hintButtonInactiveTime = input.hintButtonInactiveTime || 8;
                    var buttonLabel = $button.text();
                    var buttonActive = true;
                    var mySetTimeout;


                    // wiring up the button
                    $button.on(tools.click0rTouch, showCorrectLetters);


                    // replacing all the letters with their "correct" counterparts
                    function showCorrectLetters() {


                        // exiting if the button is inactive
                        if (!buttonActive) {
                            return;
                        }


                        // disabling the button so we can't activate it twice
                        disableHintButton();


                        // formatting the .letters and showing the "correct" letter in each
                        // ALSO fading in and out, just for eye-candy
                        $lettersHolder.fadeTo(200, 0, function () {


                            $lettersHolder.addClass("showing-hint").find(".letter").each(function (index) {


                                var answerLetter = word[index];
                                var mixedLetter = $(this).text();


                                // swapping out the "mixed" letter for the "answerLetter"
                                $(this).data("originalLetter", mixedLetter).text(answerLetter);
                            });

                            $lettersHolder.fadeTo(200, 1);

                        });



                        // disabling sortability 
                        $lettersHolder.sortable("option", "disabled", true);


                        // after a pause, restoring letters to their "mixed" state automatically 
                        mySetTimeout = setTimeout(restoreLetters, hintShowTime);


                        // mousedown on $letterHolder nullifies the setTimeout and calls restoreLetter
                        $lettersHolder.on(tools.click0rTouch, shortCircuitTimer);
                    }


                    function disableHintButton() {


                        // deactivating the button temporarily
                        buttonActive = false;


                        $button.addClass("button-disabled");


                        // cementing the button width so it doesn't change when the text is changed
                        var standardButtonWidth = $button.outerWidth(false);
                        $button.css({width: standardButtonWidth});


                        var counter = 0;
                        var myInterval = setInterval(countdown, 1000);
                        countdown(); // calling the function once, before the setInterval kicks in
                        function countdown() {


                            // incrementation!
                            counter++;


                            // displaying the number of seconds remaining on the button
                            $button.text(hintButtonInactiveTime - counter);


                            // testing for finish
                            if (counter >= hintButtonInactiveTime) {
                                clearInterval(myInterval);
                                buttonActive = true;
                                $button.removeClass("button-disabled").text(buttonLabel);
                                restoreLetters();
                            }
                        }
                    }


                    // restoring the letters and nullifying the setTimeout (when the letters are cicked or dragged)
                    function shortCircuitTimer() {
                        clearTimeout(mySetTimeout);
                        restoreLetters();
                    }


                    function restoreLetters() {


                        if (buttonActive) {
                            return;
                        }


                        // turning off listener so we don't get errors after the problem is answered
                        $lettersHolder.off(tools.click0rTouch, shortCircuitTimer);


                        $lettersHolder.fadeTo(200, 0, function () {

                            // restoring $lettersHolder and .letters to their original (mixed) state
                            $lettersHolder.removeClass("showing-hint").find(".letter").each(function () {


                                // getting the mixedLetter (not the correct one!) and restoring it to the .letter
                                var mixedLetter = $(this).data("originalLetter");


                                // replacing the "mixed" letter with the "answerLetter"
                                $(this).text(mixedLetter);
                            });


                            // restoring sortability, if present
                            if ($lettersHolder.hasClass("ui-sortable")) {
                                $lettersHolder.sortable("option", "disabled", false);
                            }


                            $lettersHolder.fadeTo(200, 1);
                        });
                    }
                }


                function checkAnswer(p) {


                    var $problemHolder = p.problemHolder;
                    var $lettersHolder = p.lettersHolder;
                    var $buttonsHolder = p.buttonsHolder;
                    var $hintButton = p.hintButton;
                    var $hint = $problemHolder.find(".hint");
                    var answer = p.answer;
                    var numberLettersCorrect = 0;


                    $lettersHolder.find(".letter").each(function (index) {

                        var thisLetter = $(this).text();

                        if (answer[index] === thisLetter) {
                            $(this).addClass("in-correct-slot");
                            numberLettersCorrect++;
                        } else {
                            $(this).removeClass("in-correct-slot");
                        }
                    });


                    if (numberLettersCorrect === answer.length) {


                        // showing score in floatingScorebox
                        floatingScoreBox.markCorrect();


                        // coloring the whole row green
                        $problemHolder.addClass("answered");


                        // removing draggability
                        $lettersHolder.sortable("destroy");


                        // removing any hints and buttons
                        $hint.remove();
                        $buttonsHolder.remove();


                        // disabling the hintButton
                        $hintButton.prop({disabled: true}).fadeOut("slow");


                        // playing the correct sound
                        soundEffects.play("correctSound");


                        // checking for finish, after a pause
                        if ($(".answered").length === myJSON.problem.length) {
                            setTimeout(endSequence, 2000);
                        }


                        // waving the words, just for fun
                        wave($problemHolder.find(".letters-holder"), {
                            addClass: "no-dots",
                            callback: function () {

                                // after the wave, swapping the problem number for the glyphicon
                                $problemHolder.find(".problem-number").empty().append("<span class='glyphicon glyphicon-ok checkmark'></span>");
                            }
                        });
                    }
                }
            });
        }
);
