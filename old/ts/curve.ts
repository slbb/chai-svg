export class Point {
    x: number
    y: number
    constructor(x: number, y: number) {
        this.x = x
        this.y = y
    }
    offset(x: number, y: number) {
        this.x += x
        this.y += y
    }
    isSamePosition(p: Point): boolean {
        return this.x == p.x && this.y == p.y
    }
    toString():string {
        return `(${this.x},${this.y})`
    }
}

export abstract class Curve {
    start: Point
    end: Point
    constructor(start: Point, end: Point) {
        this.start = start
        this.end = end
    }
    abstract isIntersect(p: Point): boolean
    abstract toString():string
}

export class CurveL extends Curve {
    a: number
    b: number
    c: number
    constructor(start: Point, end: Point) {
        super(start, end)
        this.a = start.x - end.x
        this.b = start.y - end.y
        this.c = -this.a * start.x - this.b * start.y
    }
    toString(){
        return `L${this.start}${this.end}`
    }
    isIntersect(p: Point): boolean {
        if (this.a == 0) {
            return p.y == this.start.y
        } else {
            if (Math.min(this.start.y, this.end.y) <= p.y && p.y <= Math.max(this.start.y, this.end.y)) {
                let x: number = (-this.c - this.b * p.y) / this.a
                return x <= p.x
            } else {
                return false
            }
        }
    }
}
export class CurveQ extends Curve{
    control:Point
    constructor(start:Point,end:Point,control:Point){
        super(start,end)
        this.control=control
    }
    toString(){
        return `Q${this.start}${this.control}${this.end}`
    }
    isIntersect(p: Point): boolean {
        let a:number = this.start.y-2*this.control.y+this.end.y
        let b:number = 2*(this.control.y-this.start.y)
        let c:number = this.start.y-p.y
        let delta:number = Math.pow(b,2)-4*a*c
        if(delta>=0){
            let t1:number = (-b+Math.sqrt(delta))/(2*a)
            if(0<=t1&&t1<=1){
                let x1:number=Math.sqrt((this.start.x-2*this.control.x+this.end.x)*t1)+2*(this.control.x-this.start.x)*t1+this.start.x
                if(x1<=p.x){
                    return true
                }
            }
            let t2:number = (-b+Math.sqrt(delta))/(2*a)
            if(0<=t2&&t2<=2){
                let x2:number=Math.sqrt((this.start.x-2*this.control.x+this.end.x)*t2)+2*(this.control.x-this.start.x)*t2+this.start.x
                if(x2<=p.x){
                    return true
                }
            }
            return false
        } else {
            return false
        }
    }
}

export class ClosedCurve {
    curves:Array<Curve>
    constructor(curves:Array<Curve>){
        if(!curves[0].start.isSamePosition(curves[curves.length-1].end)){
            throw "curves are not closed"
        } else {
            this.curves= curves
        }
    }
    getPointList():Array<Point>{
        let pl:Array<Point> = []
        for(let i in this.curves){
            pl.push(this.curves[i].start)
            pl.push(this.curves[i].end)
        }
        return pl
    }
    isPointInside(p:Point):boolean{
        let count=0
        for(let c of this.curves){
            if(c.isIntersect(p)){
                count++
            }
        }
        return count%2==1
    }
    isClosedCurveInside(c:ClosedCurve):boolean{
        for(let p of c.getPointList()){
            if(!this.isPointInside(p)){
                return false
            }
        }
        return true
    }
}
export class SeparatePart{
    outsideClosedCurve:ClosedCurve
    insideClosedCurves:Array<ClosedCurve>=[]
    hasInside():boolean{
        return typeof(this.insideClosedCurves)=='undefined'||this.insideClosedCurves.length==0
    }
}
