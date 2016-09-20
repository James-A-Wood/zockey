/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */



define(
        ["jquery"],
        function ($) {

            return function (minimumWidth, endBuffer) {


                if (endBuffer && isNaN(endBuffer)) {
                    console.log("tools.adjustTextInputWidth an INT for the endBuffer!");
                    return false;
                }


                endBuffer = endBuffer || 0;


                minimumWidth = minimumWidth || 150;


                return function ($input) {


                    // failing gracefully
                    if (!$input) {
                        console.log("adjustTextInputWidth requires a jQuery reference to a text input as a parameter!");
                        return false;
                    }


                    // appending the text-input-width-adjuster if it's not there already
                    if ($("#text-input-width-adjuster").length < 1) {

                        var fontSize = $input.css("font-size");
                        var padding = $input.css("padding") || "0px 10px";

                        var $adjuster = $("<div/>").attr({id: "text-input-width-adjuster"}).css({
                            fontSize: fontSize,
                            padding: padding,
                            fontWeight: "font-weight",
                            position: "absolute",
                            display: "inline-block",
                            visibility: "hidden"
                        });
                        
                        $("body").append($adjuster);
                    }


                    // adding the value to the div, and measuring its width
                    $("#text-input-width-adjuster").text($input.val());
                    var width = $("#text-input-width-adjuster").outerWidth(true);


                    // keeping numbers a minimum width
                    if ($input.attr("type") === "number") {
                        width = Math.max(47, width);
                    }


                    // keeping a minimum width to the input
                    if (minimumWidth && width < minimumWidth) {
                        width = minimumWidth;
                    }


                    width += endBuffer * 2;


                    // applying the width to the original text input
                    $input.css({width: width});


                    return true;
                };
            };

        }
);
