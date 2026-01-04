import { auth, db } from "./firebase.js";

import {
  createUserWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  collection,
  getDocs,
  setDoc,
  doc,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* ---------------- ELEMENTS ---------------- */
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const togglePasswordBtn = document.getElementById("togglePassword");
const msg = document.getElementById("msg");
const userList = document.getElementById("userList");
const createBtn = document.getElementById("createUserBtn");
const backBtn = document.getElementById("backBtn");

/* ---------------- BACK NAVIGATION ---------------- */
backBtn.addEventListener("click", () => {
  window.location.href = "admin.html";
});

/* ---------------- SHOW / HIDE PASSWORD ---------------- */
togglePasswordBtn.addEventListener("click", (e) => {
  e.preventDefault();
  passwordInput.type =
    passwordInput.type === "password" ? "text" : "password";
});

/* ---------------- CREATE USER ---------------- */
createBtn.addEventListener("click", async () => {
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  msg.innerText = "";

  if (!email || !password) {
    msg.innerText = "Please fill all fields";
    return;
  }

  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);

    await setDoc(doc(db, "users", cred.user.uid), {
      email,
      role: "event"
    });

    msg.innerText = "Event user created successfully";
    emailInput.value = "";
    passwordInput.value = "";

    loadUsers();
  } catch (err) {
    msg.innerText = err.message;
  }
});

/* ---------------- LOAD USERS ---------------- */
async function loadUsers() {
  userList.innerHTML = "";

  const snapshot = await getDocs(collection(db, "users"));

  snapshot.forEach(docSnap => {
    const user = docSnap.data();
    if (user.role !== "event") return;

    const li = document.createElement("li");
    li.innerHTML = `
      <strong>${user.email}</strong><br>
      Role: ${user.role}
      <div class="button-group">
        <button class="small danger">Delete</button>
      </div>
    `;

    li.querySelector("button").addEventListener("click", () => {
      deleteUser(docSnap.id);
    });

    userList.appendChild(li);
  });
}

/* ---------------- DELETE USER ---------------- */
async function deleteUser(uid) {
  if (!confirm("Delete this event team user?")) return;

  await deleteDoc(doc(db, "users", uid));
  loadUsers();
}

/* ---------------- INIT ---------------- */
loadUsers();
