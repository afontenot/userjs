// ==UserScript==
// @name         IMDB - hide producer credits
// @namespace    http://github.com/afontenot/userjs/IMDB-1
// @version      0.1.0
// @description  Hide all producer credits by default
// @author       Adam Fontenot (https://github.com/afontenot)
// @license      GPL-3.0-or-later
// @include      https://www.imdb.com/name/*
// @grant        none
// ==/UserScript==

location.assign("javascript:showOrHideAll()");
function exec(fn) {
    var script = document.createElement('script');
    script.setAttribute("type", "application/javascript");
    script.textContent = '(' + fn + ')();';
    document.body.appendChild(script); // run the script
    document.body.removeChild(script); // clean up
}

window.addEventListener("load", function() {
    // script injection
    producer_el = document.getElementById("filmo-head-producer");
    if (producer_el.nextElementSibling.style["display"] != "none") {
      exec(function() { 
        producer_el = document.getElementById("filmo-head-producer");
        toggleFilmoCategory(producer_el);
        toggleFilmoCategory(producer_el.nextElementSibling.nextElementSibling);
      });
    }
}, false);
