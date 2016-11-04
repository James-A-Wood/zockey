define(
        [
            "jquery",
            "helpers/lineNumbering",
            "admin/assignmentBlock",
            "helpers/tools",
            "jqueryui"
        ],
        function ($, lineNumbering, assignmentBlockFactory, tools) {


            // loading in the big JSON object with defaults - 
            // function at bottom for cleaner code
            var templateDefaults = getTemplateDefaults();


            // telling the page to remember scroll in sessionStorage whenever scrolled, so we can restore it later
            tools.page.rememberScroll();


            // making numbering (and renumbering) easier
            var problemNumbers = lineNumbering(".assignment-number");
            var newAssignmentBlock;
            var $createNewAssignmentButton = $("#create-new-assignment-button");


            // common funcionality for all of the text/chapter/section icons
            var buttonFactory = (function () {


                // detaching the .folder-icon HTML from the markup so we can clone it later
                var $folderIcon = $(".my-template.folder-icon").detach().removeClass("my-template");


                // "buttonFactory" becomes this function
                return function (params) {


                    /*
                     
                     params.parent - the jQuery object to append the new icon to
                     params.class - class for the new icon to have
                     params.localStorageKey - the local storage thing in which to store the value
                     params.onClick - a function (like "retrieveDataFor") to execute when clicked
                     
                     */


                    if (!params || !params.parent || !params.class || !params.localStorageKey) {
                        return false;
                    }


                    return function (inputs) {


                        if (!inputs) {
                            console.log("buttonFactory requires an object with properties id, activeState, and name!");
                            return false;
                        }


                        var id = inputs.id;
                        var activeState = inputs.activeState;
                        var name = inputs.name;


                        // cloning from the master
                        var $button = $folderIcon.clone();


                        // adding properties to the icon
                        $button.addClass(params.class).addClass(activeState).text(name).data({
                            value: id,
                            table: params.table,
                            column: "name"
                        });


                        // appending to the parent
                        (params.parent).append($button);


                        // pre-selecting the icon, if it's stored in localStorage
                        var localKey = localStorage[params.localStorageKey];
                        if (localKey === id.toString()) {
                            $button.addClass("open");
                            $button.siblings().removeClass("open");
                        }


                        // wiring up the icon's clickability
                        $button.click(function () {


                            // when clicked, adding the "open" class, and removing "open" from all siblings
                            $(this).addClass("open").siblings().removeClass("open");


                            // emptying any .folders-rows AFTER the one clicked
                            var $thisSection = $(this).closest(".folders-row");
                            var thisSectionIndex = $(".folders-row").index($thisSection); // getting the number of this .section
                            $(".folders-row").filter(function (index) {
                                return index > thisSectionIndex;
                            }).empty();


                            // saving the id in localStorage, so we can open it again after reloading the page 
                            localStorage[params.localStorageKey] = id;


                            // calling the click function
                            if (params.onClick) {
                                params.onClick();
                            }
                        });


                        return $button;
                    };
                };
            }());


            var newTextButton = buttonFactory({
                parent: $("#texts-row"),
                class: "text-icon",
                localStorageKey: "last_text_selected",
                table: "Text",
                column: "name",
                onClick: function () {


                    // hiding the create-new-assignment-button
                    $("main").removeClass("show-assignments");
                    //                        $createNewAssignmentButton.css({visibility: "hidden"});
                }
            });


            var newChapterButton = buttonFactory({
                parent: $("#chapters-row"),
                class: "chapter-icon",
                localStorageKey: "last_chapter_selected",
                table: "Chapter",
                column: "name",
                onClick: function () {


                    $("#chapter-subtitle").removeClass("updated");


                    // hiding the create-new-assignment-button
                    $("main").removeClass("show-assignments");
                    //                        $createNewAssignmentButton.css({visibility: "hidden"});
                }
            });


            var newSectionButton = buttonFactory({
                parent: $("#sections-row"),
                class: "section-icon",
                localStorageKey: "last_section_selected",
                table: "Section",
                column: "name",
                onClick: function () {
                    $("main").addClass("show-assignments");
                    //                        $createNewAssignmentButton.css({visibility: "visible"});
                }
            });


            // kicking it off, retrieving the texts, templates, and problemGroups
            retrieveDataFor({
                table: "Text",
                id: null,
                onFinish: function (data) {


                    // setting up the assignmentBlockFactory here, and using it down below in addAssignments
                    newAssignmentBlock = assignmentBlockFactory(data, templateDefaults);


                    // populating the text-selector with options
                    data.texts.forEach(function (text) {


                        var $folder = newTextButton({
                            id: text.id,
                            activeState: null,
                            name: text.name
                        });


                        $folder.click(function () {
                            retrieveDataFor({
                                table: "Chapter",
                                id: $(this).data("value"),
                                onFinish: addChapters
                            });
                        });
                    });


                    // triggering the click event on the open one, so the next chapters are retrieved
                    $(".text-icon.open").click();
                }
            });


            var addChapters = (function () {


                var subtitlesFor = {};


                $("#chapter-subtitle").focus(function () {
                    $(this).removeClass("updated");
                }).change(function () {


                    var $this = $(this);
                    var newValue = $this.val();
                    var id = $(this).closest(".folders-holder").find(".open").data("value");


                    var data = {
                        job: "update_value",
                        changes: [
                            {
                                table: "Chapter",
                                column: "subtitle",
                                newValue: newValue,
                                id: id
                            }
                        ]
                    };


                    $.post("/admin_stuff", data, function () {


                        // if the change went through, then saving the new value so we can re-display it later
                        subtitlesFor[id] = newValue;


                        // coloring the input so we know the request went through
                        $this.addClass("updated").blur();

                    }, "json").fail(function (d) {
                        console.log("Couldn't change the chapter subtitle!");
                        console.log(d);
                    });
                });


                return function (data) {


                    // cycling through all of the chapter data that was returned, and building the chapter icons
                    data.forEach(function (thisChapter) {


                        var activeState = (thisChapter.active === "on") ? "" : "inactive";


                        // saving subtitle stuff
                        subtitlesFor[thisChapter.id] = thisChapter.subtitle;


                        // building the little button-icon for the current chapter
                        var $chapterIcon = newChapterButton({
                            id: thisChapter.id,
                            activeState: activeState,
                            name: thisChapter.name
                        });


                        $chapterIcon.click(function () {

                            var thisChapterID = $(this).data("value");

                            retrieveDataFor({
                                table: "Section",
                                id: thisChapterID,
                                onFinish: addSections
                            });

                            // placing the subtitle in the #chapter-subtitle input
                            $("#chapter-subtitle").val(subtitlesFor[thisChapterID]);
                        });
                    });


                    // triggering click event on any file that already has the "open" class
                    $(".chapter-icon.open").click();
                };
            }());


            function addSections(data) {


                // appending the options to the #section-selector
                Object.keys(data).forEach(function (i) {


                    var id = data[i].id;
                    var activeState = data[i].active === "off" ? "inactive" : "";
                    var name = data[i].name;


                    // giving a label to unnamed sections
                    if (!name || name === " ") {
                        name = "(unnamed section)";
                    }


                    // creating the new section
                    var $section = newSectionButton({
                        id: id,
                        activeState: activeState,
                        name: name
                    });


                    // wiring up the icon
                    $section.click(function () {

                        var value = $(this).data("value");

                        retrieveDataFor({
                            table: "Assignment",
                            id: value,
                            onFinish: addAssignments
                        });
                    });
                });


                // pre-clicking the opened section icon
                $(".section-icon.open").click();
            }


            function addAssignments(data) {


                // adding new assignment blocks
                data.forEach(function (thisAssignment) {
                    newAssignmentBlock(thisAssignment);
                });


                // numbering the problems
                problemNumbers.renumber();


                // restoring previous page scroll
                tools.page.restoreScroll();
            }


            function toggleFolderActive() {


                var $folder = $(this).closest(".folders-holder").find(".open");
                var table = $(this).closest(".folders-holder").data("table");
                var newValue = $folder.hasClass("inactive") ? "on" : "off"; // turning it "on" if it's inactive
                var id = $folder.data("value");


                var changes = {
                    table: table,
                    id: id,
                    column: "active",
                    newValue: newValue
                };


                $.post("/admin_stuff", {
                    job: "update_value",
                    changes: [changes]
                }, function () {


                    // toggling the active state
                    if (newValue === "on") {
                        $folder.removeClass("inactive");
                    } else {
                        $folder.addClass("inactive");
                    }

                }, "json").fail(function (d) {
                    console.log("Failed updaging the active state");
                    console.log(d);
                });
            }


            // wiring up sortability on ALL THREE of the button-holding rows at the top (Text, Chapter & Section)
            $(".folders-row").sortable({
                revert: 100,
                helper: "clone",
                start: function (event, ui) {
                    // adding a little to the width of the cloned item so text doesn't slide around
                    ui.helper.css("width", ui.item.outerWidth() + 1);
                },
                stop: reorder
            });


            function reorder() {


                // getting the db_ids of the .assignment-holders IN THEIR NEW ORDER!
                var ids = [];
                $(this).find(".folder-icon").each(function () {
                    var db_id = $(this).data("value");
                    ids.push(db_id);
                });


                var table = $(this).closest(".folders-holder").data("table");
                var data = {
                    job: "reorder_junban",
                    ids: ids,
                    table: table
                };


                $.post("/admin_stuff", data, function (d) {
                    //
                }, "json").fail(function (errorData) {
                    console.log("Reordering failed!");
                    console.log(errorData);
                });
            }


            // wiring up the create-new-section-button
            $("#create-new-section-button").off("click").click(function () {


                // doing nothing if no chapter has been selected
                var chapter_id = $("#chapters-holder").find(".open").data("value");


                // exiting if no chapter is selected
                if (!chapter_id) {
                    return;
                }


                var currentSectionName = $(this).closest(".folders-holder").find(".open").text();
                var name = window.prompt("What's the new section's name?", currentSectionName || "");
                var currentNumberSections = $(this).closest(".folders-holder").find(".folder-icon").length;


                // returning if no name was given
                if (!name) {
                    return;
                }


                var data = {
                    job: "create_new_section",
                    chapter_id: chapter_id,
                    name: name,
                    junban: currentNumberSections + 1
                };


                $.post("/admin_stuff", data, function (d) {


                    var $newIcon = newSectionButton({
                        id: d.id,
                        activeState: (d.active === "off") ? "inactive" : "",
                        name: d.name
                    });


                    $newIcon.click();
                }, "json");
            });


            function createNewAssignment() {


                // temporarily disabling the button so it doesn't fire twice
                $createNewAssignmentButton.off("click", createNewAssignment);


                // retrieving teh section_id from the open .sections-holder
                var section_id = $(".sections-holder").find(".open").data("value");


                // checking that we have a section_id
                if (!section_id) {
                    console.log("No section selected");
                    return false;
                }


                // sending the upate request
                $.post("/admin_stuff", {
                    job: "create_new_assignment",
                    section_id: section_id,
                    junban: $(".assignment-holder").length + 1
                }, function (d) {


                    // creating the new assignment block, and sliding it down
                    newAssignmentBlock(d, {
                        slideDown: true
                    });


                    // checking localStorage for any changes since last page refresh
                    checkForNewGroups();


                    // renumbering, in the new order
                    problemNumbers.renumber();


                    // reactivating the button
                    $createNewAssignmentButton.off("click", createNewAssignment).click(createNewAssignment);

                }, "json").fail(function (d) {
                    console.log("Error creating the new assignment!");
                    console.log(d);
                });
            }


            function retrieveDataFor(inputs) {


                // checking for appropriate inputs
                if (!inputs || typeof inputs !== "object" || !inputs.table || !inputs.onFinish || typeof inputs.onFinish !== "function") {
                    console.log("Function requires an object with properties 'table', 'id' and a function 'onFinish'!");
                }


                var dataToSend = {
                    table: inputs.table,
                    id: inputs.id
                };


                $.getJSON("/admin_get_data", dataToSend).done(function (returnedData) {
                    inputs.onFinish(returnedData);
                }).fail(function (returnedData) {
                    console.log("retrieveDataFor failed!");
                    console.log(returnedData);
                });
            }


            // wiring up the #create-new-text-button
            $("#create-new-text-button").off("click").click(function () {


                var newTextName = window.prompt("New text's name?", "");


                if (!newTextName) {
                    return;
                }


                newTextName = newTextName.trim();


                if (!newTextName) {
                    return;
                }


                $.post("/admin_stuff", {
                    job: "create_new_text",
                    name: newTextName
                }, function (returnedData) {
                    localStorage.last_text_selected = returnedData;
                    localStorage.last_chapter_selected = "";
                    localStorage.last_section_selected = "";
                    tools.fadeAndReload();
                }, "json");
            });


            $("#create-new-chapter-button").off("click").click(function () {


                var text = $(".texts-holder").find(".open").data("value");
                var numberCurrentChapters = $(this).closest(".folders-holder").find(".folder-icon").length;


                if (!text) {
                    return;
                }


                // saving reference to the text, and getting a name from the user
                var currentChapterName = $(this).closest(".folders-holder").find(".open").text();
                var newName = window.prompt("What's the new chapter's name?", currentChapterName || "");


                // returning if no name was given
                if (!newName) {
                    return;
                }


                var data = {
                    job: "create_new_chapter",
                    text: text,
                    name: newName,
                    junban: numberCurrentChapters + 1
                };


                // sending off the request
                $.post("/admin_stuff", data, function (d) {
                    localStorage.last_chapter_selected = d;
                    tools.fadeAndReload();
                }, "json");
            });


            // wiringup the #change-chapter-name button
            function renameItem($folder) {


                // getting the chapter id and the new name
                var id = $folder.data("value");
                var oldName = $folder.text();
                var table = $folder.closest(".folders-holder").data("table");
                var column = $folder.data("column");
                var newValue = window.prompt("Enter new name:", oldName);


                // returning if no name was input
                if (!newValue) {
                    return;
                }


                // preparing the data
                // NOTE changes is an ARRAY of OBJECTS, each containing the data for one change
                var data = {
                    job: "update_value",
                    changes: [{
                            table: table,
                            id: id,
                            column: column,
                            newValue: newValue
                        }]
                };


                // sending the request
                $.post("/admin_stuff", data, "json").done(function () {
                    $folder.text(newValue);
                }).fail(function (e) {
                    console.log("Couldn't make the change!");
                    console.log(e);
                });
            }


            // moving chapters to different texts
            $(".move-button").off("click").on("click", function () {


                // either removing the selector and exiting, if present ...
                if ($(".move-select").length) {
                    $(".move-select").remove();
                    return;
                }


                // ... or, building a new select
                var $moveSelect = $("<select class='move-select' />");
                var $texts = $("#texts-holder").find(".text-icon");
                $texts.each(function () {

                    var title = $(this).text();
                    var value = $(this).data("value");
                    var $option = $("<option />").text(title).val(value);
                    $moveSelect.append($option);


                    // pre-selecting the currently opened one
                    if ($(this).hasClass("open")) {
                        $option.attr("selected", true);
                    }
                });


                // wiring up the newly-created select input
                $moveSelect.off("change").on("change", function () {


                    // temporarily disabling the select
                    $moveSelect.prop("disabled", true);


                    var $chapterIcon = $("#chapters-holder").find(".chapter-icon.open");
                    var chapter_id = $chapterIcon.data("value");
                    var chapter_name = $chapterIcon.text();
                    var text_id = $(this).val();
                    var text_name = $(this).find("option:selected").text();


                    var confirmed = window.confirm("Really move \n\n" + chapter_name + " to " + text_name + " ?");
                    if (!confirmed) {
                        return;
                    }


                    var data = {
                        job: "move_element",
                        chapter_id: chapter_id,
                        text_id: text_id
                    };


                    $.post("/admin_stuff", data, function (d) {
                        if (d) {
                            window.location.reload();
                            //                                console.log(d);
                            //                                $moveSelect.remove();
                            //                                $chapterIcon.remove();
                        } else {
                            alert("Error!");
                            console.log(d);
                        }
                    }, "json");
                });


                // appending the selector AFTER the Move button
                $(this).after($moveSelect);
                return;
            });


            $("#delete-text-button").off("click").click(function () {


                // getting the id
                var $thisIcon = $(this).closest(".folders-holder").find(".open");
                var id = $thisIcon.data("value");


                // exiting here if there are no open .folders-holder elements
                if ($thisIcon.length === 0) {
                    return;
                }


                // confirming deletion - not once but twice!
                if (!tools.doubleConfirm("Really delete this text?")) {
                    return;
                }


                $.post("/admin_stuff", {
                    job: "delete_text",
                    id: id
                }, function () {
                    $thisIcon.remove();
                    tools.fadeAndReload();
                }, "json").fail(function (d) {
                    console.log("Couldn't delete the text!");
                    console.log(d);
                });
            });


            $("#delete-chapter-button").off("click").click(function () {


                // getting the id
                var $thisIcon = $(this).closest(".folders-holder").find(".open");
                var id = $thisIcon.data("value");


                // exiting here if there are no open .folders-holder elements
                if ($thisIcon.length === 0) {
                    return;
                }


                // confirming deletion - not once but twice!
                if (!tools.doubleConfirm("Really delete this chapter?")) {
                    return;
                }


                $.post("/admin_stuff", {
                    job: "delete_chapter",
                    id: id
                }, function () {
                    $thisIcon.remove();
                    tools.fadeAndReload();
                }, "json").fail(function (d) {
                    console.log("Couldn't delete the chapter!");
                    console.log(d);
                });

            });


            $("#delete-section-button").off("click").click(function () {


                var $thisIcon = $(this).closest(".folders-holder").find(".open");
                var id = $thisIcon.data("value");


                if ($thisIcon.length === 0) {
                    return;
                }


                if (!tools.doubleConfirm("Really delete this section?")) {
                    return;
                }


                $.post("/admin_stuff", {
                    job: "delete_section",
                    id: id
                }, function () {
                    $thisIcon.remove();
                }, "json").fail(function (d) {
                    console.log("Couldn't delete the section!");
                    console.log(d);
                });

            });


            // wiring up reordering & activation for the chapters
            $(".rename").off("click").click(function () {
                var $folder = $(this).closest(".folders-holder").find(".open");
                renameItem($folder);
            });


            $("#assignments-holder").sortable({
                items: ".assignment-holder",
                revert: 100,
                axis: "y",
                handle: ".assignment-number",
                helper: "clone",
                stop: function () {


                    // getting the db_ids of the .assignment-holders IN THEIR NEW ORDER!
                    var ids = [];
                    $(this).find(".assignment-holder").each(function () {
                        var db_id = $(this).data("db_id");
                        ids.push(db_id);
                    });


                    var data = {
                        job: "reorder_junban",
                        ids: ids,
                        table: "Assignment"
                    };


                    $.post("/admin_stuff", data, function () {
                        problemNumbers.renumber();
                    }, "json").fail(function (errorData) {
                        console.log("Reordering failed!");
                        console.log(errorData);
                    });
                }

            });


            // wiring up the create-new-assignment button
            $createNewAssignmentButton.off("click", createNewAssignment).click(createNewAssignment);


            // wiring up the toggle-active buttons
            $(".toggle-active").click(toggleFolderActive);


            // simple function that serves up a big JSON object - placed here at the bottom 
            // to make the code cleaner
            function getTemplateDefaults() {


                return {
                    checkboxesToShowFor: {
                        card_drop: {use_user_vocab: true},
                        vocabulary: {use_user_vocab: true},
                        card_slider: {use_user_vocab: true},
                        fill_blanks: {shuffle: true},
                        narabekae: {use_audio: false, shuffle: true},
                        narabekae_phrase: {use_audio: false, shuffle: true},
                        narabekae_waei: {use_audio: false, shuffle: true},
                        pac_man: {use_audio: true, shuffle: true},
                        scrabble: {use_audio: true, use_user_vocab: true, shuffle: true},
                        sentence_choosing: {true_false: false, use_audio: true, shuffle: true},
                        shinkei: {use_audio: true, use_user_vocab: true},
                        pachinko: {shuffle: true},
                        space: {use_user_vocab: true},
                        spelling_narabekae: {shuffle: true}
                    },
                    aliases: {
                        test_assignment: "Test Assignment",
                        blanks_drop: "Blanks Drop",
                        card_slider: "Word Slider",
                        card_drop: "Cards",
                        narabekae: "Narabekae",
                        narabekae_phrase: "Narabekae (Phrase)",
                        narabekae_waei: "Narabekae (J→E)",
                        fill_blanks: "Fill Blanks",
                        pac_man: "PacMan",
                        scrabble: "Scrabble",
                        sentence_choosing: "Sentence Choosing",
                        shinkei: "Shinkei",
                        slingshot: "Pachinko",
                        space: "Space",
                        spelling_narabekae: "Spell Narabekae",
                        vocabulary: "Vocabulary"
                    },
                    //
                    // default labels for the button labels
                    buttonLabelsFor: {
                        test_assignment: "Hello!",
                        blanks_drop: "文法・ドリル",
                        card_slider: "単語スライダー",
                        card_drop: "カルタ",
                        narabekae: "並べ替えよう",
                        narabekae_phrase: "文法・並べ替えよう",
                        narabekae_waei: "和英・並べ替え",
                        fill_blanks: "空所を埋めよう",
                        pac_man: "Pac Man",
                        scrabble: "スクラブル",
                        sentence_choosing: "意味はどっち？",
                        shinkei: "神経衰弱",
                        slingshot: "パチンコ",
                        space: "宇宙バトル",
                        spelling_narabekae: "スペル並べ替え",
                        vocabulary: "単語ドリル"
                    },
                    //
                    // whether to use the audio or not
                    hasAudio: {
                        narabekae: true,
                        fill_blanks: true,
                        pac_man: true,
                        scrabble: true,
                        sentence_choosing: true,
                        space: true,
                        vocabulary: true,
                        card_slider: true,
                        card_drop: true,
                        shinkei: true
                    },
                    hideForAll: [
                        ".checkboxes-holder"
                    ],
                    //
                    //fields that are extraneous for this template
                    fieldsToHideFor: {
                        card_slider: [
                            ".directions",
                            ".misc",
                            ".delete-assignment-button",
                            ".number-sentakushi",
                            ".number-problems"
                        ],
                        blanks_drop: [
                            ".number-sentakushi",
                            ".number-problems",
                            ".misc",
                            ".directions",
                            ".delete-assignment-button"
                        ],
                        narabekae_waei: [
                            ".number-sentakushi",
                            ".number-problems",
                            ".misc",
                            ".directions",
                            ".delete-assignment-button"
                        ],
                        vocabulary: [
                            ".misc",
                            ".number-problems",
                            ".number-sentakushi",
                            ".directions",
                            ".delete-assignment-button"
                        ],
                        scrabble: [
                            ".number-sentakushi",
                            ".number-problems",
                            ".misc",
                            ".directions",
                            ".delete-assignment-button"
                        ],
                        space: [
                            ".misc",
                            ".directions",
                            ".delete-assignment-button",
                            ".number-problems",
                            ".number-sentakushi"
                        ],
                        card_drop: [
                            ".misc",
                            ".directions",
                            ".delete-assignment-button",
                            ".delete-assignment-button"
                        ],
                        shinkei: [
                            ".number-sentakushi",
                            ".misc",
                            ".directions",
                            ".delete-assignment-button"
                        ],
                        slingshot_blanks: [
                            ".number-sentakushi",
                            ".misc",
                            ".directions",
                            ".delete-assignment-button"
                        ],
                        narabekae: [
                            ".number-sentakushi",
                            ".number-problems",
                            ".misc",
                            ".directions",
                            ".delete-assignment-button"
                        ],
                        sentence_choosing: [
                            ".misc",
                            ".directions",
                            ".number-problems",
                            ".delete-assignment-button",
                            ".number-sentakushi"
                        ],
                        fill_blanks: [
                            ".number-sentakushi",
                            ".number-problems",
                            ".misc",
                            ".directions",
                            ".delete-assignment-button"
                        ],
                        narabekae_phrase: [
                            ".number-sentakushi",
                            ".number-problems",
                            ".misc",
                            ".directions",
                            ".delete-assignment-button"
                        ],
                        spelling_narabekae: [
                            ".number-sentakushi",
                            ".number-problems",
                            ".misc",
                            ".directions",
                            ".delete-assignment-button"
                        ],
                        slingshot: [
                            ".number-sentakushi",
                            ".misc",
                            ".directions",
                            ".delete-assignment-button"
                        ]
                    }
                };
            }


            function checkForNewGroups() {


                // exiting if there's nothing in localStorage
                if (!localStorage.newlyCreatedGroups) {
                    return;
                }


                var newGroups = JSON.parse(localStorage.newlyCreatedGroups);


                // exiting if there are no newGroups
                if (!newGroups) {
                    return;
                }


                var thisText = $(".text-icon.open").data("value");
                var createdGroups = newGroups[thisText]["created"];
                var deletedGroups = newGroups[thisText]["deleted"];


                // exiting if either the group or text isn't set
                if (!newGroups || !thisText) {
                    return;
                }


                // cycling through the data-group-selectors, adding the option (if not there already)
                $(".data-group-selector").each(function () {


                    // finding whether the option already exists (it shouldn't...), and
                    // saving the currently selected option - because it's lost down below
                    var $thisSelector = $(this);
                    var $selectedOption = $thisSelector.find("option:selected");


                    // adding the NEWLY CREATED groups for THIS TEXT
                    for (var groupId in createdGroups) {
                        var optionNotThere = $thisSelector.find("option[value='" + groupId + "']").length === 0;
                        if (optionNotThere) {
                            var groupName = createdGroups[groupId];
                            var $newOptionTag = $("<option />").val(groupId).text(groupName);
                            $thisSelector.append($newOptionTag);
                        }
                    }


                    // removing the DELETED GROUPS for THIS TEXT
                    for (var groupId in deletedGroups) {
                        $thisSelector.find("option[value='" + groupId + "']").remove();
                    }


                    // SORTING THE OPTIONS (including any newly added ones) - cool!
                    var $options = $thisSelector.find("option").detach().sort(function (a, b) {
                        var text1 = $(a).text();
                        var text2 = $(b).text();
                        return (text1 > text2) ? 1 : ((text1 < text2) ? -1 : 0);
                    });
                    $thisSelector.append($options);


                    // re-selecting the previously selected option
                    $selectedOption.prop("selected", true);
                });
            }


            // retrieving any newly created groups from localStorage, so
            // we can add <options> tags dynamically when returning to the page!
            // NOTE this only works after the page has been CLICKED at least once!
            $(window).focus(checkForNewGroups);


            // toggling .show-all-options class on 
            $("#open-all-button").click(function () {


                // closing ALL if ANY are open
                if ($(".assignment-holder.all-items-showing").length) {
                    $(this).removeClass("all-open");
                    $(".assignment-holder.all-items-showing").find(".show-all-options").click();
                } else {

                    // otherwise, opening ALL
                    $(this).addClass("all-open");
                    $(".assignment-holder").not(".all-items-showing").find(".show-all-options").click();
                }
            });
        });