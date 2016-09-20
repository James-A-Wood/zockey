/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */



define(
        [
            "jquery"
        ],
        function ($) {


            // takes a STRING reference to a class, e.g. ".line-number" (NOT jQuery!)
            return function (classToNumber) {


                if (!classToNumber) {
                    console.log("lineNumbering requires a class name passed in!");
                    return;
                }


                function renumber(callback) {


                    // removing all line-number things
                    $(classToNumber).empty().each(function () {


                        // getting the index of the current .line-number
                        var index = $(this).index(classToNumber);


                        // incrementing it by 1, so it's not zero-based
                        index += 1;


                        // appending the number, plus 1
                        $(this).append(index);
                    });


                    // calling the callback, if any
                    if (callback && $.isFunction(callback)) {
                        callback();
                    }
                }


                return {
                    renumber: renumber
                };
            };
        }
);