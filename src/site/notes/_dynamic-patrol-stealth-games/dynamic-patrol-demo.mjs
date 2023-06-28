export default (() => {
  const WALL = "#";
  const FLOOR = ".";

  return class DynamicPatrolDemo {
    constructor() {
      this.mapWidth = 10;
      this.mapHeight = 10;
      this.map = [
        [WALL, WALL, WALL, WALL, WALL, WALL, WALL, WALL, WALL, WALL],
        [WALL, WALL, WALL, WALL, WALL, WALL, WALL, WALL, WALL, WALL],
        [WALL, WALL, WALL, WALL, WALL, WALL, WALL, WALL, WALL, WALL],
        [WALL, WALL, WALL, WALL, WALL, WALL, WALL, WALL, WALL, WALL],
        [WALL, WALL, WALL, WALL, WALL, WALL, WALL, WALL, WALL, WALL],
        [WALL, WALL, WALL, WALL, WALL, WALL, WALL, WALL, WALL, WALL],
        [WALL, WALL, WALL, WALL, WALL, WALL, WALL, WALL, WALL, WALL],
        [WALL, WALL, WALL, WALL, WALL, WALL, WALL, WALL, WALL, WALL],
        [WALL, WALL, WALL, WALL, WALL, WALL, WALL, WALL, WALL, WALL],
        [WALL, WALL, WALL, WALL, WALL, WALL, WALL, WALL, WALL, WALL]
      ];
      this.guards = [];
      this.targets = [];
      console.log(this);
    }

    addGuard(x, y, heading) {
      this.guards.push({
        x, y, heading,
        path: []
      });
    }

    addTarget(x, y) {
      this.targets.push({x, y});
    }
  }
})();
