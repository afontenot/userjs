// ==UserScript==
// @name         Improve Semantle
// @version      0.0.1
// @description  Make results copyable and hide rules by default
// @author       Adam Fontenot (https://github.com/afontenot)
// @match        https://semantle.novalis.org/
// @grant        none
// ==/UserScript==

'use strict';

function updateClipboard(newClip) {
  navigator.clipboard.writeText(newClip).then(function() {
    button.style.color = "#efefef";
  }, function() {
    button.style.color = "red";
  });
}


function share() {
	const guesses = document.getElementById("guesses");
  let maxCellLength = [];
  for (const row of guesses.children[0].children) {
    let colIndex = 0;
    for (const cell of row.children) {
      const cellContent = cell.textContent.trim();
      if (colIndex >= maxCellLength.length) {
        maxCellLength.push(cellContent.length);
      } else if (maxCellLength[colIndex] < cellContent.length) {
        maxCellLength[colIndex] = cellContent.length;
      }
      colIndex++;
    }
  }
  let output = "";
  for (const row of guesses.children[0].children) {
    if (row.textContent.trim() === "") {
      output += "-".repeat(maxCellLength.reduce((x, y) => x+y) + 2 * (maxCellLength.length-1));
    }
    let colIndex = 0;
    for (const cell of row.children) {
      let cellContent = cell.textContent.trim();
      if (colIndex === 0) {
      	cellContent = cellContent.padStart(maxCellLength[colIndex]);
      }
      output += cellContent.padEnd(maxCellLength[colIndex] + 2);
      colIndex++;
    }
    output += "\n";
  }
  updateClipboard(output);
}

function toggleRules() {
  const rulesButton = document.getElementById("amfscript-rulesbutton");
  if (ruletoggle.textContent === "SHOW RULES") {
    ruletoggle.textContent = "HIDE RULES";
  } else {
    ruletoggle.textContent = "SHOW RULES";
  }
  for (const el of document.getElementsByClassName("amfscript-rules")) {
    if (el.classList.contains("amfscript-hide")) {
      el.classList.remove("amfscript-hide");
    }
    else {
      el.classList.add("amfscript-hide");
    }
  }
}

const style = document.createElement("style");
style.textContent = `body {
  max-width: 6.5in;
  margin-left: auto;
  margin-right: auto;
}
#response {
  margin-top: 20px;
  margin-bottom: 20px;
}
td.close > span {
  text-align: left !important;
}
button.amfscript {
  background-color: rgb(106, 170, 100);
  color: white;
  font-size: 20px;
  font-weight: 700;
  border: 0;
  border-radius: 4px;
  padding: 5px 25px;
  margin-bottom: 20px;
  cursor: pointer;
}
button.amfscript:hover {
  background-color: #7abb74;
}
.amfscript-rules {
  transition: line-height .8s ease-in-out, margin .7s ease-in-out, opacity 0.2s 0.3s ease-in-out;
  line-height: 1.2em;
}
.amfscript-hide {
  line-height: 0px;
  margin: 0;
  opacity: 0;
}
`;
document.body.appendChild(style);

const button = document.createElement("button");
button.classList.add("amfscript");
button.textContent = "SHARE";
button.onclick = share;
document.getElementById("response").insertAdjacentElement("afterend", button);

const ruletoggle = document.createElement("button");
ruletoggle.classList.add("amfscript");
ruletoggle.id = "amfscript-rulesbutton";
ruletoggle.onclick = toggleRules;
document.getElementsByTagName("h3")[0].insertAdjacentElement("afterend", ruletoggle);

const yesterday = document.getElementById("yesterday");
const newYesterday = yesterday.cloneNode(true);
yesterday.remove();
newYesterday.id = "yesterday";
document.getElementById("similarity-story").insertAdjacentElement("beforebegin", newYesterday);

for (const el of document.body.children) {
  if (el.id === "yesterday") {
    break;
  }
  if (el.tagName == "P") {
    el.classList.add("amfscript-hide");
    el.offsetHeight; // force reflow
    el.classList.add("amfscript-rules");
  }
}
ruletoggle.textContent = "SHOW RULES";
