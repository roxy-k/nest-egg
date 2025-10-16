import mongoose from "mongoose";

const DEFAULT_DB_NAME = process.env.DB_NAME || "nestegg";
const FALLBACK_URI = "mongodb://127.0.0.1:27017";
const SERVER_SELECTION_TIMEOUT = Number(process.env.MONGO_TIMEOUT_MS || 5000);

function maskCredentials(str) {
  if (!str) return str;
  return str.replace(/:\/\/([^:@]+):([^@]+)@/, "://$1:****@");
}

async function tryConnect(uri, label) {
  const masked = maskCredentials(uri);
  console.log(`🔌 Connecting to Mongo (${label}): ${masked}`);
  await mongoose.connect(uri, {
    dbName: DEFAULT_DB_NAME,
    serverSelectionTimeoutMS: SERVER_SELECTION_TIMEOUT,
  });
  console.log("✅ Mongo connected:", mongoose.connection.name);
}

export async function connectDB(uri) {
  const trimmed = typeof uri === "string" ? uri.trim() : "";
  const attempts = [];

  if (trimmed) {
    attempts.push({ uri: trimmed, label: "MONGO_URI" });
  } else {
    console.warn(`⚠️  MONGO_URI not set. Will attempt local MongoDB at ${FALLBACK_URI}/${DEFAULT_DB_NAME}`);
  }

  if (!trimmed || trimmed !== FALLBACK_URI) {
    attempts.push({ uri: FALLBACK_URI, label: "local fallback" });
  }

  mongoose.set("strictQuery", true);

  const errors = [];
  for (const attempt of attempts) {
    try {
      await tryConnect(attempt.uri, attempt.label);
      return;
    } catch (err) {
      console.error(`❌ Failed to connect (${attempt.label}):`, err.message);
      errors.push({ label: attempt.label, error: err });
    }
  }

  console.error("🚨 Unable to connect to MongoDB after attempts:", attempts.map((a) => a.label).join(", "));
  errors.forEach(({ label, error }) => {
    console.error(`  • ${label}: ${error?.message || error}`);
  });
  console.error("Make sure MongoDB is reachable or start a local instance with: mongod --dbpath ./data/db");
  process.exit(1);
}
