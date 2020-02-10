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
    transformMatrix(a: number, b: number, c: number, d: number, e: number, f: number) {
        let x: number = this.x * a + this.y * c + e
        let y: number = this.x * b + this.y * d + f
        this.x = x
        this.y = y
    }
}

export abstract class Curve {
    id: number
    start: Point
    end: Point
    constructor(start: Point, end: Point) {
        this.id = 0
        this.start = start
        this.end = end
    }
    abstract getIntersectPoint(p: Point): Point[]
    abstract getStartDirection(): number
    abstract getEndDirection(): number
    abstract reverse(): Curve
    abstract toString(): string
    abstract toPathString(): string
    abstract toPathStringLinked(lastEnd: Point): string
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
    getIntersectPoint(p: Point): Point[] {
        if (Math.min(this.start.y, this.end.y) <= p.y && p.y <= Math.max(this.start.y, this.end.y)) {
            if (this.a * p.x + this.b * p.y + this.c == 0) {
                if (Math.min(this.start.x, this.end.x) <= p.x && p.x <= Math.max(this.start.x, this.end.x)) {
                    return [p]
                } else {
                    return []
                }
            } else {
                if (this.a == 0 && p.y == this.start.y) {
                    return []
                } else {
                    let x: number = (-this.c - this.b * p.y) / this.a
                    if (x >= p.x) {
                        return []
                    }
                    let y: number
                    if (this.b == 0) {
                        y = p.y
                    } else {
                        y = (this.c - this.a * p.x) / this.b
                    }
                    return [new Point(x, y)]
                }
            }
        } else {
            return []
        }
    }
    getStartDirection(): number {
        return Math.atan2(this.start.y - this.end.y, this.start.x - this.end.x)/Math.PI*180
    }
    getEndDirection(): number {
        return Math.atan2(this.end.y - this.start.y, this.end.x - this.start.x)/Math.PI*180
    }
    reverse(): CurveL {
        return new CurveL(this.end,this.start)
    }
    toPathString(): string {
        return `M${this.start.x} ${this.start.y}L${this.end.x} ${this.end.y}`
    }
    toPathStringLinked(lastEnd: Point): string {
        let s: string = `L${this.end.x} ${this.end.y}`
        if (lastEnd.isSamePosition(this.start)) {
            return s
        } else {
            return `M${this.start.x} ${this.start.y}${s}`
        }
    }
}
export class CurveQ extends Curve {
    //B(t)=(1-t)^2 start + 2t(1-t) control + t^2 end, t in [0,1]
    control: Point
    constructor(start: Point, end: Point, control: Point) {
        super(start, end)
        this.control = control
    }
    toString() {
        return `Q${this.start}${this.control}${this.end}`
    }
    getPointByT(t: number): Point {
        if (0 <= t && t <= 1) {
            let x: number = Math.pow((1 - t), 2) * this.start.x + 2 * t * (1 - t) * this.control.x + Math.pow(t, 2) * this.end.x
            let y: number = Math.pow((1 - t), 2) * this.start.y + 2 * t * (1 - t) * this.control.y + Math.pow(t, 2) * this.end.y
            return new Point(x, y)
        } else {
            throw "not valid t value";
        }
    }
    getIntersectPoint(p: Point): Point[] {
        /* 根据二次贝塞尔曲线公式，得到曲线上的点P(x,y)满足(t in [0,1]):
         * y=(start.y-2*control.y+end.y)*t^2 + 2*(control.y-start.y)*t + start.y
         *             ay                              by
         * x=(start.x-2*control.x+end.x)*t^2 + 2*(control.x-start.x)*t + start.x
         *             ax                              bx
         * mty:根据y的二次方程求得的极值y对应t值
         * mtx:根据x的二次方程求得的极值x对应t值
         * 求y=p.y时，t在[0,1]上有没有解。无解，则没有交点；有解则根据t求出x，x<=p.x时有交点，否则没有交点。
         */
        let ay: number = this.start.y - 2 * this.control.y + this.end.y
        let by: number = 2 * (this.control.y - this.start.y)
        let mty: number = -by / (2 * ay)
        function getIntersectPointMain(self: CurveQ): Point[] {
            let cy: number = self.start.y - p.y
            if (ay == 0) {
                //ay==0时，y的方程式是一次方程，用一次方程解法
                if (by == 0) {
                    //这种情况下，曲线是水平直线条，特殊处理
                    let ax: number = self.start.x - 2 * self.control.x + self.end.x
                    let bx: number = 2 * (self.control.x - self.start.x)
                    let mtx: number = -bx / (2 * ax)
                    if (0 <= mtx && mtx <= 1) {
                        let mx: number = ax * Math.pow(mtx, 2) + bx * mtx + self.start.x
                        if (Math.min(self.start.x, self.end.x, mx) <= p.x && p.x <= Math.max(self.start.x, self.end.x, mx)) {
                            return [p]
                        }
                        return []
                    } else {
                        if (Math.min(self.start.x, self.end.x) <= p.x && p.x <= Math.max(self.start.x, self.end.x)) {
                            return [p]
                        }
                        return []
                    }
                }
                let t: number = -cy / by
                if (0 <= t && t <= 1) {
                    let point: Point = self.getPointByT(t)
                    if (point.x <= p.x) {
                        return [point]
                    } else {
                        return []
                    }
                } else {
                    return []
                }
            } else {
                // ay!=0时，用二次方程解法
                let result: Point[] = []
                let delta: number = Math.pow(by, 2) - 4 * ay * cy
                if (delta >= 0) {
                    let t1: number = (-by + Math.sqrt(delta)) / (2 * ay)
                    if (0 <= t1 && t1 <= 1) {
                        let p1 = self.getPointByT(t1)
                        if (p1.x <= p.x) {
                            result.push(p1)
                        }
                    }
                    let t2: number = (-by - Math.sqrt(delta)) / (2 * ay)
                    if (0 <= t2 && t2 <= 1) {
                        let p2 = self.getPointByT(t2)
                        if (p2.x <= p.x) {
                            result.push(p2)
                        }
                    }
                }
                return result
            }
        }
        // 先判断p.y是不是在曲线范围内，如果不是就返回[]，是的话才用getIntersectPointMain找交点
        if (0 <= mty && mty <= 1) {
            let my: number = ay * Math.pow(mty, 2) + by * mty + this.start.y
            if (Math.min(this.start.y, this.end.y, my) <= p.y && p.y <= Math.max(this.start.y, this.end.y, my)) {
                return getIntersectPointMain(this)
            }
            return []
        } else {
            if (Math.min(this.start.y, this.end.y) <= p.y && p.y <= Math.max(this.start.y, this.end.y)) {
                return getIntersectPointMain(this)
            }
            return []
        }
    }
    getBiggestDistance(): number {
        //t=0.5时，曲线上点p到start和end成的直线距离最远
        if (this.start.x == this.end.x) {
            let x: number = this.start.x / 4 + this.control.x / 2 + this.end.x / 4
            return Math.abs(x - this.start.x)
        } else {
            let k: number = (this.start.y - this.end.y) / (this.start.x - this.end.x)
            let b: number = this.start.y - k * this.start.x
            return Math.abs(k * this.control.x - this.control.y + b) / 2 / Math.sqrt(Math.pow(k, 2) + 1)
        }
    }
    getLength(t: number = 1): number {
        if (t < 0 || t > 1) {
            throw 'not valid t value'
        }
        let ax: number = this.start.x - 2 * this.control.x + this.end.x
        let bx: number = 2 * (this.control.x - this.start.x)
        let ay: number = this.start.y - 2 * this.control.y + this.end.y
        let by: number = 2 * (this.control.y - this.start.y)
        let a: number = 4 * (ax * ax + ay * ay)
        let b: number = 4 * (ax * bx + ay * by)
        let c: number = bx * bx + by * by
        //别人文章中的公式 注：直线也是一种特殊的贝塞尔曲线，此公式不适用于直线，不然会计算出NaN
        return (2 * Math.sqrt(a) * (2 * a * t * Math.sqrt(a * t * t + b * t + c) + b * (Math.sqrt(a * t * t + b * t + c) - Math.sqrt(c))) + (b * b - 4 * a * c) * (Math.log(b + 2 * Math.sqrt(a * c)) - Math.log(b + 2 * a * t + 2 * Math.sqrt(a) * Math.sqrt(a * t * t + b * t + c)))) / (8 * Math.pow(a, 3 / 2))
    }
    reverse(): CurveQ {
        return new CurveQ(this.end,this.start,this.control)
    }
    getStartDirection(): number {
        return Math.atan2(this.start.y - this.control.y, this.start.x - this.control.x)/Math.PI*180
    }
    getEndDirection(): number {
        return Math.atan2(this.end.y - this.control.y, this.end.x - this.control.x)/Math.PI*180
    }
    toPathString(): string {
        return `M${this.start.x} ${this.start.y}Q${this.control.x} ${this.control.y} ${this.end.x} ${this.end.y}`
    }
    toPathStringLinked(p: Point): string {
        let s: string = `Q${this.control.x} ${this.control.y} ${this.end.x} ${this.end.y}`
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
        }
        return pl
    }
    isPointInside(p: Point): boolean {
        let count: number = 0
        for (let c of this.curves) {
            let points: Point[] = c.getIntersectPoint(p)
            if (points.some(point => point.isSamePosition(p))) {
                return true
            } else {
                points.forEach((value: Point, index: number, array: Point[]) => {
                    for (let i: number = 0; i < index; i++) {
                        if (array[i].isSamePosition(value)) {
                            return
                        }
                    }
                    count++
                })
            }
        }
        return count % 2 == 1
    }
    isClosedCurveInside(cc: ClosedCurve): boolean {
        for (let p of cc.getPointList()) {
            if (!(this.isPointInside(p))) {
                return false
            }
        }
        return true
    }
}
export class SeparatePart {
    outsideClosedCurve: ClosedCurve
    insideClosedCurves: Array<ClosedCurve> = []
    constructor(outsideClosedCurve: ClosedCurve) {
        this.outsideClosedCurve = outsideClosedCurve
    }
    hasInside(): boolean {
        return !(typeof (this.insideClosedCurves) == 'undefined' || this.insideClosedCurves.length == 0)
    }
    getCurveList(): Curve[] {
        let curveList: Curve[] = this.outsideClosedCurve.curves
        if (this.hasInside()) {
            for (let closedCurve of this.insideClosedCurves) {
                curveList.concat(closedCurve.curves)
            }
        }
        return curveList
    }
}
export class Line {
    curves: Curve[]
    constructor(curve: Curve) {
        this.curves = new Array()
        this.curves.push(curve)
    }
    getCurves(): Curve[] {
        return this.curves
    }
    addCurveToEnd(curve: Curve): void {
        this.curves.push(curve)
    }
    addCurveToHead(curve: Curve): void {
        let tmp: Curve[] = []
        tmp.push(curve)
        this.curves = tmp.concat(this.curves)
    }
    getEndCurve(): Curve {
        return this.curves[this.curves.length - 1]
    }
    getHeadCurve(): Curve {
        return this.curves[0]
    }
    setId(id: number): void {
        for (let c of this.curves) {
            c.id == id
        }
    }
    getId(): number {
        return this.curves[0].id
    }
}export function pathToCurveList(path: string): Array<Curve> {
    function paramsStrToParamsList(paramsStr: string): Array<number> {
        let paramsList: Array<number> = []
        for (let i of paramsStr.trim().split(/[,\s]+|(?<=\d)(?=-)/)) {
            paramsList.push(Number(i))
        }
        return paramsList
    }
    let headPoint: Point | null = null
    let nowPoint: Point = new Point(0, 0)
    let curveList: Array<Curve> = []
    let first = path.trim().split(/(?<=\d)\s*(?=[A-Za-z])/)
    for (let i of first) {
        let paramsList: number[] = []
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
                if (headPoint != null && end.isSamePosition(headPoint)) {
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
                if (headPoint != null && end.isSamePosition(headPoint)) {
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
                if (headPoint != null && end.isSamePosition(headPoint)) {
                    end = headPoint
                    headPoint = null
                }
                curveList.push(new CurveL(nowPoint, end))
                nowPoint = end
                break
            case 'q':
                end = new Point(paramsList[2], paramsList[3])
                let control: Point = new Point(paramsList[0], paramsList[1])
                if (typeName == 'q') {
                    end.offset(nowPoint.x, nowPoint.y)
                    control.offset(nowPoint.x, nowPoint.y)
                }
                if (headPoint != null && end.isSamePosition(headPoint)) {
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
        path += curve.toPathStringLinked(lastEnd)
        lastEnd = curve.end
    }
    path = path.replace(/ -/g, '-')
    path += 'Z'
    return path
}export function findClosedCurves(curves: Array<Curve>): Array<ClosedCurve> {
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