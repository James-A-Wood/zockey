/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
 * 
 * 
 *      JavaScript for chat.php!
 * 
 * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

define(
        [
            "jquery",
            "jqueryui",
            "bootstrap"
        ],
        function ($) {


            // saving the ID of the last message displayed
            var lastChatID = 0;
            var checkMessagesInteval = 10000; // 10000


            var displayMessage = (function () {


                // saving the time of the last displayed message so we don't repeat it on consecutively updated messages
                var lastDisplayedTime = "";
                var lastMessageID = null;


                return function (thisMessage) {


                    // returning if nothing was passed in, i.e., no messages to display, or
                    // this message has already been displayed
                    if (!thisMessage || lastMessageID === thisMessage.id) {
                        return;
                    }


                    lastMessageID = thisMessage.id;


                    // hiding the "no-messages-message"
                    $(".no-messages-message").hide();


                    // keeping track of the latest message displayed, so we don't repeat it
                    if (thisMessage.id) {
                        lastChatID = Math.max(lastChatID, thisMessage.id);
                    }


                    // saving the lastChatID in storage, so we can pass it to the assignment.js 
                    sessionStorage.lastChatID = lastChatID;


                    // building the message itself
                    var $message = $("<div class='message'/>").addClass(thisMessage.sender).text(thisMessage.message);


                    // appending the name of the sender (either "Wood" or the user's username) and the time it was sent 
                    var sender = (thisMessage.sender === "admin") ? "Wood" : localStorage.username;
                    var date = getTime(thisMessage.created_at);


                    // only displaying the date if some time has passed since the last date was displayed
                    if (date !== lastDisplayedTime) {
                        var $messageDate = $("<span class='message-date'/>").text(sender + " (" + date + ")");
                        lastDisplayedTime = date;
                    } else {


                        // removing some of the border from the top
                        $message.addClass("dateless");
                    }


                    // appending the date to the message itself
                    $message.append($messageDate);


                    // clearing the no-messages-message
                    $("#no-messages-message").remove();


                    // appending the message
                    $("#chats-holder").append($message);


                    // making sure that we're scrolled all the way down to the bottom
                    $("#chats-frame").scrollTop($("#chats-frame")[0].scrollHeight);


                    // enabling the clear-chats-button
                    clearChatsButton.disabled(false);
                };
            }());


            checkForMessages();
            setInterval(checkForMessages, checkMessagesInteval);
            function checkForMessages() {


                // preparing the data to send to the server
                var dataToSend = {
                    jobToDo: "retrieve_chats",
                    aboveID: lastChatID
                };


                // sending the request
                $.getJSON("/chat_stuff", dataToSend).done(function (d) {


                    // cycling through and displaying each message
                    d.forEach(displayMessage);

                }).fail(function (d) {
                    console.log(d);
                    console.log("retrieve_chats failed!");
                });
            }


            // wiring up the send-message-button
            function sendMessage() {


                // getting user input - exiting if there is none
                var message = $("#message-input").val().trim();
                if (!message) {
                    return;
                }


                // emptying the text input
                $("#message-input").attr({disabled: true});


                // preparing the data to send
                var dataToSend = {
                    message: message,
                    sender: "user",
                    jobToDo: "upload_new_message"
                };


                // making the ajax request
                $.getJSON("/chat_stuff", dataToSend).done(function (messages) {


                    // displaying each message in turn
                    messages.forEach(displayMessage);


                    // clearing the #message-input
                    $("#message-input").val("").attr({disabled: false});

                }).fail(function (d) {
                    console.log(d);
                });
            }


            function getTime(message) {
                var dt = message.split(" ")[1].split(":");
                return dt[0] + ":" + dt[1];
            }


            // wiring up the message input to send the message on Enter press
            $("#message-input").keydown(function (e) {
                if (e.keyCode === 13) {
                    e.preventDefault();
                    sendMessage();
                }
            });


            var clearChatsButton = (function () {


                // wiring up the chats clearChatsButton, by default
                $("#clear-chats-button").click(clearChats);

                function clearChats() {

                    $("#clear-chats-button").off("click", clearChats);


                    // sending the "delete" request
                    $.getJSON("/chat_stuff", {
                        jobToDo: "erase_all_messages"
                    }, function () {


                        $("#clear-chats-button").click(clearChats);


                        // removing all messages
                        $(".message").fadeTo(400, 0, function () {
                            $(this).remove();
                        });


                        disabled(true);


                        $(".no-messages-message").show();

                    }).fail(function (d) {
                        console.log("Erasing all messages failed!");
                        console.log(d);
                    });
                }


                // disabling the clear-chats-button, 'cause there are no more messages to erase
                function disabled(value) {
                    $("#clear-chats-button").prop({disabled: value});
                }


                return {
                    disabled: disabled
                };
            }());
        }
);
