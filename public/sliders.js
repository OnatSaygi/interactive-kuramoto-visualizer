let intRad = 500;
let forceStr = 0.001;
let arcSpeed = 0.1;
let cellRad = 10;
let arcWiggle = 15;
let movSpeed = 0.1;
let natFrq = 0.2;
let kCoup = 0.5;
let phaseRandom = 0.04;
let duty = 0.07;
let currentNumAgents = 200;
let currentCellRadius = 10;
let respawnSpeed = 0.05;
let gridSize = 10;
let maxCon = 5;
let fade = 127;

function setSliders(parts) { // number array
  if (parts.length === SERIAL_PARTS) {
    const reset_ = parts.pop();
    for (const [name, id] of sliderSerialBindings) {
      setSliderSerial(name, parts[id]);
    }
    if (reset_) initAgents();
  }
}

function updateSliders() {
  intRad = getSliderValue('interactionRadius');
  forceStr = getSliderValue('forceStrength')
  arcSpeed = getSliderValue('arcGrowthSpeed');
  cellRad = getSliderValue('cellRadius');
  arcWiggle = getSliderValue('arcWiggle');
  movSpeed = getSliderValue('moveSpeed');
  natFrq = getSliderValue('naturalFrequency');
  kCoup = getSliderValue('kCoupling');
  phaseRandom = getSliderValue('phaseRandom')
  duty = getSliderValue('dutyCycle');
  currentNumAgents = getSliderValue('numAgents');
  currentCellRadius = getSliderValue('cellRadius');
  respawnSpeed = getSliderValue('respawnSpeed');
  gridSize = getSliderValue('interactionRadius');
  maxCon = getSliderValue('maxConnections');
  fade = getSliderValue('ghostFade');
  fade = (1-pow(fade / 255, 0.15)) * 255;
}

function createSliders() {
  let y = 40;
  for (const [name, minV, maxV, def, step, pin] of sliderData) {
    if (pin !== null) { // Use strict inequality
      sliderSerialBindings.push([name, pin]);
    }
    if (name == '') {
      y += 15;
      continue;
    }
    let label = createDiv(name);
    label.style('color', 'white');
    label.style('opacity', '0.8');
    label.position(10, y);
    sliderLabels[name] = label;

    let slider = createSlider(minV, maxV, def, step);
    slider.position(125, y);
    slider.style('width', '100px');
    slider.style('opacity', '0.2');
    sliders[name] = slider;

    let valueDisplay = createDiv(def);
    valueDisplay.style('color', 'white');
    valueDisplay.style('opacity', '0.8');
    valueDisplay.position(230, y);
    sliderValueDisplays[name] = valueDisplay;

    slider.input(() => {
      sliderValueDisplays[name].html(slider.value());
    });

    y += 20;

    if (INSTALLATION_MODE) {
      sliders[name].hide();
      sliderLabels[name].hide();
      sliderValueDisplays[name].hide();
    }
  }
  updateSliders();
  slidersVisible = !INSTALLATION_MODE;
  sliderVisibility(slidersVisible);
}

function getSliderValue(name) {
  return sliders[name].value();
}

// val from 0 to 1023
function setSliderSerial(name, val) {
  const slider = sliders[name];
  val = map(val, 0, 1023, parseFloat(slider.elt.min), parseFloat(slider.elt.max));
  slider.value(val);
  sliderValueDisplays[name].html(slider.value());
}

function sliderVisibility(val) {
  slidersVisible = val;
  for (const name in sliders) {
    if (slidersVisible) {
      sliders[name].show();
      sliderLabels[name].show();
      sliderValueDisplays[name].show();
    } else {
      sliders[name].hide();
      sliderLabels[name].hide();
      sliderValueDisplays[name].hide();
    }
  }
}
