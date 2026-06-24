export class CurveImpl {
  /**
   * Linear curve function. y = m * x + b
   * @param  {number} m  Slope of the line.
   * @param  {number} b  Y-intercept of the line.
   * @param  {number} x  x-value on the line.
   * @return {number}    y-value on the line.
   */
  static linear(m: number, b: number, x: number): number {
    return m * x + b;
  }

  /**
   * Exponential curve function. y = a * b^x
   * @param  {number} a  Coefficient of the exponential function.
   * @param  {number} b  Base of the exponential function.
   * @param  {number} x  x-value on the curve.
   * @return {number}    y-value on the curve.
   */
  static exponential(a: number, b: number, x: number): number {
    return a * Math.pow(b, x);
  }

  /**
   * Logistic curve function. y = a / (1 + e^(-b * x))
   * @param  {number} a  Maximum value of the logistic function.
   * @param  {number} b  Growth rate of the function.
   * @param  {number} x  x-value on the curve.
   * @return {number}    y-value on the curve.
   */
  static logistic(a: number, b: number, x: number): number {
    return a / (1 + Math.exp(-b * x));
  }

  /**
   * Logarithmic curve function. y = a * ln(x) + b
   * @param  {number} a  Coefficient of the logarithmic function.
   * @param  {number} b  y-offset of the function.
   * @param  {number} x  x-value on the curve (must be > 0).
   * @return {number}    y-value on the curve.
   */
  static logarithmic(a: number, b: number, x: number): number {
    return a * Math.log(x) + b;
  }

  /**
   * Polynomial curve function. y = a * x^b
   * @param  {number} a  Coefficient of the polynomial function.
   * @param  {number} b  Exponent of the polynomial function.
   * @param  {number} x  x-value on the curve.
   * @return {number}    y-value on the curve.
   */
  static polynomial(a: number, b: number, x: number): number {
    return a * Math.pow(x, b);
  }
}
