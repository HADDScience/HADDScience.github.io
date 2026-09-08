import os,subprocess,functools
NAS="/Users/jeong-uchang/NAS/HADD Science/"
@functools.lru_cache(None)
def _walk(top):
    out={}
    for root,_,files in os.walk(top):
        for f in files: out.setdefault(f,root+"/"+f)
    return out
def resolve(p):
    """NAS 에서 파일이 옮겨졌으면(폴더 이름 변경) 같은 최상위 폴더 안에서 같은 이름을 찾는다."""
    if os.path.exists(p): return p
    top=NAS+p.replace(NAS,"").split("/")[0]
    return _walk(top).get(os.path.basename(p),p)
