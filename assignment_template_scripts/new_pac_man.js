







define(
        [
            'jquery',
            'helpers/tools',
            'helpers/myAudio',
            'helpers/SoundEffect',
            'helpers/tiltSimulatesArrowKeys',
            'Konva',
            'konva/pacManFactory',
            'konva/fireworks',
            'konva/WordBlock',
            'konva/shakeStage'
        ],
        function ($, Tools, Audio, SoundEffect, tiltSimulatesArrowKeys, Konva, pacManFactory, FireworksFactory, WordBlockFactory, shakeStage) {


            // changing the screen resolution so it's at least 320px!
            Tools.setMobileScreenWidth(320);



            var myJSON = {};


            // enabling device tilting to simulate arrow key presses on mobile
            Tools.isMobile() && tiltSimulatesArrowKeys();



            // keeping the pacManHolder to a max width of 400px
            $("#pacManHolder").css({width: Math.min(400, $("#mainProblemsHolder").width())});
            $("#pacManHolder").css({height: $("#pacManHolder").width()});


            if (Tools.isMobile()) {
                $("#pacManHolder").css({margin: "0px auto"});
            }



            // setting up the stage and various layers
            var stage = new Konva.Stage({
                container: "pacManHolder",
                width: $("#pacManHolder").width(),
                height: $("#pacManHolder").height()
            });
            var pacManLayer = new Konva.Layer();
            stage.add(pacManLayer);


            var targetsLayer = new Konva.Layer();
            var rect = new Konva.Rect({
                width: 100,
                height: 50,
                fill: "red"
            });
            targetsLayer.add(rect);
            stage.add(targetsLayer).draw();

            var hittables = [rect];

            var pacMan = pacManFactory({
                parentLayer: pacManLayer,
                useBlastCircleBeforeBirth: true,
                boundaries: stage,
                hittables: [[hittables, checkForHit]]
            });
            pacMan.x(stage.width() / 2).y(stage.height() / 2);

            pacManLayer.add(pacMan).draw();


            function checkForHit() {
                console.log("Hit!");
            }



        }
);
