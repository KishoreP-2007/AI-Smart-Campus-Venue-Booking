import { auth } from "./firebase.js";
import { signOut, onAuthStateChanged } from
  "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// Protect page
onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "event_login.html";
  }
});

window.logout = async function () {
  await signOut(auth);
  window.location.href = "index.html";
};

window.goCreateRequest = function () {
  window.location.href = "event_request.html";
};

window.goMyRequests = function () {
  window.location.href = "event_my_requests.html";
};
