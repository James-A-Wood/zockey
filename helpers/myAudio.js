define(
        [
            "jquery",
            "howler",
            "jqueryui",
            "bootstrap"
        ],
        function ($) {


            // class variables, common to all instances
            var counter = 0;
//            var preloadedHowls = {};


            // preloading glyphicon-play and glyphicon-pause icons
            $("body").append("<span class='glyphicon glyphicon-volume-up'style='opacity: 0; position: absolute; visibility: hidden;' ></span>");
            $("body").append("<span class='glyphicon glyphicon-pause'style='opacity: 0; position: absolute; visibility: hidden;' ></span>");


            function makeNew(inputs) {


                // exiting if there are no inputs, or they're wonky
                if (!inputs || !inputs.container) {
                    console.log("myAudio requires an object with a 'container' key set to a jquery id!");
                    return false;
                }


                // defaults
                var settings = $.extend({
                    container: "", // REQUIRED
                    file: "",
                    playOnLoad: false,
                    spaceBarPlaysSound: false,
                    buttonColor: "btn-primary", // must be a Bootstrap button color string, e.g. "btn-success"
                    buttonWidth: "60px",
                    buttonHeight: "15px",
                    class: "", // an extra class to assign to the button
                    fontSize: null,
                    ballColor: "#666",
                    ballRounded: true,
                    ballRadius: 5,
                    ballTrackingInterval: 200,
                    barColor: "#eee",
                    barHeight: 6,
                    barMargins: "0px 20px",
                    barRounded: true,
                    barShadow: false,
                    barWidth: 200,
                    progressBar: false,
                    progressBarContainer: null,
                    defaultPlayDelay: 0,
                    onPlay: null, // a function to call when the sound is played
                    onEnded: null // a function to call after the sound has played
                }, inputs);


                // private instance variables
                var currentTime = 0;
                var isPaused = true;
                var audioDuration = 0;
                var playDisabled = false;
                var $playButton;
                var $bar;
                var $ball;
                var $barTotalLength;
                var ballPosition;


                var $thisAudio;


//                if (preloadedHowls[settings.file]) {
//                    $thisAudio = preloadedHowls[settings.file];
//                } else {
//                    $thisAudio = new Howl({
//                        urls: [settings.file],
//                        autoplay: (settings.playOnLoad) ? true : false
//                    });
//                }


                $thisAudio = new Howl({
                    urls: [settings.file],
                    autoplay: (settings.playOnLoad) ? true : false
                }).on("load", function () {


                    if ($ball) {
                        ball.canPlay();
                        bar.canPlay();
                    }


                    audioDuration = this._duration;
                });


                // incrementing the counter, so we get uniquely named DOM elements
                counter++;


                // appending and formatting the play-button to the specified element
                settings.container.append("<div id='my-audio-play-button-" + counter + "' class='my-audio-play-button btn " + settings.buttonColor + " btn-xs " + settings.class + "'><span class='glyphicon glyphicon-volume-up'></span></div>");
                $playButton = $("#my-audio-play-button-" + counter);
                $playButton.css({
                    width: settings.buttonWidth,
                    fontSize: settings.fontSize
                });


                $playButton.find(".glyphicon").css({fontSize: "inherit"});


                // adding a progress bar, if specified
                if (settings.progressBar) {
                    addProgressBar();
                }


                var playButton = (function () {


                    function show(string) {


                        // choosing which glyphicon to use
                        var thisGlyphicon = (function () {
                            if (string === "pause") {
                                return "glyphicon glyphicon-pause";
                            }
                            return "glyphicon glyphicon-volume-up";
                        }());


                        // removing the old glyphicon ...
                        $playButton.find(".glyphicon").remove();


                        // ... and adding the new
                        $playButton.append("<span class='" + thisGlyphicon + "'></span>");
                    }


                    return {
                        show: show
                    };
                }());


                var bar = (function () {
                    return {
                        canPlay: function (number) {
                            $bar.css({opacity: number ? number : 1});
                        }
                    };
                }());


                // appending a progress bar
                function addProgressBar() {


                    // setting where to put the progress bar - in the default container with the play button, or in some other container
                    var progressBarContainer = settings.progressBarContainer ? settings.progressBarContainer : settings.container;


                    // appending the HTML markup
                    progressBarContainer.append("<span id='my-audio-progress-bar-" + counter + "'><span id='progress-ball-" + counter + "'></span></span>");
                    $bar = $("#my-audio-progress-bar-" + counter);
                    $ball = $("#progress-ball-" + counter);


                    // styling the bar and the ball
                    $bar.css({
                        display: "inline-block",
                        position: "absolute",
                        width: settings.barWidth,
                        height: settings.ballRadius * 2,
                        margin: settings.barMargins,
                        opacity: 0.5,
                        top: "50%",
                        left: 0,
                        transform: "translateY(-50%)"
                    });


                    $bar.append("<span id='my-audio-progress-bar-background-" + counter + "'></span>");
                    var $background = $("#my-audio-progress-bar-background-" + counter);
                    $background.css({
                        position: "absolute",
                        width: "100%",
                        height: settings.barHeight,
                        left: 0,
                        top: "50%",
                        transform: "translateY(-50%)",
                        boxShadow: settings.barShadow ? "1px 1px 2px #bbb inset" : null,
                        borderRadius: settings.barRounded ? "100px" : null,
                        backgroundColor: settings.barColor,
                        zIndex: -1
                    });


                    $ball.css({
                        position: "absolute",
                        left: 0,
                        backgroundColor: settings.ballColor,
                        height: settings.ballRadius * 2,
                        width: settings.ballRadius * 2,
                        borderRadius: settings.ballRounded ? settings.ballRadius * 2 + "px" : null,
                        opacity: 0.5
                    });


                    // saving barWidth (minus the ball width)
                    $barTotalLength = $bar.width() - $ball.width();


                    // wiring up the ball draggability
                    $ball.draggable({
                        containment: "parent",
                        axis: "x",
                        drag: function (event, ui) {
                            pauseSound();
                            var posX = parseInt($(ui.helper).css("left"));
                            ballPosition = posX / $barTotalLength;
                            currentTime = ballPosition * audioDuration;
                            $thisAudio.pos(currentTime);
                        }
                    });


                    // force-moving the ball when we click the 
                    $bar.click(function (e) {
                        var absolutePosition = (e.pageX - $(this).offset().left) / $barTotalLength;
                        currentTime = audioDuration * absolutePosition;
                        console.log(currentTime);
                        ball.moveBallTo(currentTime);
                    });
                }



                // wiring up the play button
                $playButton.click(function () {
                    playSound(0);
                });



                var ball = (function () {


                    if (!$ball) {
                        return;
                    }


                    var ballListener;


                    return {
                        trackAudio: function () {


                            clearInterval(ballListener);


                            ballListener = setInterval(function () {

                                currentTime = $thisAudio.pos();
                                var percentPlayed = (currentTime / audioDuration);
                                $ball.css("left", $barTotalLength * percentPlayed);

                            }, settings.ballTrackingInterval);
                        },
                        stopTracking: function () {
                            clearInterval(ballListener);
                        },
                        moveBallTo: function (position) {
                            $ball.css("left", $barTotalLength * (position / audioDuration));
                            $thisAudio.pos(position);
                        },
                        canPlay: function (number) {
                            $ball.css({opacity: number ? number : 1});
                        }
                    };
                }());


                function playSound(overridePlayDelay) {


                    // exiting if 'playDisabled' is true (like, if we want to temporarily disable the play button)
                    if (playDisabled) {
                        return;
                    }


                    if (settings.onPlay) {
                        settings.onPlay();
                    }


                    // pausing the sound if it's already playing (cool syntax!)
                    if ($thisAudio.pos() > 0 && !isPaused) {
                        pauseSound();
                        isPaused = true;
                        return;
                    }


                    // tracking the audio with the ball, if there is one
                    if ($ball) {
                        ball.trackAudio();
                    }


                    // otherwise, playing the sound
                    // using try-catch to avoid errors in IE when there are no speakers
                    try {
                        setTimeout(function () {
                            $thisAudio.play().pos(currentTime);
                            isPaused = false;
                        }, settings.defaultPlayDelay);
                    } catch (e) {
                        //
                    }


                    // showing the 'pause' icon in the playButton
                    playButton.show("pause");


                    $thisAudio.off("end").on("end", function () {


                        isPaused = false;


                        // exiting here if the button is disabled
                        if (playDisabled) {
                            return;
                        }


                        // adjusting ball position, if there is one
                        if ($ball) {


                            // turning off the listener
                            ball.stopTracking();


                            // resetting the ball to the beginning
                            ball.moveBallTo(0);
                        }


                        // resetting the currentTime
                        currentTime = 0; //audioDuration;


                        // pausing the audio so it doesn't loop
                        $thisAudio.pause();


                        playButton.show("play");
                        if (settings.onEnded) {
                            settings.onEnded();
                        }
                    });
                }


                function pauseSound() {


                    $thisAudio.pause();


                    if (!playDisabled) {
                        playButton.show("play");
                    }


                    currentTime = $thisAudio.currentTime;


                    if ($ball) {
                        ball.stopTracking();
                    }
                }


                // wiring up the space bar, if specified
                if (settings.spaceBarPlaysSound) {
                    $("html").keydown(function (e) {
                        if (e.keyCode === 32) {
                            e.preventDefault();

                            playSound();
                        }
                    });
                }


                /*
                 * 
                 *  FINALLY returning the properties and methods of the myAudio object
                 *  
                 */


                return {
                    unload: function () {
                        $thisAudio.unload();
                        $(".my-audio-play-button").off("click").remove();
                    },
                    play: function () {
                        playSound();
                        return this;
                    },
                    stop: function () {
                        pauseSound();
                        return this;
                    },
                    startButtonMode: function (callback) {


                        $playButton.text("スタート").addClass("btn-danger").on("click", function () {


                            $(this).off("click").click(playSound).removeClass("btn-danger").empty().append("<span class='glyphicon glyphicon-pause'></span>");

                            if (callback) {
                                callback();
                            }
                        });

                    },
                    // temporarily disabling the play button
                    disablePlay: function () {
                        playDisabled = true;
                        return this;
                    },
                    enablePlay: function () {
                        playDisabled = false;
                        return this;
                    },
                    // adding EXTRA stuff to be done when the play button is clicked
                    onPlay: function (func) {
                        settings.onPlay = func;
                        return this;
                    },
                    // remove triggering the play button click (e.g., when a different element is clicked)
                    triggerPlayButtonClick: function () {
                        $playButton.click();
                        return this;
                    },
                    addSuccessCheckMark: function () {
                        $playButton.addClass("btn-success btn-disabled").css({opacity: 0.5}).off("click").find(".glyphicon").replaceWith("<span class='glyphicon glyphicon-ok' style='position: relative; left: -3px;'></span>");
                        return this;
                    }

                };
            }


            // NEW TEST not using this yet
            function preload(audioFiles, callback) {


//                // loading each sound IN ITS OWN FUNCTION so they don't overlap
//                for (var english in audioFiles) {
//                    var fileName = audioFiles[english];
//                    loadThis(english, fileName);
//                }
//
//
//                function loadThis(english, audioFile) { // audioFile = "/audio/3925.mp3"
//                    preloadedHowls[english] = new Howl({
//                        urls: [audioFile],
//                        onload: function () {
//                            if (Object.keys(preloadedHowls).length === Object.keys(audioFiles).length) {
//                                callback();
//                            }
//                        }
//                    });
//                }
            }


            return {
                new : makeNew,
                preload: preload
            };
        });