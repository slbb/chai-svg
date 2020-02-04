import { Curve } from './curve'

export class PathElementFactory{
    strokeRef:{[key:number]:string}
    constructor(strokeRef:{[key:number]:string}={0:"black",1:"green",2:"red"}){
        this.strokeRef=strokeRef
    }
    createPathElement(target:Curve):PathElement{
        return new PathElement(target.toPathString(),this.strokeRef[target.id])
    }
}
export class PathElement{
    d:string=""
    stroke:string=""
    constructor(d:string,stroke:string){
        this.d=d
        this.stroke=stroke
    }
}