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
            "konva/circleGraph",
            "tools",
            "jqueryui"
        ],
        function ($, circleGraphFactory, tools) { //


            $(function () {


                // creating the circleGraph generator for the "chapter completed" graphs
                var lessonCompletedGraph = circleGraphFactory({
                    outerRadius: 37,
                    innerRadius: 33,
                    foregroundFill: "limegreen",
                    labelFontSize: 12,
                    duration: 1,
                    pauseBeforeStart: 1
                });


                function barThing($holder, percent) {


                    var delayBeforeGrow = 1000;
                    var lengthenSpeed = 2000;


                    setTimeout(function () {


                        $holder.find(".bar-foreground").animate({
                            width: (percent * 100) + "%"
                        }, lengthenSpeed, "easeOutQuad");


                        // dynamically retrieving the percent-length of the 
                        var holderWidth = parseInt($holder.css("width"));
                        var myInterval = setInterval(function () {
                            var foregroundWidth = parseInt($holder.find(".bar-foreground").css("width"))
                            var percentText = foregroundWidth / holderWidth;
                            percentText = parseInt(percentText * 100);
                            $holder.find(".number-holder").text(percentText);
                        }, 50);


                        // clearing the setInterval after it's finished
                        setTimeout(function () {
                            clearInterval(myInterval);
                        }, lengthenSpeed);

                    }, delayBeforeGrow);
                }


                function showUserData(d) {


                    // adding the review words, if any
                    var words = JSON.parse(d.review_words);
                    if (words && words.length > 0) {


                        // removing the "No words to review" text
                        $("#review-words-holder").empty();


                        // for each word, adding a span holding the pair, English and Japanese
                        var $mySpan = $("<span class='pair-holder col-xs-12 col-sm-6 col-md-4 col-lg-3'/>");
                        words.forEach(function (item) {
                            var $pairSpan = $mySpan.clone().text(item.english + " - " + item.japanese);
                            $("#review-words-holder").append($pairSpan);
                        });


                        // adding "+3 more" in the bottom (doesn't have to be 3)
                        var numAdditionalWords = d.review_words_total_number - words.length;
                        if (numAdditionalWords > 0) {
                            var $additionalWordsSpan = $mySpan.clone().text("+ " + numAdditionalWords + " more").css({fontStyle: "italic", float: "right", textAlign: "right"});
                            $("#review-words-holder").append($additionalWordsSpan);
                        }
                    }


                    var totalNumAssignments = $(".assignment-button").length;
                    var totalNumDone = $(".done").length;
                    var totalNumberDoneEver = d.userTotalNumberSubmitted;
                    var averageTimeTaken = Math.round(d.userAverageTimeTaken * 10) / 10;
                    var percentSemesterAssignmentsDone = d.numUniqueSubmittedInSemester / d.totalAssignmentsInSemester;
                    var percent = 0; // given a value below


                    if (totalNumAssignments) {
                        percent = parseInt(totalNumDone / totalNumAssignments * 100) / 100;
                    }


                    // adding the circleGraph ONLY if there are any active assignments
                    if (d.totalAssignmentsInSemester) {
                        barThing($("#semester-done"), percentSemesterAssignmentsDone);
                    }


                    // adding the circleGraph ONLY if user is registered in a kyoushitsu
                    if (sessionStorage.kyoushitsu) {
                        barThing($("#current-done"), percent);
                    }


                    // adding the circleGraph ONLY IF there is any averageScore
                    if (d.averageScore) {
                        barThing($("#correct-percent"), d.averageScore);
                    }


                    $("#total-number-done").find(".number-holder").text(totalNumberDoneEver);
                    $("#average-time-taken").find(".number-holder").text(averageTimeTaken + " 秒");
                }


                // wiring up the assignment-buttons
                $(".assignment-button").click(function () {
                    var db_id = $(this).attr("data-db_id");
                    window.location = "/assignment/" + db_id; // the db_id will be removed from the URL in PHP
                });


                $(".chapter-title").each(function (index) {

                    var $this = $(this);

                    var percent = (function () {
                        var numAssignments = $this.closest(".chapter-holder").find(".assignment-button").length;
                        var numDone = $this.closest(".chapter-holder").find(".done").length;
                        var percent = 0.0001;
                        if (numAssignments > 0 && numDone > 0) {
                            percent = numDone / numAssignments;
                        }
                        return percent;
                    }());


                    // showing the graphs on DESKTOP only!
                    if (tools.isMobile()) {

                        var text = Math.floor(percent * 100) + "% 完成"; // converting 0.87 to "87%"
                        $this.find(".chapter-finished-graph-holder").append(text);

                    } else {

                        var id = "my-chapter-title-" + index;
                        $this.find(".chapter-finished-graph-holder").attr("id", id);

                        var myGraph = lessonCompletedGraph({
                            container: id,
                            percent: percent
                        });
                    }
                });


                // finally, retrieving the data from the server, and calling "showUserData" when done
                $.getJSON("/user_stuff", {
                    jobToDo: "get_user_page_info",
                    limit: tools.isMobile() ? 5 : 20 // only the twenty most recent words
                }).done(showUserData).fail(function (d) {
                    console.log("get_use_page_info failed!");
                    console.log(d);
                });


            });


        }
);

