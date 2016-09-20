


define(
        [
            "jquery",
            "tools"
        ],
        function ($, tools) {


            return function (params) {


                var mostRecentChatDisplayed = 0;
//                var getChatsTimeout;
                var userColors = {}; // in the format {user-id : random-color}
                var $deleteSelectedUserMessages = $("#chat-delete-button");
                var $hideChatsButton = $("#hide-chats-button");
                var $messageRowMaster = $("#chats-holder").find(".my-template").detach().removeClass("my-template");
                var displayedChatIDs = [];


                if (!sessionStorage.hideChatsOnStartup) {
                    $("#chats-holder-border").show();
                    $hideChatsButton.text("Hide");
                }


                $deleteSelectedUserMessages.click(function () {


                    var $selected = $("#chats-holder").find(".selected");
                    var user_id = $selected.data("user_id");
                    if (!user_id) {
                        return;
                    }


                    var lastname = $selected.data("lastname");
                    var firstname = $selected.data("firstname");
                    if (!window.confirm("Delete all messages from " + lastname + " " + firstname + " ?")) {
                        return;
                    }


                    $.getJSON("/chat_stuff", {
                        jobToDo: "erase_all_messages",
                        user_id: user_id
                    }, function () {


                        // removing all chats by the selected user
                        $("#chats-holder").find(".chat").filter(function () {
                            return $(this).data("user_id") === user_id;
                        }).remove();

                    }).fail(function (d) {
                        console.log(d);
                    });
                });


                // wiring up the hide-chats-button
                $hideChatsButton.click(hideChatsButtonHandler);


                function hideChatsButtonHandler() {


                    // saving the display state of the chats window
                    if ($("#chats-holder-border").css("display") === "none") {
                        sessionStorage.removeItem("hideChatsOnStartup");
                        $hideChatsButton.text("Hide");
                    } else {
                        sessionStorage.hideChatsOnStartup = "true";
                        $hideChatsButton.text("Show");
                    }

                    $("#chats-holder-border").slideToggle();
                }


                function setMostRecentChatID(newValue) {
                    mostRecentChatDisplayed = Math.max(newValue, mostRecentChatDisplayed);
                }


                function displayMessage(chats) {


                    // exiting if nothing was passed in, or if it's not an array, or if the array is empty, etc.
                    if (!chats || !Array.isArray(chats) || !chats.length) {
                        return false;
                    }


                    // NEW TEST reversing the array so we go through it BACKWARDS
                    chats.reverse();


                    // for each chat message...
                    chats.forEach(function (thisChat, index) {


                        // getting the sender's name - first and last name, or username, or "admin" if it's me
                        var user_name = getUserName(thisChat);


                        // setting the most recent (=highest) chat id, so we don't repeat any
                        setMostRecentChatID(thisChat.id);


                        // adding this to the alreadyDisplayed list, or else exiting here
                        if (displayedChatIDs.indexOf(thisChat.id) === -1) {
                            displayedChatIDs.push(thisChat.id);
                        } else {
                            return false;
                        }


                        // generating unique colors to each user's messages
                        var thisUsersColor = userColors[thisChat.user_id] || (function () {
                            var randomColor = tools.pickDarkColor();
                            userColors[thisChat.user_id] = randomColor;
                            return randomColor;
                        }());


                        var $row = $messageRowMaster.clone();
                        $row.find(".message-time").text(getTime(thisChat.created_at));
                        $row.find(".message-sender").text(user_name);
                        $row.find(".message-content").text(thisChat.message).addClass(thisChat.sender === "admin" ? "from-admin" : "");
                        $row.css({color: thisUsersColor});
                        $row.data({
                            chat_id: thisChat.id,
                            user_id: thisChat.user_id,
                            sender: thisChat.sender,
                            lastname: thisChat.lastname,
                            firstname: thisChat.firstname,
                            username: thisChat.username,
                            created_at: getTime(thisChat.created_at) // holds the hours and minutes only
                        });
                        $row.click(function () {
                            $deleteSelectedUserMessages.attr("disabled", true);
                            $(this).siblings().removeClass("selected");
                            $(this).addClass("selected");
                            $deleteSelectedUserMessages.attr("disabled", false);
                        });


                        if (tools.isMobile()) {
                            $row.click(function (event) {
                                uploadAdminMessage({
                                    event: event,
                                    user_id: thisChat.user_id,
                                    lastname: thisChat.lastname,
                                    firstname: thisChat.firstname,
                                    username: thisChat.username
                                });
                            });
                        } else {
                            $row.dblclick(function (event) {
                                uploadAdminMessage({
                                    event: event,
                                    user_id: thisChat.user_id,
                                    lastname: thisChat.lastname,
                                    firstname: thisChat.firstname,
                                    username: thisChat.username
                                });
                            });
                        }


                        // appending it to the thing
                        $("#chats-holder").append($row);


                        // if there are more than 10 chats, then removing them, oldest first
                        while ($("#chats-holder").find(".chat").length > 10) {
                            $("#chats-holder").find(".chat").eq(0).remove();
                        }


                        // slightly lightening the chats, from top to bottom, only on the last iteration
                        if (chats.length > 3 && index === chats.length - 1) {
                            lightenElements();
                        }
                    });
                }


                function lightenElements() {
                    tools.lightenElementsIncrementally({
                        elements: $("#chats-holder").find(".chat"),
                        minOpacity: 0.5
                    });
                }


                function uploadAdminMessage(inputs) {


                    if (!inputs || !inputs.event) {
                        return false;
                    }


                    inputs.event.stopPropagation();
                    inputs.event.preventDefault();


                    var greeting = (function () {
                        var message = "Message to ";
                        if (inputs.lastname && inputs.firstname) {
                            message += inputs.lastname + " " + inputs.firstname + ":";
                        } else if (inputs.username) {
                            message += inputs.username + ":";
                        }
                        return message;
                    }());


                    var message = window.prompt(greeting);
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


                    $.post("/chat_stuff", {
                        user_id: inputs.user_id,
                        sender: "admin",
                        message: message,
                        jobToDo: "upload_new_message"
                    }, function () {
                        retrieveChats();
                        if (params && params.onAdminMessageUpload) {
                            params.onAdminMessageUpload();
                        }
                    }).fail(function (d) {
                        console.log("Failed!");
                        console.log(d);
                    });
                }


                // returns either firstname/lastname, or the username (for non-registered users), or "admin" if it's me
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


                // getting and formatting the time the message was sent
                function getTime(message) {
                    var dateTime = message.split(" ")[1].split(":");
                    return dateTime[0] + ":" + dateTime[1];
                }


//                retrieveChats(10);
                function retrieveChats(limit) {


                    // clearing any old timeouts, before...
//                    clearTimeout(getChatsTimeout);


                    // ajaxing...
                    $.getJSON("/chat_stuff", {
                        jobToDo: "get_chats",
                        limit: limit,
                        chats_after_id: mostRecentChatDisplayed
                    }, function (d) {


                        // displaying any chats that were received
                        displayMessage(d);


                        // setting a fresh timeout for 10 seconds hence
//                        clearTimeout(getChatsTimeout);
//                        getChatsTimeout = setTimeout(retrieveChats, 10000);
                    }).fail(function (d) {
                        console.log(d);
                    });
                }


                return {
                    retrieveChats: retrieveChats,
                    setMostRecentChatID: setMostRecentChatID,
                    uploadAdminMessage: uploadAdminMessage
                };
            };
        }
);