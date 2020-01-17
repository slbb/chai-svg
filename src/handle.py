from typing import *
from curve import *
def isPointInsideClosedCurve(p: Point, closedCurve: List[Curve]) -> bool:
    count = 0
    for c in closedCurve:
        if c.isIntersect(p.y):
            count += 1
    return count % 2 == 1

def divideClosedCurves(curves: Sequence[Curve]) -> List[List[Curve]]:
    headPoint = None
    character = []
    closedCurve = []
    for c in curves:
        if not headPoint:
            headPoint = c.start
            closedCurve.append(c)
            continue
        if not c.end.isSamePosition(headPoint):
            closedCurve.append(c)
        else:
            character.append(closedCurve.append(c))
            closedCurve = []
            headPoint = None
    return character

# TODO: create Tree class


def generateCharaterClosedCurve(character: Sequence[Sequence[Curve]]) -> List:
    # TODO: make character into a closedCurve Tree
