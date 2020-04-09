import re
path='d:/Matrix/Coding/git/slbb/Svg/src/svg/'
def fileReader(name,writeFile):
    with open(name,mode='r',encoding='utf-8') as f:
        flag=False
        for line in f:
            if not flag:
                if re.search('^//start',line):
                    flag=True
                else:
                    continue
            else:
                if re.search('^export\s*',line):
                    writeFile.write(re.sub('^export\s*','',line))
                else:
                    writeFile.write(line)

with open(path+'debug.ts',mode='w',encoding='utf-8') as debugF:
    fileReader(path+'class.ts',debugF)
    fileReader(path+'utils.ts',debugF)
    fileReader(path+'convert.ts',debugF)
    fileReader(path+'handle.ts',debugF)