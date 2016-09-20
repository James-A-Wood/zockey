/*
 Generic red and green score dots for various exercises
 */


// constructor
tools.scoreDots = function (inputParams) {

    // defaults
    var settings = {
        container: "", // html id of the container element
        radius: 10,
        startNumber: 10, // 10 dots by default
        startColor: "#CCC",
        correctColor: "limegreen",
        wrongColor: "red",
        border: null,
        borderRadius: null,
        spacing: 2
    };
    $.extend(settings, inputParams || {});

    // putting up the blank score dots
    for (var i = 0; i < settings.startNumber; i++) {
        $("#" + settings.container).append("<div class='scoreDot blank'></div>");
    }

    // styling the score dots
    $(".scoreDot").css({
        display: "inline-block",
        width: settings.radius * 2,
        height: settings.radius * 2,
        borderRadius: settings.borderRadius || settings.radius,
        margin: "0px " + settings.spacing + "px"
    });

    // styling the blank score dot color
    $(".blank").css({
        backgroundColor: settings.startColor
    });

    return {
        correct: function () {
            $(".blank").eq(0).removeClass("blank").css({
                backgroundColor: settings.correctColor
            });
        },
        wrong: function () {
            var lastDot = $(".blank").length - 1;
            $(".blank").eq(lastDot).removeClass("blank").css({
                backgroundColor: settings.wrongColor
            });
        }
    };

};