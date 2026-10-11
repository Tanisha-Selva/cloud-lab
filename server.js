
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const { ObjectId } = require("mongodb");
const { connectDB, getDB, closeDB } = require("./db");
const { connectFirebase, getFirebaseDB } = require("./firebase");
const { auth } = require("express-openid-connect");
const multer = require("multer");
const { connectDropbox, getDropbox } = require("./dropbox");

const app = express();
const PORT = process.env.PORT || 3000;

const USE_MONGODB = process.env.USE_MONGODB === "true";
const USE_FIREBASE = process.env.USE_FIREBASE === "true";
const USE_AUTH0 = process.env.USE_AUTH0 === "true";
const USE_DROPBOX = process.env.USE_DROPBOX === "true";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
});

app.use(cors());
app.use(express.json());

// AUTH0: Enable login middleware only when configured
if (USE_AUTH0) {
  app.use(auth({
    authRequired: false,
    auth0Logout: true,
    secret: process.env.AUTH0_SECRET,
    baseURL: process.env.AUTH0_BASE_URL,
    clientID: process.env.AUTH0_CLIENT_ID,
    issuerBaseURL: process.env.AUTH0_ISSUER_BASE_URL
  }));
}

// In-memory storage for local testing
let records = [
  { _id: "1", name: "Sample Record", category: "General" }
];
let nextId = 2;

// MongoDB collection
function collection() {
  return getDB().collection("records");
}

function validMongoId(id) {
  return ObjectId.isValid(id) &&
    new ObjectId(id).toHexString() === id.toLowerCase();
}

// Get all records
async function getAllRecords() {
  if (USE_MONGODB) {
    const docs = await collection().find({}).toArray();
    return docs.map(doc => ({
      ...doc,
      _id: doc._id.toString()
    }));
  }

  return records;
}

// Find one record
async function findOneRecord(id) {
  if (USE_MONGODB) {
    if (!validMongoId(id)) return null;

    const doc = await collection().findOne({
      _id: new ObjectId(id)
    });

    return doc ? { ...doc, _id: doc._id.toString() } : null;
  }

  return records.find(record => record._id === id) || null;
}

// HOME
app.get("/", (req, res) => {
  res.json({
    message: "Cloud Lab API is running!",
    storage: USE_MONGODB ? "MongoDB Atlas" : "In-memory",
    firebase: USE_FIREBASE ? "Enabled" : "Disabled",
    auth0: USE_AUTH0 ? "Enabled" : "Disabled",
    dropbox: USE_DROPBOX ? "Enabled" : "Disabled"
  });
});

// AUTH0: Login
app.get("/login", (req, res) => {
  if (!USE_AUTH0) {
    return res.status(503).send("Auth0 is disabled");
  }

  res.oidc.login();
});

// AUTH0: User profile
app.get("/api/auth/profile", (req, res) => {
  if (!USE_AUTH0) {
    return res.status(503).json({ error: "Auth0 is disabled" });
  }

  if (!req.oidc.isAuthenticated()) {
    return res.status(401).json({ error: "Please log in first" });
  }

  res.json({ user: req.oidc.user });
});

// AUTH0: Logout
app.get("/logout", (req, res) => {
  if (!USE_AUTH0) {
    return res.status(503).send("Auth0 is disabled");
  }

  res.oidc.logout();
});

// REST API: GET records
app.get("/api/records", async (req, res, next) => {
  try {
    res.json(await getAllRecords());
  } catch (err) {
    next(err);
  }
});

// REST API: CREATE record
app.post("/api/records", async (req, res, next) => {
  try {
    const { name, category } = req.body;

    if (
      typeof name !== "string" || !name.trim() ||
      typeof category !== "string" || !category.trim()
    ) {
      return res.status(400).json({
        error: "Name and category are required"
      });
    }

    const record = {
      name: name.trim(),
      category: category.trim()
    };

    if (USE_MONGODB) {
      const result = await collection().insertOne(record);
      return res.status(201).json({
        ...record,
        _id: result.insertedId.toString()
      });
    }

    const created = { ...record, _id: String(nextId++) };
    records.push(created);
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});

// REST API: UPDATE record
app.put("/api/records/:id", async (req, res, next) => {
  try {
    const { name, category } = req.body;
    const updates = {};

    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim()) {
        return res.status(400).json({ error: "Invalid name" });
      }
      updates.name = name.trim();
    }

    if (category !== undefined) {
      if (typeof category !== "string" || !category.trim()) {
        return res.status(400).json({ error: "Invalid category" });
      }
      updates.category = category.trim();
    }

    if (USE_MONGODB) {
      if (!validMongoId(req.params.id)) {
        return res.status(400).json({ error: "Invalid record ID" });
      }

      const result = await collection().updateOne(
        { _id: new ObjectId(req.params.id) },
        { $set: updates }
      );

      if (!result.matchedCount) {
        return res.status(404).json({ error: "Record not found" });
      }

      return res.json(await findOneRecord(req.params.id));
    }

    const record = records.find(r => r._id === req.params.id);

    if (!record) {
      return res.status(404).json({ error: "Record not found" });
    }

    Object.assign(record, updates);
    res.json(record);
  } catch (err) {
    next(err);
  }
});

// REST API: DELETE record
app.delete("/api/records/:id", async (req, res, next) => {
  try {
    if (USE_MONGODB) {
      if (!validMongoId(req.params.id)) {
        return res.status(400).json({ error: "Invalid record ID" });
      }

      const result = await collection().deleteOne({
        _id: new ObjectId(req.params.id)
      });

      if (!result.deletedCount) {
        return res.status(404).json({ error: "Record not found" });
      }

      return res.json({ message: "Record deleted successfully" });
    }

    const exists = records.some(r => r._id === req.params.id);

    if (!exists) {
      return res.status(404).json({ error: "Record not found" });
    }

    records = records.filter(r => r._id !== req.params.id);
    res.json({ message: "Record deleted successfully" });
  } catch (err) {
    next(err);
  }
});

// FIREBASE: GET records
app.get("/api/firebase/records", async (req, res, next) => {
  try {
    if (!USE_FIREBASE) {
      return res.status(503).json({ error: "Firebase is disabled" });
    }

    const snapshot = await getFirebaseDB()
      .collection("records")
      .get();

    res.json(snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })));
  } catch (err) {
    next(err);
  }
});

// FIREBASE: CREATE record
app.post("/api/firebase/records", async (req, res, next) => {
  try {
    if (!USE_FIREBASE) {
      return res.status(503).json({ error: "Firebase is disabled" });
    }

    const { name, category } = req.body;

    if (
      typeof name !== "string" || !name.trim() ||
      typeof category !== "string" || !category.trim()
    ) {
      return res.status(400).json({
        error: "Name and category are required"
      });
    }

    const record = {
      name: name.trim(),
      category: category.trim(),
      createdAt: new Date().toISOString()
    };

    const result = await getFirebaseDB()
      .collection("records")
      .add(record);

    res.status(201).json({
      id: result.id,
      ...record
    });
  } catch (err) {
    next(err);
  }
});

// DROPBOX: Check whether the service is enabled
function requireDropbox(req, res, next) {
  if (!USE_DROPBOX) {
    return res.status(503).json({
      error: "Dropbox is disabled. Enable USE_DROPBOX in .env."
    });
  }

  next();
}

// DROPBOX: Upload a file
app.post(
  "/api/dropbox/upload",
  requireDropbox,
  upload.single("file"),
  async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          error: "Please select a file to upload."
        });
      }

      const safeName = req.file.originalname
        .replace(/[^\w.\- ]/g, "_")
        .replace(/\s+/g, "_")
        .slice(0, 150);

      const filePath = `/${Date.now()}-${safeName}`;

      const result = await getDropbox().filesUpload({
        path: filePath,
        contents: req.file.buffer,
        mode: { ".tag": "add" },
        autorename: true
      });

      res.status(201).json({
        message: "File uploaded successfully!",
        name: result.result.name,
        path: result.result.path_display
      });
    } catch (err) {
      next(err);
    }
  }
);

// DROPBOX: List uploaded files
app.get(
  "/api/dropbox/files",
  requireDropbox,
  async (req, res, next) => {
    try {
      const result = await getDropbox().filesListFolder({
        path: ""
      });

      const files = result.result.entries
        .filter(item => item[".tag"] === "file")
        .map(item => ({
          name: item.name,
          path: item.path_display,
          size: item.size
        }));

      res.json(files);
    } catch (err) {
      next(err);
    }
  }
);

// ERROR HANDLER
app.use((err, req, res, next) => {
  console.error(err.message);
  res.status(500).json({
    error: "Server error. Check the backend terminal."
  });
});

// START SERVER
async function start() {
  if (USE_MONGODB) {
    await connectDB();
  }

  if (USE_FIREBASE) {
    connectFirebase();
  }

  if (USE_DROPBOX) {
    connectDropbox();
  }

  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log(
      `Storage: ${USE_MONGODB ? "MongoDB Atlas" : "In-memory"}`
    );
    console.log(`Firebase: ${USE_FIREBASE ? "Enabled" : "Disabled"}`);
    console.log(`Auth0: ${USE_AUTH0 ? "Enabled" : "Disabled"}`);
    console.log(`Dropbox: ${USE_DROPBOX ? "Enabled" : "Disabled"}`);
  });
}

start().catch(async err => {
  console.error("Startup failed:", err.message);
  await closeDB();
  process.exit(1);
});
