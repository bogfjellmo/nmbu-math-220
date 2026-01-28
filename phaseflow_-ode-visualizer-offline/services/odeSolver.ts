
import { Point, Matrix2x2, ComplexNumber, ComplexVector, EquilibriumAnalysis } from '../types';

/**
 * Solves y' = Ay using Runge-Kutta 4th Order.
 * Returns an array of points for the trajectory.
 */
export const solveODE = (
  matrix: Matrix2x2,
  initial: Point,
  steps: number = 200,
  dt: number = 0.05,
  forward: boolean = true
): Point[] => {
  const points: Point[] = [initial];
  let current = { ...initial };
  const direction = forward ? 1 : -1;
  const h = dt * direction;

  const f = (p: Point): Point => ({
    x: matrix.a * p.x + matrix.b * p.y,
    y: matrix.c * p.x + matrix.d * p.y
  });

  for (let i = 0; i < steps; i++) {
    const k1 = f(current);
    const k2 = f({
      x: current.x + (h / 2) * k1.x,
      y: current.y + (h / 2) * k1.y
    });
    const k3 = f({
      x: current.x + (h / 2) * k2.x,
      y: current.y + (h / 2) * k2.y
    });
    const k4 = f({
      x: current.x + h * k3.x,
      y: current.y + h * k3.y
    });

    current = {
      x: current.x + (h / 6) * (k1.x + 2 * k2.x + 2 * k3.x + k4.x),
      y: current.y + (h / 6) * (k1.y + 2 * k2.y + 2 * k3.y + k4.y)
    };

    if (Math.abs(current.x) > 20 || Math.abs(current.y) > 20) break;
    points.push({ ...current });
  }

  return points;
};

const getEigenvector = (m: Matrix2x2, ev: number): ComplexVector => {
  // Solve (A - λI)v = 0
  // [a-λ  b ] [x] = [0]
  // [c    d-λ] [y] = [0]
  const row1 = { a: m.a - ev, b: m.b };
  
  if (Math.abs(row1.b) > 1e-9) {
    // x = -b, y = a-λ
    const mag = Math.sqrt(row1.b * row1.b + row1.a * row1.a);
    return {
      x: { re: -row1.b / mag, im: 0 },
      y: { re: row1.a / mag, im: 0 }
    };
  } else if (Math.abs(row1.a) > 1e-9) {
    // x must be 0, y can be 1
    return {
      x: { re: 0, im: 0 },
      y: { re: 1, im: 0 }
    };
  } else {
    // Row 1 is all zeros. Use row 2.
    const row2 = { c: m.c, d: m.d - ev };
    if (Math.abs(row2.c) > 1e-9) {
      // x = -(d-λ)/c, y = 1
      const xVal = -row2.d / row2.c;
      const mag = Math.sqrt(xVal * xVal + 1);
      return {
        x: { re: xVal / mag, im: 0 },
        y: { re: 1 / mag, im: 0 }
      };
    } else {
      // Identity-like or zero matrix cases
      return {
        x: { re: 1, im: 0 },
        y: { re: 0, im: 0 }
      };
    }
  }
};

export const analyzeMatrix = (m: Matrix2x2): EquilibriumAnalysis => {
  const tr = m.a + m.d;
  const det = m.a * m.d - m.b * m.c;
  const disc = tr * tr - 4 * det;

  let eigenvalues: [ComplexNumber, ComplexNumber];
  let eigenvectors: [ComplexVector, ComplexVector] | null = null;

  if (disc >= 0) {
    const r1 = (tr + Math.sqrt(disc)) / 2;
    const r2 = (tr - Math.sqrt(disc)) / 2;
    eigenvalues = [{ re: r1, im: 0 }, { re: r2, im: 0 }];
    eigenvectors = [getEigenvector(m, r1), getEigenvector(m, r2)];
  } else {
    const re = tr / 2;
    const im = Math.sqrt(-disc) / 2;
    eigenvalues = [{ re, im }, { re, im: -im }];
    // Complex eigenvectors are harder to visualize directly in R2, 
    // we'll keep them as null or could compute them, but for R2 phase portraits 
    // the real/imaginary parts of complex eigenvectors define the elliptical/spiral behavior.
    eigenvectors = null; 
  }

  let classification = "Unknown";
  let stability = "Neutral";

  if (det < 0) {
    classification = "Saddle Point";
    stability = "Unstable";
  } else if (det > 0) {
    if (disc > 0) {
      classification = "Node";
      stability = tr > 0 ? "Unstable (Source)" : "Stable (Sink)";
    } else if (disc < 0) {
      if (Math.abs(tr) < 1e-9) {
        classification = "Center";
        stability = "Neutrally Stable";
      } else {
        classification = "Spiral Point";
        stability = tr > 0 ? "Unstable (Spiral Source)" : "Stable (Spiral Sink)";
      }
    } else {
      classification = "Proper/Improper Node";
      stability = tr > 0 ? "Unstable" : "Stable";
    }
  } else {
    classification = "Degenerate (Non-isolated)";
    stability = "Marginally Stable";
  }

  return {
    trace: tr,
    determinant: det,
    discriminant: disc,
    eigenvalues,
    eigenvectors,
    classification,
    stability
  };
};
