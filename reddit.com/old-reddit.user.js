// ==UserScript==
// @name         Old Reddit
// @description  Force old.reddit.com when signed out
// @author       Adam Fontenot (https://github.com/afontenot)
// @version      1.0.1
// @match        http://*.reddit.com/*
// @match        https://*.reddit.com/*
// @license      GPL-3.0-or-later
// @run-at       document-start
// ==/UserScript==

// forked from: https://openuserjs.org/meta/101743/Old_Reddit.meta.js

var url = window.location.host;

if (document.cookie.split(';').filter((item) => item.includes('redesign_optout=true')).length == 0) {
  if (url.match("old.reddit.com") === null) {
    url = window.location.href;
    if  (url.match("//www.reddit") !== null){
        url = url.replace("//www.reddit", "//old.reddit");
    } else {
    	return;
    }
    //console.log(url);
    window.location.replace(url);
  }
}
