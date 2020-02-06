import { Curve } from './class'

export class PathElementFactory {
    strokeRef: { [key: number]: string }
    constructor(strokeRef: { [key: number]: string } = { 0: "black", 1: "green", 2: "red", 3: "blue" }) {
        this.strokeRef = strokeRef
    }
    createPathElement(target: Curve): PathElement {
        return new PathElement(target.toPathString(), this.strokeRef[target.id==0?0:(target.id%3+1)])
    }
}
export class PathElement {
    d: string = ""
    stroke: string = ""
    constructor(d: string, stroke: string) {
        this.d = d
        this.stroke = stroke
    }
}