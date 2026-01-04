import { db } from "./firebase.js";
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const venueList = document.getElementById("venueList");
let allVenues = [];

/* ================= ADD VENUE ================= */
window.addVenue = async function () {
  const venueId = document.getElementById("venueId").value.trim();
  const block = document.getElementById("block").value.trim();
  const type = document.getElementById("type").value.trim();
  const capacity = Number(document.getElementById("capacity").value);

  if (!venueId || !block || !type || !capacity) {
    alert("All fields are required");
    return;
  }

  await addDoc(collection(db, "venues"), {
    venueId,
    block,
    type,
    capacity
  });

  location.reload();
};

/* ================= LOAD VENUES ================= */
async function loadVenues() {
  const snap = await getDocs(collection(db, "venues"));
  allVenues = snap.docs.map(d => ({
    ...d.data(),
    docId: d.id
  }));

  renderVenues("ALL");
}

/* ================= RENDER VENUES ================= */
function renderVenues(block) {
  venueList.innerHTML = "";

  const filtered =
    block === "ALL"
      ? allVenues
      : allVenues.filter(v => v.block === block);

  if (filtered.length === 0) {
    venueList.innerHTML = "<p>No venues found</p>";
    return;
  }

  filtered.forEach(v => {
    const li = document.createElement("li");

    li.innerHTML = `
      <b>${v.venueId}</b> (${v.type})<br>
      Block ${v.block} | Capacity: ${v.capacity}

      <div class="button-group">
        <button class="small outline"
          onclick="editVenue(
            '${v.docId}',
            '${v.venueId}',
            '${v.block}',
            ${v.capacity}
          )">
          Edit
        </button>

        <button class="small danger"
          onclick="deleteVenue('${v.docId}')">
          Delete
        </button>
      </div>
    `;

    venueList.appendChild(li);
  });
}

/* ================= FILTER BLOCK ================= */
window.filterBlock = function (block) {
  renderVenues(block);
};

/* ================= EDIT VENUE ================= */
window.editVenue = async function (docId, oldVenueId, oldBlock, oldCapacity) {
  const venueId = prompt("Edit venue ID", oldVenueId);
  if (!venueId) return;

  const block = prompt("Edit block", oldBlock);
  if (!block) return;

  const capacity = prompt("Edit capacity", oldCapacity);
  if (!capacity) return;

  await updateDoc(doc(db, "venues", docId), {
    venueId,
    block,
    capacity: Number(capacity)
  });

  location.reload();
};

/* ================= DELETE VENUE ================= */
window.deleteVenue = async function (docId) {
  if (!confirm("Delete this venue?")) return;

  await deleteDoc(doc(db, "venues", docId));
  location.reload();
};

/* ================= NAVIGATION ================= */
window.goBack = function () {
  window.location.href = "admin.html";
};

// Initial load
loadVenues();
