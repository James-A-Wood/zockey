

define(
        [
            "jquery",
            "tools",
            "helpers/SoundEffects",
            "helpers/shakeElement",
            "helpers/processSentence",
            "howler",
            "jqueryui"
        ],
        function ($, tools, SoundEffects, shakeElement, processSentence) {


            $(function () {


                var score = tools.score();
                var $mainProblemsHolder;
                var myJSON;


                // adding the clock
                var clock = tools.clock({
                    container: $("#clock-holder"),
                    pauseStart: true
                });


                // adding custom directions
                $("#directions").text("英単語をドラッグして、日本語の意味になるように並べましょう。");


                // creating the scorebar
                var scoreBar = (function () {


                    var $scoreDot = $("#score-bar").find(".score-dot").detach().css({display: "inline-block"});


                    return {
                        addNewDot: function () {
                            var $newScoreDot = $scoreDot.clone();
                            $("#score-bar").append($newScoreDot);
                        },
                        increment: function () {
                            $("#score-bar").find(".score-dot").not(".answered").first().addClass("answered");
                        },
                        getNumRemainingProblems: function () {
                            return $(".score-dot").not(".answered").length;
                        }
                    };
                }());


                // wiring up the sound effects
                var sounds = new SoundEffects({
                    container: $("#sound-effects-checkbox-stuff"),
                    playThisOnCheckboxCheck: "tickSound",
                    sounds: {
                        tickSound: "/sounds/narabekae_waei/correctSound.mp3",
                        wrongSound: "/sounds/narabekae_waei/wrongSound.mp3"
                    }
                });


                // detaching the .individual-problem-holder template so we can clone it down below
                var $problemHolder = $(".my-template.individual-problem-holder").detach().removeClass("my-template");


                // retrieving the data, then building the problems
                tools.getProblemData(function (problemData) {


                    // saving all the data returned in the myJSON object
                    myJSON = problemData;


                    // saving reference to the mainProblemsHolder
                    $mainProblemsHolder = $("#mainProblemsHolder");


                    // shuffling the problems, unless "misc.shuffleProblems" is EXPLICITLY set to false!
                    if (problemData.misc && problemData.misc.shuffleProblems !== false) {
                        problemData.problem = tools.shuffle(problemData.problem);
                    }


                    // setting the number of problems
                    score.number_problems = problemData.problem.length;


                    // adding the HTML markup for each problem
                    problemData.problem.forEach(buildNewProblem);


                    // making the choices holder and answer holder numb to touch
                    tools.numbToTouch($(".english-choices-holder"));
                });


                function buildNewProblem(data) {


                    // detecting Japanese or English based on the string content!
                    var rawJapanese, rawEnglish;
                    if (tools.languageOf(data[0]) === "Japanese") {
                        rawJapanese = data[0];
                        rawEnglish = data[1];
                    } else {
                        rawJapanese = data[1];
                        rawEnglish = data[0];
                    }


                    // adding one new (blank) scoreDot for each problem
                    scoreBar.addNewDot();


                    // adding a new problem-holder with unique ID, for draggable containment
                    var $thisProblemHolder = $problemHolder.clone();
                    $("#allProblemsHolder #all-problems-frame").append($thisProblemHolder);


                    // appending the Japanese sentence to the .japanese-holder
                    $thisProblemHolder.find(".japanese-holder").append(rawJapanese);


                    // breaking the English up into an array, possibly with dummy words too
                    var processedSentence = processSentence(rawEnglish);


                    // splitting the english at the spaces, and removing any underscores
                    var englishAnswersArray = processedSentence.words;
                    tools.trimAllElements(englishAnswersArray, {
                        removeUnderscores: true
                    });


                    // shuffling the English words - words + dummy words, if applicable, or just the words, otherwise
                    var choicesArray = processedSentence.wordsPlusSentakushi || processedSentence.words;
                    choicesArray = tools.trimAllElements(choicesArray, {
                        removeUnderscores: true,
                        shuffle: true
                    });


                    // putting the choices (the shuffled words) into the holder
                    choicesArray.forEach(function (word) {


                        // building a span for each choice
                        var $span = $("<span class='choice-holder draggable'/>").text(word).draggable({
                            revert: true,
                            revertDuration: 100,
                            stack: ".choice-holder",
                            zIndex: 1000
                        });


                        // slightly skewing each block to make it more visually appealing
                        var randomRotation = 5 - Math.random() * 10;
                        $span.css({
                            transform: "rotate(" + randomRotation + "deg)"
                        });


                        // appending dis puppy
                        $thisProblemHolder.find(".english-choices-holder").append($span);
                    });


                    // wiring up droppability on this problem's answer holder
                    $thisProblemHolder.find(".answer-holder").droppable({
                        accept: ".draggable",
                        hoverClass: "hovering",
                        drop: function (event, ui) {
                            clock.start();
                            $(this).removeClass("empty");
                            $thisProblemHolder.find(".drag-here-message").remove();
                            checkAnswer(ui.helper, $thisProblemHolder, englishAnswersArray);
                        }
                    });


                    // wiring up this problem's .answer-holder to be clickable
                    $thisProblemHolder.find(".answer-holder").click(function () {
                        $("#next-button").click();
                    });
                }


                // NOTE the englishAnswersArray is different for EACH PROBLEM, meaning it's NOT GLOBAL!  Cool!
                function checkAnswer($draggedBlock, $thisProblemHolder, englishAnswersArray) {


                    var $answerTextHolder = $thisProblemHolder.find(".answer-text-holder");
                    var droppedWord = $draggedBlock.text();
                    var correctAnswer = englishAnswersArray[0];


                    // exiting here if it's not correct
                    if (droppedWord !== correctAnswer) {
                        shakeElement($thisProblemHolder);
                        sounds.play("wrongSound");
                        score.number_mistakes++;
                        return;
                    }


                    /*
                     * 
                     *      Beyond this point, the word is correct!
                     *      
                     */


                    // playing the "correct" sound (tick sound)
                    sounds.play("tickSound");


                    // adding the word to the .answer-words-holder
                    var $answeredWordSpan = $("<span class='answered-word-span'/>").text(correctAnswer + " ");
                    $answerTextHolder.append($answeredWordSpan);


                    // adjusting the height of the frame to match that of the .words-holder
                    $answerTextHolder.closest(".answer-holder").css({height: $answerTextHolder.height() + 10});


                    // making the $draggedBlock transparent in all cases, and removing draggability
                    $draggedBlock.css({opacity: 0}).draggable("destroy");


                    // removing the first word form the array
                    englishAnswersArray.shift();


                    // checking for finish
                    if (englishAnswersArray.length === 0) {


                        // doin' a score dot
                        scoreBar.increment();


                        // addig "answered" class to the #mainProblemsHolder - IMPORTANT because lots of programmatic stuff depend on this!
                        $mainProblemsHolder.addClass("answered");


                        // making the choices holder and answer holder numb to touch
                        tools.numbToTouch($(".english-choices-holder"), "off");


                        // if there are no problems remaining, moving on the endSequence after a slight pause
                        if (scoreBar.getNumRemainingProblems() === 0) {
                            setTimeout(endSequence, 1000);
                        }
                    }
                }



                function endSequence() {


                    // sending off the results
                    var results = {
                        time_taken: score.time_taken,
                        number_problems: score.number_problems,
                        number_mistakes: score.number_mistakes
                    };


                    // sending the results object, and also a reference to the function to call when returned from the
                    tools.send_results(results, function () {


                        // adding the 'assignment_results' div after a slight pause
                        setTimeout(function () {


                            // passing in the object to put the assignment_results stuff into, and the data to display
                            tools.showAssignmentResults({
                                container: $mainProblemsHolder,
                                data: {
                                    時間: score.time_taken + " 秒",
                                    問題数: results.number_problems + " 問", 間違い: score.number_mistakes
                                }
                            });


                        }, 1000);
                    });
                }


                // wiring up the Enter key to trigger the #next-button
                $("html").keydown(function (e) {


                    if (e.keyCode === 13 || e.keyCode === 32) {
                        e.preventDefault();
                        $("#next-button").click();
                    }
                });


                // wiring up the next button
                $("#next-button").click(function () {


                    // only if the mainProblemsHolder has the class "answered"
                    if ($mainProblemsHolder.hasClass("answered")) {


                        $mainProblemsHolder.removeClass("answered");
                        $(".individual-problem-holder").eq(0).remove();
                    }
                });

            });
            // end main jQuery closure

        }
);
