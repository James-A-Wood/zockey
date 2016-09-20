/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */


define(['jquery', 'Konva'], function ($, Konva) {


    return function (inputs) {


        // defaults
        var defaults = {
            stage: "", // MUST INCLUDE THIS
            fill: "rgba(200, 200, 200, 0.5)",
            flashInterval: 35,
            flashLength: 1000
        };
        $.extend(defaults, inputs || {});


        // creating the layer & rectangle, setting to transparent by default
        var flashLayer = new Konva.Layer();
        defaults.stage.add(flashLayer);
        var flashRect = new Konva.Rect({
            width: defaults.stage.width(),
            height: defaults.stage.height(),
            fill: defaults.fill,
            opacity: 0
        });
        flashLayer.add(flashRect).draw();


        // returning function that
        return {
            flash: function () {

                // flashing the stage for the prescribed interval
                var flashOn = false;
                var flashInterval = setInterval(function () {
                    flashRect.opacity(flashOn ? 1 : 0);
                    flashLayer.draw();
                    flashOn = !flashOn;
                }, defaults.flashInterval);

                // stopping the flash and setting the rect opacity to 0 after the prescribed interval
                setTimeout(function () {
                    clearInterval(flashInterval);
                    flashRect.opacity(0);
                    flashLayer.draw();
                }, defaults.flashLength);
            }
        };
    };


});