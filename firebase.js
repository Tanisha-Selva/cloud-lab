
const admin = require("firebase-admin");
const path = require("path");

let db;

function connectFirebase() {
  if (db) return db;

  if (admin.apps.length === 0) {
    const keyPath = path.join(
      __dirname,
      "serviceAccountKey.json"
    );

    const serviceAccount = require(keyPath);

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  }

  db = admin.firestore();

  console.log("Firebase connected successfully!");
  return db;
}

function getFirebaseDB() {
  if (!db) {
    throw new Error("Firebase is not connected");
  }

  return db;
}

module.exports = {
  connectFirebase,
  getFirebaseDB
};
