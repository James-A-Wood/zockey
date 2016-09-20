"use strict";


define(
        [
            "jquery",
            "tools"
        ],
        function ($, tools) {


            return function (serverData, params) {


                // checking for data back from the server
                if (!serverData) {
                    if (!serverData.problem && !serverData.problems) {
                        console.log("parameter object didn't had no problem property!");
                        return false;
                    }
                }


                // checking that the SECOND parameter, if present, is an object
                if (params && (typeof params !== "object")) {
                    console.log("The second parameter, if present, must be an OBJECT!");
                    return false;
                }


                // replacing '.problems' with '.problem'
                if (!serverData.problem && serverData.problems) {
                    serverData.problem = serverData.problems;
                }


                var settings = $.extend({
                    recycleProblems: false // not recycling problems, by default
                }, params || {});


                // converting to an array, if it's not an array already
                serverData.problem = tools.objectToArray(serverData.problem);


                // removing extra problems, if specified
                if (serverData.number_problems) {
                    serverData.problem = tools.whittleDownArray(serverData.problem, serverData.number_problems);
                }


                // determing whether the problem is True-False by looking at the types of choices, or by 
                // looking at serverData.misc.trueFalse
                var isTrueFalse = (function () {


                    // returning true if serverData.misc.trueFalse is true, regardless
                    if (serverData.misc.trueFalse) {
                        return true;
                    }


                    // returning false if there are more than one sentakushi
                    var moreThanOneSentakushi = serverData.problem.every(function (problem) {
                        return problem.length > 2;
                    });
                    if (moreThanOneSentakushi) {
                        return false;
                    }


                    // returning true if all sentakushi are either "true" or "false"
                    var allSentakushiTF = serverData.problem.every(function (problem) {
                        return (problem[1] === "true" || problem[1] === "false");
                    });
                    if (allSentakushiTF) {
                        return true;
                    }


                    // default returning false
                    return false;
                }());


                // local variables
                var currentProblemInfo = {}; // the thing returned to the main program
                var allProblemsArray = []; // holds all the problems in array form, never whittled down
                var remainingGroupsArray = []; // starts out as allProblemsArray, but is whittled down
                var currentProblem = []; // the current problem, in straight array form
                var numberOfSentakushi = getNumberOfSentakushi();


                // copying all the problems into the allProblemsArray array
                // this doesn't get whittled down!
                allProblemsArray = serverData.problem.slice();


                // remaining problems (this gets whittled down)
                remainingGroupsArray = allProblemsArray.concat();


                function pickRandomProblem() {


                    // saving the PREVIOUS problem, if there is one
                    var previousAudioFileName = currentProblemInfo ? currentProblemInfo.audioFileName : null;


                    // choosing a random element from the remainingGroupsArray
                    var thisGroup = tools.pickOneFrom(remainingGroupsArray);
                    currentProblem = thisGroup;
                    var question = thisGroup[0];
                    var correctAnswer = thisGroup[1];

                    var indexOfCorrectAnswer = null;


                    // the choices - shuffled, with extra wrong choices removed if numberOfSentakushi is less than the actual number of choices
                    var choices = (function () {


                        // if it's a true-false kinda thing, then arranging the choices for that purpose
                        if (isTrueFalse) {


                            // setting correctAnswer to 1 if True (or equivalent), or 2 if False
                            indexOfCorrectAnswer = (correctAnswer === "true") ? 1 : 2;


                            // using the terms specified in the problem (e.g. "yes"/"no")
                            // or 正しい and 正しくない as fallbacks
                            if (serverData.misc.terms && serverData.misc.terms.length === 2) {
                                return [serverData.misc.terms[0], serverData.misc.terms[1]]; // unshuffled!
                            }


                            // returning default choices, if we've got this far
                            return ["正しい", "正しくない"]; // unshuffled!
                        }


                        // choosing choices from OTHER problems if the problem has only one sentakushi, 
                        // or, alternately, if "globalSentakushi" is set
                        if (serverData.problem[0].length === 2 || serverData.misc.globalSentakushi) {


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


                            // ... and shuffling
                            array = tools.shuffle(array);


                            // not forgetting to record which answer is the right one
                            indexOfCorrectAnswer = array.indexOf(correctAnswer) + 1;


                            // returning the array of shuffled sentakushi
                            return array;
                        }


                        /*
                         * 
                         *      Beyond this point, it's not True-False, and choices are included in the current problem
                         *  
                         */


                        // removing some of the DUMMY choices at random, if numberOfSentakushi is less than the number of choices
                        while (thisGroup.length - 1 > numberOfSentakushi) {


                            // picking a random number from 1 (not 0!) to the end of the choices
                            var rand = 2 + tools.pickIntFrom(thisGroup.length - 2);
                            thisGroup.splice(rand, 1);
                        }


                        // array is a copy of thisGroup, minus the first element, which is the problem (not one of the choices)
                        var array = tools.shuffle(thisGroup.slice(1)); // .slice(1) makes a copy of the array from the [1] element and on


                        // setting the index of the correct answer
                        indexOfCorrectAnswer = array.indexOf(thisGroup[1]) + 1;


                        // returning the array of choices
                        return array;
                    }());


                    // saving the currentProblemInfo in a local variable
                    currentProblemInfo = {
                        question: question,
                        correctAnswer: correctAnswer,
                        choices: choices, // includes the correct answer
                        indexOfCorrectAnswer: indexOfCorrectAnswer,
                        numberOfSentakushi: numberOfSentakushi,
                        audioFileName: allProblemsArray.indexOf(thisGroup) + 1,
                        previousAudioFileName: previousAudioFileName
                    };


                    return currentProblemInfo;
                }


                function getNumberOfSentakushi() {


                    // limiting numberOfSentakushi to 2 if we're in true-false mode
                    if (isTrueFalse) {
                        return 2;
                    }


                    // returning the serverData.number_sentakushi, if specified
                    if (serverData.number_sentakushi && serverData.number_sentakushi >= 2) {  // number_sentakushi only valid when 2 or greater
                        return serverData.number_sentakushi;
                    }


                    // returning 3 by default if each problem (well, the first) has only one sentakushi
                    // --> In this case, 'cause there's only one sentakushi, we're ASSUMING globalSentakushi even thought it's not specified
//                    if (serverData.problem[0].length === 2 && !serverData.misc.globalSentakushi) {
//                        return 3;
//                    }

                    var allProblemsHaveOneSentakushi = serverData.problem.every(function (item) {
                        return item.length === 2;
                    });


                    if (allProblemsHaveOneSentakushi && !serverData.misc.globalSentakushi) {
                        return 3;
                    }



                    /*
                     * 
                     *      Beyond this point, each problem has 2+ sentakushi, and "globalSentakushi" is not set
                     * 
                     */


                    // forcing the number of sentakushi, if we're choosing choices from all the problems
                    if (serverData.misc.globalSentakushi) {


                        // warning to specify a number_sentakushi when using globalSentakushi
                        if (!serverData.number_sentakushi) {
                            console.log("When using globalSentakushi, you MUST specify number_sentakushi!");
                            return false;
                        }


                        return serverData.number_sentakushi;
                    }


                    // accounting for different syntaxes; default is 2
                    var numberOfSentakushi = serverData.number_sentakushi || 2;


                    // calculating how many sentakushi are actually present in the JSON, which may be different from how many are specified
                    var numberSentakushiInJSON = serverData.problem[0].length - 1;


                    // returning whichever is SMALLER, numberSentakushiInJSON or numberOfSentakushi
                    return Math.min(numberSentakushiInJSON, numberOfSentakushi);
                }


                function removeCurrentProblem() {


                    var indexToErase = remainingGroupsArray.indexOf(currentProblem);
                    remainingGroupsArray.splice(indexToErase, 1);


                    // NEW TEST replenishing the array, if specified
                    if (settings.recycleProblems) {
                        if (remainingGroupsArray.length === 0) {
                            remainingGroupsArray = allProblemsArray.concat();
                        }
                    }
                }


                // properties & methods of 'sentenceList'
                return {
                    pickRandomProblem: pickRandomProblem,
                    removeCurrentProblem: removeCurrentProblem,
                    getNumberRemaining: function () {
                        return remainingGroupsArray.length;
                    },
                    numberOfProblems: allProblemsArray.length,
                    isTrueFalse: function () {
                        return isTrueFalse;
                    }
                };
            };

        }
);
