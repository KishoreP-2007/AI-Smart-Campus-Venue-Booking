// firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDsnuR1zyg2fMUbTcTYXhbuXb0Gl0tgwZQ",
  authDomain: "smart-campus-venue-v2.firebaseapp.com",
  projectId: "smart-campus-venue-v2",
  storageBucket: "smart-campus-venue-v2.firebasestorage.app",
  messagingSenderId: "814755985930",
  appId: "1:814755985930:web:0e933d2a4c64cc131a7df3",
  measurementId: "G-DJKSZP277H"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

console.log("🔥 Firebase initialized");
