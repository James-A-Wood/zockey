/* 
 * 
 * 
 *      PRELOADS Howl objects!
 *      
 * 
 */


define(
        [
            "jquery",
            "Konva",
            "howler"
        ],
        function ($, Konva) {


            // pre-loading the play and pause icons
            $("body").append("<span class='glyphicon glyphicon-pause' style='visibility: hidden; position: absolute;'></span>");
            $("body").append("<span class='glyphicon glyphicon-play' style='visibility: hidden; position: absolute;'></span>");


            var isPlaying = false;
            var alreadyLoadedHowls = {};
            var loadProgress;
            var barWidth = 200;
            var barHeight = 4;
            var backgroundColor = "#adf";
            var foregroundColor = "#58b";
            var fontSize = 12;


            // creating an empty Howl here so that the sound will play
            // immediately on mobile (it's a long story...)
            var dummyHowl = new Howl({
                urls: [""],
                autoplay: true
            });


            return function (inputs) {


                // error checking
                if (!inputs || !inputs.wordsList || !inputs.audioFiles) {
                    console.log("AudioLoader requires an object with properties 'wordsList' and 'audioFiles'!");
                    return false;
                }


                // defaults
                var settings = $.extend({
                    loadingBarBackground: $("#gray-background"),
                    playButton: null, // *STRING* reference (not jQuery object!) to a button id (null by default)
                    playButtonClassOnPlay: "glyphicon-pause", // default
                    playButtonClassOnPause: "glyphicon-play", // default
                    container: "sound-load-progress-bar", // the id of the container for the 
                    onPlay: function () {
                        //
                    },
                    onPlayBetweenProblems: function () {
                        //
                    },
                    onIndividualSoundLoaded: function () {
                        //
                    },
                    onEnded: function () {
                        //
                    },
                    onAllLoaded: function () {
                        //
                    },
                    onLoadError: function () {
                        //
                    },
                    nowLoading: null // jQuery reference reference to an icon or symbol to show while the sound is loading
                }, inputs);


                // local variables
                var nowBetweenProblems = false;
                var audio; // will hold the current Howl instance
                var numSoundsLeftToLoad = settings.wordsList.length;
                var maxNumLoadTries = 5;


                loadProgress = (function () {


                    var $grayBackground = settings.loadingBarBackground;
                    var $message = $grayBackground.find(".message");
                    var defaultMessage = $message.html();


                    function remove(callback) {


                        $grayBackground.remove();


                        $("#" + settings.container).fadeTo(100, 0, function () {
                            $(this).remove();
                            if (callback) {
                                callback();
                            }
                        });
                    }


                    function retractWarnings() {
                        $grayBackground.hide();
                        $message.html(defaultMessage);
                    }


                    // setting up the Konva stage, layer, and the wedge master
                    var stage = new Konva.Stage({
                        height: 20, // making room for the text
                        width: 150,
                        container: settings.container
                    });
                    var layer = new Konva.Layer();
                    stage.add(layer);


                    var text = new Konva.Text({
                        text: "Loading...",
                        fill: backgroundColor,
                        fontSize: fontSize
                    });
                    layer.add(text);
                    text.y(stage.height() - text.height());


                    var background = new Konva.Rect({
                        fill: backgroundColor,
                        height: barHeight,
                        width: barWidth,
                        cornerRadius: 200
                    });
                    layer.add(background);


                    var foreground = new Konva.Rect({
                        fill: foregroundColor,
                        height: barHeight,
                        width: 2,
                        cornerRadius: 200
                    });
                    layer.add(foreground);


                    function stretch() {


                        // calculating how far to extend the bar
                        var percent = (function () {

                            var totalNumSounds = inputs.wordsList.length;
                            var numSoundsLoaded = totalNumSounds - numSoundsLeftToLoad;
                            var percent = numSoundsLoaded / totalNumSounds;

                            return percent * barWidth;
                        }());


                        // tweening the bar to its new width
                        foreground.to({
                            duration: 0.1,
                            width: percent
                        });


                        // resetting the countdown to showing the error message
                        retractWarnings();
                    }


                    return {
                        stretch: stretch,
                        remove: remove
                    };
                }());


                // loading each sound invidually
                settings.wordsList.forEach(function (thisEnglish) {


                    var counter = 0;
                    var howl;


                    // trying to load the sound every second, clearing this
                    // once it's loaded, or there's an error, 
                    // or after a certain number of times
                    // ALSO calling it once manually
                    var loadTryInterval = setInterval(function () {
                        preloadSound(thisEnglish);
                    }, 4000);
                    preloadSound(thisEnglish);


                    function preloadSound(thisEnglish) {


                        // anally saving the English file name to load
                        var audioFile = inputs.audioFiles[thisEnglish];


                        // exiting after certain number of tries
                        counter++;
                        if (counter > maxNumLoadTries) {
                            console.log("Failed to load '" + thisEnglish + "' after " + counter + " tries!");
                            clearInterval(loadTryInterval);
                            settings.onLoadError();
                            return;
                        }


                        // loading the new howl, if it doesn't already exist
                        howl = new Howl({
                            urls: [audioFile],
                            onload: function () {


                                // keeping track of how many sounds are left to load
                                numSoundsLeftToLoad--;


                                // exiting here if the sound has already been loaded, for whatever reason
                                if (alreadyLoadedHowls.hasOwnProperty(thisEnglish)) {
                                    return;
                                }


                                // adding the new howl to the object, with the 
                                // English word/sentence itself as the key
                                alreadyLoadedHowls[thisEnglish] = howl;


                                // clearing the interval so it stops trying to load the sound every two seconds
                                clearInterval(loadTryInterval);


                                // adjusting the length of the bar
                                loadProgress.stretch();


                                // do this when each individual sound is loaded
                                settings.onIndividualSoundLoaded();


                                // calling the callback if all the sounds have been loaded
                                if (numSoundsLeftToLoad === 0) {
                                    loadProgress.remove(function () {
                                        settings.onAllLoaded();
                                    });
                                }
                            },
                            onplay: function () {

                                isPlaying = true;

                                if (settings.onPlay) {
                                    settings.onPlay();
                                }

                                if (settings.nowLoading) {
                                    settings.nowLoading.hide();
                                }

                                if (settings.playButton) {
                                    $("#" + settings.playButton).removeClass(settings.playButtonClassOnPause).addClass(settings.playButtonClassOnPlay);
                                }

                            },
                            onend: function () {

                                isPlaying = false;

                                if (settings.playButton) {
                                    $("#" + settings.playButton).removeClass(settings.playButtonClassOnPlay).addClass(settings.playButtonClassOnPause);
                                }

                                settings.onEnded();
                            },
                            onloaderror: function () {
                                console.log("Load error on " + inputs.english + ".mp3");
                            }
                        });
                    }
                });


                function isNowBetweenProblems(setToThis) {


                    // setting the value of "nowBetweenProblems", if passed in, to either True or False, and then returning it
                    if (typeof setToThis !== "undefined") {
                        nowBetweenProblems = setToThis;
                    }


                    // returning the current value, whether it was changed or not
                    return nowBetweenProblems;
                }


                function play(wordToPlay) {


                    // exiting here if the word is currently playing
                    if (isPlaying) {
                        return;
                    }


                    // setting isPlaying to true
                    isPlaying = true;


                    // playing the word that was passed in, or using settings.getWordToPlay() to retrieve it
                    wordToPlay = wordToPlay || settings.getWordToPlay();


                    // setting the global audio thing...
                    audio = alreadyLoadedHowls[wordToPlay];


                    // playing the sound, if it exists
                    if (audio) {
                        audio.play();
                    }
                }


                function stopAll() {
                    if (audio && audio.stop) {
                        audio.stop();
                        isPlaying = false;
                    }
                }


                function startButtonMode() {
                    if (settings.playButton) {
                        $("#" + settings.playButton).removeClass("btn-primary btn-success").addClass("btn-danger").text("Start");
                    }
                }


                return {
                    isNowBetweenProblems: isNowBetweenProblems,
                    getNumLeftToLoad: function () {
                        return numSoundsLeftToLoad;
                    },
                    play: play,
                    stopAll: stopAll,
                    startButtonMode: startButtonMode,
                    onPlay: function (doThis) {
                        settings.onPlay = doThis;
                    }
                };
            };
        }
);