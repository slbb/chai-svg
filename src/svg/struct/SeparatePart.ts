import { Coordinate } from './Coordinate'
import { Curve } from './Curve'
import { ClosedCurve } from './ClosedCurve'
import { Point } from './Point'
import { Link } from './Link'

export class SeparatePart {
  outsideClosedCurve: ClosedCurve
  insideClosedCurves: ClosedCurve[] = []
  links: Link[] = []

  constructor(outsideClosedCurve: ClosedCurve) {
    this.outsideClosedCurve = outsideClosedCurve
  }

  get closedCurves(): ClosedCurve[] {
    return this.insideClosedCurves.concat(this.outsideClosedCurve)
  }

  get curves(): Curve[] {
    let curveList: Curve[] = this.outsideClosedCurve.curves
    for (let closedCurve of this.insideClosedCurves) {
      curveList = curveList.concat(closedCurve.curves)
    }
    curveList = curveList.concat(this.links)
    return curveList
  }
  getPoints(): Point[] {
    return this.curves.flatMap(curve => curve.getPoints())
  }

  isPointInside(p: Coordinate): boolean {
    if (this.outsideClosedCurve.rayCasting(p)) {
      if (this.hasInside()) {
        for (let cc of this.insideClosedCurves) {
          if (cc.rayCasting(p)) {
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
