



define(
        [
            "jquery",
            "tools",
//            "helpers/fixedProblemHolder",
            "helpers/SoundEffects"
        ],
        function ($, tools, SoundEffects) { //, fixedProblemHolder


            // various variables
            var myJSON;
            var thisProblem = {};
            var $wordHolder = $("#word-holder");
            var $playButton = $("#play-button");
            var score = tools.score();
            var model = {
                wordPairs: [],
                numberOfProblems: 0,
                draggedObjectX: 0,
                draggedObjectY: 0,
                dataFolder: tools.folders.assignment() // this may be changed down below, if MP3s are kept separately
            };


            var audio;


            var clock = tools.clock({
                container: $("#clock-holder"),
                pauseStart: true
            });


            var sounds = new SoundEffects({
                container: $("#soundControls"),
                sounds: {
                    correct: "/sounds/scrabble/correctSound.mp3",
                    wrong: "/sounds/scrabble/wrongSound.mp3",
                    problemFinish: "/sounds/scrabble/problemFinish.mp3"
                },
                playThisOnCheckboxCheck: "correct"
            });


            // returns a Scrabble tile for each letter, and adds it to its parent
            var tileFactory = (function () {


                var counter = 0;
                var zIndex = 1;


                return {
                    makeNewTile: function (object) {


                        counter++;
                        object.parent.append("<div id='tile" + counter + "' class='tile'>" + object.letter + "</div>");


                        var $tile = $("#tile" + counter);
                        var randRotation = 10 - Math.floor(Math.random() * 20);


                        // adding draggability
                        $tile.draggable({containment: $("#narabekaeMain")});
                        $tile.css({
                            webkitTransform: "rotate(" + randRotation + "deg)",
                            msTransform: "rotate(" + randRotation + "deg)",
                            left: 10 - Math.random() * 20,
                            top: 10 - Math.random() * 20
                        });


                        // setting z-index on mousedown, so the tile is always on top of the other tiles
                        $tile.on("mousedown", function () {
                            zIndex++;
                            $(this).css({zIndex: zIndex});
                            clock.start();
                        });


                        // returning the DOM element itself
                        return $tile;
                    }
                };
            }());


            // keeping screen at least 400px wide, for mobile - and disabling scaling!  Cool!
            tools.setMobileScreenWidth(320, function () {
                $("#narabekaeMain").css({
                    width: "100%"
                }).addClass("col-xs-12");
            });


            var wordHolder = {
                show: function (word) {
                    $wordHolder.text(word);
                },
                clear: function () {
                    $wordHolder.empty();
                }
            };


            // retrieving the vocabulary items, storing in JSON
            tools.getProblemData(setUpArrays);
            function setUpArrays(data) {


                myJSON = data;
                myJSON.problem = tools.objectToArray(myJSON.problem);
                model.wordPairs = myJSON.problem;


                console.log(myJSON);


                // adjusting the number of problems (may have different wording depending on whether we're getting info from JSON or from the database)
                myJSON.numberOfProblems = myJSON.number_problems || myJSON.numberOfProblems;


                if (myJSON.dataFolder) {
                    model.dataFolder = tools.folders.group() + myJSON.dataFolder;
                }


                // preventing the whole screen from being dragged on mobile devices
                // applying this to THREE KINDS OF ELEMENTS using the following COOL SYNTAX!
                $(document).on("touchstart", ".space, #choicesHolder, #dragtarget", function (e) {
                    if (e.touches) {
                        e = e.touches[0];
                    }
                    return false;
                });


                // removing any words that are too long, or that contain spaces ('cause it breaks it)
                for (var i = model.wordPairs.length - 1; i >= 0; i--) {
                    if (model.wordPairs[i][0].length > 9 || model.wordPairs[i][0].indexOf(" ") !== -1) {
                        model.wordPairs.splice(i, 1);
                    }
                }


                // removing extra words if there are too many (more than the number specified in myJSON.numberOfProblems)
                if (myJSON.numberOfProblems) {
                    while (model.wordPairs.length > myJSON.numberOfProblems) {
                        var rand = Math.floor(Math.random() * model.wordPairs.length);
                        model.wordPairs.splice(rand, 1);
                    }
                }
                model.numberOfProblems = model.wordPairs.length;


                // adding the number of problems to the top table
                $("#numberProblemsBody").text(model.wordPairs.length + " 問");


                // adjusting the table to be in the center (for fuckin' IE!)
                $("#myTable").css({
                    marginLeft: ($("#narabekaeMain").width() - $("#myTable").width()) * 0.5
                });


                // building scoreBlocks
                model.wordPairs.forEach(function () {
                    $("#scoreBarHolder").append("<div class='scoreBlock scoreBlockBlank'></div>");
                });


                // FINALLY fading in the #mainProblemsHolder
                $("#mainProblemsHolder").fadeTo(200, 1);


                // NEW TEST!
                tools.fixedProblemHolder({
                    onSlideUp: function() {
                        $("#directions-holder").hide();
                    },
                    onSlideDown: function() {
                        $("#directions-holder").hide();
                    }
                });


                //moving on to the next problem
                nextProblem();
            }




            /*  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  */




            function nextProblem() {


                // emptying the choicesHolder
                $("#choicesHolder").empty();


                // preparing the dragTarget box
                $("#dragTarget").empty().removeClass("finished").addClass("dragMessage");


                // choosing random problem from the model.wordPairs array
                thisProblem.number = Math.floor(Math.random() * model.wordPairs.length);
                thisProblem.japaneseWord = model.wordPairs[thisProblem.number][1];
                thisProblem.englishWord = model.wordPairs[thisProblem.number][0].split("¥")[0].trim();
                thisProblem.remainingLetters = thisProblem.englishWord.split("");


                // if there's a ¥-sign, meaning there are unused (trash) letters, then including them in the 'trashLetters' array
                var word = model.wordPairs[thisProblem.number][0];
                thisProblem.trashLetters = (word.indexOf("¥") !== -1) ? (word.split("¥")[1].trim().split("")) : [];
                thisProblem.allLetters = thisProblem.remainingLetters.concat(thisProblem.trashLetters);


                var randomLettersArray = thisProblem.allLetters.concat();


                for (var i = 0; i < thisProblem.remainingLetters.length; i++) {
                    var thisLetter = thisProblem.remainingLetters[i];
                    $("#dragTarget").append("<div class='space' data-answer='" + thisLetter + "'>?</div>");
                }


                // choosing which of the preloaded audios to play
                if (audio) {
                    audio.unload();
                }

                audio = new Howl({
                    urls: [myJSON.audioFiles[thisProblem.englishWord]], //myJSON.audioFolder + tools.safelyEncodeURIComponent(thisProblem.englishWord) + ".mp3"],
                    autoplay: true,
                    onplay: function () {
                        $("#play-mark").removeClass("hidden");
                        $("#pause-mark").addClass("hidden");
                    },
                    onend: function () {
                        $("#play-mark").addClass("hidden");
                        $("#pause-mark").removeClass("hidden");
                    }
                });


                // NEW TEST
                wordHolder.show(thisProblem.japaneseWord);


                // placing all the letters in the floatingDivs - and making corresponding spaces (NEW TEST)
                randomLettersArray = tools.shuffle(randomLettersArray, true); // NEW TEST added the 'true' so the [0] element will always be moved
                while (randomLettersArray.length > 0) {
                    tileFactory.makeNewTile({
                        letter: randomLettersArray.pop(),
                        parent: $("#choicesHolder")
                    });
                }


                // inserting a line break if there are more than 4 letters, so that the tiles form two lines
                if ($(".tile").length > 4) {
                    var index = Math.ceil($(".tile").length / 2);
                    $(".tile").eq(index).before("<br>");
                }


                // increasing margin between .space divs if there are less than 6
                if ($(".space").length < 6) {
                    $(".space").css({
                        marginRight: "10px",
                        marginLeft: "10px"
                    });
                }


                // marking the X and Y coordinates at beginning of drag, so we can spring back if necessary
                $(".tile").on("mousedown", markStartCoordinates);
                function markStartCoordinates() {


                    // saving the starting css top & left positions
                    model.draggedObjectX = $(this).css("left");
                    model.draggedObjectY = $(this).css("top");


                    // forcing those values to be in pixels if they're 'auto' (which they are, by default, on first drag)
                    if (model.draggedObjectX === "auto") {
                        model.draggedObjectX = "0px";
                    }
                    if (model.draggedObjectY === "auto") {
                        model.draggedObjectY = "0px";
                    }
                }


                // making the dragTarget droppable - specifying what can be dropped, etc.
                $(".space").droppable({
                    accept: ".tile",
                    tolerance: "intersect",
                    drop: checkAnswer
                });


                function checkAnswer(event, droppedWord) {


                    var draggedText = $(droppedWord.draggable).text();
                    var correctText = $(event.target).attr("data-answer");


                    // comparing dropped word with the next word in the array
                    if (draggedText === correctText) {


                        // turning off droppability for this target
                        $(this).droppable({disabled: true}).addClass("tile").css("color", "white");


                        // adding the word, and trailing space, to the line
                        $(event.target).empty().text(correctText).append("<div class='glow-dot'></div>");
                        $(event.target).css({
                            boxShadow: "none",
                            border: "1px solid white",
                            borderTopColor: "#999",
                            borderLeftColor: "#999"
                        });


                        // disabling the dropped word so it can't be dragged, and is invisible
                        $(droppedWord.draggable)
                                .draggable({disabled: true})
                                .css({visibility: "hidden"});


                        // splicing the word from the array
                        thisProblem.remainingLetters.splice(0, 1);


                        // playing the correctSound (or, if all done, the problemFinish sound)
                        if (thisProblem.remainingLetters.length > 0) {
                            sounds.play("correct");
                        } else {


                            // if the current problem is all finished...
                            sounds.play("problemFinish");
                            model.wordPairs.splice(thisProblem.number, 1);


                            // clearing the old Japanese word
                            wordHolder.clear();


                            // momentarily coloring the dragTarget
                            $("#dragTarget").removeClass("notFinished").addClass("finished");


                            // coloring the scoreBlock
                            $(".scoreBlockBlank:first").removeClass("scoreBlockBlank").addClass("scoreBlockGreen");


                            // adding the nextButton
                            $("#choicesHolder")
                                    .append("<div id='answersHolder'><p>" + thisProblem.japaneseWord + " = " + thisProblem.englishWord + "</p></div>")
                                    .append("<div id='nextButton' class='btn btn-success btn-md'>Next</div>"); //<img id='nextCheckmark' src='/images/scrabble/checkmark_x40.png' />


                            // making the button full-width on mobile
                            if (tools.isMobile()) {
                                $("#nextButton").addClass("btn-block");
                            }


                            // showing the nextButton a moment later
                            setTimeout(function () {
                                $("#nextButton").animate({opacity: 1}, 200);
                            }, 1000);


                            // removing any tiles (which at this point are still only hidden, not removed)
                            $(".tile").not(".space").remove();


                            // if it's NOT the last problem...
                            if (model.wordPairs.length > 0) {


                                // adding clickability to the nextButton to go to next problem
                                $("#nextButton").on("click touchstart", moveOn);
                                function moveOn() {
                                    $("#nextButton").off("click", moveOn);
                                    clearTimeout(2000);
                                    nextProblem();
                                }


                                // setting right arrow to equal nextButton click
                                $("html").on("keydown", arrowKeyHandler);
                                function arrowKeyHandler(e) {
                                    if (e.keyCode === 39) {
                                        e.preventDefault();
                                        $("html").off("keydown", arrowKeyHandler);
                                        $("#nextButton").click();
                                    }
                                }

                            } else {


                                // if all problems have been done...
                                var results = {
                                    time_taken: score.time_taken,
                                    number_problems: model.numberOfProblems,
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
                                                問題数: results.number_problems + " 組",
                                                間違い: score.number_mistakes
                                            }
                                        });
                                    }, 1000);
                                }


                                // turning off the mousedown listener (necessary?)
                                $(".tile").off("mousedown");
                            }
                        }

                    } else {


                        // spring back if it's the wrong word
                        $(droppedWord.draggable).animate({
                            top: model.draggedObjectY,
                            left: model.draggedObjectX
                        });


                        score.number_mistakes++;


                        $("#mistakes-holder").text("間違い: " + score.number_mistakes);


                        // playing the wrong sound
                        sounds.play("wrong");
                    }
                }
            }


            (function () {


                var myInterval;


                $("html").off("keydown").on("keydown", function (e) {
                    if (e.keyCode === 32) {
                        e.preventDefault();
                        $playButton.click();
                    }
                });


                $playButton.off("click").on("click", function () {
                    audio.play();
                });
            }());

        });