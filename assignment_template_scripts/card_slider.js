

define(
        [
            "jquery",
            "tools",
            "helpers/wordPool",
            "helpers/shakeElement",
//            "helpers/fixedProblemHolder",
            "helpers/SoundEffects",
            "Konva",
            "jqueryui"
        ],
        function ($, tools, myWordPool, shakeElement, SoundEffects, Konva) { //, fixedProblemHolder


            $(function () {


                tools.fixedProblemHolder({
                    onSlideUp: function() {
                        $("#directions").hide();
                    },
                    onSlideDown: function() {
                        $("#directions").show();
                    }
                });


                var soundEffects = new SoundEffects({
                    container: $("#sound-effects-checkbox-stuff"),
                    playThisOnCheckboxCheck: "tick",
                    sounds: {
                        tick: "/sounds/card_slider/tick.mp3",
                        wrongSound: "/sounds/card_slider/wrongSound.mp3",
                        stack: "/sounds/card_slider/stack.mp3",
                        disappear: "/sounds/card_slider/disappear.mp3"
                    }
                });


                var hasFinished = false;
                var mistakenVocabList = {};
                var wordPool;
                var numCardsPerProblem;
                var cardDropMainTopBottomBuffer = 60;
                var score = tools.score();
                score.total_number_pairs = 0;
                score.total_number_guesses = 0;
                score.number_mistakes = 0;
                score.number_answered = 0;


                var clock = tools.clock({
                    container: $("#clock-holder"),
                    pauseStart: true
                });


                tools.setMobileScreenWidth(320);


                var scoreBar = (function () {

                    return {
                        increment: function () {


                            // converting score to percent
                            var newWidth = (score.number_answered / score.total_number_pairs) * 100;


                            // animating the scoreBar
                            $("#score-bar-line").animate({width: newWidth + "%"}, 100);


                            // also showing the current score at the bottom
                            $("#score-holder").text(score.number_answered + " / " + score.total_number_pairs);
                        }
                    };
                }());


                // enabling sounds by default on desktop
                if (!tools.isMobile()) {
                    $("#sounds-checkbox").prop("checked", true);
                }


                var background = (function () {

                    var backgrounds = [
                        "radial-gradient(#fff 0%, #fff 50%, #eef 100%)",
                        "radial-gradient(#fff 0%, #fff 50%, #eff 100%)",
                        "radial-gradient(#fff 0%, #fff 50%, #ffe 100%)",
                        "radial-gradient(#fff 0%, #fff 50%, #fef 100%)"
                    ];

                    var currentPattern = 0;

                    return {
                        rotate: function () {
                            $("#cardDropFrame").css({background: backgrounds[currentPattern]});
                            currentPattern += 1;
                            if (currentPattern >= backgrounds.length) {
                                currentPattern = 0;
                            }
                        }
                    };
                }());


                // retrieving the data, setting semi-globals, and building the first problem
                tools.getProblemData(function (returnedData) {
                    wordPool = myWordPool({
                        baseArray: returnedData.problem,
                        shuffle: false
                    });
                    numCardsPerProblem = returnedData.number_sentakushi || 5;
                    score.total_number_pairs = (returnedData.number_problems || 4) * numCardsPerProblem || 20;
                    $("#cardDropFrame").fadeTo("fast", 1);
                    newProblem();
                });


                function newProblem() {


                    background.rotate();


                    var pairs = wordPool.getArrayOf(numCardsPerProblem);
                    var japaneseCards = [];
                    var englishCards = [];
                    var timer = 100;


                    $("#cards-holder").empty();


                    pairs.forEach(function (pair, index) {


                        // getting the English and Japanese words from the returned pair
                        var englishWord = pair[0];
                        var japaneseWord = pair[1];


                        // building the spans to hold the words (spans are then inserted into divs)
                        var $japSpan = $("<span class='word-holder'/>").text(japaneseWord);
                        var $engSpan = $("<span class='word-holder'/>").text(englishWord);


                        var $japCard = $("<div class='japanese card'/>").append($japSpan).data({
                            answer: index,
                            english: englishWord,
                            japanese: japaneseWord,
                            language: "japanese"
                        });


                        var $engCard = $("<div class='english card'/>").append($engSpan).data({
                            answer: index,
                            english: englishWord,
                            japanese: japaneseWord,
                            language: "english"
                        });


                        var $dragThing = $("<span class='drag-thing glyphicon glyphicon-align-justify' />");
                        $japCard.append($dragThing.clone());
                        $engCard.append($dragThing.clone());


                        // adding the cards to the arrays
                        japaneseCards.push($japCard);
                        englishCards.push($engCard);
                    });


                    // shuffling the cards, which have now been built but not yet appended to the DOM
                    japaneseCards = tools.shuffle(japaneseCards);
                    englishCards = tools.shuffle(englishCards);


                    // appending the divs to the #cards-holder
                    japaneseCards.forEach(function ($card) {
                        $("#cards-holder").append($card);
                    });


                    // *PREPENDING* the English cards, so they go on top!
                    englishCards.forEach(function ($card) {
                        $("#cards-holder").prepend($card);
                    });


                    // setting the width to that of the widest element
                    var maxSpanWidth = (function () {
                        var width = 0;
                        $(".card").find("span").each(function () {
                            var thisSpanWidth = parseInt($(this).css("width"));
                            width = Math.max(width, thisSpanWidth);
                        });
                        return width;
                    }());


                    // adjusting the screen width if we're on desktop
                    if (!tools.isMobile()) {

                        var width = (function () {
                            var calculatedWidth = maxSpanWidth * 2 + 20;
                            return Math.max(calculatedWidth, 320);
                        }());

                        $("#cardDropFrame").css({width: width});
                    }


                    // fading in the cards
                    for (var i = 0; i < (numCardsPerProblem * 2); i++) {
                        fadeInCard(i);
                        function fadeInCard(i) {
                            setTimeout(function () {

                                // fading in English from LAST to FIRST (so the bottom ones get animated first)
//                                $(".english").eq(numCardsPerProblem - i - 1).addClass("visible");
//
//                                // fading in the Japanese from FIRST to LAST (so the top ones get animated first)
//                                $(".japanese").eq(i).addClass("visible");


                                // NEW TEST dropping ALL blocks to the bottom
                                $(".card").eq((numCardsPerProblem * 2) - i - 1).addClass("visible");


                                setTimeout(function () {
                                    soundEffects.play("stack");
                                }, 1000);
//                            }, timer * (numCardsPerProblem * 2 - i));
                            }, timer * i);
                        }
                    }


                    // setting the height of the #cardDropMain
                    $("#cardDropMain").css({
                        height: $("#cards-holder").height() + cardDropMainTopBottomBuffer,
                        position: "relative"
                    });


                    // wiring up draggability
                    $(".card").draggable({
                        revert: true,
                        revertDuration: 100,
                        axis: "y",
                        stack: ".card",
                        containment: "parent",
//                        grid: [0, parseInt($(".card").css("height"))],
//                        snap: true,
                        start: function () {
                            $("body").addClass("now-dragging");
                            clock.start();
                        },
                        stop: function () {
                            $("body").removeClass("now-dragging");
                        }
                    });


                    $(".card").droppable({
                        accept: $(".card"),
                        hoverClass: "now-droppable",
                        over: function () {
                            soundEffects.play("tick");
                        },
                        drop: function (event, ui) {

                            var $dragged = $(ui.draggable);
                            var $droppedOn = $(this);

                            checkAnswer($dragged, $droppedOn);
                        }
                    });
                }


                function checkAnswer($dragged, $droppedOn) {


                    // exiting here if the cards are of the same language
                    if ($dragged.data("language") === $droppedOn.data("language")) {
                        return;
                    }


                    var card1Answer = $dragged.data("answer");  // "answer" is a NUMBER
                    var card2Answer = $droppedOn.data("answer");


                    score.total_number_guesses += 1;


                    // if they're matching cards
                    if (card1Answer === card2Answer) {


                        // incrementing the score
                        score.number_answered++;


                        // incrementing the scoreBar
                        scoreBar.increment();


                        // stopping the cards from trying to spring back while they're being deleted
                        $dragged.draggable("option", "revert", false);
                        $droppedOn.draggable("option", "revert", false);


                        // adding classes to fade maintain the spans' "translateX", and to "scale" them out
                        $dragged.addClass("draggedSlideOff").addClass("left");
                        $droppedOn.addClass("draggedSlideOff").addClass("right");


                        soundEffects.play("disappear");


                        // gracefully erasing the cards
                        [$dragged, $droppedOn].forEach(function ($thisWord) {


                            // sliding up the word and removing it
                            $thisWord.delay(100).slideUp(200, function () { // delaying slightly to give time for the spans to shrink away


                                // removing the word after it's slid up
                                $thisWord.remove();


                                // moving on to the next problem if there are no more .cards left
                                if ($(".card").length <= 0) {


                                    // moving on to endSequence
                                    if (score.number_answered >= score.total_number_pairs && !hasFinished) {
                                        hasFinished = true;
                                        endSequence();
                                    } else {
                                        newProblem();
                                    }
                                }
                            });
                        });
                    } else {


                        score.number_mistakes += 1;


                        // adding the MISTAKEN pair
                        var englishWord1 = $dragged.data("english");
                        var japaneseWord1 = $dragged.data("japanese");
                        var englishWord2 = $droppedOn.data("english");
                        var japaneseWord2 = $droppedOn.data("japanese");



                        // adding the eng/jap pair that the use clicked
                        mistakenVocabList[englishWord1] = japaneseWord1;
                        mistakenVocabList[englishWord2] = japaneseWord2;


                        soundEffects.play("wrongSound");


                        shakeElement($("#cards-holder"), {
                            amplitude: 4,
                            period: 50
                        });
                    }
                }


                function endSequence() {


                    // sending off the results
                    var results = {
                        time_taken: score.time_taken,
                        number_problems: score.total_number_pairs,
                        number_mistakes: score.number_mistakes,
                        mistaken_vocab: {
                            words: mistakenVocabList
                        }
                    };


                    // adding the 'endScreenHolder' div after a momentary pause
                    // sending the results object, and also a reference to the function to call when returned from the
                    tools.send_results(results, backFromSendResults);
                    function backFromSendResults() {


                        // adding the 'assignment_results' div after a slight pause
                        setTimeout(function () {


                            var data = {
                                時間: score.time_taken + " 秒",
                                問題数: results.number_problems + " 組",
                                間違い: score.number_mistakes
                            };


                            // NEW TEST adding the 'wordsToReview' to the data object, if present
                            var wordsToReview = tools.showMistakenVocab(results.mistaken_vocab.words);
                            if (wordsToReview) {
                                data["復習しよう！"] = wordsToReview;
                            }


                            // passing in the object to put the assignment_results stuff into, and the data to display
                            tools.showAssignmentResults({
                                container: $("#mainProblemsHolder"),
                                data: data
                            });
                        }, 1000);
                    }

                    return true;

                }

            });
            // end main jQuery closure

        }
);
