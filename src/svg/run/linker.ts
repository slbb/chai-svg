import { SeparatePart } from '../struct/SeparatePart'
import { Curve } from '../struct/Curve'
import { Link } from '../struct/Link'
import { Point } from '../struct/Point'
import {
  getDirectionByHead,
  calcAngleTurn,
  calcDistance,
  turn180,
  calcDirection,
} from '../utils/utils'
import { Coordinate } from '../struct/Coordinate'

export function link(sps: SeparatePart[]): void {
  for (let sp of sps) {
    sp.links = linkSingle(sp)
  }
}

export function linkSingle(sp: SeparatePart): Link[] {
  const result: Link[] = []
  let curves = sp.curves
  for (let i = 0; i < curves.length; i++) {
    let resCollection = []
    for (let j = i + 1; j < curves.length; j++) {
      let res = isLinkable(curves[i], curves[j], sp)
      if (res) {
        resCollection.push(res)
      }
    }
    if (resCollection.length > 0) {
      let chosen = resCollection[0]
      for (let i = 1; i < resCollection.length; i++) {
        let res = resCollection[i]
        if (chosen.turnAngle == res.turnAngle) {
          if (chosen.link.getLength() > res.link.getLength()) {
            chosen = res
          }
        } else if (chosen.turnAngle > res.turnAngle) {
          chosen = res
        }
      }
      result.push(chosen.link)
    }
  }
  return result
}

// function isSmoothAt(p:Point):boolean{
//     let [c1,c2] = p.relatedCurve
//     let d1 = getAngleByHead(p,c1)
//     let d2 = getAngleByHead(p,c2)
//     return Math.abs(calcTurnAngle(d1,d2))<20
// }

export function isLinkable(
  c1: Curve,
  c2: Curve,
  sp: SeparatePart
):{link: Link,turnAngle: number}| undefined {
  let c1hs = c1.getPoints()
  let c2hs = c2.getPoints()
  for (let h1 of c1hs) {
    for (let h2 of c2hs) {
      if (isLinkInside(h1, h2, sp)) {
        let d1 = getDirectionByHead(h1, c1)
        let d2 = getDirectionByHead(h2, c2)
        return isTwoHeadPointsLinkable(h1, d1, h2, d2)
      }
    }
  }
  return undefined
}

// TODO: 奥 字有bug
export function isTwoHeadPointsLinkable(
  h1: Point,
  d1: number,
  h2: Point,
  d2: number
):{link: Link,turnAngle: number}|undefined {
  let angleLimit = 30
  let midAngleLimit = 20
  let distanceLimit = 30
  if (h1 != h2 && calcDistance(h1, h2) < distanceLimit) {
    d2 = turn180(d2)
    let turnAngle = Math.abs(calcAngleTurn(d1, d2))
    if (turnAngle < angleLimit) {
      let linkD = calcDirection(h1, h2)
      let d1_to_linkD_abs = Math.abs(calcAngleTurn(d1, linkD))
      if (d1_to_linkD_abs < midAngleLimit) {
        let linkD_to_d2_abs = Math.abs(calcAngleTurn(linkD, d2))
        if (linkD_to_d2_abs < midAngleLimit) {
          return { link: new Link(h1, h2), turnAngle: turnAngle }
        }
      }
    }
  }
  return undefined
}

export function isLinkInside(
  p1: Coordinate,
  p2: Coordinate,
  sp: SeparatePart
): boolean {
  let mid = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 }
  return sp.isPointInside(mid)
}
