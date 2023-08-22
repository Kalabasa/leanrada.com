
  import * as PIXI from "/lib/vendor/pixijs.min.mjs";
  import { waitFor } from "/lib/wait_for.mjs";
  import { BaseElement } from "/lib/base_element.mjs";
  import { mousePosition } from "/lib/mouse_position.mjs";
  // Warn: Module path is relative to the page, not the component
  import {
    DynamicPatrolDemo,
    TILE_FLOOR,
    TILE_WALL,
    KNOW_NONE,
    KNOW_TARGET,
  } from "/notes/dynamic-patrol-stealth-games/demo/dynamic-patrol-demo.mjs";

  const spriteKey = Symbol("sprite");
  const textKey = Symbol("text");

  PIXI.BaseTexture.defaultOptions.scaleMode = PIXI.SCALE_MODES.NEAREST;
  // Warn: File paths are relative to the page, not the component
  const floorTexture = PIXI.Texture.from("./demo/floor.png");
  const wallTexture = PIXI.Texture.from("./demo/wall.png");
  const guardTexture = PIXI.Texture.from("./demo/guard.png");
  const targetTexture = PIXI.Texture.from("./demo/target.png");
  const destTexture = PIXI.Texture.from("./demo/dest.png");
  const trailTexture = PIXI.Texture.from("./demo/trail.png");

  customElements.define(
    "dynamic-patrol-demo-client",
    class DynamicPatrolDemoClient extends BaseElement {
      constructor() {
        super();
        this.inputMap = null;

        this.pixi = null;
        this.tileSprites = null;
        this.targetDestSprite = null;
        this.targetTrailSprites = [];
        this.tileSize = 1;
        this.showPotentials = true;
        this.showNumberType = null;

        this.model = null;
        this.modelTickId = null;

        this.hasInit = false;
        this.isVisible = false;
      }

      connectedCallback() {
        super.connectedCallback();

        this.aliveListener(this, "keypress", (event) => {
          if (event.key === "p") {
            this.showPotentials = !this.showPotentials;
          } else if (event.key === "n") {
            this.showNumberType = (this.showNumberType + 1) % 3;
          }
        });

        this.visibilityListener({
          show: () => {
            this.isVisible = true;
            if (!this.hasInit) this.init();
            this.pixi.start();
            this.modelTickId = setInterval(this.update, 50);
          },
          hide: () => {
            clearInterval(this.modelTickId);
            this.pixi.stop();
            this.isVisible = false;
          },
        });
      }

      disconnectedCallback() {
        super.disconnectedCallback();

        if (this.pixi) this.pixi.destroy();
        this.replaceChildren();

        this.pixi = null;
        this.tileSprites = null;
        this.targetDestSprite = null;
        this.targetTrailSprites = [];
        this.model = null;
        this.hasInit = false;
      }

      init() {
        this.hasInit = true;

        if (!this.inputMap) {
          this.inputMap = this.getAttribute("map")
            .trim()
            .split("\n")
            .map((line) => line.trim().split(""));
        }

        const mapWidth = this.inputMap[0].length;
        const mapHeight = this.inputMap.length;

        this.pixi = new PIXI.Application({
          resizeTo: this,
          background: "#cdd",
        });
        this.pixi.ticker.maxFPS = 60;
        this.pixi.ticker.add(this.render);
        this.pixi.view.addEventListener("mousemove", this.onHover);
        this.pixi.view.addEventListener("pointerup", this.onClick);
        this.appendChild(this.pixi.view);

        // Compute optimal tileSize
        const tileSizeMultiples = 2;
        this.tileSize =
          Math.floor(
            (Math.min(this.pixi.screen.width, this.pixi.screen.height) - 12) /
              Math.max(mapWidth, mapHeight) /
              tileSizeMultiples
          ) * tileSizeMultiples;

        // Center map in screen
        this.pixi.stage.x = Math.floor(
          this.pixi.screen.width / 2 - (mapWidth / 2) * this.tileSize
        );
        this.pixi.stage.y = Math.floor(
          this.pixi.screen.height / 2 - (mapHeight / 2) * this.tileSize
        );

        // Layers
        const tileContainer = new PIXI.Container();
        const entityContainer = new PIXI.Container();
        this.pixi.stage.addChild(tileContainer);
        this.pixi.stage.addChild(entityContainer);

        // Process input map
        const mapTiles = [];
        this.tileSprites = [];
        const guardPositions = [];
        const targetPositions = [];
        for (let x = 0; x < mapWidth; x++) {
          this.tileSprites[x] = [];
          mapTiles[x] = [];
          for (let y = 0; y < mapHeight; y++) {
            const inputTile = this.inputMap[y][x];

            if (inputTile === "G") {
              guardPositions.push({ x, y });
            } else if (inputTile === "T") {
              targetPositions.push({ x, y });
            }

            const tileType = inputTile === TILE_WALL ? TILE_WALL : TILE_FLOOR;
            mapTiles[x][y] = tileType;

            const tileSprite = new PIXI.Sprite(
              tileType === TILE_FLOOR ? floorTexture : wallTexture
            );
            tileSprite.x = x * this.tileSize;
            tileSprite.y = y * this.tileSize;
            tileSprite.width = this.tileSize;
            tileSprite.height = this.tileSize;
            tileContainer.addChild(tileSprite);
            this.tileSprites[x][y] = tileSprite;

            const tileText = new PIXI.Text("", {
              fontFamily: "Space Mono, monspace",
              fontSize: 15,
              fill: 0x000000,
            });
            tileText.x = (x + 1) * this.tileSize;
            tileText.y = y * this.tileSize;
            tileText.anchor.x = 1;
            tileContainer.addChild(tileText);
            tileSprite[textKey] = tileText;
          }
        }

        this.model = new DynamicPatrolDemo(mapWidth, mapHeight, mapTiles);

        for (const { x, y } of guardPositions) {
          const guard = this.createGuard(x, y);
          entityContainer.addChild(guard[spriteKey]);
        }

        for (const { x, y } of targetPositions) {
          const target = this.createTarget(x, y);
          entityContainer.addChild(target[spriteKey]);
        }

        if (targetPositions.length === 0) {
          this.model.idleMode();
          this.style.pointerEvents = "none";
        }
      }

      createGuard(x, y) {
        const guard = this.model.addGuard(x, y);
        const sprite = (guard[spriteKey] = new PIXI.Sprite(guardTexture));
        sprite.width = this.tileSize;
        sprite.height = this.tileSize;
        this.renderGuard(guard, false);
        return guard;
      }

      createTarget(x, y) {
        const target = this.model.addTarget(x, y);
        const sprite = (target[spriteKey] = new PIXI.Sprite(targetTexture));
        sprite.width = this.tileSize;
        sprite.height = this.tileSize;
        this.renderTarget(target, false);
        return target;
      }

      onHover = (event) => {
        const { x: mouseX, y: mouseY } = getMousePos(this);
        const { x: tileX, y: tileY } = this.tilePosFromPixel(mouseX, mouseY);
        if (
          tileX < 0 ||
          tileY < 0 ||
          tileX >= this.model.mapWidth ||
          tileY >= this.model.mapHeight
        ) {
          this.style.cursor = "default";
          return;
        }

        const isWalkable = this.model.getTile(tileX, tileY) === TILE_FLOOR;
        this.style.cursor = isWalkable ? "crosshair" : "default";
      };

      onClick = (event) => {
        const { x: mouseX, y: mouseY } = getMousePos(this);
        const { x: tileX, y: tileY } = this.tilePosFromPixel(mouseX, mouseY);
        if (
          tileX < 0 ||
          tileY < 0 ||
          tileX >= this.model.mapWidth ||
          tileY >= this.model.mapHeight
        ) {
          return;
        }

        this.model.commandTargetTo(0, tileX, tileY);
      };

      tilePosFromPixel(pixelX, pixelY) {
        const x = Math.floor((pixelX - this.pixi.stage.x) / this.tileSize);
        const y = Math.floor((pixelY - this.pixi.stage.y) / this.tileSize);
        return { x, y };
      }

      render = () => {
        for (const guard of this.model.guards) {
          this.renderGuard(guard);
        }

        for (const target of this.model.targets) {
          this.renderTarget(target);
        }

        for (let x = 0; x < this.model.mapWidth; x++) {
          for (let y = 0; y < this.model.mapHeight; y++) {
            if (this.model.getTile(x, y) !== TILE_FLOOR) continue;

            const tileSprite = this.tileSprites[x][y];

            let potential;
            const know = this.model.getKnowledge(x, y);
            if (know === KNOW_NONE) {
              potential = this.model.getPotential(x, y, 0);

              const tint =
                this.showPotentials && potential > 0
                  ? Math.min(1, 0.05 + 4 * potential ** 0.5)
                  : 0;
              const red = Math.max(0, 0xaa - Math.round(tint * 0x88));
              const green = Math.max(0, 0xaa - Math.round(tint * 0x44));
              const blue = Math.min(0xff, 0xaa + Math.round(tint * 0x55));

              blendTint(tileSprite, (red << 16) | (green << 8) | blue, 0.6);
            } else if (know === KNOW_TARGET) {
              blendTint(tileSprite, 0xff00ff, 0.6);
            } else {
              blendTint(tileSprite, 0xffffff, 0.6);
            }

            const tileText = tileSprite[textKey];
            tileText.visible = this.showNumberType > 0;
            if (this.showNumberType) {
              if (potential === undefined) {
                potential = this.model.getPotential(x, y, 0);
              }

              // log scale
              if (this.showNumberType == 2) {
                potential = Math.log2(1 + potential);
              }

              tileText.text = Math.ceil(potential * 100).toFixed(0);
              tileText.updateText();
            }
          }
        }
      };

      renderGuard(guard, smooth = true) {
        const smoothFactor = smooth ? 0.7 : 1;

        const sprite = guard[spriteKey];
        sprite.x += (guard.x * this.tileSize - sprite.x) * smoothFactor;
        sprite.y += (guard.y * this.tileSize - sprite.y) * smoothFactor;
      }

      renderTarget(target, smooth = true) {
        const smoothFactor = smooth ? 0.8 : 1;

        const sprite = target[spriteKey];
        if (!sprite) return;

        sprite.x += (target.x * this.tileSize - sprite.x) * smoothFactor;
        sprite.y += (target.y * this.tileSize - sprite.y) * smoothFactor;

        const isHidden =
          this.model.getKnowledge(target.x, target.y) === KNOW_NONE;
        blendTint(sprite, isHidden ? 0xaaaaaa : 0xffffff, 0.6);

        if (target.path.length) {
          if (!this.targetDestSprite) {
            this.targetDestSprite = new PIXI.Sprite(destTexture);
            this.targetDestSprite.tint = 0x66cc44;
            this.targetDestSprite.width = this.tileSize;
            this.targetDestSprite.height = this.tileSize;
            this.pixi.stage.addChild(this.targetDestSprite);
          }

          const [destX, destY] = target.path[target.path.length - 1];
          this.targetDestSprite.x = destX * this.tileSize;
          this.targetDestSprite.y = destY * this.tileSize;
          this.targetDestSprite.visible =
            Math.floor(this.pixi.ticker.lastTime / 400) % 3 > 0;
        } else {
          if (this.targetDestSprite) this.targetDestSprite.visible = false;
        }
      }

      update = () => {
        this.model.update();
      };
    }
  );

  function blendTint(sprite, tint, factor) {
    const r0 = (sprite.tint >> 16) & 0xff;
    const g0 = (sprite.tint >> 8) & 0xff;
    const b0 = sprite.tint & 0xff;

    const r1 = (tint >> 16) & 0xff;
    const g1 = (tint >> 8) & 0xff;
    const b1 = tint & 0xff;

    const r = Math.round(r0 + (r1 - r0) * factor);
    const g = Math.round(g0 + (g1 - g0) * factor);
    const b = Math.round(b0 + (b1 - b0) * factor);

    sprite.tint = (r << 16) | (g << 8) | b;
  }

  function getMousePos(element) {
    const { x, y } = mousePosition;
    const bounds = element.getBoundingClientRect();
    return {
      x: x - bounds.x,
      y: y - bounds.y,
    };
  }
