

define(
        [
            "jquery",
            "tools",
            "Konva"
        ],
        function ($, tools, Konva) {


            return function (inputs) {


                // scrubbing inputs
                if (!inputs || typeof inputs !== "object") {
                    console.log("Laser.js requires an [Object] passed in!");
                    return;
                }


                // setting defaults
                var defaults = {
                    parentContainer: "", // NECESSARY
                    stage: "", // requires EITHER a reference to layer, or to the stage so we can create a layer dynamically here
                    layer: "",
                    bulletRadius: 40,
                    fireSound: "",
                    bulletOffset: 10,
                    flyTime: 0.5,
                    bulletInnerColor: "white",
                    bulletOuterColor: "red",
                    bulletSolidColor: null, // or using a solid color, if specified, 
                    onFinish: function () {
                        // maybe, checking for hit
                    },
                    onFire: function () {
                        // stuff to do when fired, e.g., the laser sound
                    }
                };
                $.extend(defaults, inputs || {});


                // creating a bullet PROTOTYPE, to be cloned down below
                var bulletPrototype = new Konva.Circle({
                    listening: false,
                    radius: defaults.bulletRadius,
                    x: (defaults.stage).width() / 2, //($(defaults.parentContainer).width() / 2) - defaults.bulletRadius,
                    y: (defaults.stage).height() + defaults.bulletRadius, //$(defaults.parentContainer).height() + (defaults.bulletRadius),
                    fill: defaults.bulletSolidColor ? defaults.bulletSolidColor : null,
                    fillRadialGradientEndRadius: defaults.bulletSolidColor ? null : defaults.bulletRadius,
                    fillRadialGradientColorStops: defaults.bulletSolidColor ? null : [0, defaults.bulletInnerColor, 1, defaults.bulletOuterColor],
                    opacity: 0
                });


                // adding the prototype to the layer
                defaults.layer.add(bulletPrototype);


                // caching the master, and setting its listening to false for *slightly* better performance
                bulletPrototype.cache().listening(false);


                return {
                    fire: function (event) {


                        // necessary to keep events from firing twice on mobile (touchstart & click events)
                        if (tools.isMobile() && event && event.type === "click") {
                            return;
                        }


                        // getting the coordinates based on whether it's click or touch...
                        var pointerPosition = (function () {

                            // if there is a targetDot (only on mobile), then using it
                            if (inputs.targetDot) {
                                return {
                                    x: inputs.targetDot.x(),
                                    y: inputs.targetDot.y()
                                };
                            } else {


                                // ... or else, using the pointer position
                                return tools.pointerPosition(event, defaults.parentContainer);
                            }
                        }());


                        // creating & adding the bullet circle
                        var bullet = bulletPrototype.clone();


                        if (!isNaN(defaults.bulletOffset)) {
                            defaults.bulletOffset *= -1;
                            bullet.x(bulletPrototype.x() + defaults.bulletOffset);
                        }


                        // adding the bullet to the layer
                        (defaults.layer).add(bullet);


                        // adjusting the bullet properties
                        bullet.opacity(1).listening(false).cache();


                        // calling the on-fire callback, if present
                        defaults.onFire();


                        // tweening the bullet
                        bullet.to({
                            x: pointerPosition.x,
                            y: pointerPosition.y,
                            scaleX: 0,
                            scaleY: 0,
                            duration: defaults.flyTime,
                            easing: Konva.Easings.EaseOut,
                            onFinish: function () {


                                // completely removing the bullet
                                bullet.destroy();


                                // calling the onFinish callback, if present
                                defaults.onFinish(pointerPosition.x, pointerPosition.y);
                            }
                        });
                    }
                };
            };
        });

