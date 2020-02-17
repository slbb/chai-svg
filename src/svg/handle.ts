import { ClosedCurve, Curve, Point, SeparatePart, Line, turn180, getAnglesByHead, calcTurnAngle } from "./class";
import { PathElement, SvgUtil, StrokeColorRef } from './svgDisplay';
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
        if (!c.end.isSamePosition(headPoint)) {
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
export function generateSeparatePart(closedCurves: Array<ClosedCurve>): Array<SeparatePart> {
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
        (value: number | undefined, _index: number | undefined, array: Array<number | undefined>): number => {
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
            let part: SeparatePart = new SeparatePart(closedCurves[i]);
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
export function findLines(curves: Curve[]): Line[] {
    const result: Line[] = []
    const point_curveMap = new Map<string, Curve[]>()
    function initMap(p: Point, c: Curve): void {
        let curves = point_curveMap.get(p.hashcode())
        if (curves) {
            curves.push(c)
        } else {
            point_curveMap.set(p.hashcode(), [c])
        }
    }
    for (let c of curves) {
        initMap(c.start, c)
        initMap(c.end, c)
    }
    const unhandledMarks: boolean[] = new Array(curves.length)
    unhandledMarks.fill(true)
    function calcDistance(p1: { x: number, y: number }, p2: { x: number, y: number }): number {
        return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2))
    }
    for (let i = 0; i < curves.length; i++) {
        if (unhandledMarks[i]) {
            let line: Line = new Line(curves[i])
            result.push(line)
            unhandledMarks[i] = false
            let range = 20
            //head
            function search(backward: boolean): void {
                let lHead = backward ? line.getStart() : line.getEnd()
                //line端点切线角度，line自身的总转角
                let [lHead_D, l_turn] = getAnglesByHead(lHead, line)
                l_turn=-l_turn
                //遍历map的key（点坐标）
                for (let cHead_hc of point_curveMap.keys()) {
                    let cHead = Point.parsePoint(cHead_hc)
                    //找到符合range的坐标，取出map的value（curves），进行下一步
                    if (cHead.x < lHead.x + range && cHead.x > lHead.x - range && cHead.y < lHead.y + range && cHead.y > lHead.y - range) {
                        let validCurve: { curve: Curve, min_turn: number } | null = null
                        let cHead_curves = point_curveMap.get(cHead_hc)
                        if (cHead_curves) {
                            //遍历取出的curves，计算角度数据是否符合条件
                            for (let c of cHead_curves) {
                                if (unhandledMarks[curves.indexOf(c)]) {
                                    //curve端点切线角度，curve自身的总转角
                                    let [cHead_D, c_turn] = getAnglesByHead(cHead, c)
                                    //从 line端点切线角度 转向 curve端点切线角度，求出转角
                                    let lHead_cHead_turn: number = calcTurnAngle(lHead_D, turn180(cHead_D))
                                    //首先排除line和curve总转角之和太大的，以及端点处切线角度差距太大的
                                    if (Math.abs(l_turn + c_turn) < 45 && Math.abs(lHead_cHead_turn) < 20) {
                                        //line端点和curve端点的距离
                                        let lHead_cHead_distance: number = calcDistance(cHead, lHead)
                                        //line和curve端点连线的成角
                                        let lcLink_angle: number = Math.atan2(cHead.y - lHead.y, cHead.x - lHead.x) / Math.PI * 180
                                        //line和端点连线的成角之间的转角
                                        let lHead_lcLink_turn: number = calcTurnAngle(lHead_D, lcLink_angle)
                                        let isValidFlag: boolean = lHead_cHead_distance == 0 || Math.abs(lHead_lcLink_turn)<15
                                        if (isValidFlag) {
                                            if (validCurve) {
                                                validCurve = validCurve.min_turn > lHead_cHead_turn ? { curve: c, min_turn: lHead_cHead_turn } : validCurve
                                            } else {
                                                validCurve = { curve: c, min_turn: lHead_cHead_turn }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                        if (validCurve) {
                            if (backward) {
                                if (validCurve.curve.start.isSamePosition(cHead)) {
                                    line.addCurveToStart(validCurve.curve.reverse())
                                } else if (validCurve.curve.end.isSamePosition(cHead)) {
                                    line.addCurveToStart(validCurve.curve)
                                } else {
                                    throw 'bug occurs in search()'
                                }
                            } else {
                                if (validCurve.curve.start.isSamePosition(cHead)) {
                                    line.addCurveToEnd(validCurve.curve)
                                } else if (validCurve.curve.end.isSamePosition(cHead)) {
                                    line.addCurveToEnd(validCurve.curve.reverse())
                                } else {
                                    throw 'bug occurs in search()'
                                }
                            }
                            unhandledMarks[curves.indexOf(validCurve.curve)] = false
                            //找到的话就递归查找，直到找不到为止
                            search(backward)
                            return
                        }
                    }
                }
                return
            }
            search(true)
            search(false)
        }
    }
    return result
}