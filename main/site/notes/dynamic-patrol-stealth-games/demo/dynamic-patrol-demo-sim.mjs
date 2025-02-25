import { Mrpas } from "/lib/vendor/mrpas.mod.js";
import "/lib/vendor/pathfinding-browser.min.js";

const TILE_WALL = "#";
const TILE_FLOOR = ".";

const KNOW_NONE = 0;
const KNOW_EMPTY = 1;
const KNOW_TARGET = 2;

const GUARD_WALK_INTERVAL = 4;
const TARGET_WALK_INTERVAL = 3;

class DynamicPatrolDemo {
  constructor(mapWidth, mapHeight, mapTiles) {
    this.time = 0;

    // Map properties
    this.mapWidth = mapWidth;
    this.mapHeight = mapHeight;
    this.map = Array.from({ length: mapWidth }, (_, x) => Array.from({ length: mapHeight }, (_, y) => mapTiles[x][y]));

    // Entities
    this.guards = [];
    this.targets = [];

    // Immediate guard knowledge
    this.knowledgeMap = Array.from({ length: mapWidth }, () => Array.from({ length: mapHeight }, () => KNOW_NONE));
    // Immediate guard knowledge (per target)
    this.knownTargetPositions = [];
    // Potential fields predicting target position (this is an array of 2D arrays, one 2D array map per target)
    // potentialMaps[targetIndex] = 2D array
    this.potentialMaps = [];
    // Potential field denominator (per target, indexed by targetIndex like above)
    this.totalPotentials = [];
    // Used for updating potentials
    this.tempDeltaMap = Array.from({ length: this.mapWidth }, () => Array.from({ length: this.mapHeight }, () => 0));

    const pathfinderGrid = new PF.Grid(Array.from({ length: mapHeight }, (_, y) => Array.from({ length: mapWidth }, (_, x) => this.map[x][y] === TILE_FLOOR ? 0 : 1)));
    this.getPathfinderGrid = () => pathfinderGrid.clone();
    this.guardPathfinder = new PF.BiAStarFinder({ allowDiagonal: true, dontCrossCorners: true });
    this.targetPathfinder = new PF.BiAStarFinder({ allowDiagonal: false });
    this.fov = new Mrpas(mapWidth, mapHeight, (x, y) => this.getTile(x, y) !== TILE_WALL);
  }

  addGuard(x, y) {
    const guard = {
      x, y,
      index: this.guards.length,
      heading: 0,
      pause: 0,
      path: []
    };
    this.guards.push(guard);
    return guard;
  }

  addTarget(x, y) {
    const target = {
      x, y,
      path: []
    };
    this.targets.push(target);
    this.potentialMaps.push(Array.from({ length: this.mapWidth }, () => Array.from({ length: this.mapHeight }, () => 0)));
    this.totalPotentials.push(0);
    this.knownTargetPositions.push(null);
    return target;
  }

  commandTargetTo(targetIndex, x, y) {
    if (this.getTile(x, y) !== TILE_FLOOR) return;
    const target = this.targets[targetIndex];
    target.path = this.targetPathfinder.findPath(target.x, target.y, x, y, this.getPathfinderGrid());
  }

  // No target, just patrol, must not call addTarget if idle mode
  idleMode() {
    this.addTarget(-1, -1);
    for (let x = 0; x < this.mapWidth; x++) {
      for (let y = 0; y < this.mapHeight; y++) {
        this.potentialMaps[0][x][y] = this.getTile(x, y) === TILE_FLOOR;
        this.totalPotentials[0]++;
      }
    }
  }

  update() {
    for (const target of this.targets) {
      this.updateTarget(target);
    }
    for (const guard of this.guards) {
      this.updateGuard(guard);
    }
    this.updateKnowledge();
    for (let i = 0; i < this.potentialMaps.length; i++) {
      this.updatePotentialMap(i);
    }
    this.time++;
  }

  updateTarget(target) {
    const isWalkTime = this.time % TARGET_WALK_INTERVAL === 0;

    while (target.path.length && target.path[0][0] === target.x && target.path[0][1] === target.y) {
      target.path.splice(0, 1);
    }

    if (isWalkTime && target.path.length) {
      const [nextX, nextY] = target.path[0];
      if (Math.abs(target.x - nextX) + Math.abs(target.y - nextY) <= 1) {
        if (this.getTile(nextX, nextY) !== TILE_FLOOR) {
          // Impassable path
          target.path.length = 0;
          return;
        }

        target.x = nextX;
        target.y = nextY;
      }
    }
  }

  updateGuard(guard) {
    const isWalkTime = this.time % GUARD_WALK_INTERVAL === 0;

    if (guard.pause > 0) {
      guard.pause--;
      return;
    }

    // Look at target if found
    const targetPos = this.knownTargetPositions.find(p => p);
    if (targetPos) {
      const targetHeading = Math.atan2(targetPos.x - guard.x, guard.y - targetPos.y);
      const deltaAngle = angleDelta(guard.heading, targetHeading);
      guard.heading += deltaAngle * 0.2;
      guard.path.length = 0;
      return;
    }

    while (guard.path.length && guard.path[0][0] === guard.x && guard.path[0][1] === guard.y) {
      guard.path.splice(0, 1);
    }

    if (guard.path.length) {
      // End movement if nothing is found
      const [destX, destY] = guard.path[guard.path.length - 1];
      if (this.getKnowledge(destX, destY) === KNOW_EMPTY) {
        guard.path.length = 0;
        return;
      }

      // Movement
      const [nextX, nextY] = guard.path[0];
      if (isWalkTime) {
        const nextAngle = Math.atan2(nextX - guard.x, guard.y - nextY);
        const deltaAngle = angleDelta(guard.heading, nextAngle);

        if (Math.abs(deltaAngle) < Math.PI * 0.3
          && Math.abs(guard.x - nextX) <= 1
          && Math.abs(guard.y - nextY) <= 1) {
          if (this.getTile(nextX, nextY) !== TILE_FLOOR) {
            // Impassable path
            guard.path.length = 0;
            return;
          }

          guard.x = nextX;
          guard.y = nextY;
        }
      }

      // Look towards path
      const [futureX, futureY] = guard.path[Math.min(2, guard.path.length - 1)];
      const lookaheadX = (futureX * 0.2 + nextX * 0.8);
      const lookaheadY = (futureY * 0.2 + nextY * 0.8);
      const targetHeading = Math.atan2(lookaheadX - guard.x, guard.y - lookaheadY);
      const deltaAngle = angleDelta(guard.heading, targetHeading);
      guard.heading += Math.sign(deltaAngle) * Math.min(0.15, Math.abs(deltaAngle) * 0.5);
    } else {
      // Find new destination
      let highScore = 0;
      let destX = guard.x;
      let destY = guard.y;
      for (let i = 0; i < this.targets.length; i++) {
        if (this.totalPotentials[i] === 0) continue;
        for (let x = 0; x < this.mapWidth; x++) {
          for (let y = 0; y < this.mapHeight; y++) {

            const potential = this.getPotential(x, y, i);
            const dist = Math.hypot(x - guard.x, y - guard.y);

            const score = (200 * potential) / (10 + 40 * guard.index + dist);
            if (score > highScore) {
              highScore = score;
              destX = x;
              destY = y;
            }
          }
        }
      }

      if (highScore > 0) {
        guard.path = this.guardPathfinder.findPath(guard.x, guard.y, destX, destY, this.getPathfinderGrid());

        // Pause before turning around for human effect
        if (guard.path.length) {
          const [nextX, nextY] = guard.path[Math.min(2, guard.path.length - 1)];
          const nextHeading = Math.atan2(nextX - guard.x, guard.y - nextY);
          const deltaAngle = angleDelta(guard.heading, nextHeading);
          guard.pause = Math.min(15, Math.ceil((deltaAngle / Math.PI) / (1 + highScore)));
        }
      }
    }
  }

  updateKnowledge() {
    // Reset knowledge
    for (let x = 0; x < this.mapWidth; x++) {
      for (let y = 0; y < this.mapHeight; y++) {
        this.knowledgeMap[x][y] = KNOW_NONE;
      }
    }
    for (let i = 0; i < this.targets.length; i++) {
      this.knownTargetPositions[i] = null;
    }

    // Process visibility
    for (let i = 0; i < this.guards.length; i++) {
      const guard = this.guards[i];
      this.fov.compute(
        guard.x,
        guard.y,
        /* radius */ 8,
        guard.heading,
        Math.PI * 0.6,
        (x, y) => this.knowledgeMap[x][y] !== KNOW_NONE,
        (x, y) => {
          this.knowledgeMap[x][y] = KNOW_EMPTY;

          for (let i = 0; i < this.targets.length; i++) {
            const target = this.targets[i];
            if (target.x === x && target.y === y) {
              this.knownTargetPositions[i] = { x, y };
              this.knowledgeMap[x][y] = KNOW_TARGET;
            }
          }
        });
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
          potentialMap[x][y] = 0;
        }
      }
      potentialMap[targetX][targetY] = 1;
      this.totalPotentials[targetIndex] = 1;
      return;
    }

    const isWalkTime = this.time % TARGET_WALK_INTERVAL === 0;

    // Init delta map for calculations
    const delta = this.tempDeltaMap;
    if (isWalkTime) {
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
          if (tile === TILE_FLOOR && potentialMap[x][y] > 0) {
            // Determine possible tiles target could have gone from here
            const mayGoUp = tileUp === TILE_FLOOR && knowUp === KNOW_NONE;
            const mayGoDown = tileDown === TILE_FLOOR && knowDown === KNOW_NONE;
            const mayGoLeft = tileLeft === TILE_FLOOR && knowLeft === KNOW_NONE;
            const mayGoRight = tileRight === TILE_FLOOR && knowRight === KNOW_NONE;

            // Potential is evenly distributed to all possible tiles
            if (mayGoUp) delta[x][y - 1] += 1;
            if (mayGoDown) delta[x][y + 1] += 1;
            if (mayGoLeft) delta[x - 1][y] += 1;
            if (mayGoRight) delta[x + 1][y] += 1;

            this.totalPotentials[targetIndex] += (mayGoUp ? 1 : 0) +
              (mayGoDown ? 1 : 0) +
              (mayGoLeft ? 1 : 0) +
              (mayGoRight ? 1 : 0);
          }
        }
      }

      // Apply deltas
      for (let x = 0; x < this.mapWidth; x++) {
        for (let y = 0; y < this.mapHeight; y++) {
          if (isWalkTime) {
            potentialMap[x][y] += delta[x][y];
          }

          // Clear out a position if they know its actually empty
          if (this.knowledgeMap[x][y] === KNOW_EMPTY) {
            this.totalPotentials[targetIndex] -= potentialMap[x][y];
            potentialMap[x][y] = 0;
          }
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

  getPotential(x, y, targetIndex) {
    if (x < 0 || y < 0 || x >= this.mapWidth || y >= this.mapHeight) return 0;
    const total = this.totalPotentials[targetIndex];
    return total > 0 ? this.potentialMaps[targetIndex][x][y] / total : 0;
  }
}

function angleDelta(a, b) {
  let delta = b - a;
  while (delta < -Math.PI) delta += Math.PI * 2;
  while (delta > Math.PI) delta -= Math.PI * 2;
  return delta;
}

export {
  DynamicPatrolDemo,
  TILE_FLOOR,
  TILE_WALL,
  KNOW_NONE,
  KNOW_EMPTY,
  KNOW_TARGET
};
