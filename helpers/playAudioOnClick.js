


define(
        [
            "jquery",
            "tools",
            "libraries/howler"
        ],
        function ($, tools) {


            var dummyHowl = new Howl({
                urls: [],
                autoplay: true
            });


            return function ($element, audioFileName) {


                if (arguments.length !== 2) {
                    console.log("playAudioOnClick needs a jQuery element and an audioFileName passed in!");
                    return false;
                }


                // disabling any PREVIOUS click listeners
                $element.off("click");


                // NEW TEST only loading the sound once the $element is on screen
                tools.elementOnScreen($element, function () {


                    // preloading on pageload
                    var howl = new Howl({
                        urls: ["/audio/" + audioFileName + ".mp3"],
                        onplay: function () {
                            $element.off("click", playSound).css({opacity: 0.5});
                        },
                        onend: function () {
                            $element.on("click", playSound).css({opacity: 1});
                        }
                    });


                    $element.off("click", playSound).click(playSound);
                    function playSound() {
                        howl.play();
                    }
                });
            };
        }
);