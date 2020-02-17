export interface PathElement {
    d: string
    stroke?: string
    [key: string]: any
}
export interface StrokeColorRef {
    [key: number]: string
}

export interface SvgObject {
    toPathString():string
    [key:string]:any
}
export class SvgUtil {
    static single2pathElement(obj: SvgObject, stroke: string = "black"): PathElement {
        return { d: obj.toPathString(), stroke: stroke }
    }
    static array2pathElement(arr: SvgObject[], stroke: string = "black"): PathElement {
        let d: string = ''
        for (let obj of arr) {
            d += obj.toPathString()
        }
        return { d: d, stroke: stroke }
    }
    static array2pathElements(arr: SvgObject[], stroke: string = "black"): PathElement[] {
        let result: PathElement[] = []
        for (let item of arr) {
            result.push({ d: item.toPathString(), stroke: stroke })
        }
        return result
    }
    static array2pathElementsColored(
        arr: SvgObject[],
        strokeColorRef: StrokeColorRef = { 0: "yellow", 1: "red", 2: "blue" }
    ): PathElement[] {
        let result: PathElement[] = []
        let length: number = Object.keys(strokeColorRef).length
        for (let i = 0; i < arr.length; i++) {
            result.push({ d: arr[i].toPathString(), stroke: strokeColorRef[i % length] })
        }
        return result
    }
}