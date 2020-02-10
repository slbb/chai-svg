import { ClosedCurve, Curve, Point, SeparatePart, CurveQ, CurveL, Line } from "./class";
import { curveListToPath } from './convert';
//start
export function findClosedCurves(curves: Array<Curve>): Array<ClosedCurve> {
    let headPoint: Point | null = null
    let characterWithClosedCurve: Array<ClosedCurve> = []
    let closedCurveList: Array<Curve> = []
    for (let c of curves) {
        if (headPoint == null) {
            headPoint = c.start
            closedCurveList.push(c)
            continue
        }
        if (!c.end.isSamePosition(headPoint)) {
            closedCurveList.push(c)
        } else {
            closedCurveList.push(c)
            characterWithClosedCurve.push(new ClosedCurve(closedCurveList))
            closedCurveList = []
            headPoint = null
        }
    }
    return characterWithClosedCurve
}
export function generateCharacterSeparatePart(characterWithClosedCurve: Array<ClosedCurve>): Array<SeparatePart> {
    let l: number = characterWithClosedCurve.length
    let fatherMarkList: Array<number | undefined> = new Array(l)
    fatherMarkList.fill(undefined)
    function findFather(i: number, j: number) {
        if (characterWithClosedCurve[j].isClosedCurveInside(characterWithClosedCurve[i])) {
            let mark: number | undefined = fatherMarkList[i]
            if (typeof mark == 'undefined') {
                fatherMarkList[i] = j
            } else if (typeof mark == 'number') {
                let iFather: ClosedCurve = characterWithClosedCurve[mark]
                if (!characterWithClosedCurve[j].isClosedCurveInside(iFather)) {
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
    let characterWithSeparateParts: Array<SeparatePart> = []
    for (let i in fatherMarkList) {
        if (!generationList[i]) {
            let part: SeparatePart = new SeparatePart(characterWithClosedCurve[i]);
            for (let j in fatherMarkList) {
                if (fatherMarkList[j] == Number(i)) {
                    part.insideClosedCurves.push(characterWithClosedCurve[j])
                }
            }

            characterWithSeparateParts.push(part)
        }
    }
    return characterWithSeparateParts
}
export function displayCharacterWithSeparateParts(c: SeparatePart[]): string[] {
    let paths: string[] = []
    for (let sp of c) {
        paths.push(curveListToPath(sp.getCurveList()))
    }
    return paths
}
export function displayEachCurveOfSeparateParts(c: SeparatePart[]): Array<string[]> {
    let spPaths: Array<string[]> = []
    for (let sp of c) {
        let paths: string[] = []
        for (let curve of sp.getCurveList()) {
            paths.push(curve.toPathString())
        }
        spPaths.push(paths)
    }
    return spPaths
}
export function findHV(s: SeparatePart): void {
    for (let c of s.getCurveList()) {
        if (c instanceof CurveL) {
            if (c.b == 0) {
                c.id = 1
            } else {
                let k_abs: number = Math.abs(c.a / c.b)
                if (k_abs > 40) {
                    c.id = 1
                } else if (k_abs < 0.025) {
                    c.id = 2
                }
            }
        } else if (c instanceof CurveQ) {
            let b: number = c.start.x - c.end.x
            if (b == 0 && c.getBiggestDistance() < 5) {
                c.id = 1
            } else {
                let k_abs = Math.abs((c.start.y - c.end.y) / b)
                if (k_abs > 20 && c.getBiggestDistance() < 7) {
                    c.id = 1
                } else if (k_abs < 0.2 && c.getBiggestDistance() < 7) {
                    c.id = 2
                }
            }
        }
    }
}

export function findLine(curves:Curve[]): Line[] {
    function calcTurnAngle(startAngle: number, endAngle: number):number {
        return (endAngle - startAngle + 360) % 360
    }
    function calcDistance(p1:Point,p2:Point):number{
        return Math.sqrt(Math.pow(p1.x-p2.x,2)+Math.pow(p1.y-p2.y,2))
    }
    function judgeConsequent(cp: Point, ca: number, lp: Point, la: number): boolean {
        let distance: number = calcDistance(cp,lp)
        let lp_cpAngle: number = Math.atan2(cp.y - lp.y, cp.x - lp.x)
        let l2cTurn: number = calcTurnAngle(la, (ca - 180) % 360)
        let l2lp_cpTurn: number = calcTurnAngle(la, lp_cpAngle)
        return distance < 20 && l2cTurn * l2lp_cpTurn >= 0 && Math.abs(l2lp_cpTurn) <= Math.abs(l2cTurn)
    }
    let result: Line[] = []
    let unhandledMarkList: boolean[] = new Array(curves.length)
    unhandledMarkList.fill(true)
    for (let index in curves) {
        let curve: Curve = curves[index]
        let selfTurn: number = calcTurnAngle(curve.getEndDirection(), (curve.getStartDirection() - 180) % 360)
        if (Math.abs(selfTurn) > 70) {
            result.push(new Line(curve))
            unhandledMarkList[index] = false
        }
    }
    for (let index = 0; index < curves.length; index++) {
        if (unhandledMarkList[index]) {
            let l: Line = new Line(curves[index])
            for (let i = index + 1; i < curves.length; i++) {
                if (unhandledMarkList[i]) {
                    let curve: Curve = curves[i]
                    let lHeadCurve: Curve = l.getHeadCurve()
                    let lEndCurve: Curve = l.getEndCurve()
                    let cStart_lEnd:number = calcDistance(curve.start,lEndCurve.end)
                    let cEnd_lEnd:number = calcDistance(curve.end,lEndCurve.end)
                    let cStart_lStart:number = calcDistance(curve.start,lHeadCurve.start)
                    let cEnd_lStart:number = calcDistance(curve.end,lHeadCurve.start)
                    let minD:number = Math.min(cStart_lEnd,cEnd_lEnd,cStart_lStart,cEnd_lStart)
                    switch(minD){
                        case cStart_lEnd:
                            if(judgeConsequent(curve.start,curve.getStartDirection(),lEndCurve.end,lEndCurve.getEndDirection())){
                                l.addCurveToEnd(curve)
                                unhandledMarkList[i]=false
                            }
                            break
                        case cEnd_lEnd:
                            if(judgeConsequent(curve.end,curve.getEndDirection(),lEndCurve.end,lEndCurve.getEndDirection())){
                                l.addCurveToEnd(curve.reverse())
                                unhandledMarkList[i]=false
                            }
                            break
                        case cStart_lStart:
                            if(judgeConsequent(curve.start,curve.getStartDirection(),lHeadCurve.start,lHeadCurve.getStartDirection())){
                                l.addCurveToHead(curve.reverse())
                                unhandledMarkList[i]=false
                            }
                            break
                        case cEnd_lStart:
                            if(judgeConsequent(curve.end,curve.getEndDirection(),lHeadCurve.start,lHeadCurve.getStartDirection())){
                                l.addCurveToHead(curve)
                                unhandledMarkList[i]=false
                            }
                            break
                    }
                }
            }
            result.push(l)
            unhandledMarkList[index] = false
        }
    }
    for(let i=0;i<result.length;i++){
        result[i].setId(i%3+1)
    }
    return result
}