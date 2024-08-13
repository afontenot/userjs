// ==UserScript==
// @name Codeberg - first branch commit graph
// @match            https://codeberg.org/*graph*
// @version          1.0
// ==/UserScript==

// SETTINGS
const keepCircles = true;
// END SETTINGS

let relContainerBackup = null;
let revContainerBackup = null;
let toggleButton = null;

const removeOtherBranches = function () {
  relContainerBackup = document.getElementById("rel-container").cloneNode(true);
  revContainerBackup = document.getElementById("rev-container").cloneNode(true);
  const revList = Array.from(document.getElementById("rev-list").children);
  for (const revLi of revList) {
    if (revLi.getAttribute("data-flow") !== "1") {
      revLi.remove();
    }
  }
  const relContainer = document.getElementById("rel-container");
  const svgEl = relContainer.getElementsByTagName("svg")[0];
  if (keepCircles) {
    const flowGroups = Array.from(document.getElementsByClassName("flow-group"));
    for (const flowGroup of flowGroups) {
      if (flowGroup.id !== "flow-1") {
        flowGroup.remove();
      }
    }
    let cy = 0;
    let dStr = "";
    const circles = document.getElementById("flow-1").getElementsByTagName("circle");
    for (const circle of circles) {
      circle.setAttribute("cy", (cy + 6).toString());
      cy += 12;
      dStr += `M 5 0 v ${cy} `;
    }
    const flowPath = document.getElementById("flow-1-path");
    flowPath.setAttribute("d", dStr);
    svgEl.setAttribute("viewBox", `0 0 12 ${cy}`);
    svgEl.setAttribute("width", "24px");
  } else {
    svgEl.remove();
  }
  toggleButton.classList.add("active");
};

const restoreOtherBranches = function () {
  if (relContainerBackup !== null) {
    document.getElementById("rel-container").replaceWith(relContainerBackup);
    document.getElementById("rev-container").replaceWith(revContainerBackup);
  }
};

const toggleBranch = function () {
  const relContainer = document.getElementById("rel-container");
  const svgEl = relContainer.getElementsByTagName("svg")[0];
  if (svgEl) {
    const svgElWidth = Number(svgEl.getAttribute("width").replace("px", ""));
    if (svgElWidth > 24) {
      removeOtherBranches();
      return;
    }
  }
  restoreOtherBranches();
  toggleButton.classList.remove("active");
};

const setupButton = function () {
  const container = document.getElementById("git-graph-container");
  const buttons = container.getElementsByTagName("button");
  const lastButton = buttons[buttons.length - 1];
  const newButton = document.createElement("button");
  newButton.classList.add("ui", "icon", "button");
  const branchIcon = document.getElementsByClassName("octicon-git-branch")[0].cloneNode(true);
  newButton.append(branchIcon);
  newButton.append("First Branch");
  newButton.onclick = toggleBranch;
  lastButton.insertAdjacentElement("afterend", newButton);
  toggleButton = newButton;
};

const mutationCallback = function (event) {
  if (event[0].addedNodes) {
    relContainerBackup = null;
    revContainerBackup = null;
    if (toggleButton.classList.contains("active")) {
      toggleButton.classList.remove("active");
      removeOtherBranches();
    }
  }
};

const watchMutations = function () {
  const relContainer = document.getElementById("rel-container");
  const observer = new MutationObserver(mutationCallback);
  observer.observe(relContainer, { childList: true });
};

setupButton();
watchMutations();

