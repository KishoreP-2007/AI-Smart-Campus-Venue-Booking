import { auth, db } from "./firebase.js";

import {
  signInWithEmailAndPassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
  signOut
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* ---------- TOGGLE PASSWORD ---------- */
window.toggle = function (id) {
  const input = document.getElementById(id);
  input.type = input.type === "password" ? "text" : "password";
};

/* ---------- ADMIN LOGIN ---------- */
window.loginAdmin = async function () {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const msg = document.getElementById("msg");

  msg.innerText = "";

  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);

    // 🔒 Check ADMIN role
    const userDoc = await getDoc(doc(db, "users", cred.user.uid));
    if (!userDoc.exists() || userDoc.data().role !== "admin") {
      msg.innerText = "Access denied: Not an admin account";
      await signOut(auth);
      return;
    }

    // ✅ Admin dashboard
    window.location.href = "admin.html";

  } catch (err) {
    msg.innerText = "Login failed: " + err.message;
  }
};

/* ---------- TOGGLE RESET BOX ---------- */
window.toggleReset = function () {
  const box = document.getElementById("resetBox");
  box.style.display = box.style.display === "none" ? "block" : "none";
};

/* ---------- RESET PASSWORD ---------- */
window.resetPassword = async function () {
  const email = document.getElementById("email").value;
  const oldPass = document.getElementById("oldPassword").value;
  const newPass = document.getElementById("newPassword").value;
  const msg = document.getElementById("msg");

  if (!email || !oldPass || !newPass) {
    msg.innerText = "Please fill all fields";
    return;
  }

  try {
    // 🔐 Silent login using old password
    const cred = await signInWithEmailAndPassword(auth, email, oldPass);

    // 🔐 Re-authentication (Firebase required)
    const credential = EmailAuthProvider.credential(email, oldPass);
    await reauthenticateWithCredential(cred.user, credential);

    // 🔄 Update password
    await updatePassword(cred.user, newPass);

    msg.innerText = "Password updated successfully ✔";

    // Optional logout for security
    await signOut(auth);
    document.getElementById("resetBox").style.display = "none";

  } catch (err) {
    msg.innerText = "Reset failed: " + err.message;
  }
};
