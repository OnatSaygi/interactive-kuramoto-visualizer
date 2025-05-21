let sliders = {};
let sliderValueDisplays = {};
let sliderSerialBindings = [];
let slidersVisible;
const sliderLabels = {};

function createSliders() {
  let y = 40;
  for (let [name, minV, maxV, def, step, pin] of sliderData) {
    if (pin !== null) {
      sliderSerialBindings.push([name, pin]);
    }
    if (name === "") {
      y += 15;
      continue;
    }

    const label = document.createElement("div");
    label.className = "label";
    label.textContent = name;
    label.style.position = "absolute";
    label.style.left = "10px";
    label.style.top = `${y}px`;
    label.style.color = "white";
    label.style.opacity = "0.8";
    document.body.appendChild(label);
    sliderLabels[name] = label;

    const slider = document.createElement("input");
    slider.type = "range";
    slider.min = minV;
    slider.max = maxV;
    slider.step = step;
    slider.value = def;
    slider.className = "slider";
    slider.style.position = "absolute";
    slider.style.left = "125px";
    slider.style.top = `${y}px`;
    slider.style.width = "100px";
    slider.style.opacity = "0.2";
    document.body.appendChild(slider);
    sliders[name] = slider;

    const valueDisplay = document.createElement("div");
    valueDisplay.className = "value";
    valueDisplay.textContent = def;
    valueDisplay.style.position = "absolute";
    valueDisplay.style.left = "230px";
    valueDisplay.style.top = `${y}px`;
    valueDisplay.style.color = "white";
    valueDisplay.style.opacity = "0.8";
    document.body.appendChild(valueDisplay);
    sliderValueDisplays[name] = valueDisplay;

    slider.addEventListener("input", () => {
      valueDisplay.textContent = slider.value;
    });

    y += 24;

    if (typeof INSTALLATION_MODE !== "undefined" && INSTALLATION_MODE) {
      slider.style.display = "none";
      label.style.display = "none";
      valueDisplay.style.display = "none";
    }
  }
  getSliders();
  slidersVisible = !(
    typeof INSTALLATION_MODE !== "undefined" && INSTALLATION_MODE
  );
}

function getSliders() {
  intRad = getSliderValue("interactionRadius");
  forceStr = getSliderValue("forceStrength");
  arcSpeed = getSliderValue("arcGrowthSpeed");
  cellRad = getSliderValue("cellRadius");
  arcWiggle = getSliderValue("arcWiggle");
  movSpeed = getSliderValue("moveSpeed");
  natFrq = getSliderValue("naturalFrequency");
  kCoup = getSliderValue("kCoupling");
  phaseRandom = getSliderValue("phaseRandom");
  duty = getSliderValue("dutyCycle");
  currentNumAgents = getSliderValue("numAgents");
  currentCellRadius = getSliderValue("cellRadius");
  respawnSpeed = getSliderValue("respawnSpeed");
  gridSize = getSliderValue("interactionRadius");
  maxCon = getSliderValue("maxConnections");
  fade = getSliderValue("ghostFade");
  fade = (1 - pow(fade / 255, 0.15)) * 255;
}

function getSliderValue(name) {
  return parseFloat(sliders[name].value);
}

function setSliders(parts) { // number array
  if (parts.length === SERIAL_PARTS) {
    const reset_ = parts.pop();
    for (const [name, id] of sliderSerialBindings) {
      setSliderSerial(name, parts[id]);
    }
    if (reset_) initAgents();
  }
}

// val from 0 to 1023
function setSliderSerial(name, val) {
  const slider = sliders[name];
  val = map(val, 0, 1023, parseFloat(slider['min']), parseFloat(slider['max']));
  slider['value'] = val;
  sliderValueDisplays[name].textContent = slider['value'];
}

function sliderVisibility(val) {
  slidersVisible = val;
  for (let name in sliders) {
    const display = val ? "block" : "none";
    sliders[name].style.display = display;
    sliderLabels[name].style.display = display;
    sliderValueDisplays[name].style.display = display;
  }
}
