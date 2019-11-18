// ==UserScript==
// @name     No looping videos
// @version  0.0.1
// @namespace https://github.com/afontenot/userjs/twitter-3
// @description Prevent Twitter from xxxxing looping videos
// @author       Adam Fontenot (https://github.com/afontenot)
// @license      GPL-3.0-or-later
// @match        https://twitter.com/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function() {
    'use strict';
  
    console.log("No looping videos is running...");
  
    var interval = setInterval(function() {
        for (var el of document.getElementsByTagName("video")) {
            if (!el["fixed"]) {
                console.log("Fixing a video...");
                el.addEventListener("ended", function(){
                        this.pause();
                        this.currentTime = 0;
                    });
            }
            el["fixed"] = true;
        }
    }, 500);
})();

