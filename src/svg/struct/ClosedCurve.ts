import { Coordinate } from './Coordinate'
import { Point } from './Point'
import { Curve } from './Curve'
import { CurveL } from './CurveL'
import { CurveQ } from './CurveQ'

export class ClosedCurve {
  curves: Array<Curve>

  constructor(curves: Array<Curve>) {
    if (!Point.equal(curves[0].start, curves[curves.length - 1].end)) {
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

  /**
   * 射线法判断点p是否在闭合图形内部，射线为p起点x轴正方向的水平射线。
   * @param p 待判断的点
   * @return 0:out 1:in 2:on
   */
  rayCasting(p: Coordinate): number {
    let flag = false
    for (let c of this.curves) {
      // p在线段端点上
      if (Point.equal(c.start, p) || Point.equal(c.end, p)) {
        return 2
      }
      // 判断线段两端点是否分别在射线上下两侧（落在射线上的端点视为在射线上侧）
      // 注：直角坐标系取“垂直向上"为y轴正方向
      // 如果判断为true，那么CurveL和CurveQ的getXbyY(p.y)有且只有一个x
      let isStartPointAbove = c.start.y >= p.y
      let isEndPointAbove = c.end.y >= p.y
      if (!(isStartPointAbove == isEndPointAbove)) {
        let x: number
        if (c instanceof CurveL) {
          x = c.getXbyY(p.y)!
        } else if (c instanceof CurveQ) {
          x = c.getXbyY(p.y)![0]
        } else {
          throw "the author didn't consider this kind of Curve :-)"
        }
        // p在c上
        if (x == p.x) return 2
        // p在c的左侧
        if (x > p.x) flag = !flag
      } else if (c instanceof CurveQ) {
        /**
         * 这里处理u字形或n字形的CurveQ的特例：
         * 如果p被u（或n）字形CurveQ包围中，也要进行处理
         */
        let mp = c.getCoordinateByT(0.5)
        // 由上文可推断，此时mp.y==p.y只可能是相切于mp，直接排除，故使用>而不是>=
        let isMPAbove = mp.y > p.y
        if (!(isStartPointAbove == isMPAbove)) {
          // 到达这里，CurveQ的getXbyY(p.y)必然有两个不同的解
          let [x1, x2] = c.getXbyY(p.y)!
          if (x1 == p.x || x2 == p.x) return 2
          if ((x1 > p.x && x2 < p.x) || (x2 > p.x && x1 < p.x)) flag = !flag
        }
      }
    }
    return flag ? 1 : 0
  }

  isClosedCurveInside(cc: ClosedCurve): boolean {
    for (let p of cc.getPoints()) {
      if (this.rayCasting(p) == 0) {
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
