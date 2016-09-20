
/*
 Contains:
 
 tools.windowHasFocus - returns whether the window has focus
 tools.refreshAferWakingFromSleep - reloads the page after waking from sleep
 tools.safelyEncodeURIComponent - encodes the URI, and also deals with question marks and apostrophes
 tools.enterKeyTriggersChangeEvent - forces the 'change' event on text inputs on Enter press
 tools.convertZenkaku - coverts between 全角 and 半角 numbers & letters, question marks and exclamation marks
 tools.whittleDownArray - removes random elements from array until it's a specific length
 tools.pickIntFrom - performs Math.floor(Math.random() * ~ ) on an array
 tools.pickOneFrom - picks one random element from an array (removing that element, optionally)
 tools.breakAtCommas - adds line breaks at commas, word breaks, or around the middle of Japanese words that are 7+ letters
 tools.numbToTouch - makes an HTML element numb to touch events (used in order to prevent the whole screen from being dragged)
 tools.shrinkFont - reduces font-size until text fits on single line
 tools.pickDarkColor - returns a random dark color, like for backgrounds (but never repeating the same color twice!)
 tools.score - handles scoring
 tools.trimAllElements - trims white space from every element of an array
 tools.shuffle - shuffles elements in an array
 tools.isMobile - returns whether device is a mobile device or not
 tools.send_results - sends results from a completed assignment to the server
 tools.clock - adds a simple clock to the specified div
 tools.showAssignmentResults - the final screen after an assignment has finished, showing time, score, and a button home...
 tools.objectToArray - changes a object to an array
 tools.click0rTouch - returns "click" on desktop and "touchstart" on mobile
 tools.fitOnOneLine - takes a line of text and shrinks the font size until it's all on one line
 tools.getFontSize - gets the font-size, parseInt'ed, on a jQuery object
 tools.showMistakenVocab - takes an object like {english: japanese} and returns string like "english(japanese), english(japanese), ..."
 tools.languageOf - returns lanague ("Japanese" or "English") of a string
 tools.fadeAndReload - fades the page momentarily before reloading it
 tools.shrinkToFit - shrinks font size of an inner div until it fits exactly inside an outer one
 tools.fixedProblemHolder
 
 
 // Stuff for retrieving problem data
 tools.folders.text - returns the 'text' folder for the current problem set
 tools.folders.assignment - returns the 'assignment' folder for the current problem set
 tools.getProblemData - retrieves data from server
 
 */


"use strict";


define = define || function () {
    //
};
define(
        [
            "jquery",
            "jqueryui"
        ],
        function ($) {


            var tools = {};


            function scoreBar(object) {


                object = object || {};


                var numProblems = 0;
                var numDone = 0;
                var $bar = object.foreground || $("#my-scorebar-foreground");
                var $scoreBarTextHolder = object.scoreBarTextHolder || $("#my-scorebar-text-holder");
                var animationDuration = object.animationDuration || 200;


                function setNumberProblems(number) {
                    numProblems = number;
                    setScoreText();
                }


                function increment() {


                    numDone += 1;


                    var percentDone = 100 * (numDone / numProblems) + "%";


                    $bar.animate({
                        width: percentDone
                    }, animationDuration);


                    setScoreText();
                }


                function setScoreText() {
                    var scoreText = numDone + " of " + numProblems;
                    $scoreBarTextHolder.text(scoreText);
                }


                return {
                    setNumberProblems: setNumberProblems,
                    increment: increment
                };
            }



            var fixedProblemHolder = (function () {


                // anal
                var $detachable = $("#detachable");
                var $detachableHolderStandard = $("#detachable-holder-standard");
                var $detachableHolderMobile = $("#detachable-holder-mobile");
                var $detachableButton = $(".detachable-button");


                return function (options) {


                    // making sure the options parameter is at least an empty object
                    options = options || {};


                    // exiting if some necessary HTML isn't there
                    if (!$detachable || !$detachableHolderMobile || !$detachableHolderStandard || !$detachableButton) {
                        console.log("Some necessary DOM element seems to be missing!");
                        return false;
                    }


                    // if we're not on mobile, then removing unnecessary elements and returning
                    if (!isMobile()) {
                        $detachableHolderMobile.remove();
                        $detachableButton.remove();
                        return false;
                    }


                    // if the #detachable div is taller than the window itself, then removing the button and exiting
                    if ($detachable.outerHeight(true) > (window.innerHeight * 1.2)) {
                        $detachableButton.remove();
                        return false;
                    }


                    if (options.remove) {
                        $detachableHolderMobile.remove();
                        $detachableButton.remove();
                        return false;
                    }


                    // wiring up the #detachable-button
                    $detachableButton.click(function () {


                        // doing something every time the button is clicked, if passed in
                        if (options.onClick) {
                            options.onClick();
                        }


                        // if the #detachable thing DOES fit on one screen, then doing it!
                        if ($detachable.parent().is($detachableHolderStandard)) {


                            $detachable.appendTo("#detachable-holder-mobile").addClass("mobile-centered");
                            $detachableHolderMobile.addClass("visible");


                            // calling any optional functions when the thing slides up
                            if (options.onSlideUp) {
                                options.onSlideUp();
                            }

                        } else {
                            $detachable.appendTo("#detachable-holder-standard").fadeTo("fast", 1).removeClass("mobile-centered");
                            $detachableHolderMobile.removeClass("visible");


                            // calling any optional functions when the thing slides down
                            if (options.onSlideDown) {
                                options.onSlideDown();
                            }
                        }
                    });
                };

            }());



            /*
             *  Returns a function that tells whether the current window has focus or not
             */
            var windowHasFocus = (function () {

                var winFocused = true; // starts true by default

                window.onfocus = function () {
                    winFocused = true;
                };

                window.onblur = function () {
                    winFocused = false;
                };

                return function () {
                    return winFocused;
                };
            }());


            function getURLParams() {


                var queryString = (window.location.href).split("?")[1];
                var urlParams = {};
                queryString.split("&").forEach(function (pair) {
                    var parts = pair.split("=");
                    var key = decodeURIComponent(parts[0]);
                    var value = decodeURIComponent(parts[1]);
                    urlParams[key] = value;
                });


                return urlParams;
            }


            function lightenElementsIncrementally(obj) {


                if (!obj || typeof obj !== "object" || !obj.elements || isNaN(obj.minOpacity)) {
                    console.log("lightenIncrementally received no params, or they're not right!");
                    return false;
                }

                var lightnessIncrement = (1 - obj.minOpacity) / obj.elements.length;
                var currentOpacity = obj.minOpacity;

                obj.elements.each(function () {
                    $(this).css({opacity: currentOpacity});
                    currentOpacity += lightnessIncrement;
                });

                return true;
            }



            /*
             * 
             *  takes a HEX color and lightens or darkens it by some amount
             *      
             */
            function adjustColor(col, amt) {

                var usePound = false;

                if (col[0] === "#") {
                    col = col.slice(1);
                    usePound = true;
                }

                var num = parseInt(col, 16);

                var r = (num >> 16) + amt;

                if (r > 255) {
                    r = 255;
                } else if (r < 0) {
                    r = 0;
                }

                var b = ((num >> 8) & 0x00FF) + amt;

                if (b > 255) {
                    b = 255;
                } else if (b < 0) {
                    b = 0;
                }

                var g = (num & 0x0000FF) + amt;

                if (g > 255) {
                    g = 255;
                } else if (g < 0) {
                    g = 0;
                }

                return (usePound ? "#" : "") + (g | (b << 8) | (r << 16)).toString(16);
            }


            /*
             * 
             *  Shrinks the font-size of an INNER div until it fits entirely inside an
             *  OUTER div.  Ideal for cards.
             * 
             */
            function shrinkToFit($inner, $outer, options) {


                // checking arguments - at least 2 jQuery elements, plus an optional third object with params
                if (arguments.length < 2 || !($inner instanceof $) || !($outer instanceof $)) {
                    console.warn("tools.shrinkToFit requires an inner and an outer jQuery element passed in!");
                    return false;
                }


                // scrubbing the options object
                options = (options && typeof options === "object") ? options : {};


                var counter = 0;
                var upperLimit = options.tryCeiling || 20;
                var shrinkIncrement = options.shrinkIncrement || 2;


                function outerHeight() {
                    return parseInt($outer.height());
                }


                function innerHeight() {
                    return parseInt($inner.height());
                }


                // actually shrinking the font
                while (innerHeight() > outerHeight() && (counter < upperLimit)) {
                    counter++;
                    var currentFontSize = parseInt($inner.css("font-size"));
                    var newFontSize = currentFontSize - shrinkIncrement;
                    $inner.css({
                        fontSize: newFontSize
                    });
                }


                return $outer;
            }


            function fadeAndReload(opacity) {
                opacity = opacity || 0.3;
                $("body").css({opacity: opacity});
                window.location.reload();
            }


            function doubleConfirm(text) {

                if (!window.confirm(text)) {
                    return false;
                }

                if (!window.confirm("** " + text + " **")) {
                    return false;
                }

                return true;
            }


            tools.page = {
                rememberScroll: function () {
                    $(window).scroll(function () {
                        sessionStorage.scrollPosition = $("body").scrollTop();
                    });
                },
                restoreScroll: function () {
                    $("body").scrollTop(sessionStorage.scrollPosition);
                }
            };


            function beCheckingForUserInteraction(object) {


                /*
                 *      object.callback = some function to call when user hasn't interacted for the interavl
                 *      object.interval (optional) = how many seconds to wait before calling the callback
                 *      
                 */


                // param scrubbing
                if (!object || typeof object !== "object" || !object.callback || typeof object.callback !== "function") {
                    console.log("tools.beCheckingForUserInput requires an object passed in with a callback property, which must be a function!");
                    return false;
                }


                // defaults to 15 seconds
                object.interval = object.interval || 15;


                var checkInterval;
                var hasFinished = false;


                // on any user interaction, clearing any old intervals and starting a new one
                function startCheckInterval() {


                    // clearing any old checkInterval instances...
                    clearTimeout(checkInterval);


                    // and creating a new one
                    checkInterval = setTimeout(function () {


                        // doing nothing if we're finished
                        if (hasFinished) {
                            return;
                        }


                        // we can only get this far ONCE because we're setting hasFinished to TRUE down here
                        object.callback();
                        hasFinished = true;
                    }, object.interval * 1000);
                }


                // adding all sorts of listeners for any sort of user input
                $("html").mousemove(startCheckInterval);
                $("html").keydown(startCheckInterval);
                $("body").on("touchstart touchmove touchend", startCheckInterval);
                $(window).scroll(startCheckInterval);


                // returning a way to manually cancel the thing
                return {
                    cancel: function () {
                        hasFinished = true;
                    }
                };
            }


            function elementOnScreen($element, callback) {


                if (arguments.length !== 2) {
                    console.log("tools.isOnScreen requires 2 parameters, a jQuery element and a callback!");
                    return false;
                }


                if ($element.length !== 1) {
                    console.log("That element doesn't exist!");
                    return false;
                }


                // wiring up the scroll listener
                $(window).on("scroll", scrollHandler);


                // calling the scrollHandler once manually AFTER it has loaded
                // necessary because the $element may not be loaded yet, like, if it's a glyphicon
                var checkInterval = setInterval(function () {
                    if ($element.offset().top !== 0 || $element.offset().top + $element.outerHeight() !== 0) {
                        clearInterval(checkInterval);
                        scrollHandler();
                    }
                }, 50);


                function scrollHandler() {


                    // getting the element's position
                    var elementTop = $element.offset().top;
                    var elementBottom = $element.offset().top + $element.outerHeight();
                    var screenBottom = $(window).scrollTop() + $(window).height();
                    var screenTop = $(window).scrollTop();


                    // removing the listener and calling the callback
                    if ((elementTop < screenBottom) && (elementBottom > screenTop)) {
                        $(window).off("scroll", scrollHandler);
                        clearInterval(checkInterval);
                        callback();
                    }
                }
            }


            function showMistakenVocab(words) {


                /*
                 *      returns a string in the format "cat (猫), dog(犬), horse(馬)"
                 */


                // setting words to a blank array, if nothing was passed in
                words = words || {};


                var keys = Object.keys(words);


                var string = "";
                keys.forEach(function (english, index) {


                    var japanese = words[english];


                    string += english + " (" + japanese + ")";


                    // adding commas after all but the final one
                    if (index < keys.length - 1) {
                        string += ", ";
                    }
                });


                return string;
            }


            function getFontSize($object) {
                if (!$object) {
                    console.log("tools.getFontSize requires a jQuery object passed in!");
                    return false;
                }
                return parseInt($object.css("font-size"));
            }


            /*
             * 
             *      Reloads the page if the computer has been asleep
             *      for more than 2 minutes
             * 
             */
            function refreshAfterWakingFromSleep(object) {


                // making the object an object, if none is passed in
                object = object || {};


                var updateInterval = object.updateInterval || 2000; // update every 2 seconds
                var maxAllowed = object.allowedSleepInterval || 120 * 1000;  // allowing 120 seconds between


                var lastTime = (new Date()).getTime();


                setInterval(function () {


                    var currentTime = (new Date()).getTime();
                    var elapsedTime = currentTime - lastTime;


                    if (elapsedTime > maxAllowed) {
                        location.reload();
                    } else {
                        lastTime = currentTime;
                    }


                }, updateInterval);
            }


            function safelyEncodeURIComponent(uri) {


                if (!uri) {
                    console.log("tools.safelyEncodeURIComponent requires a URI in the form of a string!");
                    return;
                }


                // removing  all exclamation marks and question marks, as well as their URI-encoded equivalents, globally
                uri = uri.replace(/\!/g, "");
                uri = uri.replace(/\?|%3f/gi, "");


                // globally replacing all straight single quotes (') with proper apostrophes (’)
                uri = uri.replace(/\'/g, "’");


                // returning the URI - turns out no encoding is necessary!
                return uri; // used to be encodeURIComponent(uri), but gave up because
            }


            // triggering the change event on any focussed object on Enter key down
            function enterKeyTriggersChangeEvent() {
                $("html").keydown(function (e) {
                    if (e.keyCode === 13) {
                        $(':focus').trigger("change");
                    }
                });
            }


            // converts 全角 and 半角 alphanumeric stuff, as well as ? and ! marks
            function convertZenkaku(string, direction) {


                // error checking
                if (!string) {
                    console.log("tools.convertZenkaku needs a string as the first paramter!");
                    return;
                }


                if (!direction || !(direction === "zenkaku" || direction === "hankaku")) {
                    console.log("tools.convertZenkaku takes a string either 'zenkaku' or 'hankaku', as the second paramter!");
                    return;
                }


                // 全角に
                if (direction === "zenkaku") {
                    return string.replace(/[A-Za-z0-9?!]/g, function (s) {
                        return String.fromCharCode(s.charCodeAt(0) + 0xFEE0);
                    });
                }


                // 半角に
                if (direction === "hankaku") {
                    return string.replace(/[Ａ-Ｚａ-ｚ０-９？！]/g, function (s) {
                        return String.fromCharCode(s.charCodeAt(0) - 0xFEE0);
                    });
                }
            }


            function fitOnOneLine($div) {


                // failing gracefully if the parameter is inappropriate
                if (!$div) {
                    console.log("tools.fitOnOneLine requires a jquery id of the container holding the text!");
                    return;
                }


                if ($div.text() === "") {
                    console.log("tools.fitOnOneLine received no text that needs shrinking!");
                    return;
                }


                // adding an invisible for-testing div at the bottom to measure the text in
                if ($("#fit-on-one-line-thing").length === 0) {
                    $("html").append("<div style='clear: both; opacity: 0; visibility: 0;'><span id='fit-on-one-line-thing'></span></div>");
                }


                // anal shortcut
                var $fitOnOneLineThing = $("#fit-on-one-line-thing");


                // putting the text into the $fitOnOneLineThing
                $fitOnOneLineThing.text($div.text());


                // retrieving the font-size of the original div
                var fontSize = parseInt($div.css("font-size"));


                // setting that fontSize to the $fitOnOneLineThing
                $fitOnOneLineThing.css({fontSize: fontSize});


                var safetyCounter = 0;
                while (($fitOnOneLineThing.width() > $div.parent().width() || $fitOnOneLineThing.height() > $div.parent().height()) && safetyCounter < 20) {
                    safetyCounter++;
                    fontSize -= 1;
                    $fitOnOneLineThing.css({fontSize: fontSize});
                }


                // finally, setting the font size of the original object
                $div.css({fontSize: fontSize - 2});


                return true;
            }


            function setMobileScreenWidth(width, callback) {


                // exiting if there is no meta-tag with an id of "viewport"
                if ($("#viewport").length < 1) {
                    console.log("tools.setMobileScreenWidth requires a meta tag with id='viewport'");
                    return;
                }


                // default width of 320px
                width = width || 320;


                // using the default width if the screen is smaller than 400px (so this won't apply to desktop)
                if (screen.width <= 400) {


                    // setting the screen width
                    $("#viewport").prop("content", "width = " + width + ", initial-scale=1.0, maximum-scale=1.0, user-scalable=no");


                    // executing the callback, if it's mobile and there is a callback and it is a function
                    if (callback && typeof callback === "function") {
                        callback();
                    }
                }
            }


            function pickIntFrom(array) {

                /*
                 * 
                 *      Picks a random index (integer) from an array,
                 * 
                 *      or a random int between 0 and a given number
                 * 
                 * 
                 */

                // returning if array is not included
                if (!array) {
                    console.log("tools.pickIntFrom() requires an array or a number as a parameter!");
                    return;
                }


                // returning error if the parameter is neither an array nor a number
                if (!Array.isArray(array) && isNaN(array)) {
                    console.log("tools.pickIntFrom() requires either an array or a number as a parameter!");
                    return;
                }


                // calculating random number of either the length of the array, or of the 'array' (which must really be a number) itself 
                var int = Math.floor(Math.random() * (array.length || array));


                return int;
            }


            function pickOneFrom(array, deleteChosenItem) {


                /*
                 * 
                 *      Returns a random ELEMENT from an array (not just the index integer),
                 * 
                 *      and erases that element, optionally
                 * 
                 * 
                 */


                // failing gracefully
                if (!array || !Array.isArray(array) || array.length < 1) {
                    console.log("tools.pickOneFrom requires an array passed in as the first parameter!");
                    return false;
                }


                // picking a random item
                var index = pickIntFrom(array);
                var item = array[index];


                // deleting that item, if appropriate
                if (deleteChosenItem) {
                    array.splice(index, 1);
                }


                // returning the item
                return item;
            }


            var languageOf = (function () {


                /*
                 * 
                 *      Returns "Japanese" if there are ANY Japanese characters
                 *      
                 *      in the string; otherwise, returns "English"
                 *      
                 *      
                 */


                // regex testing for Japanese hiragana, katakana, and kanji
                var japaneseLetters = /[\u3040-\u309F]|[\u30A0-\u30FF]|[\u4E00-\u9FAF]/;


                return function (string) {


                    // param checking
                    if (!string || typeof string !== "string" || string.length === 0) {
                        return "tools.languageOf requires a string passed in!";
                        return false;
                    }


                    // returning "English" or "Japanese"
                    if (japaneseLetters.test(string)) {
                        return "Japanese";
                    } else {
                        return "English";
                    }
                };
            }());


            var breakJapaneseTextAtMiddle = (function () {


                /*
                 * 
                 *      Breaks a Japanese string exactly once, around the middle
                 *      Breaks using a "<br>" tag by default, or whatever is passed in (say, "\n")
                 * 
                 */


                // Regex testing for Japanese hiragana, katakana, and kanji
                var japaneseLetters = /[\u3040-\u309F]|[\u30A0-\u30FF]|[\u4E00-\u9FAF]/;


                return function (string, breakType) {


                    breakType = breakType || "<br>"; // default is HTML <br>, nots '\n'


                    // returning the word, untouched, if it's not a Japanese word
                    if (!japaneseLetters.test(string)) {
                        return string;
                    }


                    // calculating the rough midpoint
                    var midPoint = Math.ceil(string.length / 2);


                    // inserting the break thing into the middle of the string
                    string = string.substr(0, midPoint) + breakType + string.substr(midPoint, string.length);


                    return string;
                };

            }());


            tools.breakAtCommas = function (string, maxLettersPerLine) {

                /*
                 * 
                 *      Breaks a short, one-line string into two or more lines.  Ideal for cards.
                 *      
                 *      Breaks at the spaces in English, or at Japanese commas in Japanese text.
                 *      
                 *      If there are no commas in Japanese text, then breaks arbitrarily
                 *      around the middle (middle being defined by maxLettersPerLine,
                 *      default 6)
                 *      
                 *      
                 */

                // returning if no string was passed in
                if (!string || typeof string !== "string") {
                    console.log("tools.breakAtCommas needs a string passed in!");
                    return;
                }

                // setting max default of 6 letters per line, or whatever's passed in
                maxLettersPerLine = maxLettersPerLine || 6;


                // returning if the string is too short to justify splitting
                if (string.length < maxLettersPerLine) {
                    return string;
                }


                // Regex testing for Japanese hiragana, katakana, and kanji
                var thereAreJapaneseLetters = /[\u3040-\u309F]|[\u30A0-\u30FF]|[\u4E00-\u9FAF]/;


                // if it's English, breaking at word spaces
                if (!thereAreJapaneseLetters.test(string)) {
                    string = string.replace(/\s/g, "\n"); // replace spaces with line breaks
                    return string;
                }


                // if we've got this far, it must be Japanese.  Splitting at commas
                if (string.indexOf("、") !== -1) {
                    string = string.replace(/、/g, "、\n");
                } else {
                    var midPoint = Math.ceil(string.length / 2);
                    string = string.substr(0, midPoint) + "\n" + string.substr(midPoint, string.length);
                }


                // returning the Japanese string
                return string;
            };


            function numbToTouch($element, string) {

                if (!$element) {
                    console.log("tools.numbToTouch requires a jQuery HTML element as a parameter!");
                    return;
                }

                if ($element.length < 1) {
                    console.log("tools.numbToTouch seems to have received an invalid jQuery object!");
                    return;
                }


                // disabling touchstart once, in any event
                $element.off("touchstart", disableTouch);


                // if "off" is passed in, then re-disabling touchstart
                if (string !== "off") {
                    $element.on("touchstart", disableTouch);
                }


                function disableTouch(e) {
                    if (e.touches) {
                        e = e.touches[0];
                    }
                    return false;
                }
            }


            tools.shrinkFont = function ($container, percent) {


                // failing gracefully if no DOM element was passed in
                if (!$container) {
                    console.log("tools.shrinkFont requires a jQuery DOM element as the first parameter!");
                    return;
                }


                // how much of the element to fill (default 90%)
                percent = percent || 0.9;


                // used to break out of infinite loops
                var counter = 0;
                var finalFontSize = 16; // nice, round default?


                function containerHeight() {
                    return $container.height();
                }


                function fontSize() {
                    return parseInt($container.css("font-size"));
                }


                // exiting here if it's already one line
                if (containerHeight() < fontSize() * 1.5) {
                    return true;
                }


                // exiting here if the font is already ridiculously small
                if (fontSize() < 4) {
                    return true;
                }


                // shrinking the font size
                while (containerHeight() > (fontSize() * 1.5) && counter++ < 40) {
                    finalFontSize = fontSize() - 1;
                    $container.css({fontSize: finalFontSize});
                }


                // calculating the final font size
                finalFontSize *= percent;


                $container.css({fontSize: finalFontSize});
            };


            function isMobile() {


                var ua = navigator.userAgent;


                if (ua.match(/Android/i) ||
                        ua.match(/webOS/i) ||
                        ua.match(/iPhone/i) ||
                        ua.match(/iPad/i) ||
                        ua.match(/iPod/i) ||
                        ua.match(/BlackBerry/i) ||
                        ua.match(/Windows Phone/i)) {

                    return true;
                }


                return false;
            }




            // returns 'click' if it's desktop, or 'touchstart' if it's mobile
            tools.click0rTouch = (function () {
                if (isMobile()) {
                    return "touchstart";
                }
                return "click";
            }());



            // shuffles an array's elements
            function shuffleArray(inputArray, guaranteeFirstElementIsMoved) {


                // exiting if argument is not an array
                if (!Array.isArray(inputArray)) {
                    console.log("tools.shuffle can't shuffle 'cause it's not an array!");
                    return false;
                }


                // returning the array untouched if there is only one element
                if (inputArray.length < 2) {
//                    console.log("tools.shuffle needs an array with at least two elements!");
                    return inputArray;
                }


                // copying the array so we don't mess with the original
                var arrayCopy = inputArray.slice(); // cloning the array
                var shuffledArray = [];


                while (arrayCopy.length > 0) {
                    shuffledArray.push(pickOneFrom(arrayCopy, true));
                }


                // if 'guaranteeFirstElementIsMoved' is set to true, re-shuffling if the first element hasn't changed
                if (guaranteeFirstElementIsMoved) {
                    if (shuffledArray[0] === inputArray[0]) {
                        shuffledArray = tools.shuffle(shuffledArray, true);
                    }
                }


                return shuffledArray;
            }



            // gets the x & y coordinates of mouse click or touch, relative to any offset parent
            function pointerPosition(event, offsetParent) {


                // instantiating the variables to return below
                var x, y;


                // calculating the parent's offset, if any
                var offsetLeft = offsetParent ? offsetParent.offset().left : 0;
                var offsetTop = offsetParent ? offsetParent.offset().top : 0;


                // calculating position, for either touch or click
                if (event.type === "touchstart" || event.type === "touchend") {
                    var touch = event.originalEvent.touches[0] || event.originalEvent.changedTouches[0];
                    x = touch.pageX - offsetLeft;
                    y = touch.pageY - offsetTop;
                } else {
                    x = event.pageX - offsetLeft;
                    y = event.pageY - offsetTop;
                }


                return {
                    x: x,
                    y: y
                };
            }


            function score(object) {


                var score = {
                    number_mistakes: 0,
                    time_taken: 0
                };


                // adding any other properties to the score object
                if (object && typeof object === "object") {
                    for (var key in object) {
                        score[key] = object[key];
                    }
                }


                // getting the time at the moment of instantiation
                var startTime = (new Date()).getTime();


                function incrementTimer() {
                    var currentTime = (new Date()).getTime();
                    var timeElapsed = Math.floor((currentTime - startTime) / 1000);
                    score.time_taken = timeElapsed;
                }


                score.timer = setInterval(incrementTimer, 1000);


                return score;
            }


            function objectToArray(object) {


                /* * * * * * * * * * * * * * * * * * * * * * * *
                 * 
                 * 
                 *      changes an object to an array, like this:
                 *  
                 *      {dog: 犬} --> ["dog", "犬"]
                 *      
                 *      
                 * * * * * * * * * * * * * * * * * * * * * * * * */


                // returning the object as-is if it's already an array
                if (Array.isArray(object)) {
                    return object;
                }


                // turning it into an array, if it's an object (or at least not an array)
                var array = [];

                for (var word in object) {
                    array.push([word, object[word]]);
                }

                return array;
            }


            tools.whittleDownArray = whittleDownArray;
            function whittleDownArray(array, number) {


                // exiting gracefully
                if (arguments.length !== 2) {
                    console.log("tools.whittleDownArray requires an array and an integer, in that order!");
                    return;
                }


                // if array isn't really an array...
                if (!Array.isArray(array)) {
                    console.log("tools.whittleDownArray requires an array passed in as the first parameter!");
                    return;
                }


                // if the number isn't a number...
                if (isNaN(number)) {
                    console.log("tools.whittleDownArray requires an integer passed in as the second parameter!");
                    return;
                }


                // returning the array as-is, if the number is already greater than the array length
                if (number >= array.length) {
                    return array;
                }


                // finally, whittling down the array
                while (array.length > number) {
                    var index = pickIntFrom(array);
                    array.splice(index, 1);
                }


                // returning the diminished array
                return array;
            }




            /*
             *
             *
             *  trims white space from all elements of an array, but only if the element is a string
             *  
             *  
             */
            function trimAllElements(array, options) {


                // if array is a STRING, then converting it to an ARRAY
                if (typeof array === "string") {
                    array = array.split(" ");
                }


                // exiting if argument is not an array
                if (!Array.isArray(array)) {
                    console.log("trimAll requires an array, or a string!");
                    return false;
                }


                for (var i in array) {


                    // trimming the element ONLY if it is a string
                    array[i] = (typeof array[i] === "string") ? array[i].trim() : array[i];


                    // replacing underscores with spaces, if applicable
                    if (options && options.removeUnderscores) {
                        array[i] = array[i].replace(/\_/gi, " ");
                    }
                }


                // optionally shuffling the array
                if (options && options.shuffle) {
                    array = shuffleArray(array, options.alwaysMoveFirst);
                }


                return array;
            }


            function send_results(object, callback) {


                // checking parameters
                if (arguments.length !== 2) {
                    console.log("tools.send_results didn't receive the right parameters!");
                    return false;
                }


                // adding 'computer_info' to the object
                object.computer_info = navigator.userAgent.toLowerCase();


                // NEW TEST trying to send the register request multiple times, until it finally works
                var numTries = 0;
                var registerHasSucceeded = false;
                var registerInterval = setInterval(registerSubmitted, 1000);
                registerSubmitted(); // calling once manually


                function registerSubmitted() {


                    // keeping track of the number of tries, and exiting if it's too many
                    numTries += 1;
                    if (numTries > 10) {
                        console.log("Registering the submitted didn't seem to work!");
                        clearInterval(registerInterval);
                        return false;
                    }


                    // exiting if the registration has already succeeded
                    if (registerHasSucceeded) {
                        console.log("Registration has already succeeded");
                        clearInterval(registerInterval);
                        return false;
                    }


                    // posting the submitted info
                    // NEW TEST using the "done" syntax, but leaving the "json" thing where it was.  Seems to work
                    $.post("/register_submitted", object, "json").done(function (d) {


                        clearInterval(registerInterval);


                        if (registerHasSucceeded) {
                            return false;
                        } else {
                            registerHasSucceeded = true;
                        }


                        // calling the callback
                        callback(d);


                        // if not logged in, then saving results in localStorage so we can style the buttons on the main menu
                        if (!localStorage.isLoggedIn) {


                            // retrieving the completed assignments from sessionStorage
                            var completed = sessionStorage.getItem("completedAsGuest") || {};
                            try {
                                completed = JSON.parse(completed);
                            } catch (e) {
                                completed = {};
                            }


                            // setting the current assignment to "true"
                            completed[sessionStorage.assignmentId] = "true";


                            // saving the assignment back into sessionStorage
                            sessionStorage.setItem("completedAsGuest", JSON.stringify(completed));
                        }

                    }).fail(function (d) {
                        console.log("Error in registering the submitted assignment!");
                        console.log(d);
                    });
                }
            }


            tools.folders = {assignment: function () {}};


            function clock(params) {


                /*
                 * 
                 * 
                 *  Simple clock, takes an object with 'container' element holding the 
                 *  Query reference to the div where we want the clock
                 * 
                 * 
                 * 
                 
                 
                 properties:
                 1.  container - jQuery reference to the container (REQUIRED)
                 2.  pauseStart - whether to start (optional, defaults to false)
                 
                 
                 */


                // making sure at least some parameters were passed in...
                if (!params || typeof params !== "object" || !params.container) {
                    console.log("tools.clock got some bad parameters!");
                    return false;
                }


                // defaults
                var settings = $.extend({
                    countdownFrom: 0, // counts down from this, or counts up if it's blank or if it's 0
                    onFinish: function () {
                        // stuff here
                    }
                }, params);


                // saving reference to params.container
                var $container = params.container;


                // making sure 'countdownFrom', if present, is a number...
                if (settings.countdownFrom && isNaN(settings.countdownFrom)) {
                    console.log("To use the 'countdownFrom' feature of tools.clock, 'countdownFrom' must be an INT!");
                    return;
                }


                var numSeconds = settings.countdownFrom || 0; // defaults to 0 if we're counting UP


                // the internal clock workings
                var clock = (function () {


                    // local variables
                    var countDirection = (settings.countdownFrom) ? -1 : 1; // counting up or down, depending...
                    var isRunning = false;


                    return {
                        isRunning: function (newValue) {
                            if (typeof newValue !== "undefined") {
                                isRunning = !!(newValue);
                            }
                            return isRunning;
                        },
                        updateInterval: "",
                        update: function () {
                            isRunning = true;
                            numSeconds += countDirection; // may be + or -, depending on the settings
                            var minutes = Math.floor(numSeconds / 60);
                            var seconds = numSeconds % 60;
                            if (seconds < 10) {
                                seconds = "0" + seconds;
                            }
                            $container.text(minutes + ":" + seconds);


                            // checking for finish
                            if (settings.countdownFrom && parseInt(minutes) <= 0 && parseInt(seconds) <= 0) {
                                clearInterval(clock.updateInterval);
                                if (settings.onFinish) {
                                    settings.onFinish();
                                }
                            }
                        }
                    };
                }());


                // starting the clock on instantiation, or not, depending...
                if (params.pauseStart) {
                    $container.css({visibility: "visible"}); // was 'hidden' // hiding the div and not starting the clock
                } else {
                    clock.update();
                    clock.updateInterval = setInterval(clock.update, 1000); // starting the clock
                }


                // returning a function to start the clock, if it's not already running
                return {
                    start: function () {


                        // exiting if the clock is already
                        if (clock.isRunning()) {
                            return;
                        }


                        // marking the clock as running so we don't start it twice
                        clock.isRunning(true);


                        $container.css({visibility: "visible"});
                        clock.updateInterval = setInterval(clock.update, 1000);
                    },
                    pause: function () {
                        clock.isRunning(false);
                        clearInterval(clock.updateInterval);
                    },
                    time: function () {
                        return numSeconds;
                    }
                };
            }


            // retrieves the problems from the server
            function getProblemData(callback) {


                // exiting gracefully if there is no callback, or if its's not a function
                if (!callback || typeof callback !== "function") {
                    console.log("tools.getProblemData requires a callback!");
                    return false;
                }


                // processing and returning the problem data, if present; else, ajaxing it in
                if (typeof window.ZOCKEY !== "undefined" && window.ZOCKEY.problem_data) {
                    processAndReturn(ZOCKEY.problem_data);
                } else {


                    // making the ajax call
                    $.getJSON("/get_problem_data").done(function (dataBack) {


                        // parsing stuff in the "misc" column as JSON!  If it's not proper JSON or
                        // isn't present at all, then making dataBack.misc an empty object if it's not set
                        processAndReturn(dataBack);

                    }).fail(function (dataBack) {
                        console.log("Problem in the tools.getProblemData ajax call!");
                        console.log(dataBack);
                    });
                }


                function processAndReturn(data) {


                    // processing the "misc" property on data
                    data.misc = data.misc || {};


                    try {
                        data.misc = JSON.parse(data.misc);
                    } catch (e) {
                        data.misc = {};
                    }


                    callback(data);
                }
            }


            var pickDarkColor = (function () {


                var masterColors = [
                    "navy",
                    "blue",
                    "purple",
                    "darkred",
                    "darkslateblue",
                    "indigo",
                    "darkorange",
                    "green"
                ];


                // shuffling the colors to begin
                masterColors = shuffleArray(masterColors);


                // will hold a COPY of the 'colors' array, being replenished when emptied
                var remainingColors = [];


                // removing the last color and returning it (refilling it when it's empty)
                return function () {


                    // replenishing the remainingColors if they've all been used
                    if (remainingColors.length === 0) {
                        remainingColors = masterColors.slice();
                    }


                    return remainingColors.pop();
                };
            }());


            var showAssignmentResults = (function () {


                var $resultsHolderRow = $("#results-holder").find("tr").detach();
                var $assignmentResults = $("#assignment_results").detach();


                return function (object) {


                    /*
                     * 
                     *      Takes an object with properties:
                     *      
                     *      
                     *          container: $("#jquery_name_of_container"),
                     *          data: {
                     *              label_1: label_content_1,
                     *              label_2: label_content_2
                     *          }
                     *      
                     *      
                     *      The HTML markup is included in the assignment view, undisplayed, at the bottom,
                     *      and then cloned up into the specified container
                     * 
                     * 
                     */


                    // error checking
                    if (!object || typeof object !== "object" || !object.container || !object.data) {
                        console.log("tools.showAssignmentResults received bogus parameters!");
                        return;
                    }


                    // anal
                    var $container = object.container;
                    var data = object.data;


                    // emptying the holding container, and copying the assignment_results stuff into it
                    $container.empty();


                    // appending the $assigmentResults stuff, which was detached above
                    $assignmentResults.appendTo($container).fadeTo(200, 1);


                    // moving the window to the top, in case we've scrolled down
                    $("body").scrollTop(0);


                    // displaying each item in the info (score, time_taken, etc.)
                    // also keeping track of how wide the widest label is
                    for (var item in data) {
                        var $newRow = $resultsHolderRow.clone();
                        $newRow.find(".label-holder").text(item);
                        $newRow.find(".results-content").text(data[item]);
                        $("#results-holder").append($newRow);
                    }


                    // wiring up the two endSequenceButtons
                    $(".endSequenceButton").click(function () {


                        // disabling both the buttons
                        $(".endSequenceButton").off("click");


                        // getting the message, if any, and trimming it
                        var message = $("#assignment-results-comments-textarea").val();
                        if (message) {
                            message = message.trim();
                        }


                        /// sending the message, if there's anything left after trimming
                        if (message) {


                            // disabling the textarea
                            $("#assignment-results-comments-textarea").attr("disabled", true);


                            // preparing the ajax data
                            var messageData = {
                                jobToDo: "upload_new_message",
                                sender: "user",
                                message: message
                            };


                            // sending the message
                            $.post("/chat_stuff", messageData).done(function () {
                                window.location.assign("/user_page");
                            });
                        } else {
                            window.location.assign("/user_page");
                        }
                    });


                    // notifying the user that results have been saved, or not, depending on whether the user is logged in
                    if (localStorage.isLoggedIn) {
                        $("#message-holder").append("あなたの成績は保存されました！");
                    } else {
                        $("#message-holder").append("あなたはゲストとして入っていますので、成績は保存されません。<br>成績を保存したいなら、ユーザー登録をした上で<a href='/'>ログイン</a>をしましょう。");
                    }

                };
            }());



            tools.showAssignmentResults = showAssignmentResults;
            tools.elementOnScreen = elementOnScreen;
            tools.send_results = send_results;
            tools.windowHasFocus = windowHasFocus;
            tools.getURLParams = getURLParams;
            tools.lightenElementsIncrementally = lightenElementsIncrementally;
            tools.adjustColor = adjustColor;
            tools.shrinkToFit = shrinkToFit;
            tools.fadeAndReload = fadeAndReload;
            tools.doubleConfirm = doubleConfirm;
            tools.beCheckingForUserInteraction = beCheckingForUserInteraction;
            tools.showMistakenVocab = showMistakenVocab;
            tools.getFontSize = getFontSize;
            tools.refreshAfterWakingFromSleep = refreshAfterWakingFromSleep;
            tools.safelyEncodeURIComponent = safelyEncodeURIComponent;
            tools.enterKeyTriggersChangeEvent = enterKeyTriggersChangeEvent;
            tools.convertZenkaku = convertZenkaku;
            tools.fitOnOneLine = fitOnOneLine;
            tools.setMobileScreenWidth = setMobileScreenWidth;
            tools.pickIntFrom = pickIntFrom;
            tools.pickOneFrom = pickOneFrom;
            tools.languageOf = languageOf;
            tools.breakJapaneseTextAtMiddle = breakJapaneseTextAtMiddle;
            tools.shuffle = shuffleArray;
            tools.pointerPosition = pointerPosition;
            tools.score = score;
            tools.objectToArray = objectToArray;
            tools.trimAllElements = trimAllElements;
            tools.clock = clock;
            tools.getProblemData = getProblemData;
            tools.pickDarkColor = pickDarkColor;
            tools.isMobile = isMobile;
            tools.fixedProblemHolder = fixedProblemHolder;
            tools.scoreBar = scoreBar;
            tools.numbToTouch = numbToTouch;




            // returning the tools object so it works with Require.js
            return tools;

        }
);