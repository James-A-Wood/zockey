define(
        [
            "jquery",
            "Konva"
        ],
        function ($, Konva) {


            // Returns a function that creates individual wordBlocks
            return function (inputs) {


                // defaults for all words
                var defaults = {
                    x: 0,
                    y: 0,
                    active: true, // means wordBlocks are clickable/eatable
                    parentLayer: null, // NECESSARY only when layer.draw is required, as when deleting the word (when eaten words are not tweened away...)
                    paddingX: 10,
                    paddingY: 15,
                    textSize: 18,
                    opacity: 1,
                    width: null,
                    height: null,
                    rotate: null,
                    align: "center",
                    fill: "lightblue",
                    stroke: "navy",
                    textFill: "navy",
                    strokeWidth: 1,
                    cornerRadius: 2,
                    draggable: false,
                    text: "",
                    removeMethod: "shrink",
                    name: "wordBlock",
                    id: ""
                };
                $.extend(defaults, inputs || {});



                // returning a wordblock factory...
                return function (inputs) {


                    // optional inputs for each wordBlock instance
                    $.extend(defaults, inputs || {});


                    // building the pieces - first, the text itself
                    var text = new Konva.Text({
                        text: defaults.text,
                        fontSize: defaults.textSize,
                        fill: defaults.textFill,
                        x: defaults.paddingX,
                        y: defaults.paddingY,
                        opacity: defaults.opacity,
                        align: defaults.align || "center"
                    });


                    // keeping the text no taller than the card height minus paddingY
                    if (defaults.height) {
                        var isTooTall = text.height() > defaults.height - (defaults.paddingY * 2 || 0);
                        while (isTooTall) {
                            text.fontSize(text.fontSize() - 1);
                            isTooTall = text.height() > defaults.height - (defaults.paddingY * 2 || 0);
                        }
                    }


                    // keeping the text no wider than the card width minus paddingX
                    if (defaults.width) {
                        text.width(defaults.width - defaults.paddingX * 2);
                        var isTooWide = text.width() > defaults.width - defaults.paddingX * 2;
                        while (isTooWide) {
                            text.fontSize(Math.floor(text.fontSize()) - 3);
                            isTooWide = text.width() > defaults.width - defaults.paddingX * 2;
                        }
                    }


                    // keeping the text no taller than the card height minus paddingY
                    if (defaults.height) {
                        var isTooTall = text.height() > defaults.height - (defaults.paddingY * 2 || 0);
                        while (isTooTall) {
                            text.fontSize(Math.floor(text.fontSize()) - 3);
                            isTooTall = text.height() > defaults.height - (defaults.paddingY * 2 || 0);
                        }
                    }


                    // building the background
                    var background = new Konva.Rect({
                        fill: defaults.fill,
                        stroke: defaults.stroke,
                        strokeWidth: defaults.strokeWidth,
                        cornerRadius: defaults.cornerRadius,
                        width: defaults.width || text.width() + defaults.paddingX * 2,
                        height: defaults.height || text.height() + defaults.paddingY * 2,
                        opacity: defaults.opacity,
                        shadowBlur: defaults.shadowBlur,
                        shadowOffset: defaults.shadowOffset,
                        shadowColor: defaults.shadowColor,
                        shadowOpacity: defaults.shadowOpacity
                    });


                    // making sure the corner radius is no larger than half the background height
                    background.cornerRadius(Math.min(background.height() / 2, defaults.cornerRadius));


                    // making box bigger to accomodate tall text
                    if (text.height() > background.height() + defaults.paddingY) {
                        background.height(text.height() + defaults.paddingY);
                    }


                    // centering text vertically in the background
                    text.y(background.height() / 2 - text.height() / 2);


                    // grouping background & text together...
                    var group = new Konva.Group({
                        draggable: defaults.draggable,
                        name: defaults.name || "wordBlock",
                        x: defaults.x,
                        y: defaults.y,
                        id: defaults.id
                    });
                    group.add(background, text);


                    // adding some properties to the group 
                    group.active = true; // whether the wordBlock is 'hittable' or not
                    group.width = background.width(); // hardcoding the width
                    group.height = background.height(); // hardcoding the height


                    // adding rotation, if there's a "rotate" property and it's a number
                    if (defaults.rotate && !isNaN(defaults.rotate)) {
                        var number = defaults.rotate / 2;
                        var random = Math.random() * defaults.rotate;
                        group.rotate(number - random);
                    }


                    // flashing some element of the background (e.g. background-fill or stroke)
                    group.flash = function (inputs) {


                        var defaults = {
                            color: "pink",
                            interval: 500,
                            element: "fill"
                        };
                        $.extend(defaults, inputs || {});


                        // saving the original color of the element to be flashed
                        var originalColor = background[defaults.element]();


                        // climbing the tree to find the layer that the background belongs to
                        var parentLayer = (function () {
                            var parent = background.getParent();
                            var counter = 0;
                            while (parent.nodeType !== "Layer" && counter < 20) { // adding a counter to avoid infinite loops
                                counter += 1;
                                parent = parent.getParent(); // getting the parent of the parent, i.e, climbing up the tree
                            }
                            return parent;
                        }());


                        group.flashInterval = setInterval(function () {


                            // setting the new color
                            var newColor = (function () {
                                if (background[defaults.element]() === originalColor) {
                                    return defaults.color;
                                } else {
                                    return originalColor;
                                }
                            }());


                            // var newColor = background[defaults.element]() === originalColor ? defaults.color : originalColor;
                            background[defaults.element](newColor);


                            // finally, drawing the layer that was teased out above
                            parentLayer.draw();

                        }, defaults.interval);
                    };


                    // deleting the word when it is eaten
                    group.removeMe = function () {


                        // returning if defaults.active is FALSE
                        if (!defaults.active) {
                            return;
                        }


                        if (group.active) {


                            group.active = false;


                            // different ways of disappearing!
                            switch (defaults.removeMethod) {
                                case "shrink":
                                    var centerX = group.x() + group.width / 2;
                                    var centerY = group.y() + group.height / 2;
                                    var shrink = new Konva.Tween({
                                        node: group,
                                        scaleX: 0,
                                        scaleY: 0,
                                        x: centerX,
                                        y: centerY,
                                        duration: 0.1
                                    }).play();
                                    break;

                                default:
                                    group.remove();
                                    defaults.parentLayer.batchDraw();
                            }
                        }
                    };


                    group.shrinkAway = function () {
                        var tween = new Konva.Tween({
                            node: group,
                            duration: 1,
                            scaleX: 0.01,
                            scaleY: 0.01,
                            x: group.x() + group.width / 2,
                            y: group.y() + group.height / 2,
                            onFinish: function () {
                                group.remove();
                            }
                        }).play();
                    };


                    group.popUp = function () {
                        var originalX = group.x();
                        var originalY = group.y();
                        group.scaleX(0.01);
                        group.scaleY(0.01);
                        group.x(originalX + group.width / 2);
                        group.y(originalY + group.height / 2);
                        var tween = new Konva.Tween({
                            node: group,
                            x: originalX,
                            y: originalY,
                            scaleX: 1,
                            scaleY: 1,
                            duration: 0.5,
                            easing: Konva.Easings.EaseInOut
                        }).play();
                    };


                    group.opacity = function (value) {
                        text.opacity(value);
                        background.opacity(value);
                        defaults.parentLayer.draw();
                    };


                    // scales the whole group (text & background) to whatever number you give it
                    group.scaleTo = function (number) {

                        if (!number || isNaN(number)) {
                            console.log("group.scaleTo takes a single number, the percent to scale to!");
                            return false;
                        }


                        // scaling the text and the background
                        text.scaleX(number).scaleY(number);
                        background.scaleX(number).scaleY(number);


                        // setting the newly adjusted group width and height
                        group.width = group.width * number;
                        group.height = group.height * number;


                        // adjusting the text position, which would be off otherwise
                        var newTextX = text.x() - (background.width() - text.width()) / 4;
                        var newTextY = text.y() - (background.height() - text.height()) / 4;
                        text.x(newTextX).y(newTextY);


                        // don't forget this!
                        defaults.parentLayer.draw();
                    };


                    // caching, if not told not to
                    if (defaults.cache !== false) {
                        group.cache();
                    }

                    return group;
                };
            };
        });