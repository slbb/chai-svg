//start
export interface Coordinate {
  x: number
  y: number
}
export class Point implements Coordinate {
  x: number
  y: number
  prevCurve!: Curve
  nextCurve!: Curve
  links:Link[] = []
  constructor(x: number, y: number) {
    this.x = x
    this.y = y
  }
  clone(): Point {
    return new Point(this.x, this.y)
  }
  offset(x: number, y: number): void {
    this.x = this.x + x
    this.y = this.y + y
  }
  isSameCoordinate(p: Coordinate): boolean {
    return this.x == p.x && this.y == p.y
  }
  toString(): string {
    return `(${this.x},${this.y})`
  }
  transformMatrix(
    a: number,
    b: number,
    c: number,
    d: number,
    e: number,
    f: number
  ): Point {
    let x: number = this.x * a + this.y * c + e
    let y: number = this.x * b + this.y * d + f
    return new Point(x, y)
  }
}

export abstract class Curve {
  start: Point
  end: Point
  constructor(start: Point, end: Point) {
    start.nextCurve=this
    end.prevCurve=this
    this.start = start
    this.end = end
  }
  getStart(): Point {
    return this.start
  }
  getEnd(): Point {
    return this.end
  }
  abstract getIntersectPoint(p: Coordinate): Point[]
  abstract getStartDirection(): number
  abstract getEndDirection(): number
  getTurnAngle(): number {
    return calcTurnAngle(
      turn180(this.getStartDirection()),
      this.getEndDirection()
    )
  }
  abstract reverse(): Curve
  abstract toString(): string
  abstract toPathString(): string
  abstract toPathStringLinked(lastEnd: Point): string
}

export class CurveL extends Curve {
  constructor(start: Point, end: Point) {
    super(start, end)
  }
  toString() {
    return `L${this.start}${this.end}`
  }
  getABC(): number[] {
    let a: number = this.start.y - this.end.y
    let b: number = this.end.x - this.start.x
    let c: number = -a * this.start.x - b * this.start.y
    return [a, b, c]
  }
  getIntersectPoint(p: Point): Point[] {
    let [a, b, c]: number[] = this.getABC()
    if (
      Math.min(this.start.y, this.end.y) <= p.y &&
      p.y <= Math.max(this.start.y, this.end.y)
    ) {
      if (a * p.x + b * p.y + c == 0) {
        if (
          Math.min(this.start.x, this.end.x) <= p.x &&
          p.x <= Math.max(this.start.x, this.end.x)
        ) {
          return [p]
        } else {
          return []
        }
      } else {
        if (a == 0 && p.y == this.start.y) {
          return []
        } else {
          let x: number = (-c - b * p.y) / a
          if (x >= p.x) {
            return []
          }
          let y: number
          if (b == 0) {
            y = p.y
          } else {
            y = (c - a * p.x) / b
          }
          return [new Point(x, y)]
        }
      }
    } else {
      return []
    }
  }
  getStartDirection(): number {
    return (
      (Math.atan2(this.start.y - this.end.y, this.start.x - this.end.x) /
        Math.PI) *
      180
    )
  }
  getEndDirection(): number {
    return (
      (Math.atan2(this.end.y - this.start.y, this.end.x - this.start.x) /
        Math.PI) *
      180
    )
  }
  reverse(): CurveL {
    ;[this.start, this.end] = [this.end, this.start]
    return this
  }
  toPathString(): string {
    return `M${this.start.x} ${this.start.y}L${this.end.x} ${this.end.y}`
  }
  toPathStringLinked(lastEnd: Point): string {
    let s: string = `L${this.end.x} ${this.end.y}`
    if (lastEnd.isSameCoordinate(this.start)) {
      return s
    } else {
      return `M${this.start.x} ${this.start.y}${s}`
    }
  }
}
export class Link{
  start: Point
  end: Point
  constructor(start: Point, end: Point){
    this.start=start
    this.end=end
  }
  toPathString(): string {
    return `M${this.start.x} ${this.start.y}L${this.end.x} ${this.end.y}`
  }
}
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
  getPointByT(t: number): Point {
    if (0 <= t && t <= 1) {
      let x: number =
        Math.pow(1 - t, 2) * this.start.x +
        2 * t * (1 - t) * this.control.x +
        Math.pow(t, 2) * this.end.x
      let y: number =
        Math.pow(1 - t, 2) * this.start.y +
        2 * t * (1 - t) * this.control.y +
        Math.pow(t, 2) * this.end.y
      return new Point(x, y)
    } else {
      throw 'not valid t value'
    }
  }
  getIntersectPoint(p: Point): Point[] {
    /* 根据二次贝塞尔曲线公式，得到曲线上的点P(x,y)满足(t in [0,1]):
     * y=(start.y-2*control.y+end.y)*t^2 + 2*(control.y-start.y)*t + start.y
     *             ay                              by
     * x=(start.x-2*control.x+end.x)*t^2 + 2*(control.x-start.x)*t + start.x
     *             ax                              bx
     * mty:根据y的二次方程求得的极值y对应t值
     * mtx:根据x的二次方程求得的极值x对应t值
     * 求y=p.y时，t在[0,1]上有没有解。无解，则没有交点；有解则根据t求出x，x<=p.x时有交点，否则没有交点。
     */
    let ay: number = this.start.y - 2 * this.control.y + this.end.y
    let by: number = 2 * (this.control.y - this.start.y)
    let mty: number = -by / (2 * ay)
    function getIntersectPointMain(self: CurveQ): Point[] {
      let cy: number = self.start.y - p.y
      if (ay == 0) {
        //ay==0时，y的方程式是一次方程，用一次方程解法
        if (by == 0) {
          //这种情况下，曲线是水平直线条，特殊处理
          let ax: number = self.start.x - 2 * self.control.x + self.end.x
          let bx: number = 2 * (self.control.x - self.start.x)
          let mtx: number = -bx / (2 * ax)
          if (0 <= mtx && mtx <= 1) {
            let mx: number = ax * Math.pow(mtx, 2) + bx * mtx + self.start.x
            if (
              Math.min(self.start.x, self.end.x, mx) <= p.x &&
              p.x <= Math.max(self.start.x, self.end.x, mx)
            ) {
              return [p]
            }
            return []
          } else {
            if (
              Math.min(self.start.x, self.end.x) <= p.x &&
              p.x <= Math.max(self.start.x, self.end.x)
            ) {
              return [p]
            }
            return []
          }
        }
        let t: number = -cy / by
        if (0 <= t && t <= 1) {
          let point: Point = self.getPointByT(t)
          if (point.x <= p.x) {
            return [point]
          } else {
            return []
          }
        } else {
          return []
        }
      } else {
        // ay!=0时，用二次方程解法
        let result: Point[] = []
        let delta: number = Math.pow(by, 2) - 4 * ay * cy
        if (delta >= 0) {
          let t1: number = (-by + Math.sqrt(delta)) / (2 * ay)
          if (0 <= t1 && t1 <= 1) {
            let p1 = self.getPointByT(t1)
            if (p1.x <= p.x) {
              result.push(p1)
            }
          }
          let t2: number = (-by - Math.sqrt(delta)) / (2 * ay)
          if (0 <= t2 && t2 <= 1) {
            let p2 = self.getPointByT(t2)
            if (p2.x <= p.x) {
              result.push(p2)
            }
          }
        }
        return result
      }
    }
    // 先判断p.y是不是在曲线范围内，如果不是就返回[]，是的话才用getIntersectPointMain找交点
    if (0 <= mty && mty <= 1) {
      let my: number = ay * Math.pow(mty, 2) + by * mty + this.start.y
      if (
        Math.min(this.start.y, this.end.y, my) <= p.y &&
        p.y <= Math.max(this.start.y, this.end.y, my)
      ) {
        return getIntersectPointMain(this)
      }
      return []
    } else {
      if (
        Math.min(this.start.y, this.end.y) <= p.y &&
        p.y <= Math.max(this.start.y, this.end.y)
      ) {
        return getIntersectPointMain(this)
      }
      return []
    }
  }
  getBiggestDistance(): number {
    //t=0.5时，曲线上点p到start和end成的直线距离最远
    if (this.start.x == this.end.x) {
      let x: number = this.start.x / 4 + this.control.x / 2 + this.end.x / 4
      return Math.abs(x - this.start.x)
    } else {
      let k: number = (this.start.y - this.end.y) / (this.start.x - this.end.x)
      let b: number = this.start.y - k * this.start.x
      return (
        Math.abs(k * this.control.x - this.control.y + b) /
        2 /
        Math.sqrt(Math.pow(k, 2) + 1)
      )
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
  getStartDirection(): number {
    return (
      (Math.atan2(
        this.start.y - this.control.y,
        this.start.x - this.control.x
      ) /
        Math.PI) *
      180
    )
  }
  getEndDirection(): number {
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
    if (p.isSameCoordinate(this.start)) {
      return s
    } else {
      return `M${this.start.x} ${this.start.y}${s}`
    }
  }
}

export class ClosedCurve {
  curves: Array<Curve>
  constructor(curves: Array<Curve>) {
    if (!curves[0].start.isSameCoordinate(curves[curves.length - 1].end)) {
      throw 'curves are not closed'
    } else {
      this.curves = curves
    }
  }
  getPoints(): Point[] {
    let points: Set<Point> = new Set()
    for (let c of this.curves) {
      points.add(c.start)
      points.add(c.end)
    }
    return Array.from(points)
  }
  isPointInside(p: Coordinate): boolean {
    let count: number = 0
    for (let c of this.curves) {
      let points: Point[] = c.getIntersectPoint(p)
      if (points.some((point) => point.isSameCoordinate(p))) {
        return true
      } else {
        points.forEach((value: Point, index: number, array: Point[]) => {
          for (let i: number = 0; i < index; i++) {
            if (array[i].isSameCoordinate(value)) {
              return
            }
          }
          count++
        })
      }
    }
    return count % 2 == 1
  }
  isClosedCurveInside(cc: ClosedCurve): boolean {
    for (let p of cc.getPoints()) {
      if (!this.isPointInside(p)) {
        return false
      }
    }
    return true
  }
  toPathString(): string {
    let path: string = ''
    let lastEnd: Point = new Point(0, 0)
    for (let curve of this.curves) {
      path += curve.toPathStringLinked(lastEnd)
      lastEnd = curve.end
    }
    path = path.replace(/ -/g, '-')
    path += 'Z'
    return path
  }
}
export class SeparatePart {
  outsideClosedCurve: ClosedCurve
  insideClosedCurves: Array<ClosedCurve> = []
  constructor(outsideClosedCurve: ClosedCurve) {
    this.outsideClosedCurve = outsideClosedCurve
  }
  isPointInside(p: Coordinate): boolean {
    if (this.outsideClosedCurve.isPointInside(p)) {
      if (this.hasInside()) {
        for (let cc of this.insideClosedCurves) {
          if (cc.isPointInside(p)) {
            return false
          }
        }
      }
      return true
    }
    return false
  }
  hasInside(): boolean {
    return this.insideClosedCurves.length > 0
  }
  getClosedCurves(): ClosedCurve[] {
    return this.insideClosedCurves.concat(this.outsideClosedCurve)
  }
  getCurveList(): Curve[] {
    let curveList: Curve[] = this.outsideClosedCurve.curves
    for (let closedCurve of this.insideClosedCurves) {
      curveList = curveList.concat(closedCurve.curves)
    }
    return curveList
  }
  toPathString(): string {
    let path: string = ''
    path += this.outsideClosedCurve.toPathString()
    if (this.hasInside()) {
      for (let cc of this.insideClosedCurves) {
        path += cc.toPathString()
      }
    }
    return path
  }
}
export class Line {
  curves: Curve[]
  constructor(curve: Curve) {
    this.curves = new Array()
    this.curves.push(curve)
  }
  getStart(): Point {
    return this.getStartCurve().start
  }
  getEnd(): Point {
    return this.getEndCurve().end
  }
  addCurveToEnd(curve: Curve): void {
    this.curves.push(curve)
  }
  addCurveToStart(curve: Curve): void {
    let tmp: Curve[] = []
    tmp.push(curve)
    this.curves = tmp.concat(this.curves)
  }
  getEndCurve(): Curve {
    return this.curves[this.curves.length - 1]
  }
  getStartCurve(): Curve {
    return this.curves[0]
  }
  getStartDirection(): number {
    return this.getStartCurve().getStartDirection()
  }
  getEndDirection(): number {
    return this.getEndCurve().getEndDirection()
  }
  getTurnAngle(): number {
    return calcTurnAngle(
      turn180(this.getStartCurve().getStartDirection()),
      this.getEndCurve().getEndDirection()
    )
  }
  toPathString(): string {
    let path: string = ''
    let lastEnd: Point = new Point(0, 0)
    for (let c of this.curves) {
      path += c.toPathStringLinked(lastEnd)
      lastEnd = c.end
    }
    return path
  }
}
export class Route {
  lines: Line[]
  constructor(lines: Line[]) {
    this.lines = lines
  }
}
