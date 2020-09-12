import re
path='c:/Users/77777/Documents/Matrix/Coding/git/slbb/chaisvg/src/svg/'
def fileReader(name,writeFile):
    with open(name,mode='r',encoding='utf-8') as f:
        flag=False
        for line in f:
            if not flag:
                if not re.search('^(export|class|abstract|interface|let|var|const|type)',line):
                    continue
                else:
                    flag=True
                    if re.search('^export\s*',line):
                        writeFile.write(re.sub('^export\s*','',line))
                    else:
                        writeFile.write(line)
            else:
                if re.search('^export\s*',line):
                    writeFile.write(re.sub('^export\s*','',line))
                else:
                    writeFile.write(line)

files=[
    path+'run/generator.ts',
    path+'run/linker.ts',
    path+'run/parser.ts',
    path+'struct/ClosedCurve.ts',
    path+'struct/Coordinate.ts',
    path+'struct/Curve.ts',
    path+'struct/CurveL.ts',
    path+'struct/CurveQ.ts',
    path+'struct/Link.ts',
    path+'struct/Point.ts',
    path+'struct/SeparatePart.ts'
    path+'utils/utils.ts'
]
with open(path+'test/debug.ts',mode='w',encoding='utf-8') as debugF:
    for _ in files:
        fileReader(_, debugF)