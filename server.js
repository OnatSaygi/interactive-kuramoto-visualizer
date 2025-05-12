const EXIT_ON_BROWSER_CLOSED = false;
const SERIAL_INACTIVITY_TIMEOUT = 10000; // 10 seconds before switching to CSV
const FALLBACK_PLAYBACK_INTERVAL = 50;  // ms, used if CSV delay is invalid/missing
const MAX_DELAY = 100;                  // ms, max delay between CSV playback steps
const PORT = 8080;
const INPUT_CSV_FILENAME = "veri_kaydi.csv"; // File to read for playback
const OUTPUT_CSV_FILENAME = "veri_kaydi.csv"; // File to write live data logs

import express from "express";
import { WebSocketServer, WebSocket } from "ws";
import fs from "fs";
import fsp from "fs/promises"; // Use promise-based fs
import path from "path";
import { fileURLToPath } from "url";
import open from "open";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- State Variables ---
let lastSerialDataTimestamp = Date.now();
let isPlayingFromCSV = false;
let csvPlaybackEntries = []; // Stores { data: string, delayToNext: number }
let csvPlaybackIndex = 0;
let playbackTimeoutId = null;

// --- Setup Express & WebSocket Server ---
const app = express();
app.use(express.static(path.join(__dirname, "public")));

const server = app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  open(`http://localhost:${PORT}`);
});

const wss = new WebSocketServer({ server });
const logStream = fs.createWriteStream(OUTPUT_CSV_FILENAME, { flags: "a" });

// --- Helper Functions ---
function broadcast(data) {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
}

function logData(data, source) {
    const timestamp = new Date().toISOString();
    const csvLine = `${timestamp},${data}\n`; // Removed extra space
    logStream.write(csvLine, () => {
      // Simplified logging - avoid logging every line written if not needed
      // console.log(`Logged (${source}):`, csvLine.trim());
    });
}

function stopCSVPlayback() {
  if (playbackTimeoutId) {
    clearTimeout(playbackTimeoutId);
    playbackTimeoutId = null;
  }
  if (isPlayingFromCSV) { // Only log/reset if it was actually playing
      isPlayingFromCSV = false;
      csvPlaybackEntries = [];
      csvPlaybackIndex = 0;
      console.log("CSV playback stopped.");
  }
}

function scheduleNextCSVLine() {
  if (!isPlayingFromCSV || csvPlaybackEntries.length === 0) {
    stopCSVPlayback();
    return;
  }

  const entry = csvPlaybackEntries[csvPlaybackIndex];
  broadcast(entry.data);
  // console.log(`Playing CSV (delay: ${entry.delayToNext}ms):`, entry.data); // Optional verbose log

  csvPlaybackIndex = (csvPlaybackIndex + 1) % csvPlaybackEntries.length;

  const delay = entry.delayToNext; // Already validated in startCSVPlayback
  playbackTimeoutId = setTimeout(scheduleNextCSVLine, delay);
}

async function startCSVPlayback() {
  if (isPlayingFromCSV) return;
  console.log("Serial data inactive. Attempting CSV playback...");

  try {
    const fileContent = await fsp.readFile(INPUT_CSV_FILENAME, "utf8");
    const rawLines = fileContent.trim().split("\n");

    const parsedEntries = rawLines
      .map(line => {
        const firstCommaIndex = line.indexOf(",");
        if (firstCommaIndex === -1) return null;

        const timestampStr = line.substring(0, firstCommaIndex);
        const dataStr = line.substring(firstCommaIndex + 1).trim();
        const timestamp = new Date(timestampStr).getTime();

        if (!dataStr || isNaN(timestamp)) return null;
        return { timestamp, data: dataStr };
      })
      .filter(entry => entry !== null); // Remove invalid lines
      // Optional sort if needed: .sort((a, b) => a.timestamp - b.timestamp);

    if (parsedEntries.length === 0) {
      console.log("CSV file is empty or contains no valid entries.");
      return;
    }

    csvPlaybackEntries = parsedEntries.map((entry, i) => {
      let delayToNext;
      if (i < parsedEntries.length - 1) {
        delayToNext = parsedEntries[i + 1].timestamp - entry.timestamp;
      } else { // Last entry: calculate delay to loop back to the first
        delayToNext = parsedEntries.length > 1
          ? (parsedEntries[1].timestamp - parsedEntries[0].timestamp) // Use first interval
          : FALLBACK_PLAYBACK_INTERVAL; // Single entry case
      }
      // Clamp delay and ensure positivity
      delayToNext = Math.max(1, Math.min(delayToNext, MAX_DELAY)); // Ensure at least 1ms, clamp max

      return { data: entry.data, delayToNext };
    });

    isPlayingFromCSV = true;
    // Start from a random index instead of 0
    csvPlaybackIndex = Math.floor(Math.random() * csvPlaybackEntries.length);
    console.log(`Loaded ${csvPlaybackEntries.length} entries. Starting CSV playback from random index ${csvPlaybackIndex}.`);
    scheduleNextCSVLine(); // Start the playback loop

  } catch (err) {
    if (err.code === 'ENOENT') {
        console.log(`Input CSV file (${INPUT_CSV_FILENAME}) not found. Cannot start playback.`);
    } else {
        console.error("Error reading/processing CSV for playback:", err);
    }
    stopCSVPlayback(); // Ensure state is clean after error
  }
}

// --- WebSocket Event Handling ---
wss.on("connection", (ws) => {
  console.log("Browser client connected");

  ws.on("message", (message) => {
    lastSerialDataTimestamp = Date.now(); // Update timestamp on any message

    if (isPlayingFromCSV) {
      console.log("Live data received. Switching back to live serial data.");
      stopCSVPlayback();
    }

    const liveData = message.toString().trim();
    broadcast(liveData);
    logData(liveData, "live");
  });

  ws.on("close", () => {
    console.log("Browser client disconnected");
    if (EXIT_ON_BROWSER_CLOSED && wss.clients.size === 0) {
      console.log("Last browser closed. Shutting down server...");
      logStream.end(() => { // Ensure log stream is closed before exiting
          server.close(() => {
              process.exit(0);
          });
      });
    }
  });

  ws.on('error', (error) => {
      console.error('WebSocket error:', error);
  });
});

// --- Inactivity Check Interval ---
setInterval(() => {
  if (!isPlayingFromCSV && (Date.now() - lastSerialDataTimestamp > SERIAL_INACTIVITY_TIMEOUT)) {
    startCSVPlayback();
  }
}, 2000); // Check every 2 seconds

console.log("Server initialized. Waiting for connections...");
