



/* * * * * * * * * * * * * * * * * * * * * * * * 
 * 
 * 
 *      JavaScript for the Submitted View!
 * 
 * 
 * * * * * * * * * * * * * * * * * * * * * */



requirejs(
        [
            "jquery",
            "jqueryui",
            "bootstrap"
        ],
        function ($) {

            $(function () {


                // various variable(s)
                var lastSubmitted = 0; // will be set to the current highest value of the table id


                // retrieving submitted assignments (the most recent 100) every five seconds
                setInterval(getDataFromServer, 5000);
                getDataFromServer(); // kicking it off once immediately
                function getDataFromServer() {


                    // showing the 'Fetching data' div momentarily
                    $("#nowFetching").css({visibility: "visible"});


                    $.ajax({
                        url: "/get_recently_submitted/" + lastSubmitted,
                        dataType: "json",
                        success: function (data) {

                            // error checking!  If no data was returned, or there was no 'submitted' thing attached...
                            if (!data) {
                                console.log("No data was returned!");
                                return;
                            }

                            if (!data.submitted) {
                                console.log("Data was returned, but no data.submitted!");
                                return;
                            }

                            builtSubmittedTable(data.submitted);
                        }
                    });
                }

                var builtSubmittedTable = (function () {


                    // local variables
                    var counter = 0;
                    var headersNotSet = true;


                    // an ordered list of which columns to display
                    var columnsToShow = [
                        "button_holder",
                        "username",
                        "gakkou",
                        "nen",
                        "assignment_name",
                        "num_times",
                        "time_taken",
                        "number_problems",
                        "number_mistakes",
                        "created_at",
                        "computer_info"
                    ];

                    // used to assign English class names to table rows & cells
                    var aliases = {
                        username: "生徒名",
                        nen: "学年",
                        gakkou: "学校",
                        created_at: "日時",
                        button_holder: "",
                        assignment_name: "課題名",
                        number_problems: "問題数",
                        number_mistakes: "間違数",
                        time_taken: "秒",
                        computer_info: "Computer info"
                    };

                    return function (data) {


                        // hiding the nowFetching again
                        $("#nowFetching").css({visibility: "hidden"});


                        // adding headers the first time through, based on the [0] data element
                        if (headersNotSet) {

                            buildHeaderRow(data, columnsToShow, aliases);

                        } // end header stuff


                        // going through all the submitted and adding the rows

                        data.forEach(function (thisAssignment) {


                            counter++;


                            // appending each new row after the headers (so, at the top)
                            $("#headers").after("<tr id='row" + counter + "' class='" + (headersNotSet ? "" : "newRow") + "'></tr>");


                            // going through the 'columnsToShow' array and adding cells to the row in order
                            columnsToShow.forEach(function (thisColumn) {


                                if (thisAssignment[thisColumn]) {


                                    $("#row" + counter).append("<td class='" + thisColumn + "'>" + thisAssignment[thisColumn] + "</td>");


                                    if (parseInt(thisAssignment.id) > lastSubmitted) {
                                        lastSubmitted = thisAssignment.id;
                                    }
                                } else if (thisColumn === "button_holder") {
                                    $("#row" + counter).append("<td class='" + thisColumn + "'><button class='deleteAssignment' data-database_id='" + thisAssignment.id + "' type='button'>Delete</button></td>");
                                }
                            });
                        });


                        headersNotSet = false; // used in deciding whether to add 'newRow' or not
                    };
                }());
                // end builtSubmittedTable


                // wiring up the deleteAssignment
                $(document).on("click", ".deleteAssignment", function () {

                    if (!confirm("Really delete?")) {
                        return;
                    }

                    // marking the parent row so we can delete it below
                    var $rowToDelete = $(this).parent().parent();
                    var idToErase = $(this).attr("data-database_id");

                    $.ajax({
                        url: "/delete_this_assignment/" + idToErase,
                        dataType: "json",
                        success: function () {

                            // slight animation before removing completely
                            $rowToDelete.fadeTo("slow", 0, function () {
                                $rowToDelete.remove();
                            });
                        },
                        error: function () {
                            console.log("Wasn't able to delete the row!");
                        }
                    });
                });


                function buildHeaderRow(data, columnsToShow, aliases) {


                    columnsToShow.forEach(function (thisColumn) {


                        // if there is an entry for thisColumn...
                        if (data[0][thisColumn]) {


                            // appending each cell to the row
                            $("#headers").append("<th class='" + thisColumn + "'>" + (aliases[thisColumn] || thisColumn) + "</th>");

                        } else if (thisColumn === "button_holder") {


                            // adding a space for the delete button
                            $("#headers").append("<th class='" + thisColumn + "'>" + aliases[thisColumn] + "</th>");
                        }

                    });

                }

            });
        });
