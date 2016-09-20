/* 
 * 
 * 
 * 
 *      Wires up buttons (or whatever) to show YouTube videos overlayed on the main
 *      page.
 *      
 *      Take an array of arrays like:
 *      
 *      [
 *          [$("#button_one), "Qg2Fc1RBtuQ"],
 *          [$("#button_two), "1RBtuQQg2Fc"]
 *          
 *      ]
 *      
 *      
 *      
 */


define(
        [
            "jquery"
        ],
        function ($) {


            return function (array) {


                // error checking
                if (!array || !Array.isArray(array)) {
                    console.warning("YouTube videos.js requires an array of arrays as a parameter!");
                    return false;
                }


                // setting different dimensions, depending on screen width
                var dimensions = {};
                dimensions.width = window.innerWidth < 800 ? 320 : 640;
                dimensions.height = dimensions.width * (2 / 3);
                // cycling through, wiring up each button passed in
                array.forEach(function (array) {


                    var $thisButton = array[0];
                    var embedCode = array[1];
                    $thisButton.click(function () {


                        // adding the markup
                        $("html").append("<div id='video-background'><div id='video-holder'></div></div>");


                        // styling the video-background
                        $("#video-background").css({
                            position: "fixed",
                            top: 0,
                            right: 0,
                            width: "100%",
                            height: "100%",
                            background: "rgba(0, 0, 0, 0.5)"
                        });


                        // styling the video holder
                        $("#video-holder").css({
                            width: dimensions.width,
                            height: dimensions.height,
                            textAlign: "center",
                            position: "relative",
                            top: "10%",
                            margin: "0px auto"
                        });


                        // appending the video itself
                        $("#video-holder").append("<iframe width='" + dimensions.width + "' height='" + dimensions.height + "' src='https://www.youtube.com/embed/" + embedCode + "' frameborder='0' allowfullscreen></iframe>");


                        // clicking background removes the thing
                        $("#video-background").click(function () {
                            $(this).remove();
                        });

                    });
                });
            };
        });
