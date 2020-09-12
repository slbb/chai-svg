import { Coordinate } from '../struct/Coordinate'
import { Curve } from '../struct/Curve'
import { Point } from '../struct/Point'

export function calcDistance(p1: Coordinate, p2: Coordinate): number {
  return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2))
}

export function calcDirection(p1: Coordinate, p2: Coordinate): number {
  return (Math.atan2(p2.y - p1.y, p2.x - p1.x) / Math.PI) * 180
}

export function angleAbs(angle: number): number {
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
export function calcAngleTurn(a: number, b: number): number {
  return Math.abs(b - a) > 180 ? turn180(b) - turn180(a) : b - a
}

/**
 * 返回 端点的切线朝外角度
 * @param head Curve，头或尾
 * @param curve Curve
 */
export function getDirectionByHead(head: Coordinate, curve: Curve): number {
  if (Point.equal(curve.start,head)) {
    return curve.startDirection
  } else if (Point.equal(curve.end,head)) {
    return curve.endDirection
  } else {
    throw 'the parameter point given is not the head point of this curve/line'
  }
}

export function quadraticEquationSolve(
  a: number,
  b: number,
  c: number
): number[] | undefined {
  if (a == 0) {
    if (b == 0) {
      return
    } else {
      return [-c / b]
    }
  } else {
    let delta = b * b - 4 * a * c
    if (delta < 0) {
      return
    } else if (delta == 0) {
      return [-b / a / 2]
    } else {
      let x_tmp = -b / a / 2
      let u = Math.sqrt(x_tmp * x_tmp - c / a)
      return [x_tmp + u, x_tmp - u]
    }
  }
}
