import { ClosedCurve, Curve, Point, SeparatePart } from "./curve";

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
export function generateCharacterClosedCurve(characterWithClosedCurve:Array<ClosedCurve>):Array<SeparatePart>{
    let l:number=characterWithClosedCurve.length
    let fatherMarkList:number[]=new Array(l)
    for(let i=0;i<l;i++){
        for(let j=i+1;j<l;j++){
            if(characterWithClosedCurve[j].isClosedCurveInside(characterWithClosedCurve[i])){
                if(!(fatherMarkList[i]&&characterWithClosedCurve[j].isClosedCurveInside(characterWithClosedCurve[fatherMarkList[i]]))){
                    fatherMarkList[i]=j
                }
            }
        }
    }
    let generationList:number[]=fatherMarkList.map(
        (value:number,index:number,array:number[]):number=>{
            let generation:number=1
            function getGeneration(v:number){
                if(typeof v == 'undefined'){
                    return
                }else{
                    generation+=1
                    getGeneration(array[v])
                }
            }
            getGeneration(value)
            return generation%2
        }
    )
    let characterWithSeparateParts:Array<SeparatePart>=[]
    for(let i in fatherMarkList){
        if(generationList[i]==1){
            let part:SeparatePart=new SeparatePart();
            part.outsideClosedCurve=characterWithClosedCurve[i]
            for(let j in fatherMarkList){
                if(fatherMarkList[j]==Number(i)){
                    part.insideClosedCurves.push(characterWithClosedCurve[j])
                }
            }
            characterWithSeparateParts.push(part)
        }
    }
    return characterWithSeparateParts
}