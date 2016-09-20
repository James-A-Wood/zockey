


define(
        [
            "jquery",
            "tools",
            "helpers/SoundEffects",
            "helpers/tiltSimulatesArrowKeys",
            "Konva",
            "konva/pacManFactory",
            "konva/blastCircle",
            "konva/fireworks",
            "konva/WordBlock",
            "konva/shakeStage",
//            "helpers/fixedProblemHolder"
        ],
        function ($, tools, SoundEffects, tiltSimulatesArrowKeys, Konva, pacManFactory, blastCircle, FireworksFactory, WordBlockFactory, shakeStage) { //, AudioLoader, fixedProblemHolder


            var score = tools.score();


            var soundEffects = new SoundEffects({
                container: $("#sound-effects-controls"),
                sounds: {
                    movementSound: "/sounds/pac_man/movementSound.mp3",
                    pacManDie: "/sounds/pac_man/pacManDie.mp3",
                    wrongSound: "/sounds/pac_man/wrongSound.mp3",
                    birthSound: "/sounds/pac_man/birthSound.mp3",
                    successSound: "/sounds/pac_man/successSound.mp3",
                    tada: "/sounds/pac_man/tada.mp3",
                    correctSound: "/sounds/pac_man/correctSound.mp3",
                    speedUp: "/sounds/pac_man/speedUp.mp3"
                }
            });


            // changing the screen resolution so it's at least 320px!
            tools.setMobileScreenWidth(320);


            // various variables
            var problems = {
                remainingProblems: "",
                numberOfProblems: ""
            };


            var myJSON = {};


            // enabling device tilting to simulate arrow key presses
            if (tools.isMobile()) {


                // activating tilting
                tiltSimulatesArrowKeys();


                // special directions for mobile
                $("#yarikataBody").text("iPod（または携帯）を傾けて、Pac Man を動かしながら、単語を読まれた順番に食べましょう。（「▶」をクリックして音を流しましょう！）");
            }


            // setting the ration - square on mobile!
            var ratio = 1;//tools.isMobile() ? 1 : 0.666;


            // keeping the pacManHolder to a max width of 400px
            $("#pacManHolder").css({width: Math.min(400, $("#mainProblemsHolder").width())});
            $("#pacManHolder").css({height: $("#pacManHolder").width() * ratio});


            if (tools.isMobile()) {
                $("#pacManHolder").css({margin: "0px auto"});
            }



            // setting up the stage and various layers
            var stage = new Konva.Stage({
                container: "pacManHolder",
                width: $("#pacManHolder").width(),
                height: $("#pacManHolder").height()
            });
            var pacManLayer = new Konva.Layer(); //{listening: false}
            var targetsLayer = new Konva.Layer({listening: false});
            var boundariesLayer = new Konva.Layer({listening: false});
            stage.add(targetsLayer, pacManLayer, boundariesLayer);


            var fireworks = FireworksFactory(stage);


            // showing the answers, one word at a time
            var AnswersText = (function () {


                // local variables
                var wordsArray = [];
                var fontSize = 18;
                var fill = "navy";
                var counter = 0;
                var spaceWidth = (function () {
                    var space = new Konva.Text({
                        fontSize: fontSize,
                        text: " "
                    });
                    var width = space.width();
                    return width;
                }());


                // adding a textLayer, if it's not already already
                if (stage.find("#textLayer").length === 0) {
                    var textLayer = new Konva.Layer();
                    textLayer.id("textLayer");
                    stage.add(textLayer);
                }


                return {
                    // returning a reference to teh answersLayer
                    textLayer: textLayer,
                    // the 'create' method erases the previous text and sets up another
                    create: function (array) {

                        counter = 0; // clearing the counter

                        // removing any old objects from the layer
                        textLayer.getChildren().each(function (thisObject) {
                            thisObject.remove();
                        });
                        textLayer.draw();

                        wordsArray = []; // clearing the wordsArray
                        var group = new Konva.Group();
                        var totalWidth = 0;

                        for (var i = 0; i < array.length; i++) {
                            var word = new Konva.Text({
                                fill: fill,
                                text: array[i],
                                fontSize: fontSize
                            });
                            totalWidth += word.width() + spaceWidth;
                        }

                        group.width = totalWidth;
                        textLayer.add(group);
                        var xPosition = (stage.width() - group.width) / 2;
                        group.x(xPosition);

                        // 'showNext' is a property of the instance, and shows the next word
                        group.showNext = (function () {

                            // public method
                            return function () {
                                if (wordsArray[counter]) {
                                    wordsArray[counter].opacity(1);
                                    textLayer.draw();
                                    counter++;
                                } else {
                                    for (var i = 0; i < wordsArray.length; i++) {
                                        wordsArray[i].opacity(0);
                                    }
                                    counter = 0;
                                    textLayer.draw();
                                }
                            };
                        }());

                        return group;
                    }
                };
            }());


            // factory for the "Speed Up!" notifications
            var SpeedUpLogo = WordBlockFactory({
                text: "Speed up!",
                fill: "transparent",
                stroke: "transparent",
                textFill: "green",
                textSize: tools.isMobile() ? 12 : 18,
                paddingX: 0,
                paddingY: 0,
                name: "wordBlock"
            });


            // bounding box, for pacMan to move around in
            var boundaries = new Konva.Rect({
                width: stage.width(),
                height: stage.height(),
                x: 0,
                y: 0
            });
            boundariesLayer.add(boundaries);


            // holds the wordBlocks
            var choicesHolder = (function () {
                var padding = 0;
                var holder = new Konva.Rect({
                    width: stage.width() - padding,
                    height: stage.height() - padding,
                    x: padding / 2,
                    y: padding / 2,
                    stroke: "",
                    strokeWith: 1
                });
                return holder;
            }());
            boundariesLayer.add(choicesHolder).draw();


            // retrieving the vocabulary items, storing in JSON
            tools.getProblemData(function (data) {


                // removing extraneous problems
                if (data.number_problems && data.number_problems > 2) {
                    tools.whittleDownArray(data.problem, data.number_problems);
                }


                problems.remainingProblems = data.problem;
                problems.numberOfProblems = problems.remainingProblems.length;


                myJSON = data;


                // NEW TEST!
                tools.fixedProblemHolder();


                nextProblem();
            });




            /*  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  */



            function nextProblem() {


                // various variables
                var gridObjects = []; // holds all wordBlocks and speedPills
                var wordBlocks = []; // holds all wordBlocks, in the correct order so it can get whittled down


                // picking off the first of the remaining problems
                var currentProblem = problems.remainingProblems.shift();
                var currentAudio = currentProblem[0];


                // loading the sound
                if (audio && audio.destroy) {
                    audio.destroy();
                }
                var audio = new Howl({
                    urls: [myJSON.audioFolder + tools.safelyEncodeURIComponent(currentAudio) + ".mp3"]
                });
                $("#playButton").off("click").click(function () {
                    audio.stop().play();
                    pacMan.enable();
                });
                audio.on("play", function () {
                    pacMan.enable();
                });


                var targets = (function () {


                    // this gets returned at the end
                    var targets = {
                        correctWords: [],
                        dummyWords: [],
                        blocksInCorrectOrder: []
                    };


                    if (currentProblem[1].indexOf("¥") === -1) {
                        targets.correctWords = currentProblem[1].trim().split(" ");
                        targets.dummyWords = [];
                    } else {
                        targets.correctWords = currentProblem[1].trim().split("¥")[0].trim().split(" ");
                        targets.dummyWords = currentProblem[1].trim().split("¥")[1].trim().split(" ");
                    }


                    targets.correctWords = stripUnderscores(targets.correctWords);
                    targets.dummyWords = stripUnderscores(targets.dummyWords);

                    function stripUnderscores(array) {
                        for (var i = 0; i < array.length; i++) {
                            while (array[i].indexOf("_") !== -1) {
                                array[i] = array[i].replace("_", " ");
                            }
                        }
                        return array;
                    }


                    // combining the correctWords and the dummyWords
                    targets.allWords = targets.correctWords.concat(targets.dummyWords);


                    // creating a new answersText
                    answersText.new(targets.correctWords);

                    // instantiating a wordBlock factory...
                    var WordBlockMaker = WordBlockFactory({
                        paddingX: 15,
                        paddingY: 3,
                        textSize: tools.isMobile() ? 12 : 18,
                        strokeWidth: 1,
                        fill: "slateblue",
                        textFill: "white",
                        stroke: "transparent",
                        alternateStyles: [
                            {
                                fill: "red",
                                textFill: "yellow",
                                stroke: "yellow"
                            }
                        ],
                        cornerRadius: 3,
                        name: "target",
                        parentLayer: targetsLayer
                    });


                    // building one wordBlock for each word
                    for (var i = 0; i < targets.allWords.length; i++) {


                        var word = WordBlockMaker({
                            text: targets.allWords[i]
                        });
                        word.text = targets.allWords[i];
                        targetsLayer.add(word);


                        // making the words really small to start with (avoiding bugs on iOS...)
                        word.scaleX(0.01);
                        word.scaleY(0.01);


                        gridObjects.push(word);
                        wordBlocks.push(word);
                        targets.blocksInCorrectOrder.push(word);

                    }


                    // scaling blocks if they're too wide for Man to fit between
                    wordBlocks.forEach(function (thisBlock) {

                        var percentOfStageWidth = thisBlock.width / stage.width();
                        var maxAllowed = 0.25;

                        if (percentOfStageWidth > maxAllowed) {
                            thisBlock.scaleTo(maxAllowed / percentOfStageWidth);
                        }

                        targetsLayer.draw();
                    });


                    // returning the object, containing two arrays, correctWords and dummyWords
                    return targets;
                }());


                // updating the scoreText
                $("#scoreText").text(problems.numberOfProblems - problems.remainingProblems.length + " / " + problems.numberOfProblems);


                var speedPills = (function () {


                    var array = [];
                    var numberOfSpeedPills = 2;


                    // the speedPill template
                    var speedPillMaker = WordBlockFactory({
                        parentLayer: targetsLayer,
                        name: "speedPill",
                        paddingX: 10,
                        paddingY: 2,
                        fontSize: 10,
                        cornerRadius: 200,
                        text: "x2",
                        fill: "red",
                        textFill: "white",
                        stroke: "transparent"
                    });

                    // making instances from the speedPill template above
                    for (var i = 0; i < numberOfSpeedPills; i++) {
                        var speedPill = speedPillMaker();
                        targetsLayer.add(speedPill);
                        gridObjects.push(speedPill);
                        array.push(speedPill);
                    }
                    return array;
                }());


                var obstacles = (function () {

                    var numberObstacles = 0;

                    // 'obstacles' are just normal wordBlocks, but colored and with no text
                    var obstaclesArray = [];
                    var ObstacleMaker = WordBlockFactory({
                        fill: "skyblue",
                        stroke: "navy",
                        name: "obstacle"
                    });

                    for (var i = 0; i < numberObstacles; i++) {
                        var obstacle = ObstacleMaker({
                            width: 50,
                            height: 50,
                            x: 100 + i * 100,
                            y: 50
                        });
                        targetsLayer.add(obstacle);
                        obstaclesArray.push(obstacle);
                    }

                    targetsLayer.draw();

                    return obstaclesArray;
                }());


                var NewPacMan = (function () {


                    // local variable
                    var pacManStart = {
                        x: null,
                        y: null
                    };


                    return function (enableOnBirth) {


                        var pacMan = pacManFactory({
                            disableOnStartup: enableOnBirth ? false : true,
                            parentLayer: pacManLayer,
                            fill: "#66F",
                            radius: tools.isMobile() ? 10 : 15,
                            pakuInterval: 0.15,
                            speed: tools.isMobile() ? 50 : 75, //150, // pixels per second - was 100!
                            useBlastCircleBeforeBirth: true,
                            boundaries: boundaries || stage,
                            hittables: [
                                [wordBlocks, checkAnswer], // arrray, callback
                                [speedPills, speedUp] // array, callback
                            ],
                            obstacles: obstacles,
                            // passing in a references to the soundEffects object, so we can add more sounds dynamically in the pacManFactory
                            soundEffects: soundEffects,
                            // passing in a function that returns True of False, whether to use the sound efects or not
                            useSoundEffects: function () {
                                return soundEffects.areOn();
                            }
                        });


                        pacMan.useBlastCircleBeforeBirth = true;


                        // function to set the starting X & Y (set during the first instantiation)
                        pacMan.setStartingXY = function (x, y) {
                            pacManStart.x = x;
                            pacManStart.y = y;
                        };


                        // placing pacMan at the original starting X & Y, if they're set
                        pacMan.x(pacManStart.x);
                        pacMan.y(pacManStart.y);


                        // adding pacMan
                        pacManLayer.add(pacMan);


                        return pacMan;
                    };
                }());
                var pacMan = NewPacMan();
                pacMan.startText({
                    text: "クリックして\n始めよう",
                    showDelay: 4000,
                    onClick: function () {
                        $("#playButton").click();
                    }
                });


                // calculating the x/y position of each word, the speedPills, and pacMan HIMSELF!
                (function () {


                    // mixing up the array and placing the words around the stage
                    gridObjects = tools.shuffle(gridObjects);


                    var grid = (function () {

                        var toggle = true;
                        var numRows = 2;
                        var numColumns = 2;

                        while (numRows * numColumns < gridObjects.length + 1) { // '+1' for pacMan to sit in
                            toggle ? numRows += 1 : numColumns += 1;
                            toggle = !toggle;
                        }
                        var rowSpacing = choicesHolder.height() / numRows;
                        var columnSpacing = choicesHolder.width() / numColumns;

                        return {
                            numRows: numRows,
                            numColumns: numColumns,
                            rowSpacing: rowSpacing,
                            columnSpacing: columnSpacing
                        };
                    }());


                    // inserting pacMan into the gridObjects so he can be positioned like a tile...
                    var pacManRandomIndex = Math.floor(Math.random() * gridObjects.length);
                    gridObjects.splice(pacManRandomIndex, 0, pacMan);


                    // calculating X & Y coordinates on the grid of each object
                    for (var r = 0; r < grid.numRows; r++) { // cycling through rows and columns
                        for (var c = 0; c < grid.numColumns; c++) {

                            var numberTile = c + (r * grid.numColumns);
                            var thisTile = gridObjects[numberTile];

                            // loops may overshoot a few, so testing if thisTile exists
                            if (thisTile) {
                                var posX = choicesHolder.x() + c * grid.columnSpacing + (grid.columnSpacing / 2) - (thisTile.width / 2);
                                var posY = choicesHolder.y() + r * grid.rowSpacing + (grid.rowSpacing / 2) - (thisTile.height / 2);

                                // recalculating if the 'thisTyle' is pacMan...
                                if (thisTile.id() === "pacMan") {
                                    posX += thisTile.width / 2;
                                    posY += thisTile.height / 2;

                                    thisTile.setStartingXY(posX, posY);
                                }

                                thisTile.x(posX);
                                thisTile.y(posY);
                            }
                        }
                    }

                    targetsLayer.draw();
                    pacManLayer.draw();

                    // Cool!  Remember this syntax!
                    stage.find(".target, .speedPill").each(function (thisBlock) {
                        thisBlock.popUp();
                    });
                }());


                // received from the pacMan object when it has hit a target
                function checkAnswer(thisBlock) {


                    // if answered correctly...
                    if (thisBlock === targets.blocksInCorrectOrder[0]) {


                        // the word is correct, so...
                        soundEffects.play("correctSound");
                        answersText.revealNext();
                        thisBlock.removeMe();
                        wordBlocks.shift();
                        targets.blocksInCorrectOrder.shift();


                        var star = blastCircle({
                            layer: pacManLayer,
                            innerRadius: 25,
                            outerRadius: 40,
                            stroke: "orange",
                            duration: 1.5,
                            x: thisBlock.x() + thisBlock.width / 2,
                            y: thisBlock.y() + thisBlock.height / 2,
                            shape: "star"
                        });


                        // checking for finish
                        if (targets.blocksInCorrectOrder.length === targets.dummyWords.length) {


                            pacMan.stop();


                            // setting off fireworks, and then moving on to the next problem
                            setTimeout(function () {


                                // playing the "tada" sound
                                soundEffects.play("tada");


                                fireworks({
                                    strokeWidth: 6,
                                    onFinish: function () {

                                        // if all the problems are done...
                                        if (problems.remainingProblems.length === 0) {

                                            var results = {
                                                time_taken: score.time_taken,
                                                number_problems: problems.numberOfProblems,
                                                number_mistakes: score.number_mistakes
                                            };

                                            // results to pass to the tools.send_results function
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

                                            // if there are problems left...
                                            targetsLayer.getChildren().each(function (thing) {
                                                thing.shrinkAway();
                                            });
                                            pacMan.shrinkAway(nextProblem); // callback
                                            AnswersText.textLayer.removeChildren();

                                            soundEffects.play("successSound");
                                        }
                                    }
                                });
                            }, 1000);
                        }
                        // if incorrect...
                    } else {

                        // wrapping the sound in a try/catch block
                        try {
                            soundEffects.play("wrongSound");
                        } catch (e) {
                            //
                        }


                        pacMan.die();


                        score.number_mistakes++;


                        shakeStage({
                            stage: stage,
                            shakeAmplitude: 6,
                            shakeRate: 10,
                            shakeLength: 600
                        });


                        // regenerating pacMan
                        setTimeout(function () {
                            pacMan = NewPacMan("enableOnBirth");
                        }, 2000);


                        setTimeout(function () {
                            audio.play();
                        }, 5000);
                    }
                }

                function speedUp(thisBlock) {


                    speedPills.splice(speedPills.indexOf(thisBlock), 1);
                    thisBlock.removeMe();
                    pacMan.speedUp();
                    soundEffects.play("speedUp");
                    var logo = SpeedUpLogo();


                    // centering the logo horizontally above the speedPill
                    logo.x(thisBlock.x() + thisBlock.width / 2 - logo.width / 2);
                    logo.y(thisBlock.y());
                    targetsLayer.add(logo);


                    // first tween, to move the logo up the screen
                    var tween1 = new Konva.Tween({
                        node: logo,
                        y: logo.y() - 75,
                        duration: 1.5,
                        onFinish: function () {
                            logo.remove();
                        }
                    }).play();


                    // second tween, a moment later, to fade it out
                    setTimeout(function () {
                        var tween2 = new Konva.Tween({
                            node: logo,
                            duration: 0.5,
                            opacity: 0
                        }).play();
                    }, 1000);


                    pacMan.flash();
                }
            }


            var answersText = (function () {


                var answersLayer = new Konva.Layer({
                    listening: false
                });


                stage.add(answersLayer);


                var ellipsisText = new Konva.Text({
                    text: "...",
                    fill: "navy",
                    fontSize: 24,
                    opacity: 0
                });
                answersLayer.add(ellipsisText);


                var blocksArray = [];


                return {
                    new : function (array) {


                        ellipsisText.x(0);


                        // remvoving any old words
                        answersLayer.find(".unhidden").each(function (word) {
                            word.remove();
                        });


                        answersLayer.draw();
                        blocksArray.length = 0; // emptying the blocksArray
                        array = array || ["This", "is", "a", "test"];
                        var totalTextWidth = 0;
                        var group = new Konva.Group();
                        group.add(ellipsisText);



                        // calculating font size so the whole thing fits on one line
                        var fontSize = (function () {


                            // rebuilding the string
                            var string = "";
                            for (var i = 0; i < array.length; i++) {
                                string += array[i] + " ";
                            }


                            // adding the text to the screen so that we can measure its width
                            var testText = new Konva.Text({
                                text: string,
                                fill: "transparent",
                                opacity: 1,
                                fontSize: 24
                            });
                            answersLayer.add(testText).draw();


                            // getting the width
                            var textWidth = testText.width();


                            // removing the testText once we've got the width
                            testText.remove();
                            answersLayer.draw();


                            // returning whichever value is smaller
                            return Math.min(24, (stage.width() / textWidth) * 24);
                        }());


                        // COOL SYNTAX!  This is cleaner than a for loop!
                        array.forEach(function (item, i) {


                            // one Konva.Text for each word in the sentence
                            var text = new Konva.Text({
                                text: item + " ",
                                fill: "navy",
                                opacity: 0,
                                name: "hidden",
                                fontSize: fontSize
                            });


                            blocksArray.push(text);
                            group.add(text);


                            // spacing the words - placing each after the one before it
                            if (i > 0) {
                                text.x(blocksArray[i - 1].x() + blocksArray[i - 1].width());


                                // keeping track of how long they are total
                                totalTextWidth = text.x() + text.width();
                            }
                        });

                        group.x(stage.width() / 2 - totalTextWidth / 2).y(5);
                        answersLayer.add(group).draw();
                    },
                    revealNext: function () {
                        answersLayer.find(".hidden")[0].name("unhidden").opacity(1);
                        if (answersLayer.find(".hidden")[0]) {
                            ellipsisText.opacity(1).x(answersLayer.find(".hidden")[0].x());
                        } else {
                            ellipsisText.opacity(0);
                            answersLayer.find(".unhidden").each(function (word) {
                                word.fill("green");
                            });
                        }
                        answersLayer.draw();
                    }
                };
            }());

        }
);