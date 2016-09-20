"use strict";

define(
        [
            "jquery",
            "tools"
        ],
        function ($, tools) {


            return function (inputs) {


                // checking inputs 
                if (!inputs || typeof inputs !== "object") {
                    console.log("This requires an object passed in!");
                    return false;
                }


                // replacing 'problems' with 'problem'
                if (!inputs.problem && inputs.problems) {
                    inputs.problem = inputs.problems;
                }


                // merging the inputs with the default values
                var settings = $.extend({
                    numberSentakushi: 3,
                    problems: inputs.problem, // contains the words in raw form
                    deleteAllChoices: false, // set to 'true' to delete all the choices as they're used
                    recycleProblems: false, // set to "true" to recycle all the words, so they never run out
                    misc: {}
                }, inputs || {});


                // converting to an array, if it's not an array already
                settings.problems = tools.objectToArray(settings.problems);


                // removing extra problems, if specified
                if (settings.number_problems) {
                    settings.problems = tools.whittleDownArray(settings.problems, settings.number_problems);
                }


                // local variables
                var allProblemsArray = settings.problems.slice(); // holds all the problems in array form, never whittled down
                var remainingProblemsArray = allProblemsArray.concat(); // starts out as allProblemsArray, but is whittled down
                var translationFor = {};
                var currentProblem = []; // holds the current problem, in straight array form
                var remainingWords = []; // will hold all the English words
                var numberOfSentakushi = 0; // to be changed later


                // saving the J/E translations for all the E/J
                settings.problems.forEach(function (problem) {

                    var english = problem[0];
                    var japanese = problem[1];

                    translationFor[english] = japanese;
                    translationFor[japanese] = english;

                    remainingWords.push(english);
                });


                // determing whether the problem is True-False by looking at 
                // 1)  settings.misc.trueFalse, or
                // 2)  whether the only options are "true / false"
                var isTrueFalse = (function () {


                    // returning true if settings.misc.trueFalse is true, regardless
                    if (settings.misc.trueFalse) {
                        return true;
                    }


                    // returning true if ALL sentakushi are either "true" or "false"
                    var allSentakushiTF = settings.problems.every(function (problem) {
                        return (problem[1] === "true" || problem[1] === "false");
                    });
                    if (allSentakushiTF) {
                        return true;
                    }


                    // default returning false
                    return false;
                }());


                // setting the number of sentakushi AFTER we've done the isTrueFalse thing
                numberOfSentakushi = getNumberOfSentakushi();


                function pickRandomProblem() {


                    // choosing a random element from the remainingProblemsArray
                    currentProblem = tools.pickOneFrom(remainingProblemsArray);
                    var question = currentProblem[0];
                    var correctAnswer = currentProblem[1];
                    var indexOfCorrectAnswer = null;


                    // the choices - shuffled, with extra wrong choices removed if numberOfSentakushi is less than the actual number of choices
                    var choices = (function () {


                        // if it's a true-false kinda thing, then arranging the choices for that purpose
                        if (isTrueFalse) {


                            // setting correctAnswer to 0 if True (or equivalent), or 1 if False
                            indexOfCorrectAnswer = (correctAnswer === "true") ? 0 : 1;


                            // using the terms specified in the problem (e.g. "yes"/"no")
                            // or 正しい and 正しくない as fallbacks
                            if (settings.misc.terms && settings.misc.terms.length === 2) {
                                return [settings.misc.terms[0], settings.misc.terms[1]]; // unshuffled!
                            }


                            // returning default choices, if we've got this far
                            return ["正しい", "正しくない"]; // unshuffled!
                        }


                        // selecting choices from OTHER problems if the problem has only one sentakushi, 
                        // or if "globalSentakushi" is set
                        if (settings.problems[0].length === 2 || settings.misc.globalSentakushi) {


                            // the array that will be returned
                            var array = [];


                            // getting choices from all OTHER problems
                            var allOtherProblems = allProblemsArray.concat();


                            // removing the current problem from the array of choices
                            allOtherProblems.splice(allOtherProblems.indexOf(currentProblem), 1);


                            // adding the [1] element (i.e. the choices) of each problem to the arry
                            allOtherProblems.forEach(function (thisProblem) {
                                array.push(thisProblem[1]);
                            });


                            // shuffling the array, and choosing however many sentakushi we're supposed to use
                            array = tools.shuffle(array).slice(0, numberOfSentakushi - 1);


                            // adding the correctAnswer...
                            array.push(correctAnswer);


                            // ... and reshuffling
                            array = tools.shuffle(array);


                            // not forgetting to record which answer is the right one
                            indexOfCorrectAnswer = array.indexOf(correctAnswer);


                            // returning the array of shuffled sentakushi
                            return array;
                        }


                        /*
                         * 
                         *  Beyond this point, choices come from 
                         *  the current problem!
                         *  
                         */


                        // removing some of the DUMMY choices at random, if numberOfSentakushi is less than the number of choices
                        while (currentProblem.length > numberOfSentakushi + 1) {
                            var rand = tools.pickIntFrom(currentProblem.length - 2);
                            currentProblem.splice(rand + 2, 1);
                        }


                        // array is a copy of currentProblem, minus the first element, which is the question itself (not one of the choices)
                        var array = tools.shuffle(currentProblem.slice(1)); // .slice(1) makes a copy of the array from the [1] element and on


                        // setting the index of the correct answer
                        indexOfCorrectAnswer = array.indexOf(currentProblem[1]) + 1;


                        // returning the array of choices
                        return array;
                    }());


                    return {
                        question: question,
                        correctAnswer: correctAnswer,
                        choices: choices, // includes the correct answer
                        indexOfCorrectAnswer: indexOfCorrectAnswer,
                        numberOfSentakushi: numberOfSentakushi
                    };
                }


                function getNumberOfSentakushi() {


                    // limiting numberOfSentakushi to 2 if we're in true-false mode
                    if (isTrueFalse) {
                        return 2;
                    }


                    // returning the inputs.number_sentakushi, if specified
                    // NOTE that number_sentakushi is only valid when 2 or greater
                    if (settings.numberSentakushi && settings.numberSentakushi >= 2) {
                        return settings.numberSentakushi;
                    }


                    return 3;
                }


                function removeCurrentProblem() {


                    var indexToErase = remainingProblemsArray.indexOf(currentProblem);
                    remainingProblemsArray.splice(indexToErase, 1);


                    // NEW TEST replenishing the array, if specified
                    if (settings.recycleProblems) {
                        if (remainingProblemsArray.length === 0) {
                            remainingProblemsArray = allProblemsArray.concat();
                        }
                    }
                }


                var isSentences = (function () {

                    var numberWithSpaces = 0;

                    settings.problems.forEach(function (problem) {
                        var english = problem[0];
                        if (english.indexOf(" ") !== -1) {
                            numberWithSpaces += 1;
                        }
                    });

                    // returning true or false, based on number of spaces
                    return numberWithSpaces > (settings.problems.length / 2);
                }());


                // properties & methods of 'sentenceList'
                return {
                    isSentences: isSentences,
                    pickRandomProblem: pickRandomProblem,
                    removeCurrentProblem: removeCurrentProblem,
                    getNumberRemaining: function () {
                        return remainingProblemsArray.length;
                    },
                    numberOfProblems: allProblemsArray.length,
                    isTrueFalse: function () {
                        return isTrueFalse;
                    },
                    getTranslationFor: function (word) {
                        return translationFor[word];
                    },
                    getEnglishFor: function (word) {
                        return translationFor[word];
                    },
                    getJapaneseFor: function (word) {
                        return translationFor[word];
                    },
                    getTargetEnglish: function () {
                        return currentProblem[0];
                    },
                    getTargetJapanese: function () {
                        return currentProblem[1];
                    },
                    getRemainingWords: function () {
                        return remainingWords;
                    }
                };
            };

        }
);
