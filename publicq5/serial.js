const KNOWN_VENDOR_ID = 1027;
const KNOWN_PRODUCT_ID = 24577;
const SERIAL_PARTS = 9;
const BAUD_RATE = 9600;

let reader;
let port;
let connectButton;
let serialData = "";
let lastLine = "";

function isKnownPort(portInfo) {
  return portInfo.usbVendorId === KNOWN_VENDOR_ID && portInfo.usbProductId === KNOWN_PRODUCT_ID;
}

function connectKnownPorts() {
  navigator.serial.getPorts().then((ports) => {
    for (const p of ports) {
      const info = p.getInfo();
      if (isKnownPort(info)) {
        console.log("Found known port for auto-connect.");
        port = p;
        connectToPort();
        return;
      }
    }
  });
}

function setupSerialPort(x, y) {
  connectButton = createButton("Connect Serial Port");
  connectButton.position(x, y);
  // connectButton.mouseClicked(connectSerial);

  connectKnownPorts();

  navigator.serial.addEventListener("connect", (event) => {
    const info = event.target.getInfo();
    console.log("New device connected:", info);
    if (isKnownPort(info)) {
      port = event.target;
      connectToPort();
    }
  });

  navigator.serial.addEventListener("disconnect", (event) => {
    const info = event.target.getInfo();
    console.warn("Device disconnected:", info);
    if (port === event.target) {
      port = null;
      reader = null;
      if (connectButton) {
        connectButton.html("Connect Serial Port");
        connectButton.removeAttribute("disabled");
        connectButton.show();
      }
    }
  });
}

function connectSerial() {
  navigator.serial
    .requestPort()
    .then((selectedPort) => {
      const info = selectedPort.getInfo();
      if (isKnownPort(info)) {
        port = selectedPort;
        connectToPort();
      } else {
        console.warn("Selected device is not suitable:", info);
      }
    })
    .catch((err) => {
      console.error("Serial port selection cancelled:", err);
    });
}

function connectToPort() {
  if (!port) return;

  const info = port.getInfo();
  console.log(`Connecting: VID=${info.usbVendorId}, PID=${info.usbProductId}`);

  if (connectButton) {
    connectButton.html("Connecting...");
    connectButton.attribute("disabled", "");
  }

  port
    .open({ baudRate: BAUD_RATE })
    .then(() => {
      const decoder = new TextDecoderStream();
      port.readable.pipeTo(decoder.writable);
      reader = decoder.readable.getReader();
      readLoop();

      if (connectButton) {
        connectButton.hide();
      }
    })
    .catch((err) => {
      console.error("Connection error:", err);
      if (connectButton) {
         connectButton.html("Connect Serial Port");
         connectButton.removeAttribute("disabled");
         connectButton.show();
      }
    });
}

async function readLoop() {
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) {
         console.warn("Reader closed.");
         break; // Exit the loop when done
      }

      if (value) {
        serialData += value;
        const lines = serialData.split("\n");
        serialData = lines[lines.length - 1];
        if (lines.length > 1) {
          const completeLine = lines[lines.length - 2];
          if (completeLine.split(",").length === SERIAL_PARTS) {
            lastLine = completeLine;
            setSliders(completeLine);
            if (socket.readyState === WebSocket.OPEN) {
              socket.send(completeLine);
            }
          }
        }
      }
    }
  } catch (err) {
    console.error("readLoop error:", err.message);
    // Re-enable button on error
    if (connectButton) {
       connectButton.html("Connect Serial Port");
       connectButton.removeAttribute("disabled");
       connectButton.show();
    }
  }
}
