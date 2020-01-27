from typing import *
from curve import *


def findClosedCurves(curves: Sequence[Curve]) -> List[ClosedCurve]:
    headPoint = None
    characterWithClosedCurve: List[ClosedCurve] = []
    closedCurveList = []
    for c in curves:
        if not headPoint:
            headPoint = c.start
            closedCurveList.append(c)
            continue
        if not c.end.isSamePosition(headPoint):
            closedCurveList.append(c)
        else:
            characterWithClosedCurve.append(ClosedCurve(closedCurveList.append(c)))
            closedCurveList = []
            headPoint = None
    return characterWithClosedCurve


def generateCharaterClosedCurve(characterWithClosedCurve: Sequence[ClosedCurve]) -> List:
    l=len(characterWithClosedCurve)
    fatherMarkList: Optional[int] = [None]*l
    for i in range(l):
        for j in range(i+1,l):
            if characterWithClosedCurve[j].isClosedCurveInside(characterWithClosedCurve[i]):
                if not (fatherMarkList[i] and characterWithClosedCurve[j].isClosedCurveInside(characterWithClosedCurve[fatherMarkList[i]])):
                    fatherMarkList[i]=j
    for i in fatherMarkList:
        if 