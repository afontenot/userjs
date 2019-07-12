// ==UserScript==
// @name         Filter Twitch chat
// @namespace    https://github.com/afontenot/userjs/twitch-1
// @version      0.2.2
// @description  Removes most annoying messages on Twitch
// @author       Adam Fontenot (https://github.com/afontenot)
// @license      GPL-3.0-or-later
// @match        https://www.twitch.tv/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function() {
    'use strict';

    var banned_words = ["monkas", "pepes", "pepehands", "omegalul", "monkagiga",
        "peepos", "pogu", "lsrs", "feelsbadman", "poggers", "pogchamp",
        "sourpls", "feelsgoodman", "pepega", "hyperclap", "peped", "pepepls",
        "gachibass", "libido", "lulwut", "peepowink", "poggop", "bboomer",
        "peepod", "monkahmm", "pepebass", "monkaw", "omegalaughing", "hyperrob",
        "ayaya"
    ];

    var banned_msg = ["pog", "clap"]

    var filterMessages = function(mutationsList, observer) {
        for (const mutation of mutationsList) {
            if (mutation.type !== 'childList' || !mutation.addedNodes.length) {
                //console.log("unexpected mutation: " + mutation)
                continue;
            }
            for (const message of mutation.addedNodes) {
                var node = message.querySelector('span[data-a-target="chat-message-text"]');
                var msg = node ? node.innerText : null;
                if (!node ||
                    (msg.toUpperCase() == msg && msg.length > 6) ||
                    msg.match(/[A-Z0-9a-z]/) == null ||
                    banned_msg.includes(msg.toLowerCase())) {
                    console.log("filtered " + msg);
                    message.style.display = "none";
                    break;
                }
                for (const banned_word of banned_words) {
                    if (msg.toLowerCase().includes(banned_word)) {
                        console.log("filtered " + msg);
                        message.style.display = "none";
                        break;
                    }
                }
            }
        }
    };

    var observer = null;
    var createObserver = function() {
        if (observer != null) {
            observer.disconnect();
        }
        var chatElement = document.getElementsByClassName("chat-list__lines")[0].querySelector("div[role='log']");
        console.log("twitch filter: creating new mutation observer...")
        var moConfig = { attributes: false, childList: true, subtree: false };
        observer = new MutationObserver(filterMessages);
        observer.observe(chatElement, moConfig);
    };

    createObserver();
    // recreate the observer if Twitch AJAX loads another page - kind of a hack
    var titleElement = document.getElementsByTagName("title")[0];
    var moTitleConfig = { attributes: true, childList: true, subtree: true };
    var titleObserver = new MutationObserver(createObserver);
    titleObserver.observe(titleElement, moTitleConfig);
})();
