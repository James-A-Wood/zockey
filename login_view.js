/*
 * 
 * This is the javascript counterpart to the login_view.php page!
 * 
 */


requirejs(
        ['jquery'],
        function ($) {


            $(function () {


                // pre-loading any values saved in localStorage
                $.each($(".loginInfo"), function () { // cycling through each .loginInfo
                    var name = $(this).attr("name"); // saving the 'name' attribute value
                    if (localStorage[name]) { // if that name has been saved in localStorage...
                        $(this).val(localStorage[name]); // ... then assigning that value to the current input
                    }
                });


                // enabling the submitButton when the passwordBox is typed in
                $("#password").on("keyup", function () {
                    $("#submitButton").removeAttr("disabled").css("opacity", 1);
                });


                // when the form is submitted...
                $("#loginStuff").on("submit", function (e) {


                    e.preventDefault();


                    var thereAreEmptyInputs = false;


                    // saving values to localStorage on submit
                    $.each($(".loginInfo"), function () {

                        var name = $(this).attr("name");
                        var value = $(this).val();

                        if (!value || value === "学校" || value === "学年" || value === "組" || value === "出席番号") {
                            message.show("学校、学年、組、出席番号を全部インプットしましょう！");
                            thereAreEmptyInputs = true;
                        } else {
                            localStorage[name] = value;
                        }
                    });


                    // putting focus on passwordBox by default
                    $("#password").focus();


                    // stopping here if any inputs are empty
                    if (thereAreEmptyInputs) {
                        return;
                    }


                    // preparing the data to send via ajax
                    var studentData = {
                        gakkou: localStorage.gakkou,
                        nen: sessionStorage.nen,
                        kumi: localStorage.kumi,
                        ban: localStorage.ban,
                        password: $("#password").val() // password not saved in localStorage
                    };


                    // making the ajax call
                    $.ajax({
                        url: "check_login_password",
                        type: "POST",
                        data: studentData,
                        dataType: "json",
                        success: successfullLogin,
                        error: function (data) {
                            console.log("Problem logging in!");
                            console.log(data);
                        }
                    });
                });


                function successfullLogin(dataBack) {


                    // checking if a 'name' key has been returned (which only happens when the query has gone through)
                    if (dataBack) {


                        // disabling and dimming the submitButton
                        $("#submitButton").addClass("disabled").css("opacity", 0.5);


                        // putting student's name into the password input, and deactivating it
                        // (although not formally 'disabling' it, because that dims the whole box)
                        $("#password").val("Logged in: " + dataBack).css({
                            color: "green",
                            pointerEvents: "none"
                        }).blur();


                        // clearing the messageHolder
                        $("#messageHolder").text("");


                        // moving on to the student page, after a slight pause
                        setTimeout(function () {
                            location.reload();
                        }, 500);


                    } else {


                        message.error(true);
                        message.show("パスワードが違うようです！");
                    }
                }


                var message = {
                    show: function (message) {
                        message = message || "";
                        $("#messageHolder").text(message);
                    },
                    error: function (isError) {
                        if (isError) {
                            $("#password").val("").parent().removeClass("has-success").addClass("has-error");
                        } else {
                            $("#password").val("").parent().removeClass("has-error").addClass("has-success");
                            $("#password").attr("disabled", "disabled");
                        }
                    }
                };
            });

        });

