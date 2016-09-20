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
            "jquery"
        ],
        function ($) {


            $(function () {


                // storing the original values of all the inputs so we can restore them if there's an error
                var originalValues = (function () {
                    var object = {};
                    $(".basic-info-input").each(function () {
                        var id = $(this).attr("id");
                        var value = $(this).attr("value");
                        object[id] = value;
                    });
                    return object;
                }());


                // triggering the .change-button click on input blur
                $(".basic-info-input").blur(function () {

                    // only triggering the click if this input is enbled
                    if (!$(this).attr("disabled")) {
                        $(this).closest(".item-holder").find(".change-button").click();
                    }
                });


                // wiring up the password-change-button
                $("#password-change-button").click(function () {
                    $("#password-change-form").slideToggle();
                });


                // wiring up the pasword-change-send-button
                $("#password-change-form").submit(function (e) {


                    e.preventDefault();


                    var oldPassword = $("#oldPassword").val();
                    var newPassword1 = $("#newPassword1").val();
                    var newPassword2 = $("#newPassword2").val();


                    // checking that all fields have been filled in
                    if (!oldPassword || !newPassword1 || !newPassword2) {
                        $("#password-change-report").empty().html("<p>全ての情報を入力してください。</p>");
                        return;
                    }


                    // checking that the same new password has been entered twice
                    if (newPassword1 !== newPassword2) {
                        $("#password-change-report").empty().html("<p>新しいパスワードを、同じものを２回入力してください。</p>");
                        return;
                    }


                    // checking for spaces
                    if (newPassword1.indexOf(" ") !== -1) {
                        $("#password-change-report").empty().html("<p>新しいパスワードにスペースが入っているようです！</p>");
                        return;
                    }


                    // checking for 5+ alphanumeric letters
                    if (!/^\w{5,}$/ig.test(newPassword1)) { // "\w" meaning any "working" character, equivalent to [a-z0-9]
                        $("#password-change-report").empty().html("<p>新しいパスワードを5字以上の英数字にしてください！</p>");
                        return;
                    }


                    // checking for unchanged password
                    if (oldPassword === newPassword1) {
                        $("#password-change-report").empty().html("<p>新しいパスワードは現在のパスワードと同じです！</p>");
                        return;
                    }


                    // preparing the data
                    var passwordData = {
                        oldPassword: oldPassword,
                        newPassword: newPassword1
                    };


                    // sending the request to the server
                    $.post("change_user_password", passwordData).done(function (returnedData) {


                        if (parseInt(returnedData) === 0) {


                            $("#password-change-report").html("<p>新しいパスワードは " + newPassword1 + " です！");
                            $(".password-input").val("").css({opacity: 0.5}).attr({disabled: "true"});
                            $("#password-change-send-button").attr({disabled: true});


                            return;
                        }

                        $("#password-change-report").html("<p>" + returnedData + "</p>");

                    }).fail(function (returnedData) {
                        console.log(returnedData);
                    });
                });


                // wiring up the .change-buttons
                $(".item-holder").submit(function (e) {


                    e.preventDefault();


                    var $this = $(this);
                    var $thisButton = $this.find(".change-button");
                    var $thisInput = $this.find(".basic-info-input");


                    $thisButton.removeClass("btn-primary").addClass("btn-default");


                    $("#error-message-holder").empty();


                    // activating the space and exiting, if it isn't already active
                    if ($thisInput.is(":disabled")) {


                        // disabling all .basic-info-inputs
                        $(".basic-info-input").prop({disabled: true});


                        // enabling this input, and putting focus on it
                        $thisInput.prop({disabled: false}).focus();


                        // changing the button text to 決定
                        $thisButton.text("決定").removeClass("btn-default").addClass("btn-primary");


                        // exiting
                        return;
                    }


                    var originalValue = originalValues[$thisInput.attr("id")];

                    $thisButton.text("変える");
                    $thisInput.prop({disabled: true});
                    var column = $thisInput.attr("data-column");
                    var newValue = $thisInput.val();

                    var data = {};
                    data[column] = newValue;


                    // returning if there is no new value
                    if (!newValue) {
                        $thisInput.val(originalValue);
                        $this.removeClass("has-success").addClass("has-error");
                        return;
                    }


                    // returning if there are spaces
                    if (newValue.indexOf(" ") !== -1) {
                        $thisInput.val(originalValue);
                        $("#error-message-holder").append("<p>スペースが入っているようです！</p>");
                        return;
                    }


                    // doing nothing if the value has not changed
                    if (newValue === originalValue) {
                        return;
                    }


                    // sending info to the server
                    $.post("update_user_data", data).done(function (returnedData) {

                        if (returnedData === newValue) {

                            window.location.reload();

                        } else {

                            $thisInput.val(originalValue);
                            $this.removeClass("has-success").addClass("has-error").blur();
                            $("#error-message-holder").append("<p>入力したものは使えません！</p>");
                            console.log(returnedData);
                        }

                    }).fail(function (returnedData) {
                        $thisInput.val(originalValue);
                        $this.removeClass("has-success").addClass("has-error");
                        $("#error-message-holder").append("<p>エラーが発生しました！</p>");
                        console.log(returnedData);
                    });
                });
            });
        });
