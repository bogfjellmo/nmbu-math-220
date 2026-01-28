
export interface Matrix2x2 {
  a: number;
  b: number;
  c: number;
  d: number;
}

export interface Point {
  x: number;
  y: number;
}

export interface Vector {
  x: number;
  y: number;
}

export interface Trajectory {
  id: string;
  points: Point[];
  initial: Point;
  color: string;
}

export interface EquilibriumAnalysis {
  trace: number;
  determinant: number;
  discriminant: number;
  eigenvalues: [ComplexNumber, ComplexNumber];
  eigenvectors: [ComplexVector, ComplexVector] | null;
  classification: string;
  stability: string;
}

export interface ComplexNumber {
  re: number;
  im: number;
}

export interface ComplexVector {
  x: ComplexNumber;
  y: ComplexNumber;
}
