



define(
        [
            "jquery",
            "helpers/tabFocusByArrowKey",
            "helpers/lineNumbering",
            "helpers/ajaxNotifications",
            "helpers/ctrlIJKLswapsTextInput",
            "helpers/audioFileUploader",
            "helpers/replaceStraightQuotesWithSlanted",
            "helpers/playAudioOnClick",
            "jqueryui",
            "bootstrap"
        ],
        function ($, TabFocusByArrowKey, lineNumbering, AjaxNotifications, ctrlIJKLswapsTextInput, audioFileUploader, replaceStaightQuotesWithSlanted, playAudioOnClick) {


            $(function () {


                // the little box in the upper-right that says "送信中"
                var ajax = AjaxNotifications();


                var fileUploader = audioFileUploader({
                    url: "/upload_audio_files/",
                    text_id: function () {
                        return $("#text-selector").val() || "0";
                    },
                    problem_group_id: function () {
                        return $("#group-selector").val() || "0";
                    },
                    onUpload: function () {


                        // data to send to the server
                        var data = {
                            job: "refresh_audio_data",
                            group_id: $("#group-selector").val(),
                            text_id: $("#text-selector").val()
                        };


                        // getting audio data from the server
                        $.getJSON("/problem_stuff", data).done(function (audioJSON) {


                            // looping through each row, adding the audio
                            $(".individual-problem-holder").each(function () {
                                var $row = $(this);
                                var audioFileName = audioJSON[$row.data("id")];
                                problemHolder.addAudio($row, audioFileName);
                            });
                        });
                    }
                });


                // setting sessionStorage.current_problems_group IF localStorage.current_problems_group is set!
                // NOTE: this can only happen if this page has been opened from the admin.js page!
                if (localStorage.current_text_id_from_admin_js) {
                    sessionStorage.problem_text_id = localStorage.current_text_id_from_admin_js;
                    localStorage.removeItem("current_text_id_from_admin_js");
                }


                if (localStorage.current_problems_group_from_admin_js) {
                    sessionStorage.current_problems_group = localStorage.current_problems_group_from_admin_js;
                    localStorage.removeItem("current_problems_group_from_admin_js");
                }


                // first off, setting the #text-selector to the saved value
                if (sessionStorage.problem_text_id) {
                    $("#text-selector").val(sessionStorage.problem_text_id);
                }


                if (sessionStorage.current_problems_group) {
                    $("#group-selector").val(sessionStorage.current_problems_group);
                }


                // setting the group
                var group = sessionStorage.current_problems_group || 0;


                // ajaxing in the words for this group
                loadProblemsForThisGroup(group);


                // wiring up navigation by arrow key
                // * returns a function arrowKeyNavigation.setStep() to change how many inputs to skip (different for "words" and "sentences")
                var arrowKeyNavigation = TabFocusByArrowKey({
                    class: "problem-input",
                    step: (sessionStorage.type === "words") ? 2 : 1
                });


                var lineNumbers = lineNumbering(".line-number");


                // switching between "words" and "sentences" layouts
                var displayMode = (function () {


                    function set() {


                        if (sessionStorage.type === "sentences") {


                            $("#all-problems-holder").removeClass("words");
                            $("#number-rows-to-show").removeAttr("disabled");


                            // disabling the swap-columns-button, so we can't use it in "sentences" mode
                            $("#swap-columns-button").attr("disabled", true);


                            arrowKeyNavigation.setStep(1);
                        } else {


                            $("#all-problems-holder").addClass("words");
                            $("#number-rows-to-show").val(2).trigger("change");//.attr({disabled: true});


                            // re-enabling the swap-columns-button
                            $("#swap-columns-button").attr("disabled", false);


                            arrowKeyNavigation.setStep(2);
                        }
                    }


                    function toggle() {


                        if (sessionStorage.type === "words") {
                            sessionStorage.type = "sentences";
                        } else {
                            sessionStorage.type = "words";
                        }


                        set();
                        hideEmptyRowsOnStartup();
                    }


                    function hideEmptyRowsOnStartup () {


                        // setting how many rows to display
                        var numberRowsWithValues = (function () {


                            var number = 0;


                            // cycling through all the problems, getting the highest index of any input that has a value
                            $(".individual-problem-holder").each(function () {
                                $(this).find(".problem-input").each(function (index) {
                                    if ($(this).val()) {
                                        number = Math.max(number, index);
                                    }
                                });
                            });


                            return number + 1; // adding 1 'cause it's 0-indexed
                        }());


                        $("#number-rows-to-show").val(numberRowsWithValues).trigger("change");


                        // returning here if no .individual-problem-holders have been added yet
                        if ($(".individual-problem-holder").length === 0) {
                            return;
                        }


                        // forcing "sentences" view when there are more than two values set
                        if (numberRowsWithValues > 2) {
                            sessionStorage.type = "sentences";
                        }


                        // setting the displayMode
                        displayMode.set();
                    };


                    return {
                        set: set,
                        toggle: toggle,
                        hideEmptyRowsOnStartup: hideEmptyRowsOnStartup
                    };
                }());


                var selected = (function () {


                    // its KEYS will hold references to selected items (values set to dummy values, TRUE)
                    var selected = {};


                    // wiring up the '.select-checkboxes'
                    $(document).on("change", ".select-checkbox", function () {


                        // anal shortcuts
                        var id = $(this).closest(".individual-problem-holder").attr("data-id");
                        var isChecked = $(this).is(":checked");


                        // setting to true if checked; deleting if not
                        isChecked ? (selected[id] = true) : (delete selected[id]);
                    });


                    // un-checking all .select-checkboxes, and emptying the 'selected' array
                    function clearSelected() {
                        $(".select-checkbox").prop("checked", false);
                        selected = {};
                    }


                    function selectAll() {


                        // checking off each of the select boxes, and ...
                        $(".select-checkbox").prop("checked", true).each(function () {


                            // saving the data-id in the 'selected' object
                            var id = $(this).closest(".individual-problem-holder").attr("data-id");
                            selected[id] = true;
                        });
                    }


                    return {
                        getSelected: function () {
                            return selected;
                        },
                        getSingleChecked: function () {
                            var $allSelected = $(".select-checkbox:checked");
                            if ($allSelected.length !== 1) {
                                return false;
                            }
                            return $allSelected;
                        },
                        clearSelected: clearSelected,
                        selectThis: function (id) {


                            // saving the checkbox for convenience
                            var $thisCheckbox = $(".individual-problem-holder[data-id='" + id + "']").find(".select-checkbox");


                            // checking the checkbox, if it's not checked already (and if it exists)
                            if ($thisCheckbox && !($thisCheckbox.is(":checked"))) {
                                $thisCheckbox.click();
                            }
                        },
                        toggle: function () {


                            // if any are checked, then removing the check from all
                            // or else checking them all
                            var anyBoxesAreChecked = $(".select-checkbox:checked").length > 0;
                            if (anyBoxesAreChecked) {
                                clearSelected();
                                $("#toggle-all-checkboxes").text("Check all");
                            } else {
                                selectAll();
                                $("#toggle-all-checkboxes").text("Unheck all");
                            }
                        }
                    };
                }());


                var numberRowsToShowChangeHandler = function () {


                    var numberToShow = $(this).val();


                    $(".individual-problem-holder").each(function () {

                        var inputs = $(this).find(".problem-input");

                        for (var i = 0; i < 5; i++) {

                            if (i < numberToShow) {
                                $(inputs[i]).removeClass("hidden").addClass("shown");
                            } else {
                                $(inputs[i]).removeClass("shown").addClass("hidden");
                            }
                        }
                    });
                };


                function cloneProblemButtonHandler() {


                    var $this = $(this);


                    // saving the page scroll position so we can restore it after the cloning
                    var pageScroll = $("body").scrollTop();


                    // retrieving the group from sessionStorage (as an int)
                    var group = parseInt(sessionStorage.current_problems_group);


                    // returning if no group is chosen
                    if (!group) {
                        alert("Choose a group first!");
                        return;
                    }


                    // preparing the data
                    var data = {
                        id: $this.closest(".individual-problem-holder").attr("data-id"),
                        group: parseInt(sessionStorage.current_problems_group),
                        text: $("#text-selector").val()
                    };


                    // sending the clone command to the server, reloading on success
                    $.post("/clone_problem", data).done(function (d) {


                        var $newProblemHolder = problemHolder.addNew({
                            data: d,
                            insertAfter: $this.closest(".individual-problem-holder")
                        });


                        // NEW adding audio to the NEWLY CLONED row
                        problemHolder.addAudio($newProblemHolder, d.audio[$newProblemHolder.data("id")]);


                        lineNumbers.renumber(function () {


                            // triggering the change event so that the new problem shows the correct number of rows
                            $("#number-rows-to-show").trigger("change");


                            // disabling tabbability on buttons & checkboxes
                            disableTabIndex();


                            // formatting all the rows, including this new one, for words or sentences
                            displayMode.set();


                            // resetting the page scroll position
                            $("body").scrollTop(pageScroll);
                        });
                    }).fail(function (dataBack) {
                        console.log("Error in the clone_problem post request!");
                        console.log(dataBack);
                    });
                }


                var problemHolder = (function () {


                    // removing the template from the HTML
                    var $problemRowMaster = $(".my-problem-holder-template").detach().removeClass("my-problem-holder-template");


                    function addAudio($row, audioFileName) {


                        var $audioTD = $row.find(".has-audio-td");
                        $row.removeClass("has-audio");


                        if (audioFileName) {
                            $row.addClass("has-audio");
                            playAudioOnClick($audioTD, audioFileName);
                        } else {
                            $audioTD.off("click");
                        }
                    }


                    // inputs expects properties 'data', 'fadeIn', 'insertAfter'
                    function addNew(inputs) {


                        // checking parameters
                        if (!inputs || !inputs.data || !inputs.data.id) {
                            console.log("Bad params!");
                            return false;
                        }


                        // making a fresh copy
                        var $individualProblemHolder = $problemRowMaster.clone();


                        // clicking on the cell triggers click on the .select-checkbox
                        $individualProblemHolder.find(".controls-holder-td").click(function (e) {
                            if (e.target !== this) {
                                return;
                            }
                            $(this).find(".select-checkbox").click();
                        });


                        // adding a new .individual-problem-holder, with text inputs
                        $("#all-problems-holder").append($individualProblemHolder);


                        $individualProblemHolder.attr("data-id", inputs.data.id);


                        // adding "has-audio" property if specified, which plays the sound when clicked
                        if (inputs.audioFileName) {
                            addAudio($individualProblemHolder, inputs.audioFileName);
                        }


                        // escaping any single quotes using HTML entities, 'cause quotes break the syntax below
                        for (var i = 1; i <= 5; i++) {
                            $individualProblemHolder.find(".problem-input").eq(i - 1).val(inputs.data["word" + i] || "");
                            if (inputs.data["word" + i]) {
                                inputs.data["word" + i] = inputs.data["word" + i].replace(/'/g, "&#39;");
                            }
                        }


                        // setting focus on the FIRST VISIBLE EMPTY .problem-input
                        $(".problem-input:visible").filter(function () {
                            return $(this).val() === "";
                        }).eq(0).focus();


                        // moving the newly-added row to just after some other, if specified (e.g., if it's been cloned)
                        if (inputs.insertAfter) {


                            $individualProblemHolder
                                    .detach()
                                    .insertAfter(inputs.insertAfter)
                                    .addClass("cloned-row") // NEW TEST not sure what style to give this yet!
                                    .hide()
                                    .slideDown("slow", function () {
                                        displayMode.set();
                                    });

                            setNewProblemHolderOrder();
                        }


                        return $individualProblemHolder;
                    }


                    return {
                        addNew: addNew,
                        addAudio: addAudio
                    };
                }());


                function removeBlanksHandler() {


                    // check-marking any .individual-problem-holders that are completely empty
                    $(".individual-problem-holder").each(function () {


                        var $thisInput = $(this).find(".problem-input");
                        var totalNumInputs = $thisInput.length;
                        var numBlanks = $thisInput.filter(function () {
                            return $(this).val() === "";
                        }).length;


                        if (totalNumInputs === numBlanks) {
                            $(this).find(".select-checkbox").click();
                        }
                    });


                    // finally, triggering the click event on the first of the .delete-buttons
                    var $this = $(".select-checkbox:checked").first().siblings(".delete-button");


                    deleteIndividualProblem({
                        item: $this,
                        warn: false
                    });
                }


                var updateHandler = (function () {


                    var unsentChanges = {};
                    var batchChange = false;


                    function registerChange() {


                        // analness
                        var $this = $(this);
                        var newValue = replaceStaightQuotesWithSlanted($this);
                        var column = $this.attr("data-column");
                        var id = $this.closest(".individual-problem-holder").attr("data-id");


                        // params okay?
                        if (!column || !id) { // not checking for !newValue, because it may be empty, which is okay
                            return;
                        }


                        // saving the (unsent) changes to the unsentChanges object - a three-tiered object!
                        unsentChanges[id] = unsentChanges[id] || {};
                        unsentChanges[id][column] = unsentChanges[id][column] || {};
                        unsentChanges[id][column].newValue = newValue;


                        // coloring the cell so we know it's been changed, but not sent yet
                        $this.addClass("updatePending");


                        $("#upload-changes-button").removeClass("btn-success disabled").addClass("btn-warning").text("Send changes");


                        // NEW TEST trying to call the sendChangesToServer function automatically
                        if (!batchChange) {
                            sendChangesToServer();
                        }
                    }


                    function sendChangesToServer() {


                        // disabling the batchChange mode, so changes now will be send automatically
                        batchChange = false;


                        // exiting here if are no changes to upload - if the object is empty
                        if (Object.keys(unsentChanges).length === 0) {
                            return;
                        }


                        // preparing the object to send
                        var object = {
                            changes: [], // empty here, to be populated below
                            text_id: sessionStorage.problem_text_id,
                            group_id: sessionStorage.current_problems_group
                        };


                        // cycling through values in the unsentChanges object, building an array of 
                        // objects with properties "id", "column", and "newValue",
                        // e.g. {1902: {word1: "Hello!"}}
                        for (var id in unsentChanges) {
                            for (var column in unsentChanges[id]) {


                                var newValue = unsentChanges[id][column].newValue;
                                var thisChange = {
                                    id: id,
                                    column: column,
                                    newValue: newValue
                                };


                                object.changes.push(thisChange);
                            }
                        }


                        // making the ajax call
                        ajax.showBox();
                        $.post("/update_problem_value", object).done(function (d) {


                            // parse as JSON
                            d = JSON.parse(d);


                            // bein' careful
                            if (!d || !d.savedChanges) {
                                console.log("Error updating the problem value!");
                                console.log(d);
                            }


                            // cycling through all of the changes returned from the server, and formatting the text
                            d.savedChanges.forEach(function (thisChange) {


                                var id = thisChange.id;
                                var column = thisChange.column;
                                var newValue = thisChange.newValue;
                                var $row = $(".individual-problem-holder[data-id='" + id + "']");


                                $row.find(".problem-input[data-column='" + column + "']")
                                        .val(newValue)
                                        .removeClass("updatePending")
                                        .addClass("updated");


                                // dynamically adding any audio that was returned
                                var fileName = d.audio[id];
                                problemHolder.addAudio($row, fileName);
                            });


                            // formatting the button
                            $("#upload-changes-button").removeClass("btn-warning").addClass("btn-success disabled").text("No Changes");


                            // clearing the unsentChanges object
                            unsentChanges = {};


                            // hiding the ajax box
                            ajax.hideBox();
                        }, "json").fail(function (data) {
                            console.log("update_problem_value failed!");
                            console.log(data);
                        });
                    }


                    return {
                        registerChange: registerChange,
                        sendChangesToServer: sendChangesToServer,
                        setBatchChangeMode: function () {
                            batchChange = true;
                        }
                    };
                }());


                function deleteIndividualProblem(inputs) {


                    if (!inputs || !inputs.item) {
                        console.log("deleteIndividualProblem requires an object with property 'item'!");
                        return false;
                    }


                    var $this = inputs.item;


                    // confirming
                    if (inputs.warn && !confirm("Really delete this?")) {
                        return;
                    }


                    // disabling the button so it can't be pressed twice by mistake
                    $this.prop("disabled", true);


                    // getting the database row id from the closest (= parent) individual-problem-holder
                    var $db_id = $this.closest(".individual-problem-holder").attr("data-id");


                    // remote-clicking the checkbox
                    selected.selectThis($db_id);


                    // getting all the boxes that are selected
                    var data = selected.getSelected();


                    // posting the data, then fading out and removing the row
                    $.post("/delete_problem", data).done(function () {


                        // cycling throught the (multiple?) ids in the 'data' object, and erasing those rows
                        for (var id in data) {


                            // specifying the element by its data-db attribute!  Cool!
                            // deleting the PARENT'S PARENT - kinda klugey
                            $(".individual-problem-holder[data-id='" + id + "']").fadeTo(100, 0, function () {
                                $(this).slideUp("slow", function () {


                                    // removing the element entirely once it has been slid up
                                    $(this).remove();


                                    // renumbering
                                    lineNumbers.renumber();
                                });
                            });
                        }
                    });
                }


                function tabMakesNewRow(e) {


                    // exiting if it's not the tab key, or if the shiftKey is also pressed (meaning we're tabbing BACKWARDS)
                    if (e.keyCode !== 9 || e.shiftKey) {
                        return true;
                    }


                    // getting the last word holder that is DISPLAYED!  Important!
                    var $lastWordHolder = $(".problem-input:visible").last();


                    // exiting if the last .problem-input doesn't have focus
                    if (!($lastWordHolder.is(":focus"))) {
                        return;
                    }


                    /*
                     * 
                     *      Beyond this point, the TAB key was pressed (but not Enter!), 
                     *      and the very last VISIBLE .problem-input has the focus!
                     *      
                     *      
                     */


                    // short-circuiting the default tab key behaviour
                    e.preventDefault();


                    // adding ONE new row by clicking the button, kind of
                    editor.newProblem({
                        setFocusOn: "last",
                        number: 1
                    });
                }


                function createNewGroupHandler() {


                    // getting a name for the new group
                    var name = window.prompt("New Group name?", $("#group-selector option:selected").html());
                    if (!name) {
                        return;
                    }


                    // exiting if no name was input, or it's a number
                    name = name.trim();
                    if (!name || !isNaN(name)) {
                        return;
                    }


                    if (!sessionStorage.problem_text_id) {
                        return;
                    }


                    var data = {
                        name: name,
                        text_id: sessionStorage.problem_text_id
                    };


                    $.post("/new_problem_group", data, function (group) {


                        // alerting on errors
                        if (group === -1) {
                            alert("Couldn't create group!  Duplicate name?");
                            return;
                        }


                        // adding the new option element to the selector
                        $("#group-selector").append("<option value='" + group.id + "'>" + group.name + "</option>");


                        // saving the value in session
                        sessionStorage.current_problems_group = group.id;


                        // saving the newly-created info in localStorage
                        newGroup.update("created", group.id, group.name);


                        // forcing refresh by fake-clicking the selector
                        $("#group-selector").val(group.id);


                        // same as triggering "change" event on $("#group-selector")
                        groupSelectorChangeHandler({addNewBlankRow: true});

                    }, "json").fail(function (data) {
                        console.log("Failed?");
                        console.log(data);
                    });
                }


                function loadProblemsForThisGroup(group, object) {


                    // hiding the body so we can fade it in down below
                    $("body").css({opacity: 0});


                    // setting text_id to be whatever is currently selected
                    var text_id = $("#text-selector").val();


                    // retrieving
                    // 1) data.problems for the specified group, and 
                    // 2) data.all group names for the drop-down menu
                    $.getJSON("/get_all_problems", {
                        text: text_id,
                        group: group
                    }, "json").done(function (data) {


                        // appending the default, 'Nothing selected!' option
                        $("#group-selector").empty().append("<option value='0' selected>(Select a group)</option>");


                        // adding the group names to the drop-down menu
                        data.groups.forEach(function (thisGroup) {
                            $("#group-selector").append("<option value='" + thisGroup.id + "' >" + thisGroup.name + "</option>");
                            $("#import-selector").append("<option value='" + thisGroup.id + "' >" + thisGroup.name + "</option>");
                        });


                        // pre-selecting the proper option
                        if ($("#group-selector [value='" + sessionStorage.current_problems_group + "']").length === 1) {
                            $("#group-selector").val(sessionStorage.current_problems_group);
                        }


                        // clearing the all-problems-holder
                        $("#all-problems-holder").empty();


                        // adding the rows!
                        data.problems.forEach(function (thisRow) {
                            problemHolder.addNew({
                                data: thisRow, // 'none' means 'no focus on last input'
                                audioFileName: data.audioFileNames[thisRow.id]
                            });
                        });


                        // disabling tab index on buttons & checkboxes
                        disableTabIndex();


                        // adding line numbers
                        lineNumbers.renumber();


                        // hiding empty rows
                        displayMode.hideEmptyRowsOnStartup();


                        // setting the display mode (words or sentences)
                        displayMode.set();


                        // enabling swapping
                        ctrlIJKLswapsTextInput({
                            className: "problem-input"
                        });


                        // remembering scroll position on window scroll
                        $(window).scroll(function () {
                            sessionStorage.scrollPosition = $("body").scrollTop();
                        });


                        // restoring previous page scroll position and fading in the body
                        $("body").scrollTop(sessionStorage.scrollPosition).fadeTo("fast", 1);


                        // adding a new, blank row if specified in the parameters
                        if (object && object.addNewBlankRow) {
                            editor.newProblem({number: 10});
                        }


                    }).fail(function (data) {
                        console.log("Problem getting the json data!");
                        console.log(data);
                    });

                }


                function groupSelectorChangeHandler(object) {


                    // setting the group
                    var group = $("#group-selector").val() || 0;


                    // disabling the 'Select a group' option so user can't choose it
                    $("#group-selector option[value='0']").prop("disabled", true);


                    // saving group in session
                    sessionStorage.setItem("current_problems_group", group);


                    // loading the words for this group
                    loadProblemsForThisGroup(group, object || {});
                }


                function deleteGroupButtonHandler() {


                    var session = sessionStorage.current_problems_group;
                    var selectedGroup = $("#group-selector").val();


                    // exiting if group has been chosen 
                    if (!session || !selectedGroup || session !== selectedGroup) {
                        alert("Can't delete the group!");
                        return;
                    }


                    // if not empty, double-checking that we can really throw away the words
                    if ($(".problem-input").length > 0) {


                        // confirming once
                        if (!window.confirm("Really delete, words and all?")) {
                            return;
                        }


                        // confirming twicee
                        if (!window.confirm("Really R E A L L Y delete? You'll lose all the words!")) {
                            return;
                        }
                    }


                    $.post("/delete_problem_group", {id: selectedGroup}, function (data) {


                        // exiting if anything other than 0 was returned
                        if (data !== 0) {
                            console.log("Couldn't delete the group!");
                            return;
                        }


                        // erasing the entry from localStorage
                        localStorage.newlyCreatedGroups = "";
                        sessionStorage.removeItem("current_problems_group");


                        // NEW TEST deleting the group from localStorage
                        newGroup.update("deleted", selectedGroup, false);


                        // removing the option for the deleted value
                        $("#group-selector option[value='" + selectedGroup + "']").remove();


                        // resetting group to 0
                        $("#group-selector").val(0);


                        // emptying the all-problems-holder
                        $("#all-problems-holder").empty();


                    }, "json").fail(function (data) {
                        console.log("Error in delete_problem_group!");
                        console.log(data);
                    });

                }


                function changeGroupNameButtonHandler() {


                    var oldName = $("#group-selector").find(":selected").text();
                    var name = window.prompt("New name?", oldName);


                    // exiting if there was no input, or if the input is the same as the old value
                    if (!name || name === oldName) {
                        return;
                    }


                    // preparing the data
                    var data = {
                        id: $("#group-selector").val(),
                        name: name
                    };


                    // posting the new name
                    $.post("/change_group_name", data, function (dataBack) {

                        if (dataBack === -1) {
                            console.log("Error in change_group_name!");
                            return;
                        }

                        // updating the select-box's option's text
                        $("#group-selector").find(":selected").text(dataBack.name);
                    }, "json").fail(function (data) {
                        console.log(data);
                    });
                }


                // making problems sortable
                $("#all-problems-holder").sortable({
                    revert: 100,
                    handle: ".line-number-td",
                    stop: setNewProblemHolderOrder
                });


                function setNewProblemHolderOrder() {


                    var array = [];
                    $(".individual-problem-holder").each(function () {
                        var data = {
                            id: $(this).attr("data-id"),
                            newJunban: $(this).index() + 1
                        };
                        array.push(data);
                    });


                    var data = {
                        category: "Problem", // which table to change
                        items: array // the array of ids & newJunbans
                    };


                    ajax.showBox();
                    $.post("/change_junban", data).done(function () {
                        ajax.hideBox();
                    }).fail(function (dataBack) {
                        console.log("Error in change_junban");
                        console.log(dataBack);
                    });


                    // renumbering
                    lineNumbers.renumber();
                }


                function disableTabIndex() {
                    // removing tabbability from buttons & checkboxes
                    $(".btn, input[type='checkbox']").prop({tabIndex: "-1"});
                }


                function cloneGroupButtonHandler(passedInTextID, callback) {


                    var group_id = $("#group-selector").val();
                    var text_id = passedInTextID || $("#text-selector").val();
                    var newGroupName;


                    if (!group_id) {
                        return;
                    }


                    // reusing the same text name, if we're cloning to another text
                    if (passedInTextID) {
                        newGroupName = $("#group-selector option:selected").html();
                    } else {

                        // ... or getting a new name, if we're cloning to the current text
                        newGroupName = window.prompt("New group name?", $("#group-selector option:selected").html());
                    }


                    if (!newGroupName) {
                        return;
                    }


                    var data = {
                        new_group_name: newGroupName,
                        source_group_id: group_id,
                        text_id: text_id
                    };


                    $.post("/clone_group", data).done(function (group) {


                        if (callback) {
                            callback();
                            return;
                        }


                        // adding the new option element to the selector
                        $("#group-selector").append("<option value='" + group.id + "'>" + group.name + "</option>");


                        // saving the value in session
                        sessionStorage.current_problems_group = group.id;


                        // marking the group so admin.js can access it immediately
                        newGroup.update("created", group.id, group.name);


                        // selecting the new option
                        $("#group-selector").val(group.id).trigger("change");

                    }).fail(function (dataBack) {
                        console.log("Error!");
                        console.log(dataBack);
                    });
                }


                var underscores = (function () {


                    var originalButtonText = $("#remove-underscores-button").text();


                    function remove() {


                        // removing focus from the button
                        $(this).blur();

                        var numChanged = 0;

                        $(".problem-input").each(function () {


                            var $thisInput = $(this);
                            var oldValue = $thisInput.val();
                            var newValue = oldValue.replace(/\_/g, " ");


                            // doing nothing if there are no underscores to be removed
                            if (oldValue.indexOf("_") === -1) {
                                $thisInput.removeData("underscores-removed");
                                return;
                            }


                            // saving the OLD value (with underscores) in attached data
                            numChanged++;
                            $thisInput.data("old-value", oldValue);


                            // inserting the new value (without underscores) and triggering the change event
                            $thisInput.val(newValue);
                            $thisInput.change();
                        });


                        // updating the button text, if any changes were made
                        if (numChanged > 0) {
                            $("#remove-underscores-button").text("Restore underscores");
                            $("#remove-underscores-button").off("click").click(restore);
                        }
                    }

                    function restore() {

                        // removing focus from the button, so that keybaord shortcut "Ctrl + Enter" doesn't trigger 
                        $(this).blur();

                        $(".problem-input").each(function () {

                            var $thisInput = $(this);
                            var oldValue = $thisInput.data("old-value");

                            if (oldValue) {
                                $thisInput.val(oldValue);
                                $thisInput.removeData("old-value");
                                $thisInput.change();
                            }
                        });


                        // updating the button text
                        $("#remove-underscores-button").text(originalButtonText);
                        $("#remove-underscores-button").off("click").click(remove);

                    }

                    return {
                        remove: remove
                    };
                }());


                var editor = (function () {


                    var clipboard;


                    var $activeInput;
                    $(document).on("focus", ".problem-input", function () {
                        $("#copy-button").attr("disabled", false);
                        $activeInput = $(document.activeElement);
                    }).on("blur", ".problem-input"), function () {
                        $("#copy-button").attr("disabled", true);
                    };


                    function newProblem(inputs) {


                        inputs = inputs || {};


                        // momentarily disabling the buttons
                        $("#new-problem-button, #new-problem-x10-button").attr("disabled", true);


                        makeTheseChanges({
                            job: "new_individual_problem",
                            data: {number: inputs.number},
                            ignoreActiveColumn: true,
                            onFinish: function ($selectedData, dataBack) {


                                dataBack = JSON.parse(dataBack);


                                // reenabling the buttons
                                $("#new-problem-button, #new-problem-x10-button").attr("disabled", false);


                                // adding the new row(s), one for each element in the dataBack array
                                dataBack.forEach(function (newProblemData) {
                                    problemHolder.addNew({data: newProblemData});
                                });


                                // setting focus on the LAST .problem-input, if specified (actually, the FIRST .problem-input of the last ROW)
                                if (inputs.setFocusOn === "last") {
                                    $(".problem-input").last().siblings(".problem-input").first().focus();
                                } else {
                                    $(".problem-input:visible").filter(function () {
                                        return $(this).val() === "";
                                    }).first().focus();
                                }


                                // renumbering all
                                lineNumbers.renumber(function () {


                                    // triggering the change event so that the new problem shows the correct number of rows
                                    $("#number-rows-to-show").trigger("change");


                                    // disabling tabbability on buttons & checkboxes
                                    disableTabIndex();
                                });
                            }
                        });
                    }


                    function swapColumns_1_2() {

                        makeTheseChanges({
                            job: "swap_columns",
                            thisButton: $(this),
                            confirmMessage: null,
                            ignoreActiveColumn: true,
                            // copying the values from the selected column to the NEXT column
                            onFinish: swapped
                        });


                        function swapped($selectedCells, returnedAudioData) {


                            // swapping the column values without reloading the whole page
                            $(".problem-holder-td").each(function () {


                                var $holder1 = $(this).find(".problem-input").eq(0);
                                var $holder2 = $(this).find(".problem-input").eq(1);


                                var oldVal1 = $holder1.val();
                                var oldVal2 = $holder2.val();


                                $holder1.val(oldVal2);
                                $holder2.val(oldVal1);
                            });


                            // JSONifying the returned audio data
                            var audioJSON = JSON.parse(returnedAudioData);


                            // assigning audio stuff
                            $(".individual-problem-holder").each(function () {
                                var $row = $(this);
                                var audioFileName = audioJSON[$row.data("id")];
                                problemHolder.addAudio($row, audioFileName);
                            });
                        }
                    }


//                    function copyRight() {
//                        makeTheseChanges({
//                            job: "copy_column_right",
//                            thisButton: $(this),
//                            confirmMessage: "Really copy column ",
//                            onFinish: function ($selectedCells) {
//
//
//                                // copying the values from the selected column to the NEXT column
//                                $selectedCells.each(function () {
//                                    var originalValue = $(this).val();
//                                    $(this).next(".problem-input").val(originalValue);
//                                });
//                            }
//                        });
//                    }


                    function deleteColumn() {
                        makeTheseChanges({
                            job: "delete_column",
                            thisButton: $(this),
                            confirmMessage: "Really empty column ",
                            onFinish: function ($selectedCells) {
                                $selectedCells.val("");
                            }
                        });
                    }


                    function copyColumn() {

                        if ($(".column-copied").length) {
                            $(".column-copied").removeClass("column-copied");
                            clipboard = null;
                            $("#paste-button").attr("disabled", true);
                            return;
                        }

                        clipboard = $activeInput.data("column");
                        $(".problem-input[data-column='" + clipboard + "']").addClass("column-copied");
                        $("#paste-button").attr("disabled", false);
                    }


                    function pasteColumn() {
                        var pasteTo = $activeInput.data("column");
                        makeTheseChanges({
                            job: "copy_column_to",
                            confirmMessage: "Copy " + clipboard + " to " + pasteTo + " ?",
                            data: {
                                pasteTo: pasteTo,
                                copyFrom: clipboard
                            },
                            onFinish: function ($selectedCells, d) {
                                $selectedCells.each(function () {
                                    var newValue = $(this).siblings("[data-column='" + clipboard + "']").val();
                                    $(this).val(newValue);
                                });
                                $(".column-copied").removeClass("column-copied");
                                clipboard = null;
                                $("#paste-button").attr("disabled", true);
                            }
                        });

                    }


                    function makeTheseChanges(obj) {


                        /*
                         .ignoreActiveColumn
                         .
                         */


                        // making sure we check that at least one column is active, optionally
                        if (!obj.ignoreActiveColumn && !$activeInput) {
                            alert("No input box is active!");
                            return false;
                        }


                        // checking parameters
                        if (!obj || typeof obj !== "object" || !obj.job || !obj.onFinish) {
                            console.log("Bad parameters!");
                            return false;
                        }


                        // temporarily disabling the button
                        var $button = obj.thisButton;
                        $button && $button.attr("disabled", true);
                        var column = $activeInput ? $activeInput.data("column") : null;
                        var $selectedCells = $(".problem-input[data-column='" + column + "']");


                        // highlighting selected rows IF necessary
                        if (!obj.ignoreActiveColumn) {
                            $selectedCells.addClass("column-selected");
                        }


                        // adding slight delay using setTimeout, so
                        // formatting applies BEFORE the confirm
                        var sendDataDelay = obj.ignoreActiveColumn ? 0 : 50;


                        // slight delay, so that the .selected-column formatting
                        // appears before the "confirm" message pops up!
                        setTimeout(function () {


                            var data = {
                                job: obj.job,
                                column: column,
                                data: obj.data,
                                text_id: $("#text-selector").val(),
                                group_id: $("#group-selector").val()
                            };


                            if (obj.confirmMessage) {
                                if (!window.confirm(obj.confirmMessage + " " + column + " ?")) {
                                    $selectedCells.removeClass("column-selected");
                                    $button && $button.attr("disabled", false);
                                    return;
                                }
                            }


                            $.post("/problem_stuff", data).done(function (returnedData) {
                                obj.onFinish($selectedCells, returnedData);
                            }).always(function () {
                                $selectedCells.removeClass("column-selected");
                                $button && $button.attr("disabled", false);
                            });
                        }, sendDataDelay);
                    }


                    return {
                        deleteColumn: deleteColumn,
//                        copyRight: copyRight,
                        swapColumns_1_2: swapColumns_1_2,
                        newProblem: newProblem,
                        copyColumn: copyColumn,
                        pasteColumn: pasteColumn
                    };
                }());


                function importProblemsHandler() {


                    var appendGroupID = parseInt($("#import-selector").val());
                    var baseGroupID = parseInt($("#group-selector").val());
                    var appendGroupName = $("#import-selector :selected").text();


                    if (!appendGroupID || !baseGroupID) {
                        return;
                    }


                    if (appendGroupID === baseGroupID) {
                        alert("Can't append a group to itself!");
                        return;
                    }


                    // confirming
                    if (!window.confirm("Really append " + appendGroupName + " to this group?")) {
                        return;
                    }


                    // preparing the data
                    var data = {
                        job: "import_problems",
                        data: {
                            baseGroupID: baseGroupID,
                            appendGroupID: appendGroupID
                        }
                    };


                    // sending the request
                    $.getJSON("/problem_stuff", data).done(function (d) {
                        window.location.reload();
                    }).fail(function (d) {
                        console.log("Failed to append the problems!");
                        console.log(d);
                    });
                }


                function cloneToDifferentText() {


                    $(window).keydown(dismissCloneToTextStuffViaEscape);
                    function dismissCloneToTextStuffViaEscape(e) {
                        if (e.keyCode === 27) { // escape key
                            dismissCloneToTextStuff();
                        }
                    }


                    function dismissCloneToTextStuff() {
                        $("#new-text-selector-holder").empty();
                        $(window).off("keydown", dismissCloneToTextStuffViaEscape);
                    }


                    // cloning and appending the #text-selector
                    var $selectorClone = $("#text-selector").clone().attr({id: "new-text-selector"});
                    var currentSelected = $("#text-selector").val();
                    var currentGroupName = $("#group-selector").find("option:selected").html();
                    var currentTextName = $selectorClone.find("option:selected").html();
                    $selectorClone.find("option[value=" + currentSelected + "]").attr("selected", true);
                    $("#new-text-selector-holder").empty().append($selectorClone);


                    // on change, confirming and cloning
                    $selectorClone.change(function () {


                        if (!window.confirm("Copy group \n'" + currentGroupName + "' to \n'" + currentTextName + "'?")) {
                            dismissCloneToTextStuff();
                            return;
                        }


                        // getting the textID from the newly-added selector
                        var textID = $("#new-text-selector").val();


                        // calling the cloneGroupButtonHandler, just like normal
                        cloneGroupButtonHandler(textID, function () {


                            dismissCloneToTextStuff();


                            // alerting success to the user
                            alert("Group copied to that text!");
                        });

                    });
                }

                /*
                 * 
                 * Putting these last so we can use a slightly cleaner syntax inside the '.click( ~ )' parens
                 * 
                 */


                // wiring up various buttons and inputs
                $(document).on("click", ".delete-button", function () {
                    deleteIndividualProblem({
                        item: $(this),
                        warn: true
                    });
                });
                $(document).on("click", ".clone-button", cloneProblemButtonHandler);
                $(document).on("change", ".problem-input", updateHandler.registerChange);
                $(document).on("paste", ".problem-input", pasteFromExcel);
                $(document).on("keyup", shiftEnterUploadShortcut);
                $(document).keydown(tabMakesNewRow);
                $("#group-selector").change(groupSelectorChangeHandler);
                $("#remove-blanks-button").click(removeBlanksHandler);
                $("#remove-underscores-button").click(underscores.remove);
                $("#create-new-group-button").click(createNewGroupHandler);
                $("#change-group-name-button").click(changeGroupNameButtonHandler);
                $("#delete-group-button").click(deleteGroupButtonHandler);
                $("#new-problem-button").click(editor.newProblem);
                $("#new-problem-x10-button").click(function () {
                    editor.newProblem({
                        number: 10
                    });
                });
                $("#toggle-all-checkboxes").click(selected.toggle);
                $("#toggle-display-mode").click(displayMode.toggle);
                $("#number-rows-to-show").change(numberRowsToShowChangeHandler);
                $("#clone-group-button").click(function () {
                    cloneGroupButtonHandler(); // have to do this here, so the event doesn't get passed in!
                });
                $("#upload-changes-button").click(updateHandler.sendChangesToServer);
                $("#text-selector").change(textSelectorChangeHandler);
                $("#import-problems-button").click(importProblemsHandler);
                $("#swap-columns-button").click(editor.swapColumns_1_2);
                $("#delete-column-button").click(editor.deleteColumn);
                $("#clone-to-different-text-button").click(cloneToDifferentText);

                $("#copy-button").click(editor.copyColumn);
                $("#paste-button").click(editor.pasteColumn);



                // wiring up the #import-problems-button to only be enabled when some group is selected
                $("#import-selector").change(function () {
                    if ($(this).val()) {
                        $("#import-problems-button").attr("disabled", false);
                    } else {
                        $("#import-problems-button").attr("disabled", true);
                    }
                });


                function pasteFromExcel(e) {


                    // getting the text data from the clipboardEvent - funky syntax!
                    // Using <textarea> because it preserves the formatting, with \t and \n
                    // NOTE that we're not even really appending (or removing) the textarea
                    var textData = e.originalEvent.clipboardData.getData("text");
                    var $textArea = $("<textarea style='display: none;' />").val(textData);
                    textData = $textArea.val();


                    // exiting here if there are no line breaks, meaning 
                    // we're not pasting from Excel
                    if (textData.indexOf("\n") === -1 && textData.indexOf("\t") === -1) {
                        return true;
                    }


                    // telling updateHandler NOT to send changes individually
                    // NOTE we have to call updateHandler.sendChangesToServer() MANUALLY down below
                    updateHandler.setBatchChangeMode();


                    // deleting the originally pasted value
                    // seems to display better when we blur it first
                    $(this).blur().val("");


                    // saving the current row and the index at which to start
                    var $currentRow = $(this).closest(".individual-problem-holder");
                    var cellStartIndex = $(this).index();
                    var currentIndex = cellStartIndex;


                    // cycling through and adding the data
                    textData.split("\n").forEach(function (thisRow) {
                        thisRow.split("\t").forEach(function (thisCell) {


                            thisCell = thisCell.replace(/\･/g, ""); // removing any little dots
                            $currentRow.find(".problem-input").eq(currentIndex).val(thisCell).change();


                            // setting pointer to next cell
                            currentIndex += 1;
                        });


                        // resetting the cell index, so we start at the left-most one, 
                        // and moving the row to the next row
                        currentIndex = cellStartIndex;
                        $currentRow = $currentRow.next();
                    });


                    // sending changes to server MANUALLY 
                    updateHandler.sendChangesToServer();
                }


                function textSelectorChangeHandler() {
                    var textId = $(this).val();
                    sessionStorage.problem_text_id = textId;
                    sessionStorage.current_problems_group = "";
                    window.location.reload();
                }


                function shiftEnterUploadShortcut(e) {
                    if (e.keyCode === 13 && e.ctrlKey) {
                        e.preventDefault();
                        updateHandler.sendChangesToServer();
                    }
                }


                var newGroup = (function () {


//                    例えば...
//                    
//                    var baseArray = {
//                        textID: {
//                            created: {
//                                groupID: "Chapter 7 Vocabulary",
//                                groupID: "Chapter 9 Sentences"
//                            },
//                            deleted: {
//                                groupID: true
//                            }
//                        }
//                    };


                    function update(createdOrDeleted, groupId, value) {


                        var textId = $("#text-selector").val();


                        var object = (function () {
                            if (localStorage.newlyCreatedGroups) {
                                return JSON.parse(localStorage.newlyCreatedGroups);
                            }
                            return {};
                        }());


                        // building our object if it doesn't exist already
                        object[textId] = object[textId] || {};
                        object[textId].created = object[textId].created || {};
                        object[textId].deleted = object[textId].deleted || {};


                        // saving the data
                        object[textId][createdOrDeleted][groupId] = value;


                        // writing the object back to localStorage
                        localStorage.newlyCreatedGroups = JSON.stringify(object);
                        localStorage.reloadActiveAssignments = 1;


                        return object;
                    }


                    return {
                        update: update
                    };
                }());
            }); // end jQuery main
        }); // end requireJS thing



