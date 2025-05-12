const INSTALLATION_MODE = true;
const sliderData = [
  //name,              min,    max,     val,    step,  pin (index in received data from WebSocket)
  ["cellRadius",         3,     40,       5,     0.1,   0],
  ["ghostFade",          2,    255,     175,       1,   1],
  ["forceStrength",      0,   0.01,  0.0005, 0.00001,   2],
  ["interactionRadius", 50,    500,      90,       1,   3],
  ["maxConnections",     0,      5,       3,       1,   4],
  ["moveSpeed",          0,      5,     0.4,    0.01,   5],
  ["respawnSpeed",       0,    1.0,       0,    0.01,   6],
  ["numAgents",         20,    400,      40,       1,   7],
  ["",                   0,      0,       0,       0, null],
  ["arcWiggle",          0,     80,      15,       1, null],
  ["arcGrowthSpeed",     0,    0.1,     0.4,   0.001, null],
  ["dutyCycle",          0,      1,    0.08,   0.001, null],
  ["kCoupling",          0,   0.01,  0.0092,  0.0001, null],
  ["naturalFrequency",   0,    0.2,    0.08,   0.001, null],
  ["phaseRandom",        0,    0.3,    0.04,    0.01, null],
];
let sliderSerialBindings = []; // Stores [name, pin_index] for WebSocket-controlled sliders
let sliders = {};
let sliderLabels = {};
let sliderValueDisplays = {};
let slidersVisible;
let agents = [];
let dimAgentColor;
let brightAgentColor;
let brightAgentColor2;
let connectionColor;

function windowResized() {
  // window.location.reload();
  initAgents();
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  createSliders(); // From sliders.js - this populates sliderSerialBindings

  dimAgentColor = color(150, 200, 0, 130);
  brightAgentColor = color(150, 200, 200, 80);
  brightAgentColor2 = color(150, 200, 200, 20);
  connectionColor = color(100, 180, 160, 40);

  setupSerialPort(width / 2 - 80, 20); // From serial.js
  if (!setupWebSocket()) console.error("WebSocket is not initialized!");
  initAgents();
}

function draw() {
  updateSliders(); // Update parameters from (sliders.js)
  adjustPopulation();
  respawnPopulation();
  updateConnections();
  for (let a of agents) {
    a.updateOscillator(); // Agent.updateOscillator()
    a.update();
  }
  background(0, 0, 0, fade); // 'fade' is calculated in getSliders()
  if (slidersVisible) displayAverageFrameRate(10, 30, 60);
  for (let a of agents) {
    a.display();
  }
}

function keyPressed() {
  if (key === " ") {
    initAgents();
  }
  if (key === "s" || key === "S") {
    sliderVisibility(!slidersVisible); // from sliders.js
  }
}
