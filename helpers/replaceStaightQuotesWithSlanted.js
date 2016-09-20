
/* 
 *
 *  
 *      Takes a jQuery reference to a text input and
 *      
 *      replaces straight quotes with slanted (both single and double),
 *      
 *      and also trims white space
 * 
 * 
 */

define(
        [
            "jquery"
        ],
        function ($) {
            return function ($input, settings) {


                // scrubbing input
                if (!$input) {
                    console.log("replaceStaightQuotesWithSlanted requires a jQuery reference to an id passed in!");
                    return false;
                }


                // setting defaults
                var defaults = $.extend({
                    doubleQuotes: "”",
                    singleQuote: "’",
                    trim: true
                }, settings || {});


                // saving the $input value
                var value = $input.val();


                // replacing straight quotes with slanted ones (single and double), and trimming white space
                value = value.replace(/\'/g, defaults.singleQuote);
                value = value.replace(/\"/g, defaults.doubleQuotes);
                value = defaults.trim ? value.trim() : value;


                // putting the scrubbed value back into the input
                $input.val(value);


                // returning the new, scrubbed value
                return value;

            };
        }
);
