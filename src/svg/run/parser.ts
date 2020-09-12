import { Point } from '../struct/Point'
import { Curve } from '../struct/Curve'
import { CurveL } from '../struct/CurveL'
import { CurveQ } from '../struct/CurveQ'
import { ClosedCurve } from '../struct/ClosedCurve'
import { SeparatePart } from '../struct/SeparatePart'

export function parseCurveList(path: string): Curve[] {
  const result: Curve[] = []
  let startPoint: Point = new Point(0, 0)
  let lastPoint: Point = startPoint
  let operatorStrs = path.trim().split(/(?<=\d|[Zz])\s*(?=[A-Za-z])/)
  for (let operatorStr of operatorStrs) {
    let params: number[] = []
    let [typeName, paramsStr] = operatorStr.split(/(?<=[A-Za-z])/)
    if (paramsStr) {
      params = paramsStr
        .trim()
        .split(/[,\s]+|(?<=\d)(?=-)/)
        .map((value) => Number(value))
    }
    if (typeName.toUpperCase() == 'M') {
      if (typeName == 'm') {
        startPoint = new Point(lastPoint.x + params[0], lastPoint.y + params[1])
        lastPoint = startPoint
      } else {
        startPoint = new Point(params[0], params[1])
        lastPoint = startPoint
      }
    } else if (typeName.toUpperCase() == 'L') {
      let endCoordinate = { x: params[0], y: params[1] }
      if (typeName == 'l') {
        endCoordinate.x += lastPoint.x
        endCoordinate.y += lastPoint.y
      }
      let end = Point.equal(startPoint, endCoordinate)
        ? startPoint
        : new Point(endCoordinate.x, endCoordinate.y)
      result.push(new CurveL(lastPoint, end))
      lastPoint = end
    } else if (typeName.toUpperCase() == 'Q') {
      let control = new Point(params[0], params[1])
      let endCoordinate = { x: params[2], y: params[3] }
      if (typeName == 'q') {
        control.offset(lastPoint.x, lastPoint.y)
        endCoordinate.x += lastPoint.x
        endCoordinate.y += lastPoint.y
      }
      let end = Point.equal(startPoint, endCoordinate)
        ? startPoint
        : new Point(endCoordinate.x, endCoordinate.y)
      result.push(new CurveQ(lastPoint, end, control))
      lastPoint = end
    }
    //H V T S C A Z暂时用不上，省略了
  }
  return result
}

export function toClosedCurves(curves: Curve[]): ClosedCurve[] {
  const result: ClosedCurve[] = []
  let start: Point = curves[0].start
  let closedCurveList: Curve[] = []
  for (let i = 0; i < curves.length; i++) {
    let c = curves[i]
    if (!(c.end == start)) {
      closedCurveList.push(c)
    } else {
      closedCurveList.push(c)
      result.push(new ClosedCurve(closedCurveList))
      closedCurveList = []
      if (i + 1 < curves.length) {
        start = curves[i + 1].start
      } else {
        break
      }
    }
  }
  return result
}

export function toSeparatePart(closedCurves: ClosedCurve[]): SeparatePart[] {
  type Node = { data: ClosedCurve; children: Node[] }
  function addTo(newNode: Node, currentNodeChildren: Node[]): void {
    for (let i = 0; i < currentNodeChildren.length; i++) {
      let node = currentNodeChildren[i]
      let cc_new = newNode.data
      let cc_node = node.data
      if (cc_new.isClosedCurveInside(cc_node)) {
        // 新节点能包含旧节点，则替代旧节点位置
        currentNodeChildren.splice(i, 1, newNode)
        // 把旧节点添加到新节点的子节点集合
        newNode.children.push(node)
        // 遍历旧节点剩余的兄弟节点
        for (i++; i < currentNodeChildren.length; ) {
          node = currentNodeChildren[i]
          cc_node = node.data
          if (cc_new.isClosedCurveInside(cc_node)) {
            // 能包含的从原位置移除，并添加到新节点的子节点
            currentNodeChildren.splice(i, 1)
            newNode.children.push(node)
          } else {
            i++
          }
        }
        return
      } else if (cc_node.isClosedCurveInside(cc_new)) {
        // 新节点被旧节点包含，拿出该旧节点的子节点集合，进行下一轮
        addTo(newNode, node.children)
        return
      }
    }
    // 到达这里，即新节点与该层兄弟节点都没有包含关系,即皆为兄弟关系=>新节点添加到此集合末尾
    currentNodeChildren.push(newNode)
    return
  }
  const tree: Node[] = []
  for (let cc of closedCurves) {
    let newNode: Node = { data: cc, children: [] }
    addTo(newNode, tree)
  }
  const result: SeparatePart[] = []
  /**
   * tree看作是第零层的子节点集合（实际上没有第零层）
   * tree里面的节点是第一层，这些节点的子节点是第二层，以此类推
   * 遍历tree，找奇数层的生成SeparatePart
   * 偶数层的children是奇数层，进行递归
   * @param nodes_in_oddLevel 偶数层的子节点集合
   */
  function traversalTreeRecursive(nodes_in_oddLevel: Node[]): void {
    for (let node of nodes_in_oddLevel) {
      let cc = node.data
      let sp = new SeparatePart(cc)
      result.push(sp)
      if (node.children.length > 0) {
        let ccs_of_node_children = node.children.map((node) => node.data)
        sp.insideClosedCurves = ccs_of_node_children
      }
      for (let node_evenLevel of node.children) {
        traversalTreeRecursive(node_evenLevel.children)
      }
    }
    return
  }
  traversalTreeRecursive(tree)
  return result
}
