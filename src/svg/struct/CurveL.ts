import { Curve } from './Curve'
import { Coordinate } from './Coordinate'
import { Point } from './Point'
import { calcDistance } from '../utils/utils'

export class CurveL extends Curve {
  constructor(start: Point, end: Point) {
    super(start, end)
  }

  get abc(): number[] {
    let a: number = this.start.y - this.end.y
    let b: number = this.end.x - this.start.x
    let c: number = -a * this.start.x - b * this.start.y
    if (b < 0) {
      a = -a
      b = -b
      c = -c
    }
    return [a, b, c]
  }

  get startDirection(): number {
    return (
      (Math.atan2(this.start.y - this.end.y, this.start.x - this.end.x) /
        Math.PI) *
      180
    )
  }

  get endDirection(): number {
    return (
      (Math.atan2(this.end.y - this.start.y, this.end.x - this.start.x) /
        Math.PI) *
      180
    )
  }
  getLength(): number {
    return calcDistance(this.start,this.end)
  }

  toString() {
    return `L${this.start}${this.end}`
  }

  getXbyY(y: number): number | undefined {
    let [a, b, c] = this.abc
    if (a == 0) {
      return undefined
    } else {
      return -(b * y + c) / a
    }
  }

  // isOn(p: Coordinate): boolean {
  //   if (this.start.equal(p) || this.end.equal(p)) {
  //     return true
  //   }
  //   let [a, b, c] = this.abc
  //   // 判断是否满足直线方程
  //   if (a * p.x + b * p.y + c == 0) {
  //     // 方程b==0时是垂直的，判断p.y值是否在两端点之间
  //     if (b == 0) {
  //       let [minY, maxY] = [this.start.y, this.end.y].sort()
  //       return minY < p.y && p.y < maxY
  //     }
  //     // 其它情况判断p.x是否在端点x坐标之间即可
  //     let [minX, maxX] = [this.start.x, this.end.x].sort()
  //     return minX < p.x && p.x < maxX
  //   }
  //   return false
  // }

  reverse(): CurveL {
    ;[this.start, this.end] = [this.end, this.start]
    return this
  }

  toPathString(): string {
    return `M${this.start.x} ${this.start.y}L${this.end.x} ${this.end.y}`
  }

  toPathStringLinked(lastEnd: Point): string {
    let s: string = `L${this.end.x} ${this.end.y}`
    if (Point.equal(lastEnd,this.start)) {
      return s
    } else {
      return `M${this.start.x} ${this.start.y}${s}`
    }
  }
}
