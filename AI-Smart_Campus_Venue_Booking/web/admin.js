import { auth } from "./firebase.js";
import { signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

window.logout = async function () {
  await signOut(auth);
  window.location.href = "index.html";
};
