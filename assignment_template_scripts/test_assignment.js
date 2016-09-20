



define(
        [
            "jquery",
            "Konva",
            "tools",
            "helpers/processSentence",
//            "helpers/fixedProblemHolder",
//            "konva/WordBlock",
            "konva/slingshotBall",
            "konva/targetingMark",
            "helpers/SoundEffects",
            "howler"
        ],
        function ($, Konva, tools, processSentence, slingshotBall, targetingMark) { //WordBlockFactory, fixedProblemHolder


            var myJSON;
            var isMobile = tools.isMobile();


            /*
             * 
             *  Preparing the stage and layer
             *      
             */
            var stage = new Konva.Stage({
                height: 400,
                width: 600,
                container: "konva-holder"
            });
            var layer = new Konva.Layer();
            stage.add(layer);
            var border = new Konva.Rect({
                width: stage.width(),
                height: stage.height(),
                stroke: "green"
            });
            layer.add(border);


            // instantiating a new ball (with layer, etc.)
            var ball = slingshotBall({
                stage: stage,
                radius: 10, //isMobile ? 7 : 10,
                sounds: false,
//                hitSoundSource: "/sounds/slingshot/hit.mp3",
//                shootSoundSource: "/sounds/slingshot/shoot.mp3",
//                highlightTargeted: showTargetingMark,
                ballHome: {
                    x: stage.width() / 2,
                    y: stage.height() * 0.7
                },
                rubberbandColor: "#666",
                rubberbandWidth: 1.5,
                blastCircleRadius: 40,
                speed: 15,
                blastCircleStrokeWidth: 3,
                goalPostRadius: isMobile ? 3 : 4,
                goalPostSpread: isMobile ? stage.width() / 4 : stage.width() / 8,
                goalPostColor: "navy",
                targets: [],
                onHit: checkHitResult,
                onShoot: function () {
                    //
                }
            });


            tools.getProblemData(function (data) {
                myJSON = data;
                newProblem();
            });


            function newProblem() {


                var currentProblem = myJSON.problem.shift();
                var problem = currentProblem[1];
                var japanese = currentProblem[0];
                var english = processSentence(problem);
                var choices = english.sentakushi;
                var englishWithBlank = english.stuffBeforeSentakushi + " _______ " + english.stuffAfterSentakushi;


                $("#japanese-problem-holder").text(japanese);
                $("#english-problem-holder").text(englishWithBlank);


//                var japaneseText = new Konva.Text({
//                    text: japanese,
//                    width: stage.width(),
//                    align: "center",
//                    y: 5,
//                    fill: "darkgreen",
//                    fontSize: 24
//                });
//                layer.add(japaneseText);


//                var problemText = new Konva.Text({
//                    text: englishWithBlank,
//                    width: stage.width(),
//                    align: "center",
//                    y: 25,
//                    fill: "darkblue",
//                    fontSize: 24
//                });
//                layer.add(problemText);


                var sentakushisArray = buildSentakushiBlocks({
                    sentakushi: choices,
                    correctIndex: english.correctAnswerIndex,
//                    problemText: problemText,
                    stage: stage
                });


                ball.targets(sentakushisArray);
            }


            function buildSentakushiBlocks(options) {


                var totalSentakushisWidth = 0;
                var sentakushisArray = [];


                (options.sentakushi).forEach(function (word, index) {


                    // creating the new text object
                    var choice = new Konva.Text({
                        text: word,
                        y: 30,
                        fontSize: 18,
                        fontFamily: options.fontFamily || "Meiryo"
                    });


                    // marking this as the correct answer, if it really is
                    if (index === options.correctIndex) {
                        choice.isCorrectAnswer = true;
                    }


                    // adding the choice to the layer, and noting its width
                    layer.add(choice);
                    totalSentakushisWidth += choice.width();


                    // adding the choice to the sentakushisArray
                    sentakushisArray.push(choice);
                });


                var blankSpace = (options.stage).width() - totalSentakushisWidth;
                var spaceBetweenWords = blankSpace / (sentakushisArray.length + 1);
                var wordsWidth = 0;


                sentakushisArray.forEach(function (thing, index) {
                    var newX = spaceBetweenWords * (index + 1) + wordsWidth;
                    thing.x(newX);
                    wordsWidth += thing.width();
                });


                layer.draw();


                return sentakushisArray;
            }


//            function makeText(inputs) {
//                var text = new Konva.Text({
//                    text: inputs.text,
//                    width: stage.width(),
//                    align: "center",
//                    y: inputs.y || 5,
//                    fill: inputs.fill || "darkblue",
//                    fontSize: inputs.fontSize || 24
//                });
//                layer.add(text).draw();
//                return text;
//            }


            function checkHitResult(blockHit) {
                return blockHit.isCorrectAnswer;
            }
        }
);