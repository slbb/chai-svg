import { Coordinate } from './Coordinate'
import { Point } from './Point'
import { Curve } from './Curve'
import { quadraticEquationSolve } from '../utils/utils'

export class CurveQ extends Curve {
  //B(t)=(1-t)^2 start + 2t(1-t) control + t^2 end, t in [0,1]
  control: Point

  constructor(start: Point, end: Point, control: Point) {
    super(start, end)
    this.control = control
  }

  toString() {
    return `Q${this.start}${this.control}${this.end}`
  }

  getCoordinateByT(t: number): Coordinate {
    if (0 <= t && t <= 1) {
      let x: number =
        Math.pow(1 - t, 2) * this.start.x +
        2 * t * (1 - t) * this.control.x +
        Math.pow(t, 2) * this.end.x
      let y: number =
        Math.pow(1 - t, 2) * this.start.y +
        2 * t * (1 - t) * this.control.y +
        Math.pow(t, 2) * this.end.y
      return { x: x, y: y }
    } else {
      throw 'not valid t value'
    }
  }

  /**
   * 根据y值求x坐标（当y恒常数，或没有找到交点时返回undefined）
   * @param y y值
   */
  getXbyY(y: number): number[] | undefined {
    let ay: number = this.start.y - 2 * this.control.y + this.end.y
    let by: number = 2 * (this.control.y - this.start.y)
    let cy: number = this.start.y - y
    let ts = quadraticEquationSolve(ay, by, cy)
    if (ts) {
      const result = []
      for (let t of ts) {
        t = Number(t.toFixed(6))
        if (0 <= t && t <= 1) {
          result.push(this.getCoordinateByT(t).x)
        }
      }
      return result.length > 0 ? result : undefined
    }
    return undefined
  }

  // isOn(p: Coordinate): boolean {
  //   // p与端点重合
  //   if (this.start.equal(p) || this.end.equal(p)) {
  //     return true
  //   }
  //   // 先根据p.y找对应x值，再比较p.x是不是等于x
  //   let xs = this.getXbyY(p.x)
  //   if (xs) {
  //     return xs.some((v) => v == p.x)
  //   } else {
  //     // 没有求出x，有可能是y恒为常量的情况（this为直线）
  //     // 此时如果p.y等于y的常量，并且p在start和end之间则为true
  //     if (p.y == this.start.y) {
  //       return (
  //         (this.start.x < p.x && p.x < this.end.x) ||
  //         (this.end.x < p.x && p.x < this.start.x)
  //       )
  //     }
  //     return false
  //   }
  // }

  get biggestDistance(): number {
    //t=0.5时，曲线上点p到start和end成的直线距离最远
    let x: number = this.start.x / 4 + this.control.x / 2 + this.end.x / 4
    if (this.start.x == this.end.x) {
      return Math.abs(x - this.start.x)
    } else {
      let k: number = (this.start.y - this.end.y) / (this.start.x - this.end.x)
      let b: number = this.start.y - k * this.start.x
      let y: number = this.start.y / 4 + this.control.y / 2 + this.end.y / 4
      return Math.abs(k * x - y + b) / 2 / Math.sqrt(Math.pow(k, 2) + 1)
    }
  }

  getLength(t: number = 1): number {
    if (t < 0 || t > 1) {
      throw 'not valid t value'
    }
    let ax: number = this.start.x - 2 * this.control.x + this.end.x
    let bx: number = 2 * (this.control.x - this.start.x)
    let ay: number = this.start.y - 2 * this.control.y + this.end.y
    let by: number = 2 * (this.control.y - this.start.y)
    let a: number = 4 * (ax * ax + ay * ay)
    let b: number = 4 * (ax * bx + ay * by)
    let c: number = bx * bx + by * by
    //别人文章中的公式 注：直线也是一种特殊的贝塞尔曲线，此公式不适用于直线，不然会计算出NaN
    return (
      (2 *
        Math.sqrt(a) *
        (2 * a * t * Math.sqrt(a * t * t + b * t + c) +
          b * (Math.sqrt(a * t * t + b * t + c) - Math.sqrt(c))) +
        (b * b - 4 * a * c) *
          (Math.log(b + 2 * Math.sqrt(a * c)) -
            Math.log(
              b +
                2 * a * t +
                2 * Math.sqrt(a) * Math.sqrt(a * t * t + b * t + c)
            ))) /
      (8 * Math.pow(a, 3 / 2))
    )
  }

  reverse(): CurveQ {
    ;[this.start, this.end] = [this.end, this.start]
    return this
  }

  get startDirection(): number {
    return (
      (Math.atan2(
        this.start.y - this.control.y,
        this.start.x - this.control.x
      ) /
        Math.PI) *
      180
    )
  }

  get endDirection(): number {
    return (
      (Math.atan2(this.end.y - this.control.y, this.end.x - this.control.x) /
        Math.PI) *
      180
    )
  }

  toPathString(): string {
    return `M${this.start.x} ${this.start.y}Q${this.control.x} ${this.control.y} ${this.end.x} ${this.end.y}`
  }

  toPathStringLinked(p: Point): string {
    let s: string = `Q${this.control.x} ${this.control.y} ${this.end.x} ${this.end.y}`
    if (Point.equal(p,this.start)) {
      return s
    } else {
      return `M${this.start.x} ${this.start.y}${s}`
    }
  }
}
