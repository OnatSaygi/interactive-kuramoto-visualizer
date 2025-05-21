const INSTALLATION_MODE = false;
const ELLIPSE_MODE = true;
const sliderData = [
  //name,              min,    max,     val,    step,  pin (index in received data from WebSocket)
  ["cellRadius",         2,     6,       5,     0.1,   0],
  ["ghostFade",          2,    255,     175,       1,   1],
  ["forceStrength",      0,   0.01,  0.0005, 0.00001,   2],
  ["interactionRadius", 50,    500,      90,       1,   3],
  ["maxConnections",   0.1,      5,       3,     0.1,   4],
  ["moveSpeed",          0,      5,     0.4,    0.01,   5],
  ["respawnSpeed",       0,    1.0,       0,    0.01,   6],
  ["numAgents",         20,    400,      40,       1,   7],
  ["",                   0,      0,       0,       0, null],
  ["arcWiggle",          0,     80,      15,       1, null],
  ["arcGrowthSpeed",     0,    0.1,    0.04,   0.001, null],
  ["dutyCycle",          0,      1,    0.08,   0.001, null],
  ["kCoupling",          0,   0.01,  0.0092,  0.0001, null],
  ["naturalFrequency",   0,    0.2,    0.08,   0.001, null],
  ["phaseRandom",        0,    0.3,    0.04,    0.01, null],
];
let agents = [];
let dimAgentColor;
let brightAgentColor;
let brightAgentColor2;
let connectionColor;

function windowResized() {
  for (agent of agents) {
    agent.pos.x *= windowWidth / width;
    agent.pos.y *= windowHeight / height;
  }
  resizeCanvas(windowWidth, windowHeight);
}

function setup() {
  // bezierDetail(6);
  createCanvas(windowWidth, windowHeight);
  createSliders();

  colorMode(RGB, 255);
  dimAgentColor = color(150, 200, 0, 130);
  brightAgentColor = color(150, 200, 200, 80);
  brightAgentColor2 = color(150, 200, 200, 20);
  connectionColor = color(100, 180, 160, 40);

  setupSerialPort(width / 2 - 80, 20); // From serial.js
  if (!setupWebSocket()) console.error("WebSocket is not initialized!");
  initAgents();
}

function draw() {
  translate(-width / 2, -height / 2);

  getSliders();
  adjustPopulation();
  respawnPopulation();
  updateConnections();
  for (let agent of agents) {
    agent.updateOscillator();
    agent.update();
  }
  background(0, fade);
  if (slidersVisible) displayAverageFrameRate(3, 30, 60);
  for (let agent of agents) {
    agent.display();
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
