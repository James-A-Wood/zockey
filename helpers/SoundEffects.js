



define(
        [
            "jquery",
            "howler"
        ],
        function ($) {


            return function (inputs) {


                // checking inputs
                if (!inputs || typeof inputs !== "object" || !inputs.container || !inputs.sounds || Object.keys(inputs.sounds).length < 1) {
                    console.log("SoundEffects got some bad inputs!");
                    return false;
                }


                // setting the defaults, and merging them with the inputs
                var settings = $.extend({
                    playThisOnCheckboxCheck: true,
                    checkByDefault: true,
                    label: {},
                    checkBoxTextAlign: "right"
                }, inputs || {});


                // an object to hold the names of the sounds to play, and their urls
                var sounds = {};


                // building the checkbox input and label
                var $soundEffectsCheckboxHolder = $("<div id='sound-effects-checkbox-holder' />").css({
                    textAlign: settings.checkBoxTextAlign
                });
                var $checkbox = $("<input type='checkbox' id='sound-effects-checkbox'/>");
                var $label = $("<label/>").attr({for : "sound-effects-checkbox"}).text("効果音").css({
                    fontWeight: settings.label.fontWeight || "lighter",
                    fontSize: settings.label.fontSize || "12px",
                    marginLeft: settings.label.marginLeft || "10px"
                });


                $soundEffectsCheckboxHolder.append($checkbox, $label);
                (settings.container).append($soundEffectsCheckboxHolder);


                // preparing the sounds, using new Howl objects
                addSounds(settings.sounds);


                // checking the checkbox, if specified (default is true)
                if (settings.checkByDefault) {
                    $checkbox.attr({checked: true});
                }


                // checking the checkbox plays the sound
                if (settings.playThisOnCheckboxCheck) {
                    $checkbox.on("change", function () {
                        play(settings.playThisOnCheckboxCheck);
                    });
                }


                function play(thisSound) {

                    if ($("#sound-effects-checkbox").is(":checked")) {
                        if (sounds[thisSound]) {
                            sounds[thisSound].play();
                        }
                    }
                }


                function pause(thisSound) {
                    if (sounds[thisSound]) {
                        sounds[thisSound].pause();
                    }
                }


                function addSounds(soundObjects) {


                    Object.keys(soundObjects).forEach(function (thisSound) {


                        // returning here if there is a name but no sound file passed in
                        if (!soundObjects[thisSound]) {
                            return;
                        }


                        // adding the sound to the sounds object
                        sounds[thisSound] = new Howl({
                            urls: [soundObjects[thisSound]]
                        });
                    });
                }


                // finally, returning the play function
                this.play = play;
                this.addSounds = addSounds;
                this.pause = pause;
                this.areOn = function () {
                    return $("#sound-effects-checkbox").is(":checked");
                };
            };
        }
);