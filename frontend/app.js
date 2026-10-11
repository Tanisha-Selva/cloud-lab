
/* =====================================================
   1. API CONFIGURATION
   ===================================================== */

// Change this only if your backend URL or API path changes.
const API = "http://localhost:3000/api/records";

// Dropbox routes must be implemented in server.js too.
// Change these paths if your backend uses different routes.
const DROPBOX_UPLOAD_API = "http://localhost:3000/api/files/upload";
const DROPBOX_FILES_API = "http://localhost:3000/api/files";

// Auth0 login/logout routes
const AUTH0_LOGIN_URL = "http://localhost:3000/login";
const AUTH0_LOGOUT_URL = "http://localhost:3000/logout";


/* =====================================================
   2. GET HTML ELEMENTS
   These IDs must match your index.html.
   ===================================================== */

const form = document.getElementById("recordForm");
const nameInput = document.getElementById("name");
const categoryInput = document.getElementById("category");
const recordId = document.getElementById("recordId");
const recordsBody = document.getElementById("recordsBody");
const totalRecords = document.getElementById("totalRecords");
const message = document.getElementById("message");
const saveBtn = document.getElementById("saveBtn");
const cancelBtn = document.getElementById("cancelBtn");

const loginScreen = document.getElementById("loginScreen");
const dashboard = document.getElementById("dashboard");
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const refreshBtn = document.getElementById("refreshBtn");

const yearElement = document.getElementById("year");

if (yearElement) {
  yearElement.textContent = new Date().getFullYear();
}


/* =====================================================
   3. COMMON API REQUEST FUNCTION
   Used by CRUD and optional cloud integrations.
   ===================================================== */

async function request(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      ...(options.body instanceof FormData
        ? {}
        : { "Content-Type": "application/json" }),
      ...options.headers
    }
  });

  // DELETE routes may return no response body.
  const text = await response.text();
  let data = {};

  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { message: text };
    }
  }

  if (!response.ok) {
    throw new Error(data.error || data.message || "Request failed");
  }

  return data;
}

function showMessage(text, success = true) {
  if (!message) return;

  message.textContent = text;
  message.style.color = success ? "#26764d" : "#b23a42";
}

// MongoDB may return _id; another backend may return id.
function getRecordId(record) {
  return record.id ?? record._id;
}

// Escape values before displaying them in HTML.
function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}


/* =====================================================
   4. READ RECORDS — REST API
   Works with the in-memory backend or MongoDB,
   provided the backend returns an array of records.
   ===================================================== */

async function loadRecords() {
  if (!recordsBody) return;

  recordsBody.innerHTML =
    '<tr><td colspan="4">Loading records...</td></tr>';

  try {
    const records = await request(API);

    if (!Array.isArray(records)) {
      throw new Error("API did not return a records array.");
    }

    if (totalRecords) {
      totalRecords.textContent = records.length;
    }

    if (records.length === 0) {
      recordsBody.innerHTML =
        '<tr><td colspan="4">No records yet. Add one above.</td></tr>';
      return;
    }

    recordsBody.innerHTML = records.map(record => {
      const id = getRecordId(record);

      return `
        <tr>
          <td>${escapeHTML(id)}</td>
          <td>${escapeHTML(record.name)}</td>
          <td>${escapeHTML(record.category)}</td>
          <td class="actions">
            <button class="secondary"
                    data-edit="${escapeHTML(id)}">Edit</button>
            <button class="danger"
                    data-delete="${escapeHTML(id)}">Delete</button>
          </td>
        </tr>
      `;
    }).join("");

  } catch (error) {
    recordsBody.innerHTML =
      '<tr><td colspan="4">Could not load records.</td></tr>';

    showMessage(error.message, false);
  }
}


/* =====================================================
   5. ADD AND UPDATE RECORDS — REST API
   POST = Add
   PUT  = Update
   ===================================================== */

function resetForm() {
  if (!form) return;

  form.reset();
  recordId.value = "";
  saveBtn.textContent = "+ Add Record";

  if (cancelBtn) {
    cancelBtn.classList.add("hidden");
  }
}

if (form) {
  form.addEventListener("submit", async event => {
    event.preventDefault();

    const id = recordId.value;

    const payload = {
      name: nameInput.value.trim(),
      category: categoryInput.value.trim()
    };

    if (!payload.name || !payload.category) {
      showMessage("Please fill in all fields.", false);
      return;
    }

    try {
      await request(id ? `${API}/${encodeURIComponent(id)}` : API, {
        method: id ? "PUT" : "POST",
        body: JSON.stringify(payload)
      });

      showMessage(id
        ? "Record updated successfully."
        : "Record added successfully.");

      resetForm();
      await loadRecords();

    } catch (error) {
      showMessage(error.message, false);
    }
  });
}


/* =====================================================
   6. EDIT AND DELETE RECORDS
   ===================================================== */

if (recordsBody) {
  recordsBody.addEventListener("click", async event => {
    const editButton = event.target.closest("[data-edit]");
    const deleteButton = event.target.closest("[data-delete]");

    // EDIT
    if (editButton) {
      try {
        const records = await request(API);

        const record = records.find(item =>
          String(getRecordId(item)) === editButton.dataset.edit
        );

        if (!record) {
          showMessage("Record not found.", false);
          return;
        }

        recordId.value = getRecordId(record);
        nameInput.value = record.name ?? "";
        categoryInput.value = record.category ?? "";

        saveBtn.textContent = "Save Changes";

        if (cancelBtn) {
          cancelBtn.classList.remove("hidden");
        }

        nameInput.focus();

      } catch (error) {
        showMessage(error.message, false);
      }
    }

    // DELETE
    if (deleteButton) {
      const id = deleteButton.dataset.delete;

      if (!confirm("Delete this record?")) return;

      try {
        await request(`${API}/${encodeURIComponent(id)}`, {
          method: "DELETE"
        });

        showMessage("Record deleted successfully.");
        await loadRecords();

      } catch (error) {
        showMessage(error.message, false);
      }
    }
  });
}

if (cancelBtn) {
  cancelBtn.addEventListener("click", resetForm);
}

if (refreshBtn) {
  refreshBtn.addEventListener("click", loadRecords);
}


/* =====================================================
   7. LOGIN SCREEN — DEMO MODE
   This only switches screens. It is NOT real authentication.
   ===================================================== */

if (loginBtn) {
  loginBtn.addEventListener("click", () => {

    // AUTH0 CHANGE:
    // For real Auth0 login, uncomment the next line
    // and remove/comment the two screen-switching lines below.
    // window.location.href = AUTH0_LOGIN_URL;

    // Demo login only:
    if (loginScreen) loginScreen.classList.add("hidden");
    if (dashboard) dashboard.classList.remove("hidden");

    loadRecords();
  });
}

if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {

    // AUTH0 CHANGE:
    // For real Auth0 logout, use the backend's configured
    // logout URL instead of just hiding the dashboard.
    // window.location.href = AUTH0_LOGOUT_URL;

    // Demo logout only:
    if (dashboard) dashboard.classList.add("hidden");
    if (loginScreen) loginScreen.classList.remove("hidden");

    resetForm();
  });
}


/* =====================================================
   8. DROPBOX INTEGRATION — OPTIONAL
   Enable only when your HTML and server.js have the routes.
   ===================================================== */

// Required HTML elements if you enable this section:
// <input type="file" id="fileInput">
// <button id="uploadBtn">Upload File</button>
// <button id="listFilesBtn">Refresh Files</button>
// <div id="filesList"></div>

const fileInput = document.getElementById("fileInput");
const uploadBtn = document.getElementById("uploadBtn");
const listFilesBtn = document.getElementById("listFilesBtn");
const filesList = document.getElementById("filesList");

// DROPBOX CHANGE 1:
// Uncomment this block when the backend has a working upload route.

/*
if (uploadBtn && fileInput) {
  uploadBtn.addEventListener("click", async () => {
    const file = fileInput.files[0];

    if (!file) {
      showMessage("Choose a file first.", false);
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      // Do not manually set Content-Type for FormData.
      const result = await request(DROPBOX_UPLOAD_API, {
        method: "POST",
        body: formData
      });

      showMessage(result.message || "File uploaded successfully.");
      fileInput.value = "";

      await loadDropboxFiles();
    } catch (error) {
      showMessage(error.message, false);
    }
  });
}
*/

// DROPBOX CHANGE 2:
// Uncomment this function and the event listener below
// when server.js implements GET /api/files.

/*
async function loadDropboxFiles() {
  if (!filesList) return;

  try {
    const result = await request(DROPBOX_FILES_API);
    const files = result.files || result;

    if (!Array.isArray(files)) {
      throw new Error("Unexpected Dropbox response.");
    }

    filesList.innerHTML = files.map(file => `
      <p>${escapeHTML(file.name || file.path_display || "File")}</p>
    `).join("") || "No files found.";

  } catch (error) {
    filesList.textContent = error.message;
  }
}

if (listFilesBtn) {
  listFilesBtn.addEventListener("click", loadDropboxFiles);
}
*/


/* =====================================================
   9. FIREBASE / MONGODB ATLAS — IMPORTANT
   ===================================================== */

// Usually, NO app.js change is needed if server.js handles
// Firestore or MongoDB and exposes the same REST endpoints.
//
// Example:
// Frontend -> GET /api/records -> Express -> MongoDB Atlas
//
// If your teacher asks for Firebase directly in the frontend,
// you would need Firebase Web SDK configuration and different
// database calls. Do not put Firebase Admin credentials here.
//
// MongoDB Atlas connection strings belong in backend .env,
// not in this file.


/* =====================================================
   10. START THE APP
   ===================================================== */

// Load records only if the dashboard starts visible.
// If the login screen is visible, demo login loads them later.

if (dashboard && !dashboard.classList.contains("hidden")) {
  loadRecords();
}
