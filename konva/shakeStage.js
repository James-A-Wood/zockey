



define(['jquery'], function ($) {


    return function (inputs) {

        var defaults = {
            stage: "", // MUST INCLUDE this!
            shakeAmplitude: 2,
            shakeRate: 30,
            shakeLength: 400,
            shakeDirection: "x",
            callback: null
        };
        $.extend(defaults, inputs || {});

        // exiting if no reference to the stage was passed in
        if (!defaults.stage) {
            return;
        }

        var startTime = new Date().getTime();
        var toggle = false;

        var shakeInterval = setInterval(function () {

            // gradually reducing the shakeAmplitude, ending at 0
            var currentTime = new Date().getTime();
            var timeElapsed = currentTime - startTime;
            var shakeAmount = defaults.shakeAmplitude * (defaults.shakeLength - timeElapsed) / defaults.shakeLength;

            if (toggle) {
                var shakeAmount = shakeAmount * -1;
            }
            setScreenPosition(shakeAmount);
            toggle = !toggle;

            if (timeElapsed > defaults.shakeLength) {
                clearInterval(shakeInterval);
                setScreenPosition(0);
                if (defaults.callback) {
                    defaults.callback();
                }
            }
        }, defaults.shakeRate);


        function setScreenPosition(position) {
            defaults.stage[defaults.shakeDirection](position);
            defaults.stage.batchDraw();
        }
    };


});