




define(
        [
            "jquery",
            "tools"
        ],
        function ($, tools) {


            return function (inputs) {


                var settings = $.extend({
                    words: [], // contains the words in raw form
                    deleteAllChoices: false, // set to 'true' to delete all the choices as they're used
                    recycleProblems: false // set to "true" to recycle all the words, so they never run out
                }, inputs || {});


                // local stuff
                var english = []; // a straight array of all the English words
                var targetEnglishWord = ""; // holds the 'correct' English word
                var japaneseFor = {}; // object where English words are keys, e.g. {dog: '犬', cat: 'ネコ', ...}
                var englishFor = {}; // object where Japanese words are keys, e.g. {犬: 'dog', ネコ: 'cat', ...}
                var otherWordFor = {}; // holds English AND Japanese for ALL their Japnese and English counterparts
                var lastTargetEnglishWord = ""; // holds the previous target word, so we don't repeat the same word twice


                // converting to an array, if it's an object
                settings.words = tools.objectToArray(settings.words);


                // whittling down the array if it has more elements than number_problems
                if (settings.number_problems && settings.number_problems > 0) {
                    tools.whittleDownArray(settings.words, settings.number_problems);
                }


                // putting all the words in their arrays and objects
                settings.words.forEach(function (thisPair) {


                    var englishWord = thisPair[0];
                    var japaneseWord = thisPair[1];


                    japaneseFor[englishWord] = japaneseWord; // adding the japanese meaning to the object
                    englishFor[japaneseWord] = englishWord; // adding the english meaning to the object


                    otherWordFor[englishWord] = japaneseWord;
                    otherWordFor[japaneseWord] = englishWord;


                    english.push(englishWord); // adding the English to the array
                });


                var remainingWords = english.concat();
                var masterList = remainingWords.concat();


                function removeAnsweredWord(word) {


                    // removing the word passed in, if any...
                    if (word && remainingWords.indexOf(word) !== -1) {
                        remainingWords.splice(remainingWords.indexOf(word), 1);
                        return;
                    }


                    // ...or, if no word was passed in, then removing the targetEnglishWord
                    remainingWords.splice(remainingWords.indexOf(targetEnglishWord), 1);


                    // replenishing the list, if we're recycling the problems
                    if (remainingWords.length === 0 && settings.recycleProblems) {
                        remainingWords = masterList.concat();
                    }
                }


                function getAndDeleteChoices(numberSentakushi) {


                    // falling back on the numberSentakushi in the settings, if set
                    if (!numberSentakushi && settings.numberSentakushi) {
                        numberSentakushi = settings.numberSentakushi;
                    }


                    // default is 3
                    numberSentakushi = numberSentakushi || 3;


                    // replenishing the remainingWords, if they've run out
                    if (remainingWords.length < numberSentakushi) {
                        remainingWords.length = 0; // emptying the arry
                        remainingWords = english.concat();
                    }


                    // choosing random words & deleting them from the remainingWords array
                    var dummyChoices = (function () {
                        var array = [];
                        for (var i = 0; i < numberSentakushi; i++) {
                            var word = tools.pickOneFrom(remainingWords, true); // 'true' means delete the word
                            array.push(word);
                        }
                        return array;
                    }());


                    return dummyChoices;
                }


                function getOneCorrectAndSomeDummy(numberSentakushi) {


                    /*
                     * 
                     *  Returns an array of words with the correct choice
                     *  in the [0] slot - meaning the array is NOT SHUFFLED!
                     * 
                     */


                    // falling back on the numberSentakushi in the settings, if set
                    if (!numberSentakushi && settings.numberSentakushi) {
                        numberSentakushi = settings.numberSentakushi;
                    }


                    // default of 3
                    numberSentakushi = numberSentakushi || 3;


                    // choosing a random word to be the target answer
                    targetEnglishWord = tools.pickOneFrom(remainingWords);


                    // avoiding repeating the last word, if we have more than 2 words left
                    while ((remainingWords.length >= 2) && (targetEnglishWord === lastTargetEnglishWord)) {
                        targetEnglishWord = tools.pickOneFrom(remainingWords);
                    }


                    // remembering this targetEnglishWord
                    lastTargetEnglishWord = targetEnglishWord;


                    // making an array of candidates for the dummy choices (i.e., an array of all words WITHOUT the correct answer)
                    var dummyChoices = english.concat();
                    dummyChoices.splice(dummyChoices.indexOf(targetEnglishWord), 1);


                    // creating "fourChoices" array, with the TARGET word as its first element
                    var fourChoices = [targetEnglishWord];


                    // filling up the rest with other, random choices from the choices array
                    while (fourChoices.length < numberSentakushi) { // 4 choices by default
                        var word = tools.pickOneFrom(dummyChoices, true);
                        fourChoices.push(word);
                    }


                    // returning the four choices
                    return fourChoices; // NOT SHUFFLED, so correct answer is in the [0] slot
                }


                // properties & methods of 'vocab_list'
                return {
                    getTotalNumberProblems: function () {
                        return english.length;
                    },
                    getWordFor: function (word) {
                        return otherWordFor[word];
                    },
                    getTargetEnglish: function () {
                        return targetEnglishWord;
                    },
                    getTargetJapanese: function () {
                        return japaneseFor[targetEnglishWord];
                    },
                    getJapaneseFor: function (engWord) {
                        return japaneseFor[engWord];
                    },
                    getEnglishFor: function (japWord) {
                        return englishFor[japWord];
                    },
                    getRemainingWords: function () {
                        return remainingWords;
                    },
                    getNumberRemainingWords: function () {
                        remainingWords.length;
                    },
                    getAllEnglishWords: function () {
                        return english;
                    },
                    removeAnsweredWord: removeAnsweredWord,
                    getChoices: (settings.deleteAllChoices) ? getAndDeleteChoices : getOneCorrectAndSomeDummy
                };
            };
        }
);