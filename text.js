

define(
        [
            "jquery",
            "jqueryui"
        ],
        function ($) {


            $(function () {


                // clearing the assignment_results object
                sessionStorage.removeItem("assignment_results");


                // wiring up the assignment-buttons
                $(".assignment-button").click(function () {
                    var db_id = $(this).attr("data-db_id");
                    window.location = "/assignment/" + db_id;
                });


                // wiring up the chapter-title-holder, so they slide open up when clicked
                $(".chapter-title-holder").click(function () {


                    // remembering which tabs are opened, each time a chapter-title-holder is clicked
                    if ($(this).closest(".chapter-holder").hasClass("opened")) {
                        sessionStorage.removeItem("previouslyOpenedTab");
                    } else {
                        sessionStorage.previouslyOpenedTab = $(this).data("chapter_id");
                    }


                    var $thisCollapsible = $(this).siblings(".collapsible");


                    // restoring all the down-pointing arrows (hiding some down below, maybe)
                    $(".collapsible").parent().removeClass("opened").addClass("closed");


                    // if this menu is open, then simply closing it and returning
                    if ($thisCollapsible.css("display") === "block") {
                        $thisCollapsible.slideUp();
                        return;
                    }


                    // hiding the down-pointing arrow on the parent div
                    $(this).parent().addClass("opened").removeClass("closed");


                    // otherwise, closing all menus, and opening this one
                    $(".collapsible").slideUp();
                    $thisCollapsible.slideDown();
                });


                // on page load, re-opening any previously opened tabs
                var $tabToOpen = $(".chapter-title-holder[data-chapter_id='" + sessionStorage.previouslyOpenedTab + "']");
                $tabToOpen.trigger("click");


                // styling the buttons of assignments that have been done before
                $(".assignment-button").each(function () {


                    var $this = $(this);
                    var times = $this.attr("data-num_times_done");


                    if (times > 0) {


                        // removing 'done', and adding 'btn-default'
                        $this.removeClass("btn-default").addClass("done");


                        // styling for done_as_active
                        if ($this.hasClass("done-active")) {
                            $this.addClass("btn-success");
                        } else {
                            $this.addClass("btn-primary");
                        }


                        // adding the number of times, if 2 or more...
                        if (times > 1) {
                            $this.find(".done-check-mark").after("<span class='done-times'>&times;" + times + "</span>");
                        }
                    }
                });


                // adding a "percent done" heading to each $chapter_title,if we're logged in
                if (localStorage.isLoggedIn) {


                    $(".chapter-title-holder").each(function () {


                        // being' anal
                        var $this = $(this);


                        // counting the number of assignments in this chapter, and the number this student has done
                        var numberAssignments = $this.siblings(".collapsible").find(".assignment-button").length;
                        var numberDone = $this.siblings(".collapsible").find(".done").length;
                        var percent = numberDone / numberAssignments;


                        // appending the "percent-done" label only if at least one assignmet has been done
                        if (percent > 0) {


                            var percentDoneText = (parseInt(percent * 100) + "% 完成");
                            var $label = $("<span/>").addClass("percent-done-label").text(percentDoneText);


                            // appending the label
                            $this.append($label);


                            // animating the label
                            $label.delay(1000).animate({
                                opacity: 1,
                                top: 0
                            }, 600);


                            // coloring the label skyblue if all problems are done
                            if (percent === 1) {
                                $(".percent-done-label").last().css({color: "skyblue"});
                            }
                        }
                    });
                }


                // adding an "active-assignment" thing if there are any .active-assignments inside
                $(".chapter-holder").each(function () {
                    var $this = $(this);
                    if ($this.find(".active-assignment").length > 0) {
                        $this.addClass("active-assignment");
                    }

                });


                // formatting assignment buttons that have been done as guest (and are saved in sessionStorage)
                if (!localStorage.isLoggedIn) {


                    // retrieving the completed assignments from sessionStorage
                    var completed = sessionStorage.getItem("completedAsGuest");
                    if (!completed) {
                        return;
                    }
                    completed = JSON.parse(completed);


                    // formatting the buttons
                    for (var assignment_id in completed) {
                        $(".assignment-button[data-db_id=" + assignment_id + "]").addClass("btn-success");
                    }
                }


                // wiring up the #open-all-button
                $("#open-all-button").click(function () {


                    if ($(".collapsible").css("display") === "none") {
                        $(".collapsible").addClass("opened").removeClass("closed").slideDown();
                    } else {
                        $(".collapsible").addClass("closed").removeClass("opened").slideUp();

                    }
                });

            });
        });
