



requirejs(
        ["jquery"],
        function ($) {

            $(function () {


                // pre-loading any previously-entered data - BUT NOT PASSWORDS
                $(".form-control").each(function () {

                    var id = $(this).attr("id");

                    if (id === "password") {
                        return;
                    }

                    if (sessionStorage[id]) {
                        $(this).val(sessionStorage[id]);
                    }
                });


                // disabling the space key
                $("html").keydown(function (e) {
                    if (e.keyCode === 32 && $(":focus").hasClass("form-control")) {
                        e.preventDefault();
                    }
                });


                // saving anything typed into the inputs in sessionStorage, on keyup
                $(".form-control").on("change", function () {
                    var id = $(this).attr("id");
                    if (id === "password" || id === "password_again") {
                        return;
                    }
                    sessionStorage[id] = $(this).val();
                });


                // wiring up the submit button
                $("#login-form").submit(function (event) {


                    event.preventDefault();


                    // clearing out any previous messages
                    $("#report-div").empty();


                    var thereAreErrors = false;


                    var aliases = {
                        last_name: "「名字」",
                        first_name: "「名前」",
                        username: "「ユーザー名」",
                        email: "「eメール」",
                        password: "「パスワード」"
                    };


                    // checking for any spaces in any of the text inputs
                    $.each([$("#username"), $("#password")], function () {

                        // checking for 半角 and 全角 spaces - using regular expression!
                        var text = $(this).val();
                        if (text.search(/\s|　/) !== -1) { // checking for spaces (全角 too!)
                            var id = $(this).attr("id");
                            $("#report-div").append(aliases[id] + " に空白(スペース）が入っていませんか？<br>");
                            thereAreErrors = true;
                        }
                    });


                    // cycling through the array, checking the messages and giving the appropriate message, if required
                    if ($("input[name='honkou-seito']:checked").val() === "1") {


                        // array holding the jQuery elements to check, and the message if their value is null
                        var inputsToCheck = [
                            {input: $("#firstname"), message: "あなたの名前を入力しましょう。"},
                            {input: $("#lastname"), message: "あなたの名字を入力しましょう。"},
                            {input: $("#nen"), message: "あなたの学年を入力しましょう。"},
                            {input: $("#kumi"), message: "あなたの組を入力しましょう。"},
                            {input: $("#ban"), message: "あなたの出席番号を入力しましょう。"}
                        ];


                        inputsToCheck.forEach(function (thisInput) {
                            if (!thisInput.input.val()) {
                                $("#report-div").append(thisInput.message + "<br>");
                                thereAreErrors = true;
                            }
                        });
                    }


                    // warning if the two passwords are not identical
                    var password1 = $("#password").val();
                    var password2 = $("#password_again").val();
                    if (password1 !== password2) {


                        // emptying and returning focus to the SECOND password input
                        $("#password_again").val("").focus();
                        $("#report-div").append("パスワードは同じものを２回入力してください。");
                        thereAreErrors = true;
                    }


                    // checking password for alphanumeric, 5+ letters long, without spaces
                    var regexp = /[a-z0-9_@!\-\$]{5,}/i;
                    if (password1.search(regexp) === -1) {
                        $("#report-div").append("パスワードは５文字以上の半角英数字にしましょう。<br>");
                        thereAreErrors = true;
                    }


                    // stopping here, without making the ajax call, if there are errors
                    if (thereAreErrors) {
                        return;
                    }


                    /*
                     * 
                     * 
                     * 
                     *  Past this point, everything checks out, so we make the ajax call...
                     *  
                     *  
                     *  
                     *  
                     */


                    // saving form data just to be anal
                    var formData = {
                        username: $("#username").val(),
                        password: $("#password").val(),
                        password_again: $("#password_again").val(),
                        lastname: $("#lastname").val() ? $("#lastname").val() : null,
                        firstname: $("#firstname").val() ? $("#firstname").val() : null,
                        nen: $("#nen").val(),
                        kumi: $("#kumi").val(),
                        ban: $("#ban").val(),
                        honkou_seito: $("input[name='honkou-seito']:checked").val(),
                        kyoushitsu_code: $("#kyoushitsu").val()
                    };


                    $.post("/register_new_user", formData, backFromRegistration, "json")
                            .fail(function (data) {
                                console.log("接続できなかったようです！");
                                console.log(data);
                            });


                    function backFromRegistration(data) {


                        // clearing the report-div and error-message-holder
                        $("#report-div").text("");


                        // if the returned data is an object of warning messages about invalid passwords, etc., ...
                        if (typeof data === "object") { // meaning an array of errors was returned


                            // showing all errors in the report-div
                            $.each(data, function (key, value) {
                                $("#report-div").append("<p>" + value + "</p>");
                            });


                            // returning so the rest of the function is not executed
                            return;
                        }


                        // disabling all the text inputs and making them semi-transparent
                        $(".form-control").attr({disabled: "true"}).css({opacity: "0.5"});


                        // otherwise, if the registration went through...
                        $("#report-div").empty();


                        // showing the spinning .gif
                        $("#register-waiting").css({display: "block"});


                        // disabling the button and changing its appearance
                        $("#submit-button").attr({disabled: "true"}).text("登録中...");


                        // slight delay (on purpose) before moving on
                        setTimeout(function () {


                            // saving username so it's there when we return to the home page
                            localStorage.username = formData.username;


                            // adding a confirmation message and a link-button back to the top
                            $("#form-holder").empty()
                                    .append("<div id='registration-confirmation'>登録ができました！<br><br>ユーザー名は　<span>" + localStorage.username + "</span>　です。<br><br>パスワードは　<span>" + formData.password + "</span>　です。<br><br>頑張って下さい！</div>")
                                    .append("<a href='/' class='btn btn-success btn-sm btn-block'>戻る<a>");
                        }, 1000);
                    }
                });


                // toggling inputs for name, grade, etc. if logging in as "general user"
                $("input[name='honkou-seito']").change(function () {
                    if ($(this).val() === "0") {
                        $(".seito-only").prop({disabled: true}).val("").closest("tr").css({display: "none"});
                        $(".hide-for-ippan").css({display: "none"});
                    } else {
                        $(".seito-only").prop({disabled: false}).closest("tr").css({display: "table-row"});
                        $(".hide-for-ippan").css({display: "table-row"});
                    }
                });

            });
        });
