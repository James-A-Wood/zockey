/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
 * 
 * 
 *      JavaScript for navbar.php!
 * 
 * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

define(
        [
            "jquery"
        ],
        function ($) {


            // wiring up the navbar-logout-button
            $("#navbar-logout-button").off("click").click(function () {


                // erasing localStorage 'isLoggedIn' and sessionStorage 'kyoushitsu'
                localStorage.removeItem("isLoggedIn");


                // logging out, and then redirecting back to the home page
                $.getJSON("/user_logout", function () {
                    window.location = "/user_page";
                }).fail(function (d) {
                    console.log("Error?");
                    console.log(d);
                });
            });
        }
);
