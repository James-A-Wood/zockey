
/*
 * 
 *      Shinkei-suijaku JavaScript! 
 *      
 */




define(
        [
            "jquery",
            "helpers/tools",
            "howler"
        ],
        function ($, tools) {


            $(function () {


                var myJSON;
                var zIndex = 100;
                var score = tools.score();
                var mistakenVocabList = {};


                var flippedSound = new Howl({
                    urls: ["/sounds/shinkei/flipped.mp3"]
                });


                var matchedSound = new Howl({
                    urls: ["/sounds/shinkei/matched.mp3"]
                });


                var clickOrTouch = tools.isMobile() ? "touchend" : "click";
                var englishWords = []; // holds all the English words, in order
                var japaneseWords = []; // holds all the Japanese words, in order
                var japaneseCards = []; // will hold all the Japanese cards (the divs)
                var englishCards = []; // will hold all the English cards (the divs)


                var newCard = (function () {


                    // detaching the master from the HTML
                    var $cardMaster = $(".card.my-template").detach().removeClass("my-template");


                    return function (language, thisWord, index) {


                        // making a copy of the master...
                        var $cell = $cardMaster.clone();


                        // adding date, classes, and text to the .card-text thing inside
                        $cell.addClass(language).data({
                            language: language,
                            text: thisWord,
                            english: englishWords[index],
                            japanese: japaneseWords[index],
                            key: index
                        }).find(".card-text").text(thisWord);


                        // returning cell
                        return $cell;
                    };
                }());


                // setting mobile screens to 320px
                tools.setMobileScreenWidth(320);


                tools.getProblemData(prepareStage);
                function prepareStage(returnedData) {


                    // saving the returnedData in the global problemData variable (first time only)
                    myJSON = returnedData;


                    // preparing the words
                    myJSON.problem = tools.objectToArray(myJSON.problem);


                    // setting the number of problems
                    var numberPairs = (function () {
                        if (myJSON.number_problems) {
                            return Math.min(myJSON.number_problems, myJSON.problem.length);
                        }
                        return myJSON.problem.length;
                    }());


                    // whittling down the words list to 8 or 12 words
                    myJSON.problem = tools.whittleDownArray(myJSON.problem, numberPairs);


                    myJSON.problem.forEach(function (wordPair) {
                        englishWords.push(wordPair[0]);
                        japaneseWords.push(wordPair[1]);
                    });


                    // building the cards, and putting them in the arrays to be shuffled
                    var numberPairs = englishWords.length;


                    // building cards for each of the Japanese (and English) words and storing them in the array - still in order, at this point
                    japaneseWords.forEach(function (thisWord, index) {
                        var card = newCard("japanese", thisWord, index);
                        japaneseCards.push(card);
                    });


                    englishWords.forEach(function (thisWord, index) {
                        var card = newCard("english", thisWord, index);
                        englishCards.push(card);
                    });


                    // shuffling the cards before "dealing" them
                    japaneseCards = tools.shuffle(japaneseCards);
                    englishCards = tools.shuffle(englishCards);


                    // dealing the cards - based on the number in the japaneseCards, but dealing both English and Japanese cards
                    japaneseCards.forEach(function (card, index) {


                        // appending the card elements
                        $("#cards-frame").append(japaneseCards[index]);
                        $("#cards-frame").append(englishCards[index]);


                        // shrinking the font size, if necessary, to fit on one line
                        tools.fitOnOneLine(englishCards[index].find(".card-text"));
                        tools.fitOnOneLine(japaneseCards[index].find(".card-text"));
                    });


                    // clicking the cards-frame (or any card therein) triggers start-button click
                    $("#cards-frame").click(function () {
                        $("#cards-frame").off("click");
                        $("#start-button").click();
                    });


                    // wiring up the start button
                    $("#start-button").click(function () {


                        // removing the dealing class so the cards don't spin in again
                        $(".dealing").removeClass("dealing");


                        // disabling and hiding the Start button
                        $(this).off("click").remove();


                        // flipping all cards face down
                        var flipInterval = setInterval(function () {


                            // if there are still any unflipped cards left...
                            if ($(".card").not(".back").length > 0) {


                                // emptying the card and adding ".back"
                                $(".card").not(".back").eq(0).removeClass("front").addClass("back first-turn-down");


                                // returning here so we can repeat the loop
                                return;
                            }


                            // clearing the setInterval, 'cause all the cards are now flipped
                            clearInterval(flipInterval);


                            // removing the text in all the cards (to prevent cheating by peeking at the HTML)
                            $(".card-text").empty();


                            // unwiring the first-turn-down effect
                            $(".first-turn-down").removeClass("first-turn-down");


                            // adding this only after all cards have been turned down
                            $(".card").on(clickOrTouch, cellClickHandler);

                        }, 100);
                    });


                    function cellClickHandler() {


                        // saving allTurnedUpCards in a variable, cause we're anal
                        var thisCellsWord = $(this).data("text");
                        var allTurnedUpCards = $(".front");


                        // returning here if this card has already been turned up
                        if ($(this).hasClass("answered")) {
                            return;
                        }


                        // returning here if it's the second card, but it's the same language as the first
                        if ($(".front").length === 1) {

                            var onlyCardFaceUp = $(".front")[0];
                            var card1Language = $(onlyCardFaceUp).data("language");
                            var card2Language = $(this).data("language");

                            if (card1Language === card2Language) {
                                return;
                            }
                        }


                        // if it's the THIRD card, then removing the "front" class from the first two, and clearing their text
                        if (allTurnedUpCards.length >= 2) {
                            allTurnedUpCards.removeClass("front mismatched card-clicked")
                                    .addClass("back")
                                    .find(".card-text")
                                    .html("");
                        }


                        // showing the text in the clicked cell, and adding class "front"
                        $(this).addClass("front card-clicked")
                                .css({zIndex: zIndex++})
                                .removeClass("back")
                                .find(".card-text").text(thisCellsWord);


                        // playing the "flipped" sound
                        flippedSound.play();


                        // removing all batsu marks from all cards
                        $(".card-batsu").remove();


                        // saving the allTurnedUpCards in a variable 'cause we're anal
                        var $allTurnedUpCards = $(".front");


                        // IF and ONLY IF there are exactly two cards turned up...
                        if ($allTurnedUpCards.length === 2) {


                            // saving reference to cards
                            var card1 = $(".front")[0];
                            var card2 = $(".front")[1];


                            // retrieving the keys
                            var key1 = $(card1).data("key");
                            var key2 = $(card2).data("key");


                            // if the words (actually keys) match, then marking the cards as answered
                            if (key1 === key2) {


                                // changing the formatting on all (well, only two) '.front' cards
                                $(".front").removeClass("english japanese front front back mismatch card-clicked").addClass("answered");


                                // playing the sound
                                matchedSound.play();


                                // finishing if we're finished
                                if ($(".answered").length === numberPairs * 2) {

                                    var results = {
                                        time_taken: score.time_taken,
                                        number_problems: numberPairs,
                                        number_mistakes: score.number_mistakes,
                                        mistaken_vocab: {
                                            words: mistakenVocabList,
                                            audio: myJSON.audioFolder
                                        }
                                    };

                                    tools.send_results(results, function () {


                                        var data = {
                                            時間: score.time_taken + " 秒",
                                            ペア数: results.number_problems + " ペア",
                                            間違い: score.number_mistakes
                                        };


                                        var wordsToReview = tools.showMistakenVocab(results.mistaken_vocab.words);
                                        if (wordsToReview) {
                                            data["復習しよう！"] = wordsToReview;
                                        }


                                        setTimeout(function () {
                                            tools.showAssignmentResults({
                                                container: $("#mainProblemsHolder"),
                                                data: data
                                            });
                                        }, 1000);
                                    });
                                }

                            } else {


                                score.number_mistakes += 1;


                                // NEW TEST adding mistaken words to the mistakenVocabList
                                var english1 = $(card1).data("english");
                                var english2 = $(card2).data("english");
                                var japanese1 = $(card1).data("japanese");
                                var japanese2 = $(card2).data("japanese");

                                mistakenVocabList[english1] = japanese1;
                                mistakenVocabList[english2] = japanese2;


                                // adding an "x" to the scorebar thing
                                $("#score-holder").append("<span>&times;</span>");


                                // adding little x-marks in the upper right of the cards
                                $(".front").removeClass("card-clicked").addClass("mismatched");
                            }
                        }

                    }
                }
            });
        }
);