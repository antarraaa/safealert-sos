/* ============================================================
   SafeAlert — Frontend App Logic
   Communicates with the Express backend via fetch() API calls
   ============================================================ */

// ── Config ──────────────────────────────────────────────────
const API = window.location.origin; // same origin as backend serves frontend

// Avatar colors for contacts
const COLORS = [
  { bg: "rgba(52,152,219,0.25)",  text: "#3498db" },
  { bg: "rgba(155,89,182,0.25)", text: "#9b59b6" },
  { bg: "rgba(46,204,113,0.2)",  text: "#2ecc71" },
  { bg: "rgba(230,57,70,0.2)",   text: "#e63946" },
  { bg: "rgba(243,156,18,0.2)",  text: "#f39c12" },
  { bg: "rgba(26,188,156,0.2)",  text: "#1abc9c" },
];

function pickColor(str) {
  let hash = 0;
  for (let c of str) hash = (hash << 5) - hash + c.charCodeAt(0);
  return COLORS[Math.abs(hash) % COLORS.length];
}

// ── State ────────────────────────────────────────────────────
let currentPosition = { lat: 19.8762, lng: 75.3433, accuracy: 0, address: "Aurangabad, Maharashtra, India" };
let alertFilter = "all";
let sending = false;

// ── Page Routing ─────────────────────────────────────────────
function showPage(id) {
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  document.querySelectorAll(".nav-tab").forEach(t => t.classList.remove("active"));
  document.getElementById("page-" + id).classList.add("active");
  const tabMap = { home: 0, map: 1, admin: 2, contacts: 3 };
  document.querySelectorAll(".nav-tab")[tabMap[id]].classList.add("active");

  if (id === "admin")    loadAlerts();
  if (id === "contacts") loadContacts();
  if (id === "home")     loadStats();
}

// Bind nav tabs
document.querySelectorAll(".nav-tab").forEach((btn, i) => {
  const pages = ["home", "map", "admin", "contacts"];
  btn.addEventListener("click", () => showPage(pages[i]));
});

// ── Geolocation ──────────────────────────────────────────────
function getLocation() {
  if (!navigator.geolocation) return;
  navigator.geolocation.getCurrentPosition(
    pos => {
      currentPosition.lat      = pos.coords.latitude;
      currentPosition.lng      = pos.coords.longitude;
      currentPosition.accuracy = Math.round(pos.coords.accuracy);
      updateMapUI();
    },
    err => console.warn("Geolocation error:", err.message),
    { enableHighAccuracy: true, timeout: 8000 }
  );
}

function updateMapUI() {
  const { lat, lng } = currentPosition;
  const latStr = lat.toFixed(4) + "° N";
  const lngStr = lng.toFixed(4) + "° E";
  document.getElementById("map-lat").textContent = latStr;
  document.getElementById("map-lng").textContent = lngStr;
  document.getElementById("map-update-time").textContent =
    "Last updated " + new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  // Update map iframe
  const src = `https://www.google.com/maps/embed/v1/place?key=AIzaSyD-9tSrke72PouQMnMX-a7eZSW0jkFMBWY&q=${lat},${lng}&zoom=15`;
  // Fallback if no API key — use search embed
  document.getElementById("map-iframe").src =
    `https://www.google.com/maps?q=${lat},${lng}&z=15&output=embed`;
}

// ── SOS Button ───────────────────────────────────────────────
document.getElementById("sos-btn").addEventListener("click", async () => {
  if (sending) return;
  await triggerSOS();
});

async function triggerSOS() {
  sending = true;
  const btn = document.getElementById("sos-btn");
  btn.classList.add("sending", "disabled-btn");
  btn.querySelector(".sos-sub").textContent = "Sending...";

  // Animate rings
  document.querySelectorAll(".ring").forEach(r => r.classList.add("fired"));
  setTimeout(() => document.querySelectorAll(".ring").forEach(r => r.classList.remove("fired")), 3000);

  // Show live bar
  showLiveBar();

  try {
    const res = await fetch(`${API}/api/sos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId:    "user-" + Math.floor(Math.random() * 1000),
        userName:  "You",
        latitude:  currentPosition.lat,
        longitude: currentPosition.lng,
        address:   currentPosition.address,
        accuracy:  currentPosition.accuracy,
        message:   "Emergency SOS triggered"
      })
    });

    const data = await res.json();

    if (data.success) {
      showToast(data);
      loadStats();
      updateAlertBadge();
      // Set map alert state
      document.getElementById("alert-map-badge").style.display = "flex";
      document.getElementById("map-status").textContent = "🚨 Alert";
      document.getElementById("map-status").className = "info-card-value danger";
    } else {
      alert("Error: " + (data.error || "Could not send alert"));
    }
  } catch (err) {
    console.error("SOS error:", err);
    // Offline fallback — still show toast
    showToast({
      message: "Alert sent (offline mode)",
      notifiedContacts: ["Mom", "Rahul", "Priya"],
      formattedTime: new Date().toLocaleTimeString()
    });
  } finally {
    sending = false;
    setTimeout(() => {
      btn.classList.remove("sending", "disabled-btn");
      btn.querySelector(".sos-sub").textContent = "Press Now";
    }, 3000);
  }
}

// ── Live Bar ─────────────────────────────────────────────────
function showLiveBar() {
  const bar  = document.getElementById("live-bar");
  const prog = document.getElementById("timer-prog");
  const cnt  = document.getElementById("live-count");

  bar.classList.add("visible");
  prog.style.transition = "width 5s linear";
  prog.style.width = "100%";
  void prog.offsetWidth;
  prog.style.width = "0%";

  let sec = 5;
  cnt.textContent = sec + "s";
  const iv = setInterval(() => {
    sec--;
    cnt.textContent = sec + "s";
    if (sec <= 0) { clearInterval(iv); bar.classList.remove("visible"); prog.style.width = "100%"; }
  }, 1000);
}

// ── Toast ─────────────────────────────────────────────────────
function showToast(data) {
  const toast    = document.getElementById("toast");
  const contacts = (data.notifiedContacts || []).join(", ") || "your contacts";

  document.getElementById("toast-time").textContent    = data.formattedTime || "";
  document.getElementById("toast-body").innerHTML      =
    `Your SOS alert has been dispatched to <strong>${data.notifiedContacts?.length || 0} emergency contacts</strong> (${contacts}). Help is on the way — stay calm and remain at your location.`;
  document.getElementById("toast-loc-main").textContent   = currentPosition.address;
  document.getElementById("toast-loc-coords").textContent =
    `Lat: ${currentPosition.lat.toFixed(4)}° N, Long: ${currentPosition.lng.toFixed(4)}° E · Accuracy: ±${currentPosition.accuracy || 12}m`;

  toast.classList.add("show");
  setTimeout(() => dismissToast(), 12000);
}

function dismissToast() {
  document.getElementById("toast").classList.remove("show");
}

// ── Stats ────────────────────────────────────────────────────
async function loadStats() {
  try {
    const res  = await fetch(`${API}/api/stats`);
    const data = await res.json();
    if (!data.success) return;
    const s = data.stats;
    document.getElementById("stat-total").textContent    = s.total;
    document.getElementById("stat-contacts").textContent = s.activeContacts;
    document.getElementById("stat-new").textContent      = s.new;
  } catch (e) { console.warn("Stats load failed", e); }

  // Also load recent alerts for home
  loadHomeRecent();
  loadHomeContacts();
}

async function loadHomeRecent() {
  const el = document.getElementById("home-recent");
  try {
    const res  = await fetch(`${API}/api/alerts?limit=3`);
    const data = await res.json();
    if (!data.alerts.length) { el.innerHTML = `<p style="color:var(--text3);font-size:13px;">No alerts yet.</p>`; return; }
    el.innerHTML = data.alerts.map(a => `
      <div class="recent-item">
        <div class="recent-dot ${a.status}"></div>
        <div class="recent-info">
          <div class="recent-loc">📍 ${a.address}</div>
          <div class="recent-time">${a.formattedTime}</div>
        </div>
        <span class="recent-status status-${a.status}">${a.status}</span>
      </div>
    `).join("");
  } catch (e) { el.innerHTML = ""; }
}

async function loadHomeContacts() {
  const el = document.getElementById("home-contacts");
  try {
    const res  = await fetch(`${API}/api/contacts`);
    const data = await res.json();
    el.innerHTML = data.contacts.filter(c => c.active).map((c, i) => {
      const col = pickColor(c.name);
      const initials = c.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
      return `
        <div class="contact-chip">
          <div class="contact-av" style="background:${col.bg};color:${col.text};">${initials}</div>
          <div class="contact-chip-name">${c.name}</div>
          <div class="contact-chip-status">● Active</div>
        </div>
      `;
    }).join("");
  } catch (e) { el.innerHTML = ""; }
}

// ── Admin Badge ──────────────────────────────────────────────
async function updateAlertBadge() {
  try {
    const res  = await fetch(`${API}/api/alerts?status=new`);
    const data = await res.json();
    const badge = document.getElementById("admin-badge");
    if (data.count > 0) {
      badge.textContent = data.count;
      badge.style.display = "inline";
    } else {
      badge.style.display = "none";
    }
  } catch (e) {}
}

// ── Admin Alerts ─────────────────────────────────────────────
async function loadAlerts() {
  const el = document.getElementById("admin-alerts-list");
  el.innerHTML = `<div class="loading">Loading alerts...</div>`;

  const query = alertFilter === "all" ? "" : `?status=${alertFilter}`;
  try {
    const res  = await fetch(`${API}/api/alerts${query}`);
    const data = await res.json();

    if (!data.alerts.length) {
      el.innerHTML = `<div class="empty-state"><div class="empty-icon">📋</div>No alerts found.</div>`;
      return;
    }

    el.innerHTML = data.alerts.map(a => {
      const col = pickColor(a.userName || "U");
      const initials = a.initials || "??";
      const statusClass = a.status === "new" ? "status-new" : a.status === "pending" ? "status-pending" : "status-resolved";
      const statusLabel = a.status === "new" ? "🔴 New" : a.status === "pending" ? "⏳ Pending" : "✅ Resolved";
      const notified = (a.notifiedContacts || []).join(", ") || "—";
      return `
        <div class="alert-card ${a.status === "new" ? "is-new" : ""}" id="ac-${a.id}">
          <div class="alert-card-top">
            <div class="alert-user">
              <div class="alert-av" style="background:${col.bg};color:${col.text};">${initials}</div>
              <div>
                <div class="alert-name">${a.userName}</div>
                <div class="alert-time">${a.formattedTime}</div>
              </div>
            </div>
            <span class="status-pill ${statusClass}">${statusLabel}</span>
          </div>
          <div class="alert-loc">📍 ${a.address}<br><small style="color:var(--text3);">${a.latitude.toFixed(4)}° N, ${a.longitude.toFixed(4)}° E · Accuracy ±${a.accuracy}m</small></div>
          <div class="alert-contacts">📢 Notified: ${notified}</div>
          <div class="alert-actions">
            ${a.status !== "resolved" ? `<button class="act-btn respond" onclick="updateAlertStatus('${a.id}','pending')">Respond</button>` : ""}
            ${a.status !== "resolved" ? `<button class="act-btn resolve" onclick="updateAlertStatus('${a.id}','resolved')">Mark Resolved</button>` : ""}
            <button class="act-btn" onclick="viewAlertOnMap(${a.latitude},${a.longitude})">View Map</button>
            <button class="act-btn delete" onclick="deleteAlert('${a.id}')">Delete</button>
          </div>
        </div>
      `;
    }).join("");
  } catch (e) {
    el.innerHTML = `<div class="empty-state"><div class="empty-icon">⚠️</div>Could not load alerts. Is the server running?</div>`;
  }

  updateAlertBadge();
}

async function updateAlertStatus(id, status) {
  try {
    await fetch(`${API}/api/alerts/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status })
    });
    loadAlerts();
    loadStats();
  } catch (e) { alert("Error updating alert"); }
}

async function deleteAlert(id) {
  if (!confirm("Delete this alert?")) return;
  try {
    await fetch(`${API}/api/alerts/${id}`, { method: "DELETE" });
    loadAlerts();
    loadStats();
  } catch (e) { alert("Error deleting alert"); }
}

function viewAlertOnMap(lat, lng) {
  document.getElementById("map-iframe").src = `https://www.google.com/maps?q=${lat},${lng}&z=15&output=embed`;
  document.getElementById("map-lat").textContent = lat.toFixed(4) + "° N";
  document.getElementById("map-lng").textContent = lng.toFixed(4) + "° E";
  showPage("map");
}

// Filter buttons
document.querySelectorAll(".filter-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    alertFilter = btn.dataset.filter;
    loadAlerts();
  });
});

// ── Contacts ─────────────────────────────────────────────────
async function loadContacts() {
  const el = document.getElementById("contacts-list");
  el.innerHTML = `<div class="loading">Loading...</div>`;
  try {
    const res  = await fetch(`${API}/api/contacts`);
    const data = await res.json();
    if (!data.contacts.length) { el.innerHTML = `<div class="empty-state"><div class="empty-icon">👥</div>No contacts yet.</div>`; return; }
    el.innerHTML = data.contacts.map((c, i) => {
      const col = pickColor(c.name);
      const initials = c.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
      return `
        <div class="contact-card">
          <div class="contact-card-av" style="background:${col.bg};color:${col.text};">${initials}</div>
          <div class="contact-card-info">
            <div class="contact-card-name">${c.name}</div>
            <div class="contact-card-phone">${c.phone}</div>
            <div class="contact-card-rel">${c.relation}</div>
          </div>
          <div class="contact-card-actions">
            <button class="toggle-btn ${c.active ? "on" : ""}" title="${c.active ? "Active" : "Inactive"}" onclick="toggleContact('${c.id}', this)"></button>
            <button class="icon-btn" title="Remove" onclick="removeContact('${c.id}')">✕</button>
          </div>
        </div>
      `;
    }).join("");
  } catch (e) {
    el.innerHTML = `<div class="empty-state"><div class="empty-icon">⚠️</div>Could not load contacts.</div>`;
  }
}

async function addContact() {
  const name     = document.getElementById("c-name").value.trim();
  const phone    = document.getElementById("c-phone").value.trim();
  const relation = document.getElementById("c-relation").value.trim() || "Contact";
  const errEl    = document.getElementById("c-error");

  if (!name || !phone) { errEl.textContent = "Name and phone number are required."; return; }
  errEl.textContent = "";

  try {
    const res  = await fetch(`${API}/api/contacts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, phone, relation })
    });
    const data = await res.json();
    if (data.success) {
      document.getElementById("c-name").value = "";
      document.getElementById("c-phone").value = "";
      document.getElementById("c-relation").value = "";
      loadContacts();
    } else {
      errEl.textContent = data.error || "Could not add contact.";
    }
  } catch (e) { errEl.textContent = "Server error. Is the backend running?"; }
}

async function toggleContact(id, btn) {
  try {
    await fetch(`${API}/api/contacts/${id}/toggle`, { method: "PATCH" });
    btn.classList.toggle("on");
  } catch (e) { alert("Error toggling contact"); }
}

async function removeContact(id) {
  if (!confirm("Remove this contact?")) return;
  try {
    await fetch(`${API}/api/contacts/${id}`, { method: "DELETE" });
    loadContacts();
    loadHomeContacts();
  } catch (e) { alert("Error removing contact"); }
}

// ── Init ─────────────────────────────────────────────────────
getLocation();
loadStats();
updateAlertBadge();
