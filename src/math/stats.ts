import random from 'random'

export type Range = {
  min: number
  max: number
}

export class StatsImpl {
  static mean(values: number[]): number {
    if (values.length === 0) {
      console.error('Cannot take mean of array of length zero')
      return NaN
    }

    let sum = 0
    for (let i = 0; i < values.length; i++) {
      sum += values[i]
    }
    return sum / values.length
  }

  static scale(value: number, rangeA: Range, rangeB: Range): number {
    if (rangeA.max === rangeA.min) {
      console.error('Cannot scale using range with zero width')
      return NaN
    }
    return (
      ((value - rangeA.min) / (rangeA.max - rangeA.min)) * (rangeB.max - rangeB.min) + rangeB.min
    )
  }

  static rand(range: Range): number {
    return random.float(range.min, range.max)
  }

  static clip(value: number, range: Range): number {
    if (value < range.min) return range.min
    if (value > range.max) return range.max
    return value
  }

  static wrap(value: number, range: Range): number {
    return StatsImpl.mod(value - range.min, range.max - range.min) + range.min
  }

  static mod(a: number, b: number) {
    return ((a % b) + b) % b
  }
}
