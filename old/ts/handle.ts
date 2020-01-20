import { ClosedCurve, Curve, Point } from "./curve";

export function findClosedCurves(curves:Array<Curve>):Array<ClosedCurve>{
    let headPoint:Point =null
    let characterWithClosedCurve:Array<ClosedCurve>=[]
    let closedCurveList:Array<Curve>=[]
    for(let c of curves){
        if(headPoint==null){
            headPoint=c.start
            closedCurveList.push(c)
            continue
        }
        if(!c.end.isSamePosition(headPoint)){
            closedCurveList.push(c)
        }else{
            closedCurveList.push(c)
            characterWithClosedCurve.push(new ClosedCurve(closedCurveList))
            closedCurveList=[]
            headPoint=null
        }
    }
    return characterWithClosedCurve
}
export function generateCharacterClosedCurve(characterWithClosedCurve:Array<ClosedCurve>):Array{
    let l:number=characterWithClosedCurve.length
    let fatherMarList:number[]=new Array(l)
    for(let i=0;i<l;i++){
        for(let j=i+1;j<l;j++){
            if(characterWithClosedCurve[j].isClosedCurveInside(characterWithClosedCurve[i])){
                if(!(fatherMarList[i]&&characterWithClosedCurve[j].isClosedCurveInside(characterWithClosedCurve[fatherMarList[i]]))){
                    fatherMarList[i]=j
                }
            }
        }
    }
    for(let i of fatherMarList){
        if()
    }
}