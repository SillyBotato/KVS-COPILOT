// KVS Copilot — Approved Data Auto-Fill

const API_URL = "https://kvs-copilot-production-010b.up.railway.app/api/approved/default";
const PANEL_ID = "kvs-autofill-panel";

function log(...args) {
  console.log("[KVS Copilot Autofill]", ...args);
}

// Normalize class identifier for robust matching
function normalizeClassId(str) {
  if (!str) return "";
  return String(str)
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

// Check whether we are on an editable class page
function isEditPage() {
  return /^\/statistics\/edit\/class-/i.test(window.location.pathname);
}

// Convert URL slug to normalized class ID (e.g., "class-1-a" -> "1-a")
function getRecordIdFromUrl() {
  const match = window.location.pathname.match(
    /\/statistics\/edit\/class-(.+)$/i
  );

  if (!match) return null;

  const slug = match[1].toLowerCase();

  // class-11-science -> xi-science
  // class-12-commerce -> xii-commerce
  if (slug.startsWith("11-")) {
    return "xi-" + slug.slice(3);
  }

  if (slug.startsWith("12-")) {
    return "xii-" + slug.slice(3);
  }

  // class-1-a -> 1-a
  return slug;
}

// Fetch approved data from FastAPI
async function getApprovedRecords() {
  const response = await fetch(API_URL);

  if (!response.ok) {
    throw new Error(`Backend request failed: ${response.status}`);
  }

  return await response.json();
}

// Find matching class record - robust matching against id and displayName
function findMatchingRecord(records, urlRecordId) {
  const list = Array.isArray(records)
    ? records
    : records.records || records.data || [];

  const normalizedUrlId = normalizeClassId(urlRecordId);

  return list.find(record => {
    const id = record.id || record.displayName || record.recordId || record.classId;
    if (!id) return false;
    return normalizeClassId(id) === normalizedUrlId;
  });
}

// React-compatible value setter
function setReactValue(element, value) {
  if (!element) return false;

  const prototype =
    element.tagName === "TEXTAREA"
      ? HTMLTextAreaElement.prototype
      : HTMLInputElement.prototype;

  const descriptor = Object.getOwnPropertyDescriptor(prototype, "value");

  if (descriptor && descriptor.set) {
    descriptor.set.call(element, String(value ?? ""));
  } else {
    element.value = String(value ?? "");
  }

  element.dispatchEvent(
    new Event("input", { bubbles: true })
  );

  element.dispatchEvent(
    new Event("change", { bubbles: true })
  );

  element.dispatchEvent(
    new Event("blur", { bubbles: true })
  );

  return true;
}

// Backend field -> portal input ID
const FIELD_MAPPING = {
  numberOfSections: "number-of-sections",
  authorisedCapacity: "authorised-capacity",
  totalEnrolledStudents: "total-students-enrolled",
  boys: "boys",
  girls: "girls",
  scheduledCaste: "sc",
  scheduledTribes: "st",
  otherBackwardClasses: "obc",
  ph: "ph",
  general: "gen",
  generalMinorities: "gen-minority"
};

// Get value from record.fields (the actual data location)
function getFieldValue(record, key) {
  const fields = record.fields || {};
  // Support possible snake_case variants too
  const snakeKey = key.replace(
    /[A-Z]/g,
    letter => "_" + letter.toLowerCase()
  );

  return fields[key] ?? fields[snakeKey] ?? "";
}

function autofill(record) {
  let filled = 0;
  let missing = [];

  for (const [backendField, inputId] of Object.entries(FIELD_MAPPING)) {
    const element =
      document.getElementById(inputId) ||
      document.querySelector(`[name="${inputId}"]`);

    if (element) {
      setReactValue(element, getFieldValue(record, backendField));
      filled++;
    } else {
      missing.push(inputId);
    }
  }

  log(`Filled ${filled} fields`);

  if (missing.length) {
    console.warn("[KVS Copilot Autofill] Missing fields:", missing);
  }

  return { filled, missing };
}

function removeExistingPanel() {
  document.getElementById(PANEL_ID)?.remove();
}

function createPanel(record, recordId) {
  removeExistingPanel();

  const panel = document.createElement("div");
  panel.id = PANEL_ID;

  // Determine display name for the panel
  const displayName = record.displayName || record.id || recordId;

  panel.innerHTML = `
    <div class="kvs-panel-header">
      <span class="kvs-panel-title">KVS Copilot Autofill</span>
      <button class="kvs-close-btn" aria-label="Close panel">&times;</button>
    </div>
    <div class="kvs-panel-content">
      <div class="kvs-status-section">
        <span class="kvs-status-icon">✓</span>
        <div class="kvs-status-text">
          <div class="kvs-detected-class">Detected Class: <strong>${displayName}</strong></div>
          <div class="kvs-data-found">Approved entry found — ready to autofill</div>
        </div>
      </div>
      <div class="kvs-preview">
        ${Object.entries(FIELD_MAPPING).map(([field, inputId]) => {
          const value = getFieldValue(record, field);
          return `
            <div class="kvs-preview-row">
              <span class="kvs-preview-label">${inputId}</span>
              <span class="kvs-preview-value">${value !== "" ? value : "—"}</span>
            </div>
          `;
        }).join("")}
      </div>
      <div class="kvs-actions">
        <button class="kvs-btn kvs-btn-primary" id="kvs-autofill-btn">
          Start Auto-Fill
        </button>
        <button class="kvs-btn kvs-btn-secondary" id="kvs-dismiss-btn">
          Dismiss
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(panel);

  // Event listeners
  panel.querySelector("#kvs-autofill-btn").addEventListener("click", () => {
    const btn = panel.querySelector("#kvs-autofill-btn");
    const result = autofill(record);

    btn.textContent = `Auto-Filled ${result.filled} Fields`;
    btn.disabled = true;

    setTimeout(() => {
      btn.textContent = "Start Auto-Fill";
      btn.disabled = false;
    }, 2500);
  });

  panel.querySelector("#kvs-dismiss-btn").addEventListener("click", () => {
    removeExistingPanel();
  });

  panel.querySelector(".kvs-close-btn").addEventListener("click", () => {
    removeExistingPanel();
  });
}

function createErrorPanel(message) {
  removeExistingPanel();

  const panel = document.createElement("div");
  panel.id = PANEL_ID;
  panel.className = "kvs-panel-error";

  panel.innerHTML = `
    <div class="kvs-panel-header">
      <span class="kvs-panel-title">KVS Copilot Autofill</span>
      <button class="kvs-close-btn" aria-label="Close panel">&times;</button>
    </div>
    <div class="kvs-panel-content">
      <div class="kvs-status-section">
        <span class="kvs-status-icon">⚠</span>
        <div class="kvs-status-text">
          <div class="kvs-error-message">${message}</div>
        </div>
      </div>
      <div class="kvs-actions">
        <button class="kvs-btn kvs-btn-secondary" id="kvs-dismiss-btn">
          Dismiss
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(panel);

  panel.querySelector("#kvs-dismiss-btn").addEventListener("click", () => {
    removeExistingPanel();
  });

  panel.querySelector(".kvs-close-btn").addEventListener("click", () => {
    removeExistingPanel();
  });
}

async function loadApprovedData() {
  if (!isEditPage()) {
    removeExistingPanel();
    return;
  }

  const recordId = getRecordIdFromUrl();

  if (!recordId) return;

  log("Detected record:", recordId);

  try {
    const response = await getApprovedRecords();

    const record = findMatchingRecord(response, recordId);

    if (!record) {
      log("No matching record for:", recordId);
      createErrorPanel("No approved entry available for this class.");
      return;
    }

    log("Found matching record:", record.id || record.displayName);
    createPanel(record, recordId);

  } catch (error) {
    console.error("[KVS Copilot Autofill]", error);
    createErrorPanel("Failed to load approved data. Check connection to backend.");
  }
}

// Handle SPA navigation
let lastUrl = location.href;

function checkNavigation() {
  if (location.href !== lastUrl) {
    lastUrl = location.href;

    setTimeout(loadApprovedData, 500);
  }
}

setInterval(checkNavigation, 500);

// Initial load
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    setTimeout(loadApprovedData, 500);
  });
} else {
  setTimeout(loadApprovedData, 500);
}