


/*
 * 
 *  Splits a sentence into words and returns those words in an array
 *  
 *  If there are brackets, it treats everything between those brackets as
 *  sentakushi - returns the words before and after the brackets undisturbed, but
 *  splits the bracketed words at the commas, mixes them up, and returns them with
 *  an object of the pieces, and the sentakushi, already shuffled
 *  
 */


define(
        [
            "tools"
        ],
        function (tools) {



            return function (englishSentence) {


                // checking if nothing was passed in, or if it wasn't a string
                if (!englishSentence || typeof englishSentence !== "string") {
                    console.log("processSentence didn't receive a string to process!");
                    return;
                }


                // saving whether the sentence contains open & close brackets in boolean variables
                var containsOpeningBracket = (englishSentence.indexOf("[") !== -1);
                var containsClosingBracket = (englishSentence.indexOf("]") !== -1);


                // exiting if there is only one bracket
                if (containsOpeningBracket && !containsClosingBracket) {
                    console.log("processSentence got an open bracket, but no closing bracket!");
                    return;
                }


                // exiting if there is only one bracket
                if (!containsOpeningBracket && containsClosingBracket) {
                    console.log("processSentence got a closing bracket, but no opening bracket!");
                    return;
                }


                // if there are no square brackets (meaning no sentakushi), then returning an array of ALL the words, broken at spaces, with white space trimmed
                if (!containsOpeningBracket && !containsClosingBracket) {
                    var wordBlocksArray = englishSentence.split(" ");
                    return {
                        words: tools.trimAllElements(wordBlocksArray) // trims white space from all elements of array
                    };
                }


                /*
                 * 
                 *      Beyond this point, the sentence has brackets, therefore has sentakushi
                 * 
                 */


                // if there ARE square brackets, then returning three arrays: 1) 'stuffBeforeSentakushi' 2) 'sentakushi' 3) 'stuffAfterSentakushi'
                var object = {correctAnswer: ""};
                var stuffBeforeSentakushi = englishSentence.split("[")[0].trim(); // everything before the opening square bracket
                var stuffAfterSentakushi = englishSentence.split("[")[1].split("]")[1].trim(); // everything after the last square bracket


                var sentakushi = (function () {


                    // complicated, but it works - returns everything between the brackets,
                    // split at the commas and trimmed of white space
                    var array = englishSentence.split("[")[1].split("]")[0].split(",");
                    for (var i in array) {
                        array[i] = array[i].trim();
                    }


                    // appending the correctAnswer (text) to the object.
                    object.correctAnswer = array[0];


                    // shuffling the array AFTER marking the correct answer
                    array = tools.shuffle(array) || [];


                    // returning the shuffled array
                    return array;
                }());


                // adding the properties to the method before returning it
                object.stuffBeforeSentakushi = stuffBeforeSentakushi;
                object.sentakushi = sentakushi;
                object.correctAnswerIndex = object.sentakushi.indexOf(object.correctAnswer);
                object.stuffAfterSentakushi = stuffAfterSentakushi;


                // adding a "words" property, with all the non-sentakushi words, in their original order, in an array
                object.words = (function () {

                    var before = object.stuffBeforeSentakushi.split(" ");
                    var after = object.stuffAfterSentakushi.split(" ");
                    var joined = before.concat(after);

                    joined = joined.filter(function (item) {
                        return item !== "";
                    });

                    return joined;
                }());


                object.wordsPlusSentakushi = (object.words).concat(sentakushi);


                return object;
            };



        }
);