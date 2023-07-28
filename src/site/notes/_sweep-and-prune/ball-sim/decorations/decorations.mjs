import { SweepAndPruneStrat } from '../collision-strats/sap-strat.mjs';
import { createSweepDecorations } from './sweep-decoration.mjs';
import { createEdgeDecorations } from './edge-decoration.mjs';

export function createDecorations(decorationsAttr, ballSim, renderer, pause) {
  const decorations = parseDecorations(decorationsAttr);
  return {
    callbacks: {
      ...createProcessFuncCallbacks(decorations, renderer, pause),
      ...createSweepAndPruneDecorations(decorations, ballSim, renderer, pause).callbacks,
    }
  };
}

function parseDecorations(decorationsAttr) {
  if (!decorationsAttr?.length) return {};

  const decorations = {};
  for (const item of decorationsAttr.split(",")) {
    const [name, ...params] = item.split(":");
    decorations[name] = params;
  }
  return decorations;
}

function createProcessFuncCallbacks(decorations, renderer, pause) {
  if (decorations.checks) {
    const [checkColor, delay = 200] = decorations.checks;

    const origColorKey = Symbol("color");

    let line = null;
    return {
      onCheck: async (a, b) => {
        a[origColorKey] = a.color;
        b[origColorKey] = b.color;

        a.color = checkColor;
        b.color = checkColor;
        line = renderer.addLine({
          x1: a.x,
          y1: a.y,
          x2: b.x,
          y2: b.y,
          color: checkColor,
        });

        await pause(delay * 0.25);
      },
      onIntersect: async () => {
        await pause(50);
      },
      onEndCheck: async (a, b) => {
        await pause(delay * 0.75);

        a.color = a[origColorKey];
        b.color = b[origColorKey];
        renderer.removeLine(line);
        line = null;
      },
    };
  } else {
    return {};
  }
}

function createSweepAndPruneDecorations(decorations, ballSim, renderer, pause) {
  const callbacks = {};

  if (decorations.edges) {
    const [mode, primaryColor, secondaryColor] = decorations.edges;
    mergeCallbacks(
      callbacks,
      createEdgeDecorations(
        ballSim,
        renderer,
        pause,
        mode === "array",
        mode === "focus",
        primaryColor,
        secondaryColor
      ).callbacks
    );
  }

  if (decorations.sweep) {
    const [sweepColor, insideColor] = decorations.sweep;
    mergeCallbacks(
      callbacks,
      createSweepDecorations(
        renderer,
        pause,
        sweepColor,
        insideColor
      ).callbacks
    );
  }

  return { callbacks };
}

function mergeCallbacks(callbacks, nextCallbacks) {
  for (const key of Object.keys(nextCallbacks)) {
    const original = callbacks[key];
    const next = nextCallbacks[key];
    if (original) {
      callbacks[key] = function (...args) {
        original(...args);
        next(...args);
      };
    } else {
      callbacks[key] = next;
    }
  }
}
