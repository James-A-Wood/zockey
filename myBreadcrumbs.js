ˆ/* * * * * * * * * * * * * * * * * * * * * * * * * * *
 *
 *
 *      JavaScript for the MyBreadcrumbs!
 *
 *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * */
define(
    ['jquery'],
    function ($) {

        // Clearing 'sessionStorage.group' when the Top breadcrumb is clicked!
        $(function () {
            $("#top-breadcrumb").click(function () {
                sessionStorage.group = "";
            });
        });
    }
);
