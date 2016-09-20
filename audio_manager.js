/* 
 * 
 * 
 *      JavaScript for the Audio Manager page!
 * 
 * 
 */



define(
        [
            "jquery",
            "tools",
            "helpers/replaceStaightQuotesWithSlanted",
            "helpers/playAudioOnClick",
            "jqueryui"
        ],
        function ($, tools, replaceStraightQuotesWithSlanted, playAudioOnClick) {


            $(function () {


                var lastIDloaded;
                var $audioManagerTable = $("#audio-manager-table");
                var $rowMaster = $audioManagerTable.find(".my-template").removeClass("my-template").detach();
                var $triggerMaster = $("#load-next-trigger").removeClass("my-template").detach();


                // making the ajax call to retrieve the data
                retrieveData();
                function retrieveData(input) {


                    // if there's no input, then just creating an empty object
                    input = input || {};


                    // removing any old loadTriggers
                    $("#load-next-trigger").remove();


                    // preparing the data to send
                    var url = "/audio_manager_stuff";
                    var sendData = {
                        job: "retrieve_data",
                        below: input.belowID,
                        searchText: $("#search-text-input").val()
                    };


                    // making the AJAX call
                    $.getJSON(url, sendData).done(function (d) {


                        // building a new row for each item in the returned array
                        d.forEach(buildNewRow);
                    }).fail(function (d) {
                        console.log("Load error!");
                        console.log(d);
                    });
                }


                function buildNewRow(thisAudio, index, array) {


                    // cloning the masterRow
                    var $newRow = $rowMaster.clone();


                    // NEW TEST
                    $newRow.find(".text_name").text(thisAudio.text_name);
                    $newRow.find(".problem_group_name").text(thisAudio.problem_group_name);
                    $newRow.data("audio_id", thisAudio.id);


                    // wiring up the ID to click select the whole row when double-clicked
                    $newRow.find(".audio-id").text(thisAudio.id).dblclick(function () {
                        $(this).closest("tr").toggleClass("selected");
                    });


                    // adding the English text to the text input
                    $newRow.find(".audio-name").find("input").val(thisAudio.name);


                    // wiring up the delete button
                    $newRow.find(".audio-delete").click(function () {


                        if (!window.confirm("Really delete this?")) {
                            return;
                        }


                        var ids_array = [thisAudio.id];


                        // preparing the data
                        var sendData = {
                            job: "delete_audio",
                            ids_array: ids_array
                        };


                        // making the query
                        $.post("/audio_manager_stuff", sendData).done(function (d) {
                            ids_array.forEach(function (thisId) {
                                $(".data-row").filter(function () {
                                    return $(this).data("audio_id") === thisId;
                                }).fadeTo(200, 0, function () { // 200
                                    $(this).remove();
                                });
                            });
                        });
                    });


                    // wiring up the text input
                    $newRow.find(".audio-name").dblclick(function () {


                        var $input = $(this).find("input");


                        $input.removeAttr("disabled").off("blur").on("blur", function () {
                            $input.attr("disabled", true);
                        });


                        $input.off("change").change(function () {


                            $input.addClass("updating");


                            replaceStraightQuotesWithSlanted($input);


                            editText($input.val(), thisAudio, function (returnedText) {
                                $input.val(returnedText).blur();
                                $input.removeClass("updating");
                            });
                        });
                    });


                    // appending the new $newRow
                    $audioManagerTable.append($newRow);


                    // wiring up the icon to play the sound
                    playAudioOnClick($newRow.find(".audio-sound"), thisAudio.id);


                    // keeping track of the lastIDloaded
                    lastIDloaded = thisAudio.id;


                    // if it's the LAST row in this AJAX query, then adding new loadTrigger at the bottom
                    if (index >= array.length - 1) {
                        console.log("Added load trigger!");
                        addLoadTrigger();
                    }
                }


                function editText(newValue, thisAudio, callback) {


                    if (!newValue || !thisAudio || !callback) {
                        return false;
                    }


                    // trimming any white space, and seeing if we have anything leftover
                    newValue = newValue.trim();
                    if (!newValue) {
                        return;
                    }


                    var sendData = {
                        job: "edit_text",
                        new_text: newValue,
                        id: thisAudio.id
                    };


                    // making the ajax call
                    $.post("/audio_manager_stuff", sendData).done(callback);
                }


                function addLoadTrigger() {

                    var $trigger = $triggerMaster.clone();

                    $audioManagerTable.append($trigger);

                    tools.elementOnScreen($trigger, function () {
                        console.log("Triggered!");
                        retrieveData({belowID: lastIDloaded});
                    });
                }


                // NEW TEST wiring up the search box
                $("#search-text-input").change(function () {


                    // replacing quotes, but NOT trimming white space (so we can search for separate words)
                    replaceStraightQuotesWithSlanted($(this), {trim: false});


                    var text = $(this).val();
                    $("tr.data-row").remove();


                    if (text) {
                        $("body").addClass("searching-by-text");
                        lastIDloaded = null; // clearing the last ID loaded, so we reload everything from the top
                        retrieveData({searchText: text});
                    } else {
                        $("body").removeClass("searching-by-text");
                        retrieveData();
                    }


                    $(this).blur();
                });


                // whenever the search-text-input has focus, adding ".now-inputing-text" to the body
                // so that the page is grayed out
                $("#search-text-input").on("focus", function () {
                    $("body").addClass("now-inputing-text");
                }).on("blur", function () {
                    $("body").removeClass("now-inputing-text");
                });
            });
        }
);