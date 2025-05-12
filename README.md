# Serial Data Logger & Visualizer

## Description

This application visualizes serial port data in real-time using p5.js and logs the data to a CSV file (`veri_kaydi.csv`). It features a web interface served by an Express server and uses WebSockets for communication between the data source and the browser. If live serial data input ceases, the application can automatically switch to playing back previously logged data from the CSV file.

## Features

*   **Real-time Data Visualization:** Receives data (presumably from a serial port via a separate client) and visualizes it using p5.js in a web browser.
*   **Data Logging:** Logs all incoming live data to `veri_kaydi.csv` with timestamps.
*   **CSV Playback:** If live data transmission stops for a configurable duration (default: 10 seconds), the server will start reading `veri_kaydi.csv` and broadcast its contents to connected clients, simulating live data flow. Playback resumes from a random point in the CSV.
*   **Automatic Switch to Live Data:** If live data transmission resumes while CSV playback is active, the application will automatically switch back to displaying live data.
*   **Web-Based Interface:** Uses Express.js to serve the frontend and p5.js sketch.
*   **WebSocket Communication:** Employs WebSockets (`ws` library) for efficient, bidirectional communication between the server and the browser clients, as well as between the (assumed) serial data sender and the server.
*   **Automatic Browser Launch:** Opens the application in the default web browser when the server starts.

## Project Structure

```
BitirmeProjesi/
├── Code/
│   ├── public/             # Frontend files (HTML, p5.js sketch, CSS)
│   │   └── index.html      # Main HTML page for visualization
│   │   └── sketch.js       # p5.js sketch for drawing (assumption)
│   │   └── style.css       # Styles for the page (assumption)
│   ├── node_modules/       # Project dependencies
│   ├── package.json        # Project metadata and dependencies
│   ├── package-lock.json   # Lockfile for dependencies
│   ├── server.js           # Main Node.js application (Express server, WebSocket logic)
│   ├── veri_kaydi.csv      # CSV file for logging data and playback
│   ├── start.bat           # Batch script to start the server
│   ├── başlat.vbs          # VBScript to run start.bat hidden
│   └── kill-port.ps1       # PowerShell script to kill process on port 8080
└── README.md               # This file
```

## Prerequisites

*   Node.js (which includes npm)
*   A separate application or script capable of sending data to this server via WebSocket (e.g., a p5.js sketch using `p5.serialcontrol` or a Python script). This server listens for WebSocket connections and expects data to be sent to it.

## Installation

1.  Navigate to the `BitirmeProjesi/Code` directory in your terminal:
    ```bash
    cd BitirmeProjesi/Code
    ```
2.  Install the project dependencies:
    ```bash
    npm install
    ```

## Running the Application

There are several ways to start the server:

1.  **Using npm (recommended):**
    Open a terminal in the `BitirmeProjesi/Code` directory and run:
    ```bash
    npm start
    ```
2.  **Using the batch script (Windows):**
    Double-click the `start.bat` file located in `BitirmeProjesi/Code/`.
3.  **Using the VBScript (Windows, runs hidden):**
    Double-click the `başlat.vbs` file located in `BitirmeProjesi/Code/`. This will run `start.bat` without a visible console window.

Upon starting, the server will run on `http://localhost:8080`, and it should automatically open this URL in your default web browser.

To **stop** the server, press `Ctrl+C` in the terminal where it's running. If the port remains occupied, you can use the `kill-port.ps1` script (see below).

## How It Works

1.  **Server Initialization:** The `server.js` script starts an Express web server and a WebSocket server. It serves static files from the `public` directory.
2.  **Data Input (External):** It's assumed that an external application (e.g., a p5.js sketch connected to an Arduino via `p5.serialport`, or any other client) connects to this server's WebSocket endpoint (`ws://localhost:8080`). This external application reads data from a serial port and sends it as messages over the WebSocket connection.
3.  **Live Data Processing:**
    *   When the server receives a message via WebSocket, it considers this "live data".
    *   It updates a timestamp (`lastSerialDataTimestamp`) to track data activity.
    *   If CSV playback was active, it stops it.
    *   The received data is broadcasted to all connected browser clients (i.e., instances of `public/index.html`).
    *   The data is appended to `veri_kaydi.csv` with the current timestamp.
4.  **Browser Visualization:** The `public/index.html` page (presumably containing a p5.js sketch in `sketch.js`) connects to the server's WebSocket. When it receives data, it visualizes it.
5.  **Inactivity Check & CSV Playback:**
    *   The server periodically checks if live data has been received recently (within `SERIAL_INACTIVITY_TIMEOUT`, default 10 seconds).
    *   If no live data is received within the timeout and CSV playback is not already active, the server attempts to start playing data from `INPUT_CSV_FILENAME` (`veri_kaydi.csv`).
    *   It reads the CSV, parses timestamps and data values.
    *   It calculates delays between consecutive data points from their timestamps (clamped by `MAX_DELAY`).
    *   It then starts broadcasting these CSV entries to browser clients, one by one, respecting the calculated delays. Playback starts from a random entry in the CSV and loops.
6.  **Switching Back to Live:** If, during CSV playback, new live data arrives from the external source, the server immediately stops the CSV playback and resumes broadcasting and logging the live data.

## Configuration

Key operational parameters are defined as constants at the top of `server.js`:

*   `EXIT_ON_BROWSER_CLOSED` (default: `false`): If `true`, the server will attempt to shut down when the last browser client disconnects.
*   `SERIAL_INACTIVITY_TIMEOUT` (default: `10000` ms): Time in milliseconds of serial data inactivity before switching to CSV playback.
*   `FALLBACK_PLAYBACK_INTERVAL` (default: `50` ms): Interval used for CSV playback if delays cannot be determined or for single-entry CSV files.
*   `MAX_DELAY` (default: `100` ms): Maximum allowed delay (in ms) between playback steps when reading from CSV. This prevents very large gaps if timestamps in the CSV are far apart.
*   `PORT` (default: `8080`): Port number for the web server.
*   `INPUT_CSV_FILENAME` (default: `"veri_kaydi.csv"`): Name of the CSV file to read for playback.
*   `OUTPUT_CSV_FILENAME` (default: `"veri_kaydi.csv"`): Name of the CSV file to write live data logs to.

## Utility Scripts

*   **`BitirmeProjesi/Code/kill-port.ps1`:**
    A PowerShell script to find and terminate the process using port 8080. This is useful if the server doesn't shut down correctly and the port remains in use.
    To run it:
    1.  Open PowerShell.
    2.  Navigate to `BitirmeProjesi/Code/`.
    3.  You might need to set the execution policy: `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass` (for the current session).
    4.  Run the script: `.\kill-port.ps1`

## Dependencies

*   `express`: Web framework for Node.js.
*   `ws`: WebSocket library for Node.js.
*   `open`: Utility to open URLs, files, etc.

These are managed via `npm` and listed in `package.json`.