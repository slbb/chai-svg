import { Coordinate,Curve, Point,CurveQ } from './class'

//start
export function calcDistance(p1: Coordinate, p2: Coordinate): number {
  return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2))
}
export function calcKAngle(p1: Coordinate, p2: Coordinate): number {
  let angle = (Math.atan2(p2.y - p1.y, p2.x - p1.x) / Math.PI) * 180
  return angle < 0 || angle == 180 ? turn180(angle) : angle
}
/**
 * 返回参数角的180度转角
 * @param angle 参数角
 */
export function turn180(angle: number): number {
  return angle > 0 ? angle - 180 : angle + 180
}
/**
 * 返回从角a转动到角b的度数，逆时针为正，顺时针为负
 * @param a 角a
 * @param b 角b
 */
export function calcTurnAngle(a: number, b: number): number {
  return Math.abs(b - a) > 180 ? turn180(b) - turn180(a) : b - a
}
/**
 * 返回 端点的切线朝外角度
 * @param head Curve，头或尾
 * @param curve Curve
 */
export function getAngleByHead(head: Coordinate, curve: Curve): number {
  if (curve.getStart().isSameCoordinate(head)) {
    return curve.getStartDirection()
  } else if (curve.getEnd().isSameCoordinate(head)) {
    return curve.getEndDirection()
  } else {
    throw 'the parameter point given is not the head point of this curve/line'
  }
}
export function binerySearch<T>(
  arr: T[],
  condition: (item: T) => boolean,
  front: number = 0,
  rear: number = arr.length - 1
): number {
  while (front < rear) {
    let mid = Math.floor((front + rear) / 2)
    let item = arr[mid]
    if (condition(item)) {
      front = mid + 1
    } else {
      rear = mid
    }
  }
  return front
}
export function getItemsInRange<T>(
  arr: T[],
  condition1: (item: T) => boolean,
  condition2: (item: T) => boolean
): T[] {
  let min = binerySearch(arr, condition1)
  let max = binerySearch(arr, condition2) - 1
  return arr.slice(min, max)
}

export function curveQcutter(c: CurveQ,t: number): CurveQ[] {
  let cp: Point = c.getPointByT(t)
  let cp1: Point = new Point(c.start.x*t,c.start.y*t)
  let cp2: Point = new Point(cp.x*t,cp.y*t)
  return [new CurveQ(c.start,cp,cp1),new CurveQ(cp,c.end,cp2)]
}