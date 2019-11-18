// ==UserScript==
// @name     Natural sort order for Inoreader
// @version  0.0.1
// @namespace https://github.com/afontenot/userjs/inoreader-1
// @description Sorts earliest to latest in "unread" mode, latest to earliest for "view all".
// @author       Adam Fontenot (https://github.com/afontenot)
// @license      GPL-3.0-or-later
// @match        https://www.inoreader.com/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

"use strict";

var checkOnSortOrder = function() {
    var view_status_all = document.getElementById("all_cnt_top");
    var view_options = document.getElementById("sb_rp_view_options_menu");
    var newest_first_checked = false;
    var oldest_first_checked = false;
    for (var element of view_options.children) {
        if (element.textContent == "Newest first") {
            var newest_first = element;
            if (element.getElementsByClassName("icon-checkmark").length == 1) {
                newest_first_checked = true;
            }
        } else if (element.textContent == "Oldest first") {
            var oldest_first = element;
            if (element.getElementsByClassName("icon-checkmark").length == 1) {
                oldest_first_checked = true;
            }
        }
    }

    if (view_status_all != null) {
        if (!newest_first_checked) {
            console.log("changing sort order to newest first...");
            newest_first.click();
        }
    } else {
        if (!oldest_first_checked) {
            console.log("changing sort order to oldest first...");
            oldest_first.click();
        }
    }
}

var callback = function(mutList, observer) {
    console.log("checking sort order...");
    checkOnSortOrder();
}

var observer = new MutationObserver(callback);
var toolbar = document.getElementById("sb_rp_tools");
const config = { attributes: false, childList: true, subtree: false };
observer.observe(toolbar, config);

// don't run initial check until elements are available
// TODO: figure out if this is even necessary, maybe the mutation observer
// can handle everything we need.
var safeSOCheck = function() {
    if (document.getElementById("sb_rp_view_options_menu") != null) {
        console.log("view options menu available, initiating inital check...");
        checkOnSortOrder();
    } else {
        setTimeout(safeSOCheck, 500);
    }
}

safeSOCheck();
