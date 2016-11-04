


define(
        [
            "jquery",
            "helpers/shakeElement",
            "tools",
            "bootstrap"
        ],
        function ($, shakeElement, tools) {


            // linking up the 'user-registration' button to jump to the /register page
            $("#user-register-button").click(function () {
                window.location.assign("/register");
            });


            // NEW TEST preventing page zoom, because it messes up the login box stuff
            if (tools.isMobile() && $("#viewport").length === 1) {
                var content = $("#viewport").prop("content");
                content += ", initial-scale=1.0, maximum-scale=1.0, user-scalable=no";
                $("#viewport").prop("content", content);
            }


            // clearing the text
            sessionStorage.text = "";


            // loading each YouTube video ONLY when it's onscreen
            // copying the source from the data-src attribute to the real "src" attribute
            $(".home-video").each(function () {
                var $this = $(this);
                tools.elementOnScreen($this, function () {
                    $this.attr("src", $this.data("src"));
                });
            });


            // preloading the username, and setting focus on the password input
            if (localStorage.username) {
                $("#username-input").val(localStorage.username);
                $("#password-input").focus();
            }


            // clearing the password-wrong class every time a key is pressed
            $("#password-input").off("keydown").keydown(function () {
                $(this).removeClass("password-wrong");
            });


            // wiring up teh login-submit-button
            $("#login-submit-button").click(function (event) {

                event.preventDefault();

                var username = $("#username-input").val();
                var password = $("#password-input").val();

                login(username, password);
            });


            function login(username, password) {


                // doing nothing if username or password is empty
                if (!username || !password) {
                    return false;
                }


                // passing along a 1 or 0, rather than True or False, so it's easier for PHP to digest
                var autoLogin = $("#auto-login-checkbox").is(":checked") ? 1 : 0;


                // momentarily showing the login-spinny thing - purely for decoration, it's functionally meaningless
                $("#login-loading-gif").show();
                $("#password-input").attr({disabled: true});


                $.post("/check_login_password", {
                    username: username,
                    password: password,
                    autoLogin: autoLogin
                }, function (data) {


                    // hiding the spinning gif, regardless of whether login has failed or not
                    $("#login-loading-gif").hide();


                    // if nothing was returned via JSON, meaning login failed...
                    if (!data) {
                        login_failed();
                    } else {
                        login_success(data);
                    }
                }, "json").fail(function (d) {
                    console.log("Login failed!");
                    console.log(d);
                });



                function login_failed() {


                    // clearing the password box
                    $("#password-input").val("");


                    // telling the user that he fucked up
                    $("#password-input").addClass("password-wrong");


                    // shaking the element on DESKTOP, because this doesn't work on mobile
                    if (!tools.isMobile()) {
                        shakeElement($("#login-stuff-holder"), {
                            amplitude: 4
                        });
                    }


                    // calling the callback, if specified
                    $("#password-input").attr({disabled: false}).focus();
                }


                function login_success(data) {


                    // if we've got this far, then we're logged in
                    localStorage.username = data.username;


                    // disabling the login-submit-button, so user isn't tempted to click it twice
                    $("#login-submit-button").attr({disabled: true}).removeClass("btn-warning").addClass("btn-success");


                    // deactivating the login button
                    $("#login-buton").off("click");


                    // deactivating the password box, and coloring it green
                    $("#password-input").attr({disabled: true}).addClass("password-correct").val("● ● ● ● ● ● ● ● ● ● ● ● ● ●");


                    // finally, moving to the user_page
                    window.location = "/user_page";
                }
            }
        }
);
