

var requirejs = {
    baseUrl: "/js",
    // manually specifying dependencies, or the variable the library exports
    shim: {
        bootstrap: {deps: ["jquery"]}, // telling it that boostrap requires jquery
        jqueryui: {deps: ["jquery"]}
    },
    // defining paths - CDN where possible, with local fallbacks
    paths: {
        TweenLite: [
            "libraries/gsap/TweenLite.min"
        ],
        TweenMax: [
            "libraries/gsap/TweenMax.min"
        ],
        TweenMax_CSSPlugin: [
            "libraries/gsap/plugins/CSSPlugin.min"
        ],
        TweenMax_EasePack: [
            "libraries/gsap/easing/EasePack.min"
        ],
        jquery: [
            "http://ajax.aspnetcdn.com/ajax/jQuery/jquery-2.2.3.min",
            "libraries/jquery"
        ],
        
        jqueryui: [
            "http://ajax.aspnetcdn.com/ajax/jquery.ui/1.11.4/jquery-ui.min",
            "libraries/jqueryui-1.11.4.min"
        ],
        bootstrap: [
            "http://ajax.aspnetcdn.com/ajax/bootstrap/3.3.6/bootstrap.min",
            "libraries/bootstrap.min"
        ],
        Konva: [
//            "https://cdn.rawgit.com/konvajs/konva/1.0.2/konva.min",
            "libraries/Konva"
        ],
        tools: "helpers/tools",
        howler: [
            "https://cdnjs.cloudflare.com/ajax/libs/howler/1.1.29/howler.min", // was 1.1.29
            "libraries/howler"
        ]
    }
};



