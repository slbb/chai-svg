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
    toString(): string {
        return `(${this.x},${this.y})`
    }
    transformMatrix(a:number,b:number,c:number,d:number,e:number,f:number){
        let x:number=this.x*a+this.y*c+e
        let y:number=this.x*b+this.y*d+f
        this.x=x
        this.y=y
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
    abstract toString(): string
    abstract toPathString(lastEnd: Point): string
}

export class CurveL extends Curve {
    a: number
    b: number
    c: number
    constructor(start: Point, end: Point) {
        super(start, end)
        this.a = start.y - end.y
        this.b = end.x - start.x
        this.c = -this.a * start.x - this.b * start.y
    }
    toString() {
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
    toPathString(lastEnd: Point): string {
        let s: string = `L${this.end.x} ${this.end.y}`
        if (lastEnd.isSamePosition(this.start)) {
            return s
        } else {
            return `M${this.start.x} ${this.start.y}${s}`
        }
    }
}
export class CurveQ extends Curve {
    control: Point
    constructor(start: Point, end: Point, control: Point) {
        super(start, end)
        this.control = control
    }
    toString() {
        return `Q${this.start}${this.control}${this.end}`
    }
    isIntersect(p: Point): boolean {
        let a: number = this.start.y - 2 * this.control.y + this.end.y
        let b: number = 2 * (this.control.y - this.start.y)
        let c: number = this.start.y - p.y
        let delta: number = Math.pow(b, 2) - 4 * a * c
        if (delta >= 0) {
            let t1: number = (-b + Math.sqrt(delta)) / (2 * a)
            if (0 <= t1 && t1 <= 1) {
                let x1: number = Math.sqrt((this.start.x - 2 * this.control.x + this.end.x) * t1) + 2 * (this.control.x - this.start.x) * t1 + this.start.x
                if (x1 <= p.x) {
                    return true
                }
            }
            let t2: number = (-b + Math.sqrt(delta)) / (2 * a)
            if (0 <= t2 && t2 <= 2) {
                let x2: number = Math.sqrt((this.start.x - 2 * this.control.x + this.end.x) * t2) + 2 * (this.control.x - this.start.x) * t2 + this.start.x
                if (x2 <= p.x) {
                    return true
                }
            }
            return false
        } else {
            return false
        }
    }
    toPathString(p: Point): string {
        let s: string = `Q${this.end.x} ${this.end.y} ${this.control.x} ${this.control.y}`
        if (p.isSamePosition(this.start)) {
            return s
        } else {
            return `M${this.start.x} ${this.start.y}${s}`
        }
    }
}

export class ClosedCurve {
    curves: Array<Curve>
    constructor(curves: Array<Curve>) {
        if (!curves[0].start.isSamePosition(curves[curves.length - 1].end)) {
            throw "curves are not closed"
        } else {
            this.curves = curves
        }
    }
    getPointList(): Array<Point> {
        let pl: Array<Point> = []
        for (let i in this.curves) {
            pl.push(this.curves[i].start)
            pl.push(this.curves[i].end)
        }
        return pl
    }
    isPointInside(p: Point): boolean {
        let count = 0
        for (let c of this.curves) {
            if (c.isIntersect(p)) {
                count++
            }
        }
        return count % 2 == 1
    }
    isClosedCurveInside(c: ClosedCurve): boolean {
        for (let p of c.getPointList()) {
            if (!this.isPointInside(p)) {
                return false
            }
        }
        return true
    }
}
export class SeparatePart {
    outsideClosedCurve: ClosedCurve
    insideClosedCurves: Array<ClosedCurve> = []
    constructor(outsideClosedCurve:ClosedCurve){
        this.outsideClosedCurve=outsideClosedCurve
    }
    hasInside(): boolean {
        return !(typeof (this.insideClosedCurves) == 'undefined' || this.insideClosedCurves.length == 0)
    }
    getCurveList(): Curve[] {
        let curveList: Curve[] = this.outsideClosedCurve.curves
        if (this.hasInside()) {
            for (let closedCurve of this.insideClosedCurves) {
                for (let curve of closedCurve.curves) {
                    curveList.push(curve)
                }
            }
        }
        return curveList
    }
}


export function pathToCurveList(path: string): Array<Curve> {
    function paramsStrToParamsList(paramsStr: string): Array<number> {
        let paramsList: Array<number> = []
        for (let i of paramsStr.trim().split(/[,\s]+|(?<=\d)(?=-)/)) {
            paramsList.push(Number(i))
        }
        return paramsList
    }
    let headPoint: Point|null = null
    let nowPoint: Point = new Point(0, 0)
    let curveList: Array<Curve> = []
    let first = path.trim().split(/(?<=\d)\s*(?=[A-Za-z])/)
    for (let i of first) {
        let paramsList: number[]=[]
        let split: string[] = i.split(/(?<=[A-Za-z])/)
        let typeName: string = split[0]
        let paramsStr: string = split[1]
        if (paramsStr) {
            paramsList = paramsStrToParamsList(paramsStr)
        }
        let end: Point
        switch (typeName.toLowerCase()) {
            case 'm':
                end = new Point(paramsList[0], paramsList[1])
                if (typeName == 'm') {
                    end.offset(nowPoint.x, nowPoint.y)
                }
                headPoint = end
                nowPoint = end
                break;
            case 'l':
                end = new Point(paramsList[0], paramsList[1])
                if (typeName == 'l') {
                    end.offset(nowPoint.x, nowPoint.y)
                }
                if (headPoint!=null&&end.isSamePosition(headPoint)) {
                    end = headPoint
                    headPoint = null
                }
                curveList.push(new CurveL(nowPoint, end))
                nowPoint = end
                break
            case 'h':
                end = new Point(paramsList[0], paramsList[1])
                if (typeName == 'h') {
                    end.offset(nowPoint.x, 0)
                }
                if (headPoint!=null&&end.isSamePosition(headPoint)) {
                    end = headPoint
                    headPoint = null
                }
                curveList.push(new CurveL(nowPoint, end))
                nowPoint = end
                break
            case 'v':
                end = new Point(nowPoint.x, paramsList[0])
                if (typeName == 'v') {
                    end.offset(0, nowPoint.y)
                }
                if (headPoint!=null&&end.isSamePosition(headPoint)) {
                    end = headPoint
                    headPoint = null
                }
                curveList.push(new CurveL(nowPoint, end))
                nowPoint = end
                break
            case 'q':
                end = new Point(paramsList[0], paramsList[1])
                let control: Point = new Point(paramsList[2], paramsList[3])
                if (typeName == 'q') {
                    end.offset(nowPoint.x, nowPoint.y)
                    control.offset(nowPoint.x, nowPoint.y)
                }
                if (headPoint!=null&&end.isSamePosition(headPoint)) {
                    end = headPoint
                    headPoint = null
                }
                curveList.push(new CurveQ(nowPoint, end, control))
                nowPoint = end
                break
            case 't':
                break
            case 'c':
                break
            case 's':
                break
            case 'a':
                break
            case 'z':
                if (headPoint != null) {
                    if (!headPoint.isSamePosition(nowPoint)) {
                        curveList.push(new CurveL(nowPoint, headPoint))
                    }
                    nowPoint = headPoint
                }
                break
            default:
                throw "not supported svg command found"
        }
    }
    return curveList
}

export function curveListToPath(curveList: Array<Curve>): string {
    let path: string = ''
    let lastEnd: Point = new Point(0, 0)
    for (let curve of curveList) {
        path += curve.toPathString(lastEnd)
        lastEnd = curve.end
    }
    path=path.replace(/ -/g, '-')
    path += 'Z'
    return path
}
const s:string = '<glyph glyph-name="uni4E34" unicode="&#x4E34;" d="M39 55Q39 42 40 24L24 17Q25 46 25 100.50Q25 155 24 174L47 164L39 157L39 55M67-26Q68-1 68 16L68 179Q68 193 67 209L92 198L82 191L82 16Q82-2 83-18L67-26M153 190Q143 170 137 159L204 159L217 172L236 153L135 153Q114 115 92 97L89 99Q124 144 140 209L163 195L153 190M145 142Q170 132 181.50 125Q193 118 193 109Q193 106 191 99.50Q189 93 187 93Q184 93 178 103Q169 118 143 139L145 142M225 75Q225 2 226-15L211-22L211 1L126 1L126-18L111-24Q112-8 112 34.50Q112 77 111 94L126 85L209 85L218 95L234 81L225 75M126 79L126 7L161 7L161 79L126 79M175 79L175 7L211 7L211 79L175 79Z"  horiz-adv-x="256" vert-adv-y="256"  />'
let nameMatch=s.match(/glyph-name="(.*)"\s+unicode/)
let n:string = nameMatch!=null?nameMatch[1]:''
// console.log(n)
let pathMatch=s.match(/d="(.*)"\s+horiz/)
let path:string = pathMatch!=null?pathMatch[1]:''
// console.log(path)
let l:Array<Curve> =pathToCurveList(path)

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
    console.log(characterWithClosedCurve[4].isClosedCurveInside(characterWithClosedCurve[6]))
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
    ;
    
    console.log(generationList);
    
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
let sp=generateCharacterSeparatePart(findClosedCurves(pathToCurveList(path)))
let paths:string[] = displayCharacterWithSeparateParts(sp)

let lasd =new CurveQ(new Point(1,3),new Point(1,1),new Point(0,2))

console.log(lasd.isIntersect(new Point(2,2)));
