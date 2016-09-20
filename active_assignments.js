define(
        [
            "jquery",
            "jqueryui"
        ],
        function ($) {


            $(function () {


                var numberActiveDisplay = (function () {


                    function refresh() {
                        var numberActive = $(".currently-active").length;
                        var numberSemester = $(".current-semester").length;
                        $("#number-active").text(numberActive);
                        $("#number-semester").text(numberSemester + numberActive);
                    }


                    // calling the function once on instantiation
                    refresh();


                    return {
                        refresh: refresh
                    };
                }());



                // anal shortcut
                var $kyoushitsuSelector = $("#kyoushitsu-selector");


                // making AssignmentButtons sortable
                $(".assignment-buttons-holder").sortable({
                    items: ".assignment-button",
                    stack: ".assignment-button",
                    stop: function () {


                        // retrieving the section that these assignments are in
                        var sectionID = $(this).data("section_id");


                        // getting the section id's, in their new order
                        var assignmentIDs = [];
                        $(this).find(".assignment-button").each(function () {
                            assignmentIDs.push($(this).data("assignment_id"));
                        });


                        // preparing the data object
                        var data = {
                            job: "reorder_assignment_junbans",
                            section_id: sectionID,
                            ids: assignmentIDs
                        };


                        // making the AJAX call
                        $.post("active_assignment_stuff", data).done(function (d) {
                            // console.log(d);
                        }).fail(function (d) {
                            console.log(d);
                        });
                    }
                });


                $("#texts-sortable-holder").sortable({
                    item: ".text-holder",
                    stack: ".text-holder",
                    containment: "parent",
                    stop: function () {


                        // getting the section id's, in their new order
                        var textIDs = [];
                        $(this).find(".text-holder").each(function () {
                            var textID = $(this).data("text_id");
                            textIDs.push(textID);
                        });


                        // preparing the data object
                        var data = {
                            job: "reorder_text_junbans",
                            ids: textIDs
                        };


                        // making the AJAX call
                        $.post("active_assignment_stuff", data).done(function (d) {
//                            console.log(d);
                        }).fail(function (d) {
                            console.log(d);
                        });
                    }
                });



                // making the chapter-holders sortable
                $(".text-holder").sortable({
                    items: ".chapter-holder",
                    stack: ".chapter-holder",
                    axis: "y",
                    containment: "parent",
                    stop: function () {


                        // getting the ID of the text the chapter belongs to
                        var textID = $(this).data("text_id");


                        // getting the section id's, in their new order
                        var chapterIDs = [];
                        $(this).find(".chapter-holder").each(function () {
                            var chapterID = $(this).data("chapter_id");
                            chapterIDs.push(chapterID);
                        });


                        // preparing the data object
                        var data = {
                            job: "reorder_chapter_junbans",
                            text_id: textID,
                            ids: chapterIDs
                        };


                        // making the AJAX call
                        $.post("active_assignment_stuff", data).done(function (d) {
//                            console.log(d);
                        }).fail(function (d) {
                            console.log(d);
                        });
                    }
                });


                // making sections sortable
                $(".chapter-holder").sortable({
                    items: ".section-block",
                    stack: ".section-block",
                    axis: "y",
                    containment: "parent",
                    stop: function () {


                        // getting the chapter ID
                        var chapterID = $(this).data("chapter_id");


                        // getting the section id's, in their new order
                        var sectionIDs = [];
                        $(this).find(".section-block").each(function () {
                            var section_id = $(this).data("section_id");
                            sectionIDs.push(section_id);
                        });


                        // preparing the data object
                        var data = {
                            job: "reorder_section_junbans",
                            chapter_id: chapterID,
                            ids: sectionIDs
                        };


                        // making the AJAX call
                        $.post("active_assignment_stuff", data).done(function (d) {
//                            console.log(d);
                        }).fail(function (d) {
                            console.log(d);
                        });
                    }
                });


                // wiring up the .section-button
                $(".section-button").click(function (e) {

                    e.stopPropagation();

                    var array = [];
                    $(this).parent().next(".assignment-buttons-holder").find(".assignment-button").each(function () {
                        var id = $(this).data("assignment_id");
                        array.push(id);
                    });

                    var data = {
                        job: "toggle_state",
                        assignment_ids: array
                    };

                    // calling toggleActiveState, passing in ALL the assignment_ids from the enclosed assignment buttons
                    toggleActiveState(data);
                });


                // wiring up the buttons to slide open stuff under them
                $(".toggle-button").click(function () {
                    toggle({button: $(this), slide: true});
                });


                // pre-opening any .folding-divs which have ".current-semester" or ".currently-active" elements in them
                $(".folding-div").each(function () {
                    var $this = $(this);
                    if ($this.find(".currently-active").length > 0 || $this.find(".current-semester").length > 0) {
                        $this.show();
                    }
                });


                // wiring up the assignment-buttons
                // cycling:  ".current-semester" -> ".currently-active" -> nothing;
                $(".assignment-button").click(function () {
                    var array = [$(this).data("assignment_id")];
                    var data = {
                        job: "toggle_state",
                        assignment_ids: array
                    };
                    toggleActiveState(data);
                });


                function toggleActiveState(data) {


                    $.post("active_assignment_stuff", data).done(function (setValue) {


                        data.assignment_ids.forEach(function (id) {


                            var $button = $(".assignment-button[data-assignment_id=" + id + "]");


                            if (setValue === "none") {
                                $button.removeClass("currently-active current-semester");
                            } else if (setValue === "semester") {
                                $button.removeClass("currently-active").addClass("current-semester");
                            } else {
                                $button.removeClass("current-semester").addClass("currently-active");
                            }
                        });


                        // changing the numbers up top
                        numberActiveDisplay.refresh();

                    }).fail(function (d) {
                        console.log(d);
                    });
                }


                function toggle(obj) {
                    if (obj.slide) {
                        (obj.button).next(".folding-div").slideToggle();
                    } else {
                        (obj.button).next(".folding-div").toggle();
                    }
                }


                // wiring up the #kyoushitsu-selector
                $kyoushitsuSelector.change(function () {


                    var kyoushitsu = $(this).val();


                    // disabling and fading the #kyoushitsu-selector, until page reload
                    $("body").addClass("now-ajaxing");


                    var data = {
                        job: "set_selected_kyoushitsu_in_session",
                        kyoushitsu: kyoushitsu
                    };


                    // sending the ajax request
                    $.post("active_assignment_stuff", data).done(function (d) {
                        sessionStorage.activeSections_hasJustReloaded = true;
                        localStorage.admin_current_selected_kyoushitsu = kyoushitsu;
                        location.reload();
                    }, "json").fail(function (dataBack) {
                        localStorage.removeItem("admin_current_selected_kyoushitsu");
                        console.log("Error returning from /active_section_stuff");
                        console.log(dataBack.responseText);
                    });
                });


                var closeAllButton = (function () {


                    var $closeAllButton = $("#close-all-button");
                    var openText = $closeAllButton.text();
                    var closedText = "Open All";
                    var nowOpen = true;


                    $closeAllButton.click(function () {

                        if (nowOpen) {
                            $(".folding-div").slideUp();
                            nowOpen = false;
                            $closeAllButton.text(closedText);
                            return;
                        }

                        $(".folding-div").filter(function () {
                            var hasActive = $(this).find(".currently-active").length;
                            var hasSemester = $(this).find(".current-semester").length;
                            if (hasActive || hasSemester) {
                                $(this).slideDown();
                            }
                        });

                        $closeAllButton.text(openText);
                        nowOpen = true;
                    });
                }());


                // reloading automatically if localStorage says that something has changed
                $(window).focus(function () {

                    if (localStorage.reloadActiveAssignments) {
                        localStorage.removeItem("reloadActiveAssignments");
                        window.location.reload();
                    }
                });
            });
        });
