const KNOWN_VENDOR_ID = 1027;
const KNOWN_PRODUCT_ID = 24577;
const SERIAL_PARTS = 9;
const BAUD_RATE = 9600;

let reader;
let port;
let connectButton;
let serialData = "";
let latestData = "";
let lastLine = "";

function connectKnownPorts() {
  // Tanıdık portlara otomatik bağlan
  navigator.serial.getPorts().then((ports) => {
    for (const p of ports) {
      const info = p.getInfo();
      if (
        info.usbVendorId === KNOWN_VENDOR_ID &&
        info.usbProductId === KNOWN_PRODUCT_ID
      ) {
        console.log("Otomatik bağlantı için port bulundu.");
        port = p;
        connectToPort();
        return true;
      }
    }
  });
  return false;
}

function setupSerialPort(x, y) {
  connectButton = createButton("Seri Porta Bağlan");
  connectButton.position(x, y);
  connectButton.mousePressed(connectSerial);

  connectKnownPorts();
  // Yeni cihaz takıldığında otomatik bağlan
  navigator.serial.addEventListener("connect", (event) => {
    const info = event.target.getInfo();
    console.log("Yeni cihaz takıldı:", info);
    if (
      info.usbVendorId === KNOWN_VENDOR_ID &&
      info.usbProductId === KNOWN_PRODUCT_ID
    ) {
      port = event.target;
      connectToPort();
    }
  });

  // Cihaz çıkarıldığında bağlantıyı temizle
  navigator.serial.addEventListener("disconnect", (event) => {
    const info = event.target.getInfo();
    console.warn("Cihaz çıkarıldı:", info);
    if (port === event.target) {
      port = null;
      reader = null;
      if (connectButton) {
        connectButton.html("Seri Porta Bağlan");
        connectButton.removeAttribute("disabled");
        connectButton.show(); // Bağlantı koptuğunda butonu göster
      }
    }
  });
}

function connectSerial() {
  navigator.serial
    .requestPort()
    .then((selectedPort) => {
      const info = selectedPort.getInfo();
      if (
        info.usbVendorId === KNOWN_VENDOR_ID &&
        info.usbProductId === KNOWN_PRODUCT_ID
      ) {
        port = selectedPort;
        connectToPort();
      } else {
        console.warn("Uygun olmayan cihaz seçildi:", info);
      }
    })
    .catch((err) => {
      console.error("Seri port seçimi iptal edildi:", err);
    });
}

function connectToPort() {
  if (!port) return;

  const info = port.getInfo();
  console.log(`Bağlanıyor: VID=${info.usbVendorId}, PID=${info.usbProductId}`);

  // Buton durumunu "Bağlanıyor" olarak güncelle
  if (connectButton) {
    connectButton.html("Bağlanıyor");
    connectButton.attribute("disabled", "");
  }

  port
    .open({ baudRate: BAUD_RATE })
    .then(() => {
      const decoder = new TextDecoderStream();
      port.readable.pipeTo(decoder.writable);
      reader = decoder.readable.getReader();
      readLoop();

      // Bağlandıktan sonra butonu gizle
      if (connectButton) {
        connectButton.hide();
      }
    })
    .catch((err) => {
      console.error("Bağlantı hatası:", err);
      // Hata durumunda yeniden bağlanma logic'i eklenebilir
    });
}

async function readLoop() {
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) throw new Error("Port bağlantısı kapandı");

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
    console.warn("readLoop bitti:", err.message);
  }
}
