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
            "Konva"
        ],
        function ($, Konva) {


            var $row = $("#num-submitteds-table").find(".my-template").detach().removeClass("my-template");


            $("#number-days-form").submit(sendRequest).submit();


            function sendRequest(e) {
                e.preventDefault();
                $("#num-submitteds-table").find("tr").css({opacity: 0.5});
                var numDays = $("#number-days-input").val();
                var data = {
                    job: "get_number_submitteds_per_day",
                    numDays: numDays
                };
                $.getJSON("report_stuff", data).done(showResults);
            }


            function showResults(d) {


                $("#num-submitteds-table").empty();


                var maxNumSteps = (function () {
                    var val = 0;
                    Object.keys(d).forEach(function (key) {
                        val = Math.max(val, d[key]);
                    });
                    return val;
                }());


                for (var date in d) {

                    var $newRow = $row.clone();

                    var numberDone = d[date];
                    var percentDone = parseInt((numberDone / maxNumSteps) * 100) + "%";

                    $newRow.find(".submitted-date").text(date);
                    $newRow.find(".submitted-bar").css({width: percentDone});
                    $newRow.find(".submitted-percent-text").text(numberDone);
                    $("#num-submitteds-table").append($newRow);
                }
            }

        }
);
