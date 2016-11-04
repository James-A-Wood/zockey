


define(
        [
            "jquery",
            "helpers/chatManager",
            "tools"
        ],
        function ($, myChatManager, tools) {


            var highestLoadedID = 1;
            var lowestLoadedID;
            var queryCount = 0;
            var hiddenColumns = {};
            var isFirstQuery = true;
            var columnsToHideAtStartup = ["id"];


            var setNewTrigger = (function () {

                var $scrollTrigger = $("#load-next-trigger").detach();

                return function () {
                    var $newTrigger = $scrollTrigger.clone();
                    $("#reportTable").after($newTrigger);
                    tools.elementOnScreen($newTrigger, function () {
                        retrieveSubmittedData({
                            topOrBottom: "bottom"
                        });
                    });
                };
            }());


            // initializing the chatManager, 
            var chatManager = myChatManager();


            // a function to add a single row to the table
            var TableRow = (function () {


                var months = ["Jan", "Feb", "March", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                var $rowMaster = $("#reportTable").find("tr.my-template").detach().removeClass("my-template");


                function processDate(d) {


                    var pieces = d.split(" ");
                    var date = pieces[0];
                    var time = pieces[1];


                    date = date.split("-");
                    date[1] = months[parseInt(date[1]) - 1];
                    date = date[1] + " " + date[2];


                    time = time.split(".")[0].split(":");
                    time = time[0] + ":" + time[1];


                    return date + ", " + time;
                }


                function Row(thisSubmittedAssignment) {


                    var $newRow = $rowMaster.clone();


                    // tweaking the date - funky syntax, because thisSubmittedAssignment.date is an object which itself has a "date" property
                    thisSubmittedAssignment.date = processDate((thisSubmittedAssignment.date).date); // removing the trailing ".00000"


                    // adding the text data for each column
                    for (var column in thisSubmittedAssignment) {


                        var content = thisSubmittedAssignment[column];
                        var $thisCell = $newRow.find("." + column);
                        $thisCell.text(content);


                        // hiding the cell if the corresponding column is hidden
                        if (hiddenColumns[column]) {
                            $thisCell.hide();
                        }
                    }


                    // showing and wiring up the .chat-button, if there is a user_id (i.e., if the user was registered and logged in)
                    if (thisSubmittedAssignment.user_id) {
                        $newRow.find(".username, .lastname, .firstname").show().click(function (event) {
                            chatManager.uploadAdminMessage({
                                event: event,
                                user_id: thisSubmittedAssignment.user_id,
                                firstname: $newRow.find(".firstname").text(),
                                lastname: $newRow.find(".lastname").text(),
                                username: $newRow.find(".username").text()
                            });
                        });
                    }


                    // wiring up the "submitted_as_active" cell
                    $newRow.find("td.submitted_as_active").dblclick(toggleSubmittedAsActive);


                    // wiring up the "user_page" button to open up that user's page,
                    // or removing it, if it's not a registered user
                    if (!thisSubmittedAssignment.user_id) {
                        $newRow.find(".user_page").find("span").remove();
                    } else {
                        $newRow.find(".user_page").click(function () {
                            var data = {user_id: thisSubmittedAssignment.user_id};
                            $.post("/login_user_from_kyoushitsu_report", data).done(function () {
                                window.open(window.location.protocol + "//" + window.location.host);
                            }).fail(function (d) {
                                console.log(d);
                            });
                        });
                    }


                    // returning the row itself
                    return $newRow;
                }


                return function (thisSubmittedAssignment) {
                    var $newRow = new Row(thisSubmittedAssignment);
                    return $newRow;
                };
            }());


            function retrieveSubmittedData(inputs) {


                inputs = inputs || {};


                // whether we're retrieving the newest posts ("top") or older ones ("bottom")
                var topOrBottom = inputs.topOrBottom || "top"; // top by default


                // removing any old scroll triggers
                $("#load-next-trigger").remove();


                // building the data object
                var data = {
                    job: "get_submitted",
                    after_id: (topOrBottom === "top") ? highestLoadedID : 0, // was : NULL
                    below_id: (topOrBottom === "bottom") ? lowestLoadedID : 0 // was : NULL
                };


                // pausing countdown, if it exists
                if (myCountdown) {
                    myCountdown.pause();
                }


                // ajaxing
                $.getJSON("/report_stuff", data).done(function (d) {


                    // restarting countdown, if it exists
                    if (myCountdown) {
                        myCountdown.restart();
                    }


                    // keeping track of the number of queries, mostly so we can format stuff after the second query
                    queryCount += 1;


                    // adding and wiring up a new trigger
                    setNewTrigger();


                    // exiting here if nothing was returned (no new submitteds)
                    if (!d.completedAssignments || !d.completedAssignments.length) {
                        return;
                    }


                    // looping through the returned array, building rows
                    d.completedAssignments.forEach(function (thisAssignment) {


                        // keeping track of the highestLoadedID and lowestLoadedID
                        highestLoadedID = Math.max(thisAssignment.id, highestLoadedID);
                        lowestLoadedID = lowestLoadedID ? Math.min(thisAssignment.id, lowestLoadedID) : highestLoadedID;


                        // building a new row
                        var $newRow = new TableRow(thisAssignment);


                        // if we've queried the most RECENT submitteds, then adding to the top
                        if (topOrBottom === "top") {


                            // appending to the TOP of the table
                            $("#reportTableHeader").after($newRow);


                            // formatting the rows as "newly-added" if they're after the initial query
                            if (queryCount > 1) {
                                $newRow.addClass("newRow");
                                var numberNew = $(".newRow").length;
                                var numberNewRows = " (" + numberNew + ")";
                                $("title").text("Submitted " + numberNewRows);
                            }
                        }


                        // if it's a previous submission, then appending to the BOTTOM of the table
                        if (topOrBottom === "bottom") {
                            $("#reportTable").append($newRow);
                        }
                    });


                    // hiding some columns by default at the beginning
                    if (isFirstQuery) {
                        isFirstQuery = false;
                        columnsToHideAtStartup.forEach(function (column) {
                            $("th." + column).click();
                        });
                    }

                }).fail(function (d) {


                    // if it fails (like, if session has expired) then reloading the page so we get the login window
                    window.location.reload();
                });
            }


            // Countdown timer that fires off a callback (AJAX request)
            // every ~10 seconds, or when a button is clicked
            function Countdown(inputs) {


                // checking inputs
                if (!inputs || typeof inputs !== "object"
                        || !inputs.button
                        || !inputs.callback
                        || typeof inputs.callback !== "function"
                        || !inputs.intervalLength
                        || isNaN(inputs.intervalLength)
                        ) {
                    console.log("Countdown received invalid inputs!");
                    return false;
                }


                // anal
                var button = inputs.button;
                var callback = inputs.callback;
                var intervalLength = inputs.intervalLength;
                var originalText = inputs.originalText || button.text() || "";
                var startTime = (new Date()).getTime();
                var currentTime = startTime;
                var milisecondsRemaining = 0;


                // wiring up the button, and calling it on instantiation once
                button.click(executeCallback);
                executeCallback();


                // wiring up the setInterval, and calling it once on instantiation
                var myInterval = setInterval(updateTimePassed, 100);
                updateTimePassed();


                function pause() {
                    clearInterval(updateTimePassed);
                    button.off("click", executeCallback);
                    button.css("opacity", 0.5);
                    button.text(originalText);
                }


                function restart() {
                    setInterval(updateTimePassed, 100);
                    button.click(executeCallback);
                    button.css("opacity", 1);
                    updateTimePassed();
                }


                function updateTimePassed() {

                    currentTime = (new Date()).getTime();
                    var secondsPassed = currentTime - startTime;
                    milisecondsRemaining = intervalLength - secondsPassed;
                    var secondsText = Math.ceil(milisecondsRemaining / 1000);

                    button.text(originalText + " in " + secondsText);

                    if (milisecondsRemaining <= 0) {
                        executeCallback();
                    }
                }


                function executeCallback() {
                    startTime = (new Date()).getTime();
                    updateTimePassed();
                    callback();
                }


                function cancel() {
                    clearInterval(myInterval);
                    button.off("click", executeCallback);
                }


                function call() {
                    callback();
                }


                this.cancel = cancel;
                this.call = call;
                this.pause = pause;
                this.restart = restart;
            }


            // NEW TEST just messed with this...
            var myCountdown = new Countdown({
                button: $("#query-button"),
                intervalLength: 10000,
                callback: function () {
                    retrieveSubmittedData();
                    chatManager.retrieveChats();
                }
            });


            // Hiding/showing columns by clicking on their headers
            $("#reportTable th").on("click", function () {


                var columnToHide = $(this).data("column");
                var headerText = $("th." + columnToHide).text();
                var fallbackLabel = $("th." + columnToHide).data("fallback_label"); // specifically for the "Chat" header, which has no text


                // doing nothing if the column header is empty (as for the Chat button)
                if (!headerText && fallbackLabel) {
                    headerText = fallbackLabel;
                }


                hiddenColumns[columnToHide] = true;


                // hiding anything with the proper class (both td's and th's)
                $("." + columnToHide).hide();


                // adding a button to restore the column
                var button = $("<button type='button' class='show-column-button btn btn-default'></button>");
                button.data({column: columnToHide}).text(headerText);
                $("#buttons-holder").append(button);


                // wiring up the button
                button.click(function () {
                    hiddenColumns[columnToHide] = false;
                    $("." + columnToHide).show();
                    $(this).remove();
                });
            });


            // wiring up the ".submitted_as_active" column to toggle the value when clicked
            function toggleSubmittedAsActive() {


                var $this = $(this);
                var currentValue = $this.text();
                var id = $this.siblings(".id").text();


                // error checking
                if (!id || !currentValue) {
                    return;
                }


                // sending the request
                var sendData = {
                    id: id,
                    job: "toggle_submitted_as_active"
                };


                // making the AJAX call
                $.getJSON("/report_stuff", sendData).done(function (d) {
                    var newValue = (d === 1) ? "1" : "-";
                    $this.text(newValue).css({backgroundColor: "#dfd", color: "darkgreen"});
                }).fail(function (d) {
                    console.log("Error toggling submitted_as_active");
                    console.log(d);
                });
            }
        }
);
            