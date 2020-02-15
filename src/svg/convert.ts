import { Point, Curve, CurveL, CurveQ } from "./class"
//start
export function pathToCurveList(path: string): Array<Curve> {
    let lastPoint: Point = new Point(0, 0)
    let curves: Array<Curve> = []
    let operatorStrs = path.trim().split(/(?<=\d|[Zz])\s*(?=[A-Za-z])/)
    for (let operatorStr of operatorStrs) {
        let params: number[] = []
        let [typeName, paramsStr] = operatorStr.split(/(?<=[A-Za-z])/)
        if (paramsStr) {
            params = paramsStr.trim().split(/[,\s]+|(?<=\d)(?=-)/).map((value) => Number(value))
        }
        if (typeName.toUpperCase() == 'M') {
            [lastPoint.x, lastPoint.y] = params
            if (typeName == 'm') {
                lastPoint.offset(params[0], params[1])
            }
        } else if (typeName.toUpperCase() == 'L') {
            let end = new Point(params[0], params[1])
            if (typeName == 'l') {
                end.offset(lastPoint.x, lastPoint.y)
            }
            curves.push(new CurveL(lastPoint.clone(), end));
            [lastPoint.x, lastPoint.y] = [end.x, end.y]
        } else if(typeName.toUpperCase()== 'Q') {
            let [control,end]=[new Point(params[0],params[1]),new Point(params[2],params[3])]
            if (typeName == 'q') {
                control.offset(lastPoint.x,lastPoint.y)
                end.offset(lastPoint.x,lastPoint.y)
            }
            curves.push(new CurveQ(lastPoint.clone(),end,control));
            [lastPoint.x, lastPoint.y] = [end.x, end.y]
        }
        //H V T S C A Z暂时用不上，省略了
    }
    return curves
}

export function useDupPoint(curves:Curve[]):void {
    let points:Point[]=[]
    function search(point:Point):Point|undefined{
        for(let p of points){
            if(p.isSamePosition(point)){
                return p
            }
        }
        points.push(point)
        return undefined
    }
    for(let c of curves){
        let found=search(c.start)
        if(found){
            c.start=found
        }
        found=search(c.end)
        if(found){
            c.end=found
        }
    }
}