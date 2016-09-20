

/*
 * 
 *      Formats:
 *      
 *      1)  Choosing spelling:      犬 = [dog, dahg, dooog]                   // all on one line, in word1!
 *      
 *      2)  English alone:          Can you do it?  -Yes, I [can, do, am].      // one line, in word1!
 *      
 *      3)  Japanese & English:     その通りです！
 *                                  That’s [right, left, light]!                // two lines, in word1 and word2!
 *                                  
 *      -------------------------------------
 *      
 *      
 *      Shuffle problems: {"shuffleProblems": true}
 *      
 *      Random block colors: {"randomBlockColors": true}
 *      
 * 
 */



define(
        [
            "jquery",
            "tools",
            "helpers/processSentence",
            "helpers/SoundEffects",
            "helpers/shakeElement",
            "helpers/floatingScoreBox",
            "konva/countdownClock",
            "howler",
            "jqueryui"
        ],
        function ($, tools, processSentence, SoundEffects, shake, FloatingScoreBox, CountdownClock) {


            $(function () {


                var floatingScoreBox;
                var myJSON;
                var score = tools.score({
                    number_guesses: 0
                });


                var soundEffects = new SoundEffects({
                    container: $("#sound-effects-checkbox-stuff"),
                    sounds: {
                        correctSound: "/sounds/blanks_drop/correctSound.mp3",
                        wrongSound: "/sounds/blanks_drop/wrongSound.mp3"
                    }
                });


                // detaching elements to be cloned from the parent HTML
                var $problemTableMaster = $("#templates-holder").find(".problem-table").detach();
                var $graphHolderHolder = $("#templates-holder").find("#graph-holder-holder").detach();
                var $choiceSpanMaster = $("#templates-holder").find(".choice-span").detach();


                // removing the fixedProblemHolder stuff because it's too tall
                tools.fixedProblemHolder({
                    remove: true
                });


                // retrieving the data, then building the problems
                tools.getProblemData(function (d) {


                    // saving all the data returned in the myJSON object
                    myJSON = d;


                    // instantiating the floatingScoreBox here, now that we know the number of problems
                    floatingScoreBox = FloatingScoreBox({
                        numberProblems: myJSON.problem.length,
                        backgroundColor: "blue",
                        fontSize: "14px"
                    });


                    // removing extra problems, if specified
                    if (myJSON.number_problems && myJSON.number_problems > 2) {
                        myJSON.problem = tools.whittleDownArray(myJSON.problem, myJSON.number_problems);
                    }


                    // shuffling problems, if specified in the misc field
                    // ** syntax is straight JSON: {"shuffleProblems":true}
                    if (myJSON.misc && myJSON.misc.shuffleProblems) {
                        myJSON.problem = tools.shuffle(myJSON.problem);
                    }


                    // going through the problems and adding the problems and choices to the divs
                    myJSON.problem.forEach(makeNewProblem);
                });


                function makeNewProblem(item, index) {


                    // removing any empty strings from the item
                    item = item.filter(function (element) {
                        if (element !== "") {
                            return element;
                        }
                    });


                    // cloning the ".problem-table" table and appending to the #mainProblemsHolder
                    var $problemTable = $problemTableMaster.clone();


                    // appending the problemTable to the mainProblemsHolder
                    $("#mainProblemsHolder").append($problemTable);


                    // adding the problem number (which is index + 1)
                    $problemTable.find(".problem-number-holder").text(index + 1);


                    // if there is no second item, then treating the first (which would ordinarily be the Japanese) as the English
                    var japaneseProblem, englishRaw;
                    if (item.length === 1) {
                        japaneseProblem = null;
                        englishRaw = item[0];
                    } else {
                        japaneseProblem = item[0];
                        englishRaw = item[1];
                    }


                    // processing the sentence (breaking it up, etc.)
                    var processedEnglish = processSentence(englishRaw);


                    // adding the Japanese, if present
                    if (japaneseProblem) {
                        $problemTable.find(".japanese-span").text(japaneseProblem);
                    } else {
                        $problemTable.find(".japanese-holder").remove();
                    }


                    // adding the English stuff before and after the .drop-target
                    $problemTable.find(".drop-target")
                            .before(processedEnglish.stuffBeforeSentakushi)
                            .after(processedEnglish.stuffAfterSentakushi)
                            .droppable({
                                accept: ".choice-span",
                                tolerance: "touch",
                                scope: index,
                                drop: function (event, ui) {
                                    var $parent = $(this).closest(".problem-table");
                                    checkAnswer(ui, $parent);
                                }
                            });


                    // removing margin-left for blank if it's the very first item (i.e., there's nothing before it)
                    if (!processedEnglish.stuffBeforeSentakushi && processedEnglish.stuffAfterSentakushi) {
                        $problemTable.find(".drop-target").css({marginLeft: "0px"});
                    }


                    // coloring the blocks randomly IF specified in the "misc" part of the JSON
                    var color = myJSON.misc.randomBlockColors ? tools.pickDarkColor() : "";


                    // appending the choices
                    var $choicesHolder = $problemTable.find(".choices-holder");
                    processedEnglish.sentakushi.forEach(function (choice, choiceIndex) {


                        // cloning the .choice-span, and appending it to the .choices-holder
                        var $choiceSpan = $choiceSpanMaster.clone();
                        $choicesHolder.append($choiceSpan);


                        // formatting the choice-span-text, and appending the text
                        $choiceSpan.find(".choice-span-text").css({backgroundColor: color}).text(choice);


                        $choiceSpan.draggable({
                            revert: true,
                            revertDuration: 200,
                            scope: index,
                            stack: ".choice-span",
                            start: function (event, ui) {
                                var originalWidth = $(ui.helper).css("width");
                                $problemTable.find(".drop-target").css("width", originalWidth);
                            }
                        });


                        // marking this choice as correct or not
                        if (choiceIndex === processedEnglish.correctAnswerIndex) {
                            $choiceSpan.data("isCorrect", true);
                        } else {
                            $choiceSpan.data("isCorrect", false);
                        }
                    });


//                    $problemTable.find(".next-button").click(function () {
//                        $problemTable.fadeTo(200, 0, function () {
//                            $(this).remove();
//                        });
//                    });

                }


                function checkAnswer(ui, $parent) {


                    var $draggedWord = $(ui.draggable);
                    var isCorrect = $draggedWord.data("isCorrect");
                    var correctAnswer = $draggedWord.text();


                    // keeping track of the TOTAL NUMBER of guesses made, both right and wrong
                    score.number_guesses += 1;


                    // shaking and returning if the wrong answer
                    if (!isCorrect) {
                        shake($parent);
                        soundEffects.play("wrongSound");
                        score.number_mistakes += 1;
                        floatingScoreBox.markMistake(score.number_mistakes);
                        return;
                    }



                    /*  If we've got this far, then the answer must be correct!  */


                    // playing the correct sound
                    soundEffects.play("correctSound");


                    // showing the score in the floating score box thingy
                    floatingScoreBox.markCorrect();


                    // formatting the underlined space itself (not the choice spans)
                    $parent.addClass("problem-correctly-answered").find(".drop-target").replaceWith("<div class='correctly-answered'> " + correctAnswer + " </div>");


                    // disabling draggability on all choices for this problem
                    $parent.find(".choice-span").draggable("destroy").addClass("choice-span-disabled");


                    $draggedWord.find(".choice-span-text").addClass("hollow-shell").empty().append("<span class='glyphicon glyphicon-ok'></span>");


                    // showing the .choice-span-text, after it has snapped back (200ms)
                    $draggedWord.find(".choice-span-text").css({opacity: 0}).delay(200).animate({opacity: 1}, 200);


//                    setTimeout(function() {
//                        $parent.fadeTo(400, 0, function() {
//                            $parent.remove();
//                        });
//                    }, 1000);


                    // checking to see if we've cleared all problems
                    if ($(".drop-target").length === 0) {
                        endSequence();
                    }
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


                            // appending the graphsHolderHolder, which we detached up above
                            $("#assignment_results_misc").append($graphHolderHolder);


                            // calculating the percent correct
                            var percentCorrect = results.number_problems / score.number_guesses;
                            var percentCorrectText = Math.round(percentCorrect * 100) + "%";


                            // adding a pie chart to show percentage of correct answers
                            var pieGraph = CountdownClock({
                                container: "graph-holder",
                                radius: 10,
                                maxValue: percentCorrect, // stops the clock at some PERCENT of the whole, e.g., 0.75
                                autoStart: 1000,
                                duration: 2000,
                                easing: "StrongEaseOut",
                                onFinish: function () {
                                    $("#graph-legend").append(percentCorrectText);
                                }
                            });

                        }, 1000);
                    });
                }
                // end endSequence()

            });
            // end main jQuery closure

        }
);
