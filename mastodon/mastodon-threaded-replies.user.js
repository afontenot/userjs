// ==UserScript==
// @name Mastodon - threaded replies
// @match https://mastodon.social/*
// @match https://fosstodon.org/*
// @version 2.2.1
// ==/UserScript==

// NOTE: change the match above to your own instance.

/* jshint -W097 */
'use strict';

const instanceURL = (new URL(window.location)).origin;
const accessToken = JSON.parse(document.getElementById("initial-state").textContent).meta.access_token;
const maxIndent = 15;
let fails = 0;

let loc = window.location.toString();

let replyMap = new Map();

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
  if (!replyMap.has(id)) {
    return;
  }
  for (const replyId of replyMap.get(id)) {
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
    if (!statusElement.classList.contains("status__info") && !statusElement.classList.contains("status__line")) {
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
  if (replyElements.length < json.ancestors.length + json.descendants.length - 1) {
    fails++;
    if (fails < 100) {
      // limit to one more attempt if there's at least one descendant loaded
      if (replyElements.length > json.ancestors.length) {
        fails = 100;
      }
      setTimeout(indentReplies, 100, json);
      return;
    }
    console.log("retried too many times, giving up...");
  }

  // calculate reply depth
  replyMap.clear();
  const replyDepth = new Map();
  const replyDate = new Map();
  let maxDepth = 0;

  // iterate through replies and build reply map and un-hoist self-replies
  const topLevelPostId = json.descendants[0].in_reply_to_id;
  for (const reply of json.descendants) {
    replyDate.set(reply.id, new Date(reply.created_at));
    // build map of replies to their depth
    const myParentId = reply.in_reply_to_id;
    if (!replyMap.has(myParentId)) {
      replyMap.set(myParentId, [reply.id]);
    } else {
      replyMap.get(myParentId).push(reply.id);
    }
    let depth = 0;
    if (replyDepth.has(myParentId)) {
      depth += replyDepth.get(myParentId) + 1;
    }
    replyDepth.set(reply.id, depth);
    if (depth > maxDepth) {
      maxDepth = depth;
    }
  }

  // re-arrange all posts recursively

  // FIXME: is this a 100% reliable way to get the activated post?
  let lastPostElement = document.querySelector("div.detailed-status__wrapper").parentElement;

  const rearrangeReplies = function (postIds) {
    // sort all sibling posts by date
    postIds.sort((a, b) => { return replyDate.get(a) - replyDate.get(b); });
    for (const postId of postIds) {
      // Move the post, sorted by (tree, date) to current position
      const myElement = document.querySelector(`div.status-reply[data-id="${postId}"]`).parentElement.parentElement;
      if (lastPostElement.nextElementSibling !== myElement) {
        lastPostElement.insertAdjacentElement("afterend", myElement);
      }
      lastPostElement = myElement;

      // handle children of current post next
      if (replyMap.has(postId)) {
        rearrangeReplies(replyMap.get(postId));
      }
    }
  };

  rearrangeReplies(replyMap.get(topLevelPostId));

  // build a rainbow map of colors using the post depth as an index
  const colorMap = new Map();
  for (let i = 0; i <= maxDepth; i++) {
    colorMap.set(i, getRotatedColor(i, maxDepth));
  }

  // set color and indentation
  for (const replyElement of replyElements) {
    const replyID = replyElement.getAttribute("data-id");
    const depth = replyDepth.get(replyID);
    if (depth >= 0) {
      // set a maximum depth so that indentation doesn't squish too much
      replyElement.parentElement.style.marginLeft = `${maxIndent * Math.min(15, depth)}px`;
      replyElement.parentElement.style.borderLeft = `5px solid ${colorMap.get(depth)}`;
      addToggleButton(replyElement);
    }
  }

  // remove Mastodon's new "status line"
  for (const el of document.getElementsByClassName("status__line")) {
    el.style.display = "none";
  }

  // remove new post content indentation
  for (const status of document.getElementsByClassName("status")) {
    for (const child of status.children) {
      child.style.marginInlineStart = 0;
      child.style.width = "auto";
    }
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

  // use authorization, if logged in, to get posts only visible to logged in user
  const headers = {};
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  // same origin, shouldn't cause CORS issues
  const resp = await fetch(`${instanceURL}/api/v1/statuses/${pathParts[2]}/context`, {headers: headers});
  const json = await resp.json();

  if (json.descendants.length > 0) {
    indentReplies(json);
  } else {
    console.log("Empty JSON descendants array in response for", pathParts[2]);
  }
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
