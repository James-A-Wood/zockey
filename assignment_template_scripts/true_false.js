




define(
        ['jquery', 'tools', 'jqueryui', 'bootstrap'],
        function ($, tools) {


            // Declaring all variables up here
            var score = tools.score();
            var myJSON;


            // importing the JSON data
            tools.getProblemData(setUpArrays);



            /*  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  */



            // setting up the arrays
            function setUpArrays(data) {


                // saving myJSON
                myJSON = data;
                myJSON.trueTerm = myJSON.trueTerm || "True";
                myJSON.falseTerm = myJSON.falseTerm || "False";

                console.log(myJSON);


                // defining the HTML markup for each problem
                var playButton = function (number) {
                    return "<button class='playButton btn btn-sm btn-primary' type='button' data-problem_number='" + (number + 1) + "'><span class='glyphicon glyphicon-play'></span></button>";
                };
                var yesButton = "<span class='yesNoButton' data-button_value='true'>" + myJSON.trueTerm + "</span>";
                var noButton = "<span class='yesNoButton' data-button_value='false'>" + myJSON.falseTerm + "</span>";
                var sentenceBox = "<span class='sentenceBox'></span>";


                // looping through all the problems, building the buttons, etc.
                for (var i = 0; i < myJSON.problem.length; i++) {

                    // stringing together the HTML elements, defined above...
                    $("#problemsHolder").append("<div>" + playButton(i) + yesButton + noButton + sentenceBox + "</div>");
                }

                // wiring up all the playButtons
                $(".playButton").on("click", problem.loadNPlay);
            }


            var problem = (function () {

                var currentProblem;
                var $this;
                var answered = {
                    allProblems: [],
                    correctly: [],
                    wrongly: []
                };

                var buttonsClickable = false;
                $("#problemAudio").on("ended", function () {
                    buttonsClickable = true;
                });
                $("#problemAudio").on("playing", function () {
                    buttonsClickable = false;
                });


                return {
                    loadNPlay: function () {

                        $this = $(this);
                        currentProblem = $this.attr("data-problem_number");


                        // loading and playing the sound

                        // FIX THIS because we're not using tools.folders any more!
                        var audioSource = tools.folders.assignment() + "/" + currentProblem + ".mp3";
                        $("#problemAudio").prop({urls: audioSource});
                        $("#problemAudio")[0].play();

                        // disabling any other buttons
                        $(".yesNoButton").off("click").removeClass("active");

                        // enabling this problem's buttons
                        $this.siblings(".yesNoButton")
                                .addClass("active")
                                .on("click", problem.checkAnswer);
                    },
                    checkAnswer: function () {

                        // exiting here if the problem has been answered already
                        if (answered.allProblems.indexOf(currentProblem) !== -1) {
                            return;
                        }

                        // exiting if the thing is not clickable
                        if (buttonsClickable === false) {
                            return;
                        }

                        // marking this problem as answered
                        answered.allProblems.push(currentProblem);

                        // saving student's answer and the real answer
                        var studentAnswer = $(this).attr("data-button_value");
                        var realAnswer = myJSON.problem[currentProblem - 1][1];
                        var sentence = myJSON.problem[currentProblem - 1][0];


                        // checking the answer
                        if (studentAnswer === realAnswer) {
                            answered.correctly.push(currentProblem);
                            markAnswer($(this), true);
                        } else {
                            answered.wrongly.push(currentProblem);
                            markAnswer($(this), false);
                        }

                        // adding the sentence
                        $(this).parent().append("<div>" + sentence + "</div>");

                        function markAnswer($this, correct) {

                            if (correct) {
                                $this.addClass("correctAnswer");
                                $this.siblings(".yesNoButton").addClass("wrongAnswer");
                                $this.siblings(".playButton").replaceWith("<span class='play-button-replacement glyphicon glyphicon-thumbs-up'></span>");
                            } else {
                                $this.addClass("wrongAnswer");
                                $this.siblings(".yesNoButton").addClass("correctAnswer");
                                $this.siblings(".playButton").replaceWith("<span class='play-button-replacement glyphicon glyphicon-thumbs-down'></span>");
                            }
                        }

                    }
                };
            }());



        });

