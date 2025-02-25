import { getColor } from "../renderer.mjs";

const ARRAY_ITEM_GAP = 40;

export function createEdgeDecorations(ballSim, renderer, pause, showEdgesArray, focusSingleOverlaps, primaryColor, secondaryColor) {
  const { width, height } = renderer;
  const edgeArrayLines = new Map();
  let focusBall = undefined;
  let callbacks = {};

  if (focusSingleOverlaps) {
    // If enabled, focus on largest ball.
    // Largest ball hides the edge case where the an overlapping ball is wider
    // and none of its edge points would lie within the focused ball.
    focusBall = ballSim.balls[0];
    for (const ball of ballSim.balls) {
      if (focusBall.radius < ball.radius) focusBall = ball;
    }
    focusBall.color = primaryColor;
  }

  if (!showEdgesArray) {
    for (const ball of ballSim.balls) {
      renderer.addLine({
        get x1() { return ball.x - ball.radius },
        get y1() { return ball.y },
        get x2() { return ball.x - ball.radius },
        get y2() { return height },
        get color() { return getLineColor(ball.x - ball.radius, ball) },
        dash: [2, 2],
      })
      renderer.addLine({
        get x1() { return ball.x + ball.radius },
        get y1() { return ball.y },
        get x2() { return ball.x + ball.radius },
        get y2() { return height },
        get color() { return getLineColor(ball.x + ball.radius, ball) },
        dash: [2, 2],
      });
    }
  }

  function getLineColor(x, ball) {
    if (focusBall) {
      if (ball === focusBall) return primaryColor;

      if (focusBall.x - focusBall.radius < x
        && x < focusBall.x + focusBall.radius) {
        return secondaryColor;
      }

      return getColor(null);
    } else {
      return getColor(ball);
    }
  }

  if (focusBall) {
    let insideFocusBall = false;
    callbacks = {
      onStartScan() {
        insideFocusBall = false;
      },
      onEnterEdge(edge) {
        if (edge.ball === focusBall) {
          insideFocusBall = true;
        } else {
          if (insideFocusBall) {
            edge.ball.color = secondaryColor;
          } else {
            edge.ball.color = null;
          }
        }
      },
      onExitEdge(edge) {
        if (edge.ball === focusBall) {
          insideFocusBall = false;
        } else {
          if (insideFocusBall) {
            edge.ball.color = secondaryColor;
          }
        }
      },
    };
  } else if (showEdgesArray) {
    let edgesCache;

    const inactiveColor = "#999";

    function getEdgeX(edge) {
      const index = edgesCache.indexOf(edge);
      return width / 2 + ARRAY_ITEM_GAP * (index - (edgesCache.length - 1) / 2);
    }

    function setEdgeColor(edge, color) {
      const lines = edgeArrayLines.get(edge);
      if (!lines) return;

      for (const line of lines) {
        line.color = color;
      }
    }

    callbacks = {
      onStartScan(edges) {
        edgesCache = edges;
        if (edgeArrayLines.size === 0) {
          for (const edge of edges) {
            const { ball } = edge;
            edgeArrayLines.set(
              edge,
              [
                renderer.addLine({
                  get x1() { return getEdgeX(edge) },
                  get y1() { return ARRAY_ITEM_GAP },
                  get x2() { return getEdgeX(edge) },
                  get y2() { return ARRAY_ITEM_GAP * 2 },
                  color: inactiveColor,
                }),
                renderer.addLine({
                  get x1() { return getEdgeX(edge) },
                  get y1() { return ARRAY_ITEM_GAP * 2 },
                  get x2() { return ball.x + ball.radius * edge.dir },
                  get y2() { return ARRAY_ITEM_GAP * 4 },
                  color: inactiveColor,
                }),
                renderer.addLine({
                  get x1() { return ball.x + ball.radius * edge.dir },
                  get y1() { return ARRAY_ITEM_GAP * 4 },
                  get x2() { return ball.x + ball.radius * edge.dir },
                  get y2() { return ball.y },
                  color: inactiveColor,
                }),
              ],
            );
          }
        }
      },
      async onCompare(a, b) {
        if (!edgesCache) return;
        setEdgeColor(a, secondaryColor);
        setEdgeColor(b, secondaryColor);
        await pause(50);
        setEdgeColor(a, inactiveColor);
        setEdgeColor(b, inactiveColor);
      },
      async onSwap(a, b) {
        setEdgeColor(a, primaryColor);
        setEdgeColor(b, primaryColor);
        await pause(100);
        setEdgeColor(a, inactiveColor);
        setEdgeColor(b, inactiveColor);
      },
    };
  }

  return { callbacks };
}
