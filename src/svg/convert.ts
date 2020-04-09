import { Point, Curve, CurveL, CurveQ, Coordinate } from './class'
//start
export function pathToCurveList(path: string): Array<Curve> {
  let startPoint: Point = new Point(0, 0)
  let lastPoint: Point = startPoint
  let curves: Array<Curve> = []
  let operatorStrs = path.trim().split(/(?<=\d|[Zz])\s*(?=[A-Za-z])/)
  for (let operatorStr of operatorStrs) {
    let params: number[] = []
    let [typeName, paramsStr] = operatorStr.split(/(?<=[A-Za-z])/)
    if (paramsStr) {
      params = paramsStr
        .trim()
        .split(/[,\s]+|(?<=\d)(?=-)/)
        .map((value) => Number(value))
    }
    if (typeName.toUpperCase() == 'M') {
      if (typeName == 'm') {
        startPoint = new Point(lastPoint.x + params[0], lastPoint.y + params[1])
        lastPoint = startPoint
      } else {
        startPoint = new Point(params[0], params[1])
        lastPoint = startPoint
      }
    } else if (typeName.toUpperCase() == 'L') {
      let endCoordinate = { x: params[0], y: params[1] }
      if (typeName == 'l') {
        endCoordinate.x += lastPoint.x
        endCoordinate.y += lastPoint.y
      }
      let end = startPoint.isSameCoordinate(endCoordinate)
        ? startPoint
        : new Point(endCoordinate.x, endCoordinate.y)
      curves.push(new CurveL(lastPoint, end))
      lastPoint = end
    } else if (typeName.toUpperCase() == 'Q') {
      let control = new Point(params[0], params[1])
      let endCoordinate = { x: params[2], y: params[3] }
      if (typeName == 'q') {
        control.offset(lastPoint.x, lastPoint.y)
        endCoordinate.x += lastPoint.x
        endCoordinate.y += lastPoint.y
      }
      let end = startPoint.isSameCoordinate(endCoordinate)
        ? startPoint
        : new Point(endCoordinate.x, endCoordinate.y)
      curves.push(new CurveQ(lastPoint, end, control))
      lastPoint = end
    }
    //H V T S C A Z暂时用不上，省略了
  }
  return curves
}
