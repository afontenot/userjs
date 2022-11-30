// ==UserScript==
// @name Mastodon - threaded replies
// @match https://mastodon.social/*
// @version 1.2
// ==/UserScript==

// NOTE: change the URL and the match above to your own instance.
const instanceURL = "https://mastodon.social";

let loc = window.location.toString();
let json = {};

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

const indentReplies = function() {
  const replies = document.getElementsByClassName("status-reply");
  // race condition avoidance: try again if not all posts are loaded yet
  if (json.descendants.length !== replies.length) {
    setTimeout(indentReplies, 100);
    return;
  }
  const replyMap = {};
  const replyDepth = {};
  let maxDepth = 0;
  // FIXME: this assumes children never appear before parents in reply list
  for (const reply of json.descendants) {
    replyMap[reply.id] = reply.in_reply_to_id;
    let depth = 0;
    if (replyDepth.hasOwnProperty(reply.in_reply_to_id)) {
      depth += replyDepth[reply.in_reply_to_id] + 1;
    }
    replyDepth[reply.id] = depth;
    if (depth > maxDepth) {
      maxDepth = depth;
    }
  }
  const colorMap = {};
  for (let i = 0; i <= maxDepth; i++) {
    colorMap[i] = getRotatedColor(i, maxDepth);
  }
  for (const reply of replies) {
    const replyID = reply.getAttribute("data-id");
    const replyToID = replyMap[replyID];
    if (replyToID) {
      const depth = replyDepth[replyID];
      // set a maximum depth so that indentation doesn't squish too much
      reply.parentElement.style.marginLeft = `${15 * Math.min(15, depth)}px`;
      reply.parentElement.style.borderLeft = `5px solid ${colorMap[depth]}`;
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
  // same origin, shouldn't cause CORS issues
  const resp = await fetch(`${instanceURL}/api/v1/statuses/${pathParts[2]}/context`);
  json = await resp.json();
  indentReplies();
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
