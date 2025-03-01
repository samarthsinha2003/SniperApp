#!/usr/bin/env node
import dotenv from "dotenv";
import { execSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, "..");

// Load the appropriate .env file based on environment
const envFile = process.argv[2] === "prod" ? ".env.production" : ".env";
const envPath = path.join(rootDir, envFile);
const result = dotenv.config({ path: envPath });

if (result.error) {
  console.error(`Error loading ${envFile}:`, result.error);
  process.exit(1);
}

// Construct the Firebase config command
const config = {
  firebase: {
    apikey: process.env.FIREBASE_API_KEY,
    authdomain: process.env.FIREBASE_AUTH_DOMAIN,
    projectid: process.env.FIREBASE_PROJECT_ID,
    storagebucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingsenderid: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appid: process.env.FIREBASE_APP_ID,
    measurementid: process.env.FIREBASE_MEASUREMENT_ID,
  },
};

// Convert config object to Firebase CLI format
const configString = Object.entries(config.firebase)
  .map(([key, value]) => `firebase.${key}="${value}"`)
  .join(" ");

try {
  // Set Firebase config
  console.log(`Setting Firebase config from ${envFile}...`);
  execSync(`firebase functions:config:set ${configString}`, {
    stdio: "inherit",
  });

  // Optional: Get and display current config to verify
  console.log("\nCurrent Firebase config:");
  execSync("firebase functions:config:get", { stdio: "inherit" });
} catch (error) {
  console.error("Error setting Firebase config:", error);
  process.exit(1);
}
