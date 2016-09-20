

define(
        [
            "jquery",
            "tools"
        ],
        function ($, tools) {


            return function (options) {


                // making sure the options parameter is at least an empty object
                options = options || {};


                // anal
                var $detachable = $("#detachable");
                var $detachableHolderStandard = $("#detachable-holder-standard");
                var $detachableHolderMobile = $("#detachable-holder-mobile");
                var $detachableButton = $(".detachable-button");


                if (!$detachable || !$detachableHolderMobile || !$detachableHolderStandard || !$detachableButton) {
                    console.log("Some necessary DOM element seems to be missing!");
                }


                // if we're not on mobile, then removing unnecessary elements and returning
                if (!tools.isMobile()) {
                    $detachableHolderMobile.remove();
                    $detachableButton.remove();
                    return false;
                }


                // wiring up the #detachable-button
                $detachableButton.click(function () {


                    // doing something every time the button is clicked, if passed in
                    if (options.onClick) {
                        options.onClick();
                    }


                    // if the #detachable div is higher than the window itself, then removing the button and exiting
                    if ($detachable.height() > (window.innerHeight * 1.2)) {
                        $(this).remove();
                        return;
                    }


                    // if the #detachable thing DOES fit on one screen, then doing it!
                    if ($detachable.parent().is($detachableHolderStandard)) {


                        $detachable.appendTo("#detachable-holder-mobile").addClass("mobile-centered");
                        $detachableHolderMobile.addClass("visible");


                        // calling any optional functions when the thing slides up
                        if (options.onSlideUp) {
                            options.onSlideUp();
                        }
                    } else {
                        $detachable.appendTo("#detachable-holder-standard").fadeTo("fast", 1).removeClass("mobile-centered");
                        $detachableHolderMobile.removeClass("visible");


                        // calling any optional functions when the thing slides down
                        if (options.onSlideDown) {
                            options.onSlideDown();
                        }
                    }
                });
            };
        }
);