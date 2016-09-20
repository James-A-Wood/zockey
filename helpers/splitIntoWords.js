


/* 
 * 
 * 
 *      breaks a string (sentence) into an array of words, removing any underscores
 *      
 *      
 */


define(
        [], // no dependencies
        function () {


            return function (string, elementToBreakAt) {


                // error checking
                if (typeof string !== "string") {
                    console.log("tools.splitIntoWords requires a string as the first parameter!");
                    return;
                }


                // elementToBreakAt is a blank space (" ") by default
                elementToBreakAt = elementToBreakAt || " ";


                // breaking the string at the spaces
                var words = string.split(elementToBreakAt);


                // for every word, replacing all underscores with spaces
                words.forEach(function (word, index, originalArray) {
                    originalArray[index] = word.replace(/\_/g, " ");
                });


                // returning the array
                return words;
            };

        });
