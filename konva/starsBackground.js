

define(
        [
            "Konva"
        ],
        function (Konva) {


            // holds all the tweens for each star so they can be accessed later
            var tweens = [];


            return function (defaults) {


                // checking the parameters
                if (!defaults || typeof defaults !== "object" || !defaults.stage || !defaults.layer || !defaults.numberStars || !defaults.starFlyTime) {
                    console.log("starsBackground didn't receive the correct parameters!");
                    return false;
                }


                // generating the specified number of stars, each at a random angle
                for (var i = 0; i < defaults.numberStars; i++) {
                    var randomStartPosition = Math.random() * defaults.starFlyTime;
                    createNewStar(randomStartPosition);
                }


                // function to create a single new star
                function createNewStar(position) {


                    var star = new Konva.Rect({
                        x: defaults.stage.width() / 2,
                        y: defaults.stage.height() / 2,
                        width: 2,
                        height: 2,
                        fill: "white",
                        opacity: 0,
                        listening: false
                    });


                    // adding a star to the starsLayer
                    (defaults.layer).add(star);


                    // caching the star
                    star.cache();


                    // choosing a random direction
                    var starDirectionRadians = Math.random() * 360;
                    var endX = Math.floor(defaults.stage.width() / 2 + (defaults.stage.width() / 2 + 100) * Math.sin(starDirectionRadians));
                    var endY = Math.floor(defaults.stage.height() / 2 + (defaults.stage.height() / 2 + 100) * Math.cos(starDirectionRadians));


                    // animating the star and removing it on finish
                    var tween = new Konva.Tween({
                        node: star,
                        x: endX,
                        y: endY,
                        opacity: 1,
                        duration: defaults.starFlyTime,
                        easing: Konva.Easings.StrongEaseIn,
                        onFinish: function () {


                            // replaying the star's movement, over and over again
                            tween.reset().play();
                        }


                        // setting the star to START from its passed-in position
                    }).seek(position).play();


                    // keeping track of the tweens so we can pause them later
                    tweens.push(tween);
                }


                return {
                    allStarMovements: function () {
                        return tweens;
                    }
                };
            };



        }
);