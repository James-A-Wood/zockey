


define(
        [
            "jquery",
            "helpers/chatManager"
        ],
        function ($, myChatManager) {


            var log = console.log;


            // shortcuts
            var $kumiSelector = $("#kumi-selector");
            var $kyoushitsuLoading = $("#kyoushitsu-loading");
            var $kyoushitsuSelectorForm = $("#kyoushitsu-selector-form");
            var $buttonsHolder = $("#buttons-holder");
            var $reportTable = $("#reportTable");
            var $showHiddenUsers = $("#show-hidden-users");
            var displayManager = DisplayManager();


            // firing up the chatManager
            var chatManager = myChatManager({
                container: $("#chat-row")
            });


            // NEW TEST
            setInterval(chatManager.retrieveChats, 5000);
            chatManager.retrieveChats();


            var table = (function () {


                var $rowTemplate = $reportTable.find(".my-row-template").detach().removeClass("my-row-template");
                var $headerTemplate = $reportTable.find(".my-header-template").detach().removeClass("my-header-template");


                // names and labels, in the order they are to appear, along with a "hideAtStartup" attribute
                var columns = [
                    {name: "nen"},
                    {name: "kumi"},
                    {name: "ban"},
                    {name: "honkou_seito", hideAtStartup: true},
                    {name: "lastname"},
                    {name: "firstname"},
                    {name: "username", hideAtStartup: true},
                    {name: "num_user_unique_submitted", hideAtStartup: true},
                    {name: "num_user_total_submitted", hideAtStartup: true},
                    {name: "controls", hideAtStartup: false},
                    {name: "num_user_unique_submitted_in_active"},
                    {name: "num_user_unique_submitted_in_semester"}
                ];


                return {
                    build: function (users, total_num_active_assignments, total_num_assignments_in_semester) {


                        // adding the headers stuff
                        $reportTable.append($headerTemplate);


                        // adding the numbers to headers
                        $reportTable.find("th.num_user_unique_submitted_in_active .number").text(total_num_active_assignments);
                        $reportTable.find("th.num_user_unique_submitted_in_semester .number").text(total_num_assignments_in_semester);


                        // clearing the kumi-selector, leaving only 全組
                        $kumiSelector.empty().append("<option value='' selected>全組</option>");
                        var currentKumis = {};


                        // adding a new row for each user
                        users.forEach(function (thisUser) {


                            // adding a kumi-selector option for this user's kumi, if not there already
                            if (!currentKumis[thisUser.kumi]) {
                                currentKumis[thisUser.kumi] = true;
                                var $option = $("<option/>");
                                $option.val(thisUser.kumi);
                                $option.text(thisUser.kumi + " 組");
                                $option.appendTo($kumiSelector);
                            }


                            // cloning the row
                            var $newRow = $rowTemplate.clone();


                            // clicking on the name brings up the message window
                            $newRow.find(".lastname, .firstname, .username").click(function (event) {


                                // getting the names, so we can make a cook prompt
                                var lastname = $(this).parent().find(".lastname").text();
                                var firstname = $(this).parent().find(".firstname").text();
                                var username = $(this).parent().find(".username").text();


                                chatManager.uploadAdminMessage({
                                    event: event,
                                    user_id: thisUser.id,
                                    lastname: lastname,
                                    firstname: firstname,
                                    username: username
                                });
                            });


                            // adding the content to each cell
                            columns.forEach(function (thisColumn) {
                                var textForThisUser = thisUser[thisColumn.name];
                                $newRow.find("." + thisColumn.name).text(textForThisUser);
                            });


                            // changing the value when double-clicking the cell
                            $newRow.find("td.nen, td.kumi, td.ban, td.honkou_seito").dblclick(function () {
                                updateUserData($(this), thisUser.id);
                            });


                            // finally, appending the newly constructed row to the table
                            $reportTable.append($newRow);


                            // wiring up the change-password button
                            $newRow.find(".change-password-button").click(function () {


                                // getting the new password
                                var newPassword = window.prompt("New password?");
                                if (!newPassword) {
                                    return;
                                }


                                // trimming white space
                                newPassword = newPassword.trim();
                                if (!newPassword) {
                                    return;
                                }


                                // confirming
                                var confirm = window.confirm("New password:\n\n" + newPassword + "\n\nOkay?");
                                if (!confirm) {
                                    return;
                                }


                                // sending the request
                                $.post("/admin_change_user_password", {
                                    new_password: newPassword,
                                    user_id: thisUser.id
                                }, "json").done(function (d) {
                                    alert("New password is: \n\n" + newPassword);
                                }).fail(function (d) {
                                    alert("Failed?");
                                });
                            });


                            // logging students into their own page
                            $newRow.find(".login-user-button").on("click", function () {


                                var data = {user_id: thisUser.id};


                                $.post("/login_user_from_kyoushitsu_report", data).done(function () {
                                    window.open(window.location.protocol + "//" + window.location.host); //, "_blank"
                                }).fail(function (d) {
                                    log(d);
                                });
                            });

                        });


                        // hiding some columns on startup, if specified
                        columns.forEach(function (thisColumn) {
                            if (thisColumn.hideAtStartup) {
                                $reportTable.find("th").filter(function () {
                                    return ($(this).data("column_to_toggle") === thisColumn.name);
                                }).click();
                            }
                        });
                    },
                    empty: function () {
                        $reportTable.empty();
                    }
                };
            }());


            // wiring up the #kyoushitsu-selector to submit the form on change, and saving its value in localStorage
            $("#kyoushitsu-selector").off("change").change(function (e) {
                localStorage.admin_current_selected_kyoushitsu = $(this).val();
                getKyoushitsuData(e);
            });


            // reloading the old value from localStoage, if present
            if (localStorage.admin_current_selected_kyoushitsu) {
                $("#kyoushitsu-selector").val(parseInt(localStorage.admin_current_selected_kyoushitsu)).change();
            }


            // wiring up the form itself
            $kyoushitsuSelectorForm.submit(getKyoushitsuData);
            function getKyoushitsuData(e) {


                // short-circuiting the default "submit" behavior
                e.preventDefault();


                // exiting here if no value has been selected
                if (!$("#kyoushitsu-selector").val()) {
                    table.empty();
                    return;
                }


                // showing the little "loading" GIF, and disabling the picker
                $kyoushitsuLoading.show();
                $kyoushitsuSelectorForm.find("select").prop({disabled: true});


                // preparing the data to send
                var data = {
                    kyoushitsu: $("#kyoushitsu-selector").val() // 100, 200, etc.
                };


                // checking for paramaters
                if (!data.kyoushitsu) {
                    return;
                }


                // emptying table to make room for new content
                $reportTable.empty();


                // making the ajax call
                $.getJSON("/get_submitted_by_kyoushitsu", data).done(function (d) {


                    // exiting if there is no dataBack, or no dataBack.usersData property
                    if (!d || !d.usersData) {
                        $reportTable.append("<tr><td>No data for that kyoushitsu!</td></tr>");
                        return false;
                    }


                    // building the table if any data was returned, or else displaying a message
                    if (d.usersData.length > 0) {
                        table.build(d.usersData, d.total_num_active_assignments, d.total_num_assignments_in_semester);
                    } else {
                        $reportTable.append("<tr><td>No data for that kyoushitsu!</td></tr>");
                    }


                    // in any case, hiding the little "loading" icon
                    $kyoushitsuLoading.hide();
                    $("#kyoushitsu-selector-form select").prop({disabled: false});


                    // showing and/or hiding the appropriate data
                    displayManager.refreshDisplay();
                }).fail(function (d) {
                    log(d);
                });
            }


            // wiring up the new-kyoushitsu-button
            $("#new-kyoushitsu-button").click(function () {
                $("#new-kyoushitsu-inputs-holder").find("input").val("");
                $("#new-kyoushitsu-inputs-holder").slideToggle();
            });


            // wiring up the ajax call for the 
            $("#create-new-kyoushitsu-form").submit(function (e) {


                e.preventDefault();


                // clearing any old reported messages
                $("#server-messages").empty();


                // 入力された（はず）のデータを整理している
                var code = $("#new-kyoushitsu-code").val();
                var title = $("#new-kyoushitsu-title").val();
                var description = $("#new-kyoushitsu-description").val();


                // returning if input is not a number
                var onlyNumbers = /^[0-9]+$/; // same as new RegExp('^\\d+$');
                if (!onlyNumbers.test(code)) {
                    alert("Code must be a number!");
                    $("#new-kyoushitsu-code").val("");
                    return false;
                }

                var data = {
                    job: "create_new_kyoushitsu",
                    code: parseInt(code)
                };


                // appending title and description, if present
                if (title) {
                    data.title = title;
                }

                if (description) {
                    data.description = description;
                }


                $.getJSON("/kyoushitsu_stuff", data).done(function (d) {


                    // displaying any errors and exiting
                    for (var field in d) {
                        d[field].forEach(function (thisMessage) {
                            $("#server-messages").append($("<p/>").text(thisMessage));
                        });
                        return;
                    }


                    // reloading the page if we've successfully created the new kyoushitsu
                    window.location.reload();


                }).fail(function (d) {
                    log("Failed making the new kyoushitsu!");
                    log(d);
                    d.code.forEach(function (messages) {
                        log(messages);
                    });
                });

            });


            function updateUserData($thisCell, userID) {


                // formatting the cell
                $thisCell.addClass("now-changing");


                // getting and scrubbing the new value
                var currentValue = $thisCell.text();
                var newValue = window.prompt("New value?", currentValue);
                if (!newValue) {
                    $thisCell.removeClass("now-changing");
                    return;
                }
                newValue = newValue.trim();
                newValue = parseInt(newValue);
                if (!newValue && newValue !== 0) { // allowing 0 as well!
                    $thisCell.removeClass("now-changing");
                    return;
                }


                // preparing the data
                var data = {
                    user_id: userID,
                    column: $thisCell.data("column"),
                    new_value: newValue
                };


                // sending the request
                $.post("admin_update_user_info", data, function (d) {

                    $thisCell.removeClass("now-changing");
                    if (!d || !d.new_value) {
                        alert("Update failed!");
                        console.warn(d);
                        return false;
                    } else {
                        console.warn(d);
                    }
                    $thisCell.text(d.new_value);
                }, "json").fail(function (d) {
                    log("Failed!");
                    console.warn(d);
                });
            }


            // wiring up the toggleHiddenUsers checkbox
            $("#show-hidden-users").on("change", displayManager.toggleHiddenUsers);


            function DisplayManager() {


                // to hold the names of the hidden columns
                var columnsToHide = [];


                // wiring up the various inputs to change values and refresh the display
                $buttonsHolder.find("button").click(showThisColumn);
                $(document).on("click", "#reportTable th", hideThisColumn);
                $kumiSelector.change(refreshDisplay);
                $showHiddenUsers.change(refreshDisplay);


                function refreshDisplay() {


                    // (1/4)  showing all rows and columns, before hiding selected data
                    showEverything();


                    // (2/4 ) hiding any COLUMNS that should be hidden
                    columnsToHide.forEach(function (thisColumn) {
                        $reportTable.find("." + thisColumn).hide();
                        $buttonsHolder.find(".show-" + thisColumn).show();
                    });


                    // (3/4) hiding all ROWS OTHER THAN the selected kumi, if any
                    var selectedKumi = $kumiSelector.val();
                    if (selectedKumi) {
                        $reportTable.find("tr").not("#header-row").filter(function () {
                            var thisRowsKumi = $(this).find(".kumi").text();
                            return thisRowsKumi !== selectedKumi;
                        }).hide();
                    }


                    // (4/4) hiding non-students (depending on checkbox)
                    hideNonStudents();
                }


                function showEverything() {
                    $reportTable.find("tr, td, th").show();
                    $reportTable.find("#header-row").show();
                    $buttonsHolder.find("button").hide();
                }


                function hideThisColumn() {
                    var thisColumn = $(this).data("column_to_toggle");
                    if (columnsToHide.indexOf(thisColumn) === -1) {
                        columnsToHide.push(thisColumn);
                    }
                    refreshDisplay();
                }


                function showThisColumn() {
                    var thisColumn = $(this).data("column_to_toggle");
                    columnsToHide.splice(columnsToHide.indexOf(thisColumn), 1);
                    refreshDisplay();
                }


                // if checkbox is checked, then hiding non-students
                function hideNonStudents() {
                    if (!$("#show-hidden-users").is(":checked")) {
                        $reportTable.find("tr").filter(function () {
                            return $(this).find("td.honkou_seito").text() === "0";
                        }).hide();
                    }
                }


                return {
                    refreshDisplay: refreshDisplay
                };
            }
        }
);
            