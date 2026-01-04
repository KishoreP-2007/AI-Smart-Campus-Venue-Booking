import { db } from "./firebase.js";
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const classList = document.getElementById("classList");

// Store all schedules locally for filtering
let allClasses = [];

/* ================= ADD CLASS ================= */
window.addClass = async function () {
  const block = document.getElementById("block").value.trim();
  const venueId = document.getElementById("venueId").value.trim();
  const course = document.getElementById("course").value.trim();
  const day = document.getElementById("day").value.trim();
  const startTime = document.getElementById("startTime").value.trim();
  const endTime = document.getElementById("endTime").value.trim();

  if (!block || !venueId || !course || !day || !startTime || !endTime) {
    alert("All fields are required");
    return;
  }

  await addDoc(collection(db, "regular_classes"), {
    block,
    venueId,
    course,
    day,
    startTime,
    endTime
  });

  location.reload();
};

/* ================= LOAD CLASSES ================= */
async function loadClasses() {
  const snap = await getDocs(collection(db, "regular_classes"));
  allClasses = snap.docs.map(d => ({
    ...d.data(),
    docId: d.id
  }));

  renderClasses("ALL");
}

/* ================= RENDER CLASSES ================= */
function renderClasses(block) {
  classList.innerHTML = "";

  const filtered =
    block === "ALL"
      ? allClasses
      : allClasses.filter(c => c.block === block);

  if (filtered.length === 0) {
    classList.innerHTML = "<p>No schedules found</p>";
    return;
  }

  filtered.forEach(c => {
    const li = document.createElement("li");

    li.innerHTML = `
      <b>${c.venueId}</b> | ${c.course}<br>
      Block ${c.block} — ${c.day}<br>
      Time: ${c.startTime} - ${c.endTime}

      <div class="button-group">
        <button class="small outline"
          onclick="editClass(
            '${c.docId}',
            '${c.course}',
            '${c.startTime}',
            '${c.endTime}'
          )">
          Edit
        </button>

        <button class="small danger"
          onclick="deleteClass('${c.docId}')">
          Delete
        </button>
      </div>
    `;

    classList.appendChild(li);
  });
}

/* ================= FILTER BY BLOCK ================= */
window.filterBlock = function (block) {
  renderClasses(block);
};

/* ================= EDIT CLASS (SUBJECT + TIME) ================= */
window.editClass = async function (docId, oldCourse, oldStart, oldEnd) {
  const course = prompt("Edit subject / course", oldCourse);
  if (!course) return;

  const startTime = prompt("Edit start time", oldStart);
  if (!startTime) return;

  const endTime = prompt("Edit end time", oldEnd);
  if (!endTime) return;

  await updateDoc(doc(db, "regular_classes", docId), {
    course,
    startTime,
    endTime
  });

  location.reload();
};

/* ================= DELETE CLASS ================= */
window.deleteClass = async function (docId) {
  if (!confirm("Delete this class schedule?")) return;

  await deleteDoc(doc(db, "regular_classes", docId));
  location.reload();
};

/* ================= NAVIGATION ================= */
window.goBack = function () {
  window.location.href = "admin.html";
};

// Initial load
loadClasses();
