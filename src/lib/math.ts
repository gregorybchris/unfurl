export const INF = Number.MAX_SAFE_INTEGER;

export function linear(m: number, b: number, x: number): number {
  return m * x + b;
}

export function exponential(a: number, b: number, x: number): number {
  return a * Math.pow(b, x);
}

export function logistic(a: number, b: number, x: number): number {
  return a / (1 + Math.exp(-b * x));
}

export function logarithmic(a: number, b: number, x: number): number {
  return a * Math.log(x) + b;
}
