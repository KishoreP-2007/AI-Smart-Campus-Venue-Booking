import { auth, db } from "./firebase.js";
import {
  collection,
  getDocs,
  addDoc,
  serverTimestamp,
  query,
  where
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// =========================================================
// 1. CONFIGURATION
// =========================================================
// ⚠️ PASTE YOUR CLEAN API KEY HERE
const API_KEY = "AIzaSyCBA16ID89-r2IXaLg65Pqj_PcTOwop4xQ"; 

/* ---------- AUTH GUARD ---------- */
onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "event_login.html";
  }
});

window.goBack = () => {
  window.location.href = "event_dashboard.html";
};

let selectedVenue = null;

// =========================================================
// 2. HELPER: CHECK TIME CONFLICTS (Classes + Events)
// =========================================================
function isVenueBusy(venueId, regularClasses, existingEvents, reqDate, reqStart, reqEnd) {
    
    // --- CHECK 1: REGULAR CLASSES (Weekly Schedule) ---
    const dateObj = new Date(reqDate);
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const reqDayName = days[dateObj.getDay()];

    const hasClassConflict = regularClasses.some(cls => 
        cls.venueId === venueId && 
        cls.day === reqDayName &&
        (cls.startTime < reqEnd && cls.endTime > reqStart)
    );

    if (hasClassConflict) return true; // Busy due to class

    // --- CHECK 2: ONE-OFF EVENTS (Already Booked) ---
    const hasEventConflict = existingEvents.some(evt => {
        // 1. Must be the same venue
        if (evt.suggestedVenue !== venueId) return false;
        
        // 2. Must be "approved" (Ignore rejected/pending if you prefer)
        if (evt.status !== 'approved') return false; 

        // 3. Must be the same date
        if (evt.date !== reqDate) return false;

        // 4. Check Time Overlap
        // (EventStart < ReqEnd) AND (EventEnd > ReqStart)
        return (evt.startTime < reqEnd && evt.endTime > reqStart);
    });

    return hasEventConflict; // Busy due to another event
}

// =========================================================
// 3. MAIN FUNCTION
// =========================================================
window.suggestVenueWithAI = async function () {
  const count = Number(document.getElementById("participants").value);
  const eventName = document.getElementById("eventName").value;
  const eventDate = document.getElementById("eventDate").value;
  const startTime = document.getElementById("startTime").value;
  const endTime = document.getElementById("endTime").value;
  
  const output = document.getElementById("suggestedVenueList");
  const loading = document.getElementById("loadingIndicator");
  const aiBox = document.getElementById("aiReasoning");
  const btn = document.getElementById("suggestBtn");

  // --- VALIDATION ---
  if (!count || !eventName || !eventDate || !startTime || !endTime) {
    if(output) output.innerHTML = "<p style='color:red; text-align:center'>Please fill in all details (Name, Date, Time, Count).</p>";
    return;
  }

  // --- UI LOADING STATE ---
  if (output) output.innerHTML = "";
  if (aiBox) aiBox.style.display = "none";
  if (loading) loading.style.display = "block";
  if (btn) {
      btn.disabled = true;
      btn.innerText = "Checking Schedules...";
  }

  try {
    // 1. Fetch Venues, Regular Classes, AND Existing Requests
    const [venueSnap, classSnap, requestsSnap] = await Promise.all([
        getDocs(collection(db, "venues")),
        getDocs(collection(db, "regular_classes")),
        getDocs(collection(db, "venue_requests")) // Fetch existing bookings
    ]);

    const allVenues = venueSnap.docs.map(d => d.data());
    const regularClasses = classSnap.docs.map(d => d.data());
    const existingEvents = requestsSnap.docs.map(d => d.data());

    // 2. Filter: Capacity + Schedule Check
    const candidates = allVenues.filter(v => {
        // Capacity Rule
        if (Number(v.capacity) < count) return false;

        // Busy Rule (Checks both Classes AND Events)
        const busy = isVenueBusy(v.venueId, regularClasses, existingEvents, eventDate, startTime, endTime);
        
        return !busy; // Keep only if NOT busy
    });

    if (candidates.length === 0) {
      if(output) output.innerHTML = "<p style='color:red; text-align:center'>No venues available (All booked or too small).</p>";
      resetUI();
      return;
    }

    // 3. Prepare Data for AI
    btn.innerText = "Consulting AI...";
    
    const venueDataForAI = candidates.map(v => ({ 
        id: v.venueId, 
        type: v.type, 
        features: v.features || "Standard", 
        capacity: v.capacity
    }));

    const promptText = `
      You are a facility manager. Select the best venue for this request.
      
      User Request: "${eventName}"
      Participants: ${count}
      
      Available Venues (Already checked for availability):
      ${JSON.stringify(venueDataForAI)}

      Task:
      1. Analyze the Event Name to guess the type of room needed.
      2. Pick the SINGLE best venue ID.
      3. Explain why in 1 short sentence.
      4. Return ONLY valid JSON: { "recommendedId": "VENUE_ID", "reason": "Because..." }
    `;

    // 4. DIRECT API CALL (Gemini 2.5 Flash)
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;
    
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: promptText }] }]
      })
    });

    if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    // 5. Parse AI Response
    const rawText = data.candidates[0].content.parts[0].text;
    const cleanJson = rawText.replace(/```json|```/g, "").trim(); 
    const aiDecision = JSON.parse(cleanJson);

    // 6. Update UI
    if (loading) loading.style.display = "none";
    if (aiBox) {
        aiBox.style.display = "block";
        aiBox.innerHTML = `<strong>🤖 AI Recommendation:</strong> ${aiDecision.reason}`;
    }

    candidates.forEach(v => {
      const isRecommended = v.venueId === aiDecision.recommendedId;
      
      const borderStyle = isRecommended ? "2px solid #2e7d32" : "1px solid #ddd";
      const bgStyle = isRecommended ? "#f1f8e9" : "#fff";
      const badge = isRecommended ? "⭐ Best Match" : "";

      output.innerHTML += `
        <div class="card" id="card-${v.venueId}" style="margin:10px 0; padding:15px; border-radius:8px; border: ${borderStyle}; background: ${bgStyle};">
          <div style="display:flex; justify-content:space-between; align-items:center">
            <div>
              <b>${v.venueId}</b> <span style="color:green; font-weight:bold">${badge}</span><br>
              <span style="color:#666; font-size:0.9em">${v.type} | Cap: ${v.capacity}</span>
            </div>
            <button class="small outline" onclick="selectVenue('${v.venueId}', this)">Select</button>
          </div>
        </div>
      `;
    });

  } catch (err) {
    console.error("Error:", err);
    if (output) output.innerHTML = `<p style='color:red; text-align:center'>Error: ${err.message}</p>`;
  } finally {
    resetUI();
  }
};

function resetUI() {
    const btn = document.getElementById("suggestBtn");
    const loading = document.getElementById("loadingIndicator");
    if (btn) {
        btn.disabled = false;
        btn.innerText = "✨ Ask AI to Recommend Venue";
    }
    if (loading) loading.style.display = "none";
}

// =========================================================
// 4. SUBMIT & SELECT LOGIC
// =========================================================
window.selectVenue = function (venueId, btn) {
  selectedVenue = venueId;
  document.querySelectorAll(".card").forEach(card => {
    if (card.innerHTML.includes("Best Match")) {
        card.style.border = "2px solid #2e7d32";
    } else {
        card.style.border = "1px solid #ddd";
    }
  });
  const selectedCard = document.getElementById(`card-${venueId}`);
  if (selectedCard) selectedCard.style.border = "2px solid #1565c0";
};

window.submitRequest = async function () {
    const eventNameValue = document.getElementById("eventName").value;
    const date = document.getElementById("eventDate").value;
    const startTime = document.getElementById("startTime").value;
    const endTime = document.getElementById("endTime").value;
    const participants = Number(document.getElementById("participants").value);
    const msg = document.getElementById("msg");

    if (!eventNameValue || !date || !startTime || !endTime || !participants) {
        if(msg) msg.innerText = "Please fill all fields";
        return;
    }
    if (!selectedVenue) {
        if(msg) msg.innerText = "Please select a venue";
        return;
    }

    try {
        await addDoc(collection(db, "venue_requests"), {
        event: eventNameValue,
        date,
        startTime,
        endTime,
        participants,
        suggestedVenue: selectedVenue,
        status: "pending",
        requestedBy: auth.currentUser ? auth.currentUser.email : "guest",
        createdAt: serverTimestamp()
        });
        
        if(msg) {
            msg.innerText = "Request submitted successfully ✔";
            msg.style.color = "green";
        }
        setTimeout(() => { window.location.href = "event_dashboard.html"; }, 1200);

    } catch (err) {
        console.error(err);
        if(msg) msg.innerText = "Error: " + err.message;
    }
};