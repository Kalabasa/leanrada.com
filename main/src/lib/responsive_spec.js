/**
 * @param {Rule} rule
 */
function toMediaQuery(rule, omitLow) {
  let low = undefined;
  if (!omitLow && rule.low > 0) {
    const lowClause = rule.lowInclusive ? "(min-width:" : "not (max-width:";
    const lowValue = rule.low + "px)";
    low = lowClause + lowValue;
  }

  let high = undefined;
  if (rule.high < Infinity) {
    const highClause = rule.highInclusive ? "(max-width:" : "not (min-width:";
    const highValue = rule.high + "px)";
    high = highClause + highValue;
  }

  const query = [low, high].filter((v) => v).join(" and ");
  return query ? (low && high ? `(${query})` : query) : "";
}

/**
 * @param {string} spec format: "size (breakpoint) size (breakpoint) ..."
 * @param {number} stepSize Intermediate step size for relative sizes
 * @param {number} maxSize Maximum width
 * @typedef {{ low: number, lowInclusive: boolean, high: number, highInclusive: boolean, size: { value: number, relative: boolean } }} Rule
 * @returns {Array<Rule>} an object representing each given size, with surrounding breakpoints
 */
function getResponsiveRules(spec, stepSize, maxSize) {
  const rules = parseSpec(spec);
  pruneMax(rules, maxSize);
  evaluateRelativeSizes(rules, stepSize, maxSize);
  mergeRules(rules);
  return rules;
}

/**
 * @param {string} spec format: "size (breakpoint) size (breakpoint) ..."
 * @returns {Array<Rule>} an object representing each given size, with surrounding breakpoints
 */
function parseSpec(spec) {
  const rules = [];

  let lowInclusive = true;
  let lowValue = 0;
  let lastSize = null;

  const tokens = spec.split(/\s+/g);
  for (const token of tokens) {
    const isBreakpoint = token[0] === "(" || token[0] === "[";
    if (isBreakpoint) {
      const leftInclusive = token[0] === "[";
      const rightInclusive = token[token.length - 1] === "]";
      const value = Number.parseFloat(token.substring(1, token.length - 1));

      if (lastSize != null) {
        rules.push({
          low: lowValue,
          lowInclusive,
          high: value,
          highInclusive: rightInclusive,
          size: lastSize,
        });
        lastSize = null;
      }

      lowInclusive = leftInclusive;
      lowValue = value;
    } else {
      const isPercentage = token.endsWith("%");
      const value = Number.parseFloat(token);
      lastSize = {
        value: isPercentage ? value / 100 : value,
        relative: isPercentage,
      };
    }
  }

  if (lastSize != null) {
    rules.push({
      low: lowValue,
      lowInclusive,
      high: Infinity,
      highInclusive: false,
      size: lastSize,
    });
  }

  return rules;
}

/**
 * Prune rules that exceed maxSize
 * @param {Rule[]} rules
 */
function pruneMax(rules, maxSize) {
  while (rules.length > 0) {
    const rule = rules[rules.length - 1];

    if (rule.low < maxSize || (rule.lowInclusive && rule.low <= maxSize)) {
      rule.high = Infinity;
      rule.highInclusive = false;
      break;
    }

    rules.pop();
  }
}

/**
 * Give relative sizes exact values based on screen size
 * @param {Rule[]} rules
 */
function evaluateRelativeSizes(rules, stepSize, maxSize) {

  for (let i = rules.length - 1; i >= 0; i--) {
    const rule = rules[i];

    if (!rule.size.relative) continue;

    // subdivide rule if it can fit more intermediate steps based on stepSize
    const subrules = [rule];

    const high = Math.min(rule.high, maxSize / rule.size.value);
    const span = high - rule.low;
    const steps = Math.ceil(span / stepSize);
    for (let step = 0; step < steps - 1; step++) {
      const t = (step + 1) / steps;
      const breakpoint = Math.round(rule.low + t * (high - rule.low));
      const size = Math.round(rule.size.value * breakpoint);

      const [lowRule, hyRule] = splitRule(subrules[step], breakpoint, size);
      subrules[step] = lowRule;
      subrules[step + 1] = hyRule;
    }

    subrules[subrules.length - 1].size = {
      value: Math.round(rule.size.value * high),
      relative: false,
    };

    rules.splice(i, 1, ...subrules);
  }
}

/**
 * Merge adjacent rules with same size.
 *
 * @param {Rule[]} rules with no relative values
 */
function mergeRules(rules) {
  let lastRule = rules[rules.length - 1];
  for (let i = rules.length - 2; i >= 0; i--) {
    const rule = rules[i];
    if (
      rule.size.value === lastRule.size.value &&
      rule.high === lastRule.low &&
      (rule.highInclusive || lastRule.lowInclusive)
    ) {
      rules.splice(i + 1, 1);
      rule.high = lastRule.high;
      rule.highInclusive = lastRule.highInclusive;
    }
    lastRule = rule;
  }
}

/**
 * @param {Rule} rule
 * @returns {[Rule, Rule]}
 */
function splitRule(rule, breakpoint, exactLowSize) {
  return [
    {
      low: rule.low,
      lowInclusive: rule.lowInclusive,
      high: breakpoint,
      highInclusive: true,
      size: { value: exactLowSize, relative: false },
    },
    {
      low: breakpoint,
      lowInclusive: false,
      high: rule.high,
      highInclusive: rule.highInclusive,
      size: rule.size,
    },
  ];
}

module.exports = {
  toMediaQuery,
  getResponsiveRules,
};
