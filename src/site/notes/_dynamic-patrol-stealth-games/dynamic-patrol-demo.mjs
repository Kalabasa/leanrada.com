const TILE_WALL = "#";
const TILE_FLOOR = ".";

const KNOW_NONE = 0;
const KNOW_EMPTY = 1;

class DynamicPatrolDemo {
  constructor(mapWidth, mapHeight) {
    // Map properties
    this.mapWidth = mapWidth;
    this.mapHeight = mapHeight;
    this.map = Array.from({ length: mapWidth }, () => Array.from({ length: mapHeight }, () => TILE_FLOOR));

    // Entities
    this.guards = [];
    this.targets = [];

    // Immediate guard knowledge
    this.knowledgeMap = Array.from({ length: mapWidth }, () => Array.from({ length: mapHeight }, () => KNOW_NONE));
    // Immediate guard knowledge (per target)
    this.knownTargetPositions = [];
    // Potential field predicting target position in unknown (KNOW_NONE) tiles
    this.potentialMaps = [];
    // Used for updating potentials
    this.tempDeltaMap = Array.from({ length: this.mapWidth }, () => Array.from({ length: this.mapHeight }, () => 0));
  }

  addGuard(x, y) {
    const guard = {
      x, y,
      heading: 0,
      path: []
    };
    this.guards.push(guard);
    return guard;
  }

  addTarget(x, y) {
    const target = { x, y };
    this.targets.push(target);
    this.potentialMaps.push(Array.from({ length: this.mapWidth }, () => Array.from({ length: this.mapHeight }, () => 0)));
    this.knownTargetPositions.push(null);
    return target;
  }

  update() {
    // this.updateKnowledge();
    for (let i = 0; i < this.potentialMaps.length; i++) {
      this.updatePotentialMap(i);
    }
  }

  updatePotentialMap(targetIndex) {
    const potentialMap = this.potentialMaps[targetIndex];

    // If they already know where the target is now
    if (this.knownTargetPositions[targetIndex]) {
      const { x: targetX, y: targetY } = this.knownTargetPositions[targetIndex];
      // Override potentials absolutely
      for (let x = 0; x < this.mapWidth; x++) {
        for (let y = 0; y < this.mapHeight; y++) {
          potentialMap[x][y] = (x === targetX && y === targetY) ? 1 : 0;
        }
      }
      // No more calculation needed
      return;
    }

    // Init delta map for calculations
    const delta = this.tempDeltaMap;
    for (let x = 0; x < this.mapWidth; x++) {
      for (let y = 0; y < this.mapHeight; y++) {
        delta[x][y] = 0;
      }
    }

    // Calculate deltas
    for (let x = 0; x < this.mapWidth; x++) {
      let tile = null;
      let tileDown = null;
      let know = null;
      let knowDown = null;
      for (let y = 0; y < this.mapHeight; y++) {
        const tileUp = tile ?? this.getTile(x, y - 1);
        tile = tileDown ?? this.getTile(x, y);
        tileDown = this.getTile(x, y + 1);
        const tileLeft = this.getTile(x - 1, y);
        const tileRight = this.getTile(x + 1, y);

        const knowUp = know ?? this.getKnowledge(x, y - 1);
        know = knowDown ?? this.getKnowledge(x, y);
        knowDown = this.getKnowledge(x, y + 1);
        const knowLeft = this.getKnowledge(x - 1, y);
        const knowRight = this.getKnowledge(x + 1, y);

        // If target could be at current position
        if (tile === TILE_FLOOR && know === KNOW_NONE) {
          const currentPotential = potentialMap[x][y];

          // Determine possible tiles target could have gone from here
          const mayGoUp = tileUp === TILE_FLOOR && knowUp === KNOW_NONE;
          const mayGoDown = tileDown === TILE_FLOOR && knowDown === KNOW_NONE;
          const mayGoLeft = tileLeft === TILE_FLOOR && knowLeft === KNOW_NONE;
          const mayGoRight = tileRight === TILE_FLOOR && knowRight === KNOW_NONE;

          // Number of possible tiles to go from here
          const totalPaths = 1 + // includes staying
            (mayGoUp ? 1 : 0) +
            (mayGoDown ? 1 : 0) +
            (mayGoLeft ? 1 : 0) +
            (mayGoRight ? 1 : 0);

          // Potential is evenly distributed to all possible tiles
          // Now, this could be imprecise due to division & floating point
          // Errors would accumulate. I don’t care for now.
          const amountPerPath = currentPotential / totalPaths;
          delta[x][y] += amountPerPath;
          if (mayGoUp) delta[x][y - 1] += amountPerPath;
          if (mayGoDown) delta[x][y + 1] += amountPerPath;
          if (mayGoLeft) delta[x - 1][y] += amountPerPath;
          if (mayGoRight) delta[x + 1][y] += amountPerPath;
        }
      }
    }

    // Apply deltas
    for (let x = 0; x < this.mapWidth; x++) {
      for (let y = 0; y < this.mapHeight; y++) {
        if (this.knowledgeMap[x][y] === KNOW_EMPTY) {
          potentialMap[x][y] = 0;
        } else {
          potentialMap[x][y] += delta[x][y];
        }
      }
    }
  }

  getTile(x, y) {
    if (x < 0 || y < 0 || x >= this.mapWidth || y >= this.mapHeight) return TILE_WALL;
    return this.map[x][y];
  }

  getKnowledge(x, y) {
    if (x < 0 || y < 0 || x >= this.mapWidth || y >= this.mapHeight) return KNOW_EMPTY;
    return this.knowledgeMap[x][y];
  }
}

export { DynamicPatrolDemo, TILE_FLOOR, TILE_WALL };
