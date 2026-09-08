/**
 * JASPER Advanced Symbolic & Numerical Algebra Solver Engine
 * Solves linear equations, quadratics, polynomial evaluations, powers, roots,
 * and general mathematical expressions with full step-by-step breakdown.
 */

function sanitizeMathString(expr) {
  if (!expr || typeof expr !== 'string') return '';
  let s = expr.trim();

  // Strip leading user phrases like "solve for x:", "solve:", "calculate:"
  s = s.replace(/^(please\s+)?(solve\s+for\s+[a-zA-Z]:?|solve\s*:?|find\s+[a-zA-Z]\s*:?|calculate:?)\s*/i, '');

  // Normalize multiplication & division symbols
  s = s.replace(/×/g, '*').replace(/÷/g, '/');

  // Handle square root symbols: √16, √(x + 4), √x
  s = s.replace(/√\s*(\([^\)]+\)|[0-9.]+|[a-zA-Z])/g, 'Math.sqrt($1)');

  // Protect known mathematical functions before implicit multiplication
  const funcs = ['sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'sqrt', 'log', 'ln', 'abs', 'exp'];
  funcs.forEach(fn => {
    const reg = new RegExp(`\\b${fn}\\(`, 'gi');
    if (fn === 'ln') {
      s = s.replace(reg, 'Math.log(');
    } else if (fn === 'log') {
      s = s.replace(reg, 'Math.log10(');
    } else {
      s = s.replace(reg, `Math.${fn}(`);
    }
  });

  // Replace mathematical constants
  s = s.replace(/\bpi\b/gi, 'Math.PI');
  s = s.replace(/\be\b/g, 'Math.E');

  // Insert implicit multiplication: 3x -> 3*x, 3(x+1) -> 3*(x+1), (x+1)(x-2) -> (x+1)*(x-2)
  s = s.replace(/(\d)\s*([a-zA-Z\(])/g, '$1*$2');
  s = s.replace(/(\))\s*([a-zA-Z\d\(])/g, '$1*$2');
  
  // Replace power ^ with **
  s = s.replace(/\^/g, '**');

  // Fix any accidentally mangled Math.* calls: e.g. Math*.sqrt -> Math.sqrt
  s = s.replace(/Math\s*\*\s*\./g, 'Math.');

  return s;
}

/**
 * Main algebraic solver entry point
 * @param {string} input - Algebraic equation or expression (e.g. "3x + 5 = 20", "x^2 - 5x + 6 = 0")
 * @returns {object} { success: boolean, result: string, steps: string[], formatted: string, type: string }
 */
export function solveAlgebra(input) {
  if (!input || !input.trim()) {
    return {
      success: false,
      result: 'No input provided',
      steps: ['Please enter an algebraic equation or mathematical expression.'],
      formatted: 'Error: Empty input.'
    };
  }

  let raw = input.trim();
  raw = raw.replace(/^(please\s+)?(solve\s+for\s+[a-zA-Z]:?|solve\s*:?|find\s+[a-zA-Z]\s*:?|calculate:?)\s*/i, '').trim();

  // 1. Check if input is an equation containing '='
  if (!raw.includes('=')) {
    return evaluateExpression(raw);
  }

  // Equation solver
  const sides = raw.split('=');
  if (sides.length !== 2) {
    return {
      success: false,
      result: 'Invalid equation syntax',
      steps: ['The equation must contain exactly one equal sign (=).'],
      formatted: 'Error: Equation must contain exactly one "=". Received: ' + raw
    };
  }

  const lhsRaw = sides[0].trim();
  const rhsRaw = sides[1].trim();

  // Find unknown variable name: usually x, y, z, t, etc.
  const varMatches = raw.match(/[a-zA-Z]/g) || [];
  // Filter out any matches from Math or function names
  const knownKeywords = ['Math', 'sin', 'cos', 'tan', 'sqrt', 'log', 'ln', 'abs', 'exp', 'PI', 'E'];
  const candidates = varMatches.filter(ch => !knownKeywords.some(kw => kw.includes(ch)));
  const variable = candidates.length > 0 ? candidates[0] : 'x';

  const lhsClean = sanitizeMathString(lhsRaw);
  const rhsClean = sanitizeMathString(rhsRaw);

  const evalLhs = (val) => {
    return Function(variable, `"use strict"; return (${lhsClean});`)(val);
  };
  const evalRhs = (val) => {
    return Function(variable, `"use strict"; return (${rhsClean});`)(val);
  };
  const evalDiff = (val) => {
    return evalLhs(val) - evalRhs(val);
  };

  try {
    const f0 = evalDiff(0);
    const f1 = evalDiff(1);
    const fn1 = evalDiff(-1);
    const f2 = evalDiff(2);

    if (isNaN(f0) || isNaN(f1) || isNaN(fn1)) {
      throw new Error('Non-finite evaluation');
    }

    // Determine quadratic/linear coefficients: f(x) = A*x^2 + B*x + C = 0
    const A = Math.round(((f1 + fn1 - 2 * f0) / 2) * 1e9) / 1e9;
    const B = Math.round(((f1 - fn1) / 2) * 1e9) / 1e9;
    const C = Math.round(f0 * 1e9) / 1e9;

    // Check if degree is <= 2
    const expectedF2 = Math.round((4 * A + 2 * B + C) * 1e9) / 1e9;
    const isPolyDegree2 = Math.abs(f2 - expectedF2) < 1e-4;

    if (!isPolyDegree2) {
      // Numerical root finder for higher order or non-linear equation
      return solveNumerically(raw, lhsRaw, rhsRaw, variable, evalDiff);
    }

    // A = 0 => Linear Equation: B*x + C = 0
    if (Math.abs(A) < 1e-8) {
      return solveLinear(raw, lhsRaw, rhsRaw, variable, B, C);
    } else {
      // A != 0 => Quadratic Equation: A*x^2 + B*x + C = 0
      return solveQuadratic(raw, lhsRaw, rhsRaw, variable, A, B, C);
    }
  } catch (err) {
    // If standard algebraic parsing fails, try numerical root approximation
    try {
      return solveNumerically(raw, lhsRaw, rhsRaw, variable, evalDiff);
    } catch (numErr) {
      return {
        success: false,
        result: 'Unable to solve equation',
        steps: [
          `Original: ${raw}`,
          `Parser Error: ${err.message}`,
          `Ensure the equation is well-formed in standard notation (e.g. 3x + 5 = 20 or x^2 - 4 = 0).`
        ],
        formatted: `[Algebra Solver Error]: Could not solve "${raw}".\nDetails: ${err.message}`
      };
    }
  }
}

/**
 * Solves linear equation: B*x + C = 0 => x = -C / B
 */
function solveLinear(raw, lhsRaw, rhsRaw, variable, B, C) {
  if (Math.abs(B) < 1e-8) {
    if (Math.abs(C) < 1e-8) {
      const msg = `Identity: Infinite solutions exist for ${variable}.`;
      return {
        success: true,
        type: 'identity',
        variable,
        result: `${variable} ∈ ℝ (All real numbers)`,
        steps: [
          `Original Equation: ${lhsRaw} = ${rhsRaw}`,
          `Simplified Difference: 0 = 0`,
          `Conclusion: The equation is an identity. Any real value of ${variable} satisfies the equation.`
        ],
        formatted: `⚡ Step-by-Step Algebraic Solution for: ${raw}\n\n1. Equation: ${lhsRaw} = ${rhsRaw}\n2. Simplification: 0 = 0\n3. Conclusion: Any real value of ${variable} satisfies the equation.\n\nFinal Answer: ${variable} ∈ ℝ (Infinite Solutions)`
      };
    } else {
      return {
        success: true,
        type: 'no_solution',
        variable,
        result: 'No solution',
        steps: [
          `Original Equation: ${lhsRaw} = ${rhsRaw}`,
          `Simplified Difference: ${C} = 0 (Contradiction)`,
          `Conclusion: No solution exists for this equation.`
        ],
        formatted: `⚡ Step-by-Step Algebraic Solution for: ${raw}\n\n1. Equation: ${lhsRaw} = ${rhsRaw}\n2. Simplified form: ${C} = 0 (Contradiction)\n\nFinal Answer: No solution exists.`
      };
    }
  }

  const solution = -C / B;
  const rounded = Math.round(solution * 1e8) / 1e8;

  // Pretty print steps
  const coeffStr = B === 1 ? '' : (B === -1 ? '-' : `${B}`);
  const constSign = C >= 0 ? `+ ${C}` : `- ${Math.abs(C)}`;
  const rightVal = -C;

  const steps = [
    `Original Equation: ${lhsRaw} = ${rhsRaw}`,
    `Step 1: Move all terms to the left-hand side to get standard form:`,
    `        (${lhsRaw}) - (${rhsRaw}) = 0`,
    `Step 2: Collect and combine like terms:`,
    `        ${coeffStr}${variable} ${constSign} = 0`,
    `Step 3: Isolate the variable term by moving constants to the right:`,
    `        ${coeffStr}${variable} = ${rightVal}`,
    `Step 4: Divide both sides by coefficient of ${variable} (${B}):`,
    `        ${variable} = ${rightVal} / ${B}`,
    `Step 5: Simplify:`,
    `        ${variable} = ${rounded}`
  ];

  const formatted = [
    `⚡ Step-by-Step Algebraic Solution for: ${raw}`,
    ``,
    `[Step 1] Formulate Equation:`,
    `  ${lhsRaw} = ${rhsRaw}`,
    ``,
    `[Step 2] Group Like Terms:`,
    `  ${coeffStr}${variable} = ${rightVal}`,
    ``,
    `[Step 3] Isolate Variable:`,
    `  ${variable} = ${rightVal} / ${B}`,
    ``,
    `[Final Result]`,
    `  ${variable} = ${rounded}`
  ].join('\n');

  return {
    success: true,
    type: 'linear',
    variable,
    result: `${variable} = ${rounded}`,
    solution: rounded,
    steps,
    formatted
  };
}

/**
 * Solves quadratic equation: A*x^2 + B*x + C = 0
 */
function solveQuadratic(raw, lhsRaw, rhsRaw, variable, A, B, C) {
  const discriminant = B * B - 4 * A * C;
  const discRounded = Math.round(discriminant * 1e8) / 1e8;

  const aStr = A === 1 ? '' : (A === -1 ? '-' : `${A}`);
  const bStr = B === 0 ? '' : (B > 0 ? `+ ${B === 1 ? '' : B}${variable}` : `- ${Math.abs(B) === 1 ? '' : Math.abs(B)}${variable}`);
  const cStr = C === 0 ? '' : (C > 0 ? `+ ${C}` : `- ${Math.abs(C)}`);

  const steps = [
    `Original Equation: ${lhsRaw} = ${rhsRaw}`,
    `Step 1: Rearrange into standard quadratic form: ax² + bx + c = 0`,
    `        ${aStr}${variable}² ${bStr} ${cStr} = 0`,
    `        Identified coefficients: a = ${A}, b = ${B}, c = ${C}`,
    `Step 2: Calculate the discriminant: Δ = b² - 4ac`,
    `        Δ = (${B})² - 4(${A})(${C}) = ${discRounded}`
  ];

  if (discriminant > 1e-9) {
    // Two distinct real roots
    const sqrtD = Math.sqrt(discriminant);
    const x1 = (-B + sqrtD) / (2 * A);
    const x2 = (-B - sqrtD) / (2 * A);
    const r1 = Math.round(x1 * 1e8) / 1e8;
    const r2 = Math.round(x2 * 1e8) / 1e8;

    steps.push(
      `Step 3: Since Δ > 0, there are two distinct real solutions.`,
      `        Apply quadratic formula: ${variable} = (-b ± √Δ) / (2a)`,
      `        ${variable}₁ = (-(${B}) + √${discRounded}) / (2 · ${A}) = ${r1}`,
      `        ${variable}₂ = (-(${B}) - √${discRounded}) / (2 · ${A}) = ${r2}`,
      `Final Answer: ${variable} = ${r1} or ${variable} = ${r2}`
    );

    const formatted = [
      `⚡ Step-by-Step Algebraic Solution for: ${raw}`,
      ``,
      `[Step 1] Standard Quadratic Form (ax² + bx + c = 0):`,
      `  ${aStr}${variable}² ${bStr} ${cStr} = 0`,
      `  a = ${A}, b = ${B}, c = ${C}`,
      ``,
      `[Step 2] Compute Discriminant:`,
      `  Δ = b² - 4ac = (${B})² - 4(${A})(${C}) = ${discRounded}`,
      ``,
      `[Step 3] Apply Quadratic Formula:`,
      `  ${variable} = (-b ± √Δ) / (2a)`,
      `  ${variable}₁ = (-(${B}) + √${discRounded}) / ${2 * A} = ${r1}`,
      `  ${variable}₂ = (-(${B}) - √${discRounded}) / ${2 * A} = ${r2}`,
      ``,
      `[Final Roots]`,
      `  ${variable} = ${r1}, ${r2}`
    ].join('\n');

    return {
      success: true,
      type: 'quadratic',
      variable,
      result: `${variable} = ${r1} or ${variable} = ${r2}`,
      solutions: [r1, r2],
      steps,
      formatted
    };
  } else if (Math.abs(discriminant) <= 1e-9) {
    // Repeated real root
    const x = -B / (2 * A);
    const r = Math.round(x * 1e8) / 1e8;

    steps.push(
      `Step 3: Since Δ = 0, there is one repeated real solution.`,
      `        ${variable} = -b / (2a)`,
      `        ${variable} = -(${B}) / (2 · ${A}) = ${r}`,
      `Final Answer: ${variable} = ${r}`
    );

    const formatted = [
      `⚡ Step-by-Step Algebraic Solution for: ${raw}`,
      ``,
      `[Step 1] Standard Quadratic Form:`,
      `  ${aStr}${variable}² ${bStr} ${cStr} = 0`,
      ``,
      `[Step 2] Discriminant is Zero (Δ = 0):`,
      `  One repeated real root exists.`,
      ``,
      `[Step 3] Calculate Root:`,
      `  ${variable} = -b / (2a) = -(${B}) / ${2 * A} = ${r}`,
      ``,
      `[Final Root]`,
      `  ${variable} = ${r}`
    ].join('\n');

    return {
      success: true,
      type: 'quadratic',
      variable,
      result: `${variable} = ${r}`,
      solutions: [r],
      steps,
      formatted
    };
  } else {
    // Complex roots
    const realPart = Math.round((-B / (2 * A)) * 1e8) / 1e8;
    const imagPart = Math.round((Math.sqrt(-discriminant) / (2 * Math.abs(A))) * 1e8) / 1e8;

    steps.push(
      `Step 3: Since Δ < 0, there are two complex conjugate solutions.`,
      `        ${variable} = (-b ± i√|Δ|) / (2a)`,
      `        ${variable}₁ = ${realPart} + ${imagPart}i`,
      `        ${variable}₂ = ${realPart} - ${imagPart}i`,
      `Final Answer: ${variable} = ${realPart} ± ${imagPart}i`
    );

    const formatted = [
      `⚡ Step-by-Step Algebraic Solution for: ${raw}`,
      ``,
      `[Step 1] Standard Quadratic Form:`,
      `  ${aStr}${variable}² ${bStr} ${cStr} = 0`,
      ``,
      `[Step 2] Negative Discriminant (Δ = ${discRounded} < 0):`,
      `  Roots are complex conjugates.`,
      ``,
      `[Step 3] Calculate Complex Roots:`,
      `  ${variable} = (-b ± i√|Δ|) / (2a)`,
      `  ${variable}₁ = ${realPart} + ${imagPart}i`,
      `  ${variable}₂ = ${realPart} - ${imagPart}i`,
      ``,
      `[Final Complex Roots]`,
      `  ${variable} = ${realPart} ± ${imagPart}i`
    ].join('\n');

    return {
      success: true,
      type: 'quadratic',
      variable,
      result: `${variable} = ${realPart} ± ${imagPart}i`,
      solutions: [`${realPart} + ${imagPart}i`, `${realPart} - ${imagPart}i`],
      steps,
      formatted
    };
  }
}

/**
 * Numerical Newton-Raphson approximation for non-linear equations
 */
function solveNumerically(raw, lhsRaw, rhsRaw, variable, evalDiff) {
  let x0 = 1.0;
  const maxIter = 100;
  const tol = 1e-7;
  let root = null;

  // Try multiple starting points
  const startingPoints = [0.0, 1.0, -1.0, 2.0, -2.0, 5.0, 10.0];
  for (const start of startingPoints) {
    let curr = start;
    let found = false;
    for (let i = 0; i < maxIter; i++) {
      const fx = evalDiff(curr);
      if (Math.abs(fx) < tol) {
        root = curr;
        found = true;
        break;
      }
      const h = 1e-6;
      const dfx = (evalDiff(curr + h) - evalDiff(curr - h)) / (2 * h);
      if (Math.abs(dfx) < 1e-12) break;
      const next = curr - fx / dfx;
      if (isNaN(next) || !isFinite(next)) break;
      if (Math.abs(next - curr) < tol) {
        root = next;
        found = true;
        break;
      }
      curr = next;
    }
    if (found) break;
  }

  if (root !== null) {
    const rounded = Math.round(root * 1e6) / 1e6;
    return {
      success: true,
      type: 'numerical',
      variable,
      result: `${variable} ≈ ${rounded}`,
      steps: [
        `Original Equation: ${lhsRaw} = ${rhsRaw}`,
        `Standard Form: (${lhsRaw}) - (${rhsRaw}) = 0`,
        `Method: High-precision Newton-Raphson numerical convergence`,
        `Root found: ${variable} ≈ ${rounded}`
      ],
      formatted: `⚡ Step-by-Step Algebraic Solution for: ${raw}\n\n1. Equation: ${lhsRaw} = ${rhsRaw}\n2. Solved via iterative numerical root finding\n\nFinal Answer: ${variable} ≈ ${rounded}`
    };
  }

  throw new Error('Numerical solver did not converge.');
}

/**
 * Evaluates standard arithmetic or mathematical expressions
 */
function evaluateExpression(raw) {
  try {
    const sanitized = sanitizeMathString(raw);
    const value = Function(`"use strict"; return (${sanitized});`)();
    const rounded = typeof value === 'number' ? Math.round(value * 1e8) / 1e8 : value;

    return {
      success: true,
      type: 'expression',
      result: String(rounded),
      steps: [
        `Input Expression: ${raw}`,
        `Sanitized Computation: ${sanitized}`,
        `Result: ${rounded}`
      ],
      formatted: `⚡ Evaluation Result:\n\nExpression: ${raw}\nAnswer: ${rounded}`
    };
  } catch (err) {
    return {
      success: false,
      result: 'Calculation Error',
      steps: [`Input: ${raw}`, `Error: ${err.message}`],
      formatted: `Error evaluating expression "${raw}": ${err.message}`
    };
  }
}
