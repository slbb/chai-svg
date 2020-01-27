import re
from typing import *
from curve import *
def pathToCharacterWithCurve(path: str) -> List[Curve]:
    def stringToNum(s: str) -> Num:
        """字符转数字"""
        if '.' in s:
            return float(s)
        else:
            return int(s)

    def paramsStrToParamsList(paramsStr: str) -> List[Num]:
        paramsList = []
        for item in re.split('[,\s]+|(?<=\d)(?=-)', paramsStr.strip()):
            paramsList.append(stringToNum(item))
        return paramsList
    headPoint:Optional[Point] = None
    nowPoint:Point = Point(0, 0)
    characterWithCurve:List[Curve] = []
    first = re.split('(?<=\d)\s*(?=[A-Za-z])', path.strip())
    for item in first:
        typeName, paramsStr = re.split('(?<=[A-Za-z])', item)
        if paramsStr:
            paramsList = paramsStrToParamsList(paramsStr)
        if typeName.lower() == 'm':
            end = Point(paramsList[0], paramsList[1])
            if typeName.islower():
                end.offset(nowPoint.x, nowPoint.y)
            headPoint = end
            nowPoint = end
        elif typeName.lower() == 'l':
            end = Point(paramsList[0], paramsList[1])
            if typeName.islower():
                end.offset(nowPoint.x, nowPoint.y)
            if end.isSamePosition(headPoint):
                end = headPoint
                headPoint = None
            characterWithCurve.append(CurveL(nowPoint, end))
            nowPoint = end
        elif typeName.lower() == 'h':
            end = Point(paramsList[0], nowPoint.y)
            if typeName.islower():
                end.offset(nowPoint.x, 0)
            if end.isSamePosition(headPoint):
                end = headPoint
                headPoint = None
            characterWithCurve.append(CurveL(nowPoint, end))
            nowPoint = end
        elif typeName.lower() == 'v':
            end = Point(nowPoint.x, paramsList[0])
            if typeName.islower():
                end.offset(0, nowPoint.y)
            if end.isSamePosition(headPoint):
                end = headPoint
                headPoint = None
            characterWithCurve.append(CurveL(nowPoint, end))
            nowPoint = end
        elif typeName.lower() == 'q':
            end = Point(paramsList[0], paramsList[1])
            control = Point(paramsList[2], paramsList[3])
            if typeName.islower():
                end.offset(nowPoint.x, nowPoint.y)
                control.offset(nowPoint.x, nowPoint.y)
            if end.isSamePosition(headPoint):
                end = headPoint
                headPoint = None
            characterWithCurve.append(CurveQ(nowPoint, end, control))
            nowPoint = end
        elif typeName.lower() == 't':
            pass
        elif typeName.lower() == 'c':
            pass
        elif typeName.lower() == 's':
            pass
        elif typeName.lower() == 'a':
            pass
        elif typeName.lower() == 'z':
            if headPoint:
                if not headPoint.isSamePosition(nowPoint):
                    characterWithCurve.append(CurveL(nowPoint, headPoint))
                nowPoint = headPoint
            pass
    return characterWithCurve