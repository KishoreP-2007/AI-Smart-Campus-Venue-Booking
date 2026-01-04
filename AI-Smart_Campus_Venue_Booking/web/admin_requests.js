import { db } from "./firebase.js";
import {
  collection,
  getDocs,
  updateDoc,
  deleteDoc,
  doc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const requestList = document.getElementById("requestList");

let allRequests = [];
let currentFilter = "ALL";

const today = new Date().toISOString().split("T")[0];

/* ================= LOAD REQUESTS ================= */
async function loadRequests() {
  const snap = await getDocs(collection(db, "venue_requests"));
  allRequests = [];

  snap.forEach(d => {
    const r = d.data();

    // Auto-delete past events
    if (r.date < today) {
      deleteDoc(doc(db, "venue_requests", d.id));
      return;
    }

    allRequests.push({
      ...r,
      docId: d.id
    });
  });

  renderRequests("ALL");
}

/* ================= RENDER REQUESTS ================= */
function renderRequests(status) {
  requestList.innerHTML = "";

  const filtered =
    status === "ALL"
      ? allRequests
      : allRequests.filter(r => (r.status || "pending") === status);

  if (filtered.length === 0) {
    requestList.innerHTML = "<p>No requests found</p>";
    return;
  }

  filtered.forEach(r => {
    const li = document.createElement("li");
    const state = r.status || "pending";

    li.classList.add(`status-${state}`);

    li.innerHTML = `
      <b>${r.event}</b><br>
      Date: ${r.date}<br>
      Time: ${r.startTime} - ${r.endTime}<br>
      Participants: ${r.participants}<br>
      Venue: ${r.suggestedVenue}

      <div class="button-group">
        ${actionButtons(r.docId, state)}
      </div>
    `;

    requestList.appendChild(li);
  });
}

/* ================= ACTION BUTTONS ================= */
function actionButtons(id, status) {
  if (status === "approved") {
    return `
      <button class="small outline"
        onclick="updateStatus('${id}','rejected')">
        Move to Rejected
      </button>
    `;
  }

  if (status === "rejected") {
    return `
      <button class="small outline"
        onclick="updateStatus('${id}','approved')">
        Move to Approved
      </button>
    `;
  }

  // Pending
  return `
    <button class="small"
      onclick="updateStatus('${id}','approved')">
      Approve
    </button>
    <button class="small danger"
      onclick="updateStatus('${id}','rejected')">
      Reject
    </button>
  `;
}

/* ================= UPDATE STATUS ================= */
window.updateStatus = async function (docId, status) {
  await updateDoc(doc(db, "venue_requests", docId), { status });
  location.reload();
};

/* ================= FILTER ================= */
window.filterStatus = function (status) {
  currentFilter = status;
  renderRequests(status);
};

/* ================= NAVIGATION ================= */
window.goBack = function () {
  window.location.href = "admin.html";
};

// Initial load
loadRequests();
