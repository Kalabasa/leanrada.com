const DynamicPatrolDemo = (() => {
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
      console.log(this);
    }
  }
})();
