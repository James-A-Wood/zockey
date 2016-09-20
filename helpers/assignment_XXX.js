


define(
        ["jquery"],
        function ($) {


            // loading the style sheet - THIS WORKS!  Is this the first time that I have done this?
            $("head").append("<link rel='stylesheet' href='/css/chatManager.css' type='text/css'>");


            return function (params) {


                if (!params || !params.container) {
                    console.log("chatManager.js requires an object with a reference to the parent container!");
                    return false;
                }


                var lastChatDisplayed = 0;
                var retrieveChatsTimeout;


                // building the HTML markup
                var $chatsHolder = $("<div/>").prop({id: "chats-holder"}).addClass("col-xs-12");
                var $hideChatsButton = $("<button/>")
                        .prop({id: "hide-chats-button"})
                        .addClass("btn btn-default btn-xs")
                        .text("Hide All");
                var $chatButtonsHolder = $("<div/>")
                        .prop({id: "chat-buttons-holder"})
                        .addClass("col-xs-12")
                        .append($hideChatsButton);
                var $deleteSelectedUserMessages = $("<button/>")
                        .prop({id: "chat-delete-button"})
                        .addClass("btn btn-default btn-xs")
                        .text("Delete Chats");


                (params.container).append($chatButtonsHolder, $chatsHolder);


                $("#hide-chats-button").click(hideChatsButtonHandler);


                var deleteSelectedUserMessages = (function () {


                    function remove() {
                        $("#chat-delete-button").remove();
                    }


                    function show() {


                        var user_id = userButtons.getSelectedUserID();


                        $deleteSelectedUserMessages.off("click").click(function () {


                            $.getJSON("/chat_stuff", {
                                jobToDo: "erase_all_messages",
                                user_id: user_id
                            }, function (d) {


                                // removing all chats by the selected user
                                $(".chat").filter(function () {
                                    return $(this).data("user_id") === user_id;
                                }).remove();


                                // also removing the user-button
                                $(".user-button").filter(function () {
                                    return $(this).data("user_id") === user_id;
                                }).remove();

                            }).fail(function (d) {
                                console.log(d);
                            });
                        });


                        // adding the delete button
                        $("#chat-buttons-holder").append($deleteSelectedUserMessages);
                    }


                    return {
                        remove: remove,
                        show: show
                    };
                }());


                var userButtons = (function () {


                    var inactiveState = "btn-default";
                    var activeState = "btn-success";


                    function deactivateAll() {
                        $(".user-button").removeClass(activeState).addClass(inactiveState);
                        deleteSelectedUserMessages.remove();
                    }


                    function activate($button) {
                        $(".user-button").removeClass(activeState).addClass(inactiveState);
                        $button.removeClass(inactiveState).addClass(activeState);
                        deleteSelectedUserMessages.show();
                    }


                    function userButtonsEnabled(disabledState) {

                        $(".user-button").prop({disabled: disabledState});

                        if (disabledState) {
                            deactivateAll();
                        }
                    }


                    function getSelectedUserID() {
                        return $(".user-button." + activeState).data("user_id");
                    }


                    function selected(number) {


                        // returning TRUE if no .user-button is selected
                        if ($(".user-button." + activeState).length === 0) {
                            return true;
                        }


                        // getting the user_id of the currently selected button, if any
                        var nowSelected = getSelectedUserID();


                        // checking whether it's a number
                        var isSameNumber = (nowSelected === number);


                        return isSameNumber;
                    }


                    return {
                        activate: function ($button) {
                            deactivateAll();
                            activate($button);
                        },
                        deactivateAll: deactivateAll,
                        userButtonsEnabled: userButtonsEnabled,
                        selected: selected,
                        getSelectedUserID: getSelectedUserID
                    };
                }());


                function hideChatsButtonHandler() {


                    // sliding up the #chats-holder
                    $("#chats-holder").slideToggle();


                    userButtons.deactivateAll();


                    // toggling the button text between "Show" and "Hide", depending
                    if ($("#chats-holder").css("display") !== "none") {

                        $("#hide-chats-button").text("Hide All");
                        userButtons.userButtonsEnabled(false);
                        showAll();
                    } else {

                        $("#hide-chats-button").text("Show All");
                        userButtons.userButtonsEnabled(true);
                        hideAll();
                    }
                }


                function showAll() {
                    $("#chats-holder").find(".chat").show();//hide().slideDown();
                }


                function hideAll() {
                    $("#chats-holder").show().hide();//slideUp();
                }


                function setMostRecentChatID(newValue) {
                    lastChatDisplayed = Math.max(newValue, lastChatDisplayed);
                }


                function showByID(id) {

                    if (!id) {
                        return false;
                    }


                    // hiding all .chats, then showing only those of the correct user_id
                    $("#chats-holder").find(".chat").hide().filter(function () {
                        return ($(this).data("user_id") === id);
                    }).show();
                }


                function displayMessage(d) {


                    // exiting if nothing was passed in, or if it's not an array, or if the array is empty, etc.
                    if (!d || !Array.isArray(d) || !d.length) {
                        return false;
                    }


                    // for each chat message...
                    d.forEach(function (thisChat) {


                        // setting the highest ID
                        setMostRecentChatID(thisChat.id);


                        // getting the sender's name - first and last name, or username, or "admin" if it's me
                        var user_name = getUserName(thisChat);


                        var salutation = (function () {


                            var time = $("<span/>").addClass("chat-time").text(getTime(thisChat.created_at));
                            var text = "";


                            if (thisChat.sender === "admin") {
                                text = ("Admin → " + user_name + ":");
                            } else {
                                text = (user_name + " → Admin:");
                            }

                            var $span = $("<span/>").addClass("chat-message").html(text).prepend(time);

                            return $span;
                        }());


                        // setting the most recent (=highest) chat id, so we don't repeat any
                        setMostRecentChatID(thisChat.id);


                        // creating the HTML element
                        var $message = $("<div class='chat' />")
                                .addClass(thisChat.sender)
                                .append(salutation)
                                .append(thisChat.message)
                                .data({
                                    user_id: thisChat.user_id,
                                    sender: thisChat.sender,
                                    lastname: thisChat.lastname,
                                    firstname: thisChat.firstname,
                                    username: thisChat.username,
                                    created_at: getTime(thisChat.created_at) // holds the hours and minutes only
                                })
                                .click(uploadAdminMessage);


                        // appending it to the thing
                        $("#chats-holder").append($message);


                        // adding a button, if there isn't with that user_id already
                        if ($(".user-button").filter(function () {
                            return $(this).data("user_id") === thisChat.user_id;
                        }).length === 0) {


                            var username = getUserName(thisChat);


                            var $button = $("<button></button>")
                                    .addClass("user-button btn btn-default btn-xs")
                                    .text(username)
                                    .data({user_id: thisChat.user_id})
                                    .click(function () {


                                        // hiding all other chats but this user's
                                        var id = $(this).data("user_id");
                                        showByID(id);


                                        // styling the buttons so we know which is active
                                        userButtons.activate($(this));
                                    });


                            $("#chat-buttons-holder").append($button);
                        }


                        // hiding the message if the corresponding userButton is not selected
                        if (!userButtons.selected(thisChat.user_id)) {
                            $message.css({display: "none"});
                        }
                    });
                }


                function uploadAdminMessage(event) {


                    event.stopPropagation();
                    event.preventDefault();
                    
                    
                    var user_id = $(this).data("user_id");


                    var message = window.prompt("Message?");
                    if (!message) {
                        return;
                    }


                    message = message.trim();
                    if (!message) {
                        console.log("There was no message left after trimming it!  しっかりしろ!");
                        return;
                    }


                    // replacing any straight quotes with slanted ones (maybe not necessary)
                    message = message.replace(/\'/ig, "’").replace(/\"/ig, "”");


                    $.getJSON("/chat_stuff", {
                        user_id: user_id,
                        sender: "admin",
                        message: message,
                        jobToDo: "upload_new_message"
                    }, function () {
                        retrieveChats();
                        if (params.onAdminMessageUpload) {
                            params.onAdminMessageUpload();
                        }
                    }).fail(function (d) {
                        console.log("Failed!");
                        console.log(d);
                    });
                }


                function getUserName(item) {
                    if (item.lastname && item.firstname) {
                        return item.lastname + " " + item.firstname;
                    } else if (item.username) {
                        return item.username;
                    } else if (item.sender === "admin") {
                        return "admin";
                    } else {
                        return false;
                    }
                }


                function getTime(message) {
                    var dateTime = message.split(" ")[1].split(":");
                    return dateTime[0] + ":" + dateTime[1];
                }


                // wiring up the hideChatsButton
//                $hideChatsButton.click(hideChatsButtonHandler);


                retrieveChats();
                function retrieveChats() {


                    // clearing any old timeouts, before...
                    clearTimeout(retrieveChatsTimeout);


                    // ajaxing...
                    $.getJSON("/chat_stuff", {
                        jobToDo: "get_chats",
                        chats_after_id: lastChatDisplayed
                    }, function (d) {


                        // displaying any chats that were received
                        displayMessage(d);


                        // setting a fresh timeout for 10 seconds hence
                        retrieveChatsTimeout = setTimeout(retrieveChats, 10000);
                    }).fail(function (d) {
                        console.log(d);
                    });
                }


                return {
                    retrieveChats: retrieveChats,
                    setMostRecentChatID: setMostRecentChatID,
                    showAll: showAll,
                    hideAll: hideAll,
                    showByID: showByID,
                    uploadAdminMessage: uploadAdminMessage
                };
            };
        }
);