

define(
        [
            "jquery",
            "tools",
            "helpers/shakeElement",
            "helpers/AudioLoader",
            "helpers/fixedProblemHolder",
            "howler",
            "jqueryui",
            "bootstrap"
        ],
        function ($, tools, shake, myAudio) {


            // keeping screen at least 320px wide, for mobile
            tools.setMobileScreenWidth(320);


            // various variables
            var myJSON;
            var allProblemsArray = [];
            var allWordsArray = [];
            var remainingProblemsArray = [];
            var remainingWordsArray = [];
            var draggedObjectX;
            var draggedObjectY;
            var currentProblemIndex = 0;
            var theCurrentProblem;
            var nextButtonSetTimeout;
            var indexOfJapanese = 1; // default, index of the Japanese problem (if displayed)
            var useAudio;
            var showJapanese = true;
            var isBetweenProblems = true;
            var audio; // will hold a reference to the AudioLoader
            var $startButton = $("#start-button");
            var $playButton = $("#play-button");
            var $narabekaeMain = $("#narabekaeMain");
            var $dragMessage = $("#dragMessage.my-template").detach().removeClass("my-template");
            var score = tools.score();


            var scoreBar = tools.scoreBar({
                animationDuration: 400
            });


            var clock = tools.clock({
                container: $("#clock-holder"),
                pauseStart: true
            });


            var correctSound = new Howl({
                urls: ["/sounds/narabekae/correctSound.mp3"]
            });


            var wrongSound = new Howl({
                urls: ["/sounds/narabekae/wrongSound.mp3"]
            });


            var problemFinishSound = new Howl({
                urls: ["/sounds/narabekae/problemFinish.mp3"]
            });


            // enabling sounds on dekstop
            if (!tools.isMobile()) {
                $("#sounds-checkbox").prop("checked", true);
            }


            // playing a "sample" sound when checking the checkbox
            $("#sounds-checkbox").on("click", function () {
                if ($(this).is(":checked")) {
                    correctSound.play();
                }
            });


            // setting width of dragTarget -- have to set it to WAY OVER for layout reasons
            $("#dragTarget").css({width: "1000px", opacity: 1});


            tools.getProblemData(function (data) {


                // saving the returned data in myJSON so we can use it globally
                myJSON = data;


                // setting whether to play the English audio or not
                useAudio = (function () {


                    // using "misc.useAudio", if specified
                    if (myJSON.misc && myJSON.misc.hasOwnProperty("useAudio")) {
                        return myJSON.misc.useAudio;
                    }


                    // returning FALSE if THE FIRST PROBLEM has at least three elements,
                    // meaning there's (probably?) a Japanese one at index [1]
                    if (myJSON.problem[0].filter(function (element) {
                        return element.length > 0;
                    }).length >= 3) {
                        return false;
                    }


                    // default == true
                    return true;
                }());


                // loading the audio, if we're using it
                if (!useAudio) {
                    $playButton.remove();
                    setTimeout(function () {
                        $startButton.removeClass("hidden");
                    }, 500);
                    audio = null;
                } else {
                    audio = myAudio({
                        audioFiles: data.audioFiles, // required
                        wordsList: (function () { // required, an ARRAY of english words/sentences
                            var array = [];
                            data.problem.forEach(function (theCurrentProblem) {
                                var englishSentence = theCurrentProblem[0];
                                array.push(englishSentence);
                            });
                            return array; // an array of all the ENGLISH words/sentences
                        }()),
                        playButton: "play-button",
                        playButtonClassOnPlay: "now-playing",
                        playButtonClassOnPause: "", // erasing defaults
                        getWordToPlay: function () {
                            return wordsList;
                        },
                        onAllLoaded: function () {
                            setTimeout(function () {
                                $startButton.removeClass("hidden");
                            }, 500);
                        },
                        onLoadError: function () {
                            alert("音声ファイルをロードするのに失敗しました！");
                        }
                    });
                }


                // determining whether ANY of the problems are Japanese,
                // and removing the $("#japaneseHolder") if not
                var noneAreJapanese = myJSON.problem.every(function (set) {
                    return set.every(function (problem) {
                        return tools.languageOf(problem) === "English";
                    });
                });
                if (noneAreJapanese) {
                    $("#japaneseHolder").remove();
                }


                // whittling down the number of problems, if the database says to use fewer problems than there really are
                if (myJSON.number_problems) {
                    tools.whittleDownArray(myJSON.problem, myJSON.number_problems);
                }


                // copying all sentences into the allProblemsArray, and adding scoreBlocks
                allProblemsArray = myJSON.problem.concat();


                // setting the number of problems in the scoreBar
                scoreBar.setNumberProblems(myJSON.problem.length);


                // creating the remainingProblemsArray (identical to the allProblemsArray, to be spliced down)
                remainingProblemsArray = allProblemsArray.concat();


                //moving on to the next problem
                setNextProblemAndAudio();


                // FINALLY fading in the #mainProblemsHolder
                $("#mainProblemsHolder").fadeTo(200, 1);
            });


            function setNextProblemAndAudio() {


                // choosing random problem from the remainingProblems array
                currentProblemIndex = tools.pickIntFrom(remainingProblemsArray);
                theCurrentProblem = remainingProblemsArray[currentProblemIndex];


                // exiting here if we're not using the audio
                $startButton.click(nextProblem);
            }


            function nextProblem() {


                // disabling touch sensitivity on the choicesHolder
                tools.numbToTouch($("#choicesHolder"));


                // marking this so we can't play audio between problems
                isBetweenProblems = false;


                // auto-playing the problem once, after a slight delay
                setTimeout(function () {
                    $playButton.click();
                }, 500);


                // resetting stuff
                $("#words-holder").empty().append($dragMessage.clone());
                $("#dragTarget").removeClass("finished");
                $("#japaneseHolder").removeClass("answered").empty();
                $("#next-button").remove();
                clearTimeout(nextButtonSetTimeout);
                $startButton.remove();


                // NECESSARY to trigger page redraw, in order to repeat the animation.  
                $("#choicesHolder").width($("#choicesHolder").width);


                // starting the digital and countdown clocks (if not started already)
                clock.start();


                // question assumed to be the last element
                var question = theCurrentProblem[theCurrentProblem.length - 1];


                // setting showJapanese to whatever
                if (myJSON.misc.hasOwnProperty("showJapanese")) {
                    showJapanese = myJSON.misc.showJapanese;
                }


                // getting the Japanese meaning, if any
                var japanese = (function () {


                    // adjusting the index where we expect the
                    // Japanese to be, index [1] by default
                    if (myJSON.misc && myJSON.misc.hasOwnProperty("indexOfJapanese")) {
                        indexOfJapanese = myJSON.misc.indexOfJapanese;
                    }


                    // if the problem exists, and it's really Japanese...
                    var language = tools.languageOf(theCurrentProblem[indexOfJapanese]);
                    if (theCurrentProblem[indexOfJapanese] && language === "Japanese") {
                        return theCurrentProblem[indexOfJapanese];
                    }


                    // BEYOND THIS POINT there is no Japanese, so removing
                    $("#japaneseHolder").remove();
                    return null;
                }());


                // showing the Japanese text, optionally
                if (japanese && showJapanese) {
                    $("#japaneseHolder").text("\"" + japanese + "\"");
                }


                var twoArraysArray = question.split("¥");


                twoArraysArray[0] = twoArraysArray[0].trim().split(" ");
                twoArraysArray[1] = (function () {
                    if (twoArraysArray[1]) {
                        return twoArraysArray[1].trim().split(" ");
                    } else {
                        return [];
                    }
                }());


                remainingWordsArray = twoArraysArray[0]; // removing any white space around the ¥ sign
                allWordsArray = remainingWordsArray.concat(twoArraysArray[1]);


                var randomWordsArray = allWordsArray.concat();


                $("#choicesHolder").empty();


                // placing all the words in the floatingDivs
                while (randomWordsArray.length > 0) {


                    // adding a slight rotation to the word
                    var randRotation = 8 - tools.pickIntFrom(15);


                    // removing a random word from the array, and memoving underscores
                    var word = tools.pickOneFrom(randomWordsArray, true).replace(/_/g, " ");


                    // Adding the word, without underscores, to the floatingWord div
                    var $floatingWord = $("<span class='floatingWord' />").css({
                        "-webkit-transform": "rotate(" + randRotation + "deg)",
                        "-ms-transform": "rotate(" + randRotation + "deg)",
                        "transform": "rotate(" + randRotation + "deg)"
                    }).text(word).appendTo("#choicesHolder");


                    // NEW TEST randomly fading these guys in
                    dropObject($floatingWord);
                }


                function dropObject($word) {
                    setTimeout(function () {
                        var height = $word.outerHeight(true);
                        var randomHeightOffset = 5 - (Math.random() * 10);
                        $word.css({top: -height * 3});
                        $word.animate({
                            top: randomHeightOffset,
                            opacity: 1
                        }, 1000, "easeOutBounce");
                    }, 500 + Math.random() * 500);
                }


                // hovering over floating word turns cursor into grabby hand thing
                $(".floatingWord").on("mouseover", function () {
                    $(this).addClass("word-hovered");
                }).on("mouseout", function () {
                    $(this).removeClass("word-hovered");
                });


                // fading in the floating words, and sliding them down slightly
                $(".floatingWord")
                        .draggable({
                            containment: $narabekaeMain, //was window
                            stack: ".floatingWord" // keeps the z-index so the dragged word is always on top
                        })
                        .on("mousedown", function () {


                            // saving the starting css top & left positions
                            draggedObjectX = $(this).css("left");
                            draggedObjectY = $(this).css("top");


                            // forcing those values to be in pixels if they're 'auto' (which they are, by default, on first drag)
                            if (draggedObjectX === "auto") {
                                draggedObjectX = "0px";
                            }
                            if (draggedObjectY === "auto") {
                                draggedObjectY = "0px";
                            }
                        });


                // removing any box shadow if we're on mobile
                if (tools.isMobile()) {
                    $(".floatingWord").css({boxShadow: "none"});
                }


                // making the dragTarget droppable - specifying what can be dropped, etc.
                $("#dragTarget").droppable({
                    accept: ".floatingWord",
                    tolerance: "touch",
                    drop: checkAnswer
                });


                function checkAnswer(event, droppedWord) {


                    // removing the dragMessage
                    $("#dragMessage").remove();


                    // being' anal
                    var $draggedWord = $(droppedWord.draggable);
                    var draggedText = $draggedWord.text();
                    var correctText = remainingWordsArray[0];


                    // handling any underscores
                    draggedText = draggedText.replace(/\_/g, " ");
                    correctText = correctText.replace(/\_/g, " ");


                    // comparing dropped word with the next word in the array
                    if (draggedText === correctText) {


                        // changing the text from gray to blue
                        $("#dragTarget").addClass("notFinished");


                        // removing any underscores - this is getting real old real fast
                        remainingWordsArray[0] = remainingWordsArray[0].replace(/\_/g, " ");


                        // removing any ten-ten-tens ...
                        var text = $("#words-holder").text().replace("...", "");
                        $("#words-holder").text(text);


                        // adding the word, and trailing space, to the line
                        $("#words-holder").append("<span class='answered-word-holder'>" + remainingWordsArray[0] + "</span> ");


                        // hiding the dropped word (if correct)
                        $(droppedWord.draggable).css({visibility: "hidden"});


                        // splicing the word from the array
                        remainingWordsArray.splice(0, 1);


                        // playing the correctSound (or, if all done, the problemFinish sound)
                        if (remainingWordsArray.length > 0) {


                            // playing the sound
                            if ($("#sounds-checkbox").is(":checked")) {
                                correctSound.play();
                            }


                            // adding an elipsis to the #words-holder
                            $("#words-holder").append(" ... ");

                            return;
                        }



                        /*  Beyond this point there are no words left!  */


                        isBetweenProblems = true;


                        // playing the sound, if enabled
                        if ($("#sounds-checkbox").is(":checked")) {
                            problemFinishSound.play();
                        }


                        // removing the current problem from the remainingProblemsArray
                        remainingProblemsArray.splice(currentProblemIndex, 1);


                        // removing any remaining floatingWords
                        $(".floatingWord").remove();


                        // styling the japaneseHolder, if it exists
                        $("#japaneseHolder").addClass("answered");


                        // incrementing the scoreBar
                        scoreBar.increment();


                        // if it's NOT the last problem
                        if (remainingProblemsArray.length > 0) {


                            // emptying the choicesHolder
                            $("#choicesHolder").empty();


                            $("#dragTarget").addClass("finished");


                            // after a pause, adding the next-button and wiring it up to mimic the audio play-button
                            nextButtonSetTimeout = setTimeout(function () {


                                // adding the next-button arrow thing, slid in using CSS3!
                                $("#choicesHolder").append("<span id='next-button' class='arrow-button'>Next</span>");


                                // wiring up the checkmark to act like the next button
                                $("#next-button").on("click touchend", function () {
                                    nextProblem();
                                });
                            }, 100);


                            setNextProblemAndAudio();


                            return;
                        }



                        // if all problems have been done...
                        var results = {
                            time_taken: score.time_taken,
                            number_problems: myJSON.problem.length,
                            number_mistakes: score.number_mistakes
                        };


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
                    } else {


                        // incrementing the score
                        score.number_mistakes += 1;


                        // shaking the whole thing in frustration
                        shake($narabekaeMain);


                        // spring back if it's the wrong word
                        $(droppedWord.draggable).animate({
                            top: draggedObjectY,
                            left: draggedObjectX
                        });


                        // playing the wrong sound, if enabled
                        if ($("#sounds-checkbox").is(":checked")) {
                            wrongSound.play();
                        }
                    }
                }
            }


            // wiring up the dragTarget
            $("#dragTarget").click(function () {
                if ($("#next-button").length) {
                    $("#next-button").click();
                }
            });


            // wiring up the play-button
            $playButton.click(function () {
                if (!isBetweenProblems) {
                    console.log("Clicked!");
                    audio && audio.play(theCurrentProblem[0]);
                } else {
                    $("#next-button").click();
                }
            });


            // wiring up clicking #narabekaeMain to trigger start button click
            $narabekaeMain.click(function () {
                if ($startButton.length) {
                    $startButton.click();
                }
            });


            // setting the fixed problem holder
            tools.fixedProblemHolder({
                onSlideUp: function () {
                    $("#directions").hide();
                },
                onSlideDown: function () {
                    $("#directions").show();
                }
            });


            // wiring up the keyboard to trigger various button clicks
            $("html").on("keydown", function (e) {


                // Enter key triggers StartButton or NextButton
                if (e.keyCode === 13) {
                    if ($("#next-button").length || $startButton.length) {
                        e.preventDefault();
                        $("#next-button").click();
                        $startButton.click();
                    }
                }


                // SpaceBar triggers PlayButton or NextButton
                if (e.keyCode === 32) {
                    e.preventDefault();
                    if ($("#next-button").length) {
                        $("#next-button").click();
                        return;
                    }
                    $playButton && $playButton.click();
                }
            });
        });