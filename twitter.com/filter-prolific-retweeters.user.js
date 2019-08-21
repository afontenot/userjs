// ==UserScript==
// @name         Filter Prolific Retweeters
// @namespace    https://github.com/afontenot/userjs/twitter-2
// @version      0.0.1
// @description  Block retweets from accounts who retweet too much
// @author       Adam Fontenot (https://github.com/afontenot)
// @license      GPL-3.0-or-later
// @match        https://twitter.com/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function() {
    'use strict';
  
    console.log("Filter Prolific Retweeters is running ...");
  
    var banned_retweeters = ["Black Socialists of America"]

    var filterTweets = function(mutationsList, observer) {
        for (const mutation of mutationsList) {
            if (mutation.type !== 'childList' || !mutation.addedNodes.length) {
                //console.log("unexpected mutation: " + mutation)
                continue;
            }
            for (const node of mutation.addedNodes) {
                var retweeter_info = node.getElementsByClassName("css-1dbjc4n r-1habvwh r-1iusvr4 r-46vdb2 r-5f2r5o r-bcqeeo")
                if (retweeter_info.length) {
                    for (const banned_rter of banned_retweeters) {
                        if (retweeter_info[0].textContent.includes(banned_rter)) {
                            node.style.display = "none";
                            //console.log("blocked " + retweeter_info[0].textContent);
                        }
                    }
                }
            }
        }
    };
  
    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    var observer = null;
    var createObserver = async function() {
        if (observer != null) {
            observer.disconnect();
        }
        var timelineContainer = document.querySelector('div[aria-label="Timeline: Your Home Timeline"]');
        while (timelineContainer == null) {
            console.log("Filter Prolific Retweeters: no timeline container found, sleeping...");
            await sleep(50);
            timelineContainer = document.querySelector('div[aria-label="Timeline: Your Home Timeline"]');
        }
        var tweetContainer = timelineContainer.firstChild.firstChild;
        var moConfig = { attributes: false, childList: true, subtree: false };
        observer = new MutationObserver(filterTweets);
        observer.observe(tweetContainer, moConfig);
        console.log("Filter Prolific Retweeters: created mutation observer")
    };

    createObserver();
    
    // recreate the observer if Twitter AJAX loads another page - kind of a hack
    var titleObserver = null;
    var createTitleObserver = async function() {
        console.log("stage 1");
        var titleElement = document.getElementsByTagName("title")[0];
        while (titleElement == null) {
            console.log("Filter Prolific Retweeters: no title element found, sleeping...");
            await sleep(50);
            titleElement = document.getElementsByTagName("title")[0];
        }
        var moTitleConfig = { attributes: true, childList: true, subtree: true };
        var titleObserver = new MutationObserver(createObserver);
        titleObserver.observe(titleElement, moTitleConfig);
        console.log("Filter Prolific Retweeters setup completed.");
    }
    
    createTitleObserver();
  
})();

