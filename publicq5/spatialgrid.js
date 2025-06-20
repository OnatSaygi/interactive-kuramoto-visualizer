// Spatial grid helpers
function getGridKey(x, y, cellSize) {
  return `${floor(x / cellSize)},${floor(y / cellSize)}`;
}

function buildSpatialGrid(agents, cellSize) {
  const grid = {};
  for (let agent of agents) {
    let key_ = getGridKey(agent.pos.x, agent.pos.y, cellSize);
    if (!grid[key_]) grid[key_] = [];
    grid[key_].push(agent);
  }
  return grid;
}

function getNeighbors(agent, grid, cellSize) {
  let neighbors = [];
  let col = floor(agent.pos.x / cellSize);
  let row = floor(agent.pos.y / cellSize);

  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      let key_ = `${col + dx},${row + dy}`;
      if (grid[key_]) {
        const cellAgents = grid[key_];
        for (let i = 0; i < cellAgents.length; i++) {
          neighbors.push(cellAgents[i]);
        }
      }
    }
  }
  return neighbors;
}
