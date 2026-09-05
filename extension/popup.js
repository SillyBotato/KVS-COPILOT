const statusValue = document.getElementById("status-value");
const targetValue = document.getElementById("target-value");
const classValue = document.getElementById("class-value");

const TARGET_URL = "https://kvs-copilot-demo-5q9e.vercel.app";
const SUPPORTED_PATHS = [
  "/statistics/edit/",
  "/statistics/class-wise"
];

function isSupportedUrl(url) {
  try {
    const parsed = new URL(url);
    return parsed.hostname === new URL(TARGET_URL).hostname &&
           SUPPORTED_PATHS.some(path => parsed.pathname.startsWith(path));
  } catch {
    return false;
  }
}

function getClassFromUrl(url) {
  try {
    const parsed = new URL(url);
    const match = parsed.pathname.match(/\/statistics\/edit\/class-(.+)$/i);
    if (!match) return null;

    const slug = match[1].toLowerCase();

    if (slug.startsWith("11-")) {
      return "XI-" + slug.slice(3)
        .split("-")
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join("-");
    }

    if (slug.startsWith("12-")) {
      return "XII-" + slug.slice(3)
        .split("-")
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join("-");
    }

    return slug
      .split("-")
      .map((part, index) => {
        if (index === 0) return part;
        return part.charAt(0).toUpperCase() + part.slice(1);
      })
      .join("-");
  } catch {
    return null;
  }
}

async function updatePopup() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (!tab?.url) {
    statusValue.textContent = "Inactive";
    statusValue.className = "status-value inactive";
    classValue.textContent = "Not detected";
    classValue.className = "class-value empty";
    return;
  }

  const supported = isSupportedUrl(tab.url);

  if (supported) {
    statusValue.textContent = "Active";
    statusValue.className = "status-value active";
    targetValue.textContent = "KVS Demo Admin Statistics";

    const detectedClass = getClassFromUrl(tab.url);
    if (detectedClass) {
      classValue.textContent = detectedClass;
      classValue.className = "class-value";
    } else {
      classValue.textContent = "Not on edit page";
      classValue.className = "class-value empty";
    }
  } else {
    statusValue.textContent = "Inactive";
    statusValue.className = "status-value inactive";
    targetValue.textContent = "KVS Demo Admin Statistics";
    classValue.textContent = "Not on supported page";
    classValue.className = "class-value empty";
  }
}

document.addEventListener("DOMContentLoaded", updatePopup);
chrome.tabs.onActivated.addListener(updatePopup);
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete") {
    updatePopup();
  }
});