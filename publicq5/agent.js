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
  let spatialGrid = buildSpatialGrid(agents, gridSize);

  for (let a of agents) {
    const potentialNeighbors = getNeighbors(a, spatialGrid, gridSize);
    a.applyForces(potentialNeighbors);
    const conLength = a.connections.length;
    const conTarget = a.connectionCount();
    const delta = conTarget - conLength;
    if (delta > 0) {
      let neighborsWithDistances = potentialNeighbors
        .filter((b) => b !== a && distSq(a.pos, b.pos) < intRad * intRad) // Filter by interactionRadius
        .map((b) => ({
          agent: b,
          distSq: distSq(a.pos, b.pos), // from util.js
        }));
      // neighborsWithDistances.sort((p, q) => p.distSq - q.distSq);

      // for (let k = 0; k < Math.min(a.connectionCount(), neighborsWithDistances.length); k++) {
      //   const neighborInfo = neighborsWithDistances[k];
      //   a.connect(neighborInfo.agent); // Agent.connect()
      // }
      for (let k = 0; k < Math.min(a.connectionCount(), neighborsWithDistances.length); k++) {
        let minDistSq = Infinity;
        let closestIndex = -1;

        // Find the closest neighbor in the remaining list
        for (let j = 0; j < neighborsWithDistances.length; j++) {
          if (neighborsWithDistances[j].distSq < minDistSq) {
            minDistSq = neighborsWithDistances[j].distSq;
            closestIndex = j;
          }
        }

        // If a closest neighbor was found
        if (closestIndex !== -1) {
          const closestNeighborInfo = neighborsWithDistances[closestIndex];
          // Connect to the closest neighbor
          a.connect(closestNeighborInfo.agent);
          // Remove the connected neighbor from the list so it's not chosen again
          neighborsWithDistances.splice(closestIndex, 1);
        }
      }
    }
    if (delta < 0) {
      a.connections.pop(max(0, -delta));
    }
  }
}

function initAgents() {
  agents = [];
  for (let i = 0; i < currentNumAgents; i++) {
    agents.push(
      new Agent(random(width), random(height), currentCellRadius),
    );
  }
}

class Agent {
  constructor(x, y, r) {
    this.pos = createVector(x, y);
    this.vel = p5.Vector.random2D().mult(movSpeed);
    this.acc = createVector(0, 0);
    this.connections = [];
    this.growthProgress = new Map();
    this.phase = random(TAU);
    this.connectionOffset = random(1);
  }

  connectionCount() {
    return floor(1 + maxCon - this.connectionOffset);
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
    if (this.pos.x <= 0 || width <= this.pos.x) {
      this.vel.x *= -0.5;
      this.pos.x = constrain(this.pos.x, 0, width);
    }
    if (this.pos.y <= 0 || height <= this.pos.y) {
      this.vel.y *= -0.5;
      this.pos.y = constrain(this.pos.y, 0, height);
    }
  }

  display() {
    let isFlashing =  (this.phase / TAU) > duty;
    let foo = min(1, map(this.phase / TAU, 0, duty, 0, 1));
    let sca = 1.7 + pow(foo, 1.7) / 2;

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
      if (wiggle > 5) bezier(tp.x, tp.y, c1.x, c1.y, c2.x, c2.y, end.x, end.y);
      else line(tp.x, tp.y, end.x, end.y);
    }

    if (ELLIPSE_MODE) {
      fill(isFlashing ? lerpColor(brightAgentColor, brightAgentColor2, pow(foo, 0.7)) :dimAgentColor);
      noStroke();
      ellipse(this.pos.x, this.pos.y, this.r * sca, this.r * sca);
    } else {
      noFill();
      strokeWeight(1.5);
      stroke(dimAgentColor);
      push();
      translate(this.pos.x, this.pos.y);
      stroke(isFlashing ? lerpColor(brightAgentColor, brightAgentColor2, pow(foo, 0.7)) :dimAgentColor);
      rotate(this.vel.heading());
      line(-this.r * sca / 2, 0, this.r * sca / 2, 0);
      pop();
    }
  }

  connect(other) {
    if (!this.connections.includes(other)) {
      this.connections.push(other);
      this.growthProgress.set(other, 0);
    }
  }
}
