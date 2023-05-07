// ==UserScript==
// @name Mastodon - threaded replies
// @match https://mastodon.social/*
// @version 2.1
// ==/UserScript==

// NOTE: change the match above to your own instance.

/* jshint -W097 */
'use strict';


const instanceURL = (new URL(window.location)).origin;
const maxIndent = 15;

let loc = window.location.toString();

let replyMap = {};

const clonableButton = document.createElement("div");
clonableButton.style.position = "absolute";
clonableButton.style.cursor = "pointer";
clonableButton.style.fontSize = "12px";
clonableButton.style.right = 0;
clonableButton.style.bottom = 0;
clonableButton.style.width = "100%";
clonableButton.style.textAlign = "center";
clonableButton.style.padding = "6px 0";
clonableButton.style.lineHeight = "0px";
clonableButton.style.fontSize = "0px";

const colorConvert = function(lab) {
  const L = Math.pow(lab[0] + 0.3963377774 * lab[1] + 0.2158037573 * lab[2], 3);
  const M = Math.pow(lab[0] - 0.1055613458 * lab[1] - 0.0638541728 * lab[2], 3);
  const S = Math.pow(lab[0] - 0.0894841775 * lab[1] - 1.2914855480 * lab[2], 3);
  const rgb = [+4.0767416621 * L - 3.3077115913 * M + 0.2309699292 * S,
               -1.2684380046 * L + 2.6097574011 * M - 0.3413193965 * S,
               -0.0041960863 * L - 0.7034186147 * M + 1.7076147010 * S];
  const linearRgbToSrgb = c => c > 0.0031308 ? 1.055 * Math.pow(c, 1 / 2.4) - 0.055 : 12.92 * c;
  return rgb.map(linearRgbToSrgb);
};

// generates a "nice" color wheel, with constant lightness / chroma
const getRotatedColor = function(index, maxIndex) {
  const L = 60; // 75;
  const C = 10; // 12.1;
  const hueRadians = (2 * Math.PI) * (index / (maxIndex + 1));
  const a = C * Math.cos(hueRadians);
  const b = C * Math.sin(hueRadians);
  const rgb = colorConvert([L, a, b]);
  return `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
};

const recursiveSetVisibility = function(id, displayProp) {
  if (!replyMap.hasOwnProperty(id)) {
    return;
  }
  for (const replyId of replyMap[id]) {
    const replyElement = document.querySelector(`div[data-id="${replyId}"]`);
    replyElement.parentElement.style.display = displayProp;
    if (!replyElement.classList.contains("tree-hidden")) {
      recursiveSetVisibility(replyId, displayProp);
    }
  }
};

const buttonHover = function(ev) {
  ev.target.style.backgroundColor = "rgb(128,128,128,0.15)";
  ev.target.style.fontSize = "12px";
};

const buttonExit = function(ev) {
  if (!ev.target.classList.contains("tree-hidden")) {
    ev.target.style.backgroundColor = "";
    ev.target.style.fontSize = "0px";
  }
};

const buttonClick = function(ev) {
  ev.stopPropagation();
  ev.target.classList.toggle("tree-hidden");
  const status = ev.target.previousElementSibling;
  status.classList.toggle("tree-hidden");
  const hide = status.classList.contains("tree-hidden");
  const id = status.getAttribute("data-id");
  const displayProp = hide ? "none" : "";
  ev.target.textContent = hide ? "▼" : "▲";
  recursiveSetVisibility(id, displayProp);
  for (const statusElement of Array.from(status.children)) {
    if (!statusElement.classList.contains("status__info")) {
      statusElement.style.display = displayProp;
    }
  }
};

const addToggleButton = function(reply) {
  // FIXME: is there a better way to check if button has already been added?
  if (reply.nextElementSibling) {
    return;
  }
  const button = clonableButton.cloneNode();
  button.addEventListener("pointerenter", buttonHover);
  button.addEventListener("pointerout", buttonExit);
  button.addEventListener("click", buttonClick);
  button.textContent = "▲";
  reply.parentElement.appendChild(button);
};

const indentReplies = function(json) {
  const replyElements = document.getElementsByClassName("status-reply");
  // race condition avoidance: try again if not all posts are loaded yet
  // FIXME: could this be flaky if we run while replies are still being added?
  if (!replyElements.length) {
    setTimeout(indentReplies, 100, json);
    return;
  }

  // calculate reply depth
  replyMap = {};
  const replyDepth = {};
  let maxDepth = 0;

  // iterate through replies and build reply map and un-hoist self-replies
  const topLevelPostId = json.descendants[0].in_reply_to_id;
  const topLevelAccountId = json.descendants[0].in_reply_to_account_id;
  for (const reply of json.descendants) {
    // build map of replies to their depth
    const myParentId = reply.in_reply_to_id;
    if (!replyMap.hasOwnProperty(myParentId)) {
      replyMap[myParentId] = [reply.id];
    } else {
      replyMap[myParentId].push(reply.id);
    }
    let depth = 0;
    if (replyDepth.hasOwnProperty(myParentId)) {
      depth += replyDepth[myParentId] + 1;
    }
    replyDepth[reply.id] = depth;
    if (depth > maxDepth) {
      maxDepth = depth;
    }

    // un-hoist self-replies from top of parent to true thread location
    // test for whether reply is a self reply
    const myParentAccountId = reply.in_reply_to_account_id;
    if (myParentAccountId === topLevelAccountId && reply.account.id === topLevelAccountId) {
      const myParentDescendants = new Set([myParentId]);
      const myDescendants = new Set([reply.id]);
      console.log(reply);
      // store the last scanned reply *before* where our reply should go
      let lastReplyId = null;

      // our parent might have moved, default to moving to our parent
      if (myParentId !== topLevelPostId) {
        lastReplyId = myParentId;
      }

      // iterate through all replies to find places we might want to move our reply
      for (const otherReply of json.descendants) {
        // only consider descendants of our parent
        const otherReplyParentId = otherReply.in_reply_to_id;
        if (myParentDescendants.has(otherReplyParentId)) {
          myParentDescendants.add(otherReply.id);
        } else {
          continue;
        }

        // don't consider ourselves
        if (reply.id === otherReply.id) {
          continue;
        }

        // don't consider our descendants
        if (myDescendants.has(otherReplyParentId)) {
          myDescendants.add(otherReply.id);
          continue;
        }

        // get out if a sibling has a later date than us
        const myPostDate = new Date(reply.created_at);
        const otherPostDate = new Date(otherReply.created_at);
        if (myParentId === otherReplyParentId && myPostDate < otherPostDate) {
          break;
        }

        // set last seen reply to put our reply after
        // this is expected to be the last sibling before our reply or its last descendant
        lastReplyId = otherReply.id;
      }

      // move our reply after lastReplyId
      if (lastReplyId) {
        const myElement = document.querySelector(`div.status-reply[data-id="${reply.id}"]`).parentElement.parentElement;
        const otherElement = document.querySelector(`div.status-reply[data-id="${lastReplyId}"]`).parentElement.parentElement;
        otherElement.insertAdjacentElement("afterend", myElement);
      }
    }
  }

  // build a rainbow map of colors using the post depth as an index
  const colorMap = {};
  for (let i = 0; i <= maxDepth; i++) {
    colorMap[i] = getRotatedColor(i, maxDepth);
  }

  // set color and indentation
  for (const replyElement of replyElements) {
    const replyID = replyElement.getAttribute("data-id");
    const depth = replyDepth[replyID];
    if (depth >= 0) {
      // set a maximum depth so that indentation doesn't squish too much
      replyElement.parentElement.style.marginLeft = `${maxIndent * Math.min(15, depth)}px`;
      replyElement.parentElement.style.borderLeft = `5px solid ${colorMap[depth]}`;
      addToggleButton(replyElement);
    }
  }

  // remove Mastodon's new "status line"
  for (const el of document.getElementsByClassName("status__line")) {
    el.style.display = "none";
  }

  // remove new post content indentation
  for (const el of document.getElementsByClassName("status__content")) {
    el.style.marginInlineStart = 0;
    el.style.width = "auto";
  }
  for (const el of document.getElementsByClassName("status__action-bar")) {
    el.style.marginInlineStart = 0;
    el.style.width = "auto";
  }
};

const locationChanged = async function() {
  const pathParts = window.location.pathname.split("/");
  if (pathParts.length < 3) {
    return;
  }
  if (!pathParts[1].startsWith("@")) {
    return;
  }
  // note: matching empty string is deliberate
  if (!Number(pathParts[2])) {
    return;
  }

  // same origin, shouldn't cause CORS issues
  const resp = await fetch(`${instanceURL}/api/v1/statuses/${pathParts[2]}/context`);
  const json = await resp.json();
  indentReplies(json);
};

const checkLocation = function() {
  if (window.location.toString() !== loc) {
    loc = window.location.toString();
    locationChanged();
  }
};

const mutConfig = {attributes: false, childList: true, subtree: false};
const title = document.head.getElementsByTagName("title")[0];
const mutObs = new MutationObserver(checkLocation);
mutObs.observe(title, mutConfig);
locationChanged();
