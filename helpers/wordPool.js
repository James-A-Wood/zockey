


define(
        ["tools"],
        function (tools) {


            return function (inputs) {


                /*
                 * 
                 *      inputs.baseArray - (REQUIRED) array of words to cycle through
                 *      inputs.shuffle - (optional) whether or not to shuffle the baseArray
                 *      
                 *      
                 */


                // exiting gracefully on inappropriate input
                if (!inputs || !inputs.baseArray || !Array.isArray(inputs.baseArray)) {
                    console.log("tools.wordPool requires an object with array property 'baseArray'!");
                    return;
                }


                // copying the array so we're not messing with the original
                var baseArrayCopy = inputs.baseArray.concat();


                // shuffling the array by default, unless inputs shuffle is set to FALSE)
                if (inputs.shuffle !== true) {
                    baseArrayCopy = tools.shuffle(baseArrayCopy);
                }


                // the array to be whittled down and then replenished (by copying the baseArrayCopy)
                var whittleArray = baseArrayCopy.concat();


                function getNextWord() {


                    // returning the first word of the array
                    var wordToReturn = whittleArray.shift();


                    // replenishing the array if it's now empty
                    if (whittleArray.length === 0) {
                        whittleArray = baseArrayCopy.concat();
                    }


                    // returning the word
                    return wordToReturn;
                }


                function getArrayOf(number) {


                    // exiting gracefully
                    if (!number || isNaN(number)) {
                        console.log("tools.wordPool.getArrayOf() takes a number!");
                        return;
                    }


                    var array = [];
                    for (var i = 0; i < number; i++) {
                        var nextWord = getNextWord();
                        array.push(nextWord);
                    }


                    return array;
                }




                return {
                    getNextWord: getNextWord,
                    getAllWords: function () {
                        return baseArrayCopy;
                    },
                    getArrayOf: getArrayOf
                };
            };

        });