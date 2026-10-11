
const { MongoClient } = require("mongodb");

let client;
let database;

async function connectDB() {
  const uri = process.env.MONGODB_URI;

  if (!uri || uri.includes("PASTE_YOUR_ATLAS")) {
    throw new Error("Please configure MONGODB_URI in .env");
  }

  client = new MongoClient(uri);
  await client.connect();

  database = client.db(process.env.DB_NAME || "cloud_lab");
  await database.command({ ping: 1 });

  console.log("MongoDB Atlas connected successfully!");
}

function getDB() {
  if (!database) {
    throw new Error("MongoDB is not connected");
  }
  return database;
}

async function closeDB() {
  if (client) {
    await client.close();
    client = null;
    database = null;
  }
}

module.exports = { connectDB, getDB, closeDB };
