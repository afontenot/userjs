// ==UserScript==
// @name         Filter Twitch chat
// @namespace    https://github.com/afontenot/userjs/twitch-1
// @version      0.1.0
// @description  Removes most annoying messages on Twitch
// @author       Adam Fontenot (https://github.com/afontenot)
// @license      GPL-3.0-or-later
// @match        https://www.twitch.tv/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    var banned_words = ["monkas", "pepes", "pepehands", "omegalul", "monkagiga",
        "peepos", "pogu", "lsrs", "feelsbadman", "poggers", "pogchamp",
        "sourpls", "feelsgoodman", "pepega"
    ];

    setInterval(function() {
        var messages = document.querySelectorAll('.chat-line__message');
        for (const message of messages) {
            var node = message.querySelector('span[data-a-target="chat-message-text"]');
            if (message.style.display == "none") {
                continue
            }
            var msg = node ? node.innerText : null;

            if (!node ||
                (msg.toUpperCase() == msg && msg.length > 6) ||
                msg.match(/[A-Z0-9a-z]/) == null) {
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
    }, 100);
})();
