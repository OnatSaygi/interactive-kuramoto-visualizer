function adjustPopulation() {
  const diff = currentNumAgents - agents.length;
  if (diff > 0) {
    for (let i = 0; i < diff; i++) {
      agents.push(new Agent(random(width), random(height)),);
    }
  }
  else if (diff < 0) {
    agents.splice(diff);
  }
}

function respawnPopulation() {
  const respawnCount = (random(1) < respawnSpeed % 1) + floor(respawnSpeed);
  for (let i = 0; i < respawnCount; i++) {
    agents.splice(0, 1);
    agents.push(new Agent(random(width), random(height), currentCellRadius));
  }
}

function updateConnections() {
  let spatialGrid = buildSpatialGrid(agents, gridSize); // from spatialgrid.js
  // Build spatial grid and update agents
  // (gridSize, maxCon, intRad are updated by getSliders())
  for (let a of agents) {
    const potentialNeighbors = getNeighbors(a, spatialGrid, gridSize); // from spatialgrid.js
    a.applyForces(potentialNeighbors); // Agent.applyForces()
    // Reset connections if connection count is changed
    if (a.connections.length !== maxCon) {
      a.connections = [];
      const neighborsWithDistances = potentialNeighbors
        .filter((b) => b !== a && distSq(a.pos, b.pos) < intRad * intRad) // Filter by interactionRadius
        .map((b) => ({
          agent: b,
          distSq: distSq(a.pos, b.pos), // from util.js
        }));
      neighborsWithDistances.sort((p, q) => abs(p.distSq - q.distSq));

      for (let k = 0; k < Math.min(maxCon, neighborsWithDistances.length); k++) {
        const neighborInfo = neighborsWithDistances[k];
        a.connect(neighborInfo.agent); // Agent.connect()
      }
    }
  }
}

function initAgents() {
  agents = [];
  let num = int(getSliderValue("numAgents"));
  let cellRadiusValue = getSliderValue("cellRadius");
  for (let i = 0; i < num; i++) {
    agents.push(
      new Agent(random(width), random(height), cellRadiusValue),
    );
  }
}

class Agent {
  constructor(x, y, r) {
    this.pos = createVector(x, y);
    this.r = r;
    this.vel = p5.Vector.random2D().mult(movSpeed);
    this.acc = createVector(0, 0);
    this.connections = [];
    this.growthProgress = new Map();
    this.phase = random(TAU);
  }

  applyForces(others) {
    for (let other of others) {
      if (other !== this) {
        let dir = p5.Vector.sub(other.pos, this.pos);
        let d = dir.mag();
        if (d < intRad && d > 1) {
          let force = (d - intRad / 2) * forceStr;
          dir.normalize().mult(force);
          this.acc.add(dir);
        }
      }
    }
  }

  updateOscillator() {
    let sum = 0;
    for (let n of this.connections) {
      if (this.growthProgress.get(n) === 1)
        sum += sin(n.phase - this.phase);
    }

    this.phase += natFrq + kCoup * sum;
    if (this.phase > TAU) {
      this.phase -= TAU + random(-TAU, TAU) * phaseRandom;
      this.connections = [];
    }
  }

  update() {
    this.r = currentCellRadius;
    this.acc.mult(0.9);
    this.vel.add(this.acc);
    this.vel.limit(movSpeed);
    this.pos.add(this.vel);
    if (this.pos.x <= 0 || this.pos.x >= width) {
      this.vel.x *= -0.5;
      this.pos.x = constrain(this.pos.x, 0, width);
    }
    if (this.pos.y <= 0 || this.pos.y >= height) {
      this.vel.y *= -0.5;
      this.pos.y = constrain(this.pos.y, 0, height);
    }
  }

  display() {
    let isFlashing =  (this.phase / TAU) > duty;
    let foo = min(1, map(this.phase / TAU, 0, duty, 0, 1));
    let sca = 1.7 + pow(foo, 1.7) / 2;
    noStroke();
    fill(isFlashing ? lerpColor(brightAgentColor, brightAgentColor2, pow(foo, 0.7)) :dimAgentColor);
    ellipse(this.pos.x, this.pos.y, this.r * sca);

    stroke(connectionColor);
    strokeWeight(1.5);
    noFill();
    for (let other of this.connections) {
      let p = min((this.growthProgress.get(other) || 0) + arcSpeed, 1);
      this.growthProgress.set(other, p);
      let op = this.pos.copy().sub(other.pos).setMag(cellRad).add(other.pos);
      let tp = other.pos.copy().sub(this.pos).setMag(cellRad).add(this.pos);
      let end = p5.Vector.lerp(tp, op, p*p*p);
      let wiggle = arcWiggle * abs(other.phase - this.phase) / TAU;
      let c1 = p5.Vector.lerp(tp, end, 0.3).add(p5.Vector.random2D().mult(wiggle));
      let c2 = p5.Vector.lerp(tp, end, 0.7).add(p5.Vector.random2D().mult(wiggle));
      bezier(tp.x, tp.y, c1.x, c1.y, c2.x, c2.y, end.x, end.y);
    }
  }

  connect(other) {
    if (!this.connections.includes(other)) {
      this.connections.push(other);
      this.growthProgress.set(other, 0);
    }
  }
}
