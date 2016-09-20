/* 
 * 
 * 
 * 
 *      JavaScript for the user_settei!
 *      
 * 
 */


define(
        [
            "jquery",
            "tools",
            "helpers/playAudioOnClick",
            "jqueryui"
        ],
        function ($, tools, playAudioOnClick) {


            var rows = (function () {


                tools.page.restoreScroll();
                tools.page.rememberScroll();


                // getting the template from the html markup
                var $rowTemplate = $("#words-table").find(".row-template").removeClass("row-template").detach();


                function sendReorderRequest() {


                    var array = [];


                    // adding the vocab_ids from each of the rows to the array
                    $("#words-table").find(".item-row").each(function () {
                        var id = $(this).data("vocab_id");
                        array.push(id);
                    });


                    $.getJSON("tangocho_stuff", {
                        job: "set_junban",
                        array: array
                    }).done(renumber).fail(function (d) {
                        console.log(d);
                    });
                }


                function addNew(pairs) {


                    pairs.forEach(function (thisPair) {


                        $("body").addClass("has-words");


                        var $row = $rowTemplate.clone().data("vocab_id", thisPair.id).addClass("item-row");


                        $row.find(".english").text(thisPair.english);
                        $row.find(".japanese").text(thisPair.japanese);
                        $row.find(".audio-td").data("audioFileName", thisPair.audioFileName);


                        // wiring up the delete button on the new row
                        $row.find(".button-holder").click(function () {
                            if (window.confirm("\n" + thisPair.english + "・" + thisPair.japanese + " を\n\n削除するの？")) {
                                remove(thisPair.id);
                            }
                        });


                        // adding the audio symbol to any audio-td that an audioFileName attribute
                        if ($row.find(".audio-td").data("audioFileName")) {


                            // adding the has-audio class so that the symbol becomes visible
                            $row.find(".audio-td").addClass("has-audio");


                            // wiring up the glyphicon to play the sound
                            var $symbol = $row.find(".audio-td");
                            var audioFileName = $row.find(".audio-td").data("audioFileName");
                            playAudioOnClick($symbol, audioFileName);
                        }


                        // appending the newly-cloned row
                        $("#words-table").append($row);
                    });


                    // clearing the word inputs
                    $(".word-input").val("");


                    // renumber the rows
                    renumber();
                }


                function remove(id) {


                    $.getJSON("/tangocho_stuff", {
                        job: "remove_one_item",
                        id: id
                    }).done(function () {
                        $("#words-table").find("tr").filter(function () {
                            return $(this).data("vocab_id") === id;
                        }).fadeTo(200, 0, function () {

                            $(this).remove();

                            renumber();

                            // if there are no words at all, then removing "has-words" from the body 
                            if ($("#words-table").find("tr").length < 1) {
                                $("body").removeClass("has-words");
                            }
                        });
                    }).fail(function (d) {
                        console.log(d);
                    });
                }


                $("#words-table tbody").sortable({
                    items: ".sortable-row",
                    axis: "y",
                    handle: ".english",
                    helper: "clone",
                    forceHelperSize: true,
                    stop: sendReorderRequest
                });


                return {
                    addNew: addNew,
                    remove: remove
                };

            }());


            // wiring up the words-input form
            $("#words-input-form").submit(function (e) {


                e.preventDefault();


                var english = $("#english-input").val().trim();
                var japanese = $("#japanese-input").val().trim();


                var englishIsJapanese = english.match(/[\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\uff00-\uff9f\u4e00-\u9faf\u3400-\u4dbf]/);
                var japaneseIsEnglish = japanese.match(/^(?=.*[A-Z0-9])[\w.,!"'\/$ ]+$/i);
                var englishIsEnglish = english.match(/^(?=.*[A-Z0-9])[\w.,!"'\/$ ]+$/i);
                var japaneseIsJapanese = japanese.match(/[\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\uff00-\uff9f\u4e00-\u9faf\u3400-\u4dbf]/);


                var englishExists = wordAlreadyExists(english, $(".english"));
                var japaneseExists = wordAlreadyExists(japanese, $(".japanese"));

                var englishTooLong = english.length > 20 ? true : false;
                var japaneseTooLong = japanese.length > 20 ? true : false;


                function wordAlreadyExists(text, $class) {
                    var alreadyExists = false;
                    $class.each(function () {
                        if ($(this).text() === text) {
                            alreadyExists = true;
                        }
                    });
                    return alreadyExists;
                }


                // returning if either one is blank
                if (!english || !japanese) {
                    return;
                }


                // checking to see if the words are too long
                if (englishTooLong || japaneseTooLong) {
                    $("#message-holder").text("英語または日本語が長すぎる");
                    return;
                }


                // if they're both the same language
                if ((englishIsEnglish && japaneseIsEnglish) || (englishIsJapanese && japaneseIsJapanese)) {
                    $("#message-holder").text("英語と日本語を入力しましょう");
                    return;
                }


                // if the words are identical (in either language)
                if (english === japanese) {
                    $("#message-holder").text("英語と日本語を入力しましょう");
                    return;
                }


                // if they're backwards
                if (englishIsJapanese || japaneseIsEnglish) {
                    $("#message-holder").text("英語と日本語は逆じゃない？");
                    return;
                }


                // if either word is already in the list
                if (englishExists || japaneseExists) {
                    $("#message-holder").text("その単語はすでに入力されているようです");
                    return;
                }


                $.getJSON("/tangocho_stuff", {
                    job: "add_new_item",
                    words: {
                        english: english,
                        japanese: japanese
                    }
                }).done(function (d) {
                    console.log(d);
                    rows.addNew([
                        {
                            english: d.english,
                            japanese: d.japanese,
                            audioFileName: d.audioFileName,
                            id: d.id
                        }
                    ]);
                    $("#english-input").focus();
                    $("#message-holder").text(english + "・" + japanese + " が追加されました").addClass("updated");
                }).fail(function (d) {
                    console.log("Failed!");
                    console.log(d);
                });
            });


            // retrieving all the words
            $.getJSON("/tangocho_stuff", {
                job: "get_all_words"
            }).done(function (d) {
                rows.addNew(d);
            });


            // clearing the #message-holder on key press
            $("html").keydown(function (e) {
                if ($(".word-input").is(":focus")) {
                    $("#message-holder").empty().removeClass("updated");
                }
            });


            function renumber() {


                // adding item numbers and checkmarks in the "has-audio" cells
                $(".item-row").each(function (index) {
                    $(this).find(".number-holder").text(index + 1 + ".");
                });
            }


            $("#clear-all-button").click(function () {
                if (window.confirm("本当に全部のワードをクリアするの？", "")) {
                    $.getJSON("/tangocho_stuff", {
                        job: "clear_all_words"
                    }).done(function () {
                        $("#words-table").find("tr").remove();
                        $("body").removeClass("has-words");
                    }).fail(function (e) {
                        console.log("Error in trying to delete all the words!");
                        console.log(e);
                    });
                }
            });


        }
);

