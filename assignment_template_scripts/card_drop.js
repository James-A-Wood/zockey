

define(
        [
            "jquery",
            "tools",
            "helpers/wordPool",
//            "helpers/fixedProblemHolder",
            "helpers/shakeElement",
            "jqueryui",
            "howler"
        ],
        function ($, tools, myWordPool, shakeElement) { //, fixedProblemHolder


            /*
             *  problemData.number_sentakushi - how many pairs to use per problem set
             *  problemData.number_problems - how many sets to use
             * 
             */


            $(function () {


                // various variables
                var $cardsFrame = $("#cardsFrame");
                var $cardDropMain = $("#cardDropMain");
                var isMobile = (tools.isMobile() || window.innerWidth < 568);
                var remainingPairs = 0;
                var problemData = {};
                var wordPool;
                var score = tools.score();
                var numberRounds = 4; // how many times to deal the cards, default 4
                var numberPairsPerSet = 8; // how many pairs to use, default 8
                var numberCompletedSets = 0;
                var scoreBar;
                var mistakenVocabList = {};


                var correctSound = new Howl({
                    urls: ["/sounds/card_drop/correctSound.mp3"]
                });


                var wrongSound = new Howl({
                    urls: ["/sounds/card_drop/wrongSound.mp3"]
                });


                // keeping screen at least 320px wide, for mobile...
                tools.setMobileScreenWidth(320);


                var clock = tools.clock({
                    container: $("#clock-holder"),
                    pauseStart: true // starting clock on first card drag, wired up below
                });


                $("#number-problem").css({
                    width: $cardDropMain.width()
                });


                var Card = (function () {


                    // detaching the master card from the HTML markup
                    var $cardMaster = $(".card.my-template").detach().removeClass("my-template");


                    // returning the function to clone and build a new card
                    return function (language, word, index, randomColor) {


                        var $card = $cardMaster.clone();
                        $card.addClass(language).data({key: index});
                        $card.css({
                            background: (language === "english") ? "white" : randomColor,
                            color: (language === "english") ? randomColor : "white",
                            borderColor: (language === "english") ? randomColor : "white",
                            transform: function () {


                                // no rotation on mobile
                                if (isMobile) {
                                    return null;
                                }


                                // on DESKTOP, rotating the card slightly
                                var degrees = 5 - Math.random() * 10;
                                return "rotate(" + degrees + "deg)";
                            }
                        });


                        // adding the text to the card
                        $card.find(".card-text").text(word);


                        // returning the card itself
                        return $card;
                    };
                }());


                // retrieving the vocabulary items and storing them in JSON
                tools.getProblemData(function (returnedData) {


                    // saving the returnedData in the global problemData variable
                    problemData = returnedData;


                    // setting the numberRounds to whatever is in the "misc" property, if specified
                    if (problemData.number_problems) {
                        numberRounds = problemData.number_problems;
                    }


                    // changing problemData.problem to an array, if it's an object
                    problemData.problem = tools.objectToArray(problemData.problem);


                    // setting the number of pairs
                    numberPairsPerSet = problemData.number_sentakushi || numberPairsPerSet;
                    numberPairsPerSet = Math.min(numberPairsPerSet, problemData.problem.length);


                    // setting up the scoreBar
                    scoreBar = new ScoreBar({
                        numberProblems: numberPairsPerSet * numberRounds
                    });


                    // optionally, setting the problemHolder to position: fixed on mobile
                    tools.fixedProblemHolder({
                        onSlideUp: function () {
                            $("#directions-holder").hide();
                        },
                        onSlideDown: function () {
                            $("#directions-holder").show();
                        }
                    });


                    // creating the wordPool
                    wordPool = myWordPool({
                        baseArray: problemData.problem,
                        shuffle: true
                    });


                    // starting the game, after a slight delay
                    setTimeout(newRound, 500);
                });





                /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */




                function newRound() {


                    var randomColor = tools.pickDarkColor();
                    var englishArray = [], japaneseArray = [];


                    // retrieving how many pairs to use - usually 2, 4, 6 or 8
                    remainingPairs = numberPairsPerSet;


                    // emptying the cards frame (should be empty already)
                    $cardsFrame.empty();


                    // getting the choices and building the cards
                    wordPool.getArrayOf(numberPairsPerSet).forEach(function (thisChoice, index) {


                        var englishWord = thisChoice[0];
                        var japaneseWord = thisChoice[1];


                        var $englishCard = new Card("english", englishWord, index, randomColor);
                        var $japaneseCard = new Card("japanese", japaneseWord, index, randomColor);


                        // NEW TEST adding the word pairs to each card, so we can keep track of the mistakes
                        $englishCard.data({englishWord: englishWord, japaneseWord: japaneseWord});
                        $japaneseCard.data({englishWord: englishWord, japaneseWord: japaneseWord});


                        englishArray.push($englishCard);
                        japaneseArray.push($japaneseCard);
                    });


                    // shuffling the cards
                    englishArray = tools.shuffle(englishArray);
                    japaneseArray = tools.shuffle(japaneseArray);


                    // displaying the shuffled cards in the $cardsFrame - English first, then Japanese
                    englishArray.forEach(function ($thisCard, index) {


                        // appending the cards to the $cardsFrame
                        var $engCard = $thisCard;
                        var $japCard = japaneseArray[index];


                        // English cards FIRST, then Japanese
                        $cardsFrame.append($japCard);
                        $cardsFrame.prepend($engCard);


                        // adjusting the card HEIGHT to be 50% (mobile) or 66% (desktop) of its width
                        // NOTE must do this here because the card must be added to the DOM
                        var cardWidth = parseInt($engCard.css("width"));
                        var cardWithMultiplier = isMobile ? 3 : 2;
                        $engCard.css("height", cardWidth / cardWithMultiplier);
                        $japCard.css("height", cardWidth / cardWithMultiplier);


                        // shrinking the font until the whole .card-text fits inside the .card
                        tools.shrinkToFit($engCard.find(".card-text"), $engCard);
                        tools.shrinkToFit($japCard.find(".card-text"), $japCard);
                    });


                    // wiring up draggability on all the .draggable cards
                    $(".draggable").draggable({
                        containment: $("#cardDropMain"),
                        stack: ".card",
                        start: function () {
                            clock.start();
                        },
                        revert: function () {


                            // only reverting if the card has class dropped-on-invalid-target, 
                            // which it only gets on an invalid drop
                            if ($(this).hasClass("dropped-on-invalid-target")) {
                                console.log("Returning true!");
                                $(this).removeClass("dropped-on-invalid-target");
                                return true;
                            }


                            console.log("Returning false!");


                            // otherwise not reverting - like, when it's not dropped on anything
                            return false;
                        },
                        revertDuration: 200
                    });


                    // adding droppability to each card...
                    $(".droppable").droppable({
                        accept: ".draggable", // accepting any card with '.draggable' (which is all of them), even if it isn't correct
                        drop: function (event, droppedWord) { // checking if the card dropped matches 


                            // retrieving the "keys" on each card element
                            var droppedOnKey = $(this).data("key");
                            var draggedCardKey = $(droppedWord.draggable[0]).data("key");
                            var $topCard = $(droppedWord.draggable);
                            var $bottomCard = $(this);


                            // checking if they have the same key
                            if (droppedOnKey === draggedCardKey) {


                                goodDrop($topCard, $bottomCard);

                            } else {


                                // adding class dropped-on-invalid-target so it knows to revert the dragged card
                                $(droppedWord.draggable[0]).addClass("dropped-on-invalid-target");
                                shakeElement($cardsFrame, {
                                    amplitude: 5
                                });
                                wrongSound.play();
                                score.number_mistakes++;
                                scoreBar.wrong();


                                var englishWord1 = $topCard.data("englishWord");
                                var englishWord2 = $bottomCard.data("englishWord");
                                var japaneseWord1 = $topCard.data("japaneseWord");
                                var japaneseWord2 = $bottomCard.data("japaneseWord");


                                // adding the words to mistakenVocab
                                mistakenVocabList[englishWord1] = japaneseWord1;
                                mistakenVocabList[englishWord2] = japaneseWord2;
                            }
                        }
                    });
                }


                // handling correct drops
                function goodDrop($topCard, $bottomCard) {


                    // playing the correct sound
                    correctSound.play();


                    // incrementing the countdown circle thing
                    scoreBar.correct();


                    // disabling drag-droppability on the cards, and fading them out
                    $topCard.droppable("disable").draggable("disable").addClass("fadedOut");
                    $bottomCard.droppable("disable").draggable("disable").addClass("fadedOut");


                    // manually setting the cards BEHIND all the others, so they don't interfere with dragging
                    setTimeout(function () {
                        $topCard.css({zIndex: -1});
                        $bottomCard.css({zIndex: -1});
                    }, 2000);


                    // making the items numb to touch
                    // this is necessary so that the screen, which should be undraggable on mobile, isn't
                    // draggable where the card is
                    tools.numbToTouch($bottomCard);
                    tools.numbToTouch($topCard);


                    // marking how many cards are left
                    remainingPairs -= 1;


                    // if this is the last card
                    if (remainingPairs <= 0) {


                        // removing the first item from the array
                        numberCompletedSets += 1;


                        // showing the scoreBlockGreen
                        $(".scoreBlockBlank").eq(0).removeClass("scoreBlockBlank").addClass("scoreBlockGreen");


                        setTimeout(function () {


                            // exiting here if numPairsArray is now empty
                            if (numberCompletedSets >= numberRounds) {
                                endSequence();
                                return;
                            }


                            // moving on to the next problem, after a pause
                            newRound();

                        }, 1000);
                    }
                }


                // sending off score data and ending the problem
                function endSequence() {


                    var results = {
                        time_taken: score.time_taken,
                        number_problems: numberPairsPerSet * numberRounds, // problemData.numberOfPairsToUse * 2,
                        number_mistakes: score.number_mistakes,
                        mistaken_vocab: {
                            words: mistakenVocabList
                        }
                    };


                    // sending the results object, and also a reference to the function to call when returned from the
                    tools.send_results(results, backFromSendResults);
                    function backFromSendResults() {


                        // adding the 'assignment_results' div after a slight pause
                        setTimeout(function () {


                            var data = {
                                時間: clock.time() + " 秒",
                                問題数: numberPairsPerSet * numberRounds + " 組",
                                間違い: score.number_mistakes
                            };


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
                }


                function ScoreBar(inputs) {

                    /*
                     *  inputs.scoreBar - a jQuery reference to the scoreBar to lengthen
                     *  inputs.startPercent - how much to start the scoreBar at
                     *  inputs.numberProblems - how many problems (so we can set number of steps)
                     *  inputs.animationDuration - animation duration for the lengthening thing
                     *  
                     *  inputs.wrongBar - jQuery reference to the score-bar-wrong to lengthen
                     *  inputs.barWrongBackground - color of the wrong-bar
                     *  inputs.startPercentWrong - how much to start the wrongBar at
                     *  
                     */


                    if (!inputs || typeof inputs !== "object") {
                        console.warn("ScoreBar takes one parameter, an object!");
                        return false;
                    }


                    var $barCorrect = inputs.scoreBar || $("#score-bar-foreground");
                    var $barWrong = inputs.wrongBar || $("#score-bar-wrong");
                    var currentPercent = inputs.startPercent || 1;
                    var stepPercent = 100 / inputs.numberProblems;
                    var animationDuration = inputs.animationDuration || 200;
                    var barBackground = inputs.backgroundColor || "";
                    var barHeight = inputs.barHeight || "";
                    var barWrongBackground = inputs.barWrongBackground || "red";
                    var currentPercentWrong = inputs.startPercentWrong ? inputs.startPercentWrong : 0;



                    // formatting the scoreBar
                    $barCorrect.css({
                        width: currentPercent + "%",
                        background: barBackground,
                        height: barHeight
                    });


                    $barWrong.css({
                        width: currentPercentWrong + "%",
                        backgrond: barWrongBackground,
                        height: barHeight
                    });


                    function setCorrect(numberOfSteps) {
                        numberOfSteps = numberOfSteps || 1;
                        var newPercent = currentPercent + (stepPercent * numberOfSteps);
                        newPercent = Math.min(newPercent, 100);
                        $barCorrect.animate({width: newPercent + "%"}, animationDuration);
                        currentPercent = newPercent;
                    }


                    function setNumberProblems(numberProblems) {
                        stepPercent = 100 / numberProblems;
                    }


                    function setWrong(numberOfSteps) {
                        numberOfSteps = numberOfSteps || 1;
                        var newPercentWrong = currentPercentWrong + (stepPercent * numberOfSteps);
                        newPercentWrong = Math.min(newPercentWrong, 100);
                        $barWrong.animate({width: newPercentWrong + "%"}, animationDuration);
                        currentPercentWrong = newPercentWrong;
                    }


                    this.correct = setCorrect;
                    this.wrong = setWrong;
                    this.setNumberProblems = setNumberProblems;
                }
            });

        }
);
