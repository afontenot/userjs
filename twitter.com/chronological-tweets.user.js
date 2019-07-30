// ==UserScript==
// @name     Chronological Tweets
// @version  0.0.1
// @namespace https://github.com/afontenot/userjs/twitter-1
// @description Automatically clicks the latest tweets mode switch button for you
// @author       Adam Fontenot (https://github.com/afontenot)
// @license      GPL-3.0-or-later
// @match        https://twitter.com/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function() {
    'use strict';
  
    console.log("Latest Tweets Mode enforcer is running...");
  
  
    var interval = setInterval(function() {
        var x = document.querySelectorAll('div[aria-label="Top Tweets on"]')
        if (x.length == 1) {
            x[0].click();
            var y = document.querySelectorAll("div.r-1loqt21.r-18u37iz.r-779j7e.r-23eiwj.r-o7ynqc.r-1j63xyz.r-13qz1uu")[0]
            y.click();
        }
    }, 1000);
})();
