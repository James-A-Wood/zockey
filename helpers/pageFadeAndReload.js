


/* 
 * 
 * 
 *     fades the page to 0 opacity, then reloads (presumably to fade back in, gently and soothingly)
 * 
 * 
 */


define(
        ['jquery'],
        function ($) {

            return function (fadeTime, callback) {


                fadeTime = fadeTime || 200; // setting default of 200 milliseconds


                $("body").fadeTo(fadeTime, 0, function () {


                    // saving window scroll - necessary?
                    sessionStorage.scrollPosition = $("body").scrollTop();


                    // calling the. callback, if present, or just reloading
                    if (callback) {
                        callback();
                        window.location.reload();
                    } else {
                        window.location.reload();
                    }

                });

            };
        }
);
