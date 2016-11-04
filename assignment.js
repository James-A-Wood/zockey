


// loading the JavaScript for the assigment template (shinkei, cards, etc.)
requirejs(
        [
            "jquery",
            "TouchPunch"
        ],
        function ($) {


            // adding the text, chapter, and section info!
            $(function () {


                var chatCheckInterval = 10000; // really 10000
                var lastDisplayedChatID = 0;


                // holds the dateTime of the pageLoad, so we only get chats that showed up AFTER the page was loaded
                var pageLoadDateTime = (function () {
                    var now = (new Date()).getTime();
                    return (new Date(now));
                }());


                // click #chat-message-frame to hide it
                $("#chat-message-frame").click(function () {
                    $(this).removeClass("showing");
                });


                retrieveChats();
                setInterval(retrieveChats, chatCheckInterval);
                function retrieveChats() {


                    $.getJSON("/chat_stuff", {
                        jobToDo: "retrieve_last_message_from_admin"
                    }).done(function (chat) {


                        // returning if the chat is just an empty array (meaning no messages)
                        if (!chat || chat.length === 0) { // NEW TEST added '!chat ||'
                            return;
                        }


                        // retrieving the very last message from admin to user, and..
                        // HAVE TO do it this way because of fucking IE
                        var dateStr = chat.created_at; //returned from mysql timestamp/datetime field
                        var a = dateStr.split(" ");
                        var d = a[0].split("-");
                        var t = a[1].split(":");
                        var messageTime = new Date(d[0], (d[1] - 1), d[2], t[0], t[1], t[2]);


                        // ...displaying the message IF it was sent AFTER the page loaded, and if it hasn't been displayed already
                        var isNewerThanPageLoad = messageTime > pageLoadDateTime;
                        var hasntBeenDisplayedYet = (chat.id !== lastDisplayedChatID);


                        if (isNewerThanPageLoad && hasntBeenDisplayedYet) {
                            lastDisplayedChatID = chat.id;
                            displayMessage(chat.message);
                        }
                    }).fail(function (d) {
                        console.log("Error?");
                        console.log(d);
                    });

                }


                function displayMessage(message) {


                    if (!message) {
                        return;
                    }


                    $("#chat-message-frame").removeClass("showing");
                    $("#message-content").empty().append(message);
                    $("#chat-message-frame").addClass("showing");
                }


                // wiring up the comments form
                $("#assignment-results-comments-form").submit(function (e) {


                    e.preventDefault();


                    // getting and scrubbing the message
                    var message = $("#assignment-results-comments-textarea").val();
                    if (!message || message.trim().length < 1) {
                        return;
                    }
                    message = message.trim();


                    // preparing the data to send
                    var data = {
                        jobToDo: "upload_new_message",
                        sender: "user",
                        message: message
                    };


                    // disabling the form so we can't send another message
                    $.post("/chat_stuff", data).done(function () {
                        $("#assignment-results-comments-textarea").attr("disabled", true).css({color: "#aaa"});
                        $("#assignment-results-comments-form").find("button").remove();
                        $("#message-sent-message").show();
                    });

                });

            });
        });
