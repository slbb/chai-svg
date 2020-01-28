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
    start: Point
    end: Point
    constructor(start: Point, end: Point) {
        this.start = start
        this.end = end
    }
    abstract getIntersectPoint(p: Point): Point[]
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
                for (let curve of closedCurve.curves) {
                    curveList.push(curve)
                }
            }
        }
        return curveList
    }
}