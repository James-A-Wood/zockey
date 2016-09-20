


/* 
 * 
 *      Adds a scoreBox floating in the upper right of the screen,
 *      showing the number done and the number of mistakes
 *      
 *      Pegs to the bottom on mobile, or to the upper-right on desktop
 * 
 */


define(
        [
            "jquery",
            "tools"
        ],
        function ($, tools) {

            return function (inputs) {


                var isMobile = tools.isMobile() && window.innerWidth < 500;


                var defaults = {
                    topBuffer: isMobile ? "0px" : "10px",
                    backgroundColor: "darkblue",
                    top: isMobile ? null : "100px",
                    right: isMobile ? null : "10px",
                    padding: "10px 20px",
                    color: "white",
                    fontSize: "14px",
                    finishedLabel: "残り: ",
                    mistakesLabel: "間違い: ",
                    numberProblems: 0,
                    showOnLoad: false
                };
                $.extend(defaults, inputs || {});


                // base styling, for the div when floating (i.e., the page hasn't scrolled much)
                var floatingStyling = {
                    position: isMobile ? "fixed" : "absolute",
                    width: isMobile ? "100%" : null,
                    top: isMobile ? null : defaults.top,
                    bottom: isMobile ? 0 : null,
                    right: defaults.right,
                    padding: defaults.padding,
                    color: defaults.color,
                    fontSize: defaults.fontSize,
                    backgroundColor: defaults.backgroundColor,
                    zIndex: "100"
                };


                // styling for the div when it's sticking (i.e., the page has scrolled down a bit)
                var stickyStyling = {};
                $.extend(stickyStyling, floatingStyling, {// Cool syntax!
                    position: "fixed",
                    top: isMobile ? null : defaults.topBuffer
                });


                // appending the floating-score-box to the html element itself
                $("html").append("<div id='floating-score-box' class='floating-score-box'></div>");
                $("#floating-score-box").css(floatingStyling);


                // appending stuff inside the box
                $("#floating-score-box").append("<div id='floating-score-number-done'>" + defaults.finishedLabel + defaults.numberProblems + " of " + defaults.numberProblems + "</div")
                        .append("<div id='floating-score-number-mistakes'>" + defaults.mistakesLabel + " 0</div");


                // styling the inner divs
                $("#floating-score-box").find("div").css({
                    fontSize: defaults.fontSize,
                    display: isMobile ? "inline-block" : "block"
                });


                if (isMobile) {
                    $("#floating-score-number-mistakes").css({
                        float: "right"
                    });
                }


                // marking the distance from the top
                var originalDistanceFromTop = $(".floating-score-box").offset().top;


                // setting the previous state
                var previousState = floatingStyling;


                // wiringup scroll monitoring
                $(window).scroll(function () {


                    // saving how far the page has scrolled
                    var windowTop = $(window).scrollTop() + parseInt(defaults.topBuffer);


                    // getting the current state
                    var currentState = (windowTop > originalDistanceFromTop) ? stickyStyling : floatingStyling;


                    // only switching styles if there's been a change
                    if (currentState !== previousState) {


                        // assigning the proper object, either 'stickyStyling' or 'floatingStyling'
                        $("#floating-score-box").css(currentState);


                        // marking the previous state
                        previousState = currentState;

                    }
                });


                var setBoxDisplayState = (function () {

                    var boxDisplayState = defaults.showOnLoad ? 1 : 0;
                    $("#floating-score-box").css({opacity: boxDisplayState});


                    return function () {
                        if (boxDisplayState === 0) {
                            boxDisplayState = 1;


                            // different behaviour for mobile and desktop
                            if (!isMobile) {
                                $("#floating-score-box").fadeTo(500, 1);
                            } else {
                                $("#floating-score-box").css({
                                    bottom: "-50px",
                                    opacity: 1
                                }).animate({
                                    bottom: 0
                                }, 500);

                            }
                        }
                    };
                }());


                $(window).on("orientationchange", function () {

                    // if it's landscape
                    if (window.orientation === 90 || window.orientation === -90) {

                    }
                });



                return {
                    markMistake: function (number) {
                        var content = defaults.mistakesLabel + number;
                        $("#floating-score-number-mistakes").empty().html(content);
                        setBoxDisplayState();
                    },
                    markCorrect: (function () {

                        var totalFinished = 0;

                        return function () {

                            setBoxDisplayState();

                            totalFinished += 1;

                            var numberLeft = defaults.numberProblems - totalFinished;

                            var content = defaults.finishedLabel + numberLeft + " of " + defaults.numberProblems;

                            $("#floating-score-number-done").empty().html(content);
                        };
                    }())
                };
            };
        }
);