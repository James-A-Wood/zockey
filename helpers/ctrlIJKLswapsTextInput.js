/* 
 * 
 * 
 *      Swaps the values of two adjacent text inputs, assuming they're not hidden,
 *      using Ctrl + I/J/K/L
 *      
 *      Assumes one of the text inputs has focus
 * 
 * 
 */



define(
        ["jquery"],
        function ($) {


            // takes an object with ".className" property
            return function (params) {


                // param checking
                if (!params || !params.className) {
                    console.log("ctrlIJKLswapsInput got incorrect or no parameters!");
                    return false;
                }


                $(document).off("keydown", markForSwap).on("keydown", markForSwap);
                function markForSwap(e) {


                    // exiting if no problem-input is active
                    if (!($(document.activeElement).hasClass(params.className))) {
                        return;
                    }


                    // exiting if Alt isn't pressed
                    if (!e.ctrlKey) {
                        return;
                    }


                    // choosing "prev" or "next", depending on the key pressed
                    if (e.which === 73 || e.which === 74) { // the I or J key
                        e.preventDefault();
                        e.stopPropagation();
                        swapContent("prev");
                    } else if (e.which === 75 || e.which === 76) { // the K or L key
                        e.preventDefault();
                        e.stopPropagation();
                        swapContent("next");
                    }


                    return true; // necessary?
                }

                function swapContent(direction) {


                    var $thisCell = $(document.activeElement);
                    var $otherCell = $thisCell[direction](); // gets either ".prev" or ".next", depending on what 'direction' is set to


                    // if the $otherCell doesn't exist, or is not displayed...
                    if (!($otherCell.hasClass(params.className)) || $otherCell.css("display") === "none") {
                        return;
                    }


                    /*
                     *
                     *    Beyond this point, cells are swappable, so swapping them
                     *    
                     *
                     */


                    // getting the values
                    var val1 = $thisCell.val();
                    var val2 = $otherCell.val();


                    // performing the swap, and calling ".change"
                    $thisCell.val(val2).change();
                    $otherCell.val(val1).change();


                    // moving focus and adding eye candy
                    $otherCell.focus().css({opacity: 0}).fadeTo(400, 1);
                }
            };
        }
);