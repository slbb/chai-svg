import { ClosedCurve, Curve, Point, SeparatePart, CurveQ } from "./curve";
import { curveListToPath } from './convert';

export function findClosedCurves(curves: Array<Curve>): Array<ClosedCurve> {
    let headPoint: Point|null = null
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
    let fatherMarkList:Array<number|undefined> = new Array(l)
    for(let i=0;i<l;i++){
        fatherMarkList[i]=undefined
    }
    for (let i = 0; i < l; i++) {
        for (let j = i + 1; j < l; j++) {
            if (characterWithClosedCurve[j].isClosedCurveInside(characterWithClosedCurve[i])) {
                let mark=fatherMarkList[i]
                if (!(mark && characterWithClosedCurve[j].isClosedCurveInside(characterWithClosedCurve[mark]))) {
                    fatherMarkList[i] = j
                }
            }
        }
    }
    let generationList: number[] = fatherMarkList.map(
        (value: number|undefined, _index: number|undefined, array: Array<number|undefined>): number => {
            let generation: number = 1
            function getGeneration(v: number|undefined) {
                if (typeof v == 'undefined') {
                    return
                } else {
                    generation += 1
                    getGeneration(array[v])
                }
            }
            getGeneration(value)
            return generation % 2==1?0:1
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
export function displayCharacterWithSeparateParts(c:SeparatePart[]):string[]{
    let paths:string[]=[]
    for(let sp of c){
        paths.push(curveListToPath(sp.getCurveList()))
    }
    return paths
}

export function simplifyCurveQ(sp: SeparatePart): void {
    let curveList: Curve[] = sp.getCurveList()
    for (let i in curveList) {
        if (curveList[i] instanceof CurveQ) {
            let curve: Curve = curveList[i]
            let yD: number = curve.start.y - curve.end.y
            let xD: number = curve.start.x - curve.end.x
        }
    }
}