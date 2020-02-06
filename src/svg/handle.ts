import { ClosedCurve, Curve, Point, SeparatePart, CurveQ, CurveL } from "./class";
import { curveListToPath } from './convert';

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

export function findLine(s: SeparatePart): void {
    let curveList = s.getCurveList()
    let unhandledMarkList: boolean[] = new Array(curveList.length)
    unhandledMarkList.fill(true)
    for (let index in curveList) {
        if (unhandledMarkList[index]) {
            // heng

        }
    }
}