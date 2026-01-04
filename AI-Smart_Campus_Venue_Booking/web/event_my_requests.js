import { auth, db } from "./firebase.js";
import {
  collection,
  getDocs,
  query,
  where
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const requestList = document.getElementById("requestList");

let allRequests = [];
let currentFilter = "ALL";

/* ================= AUTH GUARD ================= */
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "event_login.html";
    return;
  }

  loadMyRequests(user.email);
});

/* ================= LOAD REQUESTS ================= */
async function loadMyRequests(email) {
  requestList.innerHTML = "<p>Loading requests...</p>";

  const q = query(
    collection(db, "venue_requests"),
    where("requestedBy", "==", email)
  );

  const snap = await getDocs(q);
  allRequests = [];
  requestList.innerHTML = "";

  if (snap.empty) {
    requestList.innerHTML = "<p>No requests submitted yet</p>";
    return;
  }

  snap.forEach(d => {
    allRequests.push({
      ...d.data(),
      status: d.data().status || "pending"
    });
  });

  renderRequests("ALL");
}

/* ================= RENDER ================= */
function renderRequests(status) {
  requestList.innerHTML = "";

  const filtered =
    status === "ALL"
      ? allRequests
      : allRequests.filter(r => r.status === status);

  if (filtered.length === 0) {
    requestList.innerHTML = "<p>No requests found</p>";
    return;
  }

  filtered.forEach(r => {
    const li = document.createElement("li");
    li.classList.add(`status-${r.status}`);

    li.innerHTML = `
      <b>${r.event}</b><br>
      Date: ${formatDate(r.date)}<br>
      Time: ${r.startTime} - ${r.endTime}<br>
      Participants: ${r.participants}<br>
      Venue: ${r.suggestedVenue || "Not Assigned"}<br>
      Status: <b>${r.status.toUpperCase()}</b>
    `;

    requestList.appendChild(li);
  });
}

/* ================= DATE FORMAT ================= */
function formatDate(date) {
  if (!date) return "N/A";

  if (date.seconds) {
    return new Date(date.seconds * 1000)
      .toISOString()
      .split("T")[0];
  }

  return date;
}

/* ================= FILTER ================= */
window.filterStatus = function (status) {
  currentFilter = status;
  renderRequests(status);
};

/* ================= NAVIGATION ================= */
window.goBack = function () {
  window.location.href = "event_dashboard.html";
};
