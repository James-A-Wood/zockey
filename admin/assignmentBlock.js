define(
        [
            "jquery",
            "jqueryui"
        ],
        function ($) {


            /*
             * 
             *      Creates a new block for holding an assignment - 
             *      the name, button, template selector, etc.
             *      
             */


            return function (global, templateDefaults) {


                // detaching the template from the HTML markup, so we can clone and add it down below
                var $template = $("#assignments-holder .my-template").removeClass("my-template").detach();


                return function (assignmentInfo, options) {


                    // making sure that options, if not passed in, is at least an empty object
                    options = options || {};


                    var text_id = $(".texts-holder").find(".open").data("value");
                    if (!text_id) {
                        return false;
                    }


                    // cloning and appending the $template
                    var $newAssignment = $template.clone().appendTo("#assignments-holder");


                    // adding the db_id attriute to it - necessary for .sortable to work
                    $newAssignment.data({db_id: assignmentInfo.id});


                    // adding values to the newly-cloned assignmentHolder
                    $newAssignment.find(".button-label .button-label-input").val(assignmentInfo.button_label);
                    $newAssignment.find(".number-problems .number-probems-input").val(assignmentInfo.number_problems);
                    $newAssignment.find(".number-sentakushi .number-sentakushi-input").val(assignmentInfo.number_sentakushi);
                    $newAssignment.find(".directions .directions-input").val(assignmentInfo.directions);
                    $newAssignment.find(".misc .misc-input").val(assignmentInfo.misc);


                    // wiring up change and click events
                    $newAssignment.find(".goto-problem-group").off("click").click(openProblemGroup);
                    $newAssignment.find(".show-all-options").off("click").click(showAllOptions);
                    $newAssignment.find(".assignment-input").change(function () {
                        updateValue($(this), assignmentInfo.id);
                    });
                    $newAssignment.find(".assignment-number").off("click").click(function () {
                        toggleActiveState($(this), assignmentInfo.id);
                    });
                    $newAssignment.find(".delete-assignment-button").click(function () {
                        deleteAssignment($(this), assignmentInfo.id);
                    });
                    $newAssignment.find(".template-selector").on("change", templateSelectorChangeHandler).each(function () {
                        addTemplateSelectorOptions({
                            thisSelector: $(this),
                            assignmentInfo: assignmentInfo
                        });
                    });
                    $newAssignment.find(".data-group-selector").on("change", dataGroupChangeHandler).each(function () {
                        addGroupSelectorOptions({
                            thisSelector: $(this),
                            assignmentInfo: assignmentInfo,
                            groups: global.problemGroups[text_id]
                        });
                    });


                    // making it visible, 'cause it was hidden by default
                    $newAssignment.show();


                    // making it inactive (translucent) if "inactive" is set to true
                    if (assignmentInfo.active !== "on") {
                        $newAssignment.addClass("inactive");
                    }


                    // sliding down the assignment if "slideDown" is set to TRUE
                    if (options.slideDown) {
                        $newAssignment.hide().slideDown();
                    }
                };



                /*
                 * 
                 * 
                 *      Miscellaneous functions that are called from above
                 * 
                 * 
                 */



                function addGroupSelectorOptions(d) {


                    var $thisSelector = d.thisSelector;


                    $thisSelector.append("<option value='' />");


                    for (var i in d.groups) {


                        var id = d.groups[i].id;
                        var name = d.groups[i].name;
                        var isSelected = (id === d.assignmentInfo.problems_group_id) ? "selected" : null;


                        var $option = $("<option />").val(id).prop("selected", isSelected).text(name);
                        $thisSelector.append($option);


                        if (isSelected) {
                            sessionStorage.lastDataGroupSelected = id;
                        }
                    }
                }


                function dataGroupChangeHandler() {
                    var group = $(this).val();
                    sessionStorage.lastDataGroupSelected = group;
                }


                function addTemplateSelectorOptions(d) {


                    var $thisSelector = d.thisSelector;


                    global.templates.forEach(function (name) {


                        var isSelected = (d.assignmentInfo.template === name) ? " selected " : null;
                        var label = templateDefaults.aliases[name] || name;


                        // adding the option if it's not there already
                        var $option = $("<option/>").val(name).prop("selected", isSelected).text(label);
                        $thisSelector.append($option);
                    });


                    hideExtraneousFieldsFor($thisSelector);
                }


                function templateSelectorChangeHandler() {


                    var $this = $(this);


                    // hiding the fields that are seldom used for this type of assignment
                    hideExtraneousFieldsFor($this);


                    // putting in a default value in the button_label text input
                    var $buttonTextInput = $this.closest(".assignment-holder").find("input[data-column='button_label']");
                    var thisTemplate = $this.val();
                    var defaultValue = templateDefaults.buttonLabelsFor[thisTemplate];


                    // inserting the default value, and triggering the "change" event
                    if (defaultValue) {
                        $buttonTextInput.val(defaultValue).change();
                    }


                    // automatically populating the data-group-selector,
                    // if it's not populated already, and there's 
                    // a value in sessionStorage
                    var $dataGroupSelector = $(this).closest(".assignment-holder").find(".data-group-selector");
                    if (!$dataGroupSelector.val() && sessionStorage.lastDataGroupSelected) {
                        $dataGroupSelector.val(sessionStorage.lastDataGroupSelected).change();
                    }
                }


                // setting which fields are visible for which types
                function hideExtraneousFieldsFor($selector) {


                    var chosenTemplate = $selector.val();
                    var $parent = $selector.closest(".assignment-holder");


                    // displaying all fields, before hiding some of them
                    $parent.find(".assignment-holder-item").each(function () {
                        $(this).css({display: "block"});
                    });


                    // ... if there are any fieldsToHide for this particular template type...
                    if (templateDefaults.fieldsToHideFor[chosenTemplate]) {


                        var fields = templateDefaults.fieldsToHideFor[chosenTemplate];


                        // hiding the element
                        fields.forEach(function (element) {
                            $parent.children(element).css({display: "none"});
                        });
                    }
                }


                function deleteAssignment($this, id) {


                    if (!id) {
                        return false;
                    }


                    var $parent = $this.closest(".assignment-holder");


                    if (!window.confirm("Really delete this assigment?")) {
                        return;
                    }


                    $.getJSON("/admin_stuff", {
                        job: "delete_assignment",
                        id: id
                    }).done(function () {
                        $parent.slideUp(function () {
                            $parent.remove();
                        });
                    });
                }


                function updateValue($this, id) {


                    if (!$this || !id) {
                        return false;
                    }


                    // data.changes is ARRAY, meaning we can update multiple models at once, if we like
                    var data = {
                        job: "update_value",
                        changes: [
                            {
                                // NOTE "data-table" and "data-column" are
                                // hard-coded in HTML!
                                table: $this.closest(".assignment-holder").data("table"),
                                id: id,
                                column: $this.data("column"),
                                newValue: $this.val()
                            }
                        ]
                    };


                    // making the ajax call
                    $.post("/admin_stuff", data, function (returnedData) {


                        // exiting on errors
                        if (returnedData !== 0) {
                            console.log("Error updating some values!");
                            console.log(returnedData);
                            return;
                        }


                        // coloring the input green so we know it's been updated
                        $this.addClass("updated");

                    }, "json");
                }


                function showAllOptions() {


                    var $this = $(this);


                    if ($this.hasClass("all-items-showing")) {
                        var $selector = $(this).closest(".assignment-holder").find(".template-selector");
                        hideExtraneousFieldsFor($selector);
                        $(this).removeClass("all-items-showing");


                    } else {
                        $this.closest(".assignment-holder").children().slideDown();
                        $this.addClass("all-items-showing");
                    }
                }


                function openProblemGroup() {


                    // getting the value from the sibling data-group-selector
                    var problemGroupID = $(this).siblings(".data-group-selector").val();
                    var text_id = $(".texts-holder").find(".open").data("value");


                    // saving the current_problems_group id in LOCAL storage so that "problem.js" can access it (otherwise couldn't, 'cause it's in the next tab)
                    // !!! this gets erased immediately immediately on use !!!
                    if (problemGroupID) {
                        localStorage.current_problems_group_from_admin_js = problemGroupID;
                        localStorage.current_text_id_from_admin_js = text_id;
                    }


                    // jump to the page here
                    window.open("/problems");
                }


                function toggleActiveState($this, id) {


                    var $closestAssignmentHolder = $this.closest(".assignment-holder");
                    var newValue = $closestAssignmentHolder.hasClass("inactive") ? "on" : "off";


                    var data = {
                        job: "update_value",
                        changes: [
                            {
                                table: "Assignment",
                                column: "active",
                                newValue: newValue,
                                id: id
                            }
                        ]
                    };


                    $.getJSON("/admin_stuff", data, function () {
                        if (newValue === "on") {
                            $closestAssignmentHolder.removeClass("inactive");
                        } else {
                            $closestAssignmentHolder.addClass("inactive");
                        }
                    }).fail(function (d) {
                        console.log("Couldn't change the active state!");
                        console.log(d);
                    });
                }
            };
        }
);