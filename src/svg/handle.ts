import {
  ClosedCurve,
  Curve,
  CurveL,
  CurveQ,
  Point,
  SeparatePart,
  Line,
  Coordinate,
  Link,
} from './class'
import {
  turn180,
  getAngleByHead,
  calcTurnAngle,
  calcDistance,
  calcKAngle,
  getItemsInRange,
} from './utils'
//start
export function findClosedCurves(curves: Array<Curve>): Array<ClosedCurve> {
  let headPoint: Point | null = null
  const result: Array<ClosedCurve> = []
  let closedCurve: Array<Curve> = []
  for (let c of curves) {
    if (headPoint == null) {
      headPoint = c.start
      closedCurve.push(c)
      continue
    }
    if (!c.end.isSameCoordinate(headPoint)) {
      closedCurve.push(c)
    } else {
      closedCurve.push(c)
      result.push(new ClosedCurve(closedCurve))
      closedCurve = []
      headPoint = null
    }
  }
  return result
}
export function generateSeparatePart(
  closedCurves: Array<ClosedCurve>
): Array<SeparatePart> {
  let l: number = closedCurves.length
  const fatherMarkList: Array<number | undefined> = new Array(l)
  fatherMarkList.fill(undefined)
  function findFather(i: number, j: number) {
    if (closedCurves[j].isClosedCurveInside(closedCurves[i])) {
      let mark: number | undefined = fatherMarkList[i]
      if (typeof mark == 'undefined') {
        fatherMarkList[i] = j
      } else if (typeof mark == 'number') {
        let iFather: ClosedCurve = closedCurves[mark]
        if (!closedCurves[j].isClosedCurveInside(iFather)) {
          fatherMarkList[i] = j
        }
      }
    }
  }
  for (let i = 0; i < l; i++) {
    for (let j = i + 1; j < l; j++) {
      findFather(i, j)
      findFather(j, i)
    }
  }
  let generationList: number[] = fatherMarkList.map(
    (
      value: number | undefined,
      _index: number | undefined,
      array: Array<number | undefined>
    ): number => {
      let generation: number = 1
      function getGeneration(v: number | undefined) {
        if (typeof v == 'undefined') {
          return
        } else {
          generation += 1
          getGeneration(array[v])
        }
      }
      getGeneration(value)
      return generation % 2 == 1 ? 0 : 1
    }
  )
  const result: Array<SeparatePart> = []
  for (let i in fatherMarkList) {
    if (!generationList[i]) {
      let part: SeparatePart = new SeparatePart(closedCurves[i])
      for (let j in fatherMarkList) {
        if (fatherMarkList[j] == Number(i)) {
          part.insideClosedCurves.push(closedCurves[j])
        }
      }

      result.push(part)
    }
  }
  return result
}

export function linker(sp: SeparatePart): Link[] {
  const result: Link[] = []
  const curves = sp.getCurveList()
  let points: Point[] = []
  for (let cc of sp.getClosedCurves()) {
    points.concat(cc.getPoints())
  }
  const unhandledStarts: boolean[] = new Array(curves.length).fill(true)
  const unhandledEnds: boolean[] = new Array(curves.length).fill(true)
  const sortByX: Point[] = points.sort((a, b) => a.x - b.x)
  const sortByY: Point[] = points.sort((a, b) => a.y - b.y)
  function getPointsByRange(p: Coordinate, range: number): Point[] {
    let xList = getItemsInRange(
      sortByX,
      (item) => item.x < p.x - range,
      (item) => item.x <= p.x + range
    )
    let yList = getItemsInRange(
      sortByY,
      (item) => item.y < p.y - range,
      (item) => item.y <= p.y + range
    )
    return xList.filter((item) => yList.includes(item))
  }
  // function isCurveQSimilarToL(c: CurveQ): boolean {
  //   return c.getBiggestDistance() / c.getLength() < 0.2
  // }
  function isSmooth(c1: Curve, c2: Curve, p: Point): boolean {
    let angle1 = getAngleByHead(p, c1)
    let angle2 = getAngleByHead(p, c2)
    return Math.abs(calcTurnAngle(angle1, turn180(angle2))) < 20
  }
  function isLinkalbe(c1: Curve, p1: Point, c2: Curve, p2: Point): boolean {
    if (!sp.isPointInside({ x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 })) {
      return false
    }
    let angle1 = getAngleByHead(p1, c1)
    let angle2 = getAngleByHead(p2, c2)
    return Math.abs(calcTurnAngle(angle1, turn180(angle2))) < 20
    /**
     * //line和curve端点连线的成角
        let lcLink_angle: number =
        (Math.atan2(cHead.y - lHead.y, cHead.x - lHead.x) /
        Math.PI) * 180
      //line和端点连线的成角之间的转角
        let lHead_lcLink_turn_abs: number = Math.abs(
            calcTurnAngle(lHead_D, lcLink_angle)
          )
        let lcLink_cHead_turn_abs: number = Math.abs(
          calcTurnAngle(lcLink_angle, turn180(cHead_D))
          )
        let isValidFlag: boolean =
          lHead.isSameCoordinate(cHead) ||
          Math.min(lHead_lcLink_turn_abs, lcLink_cHead_turn_abs) < 15
     */
  }
  let range = 20
  function search(forward: boolean): void {
    let unhandledMarks = forward ? unhandledEnds : unhandledStarts
    let unhandledOther = forward ? unhandledStarts : unhandledEnds
    for (let i = 0; i < unhandledMarks.length; i++) {
      if (unhandledMarks[i]) {
        let c1 = curves[i]
        let head = forward ? c1.end : c1.start
        let pointsInRange = getPointsByRange(head, range)
        for (let p of pointsInRange) {
          if (p == head) {
            let linkedCurve = forward ? head.nextCurve : head.prevCurve
            if (isSmooth(c1, linkedCurve, head)) {
              let c1_ind = curves.indexOf(c1)
              let linkedCurve_ind = curves.indexOf(linkedCurve)
              unhandledMarks[c1_ind] = false
              if (unhandledOther[linkedCurve_ind]) {
                unhandledOther[linkedCurve_ind] = false
              } else {
                throw 'dup handle'
              }
              break
            }
          } else {
            let prevCurve_p = p.prevCurve
            let nextCurve_p = p.nextCurve
            if (
              unhandledEnds[curves.indexOf(prevCurve_p)] &&
              isLinkalbe(c1, head, prevCurve_p, p)
            ) {
              let c1_ind = curves.indexOf(c1)
              let prevCurve_ind = curves.indexOf(prevCurve_p)
              unhandledMarks[c1_ind] = false
              if (unhandledEnds[prevCurve_ind]) {
                unhandledEnds[prevCurve_ind] = false
                let link = new Link(head,p)
                head.links.push(link)
                p.links.push(link)
                result.push(link)
              } else {
                throw 'dup handle'
              }
              break
            } else if (
              unhandledStarts[curves.indexOf(nextCurve_p)] &&
              isLinkalbe(c1, head, nextCurve_p, p)
            ) {
              let c1_ind = curves.indexOf(c1)
              let nextCurve_ind = curves.indexOf(nextCurve_p)
              unhandledMarks[c1_ind] = false
              if(unhandledStarts[nextCurve_ind]){
                unhandledStarts[nextCurve_ind] = false
                let link: Link= new Link(head,p)
                head.links.push(link)
                p.links.push(link)
                result.push(link)
              }else{
                throw 'dup handle'
              }
              break
            }
          }
        }
      }
    }
  }
  search(true)
  search(false)
  return result
}
// export function findLines(sp: SeparatePart): Line[] {
//   const curves = sp.getCurveList()
//   const result: Line[] = []
//   const point_curveMap = new Map<string, Curve[]>()
//   function initMap(p: Point, c: Curve): void {
//     let curves = point_curveMap.get(p.hashcode())
//     if (curves) {
//       curves.push(c)
//     } else {
//       point_curveMap.set(p.hashcode(), [c])
//     }
//   }
//   for (let c of curves) {
//     initMap(c.start, c)
//     initMap(c.end, c)
//   }
//   const unhandledMarks: boolean[] = new Array(curves.length)
//   unhandledMarks.fill(true)
//   for (let i = 0; i < curves.length; i++) {
//     if (unhandledMarks[i]) {
//       let curve = curves[i]
//       let line: Line = new Line(curve)
//       result.push(line)
//       unhandledMarks[i] = false
//       let range = 20
//       let kAngle_90 = Math.abs(
//         calcKAngle(curve.getStart(), curve.getEnd()) - 90
//       )
//       let angleLimit =
//         (kAngle_90 < 5 || kAngle_90 > 85) &&
//         (curve instanceof CurveL ||
//           (curve instanceof CurveQ && curve.getBiggestDistance() < 10))
//           ? 20
//           : 180
//       //head
//       function search(backward: boolean): void {
//         let lHead = backward ? line.getStart() : line.getEnd()
//         //line端点切线角度，line自身的总转角
//         let [lHead_D, l_turn] = getAngleByHead(lHead, line)
//         l_turn = -l_turn
//         //遍历map的key（点坐标）
//         for (let cHead_hc of point_curveMap.keys()) {
//           let cHead = Point.parsePoint(cHead_hc)
//           //找到符合range的坐标，取出map的value（curves），进行下一步
//           if (
//             cHead.x < lHead.x + range &&
//             cHead.x > lHead.x - range &&
//             cHead.y < lHead.y + range &&
//             cHead.y > lHead.y - range
//           ) {
//             let validCurve: { curve: Curve; min_turn: number } | null = null
//             let cHead_curves = point_curveMap.get(cHead_hc)
//             if (cHead_curves) {
//               //遍历取出的curves，计算角度数据是否符合条件
//               for (let c of cHead_curves) {
//                 if (unhandledMarks[curves.indexOf(c)]) {
//                   let c_kAngle_90 = Math.abs(calcKAngle(c.start, c.end) - 90)
//                   let flag =
//                     (c_kAngle_90 < 5 || c_kAngle_90 > 85) &&
//                     (c instanceof CurveL ||
//                       (c instanceof CurveQ &&
//                         c.getBiggestDistance() / c.getLength() < 0.2))
//                   if (angleLimit > 100 && flag) {
//                     continue
//                   }
//                   if (
//                     calcDistance(lHead, cHead) <
//                     calcDistance(
//                       lHead.isSameCoordinate(line.getStart())
//                         ? line.getEnd()
//                         : lHead,
//                       c.start.isSameCoordinate(cHead) ? c.end : cHead
//                     )
//                   ) {
//                     //curve端点切线角度，curve自身的总转角
//                     let [cHead_D, c_turn] = getAngleByHead(cHead, c)
//                     //从 line端点切线角度 转向 curve端点切线角度，求出转角
//                     let lHead_cHead_turn: number = calcTurnAngle(
//                       lHead_D,
//                       turn180(cHead_D)
//                     )
//                     //首先排除line和curve总转角之和太大的，以及端点处切线角度差距太大的
//                     if (
//                       (lHead.isSameCoordinate(cHead) ||
//                         sp.isPointInside(
//                           new Point(
//                             (lHead.x + cHead.x) / 2,
//                             (lHead.y + cHead.y) / 2
//                           )
//                         )) &&
//                       Math.abs(l_turn + c_turn) < angleLimit &&
//                       Math.abs(lHead_cHead_turn) < 20 &&
//                       Math.abs(c_turn) < 60
//                     ) {
//                       //line和curve端点连线的成角
//                       let lcLink_angle: number =
//                         (Math.atan2(cHead.y - lHead.y, cHead.x - lHead.x) /
//                           Math.PI) *
//                         180
//                       //line和端点连线的成角之间的转角
//                       let lHead_lcLink_turn_abs: number = Math.abs(
//                         calcTurnAngle(lHead_D, lcLink_angle)
//                       )
//                       let lcLink_cHead_turn_abs: number = Math.abs(
//                         calcTurnAngle(lcLink_angle, turn180(cHead_D))
//                       )
//                       let isValidFlag: boolean =
//                         lHead.isSameCoordinate(cHead) ||
//                         Math.min(lHead_lcLink_turn_abs, lcLink_cHead_turn_abs) <
//                           15
//                       if (isValidFlag) {
//                         if (validCurve) {
//                           validCurve =
//                             validCurve.min_turn > lHead_cHead_turn
//                               ? { curve: c, min_turn: lHead_cHead_turn }
//                               : validCurve
//                         } else {
//                           validCurve = { curve: c, min_turn: lHead_cHead_turn }
//                         }
//                       }
//                     }
//                   }
//                 }
//               }
//               if (validCurve) {
//                 if (backward) {
//                   if (validCurve.curve.start.isSameCoordinate(cHead)) {
//                     line.addCurveToStart(validCurve.curve.reverse())
//                   } else if (validCurve.curve.end.isSameCoordinate(cHead)) {
//                     line.addCurveToStart(validCurve.curve)
//                   } else {
//                     throw 'bug occurs in search()'
//                   }
//                 } else {
//                   if (validCurve.curve.start.isSameCoordinate(cHead)) {
//                     line.addCurveToEnd(validCurve.curve)
//                   } else if (validCurve.curve.end.isSameCoordinate(cHead)) {
//                     line.addCurveToEnd(validCurve.curve.reverse())
//                   } else {
//                     throw 'bug occurs in search()'
//                   }
//                 }
//                 unhandledMarks[curves.indexOf(validCurve.curve)] = false
//                 //找到的话就递归查找，直到找不到为止
//                 search(backward)
//                 return
//               }
//             }
//           }
//         }
//         return
//       }
//       search(true)
//       search(false)
//     }
//   }
//   return result
// }
