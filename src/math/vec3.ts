import { Range, StatsImpl } from './stats'

export type Vec3 = {
  x: number
  y: number
  z: number
}

export class Vec3Impl {
  static origin(): Vec3 {
    return { x: 0, y: 0, z: 0 }
  }

  static fromXY(x: number, y: number, z = 0): Vec3 {
    return { x, y, z }
  }

  static add(a: Vec3, b: Vec3): Vec3 {
    return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z }
  }

  static sub(a: Vec3, b: Vec3): Vec3 {
    return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z }
  }

  static mult(v: Vec3, s: number): Vec3 {
    return { x: v.x * s, y: v.y * s, z: v.z * s }
  }

  static mag(v: Vec3): number {
    return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z)
  }

  static dist(a: Vec3, b: Vec3): number {
    const dx = a.x - b.x,
      dy = a.y - b.y,
      dz = a.z - b.z
    return Math.sqrt(dx * dx + dy * dy + dz * dz)
  }

  static normalize(v: Vec3): Vec3 {
    const m = Vec3Impl.mag(v)
    if (m === 0) return Vec3Impl.origin()
    return { x: v.x / m, y: v.y / m, z: v.z / m }
  }

  static unitTo(a: Vec3, b: Vec3): Vec3 {
    return Vec3Impl.normalize(Vec3Impl.sub(b, a))
  }

  static cross(a: Vec3, b: Vec3): Vec3 {
    return {
      x: a.y * b.z - a.z * b.y,
      y: a.z * b.x - a.x * b.z,
      z: a.x * b.y - a.y * b.x,
    }
  }

  static rand(xRange: Range, yRange: Range, zRange: Range): Vec3 {
    return {
      x: StatsImpl.rand(xRange),
      y: StatsImpl.rand(yRange),
      z: StatsImpl.rand(zRange),
    }
  }
}
