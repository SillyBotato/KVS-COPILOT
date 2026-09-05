const BACKEND_URL = "https://kvs-copilot-production-010b.up.railway.app";

chrome.runtime.onInstalled.addListener((details) => {
  console.log(
    "[KVS Copilot Autofill] Extension",
    details.reason === "install" ? "installed" : "updated"
  );
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action !== "getApprovedEnrollmentData") return;

  const sessionId = message.sessionId || "default";

  fetch(
    `${BACKEND_URL}/api/approved/${encodeURIComponent(sessionId)}`
  )
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(
          `Backend returned ${response.status} ${response.statusText}`
        );
      }

      return response.json();
    })
    .then((data) => {
      sendResponse({
        success: true,
        data
      });
    })
    .catch((error) => {
      console.error(
        "[KVS Copilot Autofill] API fetch failed:",
        error
      );

      sendResponse({
        success: false,
        error: error.message
      });
    });

  return true;
});