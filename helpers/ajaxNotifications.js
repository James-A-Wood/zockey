



define(
        ["jquery"],
        function ($) {

            return function () {


                // appending the HTML markup
                $("html").append("<div id='ajax-sending-notification'>送信中</div>");
                $("#ajax-sending-notification").css({
                    fontSize: "10px",
                    position: "fixed",
                    top: 0,
                    right: 0,
                    padding: "3px 10px",
                    backgroundColor: "green",
                    color: "white",
                    border: "3px solid white",
                    opacity: 0
                });


                return {
                    showBox: function () {
                        $("#ajax-sending-notification").css({opacity: 1});
                    },
                    hideBox: function () {
                        $("#ajax-sending-notification").css({opacity: 0});
                    }
                };
            };

        }
);